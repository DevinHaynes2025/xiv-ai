/**
 * 62L-CI Autonomous Database Research Lab —
 * Sandbox DB research only; propose/test; never auto production alter.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CI_LOCKS,
  DB_LAB_PRODUCTION_APPLY_DENIED,
  HONESTY_BANNER,
  type CiActor,
} from './persistent-intelligence-economy-types';

export type DbResearchProposal = {
  id: string;
  title: string;
  sqlCandidate: string;
  sandbox: true;
  applied: false;
  productionAuthorized: false;
  status: 'SANDBOX_CANDIDATE' | 'TESTED_SANDBOX' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
};

export type DbLabResult = {
  accepted: boolean;
  reason: string;
  proposal?: DbResearchProposal;
  at: string;
};

type Store = { proposals: DbResearchProposal[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-database-research-lab.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { proposals: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dbLabHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CI_LOCKS.L4_AUTONOMY_ENABLED,
    dbLabProductionApply: CI_LOCKS.DB_LAB_PRODUCTION_APPLY,
    dbLabSandboxOnly: CI_LOCKS.DB_LAB_SANDBOX_ONLY,
    liveSupabaseApply: CI_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: CI_LOCKS.DB_CANDIDATES_APPLIED,
  };
}

export async function proposeSandboxSchemaOrMigration(input: {
  title: string;
  sqlCandidate: string;
  root: string;
  actor: CiActor;
}): Promise<DbLabResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const proposal: DbResearchProposal = {
    id: id('dblab'),
    title: input.title,
    sqlCandidate: input.sqlCandidate,
    sandbox: true,
    applied: false,
    productionAuthorized: false,
    status: 'SANDBOX_CANDIDATE',
    createdAt: now,
    updatedAt: now,
  };
  store.proposals.push(proposal);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'DB_RESEARCH_PROPOSAL_SANDBOX_ONLY',
    proposal,
    at: now,
  };
}

export async function testProposalInSandbox(input: {
  proposalId: string;
  root: string;
  actor: CiActor;
}): Promise<DbLabResult> {
  void input.actor;
  const store = await load(input.root);
  const proposal = store.proposals.find((p) => p.id === input.proposalId);
  const now = new Date().toISOString();
  if (!proposal) {
    return { accepted: false, reason: 'PROPOSAL_NOT_FOUND', at: now };
  }
  proposal.status = 'TESTED_SANDBOX';
  proposal.applied = false;
  proposal.productionAuthorized = false;
  proposal.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'DB_PROPOSAL_TESTED_IN_SANDBOX_NOT_APPLIED',
    proposal,
    at: now,
  };
}

/** Production schema/migration apply is always DENIED. */
export async function attemptApplyProductionSchemaOrMigration(input: {
  proposalId: string;
  root: string;
  actor: CiActor;
}): Promise<DbLabResult> {
  void input.actor;
  const store = await load(input.root);
  const proposal = store.proposals.find((p) => p.id === input.proposalId);
  const now = new Date().toISOString();
  if (proposal) {
    proposal.applied = false;
    proposal.productionAuthorized = false;
    proposal.sandbox = true;
    proposal.updatedAt = now;
    await save(input.root, store);
  }
  return {
    accepted: false,
    reason: DB_LAB_PRODUCTION_APPLY_DENIED,
    proposal,
    at: now,
  };
}
