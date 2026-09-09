/**
 * 62L-CZ Multi-Model Cognitive Workbench —
 * Model/agent task decomposition with evidence and dissent workspaces.
 * Majority consensus does not silence dissent; consensus ≠ verified proof.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSENSUS_NOT_VERIFIED_PROOF,
  CZ_LOCKS,
  DISSENT_PRESERVED,
  HONESTY_BANNER,
  MAX_WORKBENCH_SESSIONS,
  type CzActor,
} from './intelligence-civilization-kernel-types';

export type WorkbenchContribution = {
  id: string;
  modelOrAgentId: string;
  kind: 'evidence' | 'dissent' | 'consensus_vote';
  content: string;
  at: string;
};

export type WorkbenchSession = {
  id: string;
  task: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  evidence: WorkbenchContribution[];
  dissent: WorkbenchContribution[];
  consensusVotes: WorkbenchContribution[];
  consensusReached: boolean;
  labeledVerifiedProof: boolean;
  dissentSilenced: boolean;
  status: 'OPEN' | 'CONSENSUS' | 'DISSENT_PRESERVED' | 'NOT_PROOF' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
};

export type WorkbenchResult = {
  accepted: boolean;
  reason: string;
  session?: WorkbenchSession;
  at: string;
};

type Store = { sessions: WorkbenchSession[] };

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-cognitive-workbench.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cognitiveWorkbenchHonesty() {
  return {
    banner: HONESTY_BANNER,
    consensusEqVerifiedProof: CZ_LOCKS.CONSENSUS_EQ_VERIFIED_PROOF,
    dissentSilencedByMajority: CZ_LOCKS.DISSENT_SILENCED_BY_MAJORITY,
  };
}

export async function openCognitiveWorkbench(input: {
  task: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: CzActor;
}): Promise<WorkbenchResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.sessions.length >= MAX_WORKBENCH_SESSIONS) {
    return { accepted: false, reason: 'MAX_WORKBENCH_SESSIONS_BOUNDED', at: now };
  }
  const session: WorkbenchSession = {
    id: id('wb'),
    task: input.task.trim(),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    evidence: [],
    dissent: [],
    consensusVotes: [],
    consensusReached: false,
    labeledVerifiedProof: false,
    dissentSilenced: false,
    status: 'OPEN',
    createdAt: now,
    updatedAt: now,
  };
  store.sessions.push(session);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'COGNITIVE_WORKBENCH_OPENED',
    session,
    at: now,
  };
}

export async function contributeWorkbenchEvidence(input: {
  sessionId: string;
  modelOrAgentId: string;
  content: string;
  root: string;
  actor: CzActor;
}): Promise<WorkbenchResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) return { accepted: false, reason: 'WORKBENCH_SESSION_NOT_FOUND', at: now };
  const contribution: WorkbenchContribution = {
    id: id('wbe'),
    modelOrAgentId: input.modelOrAgentId,
    kind: 'evidence',
    content: input.content,
    at: now,
  };
  session.evidence.push(contribution);
  session.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'EVIDENCE_RECORDED', session, at: now };
}

export async function contributeWorkbenchDissent(input: {
  sessionId: string;
  modelOrAgentId: string;
  content: string;
  root: string;
  actor: CzActor;
}): Promise<WorkbenchResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) return { accepted: false, reason: 'WORKBENCH_SESSION_NOT_FOUND', at: now };
  const contribution: WorkbenchContribution = {
    id: id('wbd'),
    modelOrAgentId: input.modelOrAgentId,
    kind: 'dissent',
    content: input.content,
    at: now,
  };
  session.dissent.push(contribution);
  session.dissentSilenced = false;
  session.status = 'DISSENT_PRESERVED';
  session.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: DISSENT_PRESERVED, session, at: now };
}

/**
 * Apply majority consensus. Dissent is NEVER silenced. Consensus-only output
 * cannot be labeled VERIFIED_PROOF.
 */
export async function applyWorkbenchConsensus(input: {
  sessionId: string;
  votesFor: number;
  votesAgainst: number;
  claimVerifiedProof?: boolean;
  silenceDissent?: boolean;
  root: string;
  actor: CzActor;
}): Promise<WorkbenchResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) return { accepted: false, reason: 'WORKBENCH_SESSION_NOT_FOUND', at: now };

  session.consensusVotes.push({
    id: id('wbv'),
    modelOrAgentId: 'consensus-tally',
    kind: 'consensus_vote',
    content: `for=${input.votesFor};against=${input.votesAgainst}`,
    at: now,
  });

  const majority = input.votesFor > input.votesAgainst;
  session.consensusReached = majority;

  // Dissent cannot be silenced by majority — honesty lock.
  if (input.silenceDissent === true && session.dissent.length > 0) {
    session.dissentSilenced = false;
    session.status = 'DISSENT_PRESERVED';
    session.labeledVerifiedProof = false;
    session.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: true,
      reason: DISSENT_PRESERVED,
      session,
      at: now,
    };
  }

  if (input.claimVerifiedProof === true) {
    // Consensus ≠ proof
    session.labeledVerifiedProof = false;
    session.status = 'NOT_PROOF';
    session.updatedAt = now;
    await save(input.root, store);
    return {
      accepted: false,
      reason: CONSENSUS_NOT_VERIFIED_PROOF,
      session,
      at: now,
    };
  }

  if (session.dissent.length > 0) {
    session.dissentSilenced = false;
    session.status = 'DISSENT_PRESERVED';
  } else if (majority) {
    session.status = 'CONSENSUS';
  }

  session.labeledVerifiedProof = false;
  session.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: true,
    reason: session.dissent.length > 0 ? DISSENT_PRESERVED : 'CONSENSUS_RECORDED_NOT_PROOF',
    session,
    at: now,
  };
}

export function workbenchDissentIntact(session: WorkbenchSession): boolean {
  return session.dissent.length === 0 || session.dissentSilenced === false;
}
