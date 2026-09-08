import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import type { IdFactory } from './ids';
import { tenantKey } from './isolation';
import type { TenantRef } from './types';

export type ExternalActionRecord = {
  actionId: string;
  idempotencyKey: string;
  tenant: TenantRef;
  workloadId: string;
  description: string;
  consequential: boolean;
  approvalId: string | null;
  executedAt: number;
  attempts: number;
};

export type ExternalActionResult = {
  record: ExternalActionRecord;
  executed: boolean;
  deduplicated: boolean;
};

/**
 * Ledger for actions with effects outside XIV.
 *
 * The idempotency key is derived from the tenant and the caller's logical action
 * key, deliberately excluding the attempt number and the executing node. A
 * workload that is recovered on a different node therefore cannot perform its
 * external action twice, which is what AC-12 measures.
 */
export class ExternalActionLedger {
  private readonly byKey = new Map<string, ExternalActionRecord>();
  private duplicateAttempts = 0;
  private unapprovedBlocked = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  static key(tenant: TenantRef, actionKey: string): string {
    return `${tenantKey(tenant)}::${actionKey}`;
  }

  execute(input: {
    tenant: TenantRef;
    workloadId: string;
    actionKey: string;
    description: string;
    consequential: boolean;
    approvalId?: string | null;
  }): ExternalActionResult {
    const idempotencyKey = ExternalActionLedger.key(input.tenant, input.actionKey);
    const existing = this.byKey.get(idempotencyKey);
    if (existing) {
      this.duplicateAttempts += 1;
      const updated: ExternalActionRecord = { ...existing, attempts: existing.attempts + 1 };
      this.byKey.set(idempotencyKey, updated);
      this.audit.append({
        tenant: input.tenant,
        category: 'workload',
        kind: 'external_action_deduplicated',
        subjectId: input.workloadId,
        detail: { idempotencyKey, attempts: updated.attempts },
      });
      return { record: updated, executed: false, deduplicated: true };
    }

    if (input.consequential && !input.approvalId) {
      this.unapprovedBlocked += 1;
      this.audit.append({
        tenant: input.tenant,
        category: 'security',
        kind: 'external_action_blocked',
        subjectId: input.workloadId,
        detail: { reason: 'approval_missing', idempotencyKey },
      });
      throw new Error('external_action_requires_approval');
    }

    const record: ExternalActionRecord = {
      actionId: this.ids.mint('extact'),
      idempotencyKey,
      tenant: input.tenant,
      workloadId: input.workloadId,
      description: input.description,
      consequential: input.consequential,
      approvalId: input.approvalId ?? null,
      executedAt: this.clock.now(),
      attempts: 1,
    };
    this.byKey.set(idempotencyKey, record);
    this.audit.append({
      tenant: input.tenant,
      category: 'workload',
      kind: 'external_action_executed',
      subjectId: input.workloadId,
      detail: { actionId: record.actionId, idempotencyKey, consequential: record.consequential },
    });
    return { record, executed: true, deduplicated: false };
  }

  executionCount(tenant: TenantRef, actionKey: string): number {
    const record = this.byKey.get(ExternalActionLedger.key(tenant, actionKey));
    return record ? 1 : 0;
  }

  attemptsFor(tenant: TenantRef, actionKey: string): number {
    return this.byKey.get(ExternalActionLedger.key(tenant, actionKey))?.attempts ?? 0;
  }

  /** Distinct executed actions. Duplicate attempts never increase this. */
  get executedCount() {
    return this.byKey.size;
  }

  get duplicateAttemptCount() {
    return this.duplicateAttempts;
  }

  get blockedUnapprovedCount() {
    return this.unapprovedBlocked;
  }

  export(): Record<string, ExternalActionRecord> {
    return Object.fromEntries(this.byKey.entries());
  }
}
