/**
 * 62L-EB Module A — Multi-Model Superbrain Federation.
 * Multi-model routing with local/cloud fallback.
 * Unconfigured providers → UNAVAILABLE (incl. Grok/xAI).
 * No fabricated live credentials/calls.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  GROK_XAI_UNCONFIGURED_UNAVAILABLE,
  LOCAL_CLOUD_FALLBACK_ROUTED,
  MAX_ROUTES,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type EbActor,
  type EbEvidenceState,
} from './multi-model-superbrain-federation-types';

export type ModelRoute = {
  id: string;
  requestId: string;
  preferred: 'local' | 'cloud';
  localAvailable: boolean;
  cloudConfigured: boolean;
  selected: 'local' | 'cloud' | 'none';
  status: 'ok' | 'denied' | 'unavailable';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

export type ProviderProbe = {
  id: string;
  providerId: string;
  configured: boolean;
  authorized: boolean;
  fabricatedCredentialsAttempted: boolean;
  attemptLiveCall: boolean;
  status: 'ok' | 'denied' | 'unavailable';
  state: EbEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  routes: ModelRoute[];
  providers: ProviderProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-superbrain-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    routes: [],
    providers: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiModelSuperbrainFederationHonesty() {
  return {
    multiModelRouting: true,
    localCloudFallback: true,
    localFirst: true,
    unconfiguredProvidersUnavailable: true,
    grokXaiOptionalAuthorizedProvider: true,
    noFabricatedLiveCredentials: true,
    l4AutonomyEnabled: false,
  };
}

export async function routeMultiModelRequest(input: {
  requestId: string;
  preferred: 'local' | 'cloud';
  localAvailable: boolean;
  cloudConfigured: boolean;
  root: string;
  actor: EbActor;
}): Promise<ModelRoute> {
  const store = await load(input.root);
  void input.actor;
  if (store.routes.length >= MAX_ROUTES) {
    throw new Error('MAX_ROUTES_REACHED');
  }
  let selected: ModelRoute['selected'] = 'none';
  let status: ModelRoute['status'] = 'unavailable';
  let state: EbEvidenceState = 'UNAVAILABLE';
  let reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;

  if (input.preferred === 'local' && input.localAvailable) {
    selected = 'local';
    status = 'ok';
    state = 'LOCAL_PREFERRED';
    reason = LOCAL_CLOUD_FALLBACK_ROUTED;
  } else if (input.preferred === 'local' && !input.localAvailable) {
    if (input.cloudConfigured) {
      selected = 'cloud';
      status = 'ok';
      state = 'AVAILABLE';
      reason = LOCAL_CLOUD_FALLBACK_ROUTED;
    } else {
      selected = 'none';
      status = 'unavailable';
      state = 'UNAVAILABLE';
      reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;
    }
  } else if (input.preferred === 'cloud') {
    if (input.cloudConfigured) {
      selected = 'cloud';
      status = 'ok';
      state = 'AVAILABLE';
      reason = LOCAL_CLOUD_FALLBACK_ROUTED;
    } else if (input.localAvailable) {
      selected = 'local';
      status = 'ok';
      state = 'LOCAL_PREFERRED';
      reason = LOCAL_CLOUD_FALLBACK_ROUTED;
    } else {
      selected = 'none';
      status = 'unavailable';
      state = 'UNAVAILABLE';
      reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;
    }
  }

  const route: ModelRoute = {
    id: id('ebmmr'),
    requestId: input.requestId.trim(),
    preferred: input.preferred,
    localAvailable: input.localAvailable,
    cloudConfigured: input.cloudConfigured,
    selected,
    status,
    state,
    reason,
    at: new Date().toISOString(),
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}

export async function probeModelProvider(input: {
  providerId: string;
  configured: boolean;
  authorized?: boolean;
  fabricatedCredentialsAttempted?: boolean;
  attemptLiveCall?: boolean;
  root: string;
  actor: EbActor;
}): Promise<ProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  const isGrok =
    input.providerId.toLowerCase().includes('grok') ||
    input.providerId.toLowerCase().includes('xai');
  const fabricated = Boolean(input.fabricatedCredentialsAttempted);
  const live = Boolean(input.attemptLiveCall);

  if (!input.configured || fabricated || (live && !input.configured)) {
    const probe: ProviderProbe = {
      id: id('ebprov'),
      providerId: input.providerId.trim(),
      configured: false,
      authorized: Boolean(input.authorized),
      fabricatedCredentialsAttempted: fabricated,
      attemptLiveCall: live,
      status: 'unavailable',
      state: 'UNAVAILABLE',
      reason: isGrok
        ? GROK_XAI_UNCONFIGURED_UNAVAILABLE
        : UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.providers.push(probe);
    await save(input.root, store);
    return probe;
  }

  if (!input.authorized) {
    const denied: ProviderProbe = {
      id: id('ebprov'),
      providerId: input.providerId.trim(),
      configured: true,
      authorized: false,
      fabricatedCredentialsAttempted: false,
      attemptLiveCall: live,
      status: 'denied',
      state: 'DENIED',
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.providers.push(denied);
    await save(input.root, store);
    return denied;
  }

  const ok: ProviderProbe = {
    id: id('ebprov'),
    providerId: input.providerId.trim(),
    configured: true,
    authorized: true,
    fabricatedCredentialsAttempted: false,
    attemptLiveCall: live,
    status: 'ok',
    state: 'CONFIGURED',
    reason: 'PROVIDER_CONFIGURED_AUTHORIZED',
    at: new Date().toISOString(),
  };
  store.providers.push(ok);
  await save(input.root, store);
  return ok;
}
