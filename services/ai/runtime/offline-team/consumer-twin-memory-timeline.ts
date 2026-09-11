export type MemoryClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface TwinMemoryEvent {
  id: string;
  tenantId: string;
  userId: string;
  occurredAt: string;
  source: 'USER_NOTE' | 'APP_EVENT' | 'APPROVED_IMPORT' | 'AGENT_OBSERVATION';
  classification: MemoryClass;
  consentRef: string;
  summary: string;
  evidenceRefs: string[];
  confidence: number;
  approvedForRecall: boolean;
}

export function canEnterPrivateTimeline(event: TwinMemoryEvent): boolean {
  return Boolean(event.consentRef) && event.confidence >= 0 && event.confidence <= 1;
}

export function canLeaveDevice(event: TwinMemoryEvent, explicitShareApproval: boolean): boolean {
  if (event.classification === 'TOP_SECRET') return false;
  return explicitShareApproval && event.approvedForRecall;
}

export function sortTimeline(events: TwinMemoryEvent[]): TwinMemoryEvent[] {
  return [...events].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export const twinMemoryPolicy = {
  localFirst: true,
  rawPrivatePoolingByDefault: false,
  userCorrectionAllowed: true,
  userDeletionWorkflowRequired: true,
  topSecretExternalSyncAllowed: false,
};
