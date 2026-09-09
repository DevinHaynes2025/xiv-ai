/**
 * 62L-EX5 — Multi-provider QPU router + hybrid bridge helpers.
 * No auto-submit when human approval required.
 * Mesh roles: no billing/credential/tenant/production authority.
 * Neural pathways: evidence only, never authority.
 * Failure memory retained as evidence — not authority.
 */

import { authorizeQpuJob } from './qpu-job.ts';
import {
  excludeStaleFromVerifiedRoute,
  getBackend,
  getProvider,
  listBackends,
  type QpuTruthRegistry,
} from './qpu-registry.ts';
import {
  EX5_LOCKS,
  type Ex5ExecutionClass,
  type GateResult,
  type QpuJobRequest,
} from './qpu-types.ts';

/** Mesh roles for EX5 — advisory only; no billing/credential/tenant/production authority. */
export const EX5_MESH_ROLES = [
  'ProviderTruthAgent',
  'BackendCapabilityAgent',
  'CostGovernorAgent',
  'PrivacyRegionAgent',
  'HardwareEvidenceAgent',
  'ReviewerAgent',
] as const;

export type Ex5MeshRole = (typeof EX5_MESH_ROLES)[number];

export const EX5_MESH_ROLE_AUTHORITY = {
  mayBill: false,
  mayStoreCredentials: false,
  mayChangeTenant: false,
  mayChangeUniverse: false,
  mayAuthorizeProduction: false,
  mayWeakenGuardianRls: false,
  evidenceOnly: true,
} as const;

export type RouteCandidate = {
  providerId: string;
  backendId: string;
  gate: GateResult;
};

export type RoutePlan = {
  decision: GateResult['decision'];
  reason: string;
  selected: RouteCandidate | null;
  candidates: RouteCandidate[];
  fallbackExecutionClass: Ex5ExecutionClass;
  autoSubmitted: false;
  humanApprovalRequired: boolean;
  continueLocally: boolean;
  physicalQpuVerified: false;
  quantumAdvantageVerified: false;
  l4Enabled: false;
};

/**
 * Multi-provider routing. Never auto-submit when approval required.
 * Prefer fresh VERIFIED physical backends; else local classical/inspired/sim.
 */
export function routeQpuJob(
  registry: QpuTruthRegistry,
  request: QpuJobRequest,
  opts: { candidateBackendIds?: readonly string[] } = {},
): RoutePlan {
  const fallback: Ex5ExecutionClass = request.offlineDisconnected
    ? 'CLASSICAL'
    : 'SIMULATED_QUANTUM';

  const backendIds =
    opts.candidateBackendIds ??
    (request.backendId ? [request.backendId] : listBackends(registry).map((b) => b.backendId));

  const candidates: RouteCandidate[] = [];
  for (const backendId of backendIds) {
    const gate = authorizeQpuJob(registry, { ...request, backendId });
    const backend = getBackend(registry, backendId);
    const providerId = backend?.providerId ?? request.providerId;
    candidates.push({ providerId, backendId, gate });
  }

  const approvalRequired = candidates.some(
    (c) =>
      c.gate.decision === 'HUMAN_APPROVAL_REQUIRED' || c.gate.humanApprovalRequired === true,
  );

  if (approvalRequired && !request.humanApprovalGranted) {
    if (EX5_LOCKS.AUTO_SUBMIT_WHEN_APPROVAL_REQUIRED) {
      return {
        decision: 'DENIED',
        reason: 'AUTO_SUBMIT_WHEN_APPROVAL_REQUIRED_FORBIDDEN',
        selected: null,
        candidates,
        fallbackExecutionClass: fallback,
        autoSubmitted: false,
        humanApprovalRequired: true,
        continueLocally: true,
        physicalQpuVerified: false,
        quantumAdvantageVerified: false,
        l4Enabled: false,
      };
    }
    return {
      decision: 'HUMAN_APPROVAL_REQUIRED',
      reason: 'NO_AUTO_SUBMIT_WHEN_APPROVAL_REQUIRED',
      selected: null,
      candidates,
      fallbackExecutionClass: fallback,
      autoSubmitted: false,
      humanApprovalRequired: true,
      continueLocally: true,
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      l4Enabled: false,
    };
  }

  // Fresh VERIFIED physical only.
  const freshVerified = excludeStaleFromVerifiedRoute(
    backendIds
      .map((id) => getBackend(registry, id))
      .filter((b): b is NonNullable<typeof b> => Boolean(b)),
    request.now,
  );

  const allowed = candidates.filter((c) => c.gate.decision === 'ALLOWED');
  const preferred = allowed.find((c) =>
    freshVerified.some((b) => b.backendId === c.backendId && b.physicalOrSimulator === 'PHYSICAL_QPU'),
  );

  if (preferred) {
    return {
      decision: 'ALLOWED',
      reason: preferred.gate.reason,
      selected: preferred,
      candidates,
      fallbackExecutionClass: fallback,
      autoSubmitted: false,
      humanApprovalRequired: preferred.gate.humanApprovalRequired,
      continueLocally: false,
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      l4Enabled: false,
    };
  }

  const waiting = candidates.find((c) => c.gate.decision === 'WAITING_PROVIDER');
  if (waiting) {
    return {
      decision: 'WAITING_PROVIDER',
      reason: waiting.gate.reason,
      selected: null,
      candidates,
      fallbackExecutionClass: 'CLASSICAL',
      autoSubmitted: false,
      humanApprovalRequired: false,
      continueLocally: true,
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      l4Enabled: false,
    };
  }

  // Hybrid bridge: continue CLASSICAL / QUANTUM_INSPIRED / SIMULATED_QUANTUM locally.
  const localSim = allowed.find((c) => c.gate.executionClass === 'SIMULATED_QUANTUM');
  if (localSim) {
    return {
      decision: 'ALLOWED',
      reason: 'HYBRID_BRIDGE_SIMULATED_QUANTUM',
      selected: localSim,
      candidates,
      fallbackExecutionClass: 'SIMULATED_QUANTUM',
      autoSubmitted: false,
      humanApprovalRequired: localSim.gate.humanApprovalRequired,
      continueLocally: true,
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      l4Enabled: false,
    };
  }

  const denied = candidates.find((c) => c.gate.decision === 'DENIED');
  return {
    decision: denied?.gate.decision ?? 'WAITING_DATA',
    reason: denied?.gate.reason ?? 'NO_ELIGIBLE_BACKEND',
    selected: null,
    candidates,
    fallbackExecutionClass: fallback,
    autoSubmitted: false,
    humanApprovalRequired: approvalRequired,
    continueLocally: true,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    l4Enabled: false,
  };
}

/** Capability matching — shots / qubits / operations. */
export function matchBackendCapability(input: {
  shots: number;
  requiredQubits: number;
  requiredOperations: readonly string[];
  qubitsVerified: number | null;
  qubitsReported: number | null;
  operationsVerified: readonly string[];
  operationsReported: readonly string[];
  requireVerified: boolean;
}): { matched: boolean; reason: string } {
  const qubits = input.requireVerified ? input.qubitsVerified : input.qubitsReported;
  if (qubits === null || qubits < input.requiredQubits) {
    return { matched: false, reason: 'INSUFFICIENT_QUBITS' };
  }
  const ops = input.requireVerified ? input.operationsVerified : input.operationsReported;
  for (const op of input.requiredOperations) {
    if (!ops.includes(op)) {
      return { matched: false, reason: `MISSING_OPERATION:${op}` };
    }
  }
  if (input.shots <= 0) {
    return { matched: false, reason: 'INVALID_SHOTS' };
  }
  return { matched: true, reason: 'CAPABILITY_MATCHED' };
}

/** Adapter boundary — providers/ adapters never embed credentials. */
export type QpuProviderAdapter = {
  adapterId: string;
  providerId: string;
  /** Must remain false — credentials only via vault reference. */
  embedsCredentials: false;
  supportsDiscovery: boolean;
  supportsSubmit: boolean;
};

export function assertAdapterBoundary(adapter: QpuProviderAdapter): boolean {
  return adapter.embedsCredentials === false && EX5_LOCKS.STORE_RAW_CREDENTIALS === false;
}

/** Neural pathway lesson — evidence only, never authority. */
export function applyEx5NeuralPathwayLesson(input: {
  mayUpdateRoutingPriority: true;
  mayUpdateConfidence: true;
  mayUpdateRetest: true;
  mayChangeGuardian: boolean;
  mayChangeRls: boolean;
  mayChangeBilling: boolean;
  mayChangeCredentials: boolean;
  mayChangeTenant: boolean;
  mayChangeUniverse: boolean;
  mayChangeProductionAuthority: boolean;
}): { allowed: boolean; reason: string } {
  if (
    input.mayChangeGuardian ||
    input.mayChangeRls ||
    input.mayChangeBilling ||
    input.mayChangeCredentials ||
    input.mayChangeTenant ||
    input.mayChangeUniverse ||
    input.mayChangeProductionAuthority
  ) {
    return {
      allowed: false,
      reason: 'NEURAL_PATHWAY_EVIDENCE_ONLY_NEVER_AUTHORITY',
    };
  }
  return { allowed: true, reason: 'LESSON_MAY_UPDATE_ROUTING_CONFIDENCE_RETEST_ONLY' };
}

/** Failure memory — retained as evidence, never authority. */
export type FailureMemoryEntry = {
  failureId: string;
  providerId: string | null;
  backendId: string | null;
  reason: string;
  at: string;
  authority: false;
  evidenceOnly: true;
};

export function recordFailureMemory(input: {
  failureId: string;
  providerId: string | null;
  backendId: string | null;
  reason: string;
  at: string;
}): FailureMemoryEntry {
  return {
    failureId: input.failureId,
    providerId: input.providerId,
    backendId: input.backendId,
    reason: input.reason,
    at: input.at,
    authority: false,
    evidenceOnly: true,
  };
}

export function providerConfiguredForRoute(
  registry: QpuTruthRegistry,
  providerId: string,
): boolean {
  const p = getProvider(registry, providerId);
  return Boolean(p && p.state !== 'NOT_CONFIGURED' && p.state !== 'UNKNOWN');
}
