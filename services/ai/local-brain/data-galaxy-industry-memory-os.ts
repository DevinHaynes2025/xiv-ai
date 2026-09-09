/**
 * 62L-ED Module A — Data Galaxy & Industry Memory OS.
 * Local/cloud microdatabases; visual DB navigation; provenance highways;
 * historical industry memory. Scale-target labels ≠ owned/verified corpus.
 * “Trillions” = future scale target only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_MEMORY_ACL_DENIED,
  MAX_GALAXY_EVENTS,
  MICRODB_NAV_OK,
  PROVENANCE_HIGHWAY_LABELED,
  SCALE_TARGET_NEQ_OWNED_CORPUS,
  TRILLIONS_SCALE_TARGET_ONLY,
  type EdActor,
  type EdEvidenceState,
} from './data-galaxy-industry-memory-os-types';

export type MicrodatabaseNav = {
  id: string;
  dbId: string;
  location: 'local' | 'cloud';
  visualNav: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type ProvenanceHighway = {
  id: string;
  recordId: string;
  lineageLabeled: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

export type ScaleClaimProbe = {
  id: string;
  claimKind: 'trillions' | 'scale_target' | 'owned_corpus';
  claimedOwnedVolume: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  scaleTargetOnly: boolean;
  at: string;
};

export type HistoricalMemoryAccess = {
  id: string;
  memoryId: string;
  aclGranted: boolean;
  labelPresent: boolean;
  status: 'ok' | 'denied';
  state: EdEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  navs: MicrodatabaseNav[];
  provenances: ProvenanceHighway[];
  scaleClaims: ScaleClaimProbe[];
  memories: HistoricalMemoryAccess[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'data-galaxy-industry-memory-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    navs: [],
    provenances: [],
    scaleClaims: [],
    memories: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function dataGalaxyIndustryMemoryOsHonesty() {
  return {
    localCloudMicrodatabases: true,
    visualDbNavigation: true,
    provenanceHighways: true,
    historicalIndustryMemory: true,
    scaleTargetNeqOwnedCorpus: true,
    trillionsFutureScaleTargetOnly: true,
    l4AutonomyEnabled: false,
  };
}

export async function navigateMicrodatabase(input: {
  dbId: string;
  location: 'local' | 'cloud';
  visualNav?: boolean;
  root: string;
  actor: EdActor;
}): Promise<MicrodatabaseNav> {
  const store = await load(input.root);
  void input.actor;
  if (store.navs.length >= MAX_GALAXY_EVENTS) throw new Error('MAX_GALAXY_EVENTS');
  const row: MicrodatabaseNav = {
    id: id('ednav'),
    dbId: input.dbId,
    location: input.location,
    visualNav: input.visualNav !== false,
    status: 'ok',
    state: input.location === 'local' ? 'LOCAL_PREFERRED' : 'AVAILABLE',
    reason: MICRODB_NAV_OK,
    at: new Date().toISOString(),
  };
  store.navs.push(row);
  await save(input.root, store);
  return row;
}

export async function labelProvenanceHighway(input: {
  recordId: string;
  lineageLabeled: boolean;
  root: string;
  actor: EdActor;
}): Promise<ProvenanceHighway> {
  const store = await load(input.root);
  void input.actor;
  if (store.provenances.length >= MAX_GALAXY_EVENTS) {
    throw new Error('MAX_GALAXY_EVENTS');
  }
  const ok = input.lineageLabeled === true;
  const row: ProvenanceHighway = {
    id: id('edprov'),
    recordId: input.recordId,
    lineageLabeled: ok,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'LABELED_EXPERIMENT' : 'DENIED',
    reason: ok ? PROVENANCE_HIGHWAY_LABELED : 'PROVENANCE_UNLABELED_DENIED',
    at: new Date().toISOString(),
  };
  store.provenances.push(row);
  await save(input.root, store);
  return row;
}

export async function probeScaleTargetClaim(input: {
  claimKind: ScaleClaimProbe['claimKind'];
  claimedOwnedVolume: boolean;
  root: string;
  actor: EdActor;
}): Promise<ScaleClaimProbe> {
  const store = await load(input.root);
  void input.actor;
  if (store.scaleClaims.length >= MAX_GALAXY_EVENTS) {
    throw new Error('MAX_GALAXY_EVENTS');
  }
  // Hard lock: claiming owned/ingested volume from scale-target or "trillions" is denied.
  let status: ScaleClaimProbe['status'] = 'ok';
  let state: EdEvidenceState = 'SCALE_TARGET_ONLY';
  let reason = SCALE_TARGET_NEQ_OWNED_CORPUS;

  if (input.claimedOwnedVolume) {
    status = 'denied';
    state = 'DENIED';
    reason = SCALE_TARGET_NEQ_OWNED_CORPUS;
  } else if (input.claimKind === 'trillions') {
    status = 'ok';
    state = 'SCALE_TARGET_ONLY';
    reason = TRILLIONS_SCALE_TARGET_ONLY;
  } else if (input.claimKind === 'owned_corpus') {
    status = 'denied';
    state = 'DENIED';
    reason = SCALE_TARGET_NEQ_OWNED_CORPUS;
  } else {
    status = 'ok';
    state = 'SCALE_TARGET_ONLY';
    reason = SCALE_TARGET_NEQ_OWNED_CORPUS;
  }

  const row: ScaleClaimProbe = {
    id: id('edscale'),
    claimKind: input.claimKind,
    claimedOwnedVolume: input.claimedOwnedVolume,
    status,
    state,
    reason,
    scaleTargetOnly: true,
    at: new Date().toISOString(),
  };
  store.scaleClaims.push(row);
  await save(input.root, store);
  return row;
}

export async function accessHistoricalIndustryMemory(input: {
  memoryId: string;
  aclGranted: boolean;
  labelPresent?: boolean;
  root: string;
  actor: EdActor;
}): Promise<HistoricalMemoryAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.memories.length >= MAX_GALAXY_EVENTS) {
    throw new Error('MAX_GALAXY_EVENTS');
  }
  const denied = !input.aclGranted;
  const row: HistoricalMemoryAccess = {
    id: id('edmem'),
    memoryId: input.memoryId,
    aclGranted: input.aclGranted,
    labelPresent: Boolean(input.labelPresent),
    status: denied ? 'denied' : 'ok',
    state: denied ? 'DENIED' : 'AUTHORIZED',
    reason: denied ? HISTORICAL_MEMORY_ACL_DENIED : 'HISTORICAL_MEMORY_ACL_OK',
    at: new Date().toISOString(),
  };
  store.memories.push(row);
  await save(input.root, store);
  return row;
}
