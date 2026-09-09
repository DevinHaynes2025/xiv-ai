/**
 * 62L-EG Module F — Federated Database Bundles.
 * Large-data lakehouses, bundled DBs, mini-servers; candidates NOT_APPLIED;
 * genome ≠ proprietary copy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  FEDERATED_BUNDLE_NOT_APPLIED,
  GENOME_NEQ_PROPRIETARY,
  LAKEHOUSE_NOT_APPLIED,
  MAX_DB_BUNDLES,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type FederatedDbBundle = {
  id: string;
  bundleId: string;
  kind: 'bundled_db' | 'mini_server' | 'lakehouse';
  status: 'candidate_not_applied';
  state: EgEvidenceState;
  reason: string;
  applied: false;
  at: string;
};

export type LakehouseCandidate = {
  id: string;
  lakehouseId: string;
  status: 'candidate_not_applied';
  state: EgEvidenceState;
  reason: string;
  applied: false;
  at: string;
};

export type GenomeCopyProbe = {
  id: string;
  claimProprietaryCopy: boolean;
  status: 'denied' | 'ok';
  state: EgEvidenceState;
  reason: string;
  proprietaryCopyAllowed: false;
  at: string;
};

type Store = {
  bundles: FederatedDbBundle[];
  lakehouses: LakehouseCandidate[];
  genomes: GenomeCopyProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'federated-database-bundles.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    bundles: [],
    lakehouses: [],
    genomes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function federatedDatabaseBundlesHonesty() {
  return {
    candidatesNotApplied: true,
    lakehouseNotApplied: true,
    proprietaryCopyAllowed: false,
    applied: false,
  };
}

export async function proposeFederatedDbBundle(input: {
  bundleId: string;
  kind: 'bundled_db' | 'mini_server' | 'lakehouse';
  root: string;
  actor: EgActor;
}): Promise<FederatedDbBundle> {
  const store = await load(input.root);
  void input.actor;
  if (store.bundles.length >= MAX_DB_BUNDLES) {
    throw new Error('MAX_DB_BUNDLES_REACHED');
  }
  const bundle: FederatedDbBundle = {
    id: id('egbundle'),
    bundleId: input.bundleId.trim(),
    kind: input.kind,
    status: 'candidate_not_applied',
    state: 'NOT_APPLIED',
    reason: FEDERATED_BUNDLE_NOT_APPLIED,
    applied: false,
    at: new Date().toISOString(),
  };
  store.bundles.push(bundle);
  await save(input.root, store);
  return bundle;
}

export async function proposeLakehouseCandidate(input: {
  lakehouseId: string;
  root: string;
  actor: EgActor;
}): Promise<LakehouseCandidate> {
  const store = await load(input.root);
  void input.actor;
  if (store.lakehouses.length >= MAX_DB_BUNDLES) {
    throw new Error('MAX_DB_BUNDLES_REACHED');
  }
  const lake: LakehouseCandidate = {
    id: id('eglake'),
    lakehouseId: input.lakehouseId.trim(),
    status: 'candidate_not_applied',
    state: 'NOT_APPLIED',
    reason: LAKEHOUSE_NOT_APPLIED,
    applied: false,
    at: new Date().toISOString(),
  };
  store.lakehouses.push(lake);
  await save(input.root, store);
  return lake;
}

export async function probeGenomeCopy(input: {
  claimProprietaryCopy: boolean;
  root: string;
  actor: EgActor;
}): Promise<GenomeCopyProbe> {
  const store = await load(input.root);
  void input.actor;
  const claim = input.claimProprietaryCopy;
  const probe: GenomeCopyProbe = {
    id: id('eggenome'),
    claimProprietaryCopy: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'DENIED' : 'PASS',
    reason: GENOME_NEQ_PROPRIETARY,
    proprietaryCopyAllowed: false,
    at: new Date().toISOString(),
  };
  store.genomes.push(probe);
  await save(input.root, store);
  return probe;
}
