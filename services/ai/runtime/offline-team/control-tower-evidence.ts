import type { PathwayEvidencePacket } from './pathway-evidence-bridge';
import type { DeviceEnrollmentState } from './device-fleet-enrollment';
import type { DeviceWorkerReceipt } from './device-worker-receipt';
import { composeReport, type ReportInput } from './governed-report-composer';

export const CONTROL_TOWER_POLICY = Object.freeze({
  maxPathwayPackets: 100,
  maxDeviceAssessments: 100,
  maxEvidenceRefs: 8,
});

export const CONTROL_TOWER_GUARDRAILS = Object.freeze({
  activatesCandidates: false,
  grantsApproval: false,
  startsWorkers: false,
  promotesLearning: false,
  remoteCallsAllowed: false,
  countsLogicalTargetsAsLiveAgents: false,
  humanDecision: 'REQUIRED' as const,
});

export interface DeviceAssessmentLike {
  tenantId: string; userId: string; deviceId: string;
  state: DeviceEnrollmentState;
  localWorkerStarted: false;
  productionAuthorityGranted: false;
  humanDecision: 'REQUIRED';
}

export interface ControlTowerEvidencePacket {
  kind: 'CONTROL_TOWER_EVIDENCE';
  tenantId: string;
  generatedAtMs: number;
  pathway: Readonly<{
    packetsConsidered: number;
    uniqueStories: number;
    eligibleNow: number;
    blocked: number;
    topBlockReasons: readonly { reason: string; count: number }[];
    humanActionsRequired: readonly string[];
  }>;
  devices: Readonly<{
    assessmentsConsidered: number;
    byState: Readonly<Record<DeviceEnrollmentState, number>>;
    /** Distinct devices with an unexpired 12D-108 worker-observation receipt. */
    observedLocalWorkers: number;
    workersStartedByThisSurface: 0;
  }>;
  evidenceRefs: readonly string[];
  guardrails: Readonly<typeof CONTROL_TOWER_GUARDRAILS>;
}

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const ref = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 256;

const DEVICE_STATES: readonly DeviceEnrollmentState[] = [
  'ENROLLED_NOT_ACTIVE', 'ELIGIBLE_FOR_LOCAL_TASKS', 'PAUSED', 'REVOKED', 'EXPIRED', 'UNVERIFIED_COMPATIBILITY',
];

/**
 * Aggregates already-evidenced packets into a single read-only control-tower surface for the
 * CEO. It computes nothing new about the world: every pathway packet was already bound to a
 * reviewed DONE story and every device assessment was already a pure assessment. This module
 * cannot activate a candidate, cannot approve one, cannot start a worker, and never reports a
 * logical target (matrix rows, candidates, enrollments) as a live agent or verified device.
 */
export function buildControlTowerEvidence(input: {
  tenantId: string;
  generatedAtMs: number;
  pathwayPackets: readonly PathwayEvidencePacket[];
  deviceAssessments: readonly DeviceAssessmentLike[];
  workerReceipts?: readonly DeviceWorkerReceipt[];
}): ControlTowerEvidencePacket {
  if (!input || !id(input.tenantId)) throw new Error('tenant identity required');
  if (!Number.isSafeInteger(input.generatedAtMs) || input.generatedAtMs < 0) throw new Error('generation time required');
  const packets = input.pathwayPackets ?? [];
  const assessments = input.deviceAssessments ?? [];
  const receipts = input.workerReceipts ?? [];
  if (packets.length > CONTROL_TOWER_POLICY.maxPathwayPackets) throw new Error('too many pathway packets for one surface');
  if (assessments.length > CONTROL_TOWER_POLICY.maxDeviceAssessments) throw new Error('too many device assessments for one surface');
  if (receipts.length > CONTROL_TOWER_POLICY.maxDeviceAssessments) throw new Error('too many worker receipts for one surface');

  const seenStories = new Set<string>();
  const reasons = new Map<string, number>();
  let eligibleNow = 0, blocked = 0;
  for (const p of packets) {
    if (!p || p.kind !== 'QUEUE_OUTCOME_TO_PATHWAY_CANDIDATE') throw new Error('unexpected packet kind on control-tower surface');
    if (p.tenantId !== input.tenantId) throw new Error('cross-tenant packet on control-tower surface');
    if (p.activationAttempted !== false || p.learningPromoted !== false || p.humanDecision !== 'REQUIRED') {
      throw new Error('packet violates control-tower guardrails');
    }
    const key = `${p.tenantId}:${p.storyId}:${p.candidate.pathwayId}`;
    if (seenStories.has(key)) throw new Error('duplicate packet on control-tower surface');
    seenStories.add(key);
    if (p.currentEligibility.eligible) eligibleNow += 1;
    else {
      blocked += 1;
      for (const r of p.currentEligibility.reasons) {
        const norm = r.trim().toLowerCase();
        if (ref(norm)) reasons.set(norm, (reasons.get(norm) ?? 0) + 1);
      }
    }
  }
  const topBlockReasons = [...reasons.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([reason, count]) => Object.freeze({ reason, count }));

  const byState: Record<DeviceEnrollmentState, number> = {
    ENROLLED_NOT_ACTIVE: 0, ELIGIBLE_FOR_LOCAL_TASKS: 0, PAUSED: 0, REVOKED: 0, EXPIRED: 0, UNVERIFIED_COMPATIBILITY: 0,
  };
  let devices = 0;
  for (const d of assessments) {
    if (!d || !id(d.tenantId) || !id(d.userId) || !id(d.deviceId)) throw new Error('device assessment identity required');
    if (d.tenantId !== input.tenantId) throw new Error('cross-tenant device assessment');
    if (d.localWorkerStarted !== false || d.productionAuthorityGranted !== false || d.humanDecision !== 'REQUIRED') {
      throw new Error('device assessment violates control-tower guardrails');
    }
    if (!(d.state in byState)) throw new Error('unknown device enrollment state');
    byState[d.state] += 1;
    devices += 1;
  }

  const humanActions = new Set<string>();
  if (eligibleNow > 0) humanActions.add('decide whether any eligible pathway candidate deserves human approval');
  if (blocked > 0) humanActions.add('review blocked candidates and assign next evidence work');
  if (devices > 0) humanActions.add('confirm device fleet consent posture');
  if (humanActions.size === 0) humanActions.add('no control-tower decision is pending; evidence surface is empty by design');

  const evidenceRefs = [
    ...packets.slice(0, 4).map(p => `queue-story:${p.tenantId}:${p.storyId}`),
    ...assessments.slice(0, 2).map(d => `device-assessment:${d.tenantId}:${d.deviceId}`),
  ].slice(0, CONTROL_TOWER_POLICY.maxEvidenceRefs);

  // Observed local workers: only unexpired 12D-108 receipts bound to this tenant count,
  // deduplicated by device. An expired receipt degrades back to the ladder, never to this count.
  const observedDeviceIds = new Set<string>();
  for (const r of receipts) {
    if (!r || r.kind !== 'DEVICE_WORKER_OBSERVATION_RECEIPT') throw new Error('unexpected receipt kind on control-tower surface');
    if (r.tenantId !== input.tenantId) throw new Error('cross-tenant worker receipt');
    if (r.humanDecision !== 'REQUIRED' || r.learningPromoted !== false) throw new Error('receipt violates control-tower guardrails');
    if (input.generatedAtMs < r.expiresAtMs) observedDeviceIds.add(r.deviceId);
  }

  return Object.freeze({
    kind: 'CONTROL_TOWER_EVIDENCE' as const,
    tenantId: input.tenantId,
    generatedAtMs: input.generatedAtMs,
    pathway: Object.freeze({
      packetsConsidered: packets.length,
      uniqueStories: seenStories.size,
      eligibleNow,
      blocked,
      topBlockReasons: Object.freeze(topBlockReasons),
      humanActionsRequired: Object.freeze([...humanActions]),
    }),
    devices: Object.freeze({
      assessmentsConsidered: devices,
      byState: Object.freeze(byState),
      observedLocalWorkers: observedDeviceIds.size,
      workersStartedByThisSurface: 0 as const,
    }),
    evidenceRefs: Object.freeze(evidenceRefs),
    guardrails: CONTROL_TOWER_GUARDRAILS,
  });
}

/** Deterministic sentence templates — every rendered sentence must pass the CLEAN grammar gate. */
export function renderControlTowerReport(
  packet: ControlTowerEvidencePacket,
  options: { mode: 'DRAFT' | 'CLEAN' },
): ReturnType<typeof composeReport> {
  if (!packet || packet.kind !== 'CONTROL_TOWER_EVIDENCE') throw new Error('control-tower evidence packet required');
  const p = packet.pathway, d = packet.devices;
  const input: ReportInput = {
    title: `Control tower evidence for tenant ${packet.tenantId}`,
    tenantId: packet.tenantId,
    preparedBy: 'control-tower-evidence',
    mode: options.mode,
    sections: [
      {
        heading: 'Pathway candidates',
        body: `Considered ${p.packetsConsidered} pathway packet(s) from ${p.uniqueStories} reviewed story or stories. `
          + `Candidates currently eligible by policy: ${p.eligibleNow}. Candidates blocked: ${p.blocked}. `
          + 'An eligible candidate still requires explicit human approval before the pathway engine can consider activation.',
        evidenceRefs: packet.evidenceRefs,
      },
      {
        heading: 'Device fleet',
        body: `Considered ${d.assessmentsConsidered} device assessment(s). `
          + `Devices eligible for local tasks: ${d.byState.ELIGIBLE_FOR_LOCAL_TASKS}. Devices unverified for compatibility: ${d.byState.UNVERIFIED_COMPATIBILITY}. `
          + 'Targeted, enrolled, verified, and observed devices are distinct states; this report never counts a logical target as a live worker.',
      },
      {
        heading: 'Human decisions required',
        body: `${p.humanActionsRequired.map(a => `${capitalize(a)}.`).join(' ')} `
          + 'No action on this surface activates anything by itself.',
      },
    ],
  };
  return composeReport(input);
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);