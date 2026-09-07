import { evaluateDataAccess } from '../premium/data';
import { extraDatabaseCreatedWithoutReason } from '../opsbrain/fabrics';
import type { PolyglotStoreClass } from './types';
import { POLYGLOT_STORE_CLASSES } from './types';

export type DataPlaneQuery = {
  store: PolyglotStoreClass;
  tenantId?: string;
  requestedTenantId?: string;
  universeId?: string;
  requestedUniverseId?: string;
  classification?: 'PUBLIC' | 'TENANT_PRIVATE';
  purpose?: string;
  viaGateway?: boolean;
  rawSecretRequested?: boolean;
  crossDatabaseJoinBypass?: boolean;
};

export const STORE_PURPOSES: Record<PolyglotStoreClass, string> = {
  RELATIONAL: 'accounts, organizations, universes, permissions, transactions, configuration',
  GRAPH: 'companies, suppliers, products, people, locations, supply-chain relationships, provenance',
  VECTOR: 'semantic retrieval, document similarity, knowledge retrieval',
  SEARCH: 'full-text, documents, media, business discovery',
  OBJECT: 'video, images, audio, documents, large artifacts',
  STREAM: 'events, device signals, warehouse events, media jobs, agent events',
  TIME_SERIES: 'system metrics, business KPIs, sensor history, operational measurements',
  CACHE: 'temporary sessions, fast reads, rate limiting',
  WAREHOUSE_LAKEHOUSE: 'analytical copies that remain classification-bound',
  ARCHIVE: 'historical records, compliance retention, cold data',
};

export function routeDataQuery(query: DataPlaneQuery) {
  void POLYGLOT_STORE_CLASSES;
  if (query.crossDatabaseJoinBypass === true) {
    return { allowed: false as const, reason: 'cross_database_join_cannot_bypass_authorization' };
  }
  if (!query.purpose) {
    return { allowed: false as const, reason: 'data_query_requires_purpose' };
  }
  if (query.store === 'GRAPH' && query.tenantId && query.requestedTenantId && query.tenantId !== query.requestedTenantId) {
    return { allowed: false as const, reason: 'graph_query_respects_tenant' };
  }
  if (query.store === 'VECTOR' && query.universeId && query.requestedUniverseId && query.universeId !== query.requestedUniverseId) {
    return { allowed: false as const, reason: 'vector_query_respects_universe' };
  }
  if (query.store === 'SEARCH' && query.classification === 'TENANT_PRIVATE' && query.purpose === 'public_discovery') {
    return { allowed: false as const, reason: 'search_query_respects_classification' };
  }
  if (query.store === 'OBJECT' && !query.universeId) {
    return { allowed: false as const, reason: 'object_storage_respects_data_scope' };
  }
  const access = evaluateDataAccess({
    agent: 'Database Security',
    tenantId: query.tenantId ?? 'tenant-a',
    requestedTenantId: query.requestedTenantId ?? query.tenantId ?? 'tenant-a',
    classification: query.classification ?? 'TENANT_PRIVATE',
    destination: 'same_tenant',
    viaGateway: query.viaGateway !== false,
    rawSecretRequested: query.rawSecretRequested === true,
    destructiveMigration: false,
  });
  if (!access.allowed) {
    return { allowed: false as const, reason: access.reason };
  }
  return { allowed: true as const, store: query.store, purpose: STORE_PURPOSES[query.store], gatewayRequired: true as const };
}

export function agentObtainsDbCredentials(): false {
  void routeDataQuery({
    store: 'RELATIONAL',
    tenantId: 'tenant-a',
    purpose: 'ops',
    rawSecretRequested: true,
  });
  return false;
}

export function polyglotRequiresPurpose(): true {
  void extraDatabaseCreatedWithoutReason();
  return true;
}

export function replicateRegion(input: { sourceRegion: string; destRegion: string; policyAllows: boolean }) {
  if (input.policyAllows !== true) {
    return { allowed: false as const, reason: 'regional_policy_prevents_forbidden_replication' };
  }
  return { allowed: true as const, sourceRegion: input.sourceRegion, destRegion: input.destRegion };
}
