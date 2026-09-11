import { createHash } from 'node:crypto';
import type { KnowledgeClassification } from './offline-rag-retrieval-index';

export type SyncPlatform = 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'WEB' | 'ARM' | 'XR';
export type SyncJournalAction = 'LOCAL_EDIT' | 'REMOTE_EDIT_OBSERVED' | 'SYNC_ATTEMPT' | 'SYNC_SUCCESS' | 'CONFLICT_DETECTED' | 'OFFLINE_EDIT_PRESERVED' | 'RESOLUTION_APPLIED';
export interface SyncJournalAppend { eventId: string; tenantId: string; userId: string; deviceId: string; platform: SyncPlatform; itemId: string; action: SyncJournalAction; classification: KnowledgeClassification; baseVersion: number; localVersion: number; remoteVersion: number; contentHash?: string; createdAt: string; evidenceRefs: readonly string[]; }
export interface SyncJournalEvent extends SyncJournalAppend { sequence: number; previousHash: string; entryHash: string; }
export type ReconciliationState = 'NO_CHANGE' | 'RECONCILED_IDENTICAL' | 'PUSH_LOCAL_PENDING' | 'APPLY_REMOTE' | 'CONFLICT_PRESERVE_BOTH';
export interface ReconciliationInput { eventId: string; tenantId: string; userId: string; deviceId: string; platform: SyncPlatform; itemId: string; classification: KnowledgeClassification; baseVersion: number; localVersion: number; remoteVersion: number; localHash: string; remoteHash: string; createdAt: string; evidenceRefs: readonly string[]; }
export interface ReconciliationDecision { state: ReconciliationState; requiresHumanReview: boolean; preserveLocalOfflineEdit: boolean; nextVersion: number; reason: string; }
export interface PlatformSyncMetricsReceipt { platform: SyncPlatform; measuredAt: string; attempts: number; successes: number; conflicts: number; pendingPreservedEdits: number; successRate: number | null; platformSupportClaim: 'NOT_INFERRED_FROM_SYNC_STATS'; }

export const DEVICE_SYNC_CONFLICT_GUARDRAILS = { appendOnlyJournal: true, tenantAndUserIsolationRequired: true, topSecretOrdinarySyncAllowed: false, concurrentEditsAutoOverwriteAllowed: false, offlineEditsPreservedByDefault: true, platformSupportInferredFromMetrics: false, productionMutationAllowed: false } as const;

function hashEvent(event: SyncJournalAppend, sequence: number, previousHash: string): string {
  return createHash('sha256').update(JSON.stringify({ sequence, previousHash, ...event, evidenceRefs: [...event.evidenceRefs] })).digest('hex');
}

export class DeviceSyncConflictJournal {
  private readonly events: SyncJournalEvent[] = [];

  append(event: SyncJournalAppend): SyncJournalEvent {
    if (!event.eventId || !event.tenantId || !event.userId || !event.deviceId || !event.itemId) throw new Error('complete sync journal identity required');
    if (!event.createdAt || Number.isNaN(Date.parse(event.createdAt))) throw new Error('valid journal timestamp required');
    if (event.classification === 'TOP_SECRET') throw new Error('TOP_SECRET excluded from ordinary device sync journal');
    if (event.evidenceRefs.length === 0) throw new Error('sync journal event requires evidence');
    if ([event.baseVersion, event.localVersion, event.remoteVersion].some(v => !Number.isInteger(v) || v < 0)) throw new Error('sync versions must be non-negative integers');
    if (this.events.length > 0 && this.events[0].tenantId !== event.tenantId) throw new Error('sync journal instance is tenant scoped');
    const sequence = this.events.length + 1;
    const previousHash = this.events.at(-1)?.entryHash ?? 'GENESIS';
    const stored: SyncJournalEvent = { ...event, evidenceRefs: [...event.evidenceRefs], sequence, previousHash, entryHash: hashEvent(event, sequence, previousHash) };
    this.events.push(stored);
    return { ...stored, evidenceRefs: [...stored.evidenceRefs] };
  }

  restore(events: readonly SyncJournalEvent[]): number {
    if (this.events.length !== 0) throw new Error('restore requires an empty journal');
    let previousHash = 'GENESIS';
    let tenantId: string | undefined;
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      if (!tenantId) tenantId = event.tenantId;
      if (event.tenantId !== tenantId) throw new Error('restored sync journal must contain one tenant');
      if (event.classification === 'TOP_SECRET') throw new Error('TOP_SECRET excluded from ordinary device sync journal');
      const { sequence, previousHash: storedPreviousHash, entryHash, ...append } = event;
      if (sequence !== i + 1 || storedPreviousHash !== previousHash || hashEvent(append, sequence, previousHash) !== entryHash) throw new Error('sync journal integrity verification failed');
      this.events.push({ ...event, evidenceRefs: [...event.evidenceRefs] });
      previousHash = entryHash;
    }
    return this.events.length;
  }

  list(tenantId: string, userId?: string): readonly SyncJournalEvent[] {
    return this.events.filter(e => e.tenantId === tenantId && (!userId || e.userId === userId)).map(e => ({ ...e, evidenceRefs: [...e.evidenceRefs] }));
  }

  verifyIntegrity(): boolean {
    let previousHash = 'GENESIS';
    let tenantId: string | undefined;
    for (let i = 0; i < this.events.length; i += 1) {
      const event = this.events[i];
      if (!tenantId) tenantId = event.tenantId;
      if (event.tenantId !== tenantId) return false;
      const { sequence, previousHash: storedPreviousHash, entryHash, ...append } = event;
      if (sequence !== i + 1 || storedPreviousHash !== previousHash || hashEvent(append, sequence, previousHash) !== entryHash) return false;
      previousHash = entryHash;
    }
    return true;
  }

  evaluateAndRecord(input: ReconciliationInput): ReconciliationDecision {
    if (input.classification === 'TOP_SECRET') throw new Error('TOP_SECRET excluded from ordinary reconciliation');
    if (input.evidenceRefs.length === 0) throw new Error('reconciliation requires evidence');
    const localAdvanced = input.localVersion > input.baseVersion;
    const remoteAdvanced = input.remoteVersion > input.baseVersion;
    const nextVersion = Math.max(input.baseVersion, input.localVersion, input.remoteVersion);
    if (input.localHash === input.remoteHash && (localAdvanced || remoteAdvanced)) { this.append({ ...input, action: 'RESOLUTION_APPLIED', contentHash: input.localHash }); return { state: 'RECONCILED_IDENTICAL', requiresHumanReview: false, preserveLocalOfflineEdit: false, nextVersion, reason: 'local and remote payload hashes are identical' }; }
    if (localAdvanced && remoteAdvanced) { this.append({ ...input, action: 'CONFLICT_DETECTED', contentHash: input.localHash }); this.append({ ...input, eventId: `${input.eventId}:preserve-local`, action: 'OFFLINE_EDIT_PRESERVED', contentHash: input.localHash }); return { state: 'CONFLICT_PRESERVE_BOTH', requiresHumanReview: true, preserveLocalOfflineEdit: true, nextVersion, reason: 'both local and remote changed after the last common version' }; }
    if (localAdvanced) { this.append({ ...input, action: 'OFFLINE_EDIT_PRESERVED', contentHash: input.localHash }); return { state: 'PUSH_LOCAL_PENDING', requiresHumanReview: false, preserveLocalOfflineEdit: true, nextVersion: input.localVersion, reason: 'local offline edit remains pending until authorized sync succeeds' }; }
    if (remoteAdvanced) { this.append({ ...input, action: 'REMOTE_EDIT_OBSERVED', contentHash: input.remoteHash }); return { state: 'APPLY_REMOTE', requiresHumanReview: false, preserveLocalOfflineEdit: false, nextVersion: input.remoteVersion, reason: 'remote changed while local remained at the common base' }; }
    return { state: 'NO_CHANGE', requiresHumanReview: false, preserveLocalOfflineEdit: false, nextVersion: input.baseVersion, reason: 'neither side changed after the common base' };
  }

  buildPlatformMetrics(platform: SyncPlatform, measuredAt: string): PlatformSyncMetricsReceipt {
    const rows = this.events.filter(e => e.platform === platform);
    const attempts = rows.filter(e => e.action === 'SYNC_ATTEMPT').length;
    const successes = rows.filter(e => e.action === 'SYNC_SUCCESS').length;
    return { platform, measuredAt, attempts, successes, conflicts: rows.filter(e => e.action === 'CONFLICT_DETECTED').length, pendingPreservedEdits: rows.filter(e => e.action === 'OFFLINE_EDIT_PRESERVED').length, successRate: attempts === 0 ? null : successes / attempts, platformSupportClaim: 'NOT_INFERRED_FROM_SYNC_STATS' };
  }
}
