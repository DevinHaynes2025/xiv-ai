/**
 * 62L-CK Mini Cloud Server Cells —
 * Isolated service cells: queues, search/vector/graph shards, caches,
 * knowledge stores, telemetry, model gateways, archive workers, sync relays.
 * NOT stealth infra takeover. Enrollment required to bind production network.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CK_LOCKS,
  HONESTY_BANNER,
  MINI_CELL_PROD_BIND_DENIED,
  SEALED_CLOUD_CELL_DENIED,
  UNCONFIGURED_UNAVAILABLE,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';

export type MiniCellKind =
  | 'queue'
  | 'search_shard'
  | 'vector_shard'
  | 'graph_shard'
  | 'cache'
  | 'knowledge_store'
  | 'telemetry'
  | 'model_gateway'
  | 'archive_worker'
  | 'sync_relay';

export type MiniCloudCell = {
  id: string;
  label: string;
  kind: MiniCellKind;
  enrolled: boolean;
  isolated: true;
  stealthTakeover: false;
  productionNetworkBound: boolean;
  status: 'enrolled' | 'denied' | 'unavailable' | 'isolated';
  reason: string;
  productionAuthorized: false;
  at: string;
};

export type CellBindAttempt = {
  id: string;
  cellId: string;
  target: 'sandbox' | 'production_network';
  status: 'bound_isolated' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

export type CellRouteAttempt = {
  id: string;
  cellId: string;
  sensitivity: 'public' | 'local_only' | 'sealed';
  forceCloudGateway: boolean;
  status: 'routed_local' | 'denied' | 'unavailable';
  silentCloudFallback: false;
  reason: string;
  at: string;
};

type Store = {
  cells: MiniCloudCell[];
  binds: CellBindAttempt[];
  routes: CellRouteAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'mini-cloud-server-cells.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { cells: [], binds: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function miniCloudCellsHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    stealthInfraTakeover: CK_LOCKS.MINI_CELL_STEALTH_INFRA_TAKEOVER,
    unenrolledProdBind: CK_LOCKS.MINI_CELL_UNENROLLED_PROD_BIND,
    isolatedServiceCells: CK_LOCKS.MINI_CELLS_ARE_ISOLATED_SERVICE_CELLS,
    sealedSilentCloudFallback: CK_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function enrollMiniCloudCell(input: {
  label: string;
  kind: MiniCellKind;
  enrolled: boolean;
  configured?: boolean;
  root: string;
  actor: CkActor;
}): Promise<MiniCloudCell> {
  const store = await load(input.root);
  const configured = input.configured !== false;
  let status: MiniCloudCell['status'] = 'unavailable';
  let reason = UNCONFIGURED_UNAVAILABLE;

  if (!configured) {
    status = 'unavailable';
    reason = UNCONFIGURED_UNAVAILABLE;
  } else if (input.enrolled !== true) {
    status = 'denied';
    reason = MINI_CELL_PROD_BIND_DENIED;
  } else {
    status = 'enrolled';
    reason = 'MINI_CLOUD_CELL_ENROLLED_ISOLATED';
  }

  const cell: MiniCloudCell = {
    id: id('mcell'),
    label: input.label,
    kind: input.kind,
    enrolled: input.enrolled === true,
    isolated: true,
    stealthTakeover: false,
    productionNetworkBound: false,
    status,
    reason,
    productionAuthorized: false,
    at: new Date().toISOString(),
  };
  store.cells.push(cell);
  await save(input.root, store);
  return cell;
}

export async function attemptMiniCellProductionBind(input: {
  cellId: string;
  root: string;
  actor: CkActor;
}): Promise<CellBindAttempt> {
  const store = await load(input.root);
  const cell = store.cells.find((c) => c.id === input.cellId);

  if (!cell) {
    const attempt: CellBindAttempt = {
      id: id('cbind'),
      cellId: input.cellId,
      target: 'production_network',
      status: 'unavailable',
      reason: UNCONFIGURED_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.binds.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (cell.enrolled !== true || cell.status !== 'enrolled') {
    const attempt: CellBindAttempt = {
      id: id('cbind'),
      cellId: cell.id,
      target: 'production_network',
      status: 'denied',
      reason: MINI_CELL_PROD_BIND_DENIED,
      at: new Date().toISOString(),
    };
    store.binds.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  // Even enrolled cells only bind as isolated sandbox — never stealth takeover.
  const attempt: CellBindAttempt = {
    id: id('cbind'),
    cellId: cell.id,
    target: 'sandbox',
    status: 'bound_isolated',
    reason: 'MINI_CLOUD_CELL_BOUND_ISOLATED_SANDBOX_ONLY',
    at: new Date().toISOString(),
  };
  cell.productionNetworkBound = false;
  store.binds.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function routeViaMiniCellGateway(input: {
  cellId: string;
  sensitivity: 'public' | 'local_only' | 'sealed';
  forceCloudGateway?: boolean;
  root: string;
  actor: CkActor;
}): Promise<CellRouteAttempt> {
  const store = await load(input.root);
  const cell = store.cells.find((c) => c.id === input.cellId);

  if (!cell || cell.status === 'unavailable') {
    const attempt: CellRouteAttempt = {
      id: id('croute'),
      cellId: input.cellId,
      sensitivity: input.sensitivity,
      forceCloudGateway: input.forceCloudGateway === true,
      status: 'unavailable',
      silentCloudFallback: false,
      reason: UNCONFIGURED_UNAVAILABLE,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (
    (input.sensitivity === 'sealed' || input.sensitivity === 'local_only') &&
    input.forceCloudGateway === true
  ) {
    const attempt: CellRouteAttempt = {
      id: id('croute'),
      cellId: cell.id,
      sensitivity: input.sensitivity,
      forceCloudGateway: true,
      status: 'denied',
      silentCloudFallback: false,
      reason: SEALED_CLOUD_CELL_DENIED,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  if (cell.enrolled !== true) {
    const attempt: CellRouteAttempt = {
      id: id('croute'),
      cellId: cell.id,
      sensitivity: input.sensitivity,
      forceCloudGateway: input.forceCloudGateway === true,
      status: 'denied',
      silentCloudFallback: false,
      reason: MINI_CELL_PROD_BIND_DENIED,
      at: new Date().toISOString(),
    };
    store.routes.push(attempt);
    await save(input.root, store);
    return attempt;
  }

  const attempt: CellRouteAttempt = {
    id: id('croute'),
    cellId: cell.id,
    sensitivity: input.sensitivity,
    forceCloudGateway: false,
    status: 'routed_local',
    silentCloudFallback: false,
    reason: 'ROUTED_LOCAL_ISOLATED_CELL',
    at: new Date().toISOString(),
  };
  store.routes.push(attempt);
  await save(input.root, store);
  return attempt;
}
