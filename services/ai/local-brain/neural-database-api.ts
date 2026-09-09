import { randomUUID } from 'node:crypto';

import { agenticPut, agenticQuery, denyProductionDatabaseWrite } from './agentic-database';
import type { SealedActor } from './hybrid-edge-cloud-types';
import {
  LABEL_ALONE_INSUFFICIENT,
  PRODUCTION_DDL_DENIED,
  PRODUCTION_DML_DENIED,
  TENANT_ISOLATION_VIOLATION,
  UNVERIFIED_ADAPTER_UNAVAILABLE,
  type AdapterKind,
  type BaActor,
} from './neural-database-types';
import { listAdapterProbes, probeAdapter, type AdapterProbe } from './neural-database-planning';

export type UniversalDataRequest = {
  tenantId: string;
  universeId: string;
  table: string;
  op: 'get' | 'put' | 'query' | 'describe' | 'migrate' | 'ddl';
  document?: Record<string, unknown>;
  adapter?: AdapterKind;
  sealed?: boolean;
  actor: BaActor;
  production?: boolean;
};

export type UniversalDataResponse = {
  ok: boolean;
  state: 'AVAILABLE' | 'DENIED' | 'UNAVAILABLE';
  reason: string;
  rows?: unknown[];
  productionWrite: false;
  productionAlter: false;
  adapter?: AdapterProbe;
  requestId: string;
};

function toSealedActor(actor: BaActor): SealedActor {
  if (actor.kind === 'ceo_principal') {
    return { kind: 'ceo_principal', id: actor.id, role: actor.role };
  }
  return {
    kind: 'ordinary_agent',
    id: actor.id,
    role: actor.role ?? 'researcher',
  };
}

export async function universalDataApi(request: UniversalDataRequest): Promise<UniversalDataResponse> {
  const requestId = `uda_${randomUUID()}`;
  if (!request.tenantId || !request.universeId) {
    return {
      ok: false,
      state: 'DENIED',
      reason: TENANT_ISOLATION_VIOLATION,
      productionWrite: false,
      productionAlter: false,
      requestId,
    };
  }
  if (request.actor.tenantId !== request.tenantId || request.actor.universeId !== request.universeId) {
    return {
      ok: false,
      state: 'DENIED',
      reason: TENANT_ISOLATION_VIOLATION,
      productionWrite: false,
      productionAlter: false,
      requestId,
    };
  }
  if (request.actor.labelOnly || request.actor.kind === 'label_only_principal') {
    return {
      ok: false,
      state: 'DENIED',
      reason: LABEL_ALONE_INSUFFICIENT,
      productionWrite: false,
      productionAlter: false,
      requestId,
    };
  }
  if (request.op === 'ddl' || request.op === 'migrate') {
    return {
      ok: false,
      state: 'DENIED',
      reason: PRODUCTION_DDL_DENIED,
      productionWrite: false,
      productionAlter: false,
      requestId,
    };
  }
  if (request.production === true) {
    const denied = await denyProductionDatabaseWrite();
    return {
      ok: false,
      state: 'DENIED',
      reason: denied.reason || PRODUCTION_DML_DENIED,
      productionWrite: false,
      productionAlter: false,
      requestId,
    };
  }

  const adapterKind = request.adapter ?? 'sqlite';
  const adapter = probeAdapter(adapterKind);
  if (adapter.state !== 'AVAILABLE') {
    return {
      ok: false,
      state: 'UNAVAILABLE',
      reason: adapter.reason || UNVERIFIED_ADAPTER_UNAVAILABLE,
      productionWrite: false,
      productionAlter: false,
      adapter,
      requestId,
    };
  }

  const sealedActor = toSealedActor(request.actor);
  const root = process.cwd();

  if (request.op === 'put') {
    const row = await agenticPut({
      tenantId: request.tenantId,
      universeId: request.universeId,
      table: request.table,
      document: request.document ?? {},
      sealed: request.sealed === true,
      root,
    });
    return {
      ok: true,
      state: 'AVAILABLE',
      reason: 'Logical put via Universal Data API (local agentic store). productionAuthorization=false.',
      rows: [row],
      productionWrite: false,
      productionAlter: false,
      adapter,
      requestId,
    };
  }

  if (request.op === 'get' || request.op === 'query') {
    const result = await agenticQuery({
      tenantId: request.tenantId,
      universeId: request.universeId,
      table: request.table,
      actor: sealedActor,
      root,
    });
    return {
      ok: true,
      state: 'AVAILABLE',
      reason: 'Logical query via Universal Data API. No production DML.',
      rows: result.rows,
      productionWrite: false,
      productionAlter: false,
      adapter,
      requestId,
    };
  }

  // describe
  return {
    ok: true,
    state: 'AVAILABLE',
    reason: `Describe table=${request.table} (logical catalog only).`,
    rows: [{ table: request.table, adapter: adapterKind, productionAuthorization: false }],
    productionWrite: false,
    productionAlter: false,
    adapter,
    requestId,
  };
}

export type DatabaseAdapter = {
  kind: AdapterKind;
  name: string;
  probe: () => AdapterProbe;
  supportsDryRun: true;
  productionAlterAllowed: false;
};

export function createAdapterSdk(): {
  register: (adapter: DatabaseAdapter) => void;
  list: () => DatabaseAdapter[];
  probeAll: () => AdapterProbe[];
  get: (kind: AdapterKind) => DatabaseAdapter | undefined;
} {
  const registry = new Map<AdapterKind, DatabaseAdapter>();

  // Built-in pluggable stubs
  for (const kind of [
    'postgresql',
    'sqlite',
    'vector',
    'object_store',
    'document',
    'graph',
    'time_series',
    'cache',
    'search',
    'custom',
  ] as AdapterKind[]) {
    registry.set(kind, {
      kind,
      name: `xiv-${kind}-adapter`,
      probe: () => probeAdapter(kind),
      supportsDryRun: true,
      productionAlterAllowed: false,
    });
  }

  return {
    register(adapter) {
      registry.set(adapter.kind, { ...adapter, productionAlterAllowed: false, supportsDryRun: true });
    },
    list() {
      return [...registry.values()];
    },
    probeAll() {
      return listAdapterProbes();
    },
    get(kind) {
      return registry.get(kind);
    },
  };
}

export type AuthorizedInfoModel = {
  entity: string;
  fields: Array<{ name: string; sensitivity: 'public' | 'internal' | 'customer' | 'sealed'; licensed: boolean }>;
  sources: Array<'customer_owned' | 'public' | 'licensed' | 'authorized'>;
  unauthorizedSourcesDenied: true;
  notes: string;
};

export function modelAuthorizedInformation(input: {
  entity: string;
  fields: AuthorizedInfoModel['fields'];
}): AuthorizedInfoModel {
  const denied = input.fields.filter((f) => f.sensitivity === 'sealed' && !f.licensed);
  return {
    entity: input.entity,
    fields: input.fields,
    sources: ['customer_owned', 'public', 'licensed', 'authorized'],
    unauthorizedSourcesDenied: true,
    notes:
      denied.length > 0
        ? 'Sealed fields require customer-owned/licensed path; label alone is not access.'
        : 'Authorized/public/licensed/customer-owned representation only.',
  };
}
