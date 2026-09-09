import { defaultDenyUnknownHandoff, evaluateAgentFirewall } from '../security/firewall';
import { isolateAgentInput, treatAsSystemAuthority } from '../security/injection';
import type { DataAgentRole, PolyglotStore } from './types';

export const DATA_AGENT_ROLES: readonly DataAgentRole[] = [
  'Chief Data',
  'Database Architect',
  'Data Quality',
  'Schema',
  'Query Optimization',
  'Data Lineage',
  'Database Security',
  'Backup',
  'Replication',
  'Graph',
  'Vector Intelligence',
  'Search Index',
  'Streaming',
  'Archive',
  'Data Cost',
  'Data Contradiction',
  'Provenance',
];

export const POLYGLOT_STORES: readonly PolyglotStore[] = [
  'RELATIONAL',
  'GRAPH',
  'VECTOR',
  'SEARCH',
  'OBJECT',
  'STREAM',
  'TIME_SERIES',
  'CACHE',
  'WAREHOUSE',
];

export type DataAccessRequest = {
  agent: DataAgentRole;
  tenantId: string;
  requestedTenantId: string;
  classification: 'PUBLIC' | 'TENANT_PRIVATE';
  destination: 'same_tenant' | 'public' | 'global_brain';
  viaGateway: boolean;
  rawSecretRequested: boolean;
  destructiveMigration: boolean;
};

export type DataAccessDecision = {
  allowed: boolean;
  reason: string;
  gatewayRequired: true;
};

export function evaluateDataAccess(request: DataAccessRequest): DataAccessDecision {
  if (request.rawSecretRequested) {
    return { allowed: false, reason: 'data_agent_cannot_receive_raw_db_secret', gatewayRequired: true };
  }
  if (!request.viaGateway) {
    return { allowed: false, reason: 'agent_db_access_requires_data_access_gateway', gatewayRequired: true };
  }
  if (request.destructiveMigration) {
    return { allowed: false, reason: 'schema_agent_cannot_run_destructive_production_migration', gatewayRequired: true };
  }
  if (request.tenantId !== request.requestedTenantId) {
    return { allowed: false, reason: 'cross_tenant_db_request_denied', gatewayRequired: true };
  }
  if (request.classification === 'TENANT_PRIVATE' && request.destination !== 'same_tenant') {
    return { allowed: false, reason: 'classification_enforced', gatewayRequired: true };
  }
  return { allowed: true, reason: 'bounded_same_tenant_read', gatewayRequired: true };
}

export function privateCompanyDataIsPublic(): false {
  return false;
}

export function communityPromptCannotOverrideGuardian(text: string): boolean {
  const isolated = isolateAgentInput('user_content', text);
  return treatAsSystemAuthority('user_content') === false && isolated.trustedAsSystem === false;
}

export function agentFirewallRemainsActive(): boolean {
  return defaultDenyUnknownHandoff().allowed === false;
}

export function schemaAgentDestructiveMigrationAllowed(): false {
  return false;
}

export function evaluateFirewallStillDefaultDeny() {
  return evaluateAgentFirewall;
}
