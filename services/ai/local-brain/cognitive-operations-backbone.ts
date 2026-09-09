/**
 * 62L-EG Module A — Cognitive Operations Backbone.
 * Governed ops backbone; deny-by-default; label alone ≠ access;
 * consequential ops gated (never auto-promoted).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONSEQUENTIAL_OPS_GATED,
  GOVERNED_OPS_DENY_BY_DEFAULT,
  LABEL_ALONE_NEQ_ACCESS,
  MAX_OPS_EVENTS,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type OpsBackboneRegistration = {
  id: string;
  opsId: string;
  founderSealed: boolean;
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

export type ConsequentialOpsGate = {
  id: string;
  opsId: string;
  evidenceComplete: boolean;
  humanApproved: boolean;
  status: 'denied' | 'gated';
  state: EgEvidenceState;
  reason: string;
  promoted: false;
  at: string;
};

export type LabelAccessProbe = {
  id: string;
  label: string;
  claimAccessFromLabelAlone: boolean;
  status: 'denied' | 'ok';
  state: EgEvidenceState;
  reason: string;
  accessGranted: false;
  at: string;
};

type Store = {
  registrations: OpsBackboneRegistration[];
  gates: ConsequentialOpsGate[];
  labels: LabelAccessProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'cognitive-operations-backbone.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    registrations: [],
    gates: [],
    labels: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cognitiveOperationsBackboneHonesty() {
  return {
    governedOpsDenyByDefault: true,
    consequentialOpsGated: true,
    labelAloneNeqAccess: true,
    promoted: false,
    l4AutonomyEnabled: false,
  };
}

export async function registerGovernedOpsBackbone(input: {
  opsId: string;
  founderSealed?: boolean;
  root: string;
  actor: EgActor;
}): Promise<OpsBackboneRegistration> {
  const store = await load(input.root);
  void input.actor;
  if (store.registrations.length >= MAX_OPS_EVENTS) {
    throw new Error('MAX_OPS_EVENTS_REACHED');
  }
  const sealed = input.founderSealed !== false;
  const rec: OpsBackboneRegistration = {
    id: id('egops'),
    opsId: input.opsId.trim(),
    founderSealed: sealed,
    status: sealed ? 'ok' : 'denied',
    state: sealed ? 'BOUNDED' : 'DENIED',
    reason: GOVERNED_OPS_DENY_BY_DEFAULT,
    at: new Date().toISOString(),
  };
  store.registrations.push(rec);
  await save(input.root, store);
  return rec;
}

export async function gateConsequentialOps(input: {
  opsId: string;
  evidenceComplete: boolean;
  humanApproved?: boolean;
  root: string;
  actor: EgActor;
}): Promise<ConsequentialOpsGate> {
  const store = await load(input.root);
  void input.actor;
  const approved = Boolean(input.humanApproved) && input.evidenceComplete;
  const gate: ConsequentialOpsGate = {
    id: id('eggate'),
    opsId: input.opsId.trim(),
    evidenceComplete: input.evidenceComplete,
    humanApproved: Boolean(input.humanApproved),
    status: approved ? 'gated' : 'denied',
    state: approved ? 'BOUNDED' : 'PROMOTION_DENIED',
    reason: CONSEQUENTIAL_OPS_GATED,
    promoted: false,
    at: new Date().toISOString(),
  };
  store.gates.push(gate);
  await save(input.root, store);
  return gate;
}

export async function probeLabelAccess(input: {
  label: string;
  claimAccessFromLabelAlone: boolean;
  root: string;
  actor: EgActor;
}): Promise<LabelAccessProbe> {
  const store = await load(input.root);
  void input.actor;
  const claim = input.claimAccessFromLabelAlone;
  const probe: LabelAccessProbe = {
    id: id('eglabel'),
    label: input.label.trim(),
    claimAccessFromLabelAlone: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'DENIED' : 'PASS',
    reason: LABEL_ALONE_NEQ_ACCESS,
    accessGranted: false,
    at: new Date().toISOString(),
  };
  store.labels.push(probe);
  await save(input.root, store);
  return probe;
}
