/**
 * Global Connector Fabric — provider-neutral connectors with required governance fields.
 * Access = authorized APIs + licensed data + customer credentials + plugin adapters.
 * Does NOT grant automatic access to “all databases in the world.”
 */

import {
  CONNECTOR_HEALTH_STATES,
  CONNECTOR_KINDS,
  type ConnectorHealthState,
  type ConnectorKind,
  type ConnectorRequiredFields,
} from './types';

export type FabricConnector = ConnectorRequiredFields & {
  kind: ConnectorKind;
  automaticWorldDbAccess: false;
  scrapesPrivateSupplierSystems: false;
  productionCredentialsEnabled: false;
};

const REQUIRED_KEYS: readonly (keyof ConnectorRequiredFields)[] = [
  'provider',
  'connectionId',
  'tenantId',
  'universeId',
  'authenticationMode',
  'permissionScopes',
  'dataClassification',
  'readPermission',
  'writePermission',
  'region',
  'residencyPolicy',
  'syncFrequency',
  'freshness',
  'provenance',
  'rateLimit',
  'auditState',
  'healthState',
] as const;

export function listConnectorKinds(): readonly ConnectorKind[] {
  return CONNECTOR_KINDS;
}

export function listConnectorHealthStates(): readonly ConnectorHealthState[] {
  return CONNECTOR_HEALTH_STATES;
}

export function connectorRequiredFieldKeys(): readonly (keyof ConnectorRequiredFields)[] {
  return REQUIRED_KEYS;
}

export function createConnector(input: {
  kind: ConnectorKind;
  provider: string;
  connectionId: string;
  tenantId: string;
  universeId: string;
  readPermission?: boolean;
  writePermission?: boolean;
  region?: string;
  rateLimit?: number;
  healthState?: ConnectorHealthState;
}): FabricConnector {
  return {
    kind: input.kind,
    provider: input.provider,
    connectionId: input.connectionId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    authenticationMode: 'NOT_CONFIGURED',
    permissionScopes: [],
    dataClassification: 'TENANT_PRIVATE',
    readPermission: input.readPermission ?? false,
    writePermission: input.writePermission ?? false,
    region: input.region ?? 'UNKNOWN',
    residencyPolicy: 'TENANT_POLICY',
    syncFrequency: 'NOT_CONFIGURED',
    freshness: 'UNKNOWN',
    provenance: 'NONE',
    rateLimit: input.rateLimit ?? 0,
    auditState: 'REQUIRED',
    healthState: input.healthState ?? 'NOT_CONFIGURED',
    automaticWorldDbAccess: false,
    scrapesPrivateSupplierSystems: false,
    productionCredentialsEnabled: false,
  };
}

export function openGlobalConnectorFabric() {
  return {
    connectors: CONNECTOR_KINDS.map((kind) =>
      createConnector({
        kind,
        provider: 'UNCONFIGURED',
        connectionId: `${kind}-default`,
        tenantId: 'none',
        universeId: 'none',
      }),
    ),
    automaticWorldDbAccess: false as const,
    federatedIntelligence: true as const,
    copiesEveryDatabase: false as const,
    productionLive: false as const,
  };
}

export function connectorState(kind: ConnectorKind): ConnectorHealthState {
  void kind;
  return 'NOT_CONFIGURED';
}

export function connectorMayGoLiveWithoutEvidence(_kind: ConnectorKind): false {
  return false;
}

export function evaluateConnectorAccess(input: {
  connector: FabricConnector;
  tenantId: string;
  universeId: string;
  wantsWrite: boolean;
  rateLimitExceeded?: boolean;
  secretsInPayload?: boolean;
}): { allowed: boolean; reason: string } {
  if (input.connector.healthState === 'NOT_CONFIGURED') {
    return { allowed: false, reason: 'not_configured' };
  }
  if (input.connector.healthState === 'BLOCKED' || input.connector.healthState === 'REVOKED') {
    return { allowed: false, reason: 'blocked_or_revoked' };
  }
  if (input.connector.tenantId !== input.tenantId) {
    return { allowed: false, reason: 'tenant_mismatch' };
  }
  if (input.connector.universeId !== input.universeId) {
    return { allowed: false, reason: 'universe_mismatch' };
  }
  if (!input.connector.readPermission && !input.wantsWrite) {
    return { allowed: false, reason: 'read_permission_required' };
  }
  if (input.wantsWrite && !input.connector.writePermission) {
    return { allowed: false, reason: 'write_permission_required' };
  }
  if (input.rateLimitExceeded) {
    return { allowed: false, reason: 'rate_limit_exceeded' };
  }
  if (input.secretsInPayload) {
    return { allowed: false, reason: 'secret_leakage_blocked' };
  }
  if (input.connector.auditState === 'MISSING') {
    return { allowed: false, reason: 'audit_incomplete' };
  }
  if (input.connector.automaticWorldDbAccess) {
    return { allowed: false, reason: 'world_db_access_forbidden' };
  }
  if (input.connector.scrapesPrivateSupplierSystems) {
    return { allowed: false, reason: 'private_supplier_scrape_forbidden' };
  }
  return { allowed: true, reason: 'authorized_connector' };
}

export function xivConnectsToAllWorldDatabases(): false {
  return false;
}

export function connectorFabricCopiesEveryDatabase(): false {
  return false;
}

export function privateSupplierScrapingEnabled(): false {
  return false;
}
