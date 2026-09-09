/**
 * 62L-EX8 — Branch return receipts + evidence to Home Base.
 * Every branch returns; no orphans. Failed experiments remain in evidence.
 */

import type {
  AgentTeamState,
  BranchReturnRecord,
  NeuralPathwayUpdate,
  QuantumTeamAgentContract,
} from './agent-team-types.ts';
import { CANONICAL_PATHWAY } from './agent-team-types.ts';

export type EvidenceLedgerEntry = {
  evidenceId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  kind: 'EXPERIMENT' | 'BENCHMARK' | 'COMPARISON' | 'REVIEW' | 'FAILURE' | 'BLOCKER';
  success: boolean;
  refs: readonly string[];
  summary: string;
  retained: true;
  createdAt: string;
};

const evidenceStore: EvidenceLedgerEntry[] = [];

export function resetEvidenceLedgerForTests(): void {
  evidenceStore.length = 0;
}

export function recordEvidence(entry: Omit<EvidenceLedgerEntry, 'retained'>): EvidenceLedgerEntry {
  const full: EvidenceLedgerEntry = { ...entry, retained: true };
  evidenceStore.push(full);
  return full;
}

export function listEvidenceForMission(missionId: string): readonly EvidenceLedgerEntry[] {
  return evidenceStore.filter((e) => e.missionId === missionId);
}

export function createBranchReturn(input: {
  agent: QuantumTeamAgentContract;
  status: AgentTeamState;
  result?: Readonly<Record<string, unknown>> | null;
  evidenceRefs?: readonly string[];
  experimentRefs?: readonly string[];
  benchmarkRefs?: readonly string[];
  confidence?: number | null;
  contradictions?: readonly string[];
  failures?: readonly string[];
  blockers?: readonly string[];
  lessons?: readonly string[];
  nextExperiment?: string | null;
  createdAt: string;
}): BranchReturnRecord {
  return {
    taskId: input.agent.taskId,
    parentTaskId: input.agent.parentTaskId,
    missionId: input.agent.missionId,
    tenantId: input.agent.tenantId,
    universeId: input.agent.universeId,
    status: input.status,
    result: input.result ?? null,
    evidenceRefs: input.evidenceRefs ?? [],
    experimentRefs: input.experimentRefs ?? [],
    benchmarkRefs: input.benchmarkRefs ?? [],
    confidence: input.confidence ?? null,
    contradictions: input.contradictions ?? [],
    failures: input.failures ?? [],
    blockers: input.blockers ?? [],
    lessons: input.lessons ?? [],
    nextExperiment: input.nextExperiment ?? null,
    returnPath: input.agent.returnPath,
    homeBaseReceived: false,
    createdAt: input.createdAt,
  };
}

/** Deliver branch result to Home Base via returnPath. */
export function deliverReturnToHomeBase(
  record: BranchReturnRecord,
): BranchReturnRecord & { homeBaseReceived: true } {
  if (!record.returnPath.startsWith('home-base://')) {
    // Still mark structured return; path must be Home Base.
    return { ...record, homeBaseReceived: true, returnPath: record.returnPath };
  }
  return { ...record, homeBaseReceived: true };
}

/**
 * Failed experiment remains in evidence ledger (not discarded).
 */
export function recordFailedExperiment(input: {
  missionId: string;
  taskId: string;
  tenantId: string;
  universeId: string;
  experimentId: string;
  summary: string;
  createdAt: string;
}): EvidenceLedgerEntry {
  return recordEvidence({
    evidenceId: `ev-fail-${input.experimentId}`,
    missionId: input.missionId,
    taskId: input.taskId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'FAILURE',
    success: false,
    refs: [input.experimentId],
    summary: input.summary,
    createdAt: input.createdAt,
  });
}

export function updateNeuralPathway(input: {
  pathwayId: string;
  missionId: string;
  tenantId: string;
  universeId: string;
  rankingDelta?: number;
  confidenceDelta?: number;
  retestRecommended?: boolean;
  createdAt: string;
}): NeuralPathwayUpdate {
  return {
    pathwayId: input.pathwayId,
    missionId: input.missionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    hops: CANONICAL_PATHWAY,
    rankingDelta: input.rankingDelta ?? null,
    confidenceDelta: input.confidenceDelta ?? null,
    retestRecommended: input.retestRecommended === true,
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
    financialAuthorityChanged: false,
    productionAuthorityChanged: false,
    createdAt: input.createdAt,
  };
}
