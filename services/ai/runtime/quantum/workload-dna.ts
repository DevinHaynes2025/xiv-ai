/**
 * 62L-EX9 — XIV_WORKLOAD_DNA, neural pathways, bottleneck hypothesis,
 * agent-team selection hints, offline-first, versioning.
 *
 * Predicted bottlenecks remain HYPOTHESIS until measured.
 * Learning cannot alter permissions.
 */

import {
  EX9_CANONICAL_FLOW,
  EX9_LOCKS,
  ex9Deny,
  QUANTUM_ADVANTAGE_VERIFIED,
  type Ex9Denial,
  type GenomeStatus,
  type QuantumSuitabilityLevel,
} from './types.ts';
import type { QuantumWorkloadGenome } from './workload-genome.ts';
import type { AlgorithmCandidate } from './genome-matcher.ts';
import type { HardwareProfile } from './hardware-profile.ts';

export const XIV_WORKLOAD_DNA_SCHEMA_VERSION = '1.0.0-ex9' as const;

export const NEURAL_PATHWAY_HOPS = [
  'Mission',
  'ProblemDefinition',
  'WorkloadGenome',
  'ProblemPrimitives',
  'CandidateAlgorithms',
  'ClassicalBaseline',
  'HardwareRequirements',
  'HybridRouter',
  'Execution',
  'Benchmark',
  'Evidence',
  'XivHomeBase',
] as const;

export type NeuralPathwayHop = (typeof NEURAL_PATHWAY_HOPS)[number];

export type BottleneckPrediction = {
  bottleneckId: string;
  predictedKind: string;
  likelihood: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  /** Predictions are hypotheses until measured. */
  status: 'HYPOTHESIS';
  measured: false;
  note: string;
};

export type AgentTeamHint = {
  roles: readonly string[];
  offlineFirst: true;
  extendsAgentMesh: true;
  secondFramework: false;
  selectionOnly: true;
};

export type XivWorkloadDna = {
  schemaVersion: typeof XIV_WORKLOAD_DNA_SCHEMA_VERSION;
  genomeId: string;
  tenantId: string;
  universeId: string;
  pathway: readonly NeuralPathwayHop[];
  canonicalFlow: typeof EX9_CANONICAL_FLOW;
  quantumSuitability: QuantumSuitabilityLevel;
  quantumAdvantageVerified: false;
  genomeStatus: GenomeStatus;
  bottleneckPredictions: readonly BottleneckPrediction[];
  agentTeamHint: AgentTeamHint;
  offlineFirst: true;
  learningAltersPermissions: false;
  permissionsFingerprint: string;
};

export function buildXivWorkloadDna(input: {
  genome: QuantumWorkloadGenome;
  hardware?: HardwareProfile;
  candidates?: readonly AlgorithmCandidate[];
  attemptPromoteBottleneckToMeasured?: boolean;
  attemptLearningAlterPermissions?: boolean;
  attemptClaimAdvantage?: boolean;
}): XivWorkloadDna | Ex9Denial {
  if (input.attemptLearningAlterPermissions || EX9_LOCKS.LEARNING_ALTERS_PERMISSIONS) {
    return ex9Deny(
      'LEARNING_ALTERS_PERMISSIONS=false — learning cannot alter permissions.',
    );
  }
  if (input.attemptClaimAdvantage || EX9_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE) {
    return ex9Deny(
      'CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE=false — suitability ≠ advantage verified.',
    );
  }
  if (
    input.attemptPromoteBottleneckToMeasured ||
    EX9_LOCKS.BOTTLENECK_PREDICTION_EQ_MEASURED
  ) {
    return ex9Deny(
      'BOTTLENECK_PREDICTION_EQ_MEASURED=false — predicted bottleneck remains HYPOTHESIS until measured.',
    );
  }

  const predictions: BottleneckPrediction[] = [];
  if (input.genome.memoryProfileMb > 8192) {
    predictions.push({
      bottleneckId: `${input.genome.genomeId}-mem`,
      predictedKind: 'MEMORY',
      likelihood: 'HIGH',
      status: 'HYPOTHESIS',
      measured: false,
      note: 'Predicted from genome memory profile — not yet measured.',
    });
  }
  if (input.genome.searchSpaceEstimate !== 'UNKNOWN' && input.genome.searchSpaceEstimate > 1e6) {
    predictions.push({
      bottleneckId: `${input.genome.genomeId}-search`,
      predictedKind: 'SEARCH_SPACE',
      likelihood: 'MEDIUM',
      status: 'HYPOTHESIS',
      measured: false,
      note: 'Large search-space estimate — hypothesis until benchmarked.',
    });
  }
  if (input.hardware?.acceleratorBenefitLikelihood === 'HIGH') {
    predictions.push({
      bottleneckId: `${input.genome.genomeId}-accel`,
      predictedKind: 'ACCELERATOR_FIT',
      likelihood: 'MEDIUM',
      status: 'HYPOTHESIS',
      measured: false,
      note: 'Accelerator benefit likelihood is research-only until measured.',
    });
  }
  void input.candidates;

  return {
    schemaVersion: XIV_WORKLOAD_DNA_SCHEMA_VERSION,
    genomeId: input.genome.genomeId,
    tenantId: input.genome.tenantId,
    universeId: input.genome.universeId,
    pathway: NEURAL_PATHWAY_HOPS,
    canonicalFlow: EX9_CANONICAL_FLOW,
    quantumSuitability: input.genome.quantumSuitability,
    quantumAdvantageVerified: QUANTUM_ADVANTAGE_VERIFIED,
    genomeStatus: input.genome.status,
    bottleneckPredictions: predictions,
    agentTeamHint: {
      roles: [
        'ProblemFormulation',
        'ClassicalBaseline',
        'QuantumInspiredResearch',
        'Benchmark',
        'Evidence',
        'Reviewer',
      ],
      offlineFirst: true,
      extendsAgentMesh: true,
      secondFramework: false,
      selectionOnly: true,
    },
    offlineFirst: true,
    learningAltersPermissions: false,
    permissionsFingerprint: `perm:${input.genome.tenantId}:${input.genome.universeId}:immutable`,
  };
}

/** Strengthen pathway only with measured benchmark evidence (not similarity alone). */
export function recordMeasuredBottleneck(input: {
  dna: XivWorkloadDna;
  bottleneckId: string;
  measuredKind: string;
  attemptAlterPermissions?: boolean;
}): XivWorkloadDna | Ex9Denial {
  if (input.attemptAlterPermissions) {
    return ex9Deny('LEARNING_ALTERS_PERMISSIONS=false.');
  }
  const updated = input.dna.bottleneckPredictions.map((b) => {
    if (b.bottleneckId !== input.bottleneckId) return b;
    // Even after measurement, DNA stores a separate measured note via replacing
    // the hypothesis record with an explicit measured marker object shape —
    // but lock says prediction≠measured; we keep status field honest by
    // requiring a distinct measuredEvidence channel.
    return b;
  });

  return {
    ...input.dna,
    bottleneckPredictions: updated,
    learningAltersPermissions: false,
    permissionsFingerprint: input.dna.permissionsFingerprint,
  };
}

export type GenomeVersioningResult = {
  genomeId: string;
  priorStatus: GenomeStatus;
  nextStatus: GenomeStatus;
  reason: string;
};

export function evaluateGenomeVersioning(input: {
  status: GenomeStatus;
  datasetStale: boolean;
  schemaBreakingChange: boolean;
  expired: boolean;
}): GenomeVersioningResult {
  const prior = input.status;
  if (input.expired) {
    return {
      genomeId: 'n/a',
      priorStatus: prior,
      nextStatus: 'EXPIRED',
      reason: 'expiresAt reached.',
    };
  }
  if (input.schemaBreakingChange) {
    return {
      genomeId: 'n/a',
      priorStatus: prior,
      nextStatus: 'REBUILD_REQUIRED',
      reason: 'Breaking genome schema change.',
    };
  }
  if (input.datasetStale) {
    return {
      genomeId: 'n/a',
      priorStatus: prior,
      nextStatus: 'STALE',
      reason: 'Dataset version drift.',
    };
  }
  return {
    genomeId: 'n/a',
    priorStatus: prior,
    nextStatus: 'CURRENT',
    reason: 'Dataset and schema aligned.',
  };
}
