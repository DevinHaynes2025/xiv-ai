/**
 * 62L-CH Adaptive Database/Memory Fabric — propose schema/index/cache/partition/
 * storage/knowledge-pack changes from measured workload evidence only.
 * recommend/test ≠ auto-alter production DBs. Candidates remain NOT_APPLIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  DB_FABRIC_NO_AUTO_APPLY,
  DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED,
  HONESTY_BANNER,
  type ChActor,
  type DbFabricChangeKind,
} from './knowledge-civilization-dept-universities-types';

export type WorkloadEvidence = {
  id: string;
  metric: string;
  value: number;
  measuredAt: string;
  source: string;
};

export type DbFabricProposal = {
  id: string;
  kind: DbFabricChangeKind;
  summary: string;
  evidenceIds: string[];
  status: 'candidate' | 'rejected' | 'recommendation_only' | 'not_applied';
  reason: string;
  autoApplied: false;
  productionAltered: false;
  verified: false;
  createdAt: string;
};

export type AutoApplyAttempt = {
  id: string;
  proposalId: string;
  denied: true;
  reason: string;
  at: string;
};

type Store = {
  evidence: WorkloadEvidence[];
  proposals: DbFabricProposal[];
  autoApplies: AutoApplyAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'adaptive-database-memory-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    evidence: [],
    proposals: [],
    autoApplies: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dbFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    autoAlterProductionDb: CH_LOCKS.AUTO_ALTER_PRODUCTION_DB,
    proposalRequiresMeasuredWorkload: CH_LOCKS.DB_PROPOSAL_REQUIRES_MEASURED_WORKLOAD,
    candidatesAutoApplied: CH_LOCKS.DB_CANDIDATES_AUTO_APPLIED,
    liveSupabaseApply: CH_LOCKS.LIVE_SUPABASE_APPLY,
  };
}

export async function recordWorkloadEvidence(input: {
  metric: string;
  value: number;
  source: string;
  root: string;
  actor: ChActor;
}): Promise<WorkloadEvidence> {
  const store = await load(input.root);
  const evidence: WorkloadEvidence = {
    id: id('wle'),
    metric: input.metric,
    value: input.value,
    measuredAt: new Date().toISOString(),
    source: input.source,
  };
  void input.actor;
  store.evidence.push(evidence);
  await save(input.root, store);
  return evidence;
}

export async function proposeDbFabricChange(input: {
  kind: DbFabricChangeKind;
  summary: string;
  evidenceIds?: string[];
  root: string;
  actor: ChActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  proposal: DbFabricProposal | null;
  verified: false;
}> {
  const store = await load(input.root);
  const evidenceIds = input.evidenceIds ?? [];
  const matched = store.evidence.filter((e) => evidenceIds.includes(e.id));

  if (evidenceIds.length === 0 || matched.length === 0) {
    const rejected: DbFabricProposal = {
      id: id('dbp'),
      kind: input.kind,
      summary: input.summary,
      evidenceIds,
      status: 'rejected',
      reason: DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED,
      autoApplied: false,
      productionAltered: false,
      verified: false,
      createdAt: new Date().toISOString(),
    };
    store.proposals.push(rejected);
    await save(input.root, store);
    void input.actor;
    return {
      accepted: false,
      reason: DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED,
      proposal: rejected,
      verified: false,
    };
  }

  const proposal: DbFabricProposal = {
    id: id('dbp'),
    kind: input.kind,
    summary: input.summary,
    evidenceIds: matched.map((e) => e.id),
    status: 'recommendation_only',
    reason: 'DB_FABRIC_CANDIDATE_RECOMMENDATION_ONLY_NOT_APPLIED',
    autoApplied: false,
    productionAltered: false,
    verified: false,
    createdAt: new Date().toISOString(),
  };
  store.proposals.push(proposal);
  await save(input.root, store);
  return {
    accepted: true,
    reason: proposal.reason,
    proposal,
    verified: false,
  };
}

export async function attemptAutoApplyProductionSchema(input: {
  proposalId: string;
  root: string;
  actor: ChActor;
}): Promise<{
  applied: false;
  denied: true;
  reason: string;
  productionAltered: false;
  status: 'NOT_APPLIED';
}> {
  const store = await load(input.root);
  const proposal = store.proposals.find((p) => p.id === input.proposalId);
  const attempt: AutoApplyAttempt = {
    id: id('aap'),
    proposalId: input.proposalId,
    denied: true,
    reason: DB_FABRIC_NO_AUTO_APPLY,
    at: new Date().toISOString(),
  };
  store.autoApplies.push(attempt);
  if (proposal) {
    proposal.status = 'not_applied';
    proposal.autoApplied = false;
    proposal.productionAltered = false;
  }
  void input.actor;
  await save(input.root, store);
  return {
    applied: false,
    denied: true,
    reason: DB_FABRIC_NO_AUTO_APPLY,
    productionAltered: false,
    status: 'NOT_APPLIED',
  };
}
