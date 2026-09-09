/**
 * 62L-EE Module B — Autonomous Database Operations Brain.
 * DB-health agents; offline/cloud sync; data SLOs.
 * Recommendation ≠ auto live migration; candidates NOT_APPLIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DATA_SLO_NOT_APPLIED,
  DB_HEALTH_RECOMMEND_ONLY,
  MAX_DB_OPS,
  SYNC_NEQ_AUTO_MIGRATE,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type DbHealthRecommendation = {
  id: string;
  agentId: string;
  finding: string;
  autoMigrateRequested: boolean;
  status: 'recommendation_only' | 'denied';
  state: EeEvidenceState;
  reason: string;
  migrationApplied: false;
  at: string;
};

export type OfflineCloudSync = {
  id: string;
  syncId: string;
  direction: 'offline_to_cloud' | 'cloud_to_offline';
  autoMigrateRequested: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  migrationApplied: false;
  at: string;
};

export type DataSloAdvisory = {
  id: string;
  sloId: string;
  target: string;
  status: 'advisory_only';
  state: EeEvidenceState;
  reason: string;
  applied: false;
  at: string;
};

type Store = {
  health: DbHealthRecommendation[];
  syncs: OfflineCloudSync[];
  slos: DataSloAdvisory[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-database-operations-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    health: [],
    syncs: [],
    slos: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function autonomousDatabaseOperationsBrainHonesty() {
  return {
    dbHealthRecommendOnly: true,
    syncNeqAutoMigrate: true,
    dataSloAdvisoryNotApplied: true,
    migrationApplied: false,
    dbCandidatesNotApplied: true,
  };
}

export async function recommendDbHealth(input: {
  agentId: string;
  finding: string;
  autoMigrateRequested?: boolean;
  root: string;
  actor: EeActor;
}): Promise<DbHealthRecommendation> {
  const store = await load(input.root);
  void input.actor;
  if (store.health.length >= MAX_DB_OPS) throw new Error('MAX_DB_OPS_REACHED');
  const auto = Boolean(input.autoMigrateRequested);
  const rec: DbHealthRecommendation = {
    id: id('eedbh'),
    agentId: input.agentId.trim(),
    finding: input.finding.trim(),
    autoMigrateRequested: auto,
    status: auto ? 'denied' : 'recommendation_only',
    state: auto ? 'DENIED' : 'RECOMMENDATION_ONLY',
    reason: DB_HEALTH_RECOMMEND_ONLY,
    migrationApplied: false,
    at: new Date().toISOString(),
  };
  store.health.push(rec);
  await save(input.root, store);
  return rec;
}

export async function planOfflineCloudSync(input: {
  syncId: string;
  direction: 'offline_to_cloud' | 'cloud_to_offline';
  autoMigrateRequested?: boolean;
  root: string;
  actor: EeActor;
}): Promise<OfflineCloudSync> {
  const store = await load(input.root);
  void input.actor;
  if (store.syncs.length >= MAX_DB_OPS) throw new Error('MAX_DB_OPS_REACHED');
  const auto = Boolean(input.autoMigrateRequested);
  const sync: OfflineCloudSync = {
    id: id('eesync'),
    syncId: input.syncId.trim(),
    direction: input.direction,
    autoMigrateRequested: auto,
    status: auto ? 'denied' : 'ok',
    state: auto ? 'DENIED' : 'NOT_APPLIED',
    reason: SYNC_NEQ_AUTO_MIGRATE,
    migrationApplied: false,
    at: new Date().toISOString(),
  };
  store.syncs.push(sync);
  await save(input.root, store);
  return sync;
}

export async function adviseDataSlo(input: {
  sloId: string;
  target: string;
  root: string;
  actor: EeActor;
}): Promise<DataSloAdvisory> {
  const store = await load(input.root);
  void input.actor;
  if (store.slos.length >= MAX_DB_OPS) throw new Error('MAX_DB_OPS_REACHED');
  const slo: DataSloAdvisory = {
    id: id('eeslo'),
    sloId: input.sloId.trim(),
    target: input.target.trim(),
    status: 'advisory_only',
    state: 'ADVISORY_ONLY',
    reason: DATA_SLO_NOT_APPLIED,
    applied: false,
    at: new Date().toISOString(),
  };
  store.slos.push(slo);
  await save(input.root, store);
  return slo;
}
