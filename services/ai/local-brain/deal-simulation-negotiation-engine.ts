/**
 * 62L-DS Deal Simulation & Negotiation Engine —
 * BATNA, walk-away, give/get, concessions; founder/human approval gates.
 * Sim ≠ verified outcome; negotiation ≠ auto-accept.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DEAL_SIM_NEQ_VERIFIED_FACT,
  DS_LOCKS,
  HONESTY_BANNER,
  MAX_DEAL_SIMS,
  NEGOTIATION_CONCESSION_NEEDS_FOUNDER_GATE,
  type DsActor,
  isFounderOrHumanApprover,
} from './revenue-intelligence-os-types';

export type DealSimulation = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  dealLabel: string;
  batna: string;
  walkAway: number;
  target: number;
  giveGet: string[];
  labeledSimulation: true;
  verifiedOutcome: false;
  autoAccept: false;
  createdAt: string;
};

export type ConcessionAttempt = {
  id: string;
  simulationId: string;
  concessionNote: string;
  status: 'denied' | 'advisory_pending_founder' | 'founder_approved_advisory';
  reason: string;
  at: string;
};

export type SimFactClaim = {
  id: string;
  simulationId: string;
  claimVerifiedFact: boolean;
  status: 'denied' | 'labeled_simulation';
  reason: string;
  at: string;
};

type Store = {
  sims: DealSimulation[];
  concessions: ConcessionAttempt[];
  factClaims: SimFactClaim[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'deal-simulation-negotiation-engine.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sims: [], concessions: [], factClaims: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dealSimulationNegotiationHonesty() {
  return {
    banner: HONESTY_BANNER,
    dealSimEqVerifiedFact: DS_LOCKS.DEAL_SIM_EQ_VERIFIED_FACT,
    negotiationAutoAccept: DS_LOCKS.NEGOTIATION_AUTO_ACCEPT,
    concessionWithoutFounderGate: DS_LOCKS.CONCESSION_WITHOUT_FOUNDER_GATE,
    batnaAutoCommit: DS_LOCKS.BATNA_AUTO_COMMIT,
  };
}

export async function openDealSimulation(input: {
  dealLabel: string;
  batna: string;
  walkAway: number;
  target: number;
  giveGet?: string[];
  root: string;
  actor: DsActor;
}): Promise<DealSimulation> {
  const store = await load(input.root);
  if (store.sims.length >= MAX_DEAL_SIMS) throw new Error('MAX_DEAL_SIMS_REACHED');
  const sim: DealSimulation = {
    id: id('dsim'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    dealLabel: input.dealLabel,
    batna: input.batna,
    walkAway: input.walkAway,
    target: input.target,
    giveGet: input.giveGet ?? [],
    labeledSimulation: true,
    verifiedOutcome: false,
    autoAccept: false,
    createdAt: new Date().toISOString(),
  };
  store.sims.push(sim);
  await save(input.root, store);
  return sim;
}

export async function attemptConcession(input: {
  simulationId: string;
  concessionNote: string;
  root: string;
  actor: DsActor;
}): Promise<ConcessionAttempt> {
  const store = await load(input.root);
  const founderOk = isFounderOrHumanApprover(input.actor);
  const attempt: ConcessionAttempt = {
    id: id('conc'),
    simulationId: input.simulationId,
    concessionNote: input.concessionNote,
    status: founderOk ? 'founder_approved_advisory' : 'denied',
    reason: founderOk
      ? 'FOUNDER_APPROVED_ADVISORY_NOT_AUTO_ACCEPT'
      : NEGOTIATION_CONCESSION_NEEDS_FOUNDER_GATE,
    at: new Date().toISOString(),
  };
  store.concessions.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function claimSimulationAsVerifiedFact(input: {
  simulationId: string;
  root: string;
  actor: DsActor;
}): Promise<SimFactClaim> {
  const store = await load(input.root);
  void input.actor;
  const claim: SimFactClaim = {
    id: id('simfact'),
    simulationId: input.simulationId,
    claimVerifiedFact: true,
    status: 'denied',
    reason: DEAL_SIM_NEQ_VERIFIED_FACT,
    at: new Date().toISOString(),
  };
  store.factClaims.push(claim);
  await save(input.root, store);
  return claim;
}

export async function attemptAutoAcceptDeal(input: {
  simulationId: string;
  root: string;
  actor: DsActor;
}): Promise<{ status: 'denied'; reason: string }> {
  void input;
  return { status: 'denied', reason: 'NEGOTIATION_NEQ_AUTO_ACCEPT' };
}
