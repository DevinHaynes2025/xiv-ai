export type DailyMode = 'OFFLINE' | 'HYBRID' | 'ONLINE';
export type DailyLearningStatus = 'CAPTURED' | 'REVIEW_REQUIRED' | 'APPROVED' | 'REJECTED';

export interface DailyTwinSignal {
  id: string;
  tenantId: string;
  userId: string;
  source: 'USER_INPUT' | 'DEVICE_EVENT' | 'LOCAL_FILE' | 'APP_ACTIVITY' | 'MANUAL_NOTE';
  consentRef: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  contentHash: string;
  capturedAt: string;
  status: DailyLearningStatus;
}

export interface DailyTwinSession {
  tenantId: string;
  userId: string;
  mode: DailyMode;
  signals: DailyTwinSignal[];
  privateByDefault: true;
  rawCloudUploadAllowed: false;
  productionMutationAllowed: false;
}

export function canEnterDailyLearningMemory(signal: DailyTwinSignal): boolean {
  return Boolean(signal.consentRef) && signal.status === 'APPROVED';
}

export function canSyncDailySignal(signal: DailyTwinSignal): boolean {
  return signal.classification !== 'TOP_SECRET' && signal.status === 'APPROVED';
}

export const consumerDailyTwinPolicy = {
  localFirst: true,
  rawPrivatePoolingByDefault: false,
  userCorrectionSupported: true,
  userDeletionWorkflowRequired: true,
  consequentialActionsHumanGated: true,
};
