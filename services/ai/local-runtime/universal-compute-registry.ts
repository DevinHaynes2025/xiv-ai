/**
 * 62L-EM3 — Universal Compute Registry
 *
 * Governed registry of CPU / GPU / NPU / edge / authorized-cloud compute.
 * Agents select hardware from evidence — never from DETECTED assumptions.
 */

import { DEFAULT_HEARTBEAT_STALE_MS, classifyHeartbeat } from './runtime-state';
import { EM3_LOCKS } from './em3-honesty';
import type {
  CloudAuthorization,
  ComponentCapability,
  ComputeNode,
  ComputeTaskRequest,
  ComputeTruthState,
  CostModel,
  DeviceVendor,
  EligibilityDenialCode,
  EligibilityResult,
  MeasuredEvidence,
  NodeHeartbeatRecord,
  SelectionResult,
} from './universal-compute-registry-types';

export * from './universal-compute-registry-types';
export { EM3_LOCKS, assertEm3LocksIntact, EM3_HONESTY_BANNER, EM3_SOT_TITLE } from './em3-honesty';
export { probeEm3SoftWires } from './em3-soft-wire';

const ACCELERATOR_EVIDENCE_KINDS = new Set(['bounded_inference', 'benchmark']);

export function createEmptyCostModel(): CostModel {
  return {
    measured: [],
    authorizedPurchase: false,
    autoPurchaseEnabled: false,
  };
}

export function createDeniedCloudAuthorization(
  overrides: Partial<CloudAuthorization> = {},
): CloudAuthorization {
  return {
    explicitlyAuthorized: overrides.explicitlyAuthorized === true,
    authorizedBy: overrides.authorizedBy,
    authorizedAt: overrides.authorizedAt,
    // Hard locks — cannot be overridden to true.
    capacityPurchaseAllowed: false,
    autoPurchaseAttempted: false,
  };
}

export function createComponentCapability(
  partial: Partial<ComponentCapability> & { verificationState?: ComputeTruthState } = {},
): ComponentCapability {
  return {
    verificationState: partial.verificationState ?? 'UNKNOWN',
    evidence: partial.evidence ?? [],
    measuredEvidence: partial.measuredEvidence ?? [],
    name: partial.name,
    vendor: partial.vendor,
    coresOrUnits: partial.coresOrUnits,
    memoryBytes: partial.memoryBytes,
  };
}

export function classifyNodeHeartbeat(
  input: {
    nodeId: string;
    observedAt?: string | null;
    running?: boolean | null;
    staleAfterMs?: number;
  },
  now = new Date(),
): NodeHeartbeatRecord {
  const staleAfterMs = input.staleAfterMs ?? DEFAULT_HEARTBEAT_STALE_MS;
  const classified = classifyHeartbeat(
    {
      nodeId: input.nodeId,
      observedAt: input.observedAt,
      running: input.running,
    },
    now,
    staleAfterMs,
  );
  // Align missing heartbeat with WAITING_NODE for registry eligibility.
  const classifiedState =
    classified.state === 'UNKNOWN' && !input.observedAt
      ? 'WAITING_NODE'
      : classified.state;
  return {
    observedAt: input.observedAt ?? null,
    running: input.running ?? null,
    classifiedState,
    staleAfterMs,
  };
}

export type RegisterNodeInput = Omit<
  ComputeNode,
  'registeredAt' | 'updatedAt' | 'costModel' | 'heartbeat' | 'cloudAuthorization'
> & {
  costModel?: Partial<CostModel>;
  heartbeat?: Partial<NodeHeartbeatRecord> & {
    observedAt?: string | null;
    running?: boolean | null;
  };
  cloudAuthorization?: Partial<CloudAuthorization>;
  now?: string;
};

/**
 * Build a registry node with hard locks applied (no auto-purchase, same vendor model).
 */
export function buildComputeNode(input: RegisterNodeInput): ComputeNode {
  const now = input.now ?? new Date().toISOString();
  const heartbeat = classifyNodeHeartbeat(
    {
      nodeId: input.nodeId,
      observedAt: input.heartbeat?.observedAt ?? null,
      running: input.heartbeat?.running ?? null,
      staleAfterMs: input.heartbeat?.staleAfterMs,
    },
    new Date(now),
  );

  const costModel: CostModel = {
    claimedCostPerHourUsd: input.costModel?.claimedCostPerHourUsd,
    measured: input.costModel?.measured ?? [],
    authorizedPurchase: false,
    autoPurchaseEnabled: false,
  };

  let cloudAuthorization: CloudAuthorization | undefined;
  if (input.placement === 'cloud' || input.cloudAuthorization) {
    cloudAuthorization = createDeniedCloudAuthorization({
      explicitlyAuthorized: input.cloudAuthorization?.explicitlyAuthorized === true,
      authorizedBy: input.cloudAuthorization?.authorizedBy,
      authorizedAt: input.cloudAuthorization?.authorizedAt,
    });
  }

  return {
    nodeId: input.nodeId,
    owner: input.owner,
    tenantId: input.tenantId,
    universeScope: input.universeScope,
    deviceType: input.deviceType,
    vendor: input.vendor,
    cpu: input.cpu,
    gpu: input.gpu,
    npu: input.npu,
    ramBytes: input.ramBytes,
    storageBytes: input.storageBytes,
    osRuntime: input.osRuntime,
    executionProviders: [...input.executionProviders],
    placement: input.placement,
    privacyClass: input.privacyClass,
    costModel,
    latencyEvidence: [...(input.latencyEvidence ?? [])],
    energyProxy: input.energyProxy ?? null,
    heartbeat,
    verificationState: input.verificationState,
    revocationState: input.revocationState,
    cloudAuthorization,
    registeredAt: now,
    updatedAt: now,
  };
}

/** Vendors share one evidence model — no AMD/NVIDIA/Intel/Apple special-case path. */
export function vendorEvidenceModel(_vendor: DeviceVendor): 'UNIVERSAL_SAME_FOR_ALL_VENDORS' {
  void _vendor;
  return 'UNIVERSAL_SAME_FOR_ALL_VENDORS';
}

export function hasBoundedAcceleratorEvidence(
  component: ComponentCapability | undefined,
): boolean {
  if (!component) return false;
  return component.measuredEvidence.some((e) => ACCELERATOR_EVIDENCE_KINDS.has(e.kind));
}

/**
 * Promote GPU/NPU to VERIFIED only with bounded inference or benchmark evidence.
 * Same rule for every vendor.
 */
export function verifyAcceleratorComponent(
  component: ComponentCapability,
  opts: {
    claimVerifiedWithoutEvidence?: boolean;
    measuredEvidence?: MeasuredEvidence[];
  } = {},
): ComponentCapability {
  if (opts.claimVerifiedWithoutEvidence) {
    return {
      ...component,
      verificationState:
        component.verificationState === 'VERIFIED'
          ? 'DETECTED'
          : component.verificationState,
      evidence: [
        ...component.evidence,
        'DENY_VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK',
      ],
    };
  }

  const measured = opts.measuredEvidence ?? component.measuredEvidence;
  const hasEvidence = measured.some((e) => ACCELERATOR_EVIDENCE_KINDS.has(e.kind));
  if (!hasEvidence) {
    return {
      ...component,
      measuredEvidence: measured,
      verificationState:
        component.verificationState === 'UNKNOWN' ? 'NOT_TESTED' : component.verificationState,
      evidence: [...component.evidence, 'ACCELERATOR_AWAITING_BOUNDED_EVIDENCE'],
    };
  }

  // Evidence present: allow VERIFIED only from SUPPORTED or existing measured path.
  const from = component.verificationState;
  if (from === 'DETECTED' || from === 'UNKNOWN' || from === 'NOT_TESTED') {
    // Still require progression honesty — DETECTED alone cannot jump; mark SUPPORTED first
    // only when docs/compat already claimed; here evidence elevates to VERIFIED via SUPPORTED.
    return {
      ...component,
      measuredEvidence: measured,
      verificationState: 'VERIFIED',
      evidence: [
        ...component.evidence,
        'BOUNDED_INFERENCE_OR_BENCHMARK_EVIDENCE_ACCEPTED',
        `vendor_model=${vendorEvidenceModel(component.vendor ?? 'UNKNOWN')}`,
      ],
    };
  }

  return {
    ...component,
    measuredEvidence: measured,
    verificationState: 'VERIFIED',
    evidence: [...component.evidence, 'BOUNDED_INFERENCE_OR_BENCHMARK_EVIDENCE_ACCEPTED'],
  };
}

function privacyAllowsPlacement(
  privacy: ComputeTaskRequest['privacyClass'],
  placement: ComputeNode['placement'],
): boolean {
  if (privacy === 'private' || privacy === 'tenant') {
    return placement === 'local' || placement === 'edge';
  }
  if (privacy === 'shared') {
    return placement === 'local' || placement === 'edge' || placement === 'cloud';
  }
  return true;
}

/**
 * Eligibility gate — all EM3 denial rules.
 * Detected hardware is not automatically usable.
 */
export function evaluateNodeEligibility(
  node: ComputeNode,
  task: ComputeTaskRequest,
): EligibilityResult {
  const denialCodes: EligibilityDenialCode[] = [];
  const reasons: string[] = [];

  if (EM3_LOCKS.L4_AUTONOMY_ENABLED !== false) {
    denialCodes.push('L4_AUTONOMY_DISABLED');
    reasons.push('L4 autonomy must remain disabled.');
  }

  if (node.revocationState === 'REVOKED') {
    denialCodes.push('REVOKED');
    reasons.push('Revoked devices are immediately ineligible for new tasks.');
  }

  if (node.tenantId !== task.requestingTenantId) {
    denialCodes.push('CROSS_TENANT_DENIED');
    reasons.push('Cross-tenant compute/data use is deny-by-default.');
  }

  if (node.universeScope !== task.requestingUniverseScope) {
    denialCodes.push('CROSS_UNIVERSE_DENIED');
    reasons.push('Universe boundary mismatch — Guardian/Universe scope enforced.');
  }

  const hb = node.heartbeat.classifiedState;
  if (hb === 'STALE' || hb === 'WAITING_NODE' || hb === 'OFFLINE_STOPPED' || hb === 'UNKNOWN') {
    denialCodes.push('STALE_OR_WAITING_HEARTBEAT');
    reasons.push(
      `Heartbeat ${hb} removes node from RUNNING_VERIFIED eligibility.`,
    );
  }

  if (
    node.verificationState === 'UNAVAILABLE' ||
    node.verificationState === 'DEGRADED' ||
    node.verificationState === 'WAITING_NODE'
  ) {
    denialCodes.push('UNAVAILABLE_OR_DEGRADED');
    reasons.push(`Node verificationState=${node.verificationState} is not selectable.`);
  }

  // DETECTED (node or accelerator) is never automatically usable for verified work.
  if (node.verificationState === 'DETECTED') {
    denialCodes.push('DETECTED_NOT_USABLE');
    reasons.push('DETECTED hardware is not automatically usable (DETECTED≠VERIFIED).');
  }

  if (task.requireVerifiedAccelerator || task.requireAccelerator) {
    const want = task.requireAccelerator ?? 'any';
    const gpu = node.gpu;
    const npu = node.npu;
    const candidates =
      want === 'gpu' ? [gpu] : want === 'npu' ? [npu] : [gpu, npu];
    const verified = candidates.find((c) => c && c.verificationState === 'VERIFIED');
    if (!verified) {
      denialCodes.push('ACCELERATOR_NOT_VERIFIED');
      reasons.push(
        'GPU/NPU verification requires VERIFIED state; DETECTED/SUPPORTED alone is insufficient.',
      );
      const detectedOnly = candidates.find((c) => c?.verificationState === 'DETECTED');
      if (detectedOnly && !denialCodes.includes('DETECTED_NOT_USABLE')) {
        denialCodes.push('DETECTED_NOT_USABLE');
        reasons.push(
          `Accelerator DETECTED only (${detectedOnly.vendor ?? node.vendor}) — not usable without evidence.`,
        );
      }
    } else if (!hasBoundedAcceleratorEvidence(verified)) {
      denialCodes.push('ACCELERATOR_MISSING_BOUNDED_EVIDENCE');
      reasons.push(
        'GPU/NPU VERIFIED requires actual bounded inference or benchmark evidence.',
      );
    }
  }

  if (node.placement === 'cloud') {
    if (task.allowCloud !== true) {
      denialCodes.push('CLOUD_NOT_ALLOWED_BY_TASK');
      reasons.push('Task did not allow cloud placement.');
    }
    const auth = node.cloudAuthorization;
    if (!auth || auth.explicitlyAuthorized !== true) {
      denialCodes.push('CLOUD_NOT_AUTHORIZED');
      reasons.push('Cloud nodes require explicit authorization.');
    }
    if (auth?.autoPurchaseAttempted === true || auth?.capacityPurchaseAllowed === true) {
      denialCodes.push('CLOUD_AUTO_PURCHASE_DENIED');
      reasons.push('Registry cannot auto-purchase cloud capacity.');
    }
    // Defense-in-depth: cost model auto-purchase lock
    if (node.costModel.autoPurchaseEnabled !== false) {
      denialCodes.push('CLOUD_AUTO_PURCHASE_DENIED');
      reasons.push('Cost model auto-purchase must remain false.');
    }
  }

  if (node.placement === 'edge' && task.allowEdge === false) {
    denialCodes.push('EDGE_NOT_ALLOWED_BY_TASK');
    reasons.push('Task disallowed edge placement.');
  }

  if (!privacyAllowsPlacement(task.privacyClass, node.placement)) {
    denialCodes.push('PRIVACY_PLACEMENT_MISMATCH');
    reasons.push(
      `Privacy class ${task.privacyClass} prefers compatible local/edge compute; cloud denied by default.`,
    );
  }

  if (task.requireMeasuredPerfOrCostClaims) {
    if (
      typeof node.costModel.claimedCostPerHourUsd === 'number' &&
      node.costModel.measured.length === 0
    ) {
      denialCodes.push('COST_CLAIM_WITHOUT_EVIDENCE');
      reasons.push('Cost claims must come from measured evidence.');
    }
    const claimsLatencyWithoutEvidence =
      node.latencyEvidence.length === 0 &&
      node.verificationState === 'VERIFIED' &&
      (node.gpu?.evidence.some((e) => /fast|latency|perf/i.test(e)) ||
        node.cpu?.evidence.some((e) => /fast|latency|perf/i.test(e)));
    if (claimsLatencyWithoutEvidence) {
      denialCodes.push('PERFORMANCE_CLAIM_WITHOUT_EVIDENCE');
      reasons.push('Performance claims must come from measured evidence.');
    }
  }

  // Explicit unmeasured cost claim gate even without require flag when claimed is set
  // and caller asks for measured claims — already covered. Also deny bare cost claim
  // selection evidence when measured empty and task wants cost-aware selection:
  if (
    typeof node.costModel.claimedCostPerHourUsd === 'number' &&
    node.costModel.measured.length === 0 &&
    task.requireMeasuredPerfOrCostClaims === true
  ) {
    // already pushed COST_CLAIM_WITHOUT_EVIDENCE
  }

  return {
    eligible: denialCodes.length === 0,
    nodeId: node.nodeId,
    denialCodes,
    reasons,
    usableFromDetectedAlone: false,
    vendorEvidenceModel: 'UNIVERSAL_SAME_FOR_ALL_VENDORS',
  };
}

/**
 * Select a compute node using eligibility + local preference for private workloads.
 */
export function selectComputeNode(
  nodes: readonly ComputeNode[],
  task: ComputeTaskRequest,
): SelectionResult {
  const preferLocal =
    task.preferLocal !== false &&
    (task.privacyClass === 'private' ||
      task.privacyClass === 'tenant' ||
      task.preferLocal === true);

  const denied: SelectionResult['denied'] = [];
  const eligible: ComputeNode[] = [];

  for (const node of nodes) {
    // Refresh heartbeat classification at selection time when now provided.
    let candidate = node;
    if (task.now) {
      candidate = {
        ...node,
        heartbeat: classifyNodeHeartbeat(
          {
            nodeId: node.nodeId,
            observedAt: node.heartbeat.observedAt,
            running: node.heartbeat.running,
            staleAfterMs: node.heartbeat.staleAfterMs,
          },
          new Date(task.now),
        ),
      };
    }
    const result = evaluateNodeEligibility(candidate, task);
    if (result.eligible) {
      eligible.push(candidate);
    } else {
      denied.push({
        nodeId: candidate.nodeId,
        denialCodes: result.denialCodes,
        reasons: result.reasons,
      });
    }
  }

  let ordered = [...eligible];
  if (preferLocal) {
    ordered.sort((a, b) => {
      const rank = (n: ComputeNode) =>
        n.placement === 'local' ? 0 : n.placement === 'edge' ? 1 : 2;
      return rank(a) - rank(b);
    });
  }

  const selected = ordered[0] ?? null;
  return {
    selected,
    eligibleNodeIds: ordered.map((n) => n.nodeId),
    denied,
    preferLocalApplied: preferLocal,
    cloudAutoPurchase: false,
    l4AutonomyEnabled: false,
    reason: selected
      ? `Selected ${selected.nodeId} (${selected.placement}/${selected.vendor}) from evidence-gated eligibility.`
      : 'No eligible compute node — deny-by-default.',
  };
}

/** In-memory Universal Compute Registry. */
export class UniversalComputeRegistry {
  private readonly nodes = new Map<string, ComputeNode>();

  upsert(input: RegisterNodeInput): ComputeNode {
    const existing = this.nodes.get(input.nodeId);
    const node = buildComputeNode({
      ...input,
      now: input.now ?? new Date().toISOString(),
    });
    if (existing) {
      node.registeredAt = existing.registeredAt;
    }
    this.nodes.set(node.nodeId, node);
    return node;
  }

  get(nodeId: string): ComputeNode | undefined {
    return this.nodes.get(nodeId);
  }

  list(): ComputeNode[] {
    return [...this.nodes.values()];
  }

  revoke(nodeId: string, now = new Date().toISOString()): ComputeNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;
    const revoked: ComputeNode = {
      ...node,
      revocationState: 'REVOKED',
      updatedAt: now,
    };
    this.nodes.set(nodeId, revoked);
    return revoked;
  }

  recordHeartbeat(
    nodeId: string,
    heartbeat: { observedAt?: string | null; running?: boolean | null },
    now = new Date(),
  ): ComputeNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;
    const updated: ComputeNode = {
      ...node,
      heartbeat: classifyNodeHeartbeat(
        {
          nodeId,
          observedAt: heartbeat.observedAt,
          running: heartbeat.running,
          staleAfterMs: node.heartbeat.staleAfterMs,
        },
        now,
      ),
      updatedAt: now.toISOString(),
    };
    this.nodes.set(nodeId, updated);
    return updated;
  }

  evaluate(nodeId: string, task: ComputeTaskRequest): EligibilityResult {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return {
        eligible: false,
        nodeId,
        denialCodes: ['NODE_NOT_FOUND'],
        reasons: ['Node not found in Universal Compute Registry.'],
        usableFromDetectedAlone: false,
        vendorEvidenceModel: 'UNIVERSAL_SAME_FOR_ALL_VENDORS',
      };
    }
    let candidate = node;
    if (task.now) {
      candidate = {
        ...node,
        heartbeat: classifyNodeHeartbeat(
          {
            nodeId: node.nodeId,
            observedAt: node.heartbeat.observedAt,
            running: node.heartbeat.running,
            staleAfterMs: node.heartbeat.staleAfterMs,
          },
          new Date(task.now),
        ),
      };
    }
    return evaluateNodeEligibility(candidate, task);
  }

  select(task: ComputeTaskRequest): SelectionResult {
    return selectComputeNode(this.list(), task);
  }
}

export function createUniversalComputeRegistry(): UniversalComputeRegistry {
  return new UniversalComputeRegistry();
}
