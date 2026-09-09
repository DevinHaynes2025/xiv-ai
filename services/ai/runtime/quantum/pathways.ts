/**
 * 62L-EX2 — Neural pathways + COMPARISON_EDGE.
 *
 * Problem→Classical Method→Runtime→Hardware→Benchmark→Outcome
 * Problem→Candidate Quantum Method→… connected by COMPARISON_EDGE.
 *
 * Learning may change route ranking/confidence/retest — never permissions /
 * Guardian / RLS / tenant / Universe / production.
 */

import type {
  ComparabilityReceipt,
  ComparisonEdge,
} from './types.ts';
import { EX2_LOCKS } from './types.ts';

export const CLASSICAL_PATHWAY_HOPS = [
  'Problem',
  'ClassicalMethod',
  'Runtime',
  'Hardware',
  'Benchmark',
  'Outcome',
] as const;

export const CANDIDATE_PATHWAY_HOPS = [
  'Problem',
  'CandidateQuantumMethod',
  'Runtime',
  'Hardware',
  'Benchmark',
  'Outcome',
] as const;

export type PathwayRecord = {
  pathwayId: string;
  kind: 'CLASSICAL' | 'CANDIDATE_QUANTUM';
  hops: readonly string[];
  rankingWeight: number;
  confidence: number;
  retestRecommended: boolean;
};

export type PathwayLearningUpdate = {
  pathwayId: string;
  rankingWeight: number;
  confidence: number;
  retestRecommended: boolean;
  /** Explicitly never mutates authz surfaces. */
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
  tenantChanged: false;
  universeChanged: false;
  productionChanged: false;
};

export function createClassicalPathway(pathwayId: string): PathwayRecord {
  return {
    pathwayId,
    kind: 'CLASSICAL',
    hops: CLASSICAL_PATHWAY_HOPS,
    rankingWeight: 1,
    confidence: 0.5,
    retestRecommended: false,
  };
}

export function createCandidatePathway(pathwayId: string): PathwayRecord {
  return {
    pathwayId,
    kind: 'CANDIDATE_QUANTUM',
    hops: CANDIDATE_PATHWAY_HOPS,
    rankingWeight: 1,
    confidence: 0.5,
    retestRecommended: false,
  };
}

export function connectComparisonEdge(input: {
  edgeId: string;
  classicalPathwayId: string;
  candidatePathwayId: string;
  comparability: ComparabilityReceipt;
}): ComparisonEdge {
  return {
    edgeId: input.edgeId,
    kind: 'COMPARISON_EDGE',
    classicalPathwayId: input.classicalPathwayId,
    candidatePathwayId: input.candidatePathwayId,
    comparability: input.comparability.comparisonState,
    confidence: input.comparability.confidence,
    evidenceRefs: input.comparability.evidenceRefs,
    freshness: input.comparability.freshness,
    reproducibility: input.comparability.reproducibility,
  };
}

/**
 * Learning update — ranking/confidence/retest only.
 */
export function applyPathwayLearning(input: {
  pathway: PathwayRecord;
  rankingWeight: number;
  confidence: number;
  retestRecommended: boolean;
}): { pathway: PathwayRecord; update: PathwayLearningUpdate } {
  if (EX2_LOCKS.BROADEN_PERMISSIONS || EX2_LOCKS.WEAKEN_GUARDIAN_RLS) {
    throw new Error('EX2_LOCK_VIOLATION');
  }
  const pathway: PathwayRecord = {
    ...input.pathway,
    rankingWeight: input.rankingWeight,
    confidence: input.confidence,
    retestRecommended: input.retestRecommended,
  };
  return {
    pathway,
    update: {
      pathwayId: pathway.pathwayId,
      rankingWeight: pathway.rankingWeight,
      confidence: pathway.confidence,
      retestRecommended: pathway.retestRecommended,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
      tenantChanged: false,
      universeChanged: false,
      productionChanged: false,
    },
  };
}
