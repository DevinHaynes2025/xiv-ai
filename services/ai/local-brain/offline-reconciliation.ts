import { evaluateOfflineTask } from './offline-policy';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ReconciliationState = 'WAITING_DATA' | 'UNAVAILABLE' | 'QUEUED_LOCAL' | 'RECONCILED_LOCAL' | 'DENIED';

export type ReconciliationRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  workcellId: string;
  objective: string;
  state: ReconciliationState;
  connectivity: 'offline' | 'online_observed';
  autoAppliedOnline: false;
  productionAuthorization: false;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

type Store = { records: ReconciliationRecord[] };

function pathFor(root: string) {
  return xivLocalPath(root, 'offline-reconciliation.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(pathFor(root), { records: [] });
  return Array.isArray(parsed.records) ? parsed.records : [];
}

async function save(root: string, records: ReconciliationRecord[]) {
  await writeJsonFileAtomic(pathFor(root), { records: records.slice(-5_000) });
}

export async function queueOfflineOnlineReconciliation(input: {
  tenantId: string;
  universeId: string;
  workcellId: string;
  objective: string;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  production?: boolean;
  connectivity?: 'offline' | 'online_observed';
  root?: string;
}): Promise<ReconciliationRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const decision = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true || input.needsCloudProvider === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: input.production === true,
    needsPermissionChange: false,
    classification: 'internal',
  });
  const now = new Date().toISOString();
  let state: ReconciliationState = 'QUEUED_LOCAL';
  if (!decision.allowed) {
    state = decision.state === 'WAITING_DATA' ? 'WAITING_DATA' : decision.state === 'DENIED' ? 'DENIED' : 'UNAVAILABLE';
  }
  const record: ReconciliationRecord = {
    id: cortexId('recon'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    workcellId: input.workcellId,
    objective: input.objective,
    state,
    connectivity: input.connectivity ?? 'offline',
    autoAppliedOnline: false,
    productionAuthorization: false,
    reason: decision.reason,
    createdAt: now,
    updatedAt: now,
  };
  const root = input.root ?? process.cwd();
  const records = await load(root);
  records.push(record);
  await save(root, records);
  return record;
}

export async function reconcileWhenConnectivityReturns(input: {
  id: string;
  tenantId: string;
  universeId: string;
  onlineObserved: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const records = await load(root);
  const record = records.find((item) =>
    item.id === input.id && item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
  if (!record) throw new Error('RECONCILIATION_NOT_FOUND');
  if (!input.onlineObserved) {
    record.state = 'WAITING_DATA';
    record.reason = 'Connectivity not observed; keep waiting for approved fresh data.';
    record.updatedAt = new Date().toISOString();
    await save(root, records);
    return record;
  }
  record.connectivity = 'online_observed';
  if (record.state === 'DENIED') {
    record.reason = 'Online return does not authorize previously denied production/permission work.';
  } else if (record.state === 'WAITING_DATA' || record.state === 'QUEUED_LOCAL' || record.state === 'UNAVAILABLE') {
    record.state = 'RECONCILED_LOCAL';
    record.reason = 'Connectivity observed. Local evidence queued for human review. Online effects are not auto-applied.';
  }
  record.updatedAt = new Date().toISOString();
  await save(root, records);
  return record;
}

export async function listReconciliationRecords(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const records = await load(input.root ?? process.cwd());
  return records.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
