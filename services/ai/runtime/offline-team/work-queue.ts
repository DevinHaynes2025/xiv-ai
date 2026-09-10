export type OfflineWorkStatus = 'QUEUED' | 'LEASED' | 'DONE' | 'FAILED' | 'BLOCKED';

export interface OfflineWorkItem {
  id: string;
  storyId: string;
  objective: string;
  priority: number;
  status: OfflineWorkStatus;
  attempts: number;
  maxAttempts: number;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const OFFLINE_QUEUE_GUARDRAILS = {
  productionWritesAllowed: false,
  destructiveDbChangesAllowed: false,
  policyGateBypassAllowed: false,
  leaseRequiredBeforeExecution: true,
  maxBatchLease: 32,
} as const;

export class OfflineWorkQueue {
  private readonly items = new Map<string, OfflineWorkItem>();

  enqueue(item: Omit<OfflineWorkItem, 'status' | 'attempts' | 'createdAt' | 'updatedAt'>, now = new Date()): OfflineWorkItem {
    if (!item.id || !item.storyId || !item.objective) throw new Error('id, storyId and objective are required');
    if (this.items.has(item.id)) throw new Error(`duplicate work item: ${item.id}`);
    if (item.maxAttempts < 1) throw new Error('maxAttempts must be >= 1');
    const ts = now.toISOString();
    const next: OfflineWorkItem = { ...item, status: 'QUEUED', attempts: 0, createdAt: ts, updatedAt: ts };
    this.items.set(next.id, next);
    return { ...next };
  }

  lease(owner: string, now = new Date(), ttlMs = 5 * 60_000, limit = 1): OfflineWorkItem[] {
    if (!owner) throw new Error('lease owner is required');
    const take = Math.max(1, Math.min(limit, OFFLINE_QUEUE_GUARDRAILS.maxBatchLease));
    const candidates = [...this.items.values()]
      .filter((i) => i.status === 'QUEUED' && i.attempts < i.maxAttempts)
      .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt))
      .slice(0, take);
    for (const item of candidates) {
      item.status = 'LEASED';
      item.attempts += 1;
      item.leaseOwner = owner;
      item.leaseExpiresAt = new Date(now.getTime() + ttlMs).toISOString();
      item.updatedAt = now.toISOString();
    }
    return candidates.map((i) => ({ ...i }));
  }

  complete(id: string, owner: string, now = new Date()): OfflineWorkItem {
    const item = this.requireLeased(id, owner);
    item.status = 'DONE';
    delete item.leaseOwner;
    delete item.leaseExpiresAt;
    item.updatedAt = now.toISOString();
    return { ...item };
  }

  fail(id: string, owner: string, now = new Date()): OfflineWorkItem {
    const item = this.requireLeased(id, owner);
    item.status = item.attempts >= item.maxAttempts ? 'FAILED' : 'QUEUED';
    delete item.leaseOwner;
    delete item.leaseExpiresAt;
    item.updatedAt = now.toISOString();
    return { ...item };
  }

  recoverExpiredLeases(now = new Date()): OfflineWorkItem[] {
    const recovered: OfflineWorkItem[] = [];
    for (const item of this.items.values()) {
      if (item.status !== 'LEASED' || !item.leaseExpiresAt) continue;
      if (Date.parse(item.leaseExpiresAt) > now.getTime()) continue;
      item.status = item.attempts >= item.maxAttempts ? 'FAILED' : 'QUEUED';
      delete item.leaseOwner;
      delete item.leaseExpiresAt;
      item.updatedAt = now.toISOString();
      recovered.push({ ...item });
    }
    return recovered;
  }

  snapshot(): OfflineWorkItem[] {
    return [...this.items.values()].map((i) => ({ ...i }));
  }

  restore(items: readonly OfflineWorkItem[]): void {
    this.items.clear();
    for (const item of items) this.items.set(item.id, { ...item });
  }

  private requireLeased(id: string, owner: string): OfflineWorkItem {
    const item = this.items.get(id);
    if (!item) throw new Error(`unknown work item: ${id}`);
    if (item.status !== 'LEASED' || item.leaseOwner !== owner) throw new Error('active lease owned by caller is required');
    return item;
  }
}
