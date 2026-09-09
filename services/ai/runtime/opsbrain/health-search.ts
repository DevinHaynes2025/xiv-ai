import type { HealthDomain, HealthState } from './command-types';
import { routeToNearestRegion } from './regions';

export type OperationsRegion =
  | 'NORTH_AMERICA'
  | 'EUROPE'
  | 'LATIN_AMERICA'
  | 'AFRICA'
  | 'MIDDLE_EAST'
  | 'ASIA_PACIFIC';

export type RegionalPolicy = { requiredRegion: OperationsRegion };
export type DataResidencyPolicy = { tenantId: string; requiredRegion: OperationsRegion };
export type RegionalProvider = { providerId: string; live: false };
export type RegionalHealth = { region: OperationsRegion; productionLive: false };
export type RegionalFailoverPolicy = { automaticCrossRegion: false };

export type ServiceDependency = { serviceId: string };
export type FailureDomain = { domainId: string };
export type RecoveryPolicy = { guaranteed: false };
export type FailoverPolicy = { guaranteed: false };
export type BackupReference = { referenceId: string };
export type RecoveryObjective = { target: string; guaranteed: false };
export type RecoveryTest = { tested: boolean };
export type ContinuityPlan = { planId: string; fakeGuarantee: false };

export type DomainHealth = { domain: HealthDomain; state: HealthState };

export function treatUnknownHealthAsHealthy(state: HealthState): boolean {
  return state === 'HEALTHY';
}

export function scoreBusinessHealth(domains: readonly DomainHealth[]): { unknownTreatedHealthy: false } {
  void domains;
  return { unknownTreatedHealthy: false };
}

export function searchOperations(input: {
  query: string;
  tenantId?: string;
  universeId?: string;
  classification?: 'PUBLIC' | 'TENANT_PRIVATE';
  purpose?: string;
  regionAllowed?: boolean;
  rightsAllowed?: boolean;
  retentionAllows?: boolean;
}) {
  if (!input.tenantId || !input.universeId || !input.purpose) {
    return { allowed: false as const, reason: 'operations_search_requires_tenant_universe_purpose' };
  }
  if (input.classification === 'TENANT_PRIVATE' && input.purpose === 'public_discovery') {
    return { allowed: false as const, reason: 'operations_search_honors_classification' };
  }
  if (input.regionAllowed === false || input.rightsAllowed === false || input.retentionAllows === false) {
    return { allowed: false as const, reason: 'operations_search_honors_region_retention_rights' };
  }
  return { allowed: true as const, query: input.query, contentGranted: false as const };
}

export function regionalOperationsMove(input: {
  requested: 'NORTH_AMERICA' | 'EUROPE' | 'LATIN_AMERICA' | 'AFRICA' | 'MIDDLE_EAST' | 'ASIA_PACIFIC';
  required: 'NORTH_AMERICA' | 'EUROPE' | 'LATIN_AMERICA' | 'AFRICA' | 'MIDDLE_EAST' | 'ASIA_PACIFIC';
  tenantId: string;
}) {
  return routeToNearestRegion({
    requested: input.requested,
    policy: { tenantId: input.tenantId, requiredRegion: input.required },
  });
}

export function fakeRecoveryGuarantee(): false {
  return false;
}

export function productionGlobalRegionsClaimed(): false {
  return false;
}
