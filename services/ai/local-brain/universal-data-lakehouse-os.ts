/**
 * 62L-DW Module B — Universal Data Lakehouse OS.
 * Governed lakehouse; data-quality agents; historical archives;
 * NOT_APPLIED candidates; ≠ auto-prod DDL or live migration.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_CANDIDATES_NOT_APPLIED,
  DQ_NEQ_LIVE_MIGRATION,
  LAKEHOUSE_DDL_NEQ_AUTO,
  MAX_LAKEHOUSE_CANDIDATES,
  type DwActor,
} from './supply-chain-superbrain-types';

export type LakehouseDdlCandidate = {
  id: string;
  name: string;
  autoApplied: false;
  appliedToProduction: false;
  status: 'candidate' | 'denied';
  reason: string;
  createdAt: string;
};

export type DataQualityAction = {
  id: string;
  checkName: string;
  liveMigrationAttempted: boolean;
  liveMigrationApplied: false;
  status: 'advisory_only' | 'denied';
  reason: string;
  createdAt: string;
};

export type DbCandidateStatus = {
  id: string;
  applied: false;
  status: 'NOT_APPLIED';
  reason: string;
  at: string;
};

type Store = {
  ddlCandidates: LakehouseDdlCandidate[];
  qualityActions: DataQualityAction[];
  dbStatuses: DbCandidateStatus[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-data-lakehouse-os.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    ddlCandidates: [],
    qualityActions: [],
    dbStatuses: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalDataLakehouseOsHonesty() {
  return {
    lakehouseAutoProdDdl: false,
    dataQualityAutoLiveMigration: false,
    dbCandidatesApplied: false,
    historicalArchivesDocumentedOnly: true,
  };
}

export async function proposeLakehouseDdl(input: {
  name: string;
  attemptAutoApply?: boolean;
  root: string;
  actor: DwActor;
}): Promise<LakehouseDdlCandidate> {
  const store = await load(input.root);
  void input.actor;
  if (store.ddlCandidates.length >= MAX_LAKEHOUSE_CANDIDATES) {
    throw new Error('MAX_LAKEHOUSE_CANDIDATES_REACHED');
  }
  const candidate: LakehouseDdlCandidate = {
    id: id('dwdl'),
    name: input.name.trim(),
    autoApplied: false,
    appliedToProduction: false,
    status: 'candidate',
    reason: LAKEHOUSE_DDL_NEQ_AUTO,
    createdAt: new Date().toISOString(),
  };
  store.ddlCandidates.push(candidate);
  await save(input.root, store);
  return candidate;
}

export async function runDataQualityAgent(input: {
  checkName: string;
  attemptLiveMigration?: boolean;
  root: string;
  actor: DwActor;
}): Promise<DataQualityAction> {
  const store = await load(input.root);
  void input.actor;
  const action: DataQualityAction = {
    id: id('dwdq'),
    checkName: input.checkName.trim(),
    liveMigrationAttempted: Boolean(input.attemptLiveMigration),
    liveMigrationApplied: false,
    status: input.attemptLiveMigration ? 'denied' : 'advisory_only',
    reason: DQ_NEQ_LIVE_MIGRATION,
    createdAt: new Date().toISOString(),
  };
  store.qualityActions.push(action);
  await save(input.root, store);
  return action;
}

export async function probeDbCandidatesApplied(input: {
  claimApplied?: boolean;
  root: string;
  actor: DwActor;
}): Promise<DbCandidateStatus> {
  const store = await load(input.root);
  void input.actor;
  const status: DbCandidateStatus = {
    id: id('dwdb'),
    applied: false,
    status: 'NOT_APPLIED',
    reason: DB_CANDIDATES_NOT_APPLIED,
    at: new Date().toISOString(),
  };
  store.dbStatuses.push(status);
  await save(input.root, store);
  return status;
}
