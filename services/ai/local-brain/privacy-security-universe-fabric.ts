/**
 * 62L-DK Privacy/Security Universe Fabric —
 * Deny-by-default privacy Universes; sealed never silent leak.
 * Anonymous channels require moderation + revocation; not unconstrained abuse anonymity.
 * Emotional understanding = respectful confidence-bounded adaptation — not MH diagnosis.
 * Parallel Universes = isolated workspaces.
 * Space/dark-matter packs = research knowledge only; no physical control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ANONYMOUS_WITHOUT_MODERATION_REJECTED,
  DK_LOCKS,
  HIDDEN_MH_DIAGNOSIS_DENIED,
  HONESTY_BANNER,
  MAX_ANONYMOUS_CHANNELS,
  MAX_PRIVACY_UNIVERSES,
  SEALED_SILENT_LEAK_DENIED,
  SPACE_PHYSICAL_CONTROL_DENIED,
  type DkActor,
  type EmotionalMode,
  type ParallelUniverseKind,
  type SpacePackMode,
} from './unified-intelligence-experience-os-types';

export type PrivacySecurityUniverseFabric = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  denyByDefault: true;
  sealedSilentLeak: false;
  createdAt: string;
};

export type ParallelUniverseWorkspace = {
  id: string;
  fabricId: string;
  name: string;
  kind: ParallelUniverseKind;
  isolated: true;
  createdAt: string;
};

export type AnonymousChannel = {
  id: string;
  fabricId: string;
  name: string;
  moderationEnabled: boolean;
  revocationEnabled: boolean;
  status: 'ENABLED' | 'REJECTED' | 'REVOKED';
  reason: string;
  createdAt: string;
};

export type EmotionalAdaptationRequest = {
  id: string;
  fabricId: string;
  mode: EmotionalMode;
  confidence: number;
  hiddenDiagnosisAttempted: boolean;
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type SpaceDarkMatterPack = {
  id: string;
  fabricId: string;
  mode: SpacePackMode;
  physicalControlEnabled: false;
  status: 'RESEARCH_KNOWLEDGE_ONLY' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type SealedAccessAttempt = {
  id: string;
  fabricId: string;
  silentLeakAttempted: boolean;
  status: 'DENIED' | 'AUTHORIZED';
  reason: string;
  at: string;
};

type Store = {
  fabrics: PrivacySecurityUniverseFabric[];
  workspaces: ParallelUniverseWorkspace[];
  channels: AnonymousChannel[];
  emotional: EmotionalAdaptationRequest[];
  spacePacks: SpaceDarkMatterPack[];
  sealedAttempts: SealedAccessAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'privacy-security-universe-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    fabrics: [],
    workspaces: [],
    channels: [],
    emotional: [],
    spacePacks: [],
    sealedAttempts: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function privacySecurityUniverseFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    anonymousWithoutModeration: DK_LOCKS.ANONYMOUS_WITHOUT_MODERATION,
    anonymousRequiresModerationAndRevocation:
      DK_LOCKS.ANONYMOUS_REQUIRES_MODERATION_AND_REVOCATION,
    unconstrainedAnonymityForAbuse: DK_LOCKS.UNCONSTRAINED_ANONYMITY_FOR_ABUSE,
    hiddenMentalHealthDiagnosisInference: DK_LOCKS.HIDDEN_MENTAL_HEALTH_DIAGNOSIS_INFERENCE,
    emotionalAdaptationConfidenceBounded: DK_LOCKS.EMOTIONAL_ADAPTATION_CONFIDENCE_BOUNDED,
    emotionalEqDiagnosis: DK_LOCKS.EMOTIONAL_EQ_DIAGNOSIS,
    spaceDarkMatterPhysicalControl: DK_LOCKS.SPACE_DARK_MATTER_PHYSICAL_CONTROL,
    spaceDarkMatterResearchKnowledgeOnly: DK_LOCKS.SPACE_DARK_MATTER_RESEARCH_KNOWLEDGE_ONLY,
    sealedSilentLeak: DK_LOCKS.SEALED_SILENT_LEAK,
    privacyUniverseDenyByDefault: DK_LOCKS.PRIVACY_UNIVERSE_DENY_BY_DEFAULT,
    parallelUniverseIsIsolatedWorkspace: DK_LOCKS.PARALLEL_UNIVERSE_IS_ISOLATED_WORKSPACE,
  };
}

export async function bootstrapPrivacySecurityUniverseFabric(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DkActor;
}): Promise<PrivacySecurityUniverseFabric> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.fabrics.find(
    (f) =>
      f.orgId === input.orgId &&
      f.tenantId === input.tenantId &&
      f.universeId === input.universeId,
  );
  if (existing) return existing;
  const fabric: PrivacySecurityUniverseFabric = {
    id: id('dkpriv'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    denyByDefault: true,
    sealedSilentLeak: false,
    createdAt: new Date().toISOString(),
  };
  store.fabrics.push(fabric);
  await save(input.root, store);
  return fabric;
}

export async function openParallelUniverseWorkspace(input: {
  fabricId: string;
  name: string;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  workspace?: ParallelUniverseWorkspace;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };
  if (store.workspaces.length >= MAX_PRIVACY_UNIVERSES) {
    return { accepted: false, reason: 'MAX_PRIVACY_UNIVERSES_REACHED', at: now };
  }
  const workspace: ParallelUniverseWorkspace = {
    id: id('dkuniv'),
    fabricId: input.fabricId,
    name: input.name.trim() || 'isolated-workspace',
    kind: 'isolated_workspace',
    isolated: true,
    createdAt: now,
  };
  store.workspaces.push(workspace);
  await save(input.root, store);
  return {
    accepted: true,
    reason: 'PARALLEL_UNIVERSE_ISOLATED_WORKSPACE_OPENED',
    workspace,
    at: now,
  };
}

export async function enableAnonymousChannel(input: {
  fabricId: string;
  name: string;
  moderationEnabled: boolean;
  revocationEnabled: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; channel?: AnonymousChannel; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (store.channels.length >= MAX_ANONYMOUS_CHANNELS) {
    return { accepted: false, reason: 'MAX_ANONYMOUS_CHANNELS_REACHED', at: now };
  }

  if (input.moderationEnabled !== true || input.revocationEnabled !== true) {
    const channel: AnonymousChannel = {
      id: id('dkanon'),
      fabricId: input.fabricId,
      name: input.name,
      moderationEnabled: input.moderationEnabled === true,
      revocationEnabled: input.revocationEnabled === true,
      status: 'REJECTED',
      reason: ANONYMOUS_WITHOUT_MODERATION_REJECTED,
      createdAt: now,
    };
    store.channels.push(channel);
    await save(input.root, store);
    return {
      accepted: false,
      reason: ANONYMOUS_WITHOUT_MODERATION_REJECTED,
      channel,
      at: now,
    };
  }

  const channel: AnonymousChannel = {
    id: id('dkanon'),
    fabricId: input.fabricId,
    name: input.name,
    moderationEnabled: true,
    revocationEnabled: true,
    status: 'ENABLED',
    reason: 'ANONYMOUS_CHANNEL_ENABLED_WITH_MODERATION_AND_REVOCATION',
    createdAt: now,
  };
  store.channels.push(channel);
  await save(input.root, store);
  return { accepted: true, reason: channel.reason, channel, at: now };
}

export async function requestEmotionalAdaptation(input: {
  fabricId: string;
  confidence: number;
  hiddenMentalHealthDiagnosis?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  request?: EmotionalAdaptationRequest;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (input.hiddenMentalHealthDiagnosis === true) {
    const request: EmotionalAdaptationRequest = {
      id: id('dkemo'),
      fabricId: input.fabricId,
      mode: 'respectful_confidence_bounded_adaptation',
      confidence: input.confidence,
      hiddenDiagnosisAttempted: true,
      status: 'DENIED',
      reason: HIDDEN_MH_DIAGNOSIS_DENIED,
      createdAt: now,
    };
    store.emotional.push(request);
    await save(input.root, store);
    return { accepted: false, reason: HIDDEN_MH_DIAGNOSIS_DENIED, request, at: now };
  }

  const boundedConfidence = Math.min(1, Math.max(0, input.confidence));
  const request: EmotionalAdaptationRequest = {
    id: id('dkemo'),
    fabricId: input.fabricId,
    mode: 'respectful_confidence_bounded_adaptation',
    confidence: boundedConfidence,
    hiddenDiagnosisAttempted: false,
    status: 'ALLOWED',
    reason: 'RESPECTFUL_CONFIDENCE_BOUNDED_ADAPTATION_ALLOWED',
    createdAt: now,
  };
  store.emotional.push(request);
  await save(input.root, store);
  return { accepted: true, reason: request.reason, request, at: now };
}

export async function loadSpaceDarkMatterPack(input: {
  fabricId: string;
  enablePhysicalControl?: boolean;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; pack?: SpaceDarkMatterPack; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  if (input.enablePhysicalControl === true) {
    const pack: SpaceDarkMatterPack = {
      id: id('dkspace'),
      fabricId: input.fabricId,
      mode: 'research_knowledge_only',
      physicalControlEnabled: false,
      status: 'DENIED',
      reason: SPACE_PHYSICAL_CONTROL_DENIED,
      createdAt: now,
    };
    store.spacePacks.push(pack);
    await save(input.root, store);
    return { accepted: false, reason: SPACE_PHYSICAL_CONTROL_DENIED, pack, at: now };
  }

  const pack: SpaceDarkMatterPack = {
    id: id('dkspace'),
    fabricId: input.fabricId,
    mode: 'research_knowledge_only',
    physicalControlEnabled: false,
    status: 'RESEARCH_KNOWLEDGE_ONLY',
    reason: 'SPACE_DARK_MATTER_RESEARCH_KNOWLEDGE_PACK_LOADED',
    createdAt: now,
  };
  store.spacePacks.push(pack);
  await save(input.root, store);
  return { accepted: true, reason: pack.reason, pack, at: now };
}

export async function attemptSealedSilentLeak(input: {
  fabricId: string;
  root: string;
  actor: DkActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: SealedAccessAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const fabric = store.fabrics.find((f) => f.id === input.fabricId);
  if (!fabric) return { accepted: false, reason: 'FABRIC_NOT_FOUND', at: now };

  const attempt: SealedAccessAttempt = {
    id: id('dkseal'),
    fabricId: input.fabricId,
    silentLeakAttempted: true,
    status: 'DENIED',
    reason: SEALED_SILENT_LEAK_DENIED,
    at: now,
  };
  store.sealedAttempts.push(attempt);
  await save(input.root, store);
  return { accepted: false, reason: SEALED_SILENT_LEAK_DENIED, attempt, at: now };
}
