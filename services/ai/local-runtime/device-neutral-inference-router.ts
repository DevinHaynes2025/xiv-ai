/**
 * 62L-EM7 — Device-Neutral Inference Router
 *
 * Core flow:
 * Agent Request → Policy → Data Classification → Model Compatibility →
 * Compute Registry → Resource Governor → Route Scoring → Execute →
 * Return Receipt → XIV Home Base
 *
 * Suggested priority (privacy & correctness before speed):
 * LOCAL VERIFIED NPU/GPU → LOCAL VERIFIED CPU → AUTHORIZED EDGE → AUTHORIZED CLOUD
 *
 * Soft-wires: EM3 registry, EM5 AMD, EM6 NVIDIA, EL9 governor, EM1 home base, EM4 fallback visibility.
 * EM8 owns compute return-receipt acceptance into Home Base — not implemented here.
 */

import {
  EM7_CORE_FLOW,
  EM7_LOCKS,
  EM7_PRIORITY_BANDS,
  NEXT_PHASE_EM8,
  assertEm7LocksIntact,
} from './em7-honesty';
import { probeEm7SoftWires } from './em7-soft-wire';
import { EL9_LOCKS, evaluateResourceRequest } from './resource-governor';
import type {
  Em7FallbackPlan,
  Em7InferenceRequest,
  Em7PriorityBand,
  Em7PrivacyRequirement,
  Em7PrivacyState,
  Em7RouteCandidate,
  Em7RoutingDecision,
  Em7SafeguardDenialCode,
  Em7ScoredRoute,
} from './device-neutral-inference-router-types';

export * from './device-neutral-inference-router-types';
export {
  EM7_HONESTY_BANNER,
  EM7_SOT_TITLE,
  EM7_CORE_FLOW,
  EM7_LOCKS,
  EM7_PRIORITY_BANDS,
  EM7_NOT_TESTED_CLAIMS,
  EM7_DB_CANDIDATES_STATUS,
  NEXT_PHASE_EM8,
  assertEm7LocksIntact,
} from './em7-honesty';
export { probeEm7SoftWires } from './em7-soft-wire';

/** Scoring weights — privacy/locality & verification outweigh raw speed. */
export const EM7_SCORE_WEIGHTS = Object.freeze({
  privacyLocality: 25,
  modelCompatibility: 15,
  hardwareVerification: 20,
  latencyEvidence: 8,
  availableMemory: 8,
  queueLoad: 6,
  reliability: 6,
  cost: 4,
  energy: 3,
  network: 3,
  tenantUniversePolicy: 2,
});

const STALE_HEARTBEATS = new Set([
  'STALE',
  'WAITING_NODE',
  'OFFLINE_STOPPED',
  'UNKNOWN',
]);

const BLOCKED_WHEN_VERIFIED_REQUIRED = new Set([
  'NOT_TESTED',
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'AVAILABLE',
  'CONFIGURED',
  'UNAVAILABLE',
  'DEGRADED',
  'WAITING_NODE',
  'DENIED',
]);

function placementSatisfiesPrivacy(
  privacy: Em7PrivacyRequirement,
  placement: Em7RouteCandidate['placement'],
): boolean {
  switch (privacy) {
    case 'local_only':
    case 'cloud_forbidden':
      return placement === 'local';
    case 'tenant_private':
      return placement === 'local' || placement === 'edge';
    case 'hybrid_authorized':
      return placement === 'local' || placement === 'edge' || placement === 'cloud';
    case 'cloud_allowed_explicit':
      return true;
    default:
      return placement === 'local';
  }
}

function privacyStateFor(
  privacy: Em7PrivacyRequirement,
  placement: Em7RouteCandidate['placement'] | null,
): Em7PrivacyState {
  if (!placement) return 'DENIED_PRIVACY';
  if (privacy === 'local_only' || privacy === 'cloud_forbidden') {
    return placement === 'local' ? 'LOCAL' : 'DENIED_PRIVACY';
  }
  if (privacy === 'tenant_private') {
    return placement === 'cloud' ? 'DENIED_PRIVACY' : 'TENANT_PRIVATE';
  }
  if (privacy === 'hybrid_authorized') {
    return placement === 'cloud' ? 'HYBRID_AUTHORIZED' : 'LOCAL';
  }
  if (privacy === 'cloud_allowed_explicit' && placement === 'cloud') {
    return 'CLOUD_AUTHORIZED';
  }
  return placement === 'local' ? 'LOCAL' : 'UNCHANGED';
}

/**
 * Assign priority band for eligible candidates only.
 * Privacy & correctness before speed.
 */
export function assignPriorityBand(
  candidate: Em7RouteCandidate,
): Em7PriorityBand | null {
  const verified = candidate.verificationState === 'VERIFIED';
  const fresh = candidate.heartbeatState === 'RUNNING_VERIFIED';

  if (candidate.placement === 'local' && verified && fresh) {
    if (candidate.device === 'NPU' || candidate.device === 'GPU') {
      return 'LOCAL_VERIFIED_NPU_GPU';
    }
    if (candidate.device === 'CPU') {
      return 'LOCAL_VERIFIED_CPU';
    }
  }

  if (candidate.placement === 'edge' && candidate.cloudExplicitlyAuthorized !== true) {
    // Edge authorization is implicit via allowEdge + eligibility; band after local CPU.
    if (verified && fresh) return 'AUTHORIZED_EDGE';
  }

  if (candidate.placement === 'cloud' && candidate.cloudExplicitlyAuthorized) {
    if (verified && fresh) return 'AUTHORIZED_CLOUD';
  }

  // Edge without full VERIFIED still may be eligible for non-verified requests —
  // band only assigned when verified+fresh above. Unbanded eligible routes score last.
  if (candidate.placement === 'edge' && fresh) return 'AUTHORIZED_EDGE';
  if (candidate.placement === 'cloud' && candidate.cloudExplicitlyAuthorized && fresh) {
    return 'AUTHORIZED_CLOUD';
  }

  return null;
}

function bandRank(band: Em7PriorityBand | null): number {
  if (!band) return EM7_PRIORITY_BANDS.length + 1;
  return EM7_PRIORITY_BANDS.indexOf(band);
}

/**
 * Safeguard eligibility — deny before scoring.
 */
export function evaluateRouteEligibility(
  request: Em7InferenceRequest,
  candidate: Em7RouteCandidate,
): { eligible: boolean; denialCodes: Em7SafeguardDenialCode[] } {
  const denialCodes: Em7SafeguardDenialCode[] = [];

  if (EM7_LOCKS.L4_AUTONOMY_ENABLED !== false) {
    denialCodes.push('L4_AUTONOMY_DISABLED');
  }

  if (request.policyAllowed === false) {
    denialCodes.push('POLICY_DENIED');
  }

  // Data classification: sovereign/restricted cannot leave local without explicit hybrid/cloud auth.
  if (
    (request.dataClass === 'sovereign' || request.dataClass === 'restricted') &&
    candidate.placement === 'cloud' &&
    request.privacyRequirement !== 'cloud_allowed_explicit' &&
    request.privacyRequirement !== 'hybrid_authorized'
  ) {
    denialCodes.push('DATA_CLASSIFICATION_DENIED');
  }

  if (
    candidate.modelIdsCompatible.length > 0 &&
    !candidate.modelIdsCompatible.includes(request.modelId) &&
    !candidate.modelIdsCompatible.includes('*')
  ) {
    denialCodes.push('MODEL_INCOMPATIBLE');
  }

  if (candidate.tenantId !== request.tenantId) {
    denialCodes.push('CROSS_TENANT_DENIED');
  }

  if (candidate.universeScope !== request.universeScope) {
    denialCodes.push('CROSS_UNIVERSE_DENIED');
  }

  if (request.requireVerifiedExecution) {
    if (
      candidate.verificationState === 'NOT_TESTED' ||
      BLOCKED_WHEN_VERIFIED_REQUIRED.has(candidate.verificationState)
    ) {
      if (candidate.verificationState === 'NOT_TESTED') {
        denialCodes.push('NOT_TESTED_WHEN_VERIFIED_REQUIRED');
      } else if (
        candidate.verificationState === 'UNAVAILABLE' ||
        candidate.verificationState === 'DEGRADED'
      ) {
        denialCodes.push('UNAVAILABLE_WHEN_VERIFIED_REQUIRED');
      } else if (candidate.verificationState !== 'VERIFIED') {
        denialCodes.push('NOT_TESTED_WHEN_VERIFIED_REQUIRED');
      }
    }
    if (STALE_HEARTBEATS.has(candidate.heartbeatState)) {
      denialCodes.push('STALE_OR_WAITING_HEARTBEAT');
    }
  } else {
    // Even without verified requirement, UNAVAILABLE / stale waiting nodes stay out.
    if (
      candidate.verificationState === 'UNAVAILABLE' ||
      candidate.verificationState === 'DENIED'
    ) {
      denialCodes.push('UNAVAILABLE_WHEN_VERIFIED_REQUIRED');
    }
    if (
      candidate.heartbeatState === 'STALE' ||
      candidate.heartbeatState === 'OFFLINE_STOPPED'
    ) {
      denialCodes.push('STALE_OR_WAITING_HEARTBEAT');
    }
  }

  if (candidate.placement === 'cloud') {
    if (request.allowCloud !== true) {
      denialCodes.push('CLOUD_WITHOUT_AUTHORIZATION');
    }
    if (!candidate.cloudExplicitlyAuthorized) {
      denialCodes.push('CLOUD_WITHOUT_AUTHORIZATION');
    }
    if (
      candidate.capacityPurchaseAttempted ||
      request.attemptAutoCapacityPurchase === true
    ) {
      denialCodes.push('CLOUD_AUTO_PURCHASE_DENIED');
    }
  }

  if (candidate.placement === 'edge' && request.allowEdge === false) {
    denialCodes.push('POLICY_DENIED');
  }

  // Privacy: never silently downgrade.
  if (request.attemptSilentPrivacyDowngrade === true) {
    denialCodes.push('PRIVACY_DOWNGRADE_DENIED');
  }
  if (!placementSatisfiesPrivacy(request.privacyRequirement, candidate.placement)) {
    denialCodes.push('PRIVACY_DOWNGRADE_DENIED');
  }

  if (request.consequential === true && request.humanApproved !== true) {
    denialCodes.push('CONSEQUENTIAL_APPROVAL_REQUIRED');
  }

  if (request.governorAllowed === false) {
    denialCodes.push('GOVERNOR_DENIED');
  }

  if (candidate.placement !== 'local' && candidate.networkAvailable === false) {
    denialCodes.push('NETWORK_UNAVAILABLE');
  }

  if (
    request.acceleratorFailed === true &&
    (candidate.device === 'GPU' || candidate.device === 'NPU') &&
    request.allowFallback !== false
  ) {
    // Failed accelerator path is not re-selected; force CPU/edge fallback eligibility path.
    denialCodes.push('FALLBACK_NOT_PERMITTED');
  }

  // Soft-wire EL9 legacy ceiling check when estimates provided.
  if (
    typeof request.estimatedRamBytes === 'number' &&
    request.estimatedRamBytes > candidate.availableRamBytes
  ) {
    const gov = evaluateResourceRequest(
      { concurrentTasks: 1, estimatedMemoryBytes: request.estimatedRamBytes },
      {
        maxConcurrentTasks: Math.max(1, candidate.queueCapacity),
        maxMemoryBytes: candidate.availableRamBytes,
      },
    );
    if (!gov.allowed) {
      denialCodes.push('GOVERNOR_DENIED');
    }
  }

  // Defense-in-depth: EL9 auto-cloud lock remains intact.
  if (
    candidate.placement === 'cloud' &&
    EL9_LOCKS.AUTOMATIC_CLOUD_SPILLOVER_FORBIDDEN !== true
  ) {
    denialCodes.push('CLOUD_WITHOUT_AUTHORIZATION');
  }

  return { eligible: denialCodes.length === 0, denialCodes };
}

/**
 * Score an eligible route. Higher is better.
 * Ineligible candidates receive score 0 and are not ranked.
 */
export function scoreEligibleRoute(
  request: Em7InferenceRequest,
  candidate: Em7RouteCandidate,
): Em7ScoredRoute {
  const { eligible, denialCodes } = evaluateRouteEligibility(request, candidate);
  if (!eligible) {
    return {
      candidate,
      eligible: false,
      denialCodes,
      priorityBand: null,
      score: 0,
      scoreBreakdown: {},
    };
  }

  const w = EM7_SCORE_WEIGHTS;
  const breakdown: Record<string, number> = {};

  // Privacy/locality — local matching requirement scores highest.
  const privacyMatch = placementSatisfiesPrivacy(
    request.privacyRequirement,
    candidate.placement,
  );
  const localityBoost =
    candidate.placement === 'local' ? 1 : candidate.placement === 'edge' ? 0.55 : 0.25;
  breakdown.privacyLocality = privacyMatch ? w.privacyLocality * localityBoost : 0;

  breakdown.modelCompatibility =
    candidate.modelIdsCompatible.includes(request.modelId) ||
    candidate.modelIdsCompatible.includes('*')
      ? w.modelCompatibility
      : w.modelCompatibility * 0.4;

  const verificationFactor =
    candidate.verificationState === 'VERIFIED'
      ? 1
      : candidate.verificationState === 'SUPPORTED'
        ? 0.35
        : candidate.verificationState === 'DETECTED'
          ? 0.15
          : 0.05;
  breakdown.hardwareVerification = w.hardwareVerification * verificationFactor;

  if (typeof candidate.measuredLatencyMs === 'number' && candidate.measuredLatencyMs >= 0) {
    // Lower latency → higher score; normalize against 500ms reference.
    const latFactor = Math.max(0, 1 - candidate.measuredLatencyMs / 500);
    breakdown.latencyEvidence = w.latencyEvidence * latFactor;
  } else {
    breakdown.latencyEvidence = 0;
  }

  const needRam = request.estimatedRamBytes ?? 0;
  const needVram = request.estimatedVramBytes ?? 0;
  const ramHeadroom =
    candidate.availableRamBytes <= 0
      ? 0
      : Math.min(1, candidate.availableRamBytes / Math.max(needRam || candidate.availableRamBytes, 1));
  const vramHeadroom =
    needVram <= 0
      ? 1
      : candidate.availableVramBytes <= 0
        ? 0.2
        : Math.min(1, candidate.availableVramBytes / needVram);
  breakdown.availableMemory = w.availableMemory * ((ramHeadroom + vramHeadroom) / 2);

  const load =
    candidate.queueCapacity <= 0
      ? 1
      : Math.min(1, candidate.queueDepth / candidate.queueCapacity);
  breakdown.queueLoad = w.queueLoad * (1 - load);

  breakdown.reliability =
    w.reliability * Math.max(0, Math.min(1, candidate.reliabilityScore));

  if (typeof candidate.measuredCostUsd === 'number') {
    const costFactor = Math.max(0, 1 - Math.min(1, candidate.measuredCostUsd / 10));
    breakdown.cost = w.cost * costFactor;
  } else {
    breakdown.cost = candidate.placement === 'local' ? w.cost * 0.8 : w.cost * 0.3;
  }

  if (typeof candidate.energyProxy === 'number') {
    const energyFactor = Math.max(0, 1 - Math.min(1, candidate.energyProxy / 100));
    breakdown.energy = w.energy * energyFactor;
  } else {
    breakdown.energy = w.energy * 0.5;
  }

  breakdown.network =
    candidate.placement === 'local' || candidate.networkAvailable
      ? w.network
      : 0;

  breakdown.tenantUniversePolicy =
    candidate.tenantId === request.tenantId &&
    candidate.universeScope === request.universeScope
      ? w.tenantUniversePolicy
      : 0;

  // Preferred devices are soft hints only — small bonus, never exclusive.
  if (request.preferredDevices?.includes(candidate.device)) {
    breakdown.preferenceHint = 1.5;
  } else {
    breakdown.preferenceHint = 0;
  }

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const priorityBand = assignPriorityBand(candidate);

  return {
    candidate,
    eligible: true,
    denialCodes: [],
    priorityBand,
    score,
    scoreBreakdown: breakdown,
  };
}

function buildFallbackPlan(
  request: Em7InferenceRequest,
  selected: Em7ScoredRoute | null,
  eligible: Em7ScoredRoute[],
): Em7FallbackPlan {
  const cpuFallback = eligible.find(
    (r) =>
      r.candidate.device === 'CPU' &&
      r.candidate.placement === 'local' &&
      r.candidate.nodeId !== selected?.candidate.nodeId,
  );

  if (request.acceleratorFailed === true || selected?.candidate.device === 'GPU' || selected?.candidate.device === 'NPU') {
    return {
      enabled: request.allowFallback !== false && Boolean(cpuFallback || selected?.candidate.device === 'CPU'),
      visibleInReceipt: true,
      device: cpuFallback?.candidate.device ?? (selected?.candidate.device === 'CPU' ? 'CPU' : 'CPU'),
      runtimeProvider: cpuFallback?.candidate.runtimeProvider ?? 'cpu-local',
      reason: request.acceleratorFailed
        ? 'Accelerator failure — CPU fallback visible in receipt (EM4 soft-wire); does not verify failed accelerator.'
        : 'CPU fallback plan recorded for accelerator routes; silent fallback forbidden.',
      doesNotVerifyFailedAccelerator: true,
    };
  }

  return {
    enabled: false,
    visibleInReceipt: true,
    device: null,
    runtimeProvider: null,
    reason: 'No accelerator fallback required for this selection.',
    doesNotVerifyFailedAccelerator: true,
  };
}

function selectionReason(band: Em7PriorityBand | null): Em7RoutingDecision['reasonCodes'][number] {
  switch (band) {
    case 'LOCAL_VERIFIED_NPU_GPU':
      return 'SELECTED_LOCAL_VERIFIED_NPU_GPU';
    case 'LOCAL_VERIFIED_CPU':
      return 'SELECTED_LOCAL_VERIFIED_CPU';
    case 'AUTHORIZED_EDGE':
      return 'SELECTED_AUTHORIZED_EDGE';
    case 'AUTHORIZED_CLOUD':
      return 'SELECTED_AUTHORIZED_CLOUD';
    default:
      return 'SCORE_WINNER';
  }
}

/**
 * Route an inference request across device-neutral candidates.
 * Safeguards gate eligibility; scoring ranks eligible only; priority bands apply first.
 */
export function routeInferenceRequest(
  request: Em7InferenceRequest,
  candidates: readonly Em7RouteCandidate[],
): Em7RoutingDecision {
  assertEm7LocksIntact();
  // Soft-wire probe consulted for honesty (presence does not alter selection math).
  probeEm7SoftWires();

  const scored = candidates.map((c) => scoreEligibleRoute(request, c));
  const deniedCandidates = scored
    .filter((s) => !s.eligible)
    .map((s) => ({
      nodeId: s.candidate.nodeId,
      device: s.candidate.device,
      denialCodes: s.denialCodes,
    }));

  // Global request-level denies short-circuit selection.
  if (request.attemptSilentPrivacyDowngrade === true) {
    return denyDecision(request, scored, deniedCandidates, [
      'PRIVACY_DOWNGRADE_DENIED',
    ]);
  }
  if (request.attemptAutoCapacityPurchase === true) {
    return denyDecision(request, scored, deniedCandidates, [
      'CLOUD_AUTO_PURCHASE_DENIED',
    ]);
  }
  if (request.consequential === true && request.humanApproved !== true) {
    return denyDecision(request, scored, deniedCandidates, [
      'CONSEQUENTIAL_APPROVAL_REQUIRED',
    ]);
  }
  if (request.policyAllowed === false) {
    return denyDecision(request, scored, deniedCandidates, ['POLICY_DENIED']);
  }

  const eligible = scored.filter((s) => s.eligible);
  if (eligible.length === 0) {
    return denyDecision(request, scored, deniedCandidates, ['NO_ELIGIBLE_ROUTE']);
  }

  // Priority band first (privacy & correctness before speed), then score.
  eligible.sort((a, b) => {
    const br = bandRank(a.priorityBand) - bandRank(b.priorityBand);
    if (br !== 0) return br;
    return b.score - a.score;
  });

  const winner = eligible[0];
  const fallbackPlan = buildFallbackPlan(request, winner, eligible);

  // If accelerator failed, select CPU fallback visibly.
  let selected = winner;
  if (request.acceleratorFailed === true) {
    const cpu = eligible.find(
      (r) => r.candidate.device === 'CPU' && r.candidate.placement === 'local',
    );
    if (cpu) {
      selected = cpu;
    } else {
      return denyDecision(request, scored, deniedCandidates, [
        'FALLBACK_NOT_PERMITTED',
        'NO_ELIGIBLE_ROUTE',
      ]);
    }
  }

  const reasonCodes: Em7RoutingDecision['reasonCodes'] = [
    selectionReason(selected.priorityBand),
    'PRIORITY_BAND_APPLIED',
    'SCORE_WINNER',
    'PRIVACY_REQUIREMENT_PRESERVED',
    'VENDOR_NEUTRAL_SELECTION',
    'HOME_BASE_RECEIPT_PENDING_EM8',
  ];
  if (fallbackPlan.enabled || request.acceleratorFailed) {
    reasonCodes.push('ACCELERATOR_FALLBACK_VISIBLE', 'CPU_FALLBACK_PLAN');
  }

  return {
    requestId: request.requestId,
    allowed: true,
    selectedNode: selected.candidate.nodeId,
    selectedDevice: selected.candidate.device,
    runtimeProvider: selected.candidate.runtimeProvider,
    reasonCodes,
    estimatedLatency: selected.candidate.measuredLatencyMs ?? null,
    estimatedCost: selected.candidate.measuredCostUsd ?? null,
    privacyState: privacyStateFor(
      request.privacyRequirement,
      selected.candidate.placement,
    ),
    fallbackPlan,
    evidenceRefs: [...selected.candidate.evidenceRefs],
    priorityBand: selected.priorityBand,
    score: selected.score,
    deniedCandidates,
    coreFlow: EM7_CORE_FLOW,
    l4AutonomyEnabled: false,
    automaticCapacityPurchase: false,
    silentPrivacyDowngrade: false,
    vendorNeutral: true,
    homeBaseReturn: 'PENDING_EM8_RECEIPT',
    nextPhase: NEXT_PHASE_EM8,
  };
}

function denyDecision(
  request: Em7InferenceRequest,
  scored: Em7ScoredRoute[],
  deniedCandidates: Em7RoutingDecision['deniedCandidates'],
  reasonCodes: Em7RoutingDecision['reasonCodes'],
): Em7RoutingDecision {
  void scored;
  return {
    requestId: request.requestId,
    allowed: false,
    selectedNode: null,
    selectedDevice: null,
    runtimeProvider: null,
    reasonCodes,
    estimatedLatency: null,
    estimatedCost: null,
    privacyState: 'DENIED_PRIVACY',
    fallbackPlan: {
      enabled: false,
      visibleInReceipt: true,
      device: null,
      runtimeProvider: null,
      reason: 'Request denied — no silent fallback.',
      doesNotVerifyFailedAccelerator: true,
    },
    evidenceRefs: [],
    priorityBand: null,
    score: null,
    deniedCandidates,
    coreFlow: EM7_CORE_FLOW,
    l4AutonomyEnabled: false,
    automaticCapacityPurchase: false,
    silentPrivacyDowngrade: false,
    vendorNeutral: true,
    homeBaseReturn: 'PENDING_EM8_RECEIPT',
    nextPhase: NEXT_PHASE_EM8,
  };
}

/** Convenience: build a minimal local CPU candidate for tests/fixtures. */
export function createLocalCpuCandidate(
  partial: Partial<Em7RouteCandidate> & Pick<Em7RouteCandidate, 'nodeId' | 'tenantId' | 'universeScope'>,
): Em7RouteCandidate {
  return {
    nodeId: partial.nodeId,
    device: partial.device ?? 'CPU',
    placement: partial.placement ?? 'local',
    vendor: partial.vendor ?? 'UNKNOWN',
    runtimeProvider: partial.runtimeProvider ?? 'cpu-local',
    verificationState: partial.verificationState ?? 'VERIFIED',
    heartbeatState: partial.heartbeatState ?? 'RUNNING_VERIFIED',
    tenantId: partial.tenantId,
    universeScope: partial.universeScope,
    privacyClass: partial.privacyClass ?? 'local_only',
    modelIdsCompatible: partial.modelIdsCompatible ?? ['*'],
    availableRamBytes: partial.availableRamBytes ?? 8 * 1024 * 1024 * 1024,
    availableVramBytes: partial.availableVramBytes ?? 0,
    queueDepth: partial.queueDepth ?? 0,
    queueCapacity: partial.queueCapacity ?? 8,
    measuredLatencyMs: partial.measuredLatencyMs,
    measuredCostUsd: partial.measuredCostUsd,
    energyProxy: partial.energyProxy,
    reliabilityScore: partial.reliabilityScore ?? 0.9,
    networkAvailable: partial.networkAvailable ?? true,
    cloudExplicitlyAuthorized: partial.cloudExplicitlyAuthorized ?? false,
    capacityPurchaseAttempted: partial.capacityPurchaseAttempted ?? false,
    fallbackAllowed: partial.fallbackAllowed ?? true,
    evidenceRefs: partial.evidenceRefs ?? ['em7-fixture'],
  };
}
