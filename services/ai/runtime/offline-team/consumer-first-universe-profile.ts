export type UserMode = 'CONSUMER' | 'CREATOR' | 'ENTREPRENEUR' | 'EMPLOYEE' | 'EXECUTIVE';
export type PermissionState = 'DENIED' | 'LOCAL_ONLY' | 'APPROVED_SYNC';

export interface ConsumerUniverseProfile {
  userId: string;
  tenantId: string;
  modes: UserMode[];
  localLearningEnabled: boolean;
  permissions: Record<string, PermissionState>;
  memoryNamespace: string;
  consentVersion: string;
}

export function canLearnLocally(profile: ConsumerUniverseProfile): boolean {
  return profile.localLearningEnabled && profile.consentVersion.length > 0;
}

export function canSyncSignal(profile: ConsumerUniverseProfile, capability: string): boolean {
  return profile.permissions[capability] === 'APPROVED_SYNC';
}

export const consumerFirstPolicy = {
  defaultMode: 'CONSUMER' as UserMode,
  rawPrivateDataCentralizationAllowed: false,
  localFirst: true,
  revocablePermissionsRequired: true,
  userCorrectionSupported: true,
};
