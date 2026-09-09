import { globalDataFabricProductionLive } from '../network-os';
import type { DataStoreKind, InfrastructureFabric } from './types';
import { INFRASTRUCTURE_FABRICS } from './types';

export type DataStoreReason = {
  kind: DataStoreKind;
  reason: string;
  deployed: false;
};

export const DATA_STORE_REASONS: readonly DataStoreReason[] = [
  { kind: 'RELATIONAL', reason: 'tenant metadata, membership, and policy records', deployed: false },
  { kind: 'GRAPH', reason: 'authorized relationships and evidence edges', deployed: false },
  { kind: 'VECTOR', reason: 'permissioned similarity search', deployed: false },
  { kind: 'SEARCH', reason: 'indexed metadata queries', deployed: false },
  { kind: 'OBJECT_STORAGE', reason: 'encrypted media binaries outside Postgres', deployed: false },
  { kind: 'STREAMING', reason: 'signed event transport', deployed: false },
  { kind: 'TIME_SERIES', reason: 'operational metrics without inventing values', deployed: false },
  { kind: 'CACHE', reason: 'authorized short-lived session acceleration', deployed: false },
  { kind: 'ARCHIVE', reason: 'policy-driven retention, not infinite storage', deployed: false },
];

export function fabricIsProductionLive(_fabric: InfrastructureFabric): false {
  void INFRASTRUCTURE_FABRICS;
  return false;
}

export function extraDatabaseCreatedWithoutReason(): false {
  return false;
}

export function dataFabricProductionLive(): false {
  void globalDataFabricProductionLive();
  return false;
}

export function storeReasonRequired(kind: DataStoreKind): boolean {
  return DATA_STORE_REASONS.some((store) => store.kind === kind && store.reason.length > 0);
}
