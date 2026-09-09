/**
 * 62L-CH Multi-Model Expert Councils — local-first expert councils across
 * departments/domains. Sealed never silent cloud fallback.
 * Unconfigured provider → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CH_LOCKS,
  HONESTY_BANNER,
  LOCAL_PREFERRED_OVER_CLOUD,
  SEALED_NO_CLOUD_FALLBACK,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type ChActor,
  type DepartmentKey,
} from './knowledge-civilization-dept-universities-types';

export type ExpertMemberKind = 'local' | 'cloud';
export type ExpertRole = 'domain_expert' | 'skeptic' | 'synthesizer' | 'chair' | 'auditor';

export type ExpertCouncilMember = {
  id: string;
  name: string;
  kind: ExpertMemberKind;
  role: ExpertRole;
  department?: DepartmentKey;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type ExpertDeliberation = {
  id: string;
  topic: string;
  department?: DepartmentKey;
  mode: 'open' | 'sealed' | 'local_only';
  selectedMemberIds: string[];
  preferredKind: 'local' | 'cloud' | 'none';
  cloudFallbackAttempted: false;
  status: 'deliberated' | 'denied' | 'unavailable';
  reason: string;
  createdAt: string;
};

type Store = {
  members: ExpertCouncilMember[];
  deliberations: ExpertDeliberation[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-expert-councils.json');
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

export function expertCouncilsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CH_LOCKS.L4_AUTONOMY_ENABLED,
    localModelFirst: CH_LOCKS.LOCAL_MODEL_FIRST,
    cloudRequiresConfigAuthVerify: CH_LOCKS.CLOUD_COUNCIL_REQUIRES_CONFIG_AUTH_VERIFY,
    sealedSilentCloudFallback: CH_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
  };
}

export async function registerExpertCouncilMember(input: {
  name: string;
  kind: ExpertMemberKind;
  role: ExpertRole;
  department?: DepartmentKey;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  root: string;
  actor: ChActor;
}): Promise<ExpertCouncilMember> {
  const store = await load(input.root);
  const ready =
    input.configured === true && input.authorized === true && input.verified === true;
  let status: ExpertCouncilMember['status'] = 'available';
  let reason = 'EXPERT_COUNCIL_MEMBER_AVAILABLE';
  if (!ready) {
    status = 'unavailable';
    reason = UNCONFIGURED_PROVIDER_UNAVAILABLE;
  }
  const member: ExpertCouncilMember = {
    id: id('ecm'),
    name: input.name,
    kind: input.kind,
    role: input.role,
    department: input.department,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.members.push(member);
  await save(input.root, store);
  return member;
}

export async function deliberateExpertCouncil(input: {
  topic: string;
  department?: DepartmentKey;
  mode: 'open' | 'sealed' | 'local_only';
  memberIds: string[];
  preferCloudWhenLocalAvailable?: boolean;
  attemptSilentCloudFallback?: boolean;
  root: string;
  actor: ChActor;
}): Promise<ExpertDeliberation> {
  const store = await load(input.root);
  const selected = store.members.filter((m) => input.memberIds.includes(m.id));
  const available = selected.filter((m) => m.status === 'available');
  const locals = available.filter((m) => m.kind === 'local');
  const clouds = available.filter((m) => m.kind === 'cloud');
  void input.actor;

  if (input.mode === 'sealed' || input.mode === 'local_only') {
    // Sealed/local-only: never silent-route to cloud (even if requested).
    if (input.attemptSilentCloudFallback && clouds.length > 0 && locals.length === 0) {
      const denied: ExpertDeliberation = {
        id: id('edel'),
        topic: input.topic,
        department: input.department,
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
      const denied: ExpertDeliberation = {
        id: id('edel'),
        topic: input.topic,
        department: input.department,
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
    // Locals only — clouds never selected for sealed/local_only.
    const ok: ExpertDeliberation = {
      id: id('edel'),
      topic: input.topic,
      department: input.department,
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

  // open mode: local preferred when both available
  if (locals.length > 0) {
    const ok: ExpertDeliberation = {
      id: id('edel'),
      topic: input.topic,
      department: input.department,
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

  if (clouds.length > 0) {
    const ok: ExpertDeliberation = {
      id: id('edel'),
      topic: input.topic,
      department: input.department,
      mode: input.mode,
      selectedMemberIds: clouds.map((m) => m.id),
      preferredKind: 'cloud',
      cloudFallbackAttempted: false,
      status: 'deliberated',
      reason: 'CLOUD_EXPERT_ONLY_WHEN_CONFIGURED_AUTHORIZED_VERIFIED',
      createdAt: new Date().toISOString(),
    };
    store.deliberations.push(ok);
    await save(input.root, store);
    return ok;
  }

  const unavailable: ExpertDeliberation = {
    id: id('edel'),
    topic: input.topic,
    department: input.department,
    mode: input.mode,
    selectedMemberIds: [],
    preferredKind: 'none',
    cloudFallbackAttempted: false,
    status: 'unavailable',
    reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: new Date().toISOString(),
  };
  store.deliberations.push(unavailable);
  await save(input.root, store);
  return unavailable;
}
