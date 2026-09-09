/**
 * 62L-BZ Business Signal Exchange — derived/authorized signals only;
 * contradiction handling; no default raw private pooling (BM-style).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  APPROVED_SIGNAL_KINDS,
  BZ_LOCKS,
  CONTRADICTION_SURFACED,
  HONESTY_BANNER,
  RAW_PRIVATE_SIGNAL_DENIED,
  type ApprovedSignalKind,
  type BzActor,
  containsForbiddenPrivateFields,
} from './global-compute-nervous-routing-types';

export type BusinessSignal = {
  id: string;
  kind: ApprovedSignalKind | 'raw_private' | 'denied';
  topic: string;
  claim: string;
  polarity: 'positive' | 'negative' | 'neutral' | 'unknown';
  authorized: boolean;
  derived: boolean;
  provenanceRefs: string[];
  status: 'accepted' | 'denied' | 'contradiction';
  reason: string;
  createdAt: string;
};

export type SignalContradiction = {
  id: string;
  signalAId: string;
  signalBId: string;
  topic: string;
  silentlyPicked: false;
  bothRetained: true;
  status: 'open';
  reason: typeof CONTRADICTION_SURFACED;
  createdAt: string;
};

type Store = {
  signals: BusinessSignal[];
  contradictions: SignalContradiction[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'business-signal-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { signals: [], contradictions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function businessSignalHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    rawPrivatePoolDefault: BZ_LOCKS.RAW_PRIVATE_SIGNAL_POOL_DEFAULT,
    derivedAuthorizedOnly: BZ_LOCKS.DERIVED_AUTHORIZED_SIGNALS_ONLY,
    contradictionSilentPick: BZ_LOCKS.CONTRADICTION_SILENT_PICK,
    contradictionSurfaced: BZ_LOCKS.CONTRADICTION_SURFACED,
  };
}

export async function publishBusinessSignal(input: {
  kind: string;
  topic: string;
  claim: string;
  polarity?: BusinessSignal['polarity'];
  authorized: boolean;
  derived: boolean;
  provenanceRefs?: string[];
  payload?: Record<string, unknown>;
  root: string;
  actor: BzActor;
}): Promise<{
  signal: BusinessSignal;
  accepted: boolean;
  contradiction?: SignalContradiction;
}> {
  const store = await load(input.root);

  if (
    input.kind === 'raw_private' ||
    input.kind === 'raw_private_company_data' ||
    input.kind === 'private_dump' ||
    (!input.derived && !input.authorized) ||
    containsForbiddenPrivateFields(input.payload)
  ) {
    const denied: BusinessSignal = {
      id: id('sig'),
      kind: 'denied',
      topic: input.topic,
      claim: input.claim,
      polarity: input.polarity ?? 'unknown',
      authorized: false,
      derived: false,
      provenanceRefs: input.provenanceRefs ?? [],
      status: 'denied',
      reason: RAW_PRIVATE_SIGNAL_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.signals.push(denied);
    await save(input.root, store);
    return { signal: denied, accepted: false };
  }

  const approved = (APPROVED_SIGNAL_KINDS as readonly string[]).includes(input.kind);
  if (!approved || !input.authorized || !input.derived) {
    const denied: BusinessSignal = {
      id: id('sig'),
      kind: 'denied',
      topic: input.topic,
      claim: input.claim,
      polarity: input.polarity ?? 'unknown',
      authorized: input.authorized === true,
      derived: input.derived === true,
      provenanceRefs: input.provenanceRefs ?? [],
      status: 'denied',
      reason: RAW_PRIVATE_SIGNAL_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.signals.push(denied);
    await save(input.root, store);
    return { signal: denied, accepted: false };
  }

  const signal: BusinessSignal = {
    id: id('sig'),
    kind: input.kind as ApprovedSignalKind,
    topic: input.topic,
    claim: input.claim,
    polarity: input.polarity ?? 'neutral',
    authorized: true,
    derived: true,
    provenanceRefs: input.provenanceRefs ?? [],
    status: 'accepted',
    reason: 'DERIVED_AUTHORIZED_SIGNAL_ACCEPTED',
    createdAt: new Date().toISOString(),
  };

  // Contradiction: opposing polarity on same topic, not silently picked.
  const prior = store.signals.find(
    (s) =>
      s.topic === signal.topic &&
      s.status === 'accepted' &&
      s.polarity !== 'neutral' &&
      s.polarity !== 'unknown' &&
      signal.polarity !== 'neutral' &&
      signal.polarity !== 'unknown' &&
      s.polarity !== signal.polarity,
  );

  let contradiction: SignalContradiction | undefined;
  if (prior) {
    signal.status = 'contradiction';
    signal.reason = CONTRADICTION_SURFACED;
    prior.status = 'contradiction';
    prior.reason = CONTRADICTION_SURFACED;
    contradiction = {
      id: id('ctr'),
      signalAId: prior.id,
      signalBId: signal.id,
      topic: signal.topic,
      silentlyPicked: false,
      bothRetained: true,
      status: 'open',
      reason: CONTRADICTION_SURFACED,
      createdAt: new Date().toISOString(),
    };
    store.contradictions.push(contradiction);
  }

  store.signals.push(signal);
  await save(input.root, store);
  return { signal, accepted: signal.status !== 'denied', contradiction };
}

export async function resolveContradictionPick(input: {
  contradictionId: string;
  pickSignalId: string;
  silent: boolean;
  root: string;
  actor: BzActor;
}): Promise<{
  allowed: boolean;
  silentlyPicked: false;
  reason: string;
}> {
  const store = await load(input.root);
  const ctr = store.contradictions.find((c) => c.id === input.contradictionId);
  if (!ctr) {
    return { allowed: false, silentlyPicked: false, reason: 'CONTRADICTION_NOT_FOUND' };
  }
  // Silent pick always denied; human-gated explicit resolution would be a later gate.
  if (input.silent || BZ_LOCKS.CONTRADICTION_SILENT_PICK === false) {
    return {
      allowed: false,
      silentlyPicked: false,
      reason: CONTRADICTION_SURFACED,
    };
  }
  return {
    allowed: false,
    silentlyPicked: false,
    reason: CONTRADICTION_SURFACED,
  };
}

export async function listBusinessSignals(root: string) {
  return (await load(root)).signals;
}

export async function listSignalContradictions(root: string) {
  return (await load(root)).contradictions;
}
