/**
 * 62L-EA Module G — XR/Holographic Research Layer + LLM-on-the-go search +
 * local mini-servers. Research UX; neural nodes.
 * XR ≠ covert capture; biometric defaults OFF; evidence-gated mini-servers.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BIOMETRIC_DEFAULTS_OFF,
  LLM_SEARCH_GOVERNED,
  MAX_XR_EVENTS,
  MINI_SERVER_EVIDENCE_GATED,
  XR_NEQ_COVERT,
  type EaActor,
  type EaEvidenceState,
} from './global-operations-intelligence-grid-types';

export type XrSessionProbe = {
  id: string;
  sessionId: string;
  covertCaptureAttempted: boolean;
  biometricEnabled: boolean;
  status: 'ok' | 'denied';
  reason: string;
  researchLayerOnly: true;
  at: string;
};

export type LlmOnTheGoSearch = {
  id: string;
  query: string;
  authorized: boolean;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

export type LocalMiniServerProbe = {
  id: string;
  serverId: string;
  evidencePresent: boolean;
  claimRunningVerified: boolean;
  state: EaEvidenceState;
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  xr: XrSessionProbe[];
  searches: LlmOnTheGoSearch[];
  miniServers: LocalMiniServerProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'xr-holographic-research-layer.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    xr: [],
    searches: [],
    miniServers: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function xrHolographicResearchLayerHonesty() {
  return {
    researchInterfaceLayerOnly: true,
    xrNeqCovertCapture: true,
    biometricDefaultsOff: true,
    llmOnTheGoSearchGoverned: true,
    localMiniServerEvidenceGated: true,
  };
}

export async function openXrResearchSession(input: {
  sessionId: string;
  covertCaptureAttempted?: boolean;
  biometricEnabled?: boolean;
  root: string;
  actor: EaActor;
}): Promise<XrSessionProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.xr.length >= MAX_XR_EVENTS) {
    throw new Error('MAX_XR_EVENTS_REACHED');
  }
  if (input.covertCaptureAttempted) {
    const denied: XrSessionProbe = {
      id: id('eaxr'),
      sessionId: input.sessionId.trim(),
      covertCaptureAttempted: true,
      biometricEnabled: Boolean(input.biometricEnabled),
      status: 'denied',
      reason: XR_NEQ_COVERT,
      researchLayerOnly: true,
      at: new Date().toISOString(),
    };
    store.xr.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (input.biometricEnabled) {
    const denied: XrSessionProbe = {
      id: id('eaxr'),
      sessionId: input.sessionId.trim(),
      covertCaptureAttempted: false,
      biometricEnabled: true,
      status: 'denied',
      reason: BIOMETRIC_DEFAULTS_OFF,
      researchLayerOnly: true,
      at: new Date().toISOString(),
    };
    store.xr.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: XrSessionProbe = {
    id: id('eaxr'),
    sessionId: input.sessionId.trim(),
    covertCaptureAttempted: false,
    biometricEnabled: false,
    status: 'ok',
    reason: 'XR_RESEARCH_SESSION_BOUNDED',
    researchLayerOnly: true,
    at: new Date().toISOString(),
  };
  store.xr.push(ok);
  await save(input.root, store);
  return ok;
}

export async function llmOnTheGoSearch(input: {
  query: string;
  authorized: boolean;
  root: string;
  actor: EaActor;
}): Promise<LlmOnTheGoSearch> {
  const store = await load(input.root);
  void input.actor;
  if (!input.authorized) {
    const denied: LlmOnTheGoSearch = {
      id: id('eallm'),
      query: input.query.trim(),
      authorized: false,
      status: 'denied',
      reason: LLM_SEARCH_GOVERNED,
      at: new Date().toISOString(),
    };
    store.searches.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: LlmOnTheGoSearch = {
    id: id('eallm'),
    query: input.query.trim(),
    authorized: true,
    status: 'ok',
    reason: 'LLM_ON_THE_GO_SEARCH_AUTHORIZED_BOUNDED',
    at: new Date().toISOString(),
  };
  store.searches.push(ok);
  await save(input.root, store);
  return ok;
}

export async function probeLocalMiniServer(input: {
  serverId: string;
  evidencePresent: boolean;
  claimRunningVerified: boolean;
  root: string;
  actor: EaActor;
}): Promise<LocalMiniServerProbe> {
  const store = await load(input.root);
  void input.actor;
  if (input.claimRunningVerified && !input.evidencePresent) {
    const denied: LocalMiniServerProbe = {
      id: id('eams'),
      serverId: input.serverId.trim(),
      evidencePresent: false,
      claimRunningVerified: true,
      state: 'NOT_VERIFIED',
      status: 'denied',
      reason: MINI_SERVER_EVIDENCE_GATED,
      at: new Date().toISOString(),
    };
    store.miniServers.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: LocalMiniServerProbe = {
    id: id('eams'),
    serverId: input.serverId.trim(),
    evidencePresent: input.evidencePresent,
    claimRunningVerified: input.claimRunningVerified,
    state: input.evidencePresent ? 'RUNNING_VERIFIED' : 'WAITING_NODE',
    status: 'ok',
    reason: input.evidencePresent
      ? 'LOCAL_MINI_SERVER_EVIDENCE_PRESENT'
      : 'LOCAL_MINI_SERVER_WAITING_EVIDENCE',
    at: new Date().toISOString(),
  };
  store.miniServers.push(ok);
  await save(input.root, store);
  return ok;
}
