/**
 * 62L-BZ Chip Design Knowledge Foundry — knowledge capture / sandbox candidates only.
 * ≠ fab production authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BZ_LOCKS,
  CHIP_FOUNDRY_NOT_FAB,
  HONESTY_BANNER,
  type BzActor,
} from './global-compute-nervous-routing-types';

export type ChipDesignCandidate = {
  id: string;
  title: string;
  processNm?: number;
  architectureNotes: string;
  evidenceRefs: string[];
  status: 'sandbox_candidate' | 'documented' | 'denied';
  productionAuthorized: false;
  fabAuthority: false;
  recommendationOnly: true;
  reason: string;
  createdAt: string;
};

type Store = {
  candidates: ChipDesignCandidate[];
  fabAttempts: Array<{
    id: string;
    candidateId: string;
    denied: true;
    reason: string;
    at: string;
  }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'chip-design-knowledge-foundry.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { candidates: [], fabAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function chipFoundryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    chipFoundryIsFabProduction: BZ_LOCKS.CHIP_FOUNDRY_IS_FAB_PRODUCTION,
    sandboxCandidatesOnly: BZ_LOCKS.CHIP_FOUNDRY_SANDBOX_CANDIDATES,
    productionAuthorization: BZ_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function captureChipDesignKnowledge(input: {
  title: string;
  processNm?: number;
  architectureNotes: string;
  evidenceRefs?: string[];
  forceProductionAuthorize?: boolean;
  root: string;
  actor: BzActor;
}): Promise<{
  candidate: ChipDesignCandidate;
  productionAuthorized: false;
  fabAuthority: false;
}> {
  const store = await load(input.root);
  if (input.forceProductionAuthorize) {
    const denied: ChipDesignCandidate = {
      id: id('chip'),
      title: input.title,
      processNm: input.processNm,
      architectureNotes: input.architectureNotes,
      evidenceRefs: input.evidenceRefs ?? [],
      status: 'denied',
      productionAuthorized: false,
      fabAuthority: false,
      recommendationOnly: true,
      reason: CHIP_FOUNDRY_NOT_FAB,
      createdAt: new Date().toISOString(),
    };
    store.candidates.push(denied);
    await save(input.root, store);
    return { candidate: denied, productionAuthorized: false, fabAuthority: false };
  }

  const candidate: ChipDesignCandidate = {
    id: id('chip'),
    title: input.title,
    processNm: input.processNm,
    architectureNotes: input.architectureNotes,
    evidenceRefs: input.evidenceRefs ?? [],
    status: 'sandbox_candidate',
    productionAuthorized: false,
    fabAuthority: false,
    recommendationOnly: true,
    reason: CHIP_FOUNDRY_NOT_FAB,
    createdAt: new Date().toISOString(),
  };
  store.candidates.push(candidate);
  await save(input.root, store);
  return { candidate, productionAuthorized: false, fabAuthority: false };
}

export async function attemptFabProductionAuthorize(input: {
  candidateId: string;
  root: string;
  actor: BzActor;
}): Promise<{ accepted: false; denied: true; reason: typeof CHIP_FOUNDRY_NOT_FAB }> {
  const store = await load(input.root);
  store.fabAttempts.push({
    id: id('fab'),
    candidateId: input.candidateId,
    denied: true,
    reason: CHIP_FOUNDRY_NOT_FAB,
    at: new Date().toISOString(),
  });
  await save(input.root, store);
  return { accepted: false, denied: true, reason: CHIP_FOUNDRY_NOT_FAB };
}

export async function listChipDesignCandidates(root: string) {
  return (await load(root)).candidates;
}
