/**
 * 62L-EX3 — QI candidate factory, local hardware routing, pathways, wormholes.
 * Reuses EX2 selectExecutionTarget concepts; adds VERIFIED_* hardware labels + QI classification.
 */

import type { AlgorithmContract, QiHardwareClass } from './algorithm-registry.ts';
import {
  EX3_LOCKS,
  ex3Deny,
  type Ex3Denial,
  type Ex3TenantScope,
  type QiExecutionClass,
} from './ex3-types.ts';
import {
  applyPathwayLearning,
  createCandidatePathway,
  type PathwayRecord,
} from './pathways.ts';
import { selectExecutionTarget } from './baseline.ts';
import type { DeviceClass, DeviceEvidenceState } from './types.ts';

export type QiHardwareNode = {
  deviceId: string;
  hardwareClass: QiHardwareClass;
  evidenceState: DeviceEvidenceState;
};

export type QiHardwareRoute = {
  preferred: QiHardwareClass;
  actual: QiHardwareClass;
  /** Mapped EX2 device class used with selectExecutionTarget. */
  ex2DeviceClass: DeviceClass;
  fallbackUsed: boolean;
  excludedUnverified: readonly QiHardwareClass[];
  classification: QiExecutionClass;
  physicalQpuVerified: false;
  quantumAdvantageVerified: false;
  passOnActual: boolean;
  preferredRemainsNotTested: boolean;
  notes: string;
};

export const MUTATION_TYPES = [
  'PARAMETER_TUNE',
  'REPRESENTATION_CHANGE',
  'HEURISTIC_SWAP',
  'ORDERING_CHANGE',
  'PARALLELISM_TUNE',
  'BATCHING_TUNE',
  'CACHING_TUNE',
  'PRECISION_TUNE',
  'PARTITIONING_CHANGE',
  'SEARCH_STRATEGY_TUNE',
] as const;

export type MutationType = (typeof MUTATION_TYPES)[number];

export const FORBIDDEN_MUTATION_TARGETS = [
  'GUARDIAN',
  'RLS',
  'PERMISSIONS',
  'SECURITY',
  'BILLING',
  'PRODUCTION',
  'FIRMWARE',
  'BIOS',
  'VOLTAGE',
  'CLOCKS',
] as const;

export type AlgorithmCandidate = {
  candidateId: string;
  parentAlgorithmId: string;
  mutationType: MutationType;
  parametersChanged: readonly string[];
  hypothesis: string;
  expectedTradeoff: string;
  testPlan: string;
  baselineRef: string;
  preferred: false;
  createdAt: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type SoftwareWormhole = {
  wormholeId: string;
  kind: 'CACHE' | 'KERNEL' | 'INDEX' | 'SESSION_REUSE' | 'WARM_START' | 'MEMOIZATION';
  bypassesAuth: false;
  bypassesTenantIsolation: false;
  note: string;
};

export function classifyClassicalQiRun(_hw: QiHardwareClass): QiExecutionClass {
  void _hw;
  return 'QUANTUM_INSPIRED';
}

export function classicalHardwareMayClaimPhysicalQpu(_hw: QiHardwareClass): false {
  return false;
}

function toEx2DeviceClass(hw: QiHardwareClass): DeviceClass {
  if (hw.includes('GPU')) return 'GPU';
  if (hw.includes('NPU')) return 'NPU';
  return 'CPU';
}

function isVerifiedLabel(hw: QiHardwareClass): boolean {
  return hw.startsWith('VERIFIED_') || hw === 'LOCAL_CPU';
}

/**
 * Local routing with truthful CPU fallback.
 * preferred=AMD_NPU actual=CPU fallbackUsed=true → CPU may PASS; NPU stays NOT_TESTED.
 * Soft-reuses EX2 selectExecutionTarget for CPU/GPU/NPU VERIFIED gate.
 */
export function routeLocalHardware(input: {
  preferred: QiHardwareClass;
  available: readonly QiHardwareNode[];
  requireVerified?: boolean;
}): QiHardwareRoute {
  const requireVerified = input.requireVerified ?? true;
  const excluded: QiHardwareClass[] = [];

  const preferredNode = input.available.find((n) => n.hardwareClass === input.preferred);
  const preferredEx2 = toEx2DeviceClass(input.preferred);
  const preferredEvidence: DeviceEvidenceState =
    preferredNode?.evidenceState ??
    (input.preferred.startsWith('UNVERIFIED_') ? 'DETECTED' : 'NOT_TESTED');

  const ex2Target = selectExecutionTarget({
    preferred: preferredEx2,
    deviceEvidenceState: preferredEvidence,
    requireVerifiedAccelerator: requireVerified,
  });

  // Also exclude any UNVERIFIED_* nodes when VERIFIED required
  for (const node of input.available) {
    if (
      requireVerified &&
      (node.hardwareClass.startsWith('UNVERIFIED_') ||
        (node.evidenceState !== 'VERIFIED' && !isVerifiedLabel(node.hardwareClass)))
    ) {
      if (node.hardwareClass.startsWith('UNVERIFIED_') || node.evidenceState !== 'VERIFIED') {
        if (node.hardwareClass !== 'LOCAL_CPU' && node.hardwareClass !== 'VERIFIED_CPU') {
          excluded.push(node.hardwareClass);
        }
      }
    }
  }

  if (!ex2Target.cpuFallback && preferredNode && preferredNode.evidenceState === 'VERIFIED') {
    return {
      preferred: input.preferred,
      actual: preferredNode.hardwareClass,
      ex2DeviceClass: ex2Target.deviceClass,
      fallbackUsed: false,
      excludedUnverified: [...new Set(excluded)],
      classification: classifyClassicalQiRun(preferredNode.hardwareClass),
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      passOnActual: true,
      preferredRemainsNotTested: false,
      notes: ex2Target.note,
    };
  }

  // CPU fallback
  const cpuNode = input.available.find(
    (n) =>
      (n.hardwareClass === 'VERIFIED_CPU' || n.hardwareClass === 'LOCAL_CPU') &&
      n.evidenceState === 'VERIFIED',
  );
  const actual: QiHardwareClass = cpuNode?.hardwareClass ?? 'VERIFIED_CPU';
  const preferredWasNpu =
    input.preferred === 'VERIFIED_AMD_NPU' || input.preferred === 'VERIFIED_INTEL_NPU';

  if (ex2Target.excludedUnverifiedAccelerator && preferredNode) {
    excluded.push(preferredNode.hardwareClass);
  }

  return {
    preferred: input.preferred,
    actual,
    ex2DeviceClass: 'CPU',
    fallbackUsed: true,
    excludedUnverified: [...new Set(excluded)],
    classification: classifyClassicalQiRun(actual),
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    passOnActual: Boolean(cpuNode),
    preferredRemainsNotTested: preferredWasNpu || preferredEvidence === 'NOT_TESTED',
    notes: ex2Target.note,
  };
}

export function createQiCandidate(input: {
  parent: AlgorithmContract;
  mutationType: MutationType;
  parametersChanged: readonly string[];
  hypothesis: string;
  expectedTradeoff: string;
  testPlan: string;
  baselineRef: string;
  scope: Ex3TenantScope;
  forbiddenTarget?: string;
}): AlgorithmCandidate | Ex3Denial {
  if (
    input.parent.tenantId !== input.scope.tenantId ||
    input.parent.universeId !== input.scope.universeId ||
    input.parent.orgId !== input.scope.orgId
  ) {
    return ex3Deny('CROSS_TENANT_OR_UNIVERSE_DENIED — candidate creation.');
  }
  if (
    input.forbiddenTarget &&
    (FORBIDDEN_MUTATION_TARGETS as readonly string[]).includes(
      input.forbiddenTarget.toUpperCase(),
    )
  ) {
    return ex3Deny(
      `FORBIDDEN_MUTATION_TARGET: ${input.forbiddenTarget} — may not mutate Guardian/RLS/permissions/security/billing/production/firmware/BIOS/voltage/clocks.`,
    );
  }
  if (!(MUTATION_TYPES as readonly string[]).includes(input.mutationType)) {
    return ex3Deny(`UNKNOWN_MUTATION_TYPE: ${input.mutationType}`);
  }

  return {
    candidateId: `cand-${input.parent.algorithmId}-${input.mutationType.toLowerCase()}-${Date.now()}`,
    parentAlgorithmId: input.parent.algorithmId,
    mutationType: input.mutationType,
    parametersChanged: input.parametersChanged,
    hypothesis: input.hypothesis,
    expectedTradeoff: input.expectedTradeoff,
    testPlan: input.testPlan,
    baselineRef: input.baselineRef,
    preferred: false,
    createdAt: new Date().toISOString(),
    orgId: input.scope.orgId,
    tenantId: input.scope.tenantId,
    universeId: input.scope.universeId,
  };
}

export function createQiPathway(pathwayId: string): PathwayRecord {
  return createCandidatePathway(pathwayId);
}

/** Failed experiment does not strengthen pathway (uses EX2 learning API). */
export function applyQiPathwayOutcome(
  pathway: PathwayRecord,
  outcome: 'PASS' | 'FAIL' | 'REGRESSED',
): PathwayRecord {
  if (outcome === 'FAIL') {
    void EX3_LOCKS.STRENGTHEN_PATHWAY_ON_FAILURE;
    const { pathway: updated } = applyPathwayLearning({
      pathway,
      rankingWeight: pathway.rankingWeight,
      confidence: Math.max(0, pathway.confidence - 0.01),
      retestRecommended: true,
    });
    return updated;
  }
  if (outcome === 'REGRESSED') {
    const { pathway: updated } = applyPathwayLearning({
      pathway,
      rankingWeight: Math.max(0, pathway.rankingWeight - 0.2),
      confidence: Math.max(0, pathway.confidence - 0.15),
      retestRecommended: true,
    });
    return updated;
  }
  const { pathway: updated } = applyPathwayLearning({
    pathway,
    rankingWeight: pathway.rankingWeight + 0.1,
    confidence: Math.min(1, pathway.confidence + 0.1),
    retestRecommended: false,
  });
  return updated;
}

export function createSoftwareWormhole(
  kind: SoftwareWormhole['kind'],
  note: string,
): SoftwareWormhole {
  return {
    wormholeId: `wh-${kind.toLowerCase()}`,
    kind,
    bypassesAuth: false,
    bypassesTenantIsolation: false,
    note: `${note} — SOFTWARE WORMHOLE only; never bypasses auth/tenant isolation.`,
  };
}
