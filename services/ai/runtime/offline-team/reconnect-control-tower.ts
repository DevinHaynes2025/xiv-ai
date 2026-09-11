export type ReconnectItemState = 'QUEUED' | 'REVIEW_REQUIRED' | 'CONFLICT' | 'APPROVED' | 'REJECTED';

export interface ReconnectControlTowerItem {
  id: string;
  tenantId: string;
  sourceDeviceId: string;
  state: ReconnectItemState;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  evidenceRefs: string[];
  payloadHash: string;
  humanApprovalRequired: boolean;
}

export interface ReconnectControlTowerSummary {
  queued: number;
  reviewRequired: number;
  conflicts: number;
  approved: number;
  rejected: number;
  topSecretHeldLocal: number;
}

export function summarizeReconnect(items: ReconnectControlTowerItem[]): ReconnectControlTowerSummary {
  return {
    queued: items.filter(i => i.state === 'QUEUED').length,
    reviewRequired: items.filter(i => i.state === 'REVIEW_REQUIRED').length,
    conflicts: items.filter(i => i.state === 'CONFLICT').length,
    approved: items.filter(i => i.state === 'APPROVED').length,
    rejected: items.filter(i => i.state === 'REJECTED').length,
    topSecretHeldLocal: items.filter(i => i.classification === 'TOP_SECRET').length,
  };
}
