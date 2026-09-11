export type ConflictReviewStatus = 'PENDING' | 'RESOLVED_ACCEPT_LOCAL' | 'RESOLVED_ACCEPT_REMOTE' | 'RESOLVED_MANUAL';
export type ConflictSecurityClass = 'ORDINARY' | 'TOP_SECRET';

export interface SyncConflictReviewItem {
  id: string;
  tenantId: string;
  platform: string;
  localVersion: string;
  remoteVersion: string;
  securityClass: ConflictSecurityClass;
  evidenceRefs: string[];
  status: ConflictReviewStatus;
  createdAt: string;
  resolvedAt?: string;
  reviewerId?: string;
  rationale?: string;
}

export function mayExternalizeConflict(item: SyncConflictReviewItem): boolean {
  return item.securityClass !== 'TOP_SECRET';
}

export class SyncConflictReviewQueue {
  private readonly items = new Map<string, SyncConflictReviewItem>();

  enqueue(input: Omit<SyncConflictReviewItem, 'status' | 'createdAt' | 'resolvedAt' | 'reviewerId' | 'rationale'>): SyncConflictReviewItem {
    if (!input.id || !input.tenantId || !input.platform) throw new Error('Conflict identity fields are required');
    if (input.evidenceRefs.length === 0) throw new Error('Conflict review requires evidence');
    if (input.localVersion === input.remoteVersion) throw new Error('No version conflict exists');
    const item: SyncConflictReviewItem = { ...input, status: 'PENDING', createdAt: new Date().toISOString() };
    this.items.set(item.id, item);
    return { ...item, evidenceRefs: [...item.evidenceRefs] };
  }

  resolve(input: {
    id: string;
    reviewer: { kind: 'HUMAN' | 'AGENT'; id: string };
    resolution: Exclude<ConflictReviewStatus, 'PENDING'>;
    rationale: string;
    evidenceRefs: string[];
  }): SyncConflictReviewItem {
    if (input.reviewer.kind !== 'HUMAN') throw new Error('Sync conflicts require human review');
    if (!input.reviewer.id || !input.rationale.trim() || input.evidenceRefs.length === 0) throw new Error('Resolution requires reviewer, rationale and evidence');
    const current = this.items.get(input.id);
    if (!current) throw new Error('Conflict not found');
    if (current.status !== 'PENDING') throw new Error('Conflict already resolved');
    const resolved: SyncConflictReviewItem = {
      ...current,
      status: input.resolution,
      reviewerId: input.reviewer.id,
      rationale: input.rationale.trim(),
      evidenceRefs: [...new Set([...current.evidenceRefs, ...input.evidenceRefs])],
      resolvedAt: new Date().toISOString(),
    };
    this.items.set(input.id, resolved);
    return { ...resolved, evidenceRefs: [...resolved.evidenceRefs] };
  }

  pendingCount(): number {
    return [...this.items.values()].filter((item) => item.status === 'PENDING').length;
  }

  sanitizedSummary(): { total: number; pending: number; topSecretPending: number } {
    const all = [...this.items.values()];
    return {
      total: all.length,
      pending: all.filter((item) => item.status === 'PENDING').length,
      topSecretPending: all.filter((item) => item.status === 'PENDING' && item.securityClass === 'TOP_SECRET').length,
    };
  }
}
