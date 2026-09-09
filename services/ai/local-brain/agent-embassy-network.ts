/**
 * 62L-CM Agent Embassy Network — regional multilingual workcells (bounded).
 * Learning ≠ permission; no autonomous spend/deal authority; no permission escalation.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CM_LOCKS,
  EMBASSY_AUTHORITY_DENIED,
  HONESTY_BANNER,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type EmbassyWorkcell = {
  id: string;
  regionId: string;
  languages: string[];
  objective: string;
  bounded: true;
  dealAuthority: false;
  spendAuthority: false;
  permissionEscalation: false;
  learningRecorded: boolean;
  accepted: boolean;
  reason: string;
  createdAt: string;
};

export type EmbassyAuthorityProbe = {
  id: string;
  embassyId: string;
  attemptDeal: boolean;
  attemptSpend: boolean;
  attemptPermissionEscalation: boolean;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  embassies: EmbassyWorkcell[];
  probes: EmbassyAuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-embassy-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { embassies: [], probes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function embassyNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    embassyDealAuthority: CM_LOCKS.EMBASSY_DEAL_AUTHORITY,
    embassySpendAuthority: CM_LOCKS.EMBASSY_SPEND_AUTHORITY,
    embassyPermissionEscalation: CM_LOCKS.EMBASSY_PERMISSION_ESCALATION,
    learningIsPermission: CM_LOCKS.LEARNING_IS_PERMISSION,
  };
}

export async function openEmbassyWorkcell(input: {
  regionId: string;
  languages: string[];
  objective: string;
  /** Probe: attempt to open with deal/spend/permission authority. */
  attemptDealAuthority?: boolean;
  attemptSpendAuthority?: boolean;
  attemptPermissionEscalation?: boolean;
  root: string;
  actor: CmActor;
}): Promise<EmbassyWorkcell> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const authorityProbe =
    input.attemptDealAuthority === true ||
    input.attemptSpendAuthority === true ||
    input.attemptPermissionEscalation === true;

  if (authorityProbe) {
    const denied: EmbassyWorkcell = {
      id: id('emb'),
      regionId: input.regionId,
      languages: input.languages,
      objective: input.objective,
      bounded: true,
      dealAuthority: false,
      spendAuthority: false,
      permissionEscalation: false,
      learningRecorded: false,
      accepted: false,
      reason: EMBASSY_AUTHORITY_DENIED,
      createdAt: now,
    };
    store.embassies.push(denied);
    await save(input.root, store);
    return denied;
  }

  const embassy: EmbassyWorkcell = {
    id: id('emb'),
    regionId: input.regionId,
    languages: input.languages,
    objective: input.objective,
    bounded: true,
    dealAuthority: false,
    spendAuthority: false,
    permissionEscalation: false,
    learningRecorded: false,
    accepted: true,
    reason: 'EMBASSY_WORKCELL_OPENED_BOUNDED_NO_AUTHORITY',
    createdAt: now,
  };
  store.embassies.push(embassy);
  await save(input.root, store);
  return embassy;
}

export async function probeEmbassyAuthority(input: {
  embassyId: string;
  attemptDeal?: boolean;
  attemptSpend?: boolean;
  attemptPermissionEscalation?: boolean;
  root: string;
  actor: CmActor;
}): Promise<EmbassyAuthorityProbe> {
  const store = await load(input.root);
  const probe: EmbassyAuthorityProbe = {
    id: id('eprobe'),
    embassyId: input.embassyId,
    attemptDeal: input.attemptDeal === true,
    attemptSpend: input.attemptSpend === true,
    attemptPermissionEscalation: input.attemptPermissionEscalation === true,
    accepted: false,
    reason: EMBASSY_AUTHORITY_DENIED,
    at: new Date().toISOString(),
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function recordEmbassyLearning(input: {
  embassyId: string;
  summary: string;
  root: string;
  actor: CmActor;
}): Promise<{ accepted: boolean; permissionRaised: false; reason: string }> {
  const store = await load(input.root);
  const embassy = store.embassies.find((e) => e.id === input.embassyId);
  if (!embassy || !embassy.accepted) {
    return {
      accepted: false,
      permissionRaised: false,
      reason: 'EMBASSY_NOT_FOUND_OR_NOT_ACCEPTED',
    };
  }
  embassy.learningRecorded = true;
  await save(input.root, store);
  return {
    accepted: true,
    permissionRaised: false,
    reason: `LEARNING_RECORDED_NOT_PERMISSION:${input.summary.slice(0, 64)}`,
  };
}
