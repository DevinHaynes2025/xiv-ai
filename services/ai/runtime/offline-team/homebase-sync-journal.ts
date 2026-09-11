export type SyncJournalStatus = 'QUEUED'|'REVIEW_REQUIRED'|'APPROVED'|'REJECTED'|'CONFLICT';
export interface SyncJournalEntry { id:string; tenantId:string; deviceId:string; sourceCheckpointId:string; classification:'PUBLIC'|'INTERNAL'|'CONFIDENTIAL'|'TOP_SECRET'; changeType:'MEMORY'|'LESSON'|'TASK'|'CONFIG'|'DIGITAL_TWIN'; contentHash:string; evidenceRefs:string[]; status:SyncJournalStatus; humanApproval:boolean; createdAt:string; }
export function classifySyncEntry(entry:SyncJournalEntry, homebaseHash?:string):SyncJournalEntry {
  if (!entry.tenantId || !entry.deviceId || !entry.contentHash) throw new Error('tenant/device/hash required');
  if (entry.classification === 'TOP_SECRET') return { ...entry, status:'REVIEW_REQUIRED', humanApproval:false };
  if (!entry.evidenceRefs.length) return { ...entry, status:'REVIEW_REQUIRED', humanApproval:false };
  if (homebaseHash && homebaseHash !== entry.contentHash) return { ...entry, status:'CONFLICT', humanApproval:false };
  return { ...entry, status:'QUEUED', humanApproval:false };
}
export function approveSyncEntry(entry:SyncJournalEntry):SyncJournalEntry {
  if (entry.status === 'CONFLICT') throw new Error('conflict must be resolved before approval');
  return { ...entry, status:'APPROVED', humanApproval:true };
}
export const syncJournalGuardrails = { appendOnly:true, topSecretAutoSync:false, autoTrustOfflineChanges:false, humanApprovalBeforeHomebaseWrite:true } as const;
