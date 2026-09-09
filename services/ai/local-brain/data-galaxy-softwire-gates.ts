/**
 * 62L-ED Module H — Soft-wire EB/EA (and EC if present) + neural nodes +
 * promotion/evidence gates + anti-malware denials + autonomy boundary.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTONOMY_FREIGHT_PO_SPEND_DENIED,
  MAX_SOFTWIRE_EVENTS,
  NEURAL_NODES_EVIDENCE_GATED,
  SELF_PROMOTION_DENIED,
  STEALTH_INSTALL_DENIED,
  TWIN_NEQ_FOUNDER,
  detectPredecessorLayer,
  predecessorMap,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type NeuralNodeProbe = {
  id: string;
  nodeId: string;
  evidencePresent: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type SelfPromotionAttempt = {
  id: string;
  subjectId: string;
  status: 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type StealthInstallDenial = {
  id: string;
  attemptKind: string;
  status: 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type TwinAuthorityProbe = {
  id: string;
  actorId: string;
  claimFounderAuthority: boolean;
  status: 'denied' | 'ok';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type AutonomyBoundaryProbe = {
  id: string;
  action:
    | 'book_freight'
    | 'issue_purchase_order'
    | 'sign_contract'
    | 'spend_money'
    | 'change_production_system';
  status: 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  neural: NeuralNodeProbe[];
  promotions: SelfPromotionAttempt[];
  stealth: StealthInstallDenial[];
  twins: TwinAuthorityProbe[];
  autonomy: AutonomyBoundaryProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-galaxy-softwire-gates.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    neural: [],
    promotions: [],
    stealth: [],
    twins: [],
    autonomy: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dataGalaxySoftwireHonesty(repoRoot?: string) {
  return {
    softWirePreferEcThenEbThenEa: true,
    predecessorLayer: detectPredecessorLayer(repoRoot),
    predecessors: predecessorMap(repoRoot),
    neuralNodesEvidenceGated: true,
    selfPromotionDenied: true,
    stealthInstallDenied: true,
    digitalTwinNeqFounder: true,
    autonomyNoFreightPoSpend: true,
    l4AutonomyEnabled: false,
  };
}

export async function probeNeuralNodeEd(input: {
  nodeId: string;
  evidencePresent: boolean;
  root: string;
  actor: EdActor;
}): Promise<NeuralNodeProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.neural.length >= MAX_SOFTWIRE_EVENTS) {
    throw new Error('MAX_SOFTWIRE_EVENTS');
  }
  const row: NeuralNodeProbe = {
    id: id('ednn'),
    nodeId: input.nodeId,
    evidencePresent: input.evidencePresent,
    status: input.evidencePresent ? 'ok' : 'denied',
    state: input.evidencePresent ? 'VERIFIED' : 'DENIED',
    reason: NEURAL_NODES_EVIDENCE_GATED,
    at: new Date().toISOString(),
  };
  store.neural.push(row);
  await save(input.root, store);
  return row;
}

export async function attemptSelfPromotionEd(input: {
  subjectId: string;
  root: string;
  actor: EdActor;
}): Promise<SelfPromotionAttempt> {
  const store = await load(input.root);
  void input.actor;
  if (store.promotions.length >= MAX_SOFTWIRE_EVENTS) {
    throw new Error('MAX_SOFTWIRE_EVENTS');
  }
  const row: SelfPromotionAttempt = {
    id: id('edpromo'),
    subjectId: input.subjectId,
    status: 'denied',
    state: 'PROMOTION_DENIED',
    reason: SELF_PROMOTION_DENIED,
    at: new Date().toISOString(),
  };
  store.promotions.push(row);
  await save(input.root, store);
  return row;
}

export async function denyStealthInstallEd(input: {
  attemptKind: string;
  root: string;
  actor: EdActor;
}): Promise<StealthInstallDenial> {
  const store = await load(input.root);
  void input.actor;
  if (store.stealth.length >= MAX_SOFTWIRE_EVENTS) {
    throw new Error('MAX_SOFTWIRE_EVENTS');
  }
  const row: StealthInstallDenial = {
    id: id('edstealth'),
    attemptKind: input.attemptKind,
    status: 'denied',
    state: 'DENIED',
    reason: STEALTH_INSTALL_DENIED,
    at: new Date().toISOString(),
  };
  store.stealth.push(row);
  await save(input.root, store);
  return row;
}

export async function probeDigitalTwinAuthorityEd(input: {
  actor: EdActor;
  claimFounderAuthority: boolean;
  root: string;
}): Promise<TwinAuthorityProbe> {
  const store = await load(input.root);
  if (store.twins.length >= MAX_SOFTWIRE_EVENTS) {
    throw new Error('MAX_SOFTWIRE_EVENTS');
  }
  const denied =
    input.claimFounderAuthority || input.actor.kind === 'digital_twin';
  const row: TwinAuthorityProbe = {
    id: id('edtwinauth'),
    actorId: input.actor.id,
    claimFounderAuthority: input.claimFounderAuthority,
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'AUTHORIZED',
    reason: TWIN_NEQ_FOUNDER,
    at: new Date().toISOString(),
  };
  store.twins.push(row);
  await save(input.root, store);
  return row;
}

export async function probeAutonomyBoundaryEd(input: {
  action: AutonomyBoundaryProbe['action'];
  root: string;
  actor: EdActor;
}): Promise<AutonomyBoundaryProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.autonomy.length >= MAX_SOFTWIRE_EVENTS) {
    throw new Error('MAX_SOFTWIRE_EVENTS');
  }
  const row: AutonomyBoundaryProbe = {
    id: id('edauto'),
    action: input.action,
    status: 'denied',
    state: 'DENIED',
    reason: AUTONOMY_FREIGHT_PO_SPEND_DENIED,
    at: new Date().toISOString(),
  };
  store.autonomy.push(row);
  await save(input.root, store);
  return row;
}
