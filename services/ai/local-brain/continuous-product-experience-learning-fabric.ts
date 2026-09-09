/**
 * 62L-DJ Continuous Product Experience Learning Fabric —
 * Propose reversible UX improvements from consented feedback and outcomes.
 * Learning ≠ self-grant authority; proposals reversible.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DJ_LOCKS,
  HONESTY_BANNER,
  MAX_UX_PROPOSALS,
  UX_SELF_GRANT_DENIED,
  type DjActor,
} from './personal-intelligence-command-os-types';

export type ContinuousUxLearningFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type UxImprovementProposal = {
  id: string;
  fabricId: string;
  summary: string;
  consentedFeedback: boolean;
  reversible: true;
  selfGrantAuthorityAttempted: boolean;
  status: 'PROPOSED' | 'REVERSED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  fabrics: ContinuousUxLearningFabric[];
  proposals: UxImprovementProposal[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'continuous-product-experience-learning-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { fabrics: [], proposals: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function continuousProductExperienceLearningFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    uxLearningSelfGrantsAuthority: DJ_LOCKS.UX_LEARNING_SELF_GRANTS_AUTHORITY,
    uxImprovementProposalsReversible: DJ_LOCKS.UX_IMPROVEMENT_PROPOSALS_REVERSIBLE,
    learningEqSelfGrantAuthority: DJ_LOCKS.LEARNING_EQ_SELF_GRANT_AUTHORITY,
    productionAuthorization: DJ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function bootstrapContinuousProductExperienceLearningFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DjActor;
}): Promise<ContinuousUxLearningFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: ContinuousUxLearningFabric = {
    id: id('djux'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function proposeUxImprovement(input: {
  fabricId: string;
  summary: string;
  consentedFeedback?: boolean;
  selfGrantAuthority?: boolean;
  root: string;
  actor: DjActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  proposal?: UxImprovementProposal;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'UX_LEARNING_FABRIC_NOT_FOUND', at: now };
  if (store.proposals.length >= MAX_UX_PROPOSALS) {
    return { accepted: false, reason: 'MAX_UX_PROPOSALS_BOUNDED', at: now };
  }

  if (input.selfGrantAuthority === true) {
    const proposal: UxImprovementProposal = {
      id: id('djprop'),
      fabricId: fabric.id,
      summary: input.summary.trim() || 'empty',
      consentedFeedback: input.consentedFeedback === true,
      reversible: true,
      selfGrantAuthorityAttempted: true,
      status: 'DENIED',
      reason: UX_SELF_GRANT_DENIED,
      at: now,
    };
    store.proposals.push(proposal);
    await save(input.root, store);
    return { accepted: false, reason: UX_SELF_GRANT_DENIED, proposal, at: now };
  }

  if (input.consentedFeedback !== true) {
    return {
      accepted: false,
      reason: 'UX_IMPROVEMENT_REQUIRES_CONSENTED_FEEDBACK',
      at: now,
    };
  }

  const proposal: UxImprovementProposal = {
    id: id('djprop'),
    fabricId: fabric.id,
    summary: input.summary.trim() || 'empty',
    consentedFeedback: true,
    reversible: true,
    selfGrantAuthorityAttempted: false,
    status: 'PROPOSED',
    reason: 'UX_IMPROVEMENT_PROPOSAL_REVERSIBLE_RECORDED',
    at: now,
  };
  store.proposals.push(proposal);
  await save(input.root, store);
  return { accepted: true, reason: proposal.reason, proposal, at: now };
}

export async function reverseUxImprovement(input: {
  proposalId: string;
  root: string;
  actor: DjActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  proposal?: UxImprovementProposal;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const proposal = store.proposals.find((p) => p.id === input.proposalId);
  if (!proposal) return { accepted: false, reason: 'UX_PROPOSAL_NOT_FOUND', at: now };
  if (proposal.status === 'DENIED') {
    return { accepted: false, reason: 'DENIED_PROPOSAL_NOT_REVERSIBLE_AS_APPLIED', at: now };
  }
  proposal.status = 'REVERSED';
  proposal.reason = 'UX_IMPROVEMENT_PROPOSAL_REVERSED';
  proposal.at = now;
  await save(input.root, store);
  return { accepted: true, reason: proposal.reason, proposal, at: now };
}
