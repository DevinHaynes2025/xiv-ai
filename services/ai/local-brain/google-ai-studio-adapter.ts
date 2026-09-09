/**
 * 62L-CD Google AI Studio Adapter — target contract only.
 * UNAVAILABLE until configured + authorized + verified.
 * Never used as silent sealed→cloud fallback.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CD_LOCKS,
  GOOGLE_AI_STUDIO_UNAVAILABLE,
  HONESTY_BANNER,
  SEALED_CLOUD_FALLBACK_DENIED,
  type CdActor,
} from './data-root-local-llm-archive-mesh-types';

export type GoogleAiStudioSlot = {
  id: string;
  provider: 'google_ai_studio';
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  state: 'AVAILABLE' | 'UNAVAILABLE';
  evidenceRefs: string[];
  notes: string;
  updatedAt: string;
};

export type GoogleAiStudioInvoke = {
  id: string;
  promptSensitivity: 'public' | 'local_only' | 'sealed';
  accepted: boolean;
  status: 'unavailable' | 'denied' | 'accepted';
  silentFallback: false;
  reason: string;
  at: string;
};

type Store = {
  slot: GoogleAiStudioSlot;
  invokes: GoogleAiStudioInvoke[];
};

function defaultSlot(): GoogleAiStudioSlot {
  return {
    id: 'google_ai_studio_default',
    provider: 'google_ai_studio',
    configured: false,
    authorized: false,
    verified: false,
    state: 'UNAVAILABLE',
    evidenceRefs: [],
    notes: 'Google AI Studio adapter UNAVAILABLE until configured, authorized, and verified.',
    updatedAt: new Date().toISOString(),
  };
}

function storePath(root: string) {
  return xivLocalPath(root, 'google-ai-studio-adapter.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { slot: defaultSlot(), invokes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function googleAiStudioHonesty() {
  return {
    banner: HONESTY_BANNER,
    availableWhenUnconfigured: CD_LOCKS.GOOGLE_AI_STUDIO_AVAILABLE_WHEN_UNCONFIGURED,
    requiresConfigAuthVerify: CD_LOCKS.GOOGLE_AI_STUDIO_REQUIRES_CONFIG_AUTH_VERIFY,
    sealedSilentCloudFallback: CD_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    l4AutonomyEnabled: CD_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function getGoogleAiStudioSlot(root: string): Promise<GoogleAiStudioSlot> {
  const store = await load(root);
  return { ...store.slot, evidenceRefs: [...store.slot.evidenceRefs] };
}

export async function configureGoogleAiStudio(input: {
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  evidenceRefs?: string[];
  root: string;
  actor: CdActor;
}): Promise<GoogleAiStudioSlot> {
  const store = await load(input.root);
  const evidenceRefs = input.evidenceRefs ?? [];
  const ready =
    input.configured === true &&
    input.authorized === true &&
    input.verified === true &&
    evidenceRefs.length > 0;
  store.slot = {
    ...store.slot,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    evidenceRefs,
    state: ready ? 'AVAILABLE' : 'UNAVAILABLE',
    notes: ready
      ? 'Google AI Studio adapter configured+authorized+verified (still not production authorized by CD locks).'
      : GOOGLE_AI_STUDIO_UNAVAILABLE,
    updatedAt: new Date().toISOString(),
  };
  await save(input.root, store);
  return { ...store.slot, evidenceRefs: [...store.slot.evidenceRefs] };
}

export async function invokeGoogleAiStudio(input: {
  promptSensitivity: 'public' | 'local_only' | 'sealed';
  allowSilentFallback?: boolean;
  root: string;
  actor: CdActor;
}): Promise<GoogleAiStudioInvoke> {
  const store = await load(input.root);
  const slot = store.slot;

  let invoke: GoogleAiStudioInvoke;

  if (
    input.promptSensitivity === 'sealed' ||
    input.promptSensitivity === 'local_only' ||
    input.allowSilentFallback === true
  ) {
    // Sealed/local-only never routes here; "allowSilentFallback" cannot override.
    invoke = {
      id: id('gasinv'),
      promptSensitivity: input.promptSensitivity,
      accepted: false,
      status: 'denied',
      silentFallback: false,
      reason: SEALED_CLOUD_FALLBACK_DENIED,
      at: new Date().toISOString(),
    };
  } else if (
    slot.state !== 'AVAILABLE' ||
    !slot.configured ||
    !slot.authorized ||
    !slot.verified
  ) {
    invoke = {
      id: id('gasinv'),
      promptSensitivity: input.promptSensitivity,
      accepted: false,
      status: 'unavailable',
      silentFallback: false,
      reason: GOOGLE_AI_STUDIO_UNAVAILABLE,
      at: new Date().toISOString(),
    };
  } else {
    invoke = {
      id: id('gasinv'),
      promptSensitivity: input.promptSensitivity,
      accepted: true,
      status: 'accepted',
      silentFallback: false,
      reason: 'GOOGLE_AI_STUDIO_EXPLICIT_PUBLIC_INVOKE',
      at: new Date().toISOString(),
    };
  }

  store.invokes.push(invoke);
  await save(input.root, store);
  return invoke;
}
