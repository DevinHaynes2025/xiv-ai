/**
 * 62L-DS Executive Operating Cadence —
 * Shared cadence/controls; human control over consequential decisions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DS_LOCKS,
  EXECUTIVE_CADENCE_HUMAN_CONTROL,
  HONESTY_BANNER,
  MAX_CADENCE_ITEMS,
  type ConsequentialCommercialAction,
  type DsActor,
  isFounderOrHumanApprover,
} from './revenue-intelligence-os-types';

export type CadenceRhythm = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type CadenceItem = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  title: string;
  rhythm: CadenceRhythm;
  humanControlled: true;
  digitalTwinEqFounder: false;
  createdAt: string;
};

export type CadenceDecisionAttempt = {
  id: string;
  cadenceItemId: string;
  action: ConsequentialCommercialAction;
  status: 'denied' | 'human_approved_advisory';
  reason: string;
  at: string;
};

type Store = { items: CadenceItem[]; decisions: CadenceDecisionAttempt[] };

function storePath(root: string) {
  return xivLocalPath(root, 'executive-operating-cadence.json');
}
async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { items: [], decisions: [] });
}
async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}
function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function executiveOperatingCadenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    humanControlRequired: true as const,
    digitalTwinEqFounder: DS_LOCKS.DIGITAL_TWIN_EQ_FOUNDER,
    l4AutonomyEnabled: DS_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function scheduleCadenceItem(input: {
  title: string;
  rhythm: CadenceRhythm;
  root: string;
  actor: DsActor;
}): Promise<CadenceItem> {
  const store = await load(input.root);
  if (store.items.length >= MAX_CADENCE_ITEMS) throw new Error('MAX_CADENCE_ITEMS_REACHED');
  const item: CadenceItem = {
    id: id('cad'),
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    title: input.title,
    rhythm: input.rhythm,
    humanControlled: true,
    digitalTwinEqFounder: false,
    createdAt: new Date().toISOString(),
  };
  store.items.push(item);
  await save(input.root, store);
  return item;
}

export async function attemptConsequentialCadenceDecision(input: {
  cadenceItemId: string;
  action: ConsequentialCommercialAction;
  root: string;
  actor: DsActor;
}): Promise<CadenceDecisionAttempt> {
  const store = await load(input.root);
  const humanOk = isFounderOrHumanApprover(input.actor);
  const attempt: CadenceDecisionAttempt = {
    id: id('cadd'),
    cadenceItemId: input.cadenceItemId,
    action: input.action,
    status: humanOk ? 'human_approved_advisory' : 'denied',
    reason: humanOk
      ? 'HUMAN_CONTROL_ADVISORY_NOT_AUTO_EXECUTE'
      : EXECUTIVE_CADENCE_HUMAN_CONTROL,
    at: new Date().toISOString(),
  };
  if (input.actor.kind === 'virtual_ceo' || input.actor.kind === 'agent') {
    attempt.status = 'denied';
    attempt.reason = 'DIGITAL_TWIN_NEQ_FOUNDER_CONSEQUENTIAL_DENIED';
  }
  store.decisions.push(attempt);
  await save(input.root, store);
  return attempt;
}
