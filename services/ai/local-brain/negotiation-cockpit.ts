/**
 * 62L-DR Negotiation Cockpit —
 * BATNA, target/walk-away, give/get, concessions, ROI, pricing scenarios,
 * contract-term comparison, objection intelligence — all advisory until founder approval.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ADVISORY_UNTIL_FOUNDER_APPROVAL,
  CONSEQUENTIAL_DEAL_DENIED,
  DR_LOCKS,
  HONESTY_BANNER,
  NEGOTIATION_COCKPIT_SURFACES,
  isFounderOrHumanApprover,
  type DrActor,
  type NegotiationCockpitSurface,
} from './enterprise-nervous-revenue-command-types';

export type NegotiationSession = {
  id: string;
  dealId: string;
  batna?: string;
  targetRange?: { low: number; high: number };
  walkAway?: number;
  giveGetPlan?: string[];
  concessions: Array<{ at: string; note: string; advisory: true }>;
  roiNotes?: string;
  pricingScenarios: Array<{ label: string; amount: number; advisory: true }>;
  contractTermComparisons: Array<{ term: string; ours: string; theirs: string; advisory: true }>;
  objections: Array<{ objection: string; response: string; advisory: true }>;
  executable: false;
  advisoryUntilFounderApproval: true;
  createdAt: string;
};

export type CockpitExecuteAttempt = {
  id: string;
  sessionId: string;
  surface: NegotiationCockpitSurface;
  status: 'denied' | 'advisory';
  reason: string;
  at: string;
};

type Store = {
  sessions: NegotiationSession[];
  executes: CockpitExecuteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'negotiation-cockpit.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { sessions: [], executes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function negotiationCockpitHonesty() {
  return {
    banner: HONESTY_BANNER,
    surfaces: NEGOTIATION_COCKPIT_SURFACES,
    autoExecute: DR_LOCKS.NEGOTIATION_COCKPIT_AUTO_EXECUTE,
    advisoryUntilFounder: true as const,
  };
}

export async function openNegotiationCockpit(input: {
  dealId: string;
  batna?: string;
  targetRange?: { low: number; high: number };
  walkAway?: number;
  root: string;
  actor: DrActor;
}): Promise<NegotiationSession> {
  const store = await load(input.root);
  void input.actor;
  const session: NegotiationSession = {
    id: id('neg'),
    dealId: input.dealId,
    batna: input.batna,
    targetRange: input.targetRange,
    walkAway: input.walkAway,
    giveGetPlan: [],
    concessions: [],
    pricingScenarios: [],
    contractTermComparisons: [],
    objections: [],
    executable: false,
    advisoryUntilFounderApproval: true,
    createdAt: new Date().toISOString(),
  };
  store.sessions.push(session);
  await save(input.root, store);
  return session;
}

export async function updateNegotiationAdvisory(input: {
  sessionId: string;
  giveGetPlan?: string[];
  concessionNote?: string;
  roiNotes?: string;
  pricingScenario?: { label: string; amount: number };
  contractTerm?: { term: string; ours: string; theirs: string };
  objection?: { objection: string; response: string };
  root: string;
  actor: DrActor;
}): Promise<NegotiationSession | null> {
  const store = await load(input.root);
  void input.actor;
  const session = store.sessions.find((s) => s.id === input.sessionId);
  if (!session) return null;
  if (input.giveGetPlan) session.giveGetPlan = input.giveGetPlan;
  if (input.concessionNote) {
    session.concessions.push({
      at: new Date().toISOString(),
      note: input.concessionNote,
      advisory: true,
    });
  }
  if (input.roiNotes) session.roiNotes = input.roiNotes;
  if (input.pricingScenario) {
    session.pricingScenarios.push({ ...input.pricingScenario, advisory: true });
  }
  if (input.contractTerm) {
    session.contractTermComparisons.push({ ...input.contractTerm, advisory: true });
  }
  if (input.objection) {
    session.objections.push({ ...input.objection, advisory: true });
  }
  await save(input.root, store);
  return session;
}

export async function attemptCockpitExecute(input: {
  sessionId: string;
  surface: NegotiationCockpitSurface;
  founderGatePresent?: boolean;
  root: string;
  actor: DrActor;
}): Promise<CockpitExecuteAttempt> {
  const store = await load(input.root);
  const founderOk =
    Boolean(input.founderGatePresent) && isFounderOrHumanApprover(input.actor);
  const attempt: CockpitExecuteAttempt = {
    id: id('ncx'),
    sessionId: input.sessionId,
    surface: input.surface,
    status: founderOk ? 'advisory' : 'denied',
    reason: founderOk ? ADVISORY_UNTIL_FOUNDER_APPROVAL : CONSEQUENTIAL_DEAL_DENIED,
    at: new Date().toISOString(),
  };
  store.executes.push(attempt);
  await save(input.root, store);
  return attempt;
}
