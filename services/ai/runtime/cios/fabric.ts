/**
 * Continuous Intelligence OS data fabric.
 * PostgreSQL/Supabase authoritative for identity/orgs/Universes/permissions/governance.
 * MongoDB and unproven providers begin NOT_CONFIGURED. No LIVE without evidence.
 */

import {
  DATA_FABRIC_ADAPTER_KINDS,
  type CapabilityLifecycle,
  type DataFabricAdapterKind,
} from './types';

export type DataFabricAdapter = {
  kind: DataFabricAdapterKind;
  state: CapabilityLifecycle;
  productionLive: false;
  returnsRawCredentials: false;
  authoritativeForIdentity: boolean;
};

export type ContinuousDataFabric = {
  adapters: readonly DataFabricAdapter[];
  postgresAuthoritative: true;
  supabaseAuthoritative: true;
  mongoLive: false;
  authorityFromAdapterPresence: false;
  productionLive: false;
};

function isAuthoritative(kind: DataFabricAdapterKind): boolean {
  return kind === 'POSTGRESQL' || kind === 'SUPABASE_POSTGRES';
}

export function openContinuousDataFabric(): ContinuousDataFabric {
  return {
    adapters: DATA_FABRIC_ADAPTER_KINDS.map((kind) => ({
      kind,
      state: 'NOT_CONFIGURED' as const,
      productionLive: false as const,
      returnsRawCredentials: false as const,
      authoritativeForIdentity: isAuthoritative(kind),
    })),
    postgresAuthoritative: true,
    supabaseAuthoritative: true,
    mongoLive: false,
    authorityFromAdapterPresence: false,
    productionLive: false,
  };
}

export function dataFabricAdapterState(kind: DataFabricAdapterKind): CapabilityLifecycle {
  void kind;
  return 'NOT_CONFIGURED';
}

export function mongoDbLifecycle(): CapabilityLifecycle {
  return 'NOT_CONFIGURED';
}

export function mongoDbIsLive(): false {
  return false;
}

export function fabricMarksProviderLiveWithoutProof(kind: DataFabricAdapterKind): false {
  void kind;
  return false;
}

export function adapterPresenceCreatesAuthority(): false {
  return false;
}

export function listDataFabricAdapters(): readonly DataFabricAdapter[] {
  return openContinuousDataFabric().adapters;
}
