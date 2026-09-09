/**
 * EW6 workload routing — agents request capabilities, not brands.
 * Eligible paths only. Do not select NOT_TESTED when VERIFIED required.
 * Stale benchmarks lower eligibility.
 */

import {
  EW6_LOCKS,
  satisfiesMinimumState,
  type EvidenceState,
  type PrivacyClass,
  type TenantScope,
} from './types.ts';
import type { CapabilityGraph, CapabilityNode } from './graph.ts';
import { deviceNodeId, runtimeNodeId, workloadNodeId } from './graph.ts';

export type CapabilityRequest = {
  requestId: string;
  /** Capability flags — not vendor brands. */
  localOnly?: boolean;
  onnxCompatible?: boolean;
  memoryRequiredMb?: number;
  latencyPriority?: 'LOW' | 'NORMAL' | 'HIGH';
  privacy?: PrivacyClass;
  minimumState: EvidenceState;
  preferredAcceleratorClasses?: readonly ('CPU' | 'GPU' | 'NPU' | 'OTHER_ACCELERATOR')[];
  workloadId: string;
  workloadLabel: string;
  scope: TenantScope;
};

export type EligiblePath = {
  pathId: string;
  workloadNodeId: string;
  runtimeNodeId: string;
  deviceNodeId: string;
  vendor: string;
  acceleratorClass: string;
  evidenceState: EvidenceState;
  confidence: number;
  freshness: number;
  pathwayWeight: number;
  eligibilityScore: number;
  reasons: readonly string[];
};

export type RoutingResult = {
  requestId: string;
  eligible: readonly EligiblePath[];
  excluded: readonly {
    deviceNodeId: string;
    reason: string;
    evidenceState?: EvidenceState;
  }[];
};

function eligibilityScore(node: CapabilityNode, req: CapabilityRequest): number {
  let score = node.pathwayWeight * 10 + node.confidence * 5 + node.freshness * 3;
  if (req.latencyPriority === 'HIGH' && node.acceleratorClass === 'GPU') {
    score += 2;
  }
  if (node.evidenceState === 'VERIFIED') score += 20;
  if (node.evidenceState === 'STALE') score -= 25;
  if (node.evidenceState === 'NOT_TESTED') score -= 10;
  if (node.evidenceState === 'DEGRADED') score -= 15;
  return score;
}

/**
 * Route by capability. Hard exclusions for minimumState / stale / privacy.
 */
export function routeCapabilities(
  graph: CapabilityGraph,
  request: CapabilityRequest,
): RoutingResult {
  const devices = graph.listNodes(request.scope, 'DeviceNode');
  const runtimes = graph.listNodes(request.scope, 'RuntimeNode');

  const excluded: RoutingResult['excluded'] = [];
  const eligible: EligiblePath[] = [];

  if (!devices.ok) {
    return {
      requestId: request.requestId,
      eligible: [],
      excluded: [{ deviceNodeId: '*', reason: devices.reason }],
    };
  }
  if (!runtimes.ok) {
    return {
      requestId: request.requestId,
      eligible: [],
      excluded: [{ deviceNodeId: '*', reason: runtimes.reason }],
    };
  }

  // Register workload node (XIV workload genome hook).
  const wlId = workloadNodeId(request.scope, request.workloadId);
  graph.putNode({
    id: wlId,
    kind: 'WorkloadNode',
    version: '2.0.0',
    source: 'ew6-routing',
    sourceDate: new Date().toISOString(),
    orgId: request.scope.orgId,
    tenantId: request.scope.tenantId,
    universeId: request.scope.universeId,
    evidenceState: 'DOCUMENTED',
    confidence: 0.7,
    freshness: 1,
    benchmarkRefs: [],
    knownLimitations: [],
    lastVerifiedAt: null,
    label: request.workloadLabel,
    localOnlyCapable: request.localOnly,
    onnxCompatible: request.onnxCompatible,
    memoryMb: request.memoryRequiredMb,
    privacy: request.privacy,
    pathwayWeight: 1,
    retestPriority: 0,
  });

  for (const device of devices.value) {
    const reasons: string[] = [];

    if (request.privacy === 'TENANT_PRIVATE' && device.tenantId !== request.scope.tenantId) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'PRIVACY_TENANT_PRIVATE_CROSS_TENANT',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    // Stale benchmarks lower eligibility before minimum-state matching.
    if (device.evidenceState === 'STALE' || device.freshness < 0.5) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'STALE_BENCHMARK_LOWERS_ELIGIBILITY',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (!satisfiesMinimumState(device.evidenceState, request.minimumState)) {
      // Explicit: DOCUMENTED/DETECTED/NOT_TESTED cannot satisfy VERIFIED.
      let reason = `MINIMUM_STATE_NOT_MET:have=${device.evidenceState}:need=${request.minimumState}`;
      if (
        request.minimumState === 'VERIFIED' &&
        (device.evidenceState === 'DOCUMENTED' ||
          device.evidenceState === 'DETECTED' ||
          device.evidenceState === 'SUPPORTED' ||
          device.evidenceState === 'NOT_TESTED')
      ) {
        reason = `VERIFIED_REQUIRED_EXCLUDES_${device.evidenceState}`;
      }
      excluded.push({
        deviceNodeId: device.id,
        reason,
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (device.evidenceState === 'REVOKED' || device.evidenceState === 'UNAVAILABLE') {
      excluded.push({
        deviceNodeId: device.id,
        reason: `STATE_${device.evidenceState}`,
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (request.localOnly && device.localOnlyCapable === false) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'LOCAL_ONLY_REQUIRED',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (
      request.onnxCompatible &&
      device.onnxCompatible === false
    ) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'ONNX_COMPAT_REQUIRED',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (
      request.memoryRequiredMb != null &&
      (device.memoryMb ?? 0) < request.memoryRequiredMb
    ) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'INSUFFICIENT_MEMORY',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    if (
      request.preferredAcceleratorClasses &&
      request.preferredAcceleratorClasses.length > 0 &&
      device.acceleratorClass &&
      !request.preferredAcceleratorClasses.includes(device.acceleratorClass)
    ) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'ACCELERATOR_CLASS_FILTER',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    // Pick a compatible runtime (capability, not brand).
    const runtime =
      runtimes.value.find((r) => {
        if (request.onnxCompatible && r.onnxCompatible === false) return false;
        if (
          request.minimumState === 'VERIFIED' &&
          !satisfiesMinimumState(r.evidenceState, 'DOCUMENTED')
        ) {
          return false;
        }
        return true;
      }) ?? runtimes.value[0];

    if (!runtime) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'NO_COMPATIBLE_RUNTIME',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    reasons.push('CAPABILITY_MATCH');
    if (device.evidenceState === 'VERIFIED') {
      reasons.push('RUNTIME_EVIDENCE_VERIFIED');
    }

    const score = eligibilityScore(device, request);
    // Stale already excluded; low freshness still reduces score.
    if (device.freshness < 0.5) {
      excluded.push({
        deviceNodeId: device.id,
        reason: 'STALE_BENCHMARK_LOWERS_ELIGIBILITY',
        evidenceState: device.evidenceState,
      });
      continue;
    }

    eligible.push({
      pathId: `${request.requestId}:${device.id}`,
      workloadNodeId: wlId,
      runtimeNodeId: runtime.id,
      deviceNodeId: device.id,
      vendor: device.vendor ?? 'UNKNOWN',
      acceleratorClass: device.acceleratorClass ?? 'OTHER_ACCELERATOR',
      evidenceState: device.evidenceState,
      confidence: device.confidence,
      freshness: device.freshness,
      pathwayWeight: device.pathwayWeight,
      eligibilityScore: score,
      reasons,
    });
  }

  eligible.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

  // Hard rule check: never return NOT_TESTED when VERIFIED required.
  if (request.minimumState === 'VERIFIED' && !EW6_LOCKS.NOT_TESTED_EQ_VERIFIED) {
    for (const path of eligible) {
      if (path.evidenceState !== 'VERIFIED') {
        throw new Error(
          `INVARIANT_BROKEN: non-VERIFIED path returned under VERIFIED requirement (${path.evidenceState})`,
        );
      }
    }
  }

  return {
    requestId: request.requestId,
    eligible,
    excluded,
  };
}

export function selectBestPath(
  result: RoutingResult,
): EligiblePath | null {
  return result.eligible[0] ?? null;
}

/** Convenience ids for tests. */
export { deviceNodeId, runtimeNodeId, workloadNodeId };
