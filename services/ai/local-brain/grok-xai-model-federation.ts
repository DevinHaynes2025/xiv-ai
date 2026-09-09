/**
 * 62L-EA Module B — Grok/xAI Model Federation.
 * Multi-model evaluation; optional xAI provider adapter.
 * Unconfigured → UNAVAILABLE. No fabricated live credentials/calls.
 * Integration design surface only until configured + authorized.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_FEDERATION_EVENTS,
  MULTI_MODEL_CONTRACT_ONLY,
  UNCONFIGURED_PROVIDER_DENIED,
  XAI_INTEGRATION_SURFACE,
  XAI_NO_FABRICATED_CREDS,
  XAI_UNAVAILABLE,
  type EaActor,
  type EaEvidenceState,
} from './global-operations-intelligence-grid-types';

export type XaiProviderProbe = {
  id: string;
  configured: boolean;
  authorized: boolean;
  fabricatedCredentialsAttempted: boolean;
  attemptLiveCall: boolean;
  state: EaEvidenceState;
  status: 'ok' | 'denied' | 'unavailable';
  reason: string;
  integrationSurface: readonly string[];
  at: string;
};

export type MultiModelEvaluation = {
  id: string;
  models: string[];
  liveExecution: boolean;
  status: 'contract_only' | 'denied';
  reason: string;
  at: string;
};

export type ProviderAdapterProbe = {
  id: string;
  providerId: string;
  configured: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  state: EaEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  xaiProbes: XaiProviderProbe[];
  evaluations: MultiModelEvaluation[];
  providers: ProviderAdapterProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'grok-xai-model-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    xaiProbes: [],
    evaluations: [],
    providers: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function grokXaiModelFederationHonesty() {
  return {
    xaiOptionalAuthorizedProvider: true,
    unconfiguredUnavailable: true,
    noFabricatedLiveCredentials: true,
    noFabricatedLiveCalls: true,
    integrationDesignSurfaceOnlyUntilConfiguredAuthorized: true,
    integrationSurface: XAI_INTEGRATION_SURFACE,
    multiModelEvaluationContractOnlyUntilAuthorized: true,
  };
}

export async function probeXaiProvider(input: {
  configured: boolean;
  authorized?: boolean;
  fabricatedCredentialsAttempted?: boolean;
  attemptLiveCall?: boolean;
  root: string;
  actor: EaActor;
}): Promise<XaiProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.xaiProbes.length >= MAX_FEDERATION_EVENTS) {
    throw new Error('MAX_FEDERATION_EVENTS_REACHED');
  }
  if (input.fabricatedCredentialsAttempted) {
    const denied: XaiProviderProbe = {
      id: id('eaxai'),
      configured: input.configured,
      authorized: Boolean(input.authorized),
      fabricatedCredentialsAttempted: true,
      attemptLiveCall: Boolean(input.attemptLiveCall),
      state: 'DENIED',
      status: 'denied',
      reason: XAI_NO_FABRICATED_CREDS,
      integrationSurface: XAI_INTEGRATION_SURFACE,
      at: new Date().toISOString(),
    };
    store.xaiProbes.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (!input.configured) {
    const unavailable: XaiProviderProbe = {
      id: id('eaxai'),
      configured: false,
      authorized: Boolean(input.authorized),
      fabricatedCredentialsAttempted: false,
      attemptLiveCall: Boolean(input.attemptLiveCall),
      state: 'UNAVAILABLE',
      status: 'unavailable',
      reason: XAI_UNAVAILABLE,
      integrationSurface: XAI_INTEGRATION_SURFACE,
      at: new Date().toISOString(),
    };
    store.xaiProbes.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }
  if (!input.authorized) {
    const denied: XaiProviderProbe = {
      id: id('eaxai'),
      configured: true,
      authorized: false,
      fabricatedCredentialsAttempted: false,
      attemptLiveCall: Boolean(input.attemptLiveCall),
      state: 'DENIED',
      status: 'denied',
      reason: UNCONFIGURED_PROVIDER_DENIED,
      integrationSurface: XAI_INTEGRATION_SURFACE,
      at: new Date().toISOString(),
    };
    store.xaiProbes.push(denied);
    await save(input.root, store);
    return denied;
  }
  // Configured+authorized still returns contract surface — no live call fabricated.
  const ok: XaiProviderProbe = {
    id: id('eaxai'),
    configured: true,
    authorized: true,
    fabricatedCredentialsAttempted: false,
    attemptLiveCall: Boolean(input.attemptLiveCall),
    state: 'INTEGRATION_DESIGN_SURFACE',
    status: 'ok',
    reason: 'XAI_ADAPTER_CONTRACT_READY_NO_LIVE_CALL_IN_TEST',
    integrationSurface: XAI_INTEGRATION_SURFACE,
    at: new Date().toISOString(),
  };
  store.xaiProbes.push(ok);
  await save(input.root, store);
  return ok;
}

export async function evaluateMultiModel(input: {
  models: string[];
  liveExecution?: boolean;
  root: string;
  actor: EaActor;
}): Promise<MultiModelEvaluation> {
  const store = await load(input.root);
  void input.actor;
  const evaluation: MultiModelEvaluation = {
    id: id('eamme'),
    models: input.models.map((m) => m.trim()).filter(Boolean),
    liveExecution: Boolean(input.liveExecution),
    status: input.liveExecution ? 'denied' : 'contract_only',
    reason: input.liveExecution
      ? UNCONFIGURED_PROVIDER_DENIED
      : MULTI_MODEL_CONTRACT_ONLY,
    at: new Date().toISOString(),
  };
  store.evaluations.push(evaluation);
  await save(input.root, store);
  return evaluation;
}

export async function probeProviderAdapter(input: {
  providerId: string;
  configured: boolean;
  root: string;
  actor: EaActor;
}): Promise<ProviderAdapterProbe> {
  const store = await load(input.root);
  void input.actor;
  if (!input.configured) {
    const denied: ProviderAdapterProbe = {
      id: id('eapa'),
      providerId: input.providerId.trim(),
      configured: false,
      status: 'unavailable',
      state: 'UNAVAILABLE',
      reason: UNCONFIGURED_PROVIDER_DENIED,
      at: new Date().toISOString(),
    };
    store.providers.push(denied);
    await save(input.root, store);
    return denied;
  }
  const ok: ProviderAdapterProbe = {
    id: id('eapa'),
    providerId: input.providerId.trim(),
    configured: true,
    status: 'ok',
    state: 'CONFIGURED',
    reason: 'PROVIDER_ADAPTER_CONFIGURED_CONTRACT',
    at: new Date().toISOString(),
  };
  store.providers.push(ok);
  await save(input.root, store);
  return ok;
}
