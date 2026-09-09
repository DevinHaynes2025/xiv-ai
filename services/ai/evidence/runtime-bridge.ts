import type { RuntimeFabric } from '../runtime/control-plane';
import type {
  CallerContext,
  ComputeAssignment,
  LineageRecord,
  Result,
  RuntimeSecurityEvent,
} from '../runtime/types';
import type {
  AgentSecurityPayload,
  CostPayload,
  LineageLink,
  LineagePayload,
  NegativePayload,
  NegativeProbe,
  RuntimeEvidencePayload,
} from './types';
import { LINEAGE_LINKS } from './types';

/**
 * Sections 41, 42, 44, 51 and 52 describe evidence the runtime fabric already
 * holds: which node ran the work, what it consumed, what the router refused and
 * how a result traces back to its source.
 *
 * This module reads that state and shapes it into evidence payloads. It is the
 * only place the two modules touch, and it is read-only in both directions:
 * capturing evidence never mutates a run, and the ledger never reaches into the
 * fabric.
 */

export type CaptureContext = {
  fabric: RuntimeFabric;
  /** An operator or guardian context; `audit.read` is required throughout. */
  auditor: CallerContext;
};

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`evidence capture failed: ${result.code} — ${result.message}`);
  const { ok: _ok, ...rest } = result as { ok: true } & Record<string, unknown>;
  return rest as T;
}

function consumptionOf(context: CaptureContext, workloadId: string): Record<string, number> {
  const { lineage } = unwrap(context.fabric.getLineage(context.auditor, workloadId));
  const cost = lineage.cost;
  if (!cost) return {};
  return {
    computeUnits: cost.computeUnits,
    tokens: cost.tokens,
    storageMb: cost.storageMb,
    bandwidthMb: cost.bandwidthMb,
    runtimeMs: cost.runtimeMs,
    energyWh: cost.energyWh,
  };
}

/** Section 42. */
export function captureRuntimeEvidence(
  context: CaptureContext,
  input: { assignmentId: string },
): RuntimeEvidencePayload {
  const { assignment } = unwrap(context.fabric.getAssignment(context.auditor, input.assignmentId));
  const { node } = unwrap(context.fabric.getNode(context.auditor, assignment.nodeId));

  return {
    kind: 'runtime',
    nodeClass: node.nodeType,
    architecture: node.hardware.architecture,
    cpuVendor: node.hardware.cpuVendor,
    gpuVendor: node.hardware.gpuVendor,
    runtimeVersion: node.runtimeVersion,
    trustLevel: node.trustLevel,
    attestationState: node.attestationState,
    capabilities: [...node.capabilities],
    workloadId: assignment.workloadId,
    startedAt: assignment.startedAt,
    finishedAt: assignment.finishedAt,
    resourceConsumption: consumptionOf(context, assignment.workloadId),
    terminationState: assignment.status,
    resultHash: assignment.checkpoint?.stateDigest ?? null,
  };
}

/**
 * Section 41. `unauthorizedGrants` is the number the section exists to surface,
 * so it counts only events where authority was actually exceeded. A blocked
 * attempt is the system working and is reported separately.
 */
export function captureAgentSecurityEvidence(
  context: CaptureContext,
  input: { workloadId: string; assignment?: ComputeAssignment | null; humanApprovalPresent?: boolean },
): AgentSecurityPayload {
  const { workload } = unwrap(context.fabric.getWorkload(context.auditor, input.workloadId));
  const { events } = unwrap(context.fabric.listSecurityEvents(context.auditor));
  const related = events.filter(
    (event) => event.workloadId === input.workloadId || event.actorId === workload.agentId,
  );
  const granted = input.assignment !== null && input.assignment !== undefined;

  return {
    kind: 'agent_security',
    agentId: workload.agentId,
    agentRole: workload.kind,
    organizationId: workload.organizationId,
    universeId: workload.universeId,
    requestedCapability: workload.requestedCapability,
    grantedCapability: granted ? workload.requestedCapability : null,
    modelId: input.assignment?.modelId ?? null,
    runtimeNodeId: input.assignment?.nodeId ?? null,
    taskId: workload.workloadId,
    meetingId: workload.meetingId,
    resourceBudget: {
      computeUnits: workload.estimate.computeUnits,
      memoryMb: workload.estimate.memoryMb,
      storageMb: workload.estimate.storageMb,
      tokens: workload.estimate.tokens,
      bandwidthMb: workload.estimate.bandwidthMb,
      runtimeMs: workload.estimate.runtimeMs,
    },
    toolsRequested: [workload.requestedCapability],
    toolsGranted: granted ? [workload.requestedCapability] : [],
    humanApprovalRequired: workload.consequential,
    humanApprovalPresent: input.humanApprovalPresent ?? false,
    result: workload.status,
    securityEvents: related.map((event) => event.kind),
    unauthorizedGrants: related.filter(exceededAuthority).length,
  };
}

function exceededAuthority(event: RuntimeSecurityEvent): boolean {
  return event.kind === 'model_substitution_detected' || event.kind === 'offline_authority_exceeded';
}

/** Section 44. */
export function captureCostEvidence(context: CaptureContext, input: { workloadIds: readonly string[] }): CostPayload {
  let tokens = 0;
  let computeMs = 0;
  let gpuMillis = 0;
  let storageMb = 0;
  let networkMb = 0;
  let estimatedCostUsd = 0;
  let modelCalls = 0;
  let successful = 0;
  const agents = new Set<string>();

  for (const workloadId of input.workloadIds) {
    const { workload } = unwrap(context.fabric.getWorkload(context.auditor, workloadId));
    const { lineage } = unwrap(context.fabric.getLineage(context.auditor, workloadId));
    const cost = lineage.cost;

    agents.add(workload.agentId);
    if (workload.status === 'completed') successful += 1;
    if (lineage.models.length > 0) modelCalls += lineage.models.length;
    if (!cost) continue;

    tokens += cost.tokens;
    storageMb += cost.storageMb;
    networkMb += cost.bandwidthMb;
    estimatedCostUsd += cost.monetaryUsd;
    const onAccelerator = lineage.hardware.some((entry) => entry.gpuVendor !== 'none');
    if (onAccelerator) gpuMillis += cost.runtimeMs;
    else computeMs += cost.runtimeMs;
  }

  const count = Math.max(1, input.workloadIds.length);
  return {
    kind: 'cost',
    workloadCount: input.workloadIds.length,
    agentCount: agents.size,
    activeAgentCount: agents.size,
    modelCalls,
    tokens,
    cpuMillis: computeMs,
    gpuMillis,
    storageMb,
    networkMb,
    estimatedCostUsd: round(estimatedCostUsd),
    // Section 44 asks for actual spend where it exists. A modelled estimate is
    // not an invoice, so this stays null until a billing source is connected.
    attributableCostUsd: null,
    costPerTaskUsd: round(estimatedCostUsd / count),
    costPerSuccessfulTaskUsd: successful > 0 ? round(estimatedCostUsd / successful) : null,
  };
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** Section 51. */
export function captureLineageEvidence(
  context: CaptureContext,
  input: { workloadId: string; consequential?: boolean },
): LineagePayload {
  const { lineage } = unwrap(context.fabric.getLineage(context.auditor, input.workloadId));
  const present = new Set<LineageLink>();

  for (const entry of lineage.chain) {
    for (const link of linksForStage(entry)) present.add(link);
  }
  if (lineage.models.length > 0) present.add('model');
  if (lineage.requestingAgentId) present.add('agent');
  if (lineage.hardware.length > 0) present.add('runtime');

  const missing = LINEAGE_LINKS.filter((link) => !present.has(link));
  return {
    kind: 'lineage',
    subjectId: input.workloadId,
    consequential: input.consequential ?? false,
    presentLinks: LINEAGE_LINKS.filter((link) => present.has(link)),
    missingLinks: missing,
    reconstructionPercent: Math.round(((LINEAGE_LINKS.length - missing.length) / LINEAGE_LINKS.length) * 100),
  };
}

function linksForStage(entry: LineageRecord): LineageLink[] {
  switch (entry.stage) {
    case 'source':
      return ['original_source', 'ingestion'];
    case 'classification':
      return ['classification'];
    case 'node_ingress':
      return ['runtime'];
    case 'transformation':
      return ['transformation'];
    case 'node_egress':
      return ['result'];
    case 'agent':
      return ['agent'];
    case 'meeting':
      return ['meeting', 'recommendation'];
    case 'decision':
      return ['human_approval'];
    case 'offline_sync':
      return ['ingestion'];
    default:
      return [];
  }
}

/**
 * Section 52. Negative evidence is assembled from attempts actually made
 * against the fabric, so each probe carries the denial code the system really
 * produced rather than the one the test author hoped for.
 */
export type AttemptedDenial = {
  scenario: string;
  attempted: string;
  expected: 'denied' | 'terminated';
  outcome: { ok: boolean; code?: string };
};

export function captureNegativeEvidence(attempts: readonly AttemptedDenial[]): NegativePayload {
  const probes: NegativeProbe[] = attempts.map((attempt) => ({
    scenario: attempt.scenario,
    attempted: attempt.attempted,
    expected: attempt.expected,
    actual: attempt.outcome.ok ? 'allowed' : attempt.expected,
    denialCode: attempt.outcome.ok ? null : (attempt.outcome.code ?? 'unspecified'),
  }));
  return { kind: 'negative', probes };
}
