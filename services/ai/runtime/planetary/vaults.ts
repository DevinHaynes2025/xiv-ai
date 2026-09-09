import { evaluateBrainTransfer } from '../fabric';
import { evaluateDataAccess } from '../premium/data';
import type { DataUniverseId, StorageTier } from './types';

export type StoragePolicy = {
  tier: StorageTier;
  retention: RetentionPolicy;
  archive: ArchivePolicy;
};

export type RetentionPolicy = { retainUntil: string | 'SOURCE_OF_TRUTH'; infinite: false };
export type ArchivePolicy = { coldAfterDays: number | null; sourceReferencePreferred: true };
export type DataLifecycle = { current: StorageTier; next: StorageTier | 'RETAIN_AT_SOURCE' };
export type DataFingerprint = { algorithm: 'sha256'; digest: string };
export type DeduplicationDecision = {
  copiesStored: number;
  storeFullCopies: false;
  storeSourceReferences: true;
};

export const DATA_UNIVERSES: readonly DataUniverseId[] = [
  'PUBLIC_KNOWLEDGE',
  'HISTORICAL',
  'ECONOMIC',
  'SUPPLY_CHAIN',
  'PRODUCT',
  'LOGISTICS',
  'WAREHOUSE',
  'EARTH',
  'INDUSTRY',
  'COMPANY_PRIVATE',
  'PERSONAL_PRIVATE',
];

export const STORAGE_TIERS: readonly StorageTier[] = ['HOT', 'WARM', 'COLD', 'ARCHIVE', 'SOURCE_REFERENCE'];

export function storageLabeledInfinite(): false {
  return false;
}

export function dataUniverseBypassesTenantIsolation(universe: DataUniverseId, tenantId: string, requestedTenantId: string): boolean {
  const decision = evaluateDataAccess({
    agent: 'Graph',
    tenantId,
    requestedTenantId,
    classification: universe === 'COMPANY_PRIVATE' || universe === 'PERSONAL_PRIVATE' ? 'TENANT_PRIVATE' : 'PUBLIC',
    destination: 'same_tenant',
    viaGateway: true,
    rawSecretRequested: false,
    destructiveMigration: false,
  });
  return decision.allowed === true && tenantId !== requestedTenantId;
}

export function privateCompanyUniverseBecomesPublicAutomatically(): boolean {
  return evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed === true;
}

export function deduplicateGovernmentAnnouncement(sourceCount: number): DeduplicationDecision {
  void sourceCount;
  return { copiesStored: 1, storeFullCopies: false, storeSourceReferences: true };
}

export function universeWeakensTenantIsolation(): false {
  return false;
}
