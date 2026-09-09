/**
 * 62L-CE Multi-LLM Research Council — local-first; cloud members only when
 * configured + authorized + verified. Sealed/local-only never silently falls back to cloud.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CE_LOCKS,
  HONESTY_BANNER,
  LOCAL_PREFERRED_OVER_CLOUD,
  SEALED_NO_CLOUD_FALLBACK,
  UNCONFIGURED_CLOUD_COUNCIL_UNAVAILABLE,
  type CeActor,
} from './knowledge-excavation-memory-lake-types';

export type CouncilMemberKind = 'local' | 'cloud';
export type CouncilRole = 'analyst' | 'skeptic' | 'evidence' | 'synthesizer' | 'chair';

export type CouncilMember = {
  id: string;
  name: string;
  kind: CouncilMemberKind;
  role: CouncilRole;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type CouncilDeliberation = {
  id: string;
  topic: string;
  mode: 'open' | 'sealed' | 'local_only';
  selectedMemberIds: string[];
  preferredKind: 'local' | 'cloud' | 'none';
  cloudFallbackAttempted: false;
  status: 'deliberated' | 'denied' | 'unavailable';
  reason: string;
  createdAt: string;
};

type Store = {
  members: CouncilMember[];
  deliberations: CouncilDeliberation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-llm-research-council.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { members: [], deliberations: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function researchCouncilHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    localLlmFirst: CE_LOCKS.LOCAL_LLM_FIRST,
    cloudRequiresConfigAuthVerify: CE_LOCKS.CLOUD_COUNCIL_REQUIRES_CONFIG_AUTH_VERIFY,
    sealedSilentCloudFallback: CE_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
  };
}

export async function registerCouncilMember(input: {
  name: string;
  kind: CouncilMemberKind;
  role: CouncilRole;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  root: string;
  actor: CeActor;
}): Promise<CouncilMember> {
  const store = await load(input.root);
  const ready =
    input.configured === true && input.authorized === true && input.verified === true;
  let status: CouncilMember['status'] = 'available';
  let reason = 'COUNCIL_MEMBER_AVAILABLE';
  if (input.kind === 'cloud' && !ready) {
    status = 'unavailable';
    reason = UNCONFIGURED_CLOUD_COUNCIL_UNAVAILABLE;
  } else if (!ready) {
    status = 'unavailable';
    reason = 'LOCAL_COUNCIL_MEMBER_UNAVAILABLE_UNTIL_CONFIGURED';
  }
  const member: CouncilMember = {
    id: id('cm'),
    name: input.name,
    kind: input.kind,
    role: input.role,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.members.push(member);
  await save(input.root, store);
  return member;
}

export async function deliberateResearchCouncil(input: {
  topic: string;
  mode: 'open' | 'sealed' | 'local_only';
  memberIds: string[];
  preferCloudWhenLocalAvailable?: boolean;
  attemptSilentCloudFallback?: boolean;
  root: string;
  actor: CeActor;
}): Promise<CouncilDeliberation> {
  const store = await load(input.root);
  const selected = store.members.filter((m) => input.memberIds.includes(m.id));
  const available = selected.filter((m) => m.status === 'available');
  const locals = available.filter((m) => m.kind === 'local');
  const clouds = available.filter((m) => m.kind === 'cloud');

  if (input.mode === 'sealed' || input.mode === 'local_only') {
    if (input.attemptSilentCloudFallback && clouds.length > 0 && locals.length === 0) {
      const denied: CouncilDeliberation = {
        id: id('delib'),
        topic: input.topic,
        mode: input.mode,
        selectedMemberIds: [],
        preferredKind: 'none',
        cloudFallbackAttempted: false,
        status: 'denied',
        reason: SEALED_NO_CLOUD_FALLBACK,
        createdAt: new Date().toISOString(),
      };
      store.deliberations.push(denied);
      await save(input.root, store);
      return denied;
    }
    if (locals.length === 0) {
      const denied: CouncilDeliberation = {
        id: id('delib'),
        topic: input.topic,
        mode: input.mode,
        selectedMemberIds: [],
        preferredKind: 'none',
        cloudFallbackAttempted: false,
        status: 'denied',
        reason: SEALED_NO_CLOUD_FALLBACK,
        createdAt: new Date().toISOString(),
      };
      store.deliberations.push(denied);
      await save(input.root, store);
      return denied;
    }
    const ok: CouncilDeliberation = {
      id: id('delib'),
      topic: input.topic,
      mode: input.mode,
      selectedMemberIds: locals.map((m) => m.id),
      preferredKind: 'local',
      cloudFallbackAttempted: false,
      status: 'deliberated',
      reason: LOCAL_PREFERRED_OVER_CLOUD,
      createdAt: new Date().toISOString(),
    };
    store.deliberations.push(ok);
    await save(input.root, store);
    return ok;
  }

  // open mode: local preferred whenever locals are available (LOCAL_LLM_FIRST).
  // preferCloudWhenLocalAvailable is ignored — policy beats preference.
  if (locals.length > 0) {
    const ok: CouncilDeliberation = {
      id: id('delib'),
      topic: input.topic,
      mode: input.mode,
      selectedMemberIds: locals.map((m) => m.id),
      preferredKind: 'local',
      cloudFallbackAttempted: false,
      status: 'deliberated',
      reason: LOCAL_PREFERRED_OVER_CLOUD,
      createdAt: new Date().toISOString(),
    };
    void input.preferCloudWhenLocalAvailable;
    store.deliberations.push(ok);
    await save(input.root, store);
    return ok;
  }

  if (clouds.length > 0 && locals.length === 0) {
    const ok: CouncilDeliberation = {
      id: id('delib'),
      topic: input.topic,
      mode: input.mode,
      selectedMemberIds: clouds.map((m) => m.id),
      preferredKind: 'cloud',
      cloudFallbackAttempted: false,
      status: 'deliberated',
      reason: 'CLOUD_COUNCIL_ONLY_WHEN_CONFIGURED_AUTHORIZED_VERIFIED',
      createdAt: new Date().toISOString(),
    };
    store.deliberations.push(ok);
    await save(input.root, store);
    return ok;
  }

  const unavailable: CouncilDeliberation = {
    id: id('delib'),
    topic: input.topic,
    mode: input.mode,
    selectedMemberIds: [],
    preferredKind: 'none',
    cloudFallbackAttempted: false,
    status: 'unavailable',
    reason: 'NO_AVAILABLE_COUNCIL_MEMBERS',
    createdAt: new Date().toISOString(),
  };
  store.deliberations.push(unavailable);
  await save(input.root, store);
  return unavailable;
}
