/**
 * 62L-EX7 — Route policy gates.
 * Policy gates override score. Fail → ROUTE_DENIED (or specialty state).
 * DETECTED ≠ VERIFIED eligibility. Same for AMD/NVIDIA/Intel/Apple/Qualcomm/ARM/QPUs.
 */

import {
  EX7_LOCKS,
  type DeviceEvidenceState,
  type HardwareDeviceRecord,
  type HybridExecutionRequest,
  type IneligibleRoute,
  type RouteCandidate,
  type RouteClass,
  type RouteState,
} from './types.ts';

const EVIDENCE_RANK: Record<DeviceEvidenceState, number> = {
  UNAVAILABLE: 0,
  NOT_TESTED: 1,
  WAITING_DATA: 2,
  DOCUMENTED: 3,
  DETECTED: 4,
  SUPPORTED: 5,
  VERIFIED: 6,
};

export function evidenceMeetsMinimum(
  actual: DeviceEvidenceState,
  minimum: DeviceEvidenceState,
): boolean {
  return EVIDENCE_RANK[actual] >= EVIDENCE_RANK[minimum];
}

export function isClassicalLocal(routeClass: RouteClass): boolean {
  return (
    routeClass === 'CLASSICAL_CPU' ||
    routeClass === 'CLASSICAL_GPU' ||
    routeClass === 'CLASSICAL_NPU'
  );
}

export function isQuantumInspired(routeClass: RouteClass): boolean {
  return (
    routeClass === 'QUANTUM_INSPIRED_CPU' ||
    routeClass === 'QUANTUM_INSPIRED_GPU' ||
    routeClass === 'QUANTUM_INSPIRED_NPU'
  );
}

export function isSimulatedQuantum(routeClass: RouteClass): boolean {
  return (
    routeClass === 'SIMULATED_QUANTUM_CPU' ||
    routeClass === 'SIMULATED_QUANTUM_GPU'
  );
}

export function isPhysicalQpuCandidate(routeClass: RouteClass): boolean {
  return routeClass === 'PHYSICAL_QPU_CANDIDATE';
}

export function isRemoteRoute(device: HardwareDeviceRecord): boolean {
  return device.locality === 'REMOTE';
}

/** Offline-eligible classes (local only). Physical QPU → WAITING_PROVIDER. */
export function offlineEligibleClass(routeClass: RouteClass): boolean {
  return (
    routeClass === 'CLASSICAL_CPU' ||
    routeClass === 'CLASSICAL_GPU' ||
    routeClass === 'CLASSICAL_NPU' ||
    isQuantumInspired(routeClass) ||
    isSimulatedQuantum(routeClass)
  );
}

export type GateResult =
  | { ok: true }
  | { ok: false; gate: string; reason: string; state?: RouteState };

export function gateTenantUniverse(
  request: HybridExecutionRequest,
): GateResult {
  if (request.callerTenantId !== request.tenantId) {
    return {
      ok: false,
      gate: 'TENANT',
      reason: 'CROSS_TENANT_DENIED — Hybrid router tenant gate.',
      state: 'ROUTE_DENIED',
    };
  }
  if (request.callerUniverseId !== request.universeId) {
    return {
      ok: false,
      gate: 'UNIVERSE',
      reason: 'CROSS_UNIVERSE_DENIED — Hybrid router Universe gate.',
      state: 'ROUTE_DENIED',
    };
  }
  return { ok: true };
}

export function gateExpiry(request: HybridExecutionRequest, nowIso: string): GateResult {
  if (Date.parse(nowIso) > Date.parse(request.expiresAt)) {
    return {
      ok: false,
      gate: 'EXPIRY',
      reason: 'EXPIRED — request past expiresAt.',
      state: 'EXPIRED',
    };
  }
  return { ok: true };
}

export function gateDataPrivacy(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  const privateLocal =
    request.localOnly ||
    request.privacyClass === 'PRIVATE_LOCAL_ONLY' ||
    request.inputDataClass === 'PRIVATE_LOCAL';

  if (privateLocal && isRemoteRoute(device)) {
    return {
      ok: false,
      gate: 'DATA_PRIVACY',
      reason:
        'ROUTE_DENIED — private/local-only data cannot route to cloud/QPU.',
      state: 'ROUTE_DENIED',
    };
  }
  if (privateLocal && isPhysicalQpuCandidate(device.routeClass)) {
    return {
      ok: false,
      gate: 'DATA_PRIVACY',
      reason:
        'ROUTE_DENIED — private/local-only data cannot route to physical QPU.',
      state: 'ROUTE_DENIED',
    };
  }
  return { ok: true };
}

export function gateEvidence(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  if (!evidenceMeetsMinimum(device.evidenceState, request.minimumEvidenceState)) {
    return {
      ok: false,
      gate: 'EVIDENCE',
      reason: `DETECTED≠VERIFIED — device ${device.deviceId} evidence=${device.evidenceState} < required ${request.minimumEvidenceState}.`,
      state: 'ROUTE_DENIED',
    };
  }
  return { ok: true };
}

export function gateCostLatency(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  if (
    request.externalCostBudget != null &&
    device.estimatedCost != null &&
    device.estimatedCost > request.externalCostBudget
  ) {
    return {
      ok: false,
      gate: 'COST',
      reason: 'ROUTE_DENIED — estimated cost exceeds externalCostBudget.',
      state: 'ROUTE_DENIED',
    };
  }
  if (
    request.estimatedExternalCost != null &&
    request.externalCostBudget != null &&
    request.estimatedExternalCost > request.externalCostBudget
  ) {
    return {
      ok: false,
      gate: 'COST',
      reason: 'ROUTE_DENIED — request estimatedExternalCost over budget.',
      state: 'ROUTE_DENIED',
    };
  }
  if (
    request.memoryBudgetMb != null &&
    device.memoryMb != null &&
    device.memoryMb < request.memoryBudgetMb
  ) {
    return {
      ok: false,
      gate: 'MEMORY',
      reason: 'RESOURCE_LIMITED — device memory below budget requirement.',
      state: 'RESOURCE_LIMITED',
    };
  }
  if (
    request.latencyBudgetMs != null &&
    device.startupMs != null &&
    device.startupMs > request.latencyBudgetMs
  ) {
    return {
      ok: false,
      gate: 'LATENCY',
      reason: 'RESOURCE_LIMITED — startup latency exceeds latencyBudgetMs.',
      state: 'RESOURCE_LIMITED',
    };
  }
  return { ok: true };
}

export function gateOfflineAndProvider(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  if (request.webFreshRequired && request.offline) {
    return {
      ok: false,
      gate: 'DATA',
      reason: 'WAITING_DATA — web-fresh required while offline; no fabricate.',
      state: 'WAITING_DATA',
    };
  }

  if (request.offline && isPhysicalQpuCandidate(device.routeClass)) {
    return {
      ok: false,
      gate: 'PROVIDER',
      reason: 'WAITING_PROVIDER — offline; physical QPU unavailable.',
      state: 'WAITING_PROVIDER',
    };
  }

  if (request.offline && isRemoteRoute(device)) {
    return {
      ok: false,
      gate: 'PROVIDER',
      reason: 'WAITING_PROVIDER — offline; remote path unavailable.',
      state: 'WAITING_PROVIDER',
    };
  }

  if (request.offline && !offlineEligibleClass(device.routeClass)) {
    return {
      ok: false,
      gate: 'OFFLINE',
      reason: 'ROUTE_DENIED — route class not offline-eligible.',
      state: 'ROUTE_DENIED',
    };
  }

  if (
    isPhysicalQpuCandidate(device.routeClass) &&
    device.providerAvailable === false
  ) {
    return {
      ok: false,
      gate: 'PROVIDER',
      reason: 'WAITING_PROVIDER — provider marked unavailable.',
      state: 'WAITING_PROVIDER',
    };
  }

  if (!device.available && !isPhysicalQpuCandidate(device.routeClass)) {
    return {
      ok: false,
      gate: 'DEVICE',
      reason: 'WAITING_NODE — device not available.',
      state: 'WAITING_NODE',
    };
  }

  return { ok: true };
}

export function gateAllowedClasses(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  if (!request.allowedRouteClasses.includes(device.routeClass)) {
    return {
      ok: false,
      gate: 'POLICY',
      reason: `ROUTE_DENIED — route class ${device.routeClass} not in allowedRouteClasses.`,
      state: 'ROUTE_DENIED',
    };
  }
  return { ok: true };
}

export function gatePhysicalQpuApproval(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
): GateResult {
  if (!isPhysicalQpuCandidate(device.routeClass)) return { ok: true };

  // May recommend PHYSICAL_QPU_CANDIDATE; may NOT buy/submit/commit.
  void EX7_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY;
  void EX7_LOCKS.SUBMIT_COST_BEARING_JOBS_AUTONOMOUSLY;
  void EX7_LOCKS.CREATE_FINANCIAL_COMMITMENTS;

  if (
    request.costBearingPhysicalQpu ||
    request.humanApprovalRequired ||
    (device.estimatedCost != null && device.estimatedCost > 0) ||
    (request.estimatedExternalCost != null && request.estimatedExternalCost > 0)
  ) {
    return {
      ok: false,
      gate: 'HUMAN_APPROVAL',
      reason:
        'HUMAN_APPROVAL_REQUIRED — cost-bearing physical QPU cannot be submitted autonomously.',
      state: 'HUMAN_APPROVAL_REQUIRED',
    };
  }

  return { ok: true };
}

export function gateRemoteReason(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
  remoteReason: string | null,
): GateResult {
  if (isRemoteRoute(device) && !remoteReason) {
    return {
      ok: false,
      gate: 'LOCALITY',
      reason: 'ROUTE_DENIED — remote route requires explicit remote reason.',
      state: 'ROUTE_DENIED',
    };
  }
  if (request.localOnly && isRemoteRoute(device)) {
    return {
      ok: false,
      gate: 'LOCALITY',
      reason: 'ROUTE_DENIED — localOnly=true blocks remote routes.',
      state: 'ROUTE_DENIED',
    };
  }
  return { ok: true };
}

/**
 * Evaluate all policy gates for one device/route candidate.
 * Policy failure overrides any score.
 */
export function evaluateDeviceGates(
  request: HybridExecutionRequest,
  device: HardwareDeviceRecord,
  remoteReason: string | null,
): GateResult {
  const gates = [
    gateAllowedClasses(request, device),
    gateDataPrivacy(request, device),
    gateEvidence(request, device),
    gateCostLatency(request, device),
    gateOfflineAndProvider(request, device),
    gateRemoteReason(request, device, remoteReason),
    gatePhysicalQpuApproval(request, device),
  ];
  for (const g of gates) {
    if (!g.ok) return g;
  }
  return { ok: true };
}

export function partitionCandidates(
  request: HybridExecutionRequest,
  devices: readonly HardwareDeviceRecord[],
  remoteReasons: Readonly<Record<string, string | null>> = {},
): {
  eligible: RouteCandidate[];
  ineligible: IneligibleRoute[];
  specialtyState: RouteState | null;
} {
  const eligible: RouteCandidate[] = [];
  const ineligible: IneligibleRoute[] = [];
  let specialtyState: RouteState | null = null;

  for (const device of devices) {
    const remoteReason = remoteReasons[device.deviceId] ?? null;
    const gate = evaluateDeviceGates(request, device, remoteReason);
    const candidateId = `${device.routeClass}:${device.deviceId}`;
    if (!gate.ok) {
      ineligible.push({
        candidateId,
        routeClass: device.routeClass,
        deviceId: device.deviceId,
        reason: gate.reason,
        gate: gate.gate,
      });
      if (
        gate.state === 'WAITING_PROVIDER' ||
        gate.state === 'WAITING_DATA' ||
        gate.state === 'HUMAN_APPROVAL_REQUIRED' ||
        gate.state === 'WAITING_NODE' ||
        gate.state === 'RESOURCE_LIMITED'
      ) {
        specialtyState = specialtyState ?? gate.state;
      }
      continue;
    }

    eligible.push({
      candidateId,
      routeClass: device.routeClass,
      device,
      localFirstTier: localFirstTier(device),
      remoteReason: isRemoteRoute(device) ? remoteReason : null,
    });
  }

  return { eligible, ineligible, specialtyState };
}

export function localFirstTier(device: HardwareDeviceRecord): number {
  const { routeClass, locality, evidenceState } = device;
  if (locality === 'LOCAL' && evidenceState === 'VERIFIED' && isClassicalLocal(routeClass)) {
    if (routeClass === 'CLASSICAL_CPU') return LOCAL_FIRST_CPU;
    return LOCAL_FIRST_ACCEL;
  }
  if (locality === 'LOCAL' && isQuantumInspired(routeClass)) return LOCAL_FIRST_QI;
  if (locality === 'LOCAL' && isSimulatedQuantum(routeClass) && evidenceState === 'VERIFIED') {
    return LOCAL_FIRST_SIM;
  }
  if (locality === 'REMOTE' && isClassicalLocal(routeClass)) return LOCAL_FIRST_REMOTE_CLASSICAL;
  if (isPhysicalQpuCandidate(routeClass)) return LOCAL_FIRST_QPU;
  return 99;
}

const LOCAL_FIRST_CPU = 1;
const LOCAL_FIRST_ACCEL = 2;
const LOCAL_FIRST_QI = 3;
const LOCAL_FIRST_SIM = 4;
const LOCAL_FIRST_REMOTE_CLASSICAL = 5;
const LOCAL_FIRST_QPU = 6;

export function assertBaselineForAdvantage(
  baselinePresent: boolean,
): { allowed: false; reason: string; state: 'INSUFFICIENT_EVIDENCE' } | { allowed: true } {
  if (!baselinePresent) {
    return {
      allowed: false,
      reason:
        'INSUFFICIENT_EVIDENCE — missing EX2 baseline; no advantage claim permitted.',
      state: 'INSUFFICIENT_EVIDENCE',
    };
  }
  // Even with baseline, EX7 never auto-allows advantage claims.
  return { allowed: true };
}
