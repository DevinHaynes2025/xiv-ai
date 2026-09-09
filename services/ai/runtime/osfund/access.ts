/**
 * Database Fabric V2 — provider-neutral adapters.
 * Adapter presence is not LIVE proof. Credentials never leave the gateway.
 */

import {
  DATABASE_PROVIDER_KINDS,
  PROVIDER_PURPOSE_MAP,
  type ConnectorLifecycle,
  type DatabaseProviderKind,
  type DatabasePurpose,
} from './types';

export type DatabaseAdapterContract = {
  kind: DatabaseProviderKind;
  purpose: DatabasePurpose;
  state: ConnectorLifecycle;
  productionLive: false;
  returnsRawCredentials: false;
};

export type DatabaseFabricV2 = {
  adapters: readonly DatabaseAdapterContract[];
  federationEnabled: true;
  authorityFromConnectivity: false;
  productionLive: false;
};

export function openDatabaseFabricV2(): DatabaseFabricV2 {
  return {
    adapters: DATABASE_PROVIDER_KINDS.map((kind) => ({
      kind,
      purpose: PROVIDER_PURPOSE_MAP[kind],
      state: 'NOT_CONFIGURED' as const,
      productionLive: false as const,
      returnsRawCredentials: false as const,
    })),
    federationEnabled: true,
    authorityFromConnectivity: false,
    productionLive: false,
  };
}

export function adapterState(kind: DatabaseProviderKind): ConnectorLifecycle {
  void kind;
  return 'NOT_CONFIGURED';
}

export function moreConnectivityMeansMoreAuthority(): false {
  return false;
}

export function fabricMarksProviderLiveWithoutProof(kind: DatabaseProviderKind): false {
  void kind;
  return false;
}

export function listFabricAdapters(): readonly DatabaseAdapterContract[] {
  return openDatabaseFabricV2().adapters;
}
