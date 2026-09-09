/**
 * 62L-EX9 — Hardware profile from genome (candidates, not winners).
 * VERIFIED requirement excludes unverified hardware.
 * QPU usefulness only with benchmark evidence; never vendor hard-code.
 */

import {
  EX9_LOCKS,
  ex9Deny,
  type Ex9Denial,
  type HardwareClass,
  type QuantumSuitabilityLevel,
} from './types.ts';
import type { QuantumWorkloadGenome } from './workload-genome.ts';

export type HardwareProfile = {
  genomeId: string;
  memoryMb: number;
  parallelism: string;
  acceleratorBenefitLikelihood: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  cpuSuitable: true;
  gpuSuitable: boolean;
  npuSuitable: boolean;
  simulatorSuitable: boolean;
  /** Research score only — not a verified usefulness claim. */
  qpuSuitabilityResearchScore: number;
  precision: string;
  locality: 'LOCAL_ONLY' | 'HYBRID_OK' | 'REMOTE_OK';
  eligibleHardware: readonly HardwareClass[];
  excludedUnverified: boolean;
  vendorHardCoded: false;
  qpuUsefulnessRequiresBenchmarkEvidence: true;
  quantumAdvantageVerified: false;
};

export type HardwareCandidateFilter = {
  requireVerified: boolean;
  available: readonly {
    class: HardwareClass;
    verified: boolean;
    vendorLabel?: string;
  }[];
};

export function deriveHardwareProfile(input: {
  genome: QuantumWorkloadGenome;
  requireVerified?: boolean;
  attemptIncludeUnverifiedWhenVerifiedRequired?: boolean;
  attemptHardCodeVendor?: boolean;
}): HardwareProfile | Ex9Denial {
  if (input.attemptHardCodeVendor || EX9_LOCKS.HARD_CODE_VENDOR_WINNER) {
    return ex9Deny(
      'HARD_CODE_VENDOR_WINNER=false — hardware profile is needs-based, not vendor-first.',
    );
  }

  const requireVerified = input.requireVerified ?? true;
  const g = input.genome;

  const gpuSuitable =
    g.parallelismProfile !== 'none' &&
    (g.matrix !== null || g.primitives.structural.includes('MATRIX'));
  const npuSuitable =
    (g.latencyTargetMs !== null && g.latencyTargetMs < 50) ||
    g.memoryProfileMb < 2048;
  const simulatorSuitable =
    g.executionClasses.includes('SIMULATED_QUANTUM') ||
    g.primitives.domainClass === 'CIRCUIT_SIMULATION' ||
    g.primitives.domainClass === 'QUANTUM_RESEARCH';

  let acceleratorBenefitLikelihood: HardwareProfile['acceleratorBenefitLikelihood'] =
    'UNKNOWN';
  if (gpuSuitable && g.memoryProfileMb > 1024) acceleratorBenefitLikelihood = 'HIGH';
  else if (gpuSuitable || npuSuitable) acceleratorBenefitLikelihood = 'MEDIUM';
  else if (g.computeProfile.includes('cpu')) acceleratorBenefitLikelihood = 'LOW';

  // Research score from suitability — never advantage.
  const suitability: QuantumSuitabilityLevel = g.quantumSuitability;
  const qpuSuitabilityResearchScore =
    suitability === 'HIGH' ? 0.7 : suitability === 'MEDIUM' ? 0.45 : suitability === 'LOW' ? 0.15 : 0;

  const eligible: HardwareClass[] = ['LOCAL_CPU'];
  if (requireVerified) {
    if (gpuSuitable) eligible.push('VERIFIED_LOCAL_GPU');
    if (npuSuitable) eligible.push('VERIFIED_LOCAL_NPU');
  } else {
    if (gpuSuitable) eligible.push('VERIFIED_LOCAL_GPU', 'UNVERIFIED_ACCELERATOR');
    if (npuSuitable) eligible.push('VERIFIED_LOCAL_NPU', 'UNVERIFIED_ACCELERATOR');
  }
  if (simulatorSuitable) eligible.push('LOCAL_QUANTUM_SIMULATOR');
  if (g.executionClasses.includes('QUANTUM_INSPIRED')) {
    eligible.push('QUANTUM_INSPIRED_CLASSICAL_RUNTIME');
  }

  if (
    input.attemptIncludeUnverifiedWhenVerifiedRequired &&
    requireVerified
  ) {
    return ex9Deny(
      'VERIFIED requirement excludes unverified hardware — UNVERIFIED_ACCELERATOR denied.',
    );
  }

  return {
    genomeId: g.genomeId,
    memoryMb: g.memoryProfileMb,
    parallelism: g.parallelismProfile,
    acceleratorBenefitLikelihood,
    cpuSuitable: true,
    gpuSuitable,
    npuSuitable,
    simulatorSuitable,
    qpuSuitabilityResearchScore,
    precision: g.precision,
    locality: g.localOnly ? 'LOCAL_ONLY' : 'HYBRID_OK',
    eligibleHardware: eligible,
    excludedUnverified: requireVerified,
    vendorHardCoded: false,
    qpuUsefulnessRequiresBenchmarkEvidence: true,
    quantumAdvantageVerified: false,
  };
}

export function filterHardwareCandidates(input: {
  profile: HardwareProfile;
  filter: HardwareCandidateFilter;
}):
  | {
      accepted: readonly HardwareClass[];
      rejectedUnverified: readonly HardwareClass[];
      vendorHardCoded: false;
    }
  | Ex9Denial {
  if (EX9_LOCKS.HARD_CODE_VENDOR_WINNER) {
    return ex9Deny('HARD_CODE_VENDOR_WINNER=false.');
  }

  const accepted: HardwareClass[] = [];
  const rejectedUnverified: HardwareClass[] = [];

  for (const item of input.filter.available) {
    // VERIFIED requirement excludes unverified hardware even if offered.
    if (input.filter.requireVerified && !item.verified) {
      rejectedUnverified.push(item.class);
      continue;
    }
    if (!input.profile.eligibleHardware.includes(item.class)) continue;
    // Ignore vendorLabel for selection — genome/needs first.
    accepted.push(item.class);
  }

  return {
    accepted,
    rejectedUnverified,
    vendorHardCoded: false,
  };
}
