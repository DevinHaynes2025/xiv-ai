export interface ConsumerActivityEvent {
  id: string;
  tenantId: string;
  userId: string;
  eventType: 'CREATE' | 'LEARN' | 'SEARCH' | 'PLAN' | 'BUILD' | 'REVIEW';
  contentHash: string;
  evidenceRefs: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  consentRef: string;
  occurredAt: string;
}

export function isJournalEventUsable(event: ConsumerActivityEvent): boolean {
  return Boolean(event.id && event.tenantId && event.userId && event.contentHash && event.consentRef && event.occurredAt);
}

export const consumerActivityJournalPolicy = {
  appendOnly: true,
  rawSecretsAllowed: false,
  userExportSupported: true,
  userCorrectionSupported: true,
  topSecretExternalSyncAllowed: false,
};
