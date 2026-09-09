/**
 * 62L-CG Multi-Model Reasoning Fabric —
 * Local-first multi-model reasoning; configured cloud as council members only
 * when verified. Sealed never silent cloud fallback; unconfigured UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  HONESTY_BANNER,
  SEALED_CLOUD_FALLBACK_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type PromptSensitivity = 'public' | 'local_only' | 'sealed';
export type ModelProviderId =
  | 'local_llm'
  | 'google_ai_studio'
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'openai'
  | 'anthropic'
  | 'cloud_generic';

export type ModelProviderSlot = {
  id: string;
  provider: ModelProviderId;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable';
  reason: string;
  councilMemberEligible: boolean;
};

export type ReasoningRoute = {
  id: string;
  promptId: string;
  sensitivity: PromptSensitivity;
  requestedProvider: ModelProviderId;
  selectedProvider: ModelProviderId | null;
  status: 'routed_local' | 'routed_council' | 'denied' | 'unavailable';
  silentCloudFallback: false;
  reason: string;
  at: string;
};

type Store = {
  providers: ModelProviderSlot[];
  routes: ReasoningRoute[];
};

const CLOUDISH: ModelProviderId[] = [
  'google_ai_studio',
  'aws',
  'azure',
  'gcp',
  'openai',
  'anthropic',
  'cloud_generic',
];

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-reasoning-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { providers: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multiModelReasoningHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    localFirstRouting: CG_LOCKS.LOCAL_FIRST_ROUTING,
    sealedSilentCloudFallback: CG_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    localOnlySilentCloudFallback: CG_LOCKS.LOCAL_ONLY_SILENT_CLOUD_FALLBACK,
    unconfiguredProviderAvailable: CG_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE,
    providersUnavailableUntilVerified: CG_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED,
  };
}

export async function configureModelProvider(input: {
  provider: ModelProviderId;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
  root: string;
  actor: CgActor;
}): Promise<ModelProviderSlot> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const authorized = input.authorized === true;
  const verified = input.verified === true;
  const ready = configured && authorized && verified;

  const slot: ModelProviderSlot = {
    id: id('mmprov'),
    provider: input.provider,
    configured,
    authorized,
    verified,
    status: ready || input.provider === 'local_llm' ? 'available' : 'unavailable',
    reason:
      input.provider === 'local_llm'
        ? 'LOCAL_LLM_PREFERRED'
        : ready
          ? 'CLOUD_COUNCIL_MEMBER_VERIFIED'
          : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    councilMemberEligible: ready && CLOUDISH.includes(input.provider),
  };

  // Local LLM is always treatable as available for local-first routing.
  if (input.provider === 'local_llm') {
    slot.configured = true;
    slot.authorized = true;
    slot.verified = true;
    slot.status = 'available';
    slot.reason = 'LOCAL_LLM_PREFERRED';
    slot.councilMemberEligible = false;
  }

  store.providers = store.providers.filter((p) => p.provider !== input.provider);
  store.providers.push(slot);
  await save(input.root, store);
  return slot;
}

export async function getModelProviderSlot(
  root: string,
  provider: ModelProviderId,
): Promise<ModelProviderSlot | null> {
  const store = await load(root);
  return store.providers.find((p) => p.provider === provider) ?? null;
}

/**
 * Route a reasoning prompt. Sealed/local-only never silently falls back to cloud —
 * even if forceCloudFallback is set or cloud is requested.
 */
export async function routeReasoningLocalFirst(input: {
  promptId: string;
  sensitivity: PromptSensitivity;
  requestedProvider?: ModelProviderId;
  forceCloudFallback?: boolean;
  root: string;
  actor: CgActor;
}): Promise<ReasoningRoute> {
  const store = await load(input.root);
  const requested = input.requestedProvider ?? 'local_llm';
  const isCloud = CLOUDISH.includes(requested);

  const deny = async (reason: string, status: ReasoningRoute['status']): Promise<ReasoningRoute> => {
    const route: ReasoningRoute = {
      id: id('mmroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedProvider: requested,
      selectedProvider: null,
      status,
      silentCloudFallback: false,
      reason,
      at: new Date().toISOString(),
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  };

  // Sealed / local_only: never silent cloud — forceCloudFallback ignored.
  if (
    (input.sensitivity === 'sealed' || input.sensitivity === 'local_only') &&
    (isCloud || input.forceCloudFallback)
  ) {
    return deny(SEALED_CLOUD_FALLBACK_DENIED, 'denied');
  }

  if (requested === 'local_llm' || input.sensitivity === 'sealed' || input.sensitivity === 'local_only') {
    const route: ReasoningRoute = {
      id: id('mmroute'),
      promptId: input.promptId,
      sensitivity: input.sensitivity,
      requestedProvider: requested,
      selectedProvider: 'local_llm',
      status: 'routed_local',
      silentCloudFallback: false,
      reason: 'LOCAL_FIRST_REASONING_ROUTE',
      at: new Date().toISOString(),
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  // Cloud council member: must be configured + authorized + verified.
  const slot = store.providers.find((p) => p.provider === requested);
  if (!slot || !slot.configured || !slot.authorized || !slot.verified) {
    return deny(UNCONFIGURED_PROVIDER_UNAVAILABLE, 'unavailable');
  }

  const route: ReasoningRoute = {
    id: id('mmroute'),
    promptId: input.promptId,
    sensitivity: input.sensitivity,
    requestedProvider: requested,
    selectedProvider: requested,
    status: 'routed_council',
    silentCloudFallback: false,
    reason: 'VERIFIED_CLOUD_COUNCIL_MEMBER_ROUTE',
    at: new Date().toISOString(),
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
