import type { Clock } from './clock';
import { canonicalize, sha256 } from './crypto';
import type { IdFactory } from './ids';
import type { AuditEvent, TenantRef } from './types';

export type AuditAppend = {
  tenant: TenantRef | null;
  category: AuditEvent['category'];
  kind: string;
  subjectId: string;
  principalId?: string | null;
  detail?: Record<string, unknown>;
};

const GENESIS = sha256('xiv:62d:audit:genesis');

/**
 * Append-only hash-chained ledger. Each event commits to the previous hash, so
 * a deleted or edited event breaks verification for everything after it.
 */
export class AuditLedger {
  private readonly events: AuditEvent[] = [];
  private head = GENESIS;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
  ) {}

  append(input: AuditAppend): AuditEvent {
    const sequence = this.events.length + 1;
    const at = this.clock.now();
    const body = {
      sequence,
      tenant: input.tenant,
      category: input.category,
      kind: input.kind,
      subjectId: input.subjectId,
      principalId: input.principalId ?? null,
      detail: input.detail ?? {},
      at,
      previousHash: this.head,
    };
    const event: AuditEvent = {
      eventId: this.ids.mint('aud'),
      ...body,
      hash: sha256(canonicalize(body)),
    };
    this.head = event.hash;
    this.events.push(event);
    return event;
  }

  verifyChain(): { intact: boolean; brokenAt: number | null; length: number } {
    let previous = GENESIS;
    for (const event of this.events) {
      const recomputed = sha256(
        canonicalize({
          sequence: event.sequence,
          tenant: event.tenant,
          category: event.category,
          kind: event.kind,
          subjectId: event.subjectId,
          principalId: event.principalId,
          detail: event.detail,
          at: event.at,
          previousHash: event.previousHash,
        }),
      );
      if (event.previousHash !== previous || recomputed !== event.hash) {
        return { intact: false, brokenAt: event.sequence, length: this.events.length };
      }
      previous = event.hash;
    }
    return { intact: true, brokenAt: null, length: this.events.length };
  }

  /** Reads are tenant-filtered: an organization never sees another's ledger. */
  listForTenant(tenant: TenantRef): AuditEvent[] {
    return this.events.filter(
      (event) =>
        event.tenant !== null &&
        event.tenant.organizationId === tenant.organizationId &&
        event.tenant.universeId === tenant.universeId,
    );
  }

  find(predicate: (event: AuditEvent) => boolean): AuditEvent[] {
    return this.events.filter(predicate);
  }

  has(predicate: (event: AuditEvent) => boolean): boolean {
    return this.events.some(predicate);
  }

  countBySubject(subjectId: string): number {
    return this.events.reduce((total, event) => (event.subjectId === subjectId ? total + 1 : total), 0);
  }

  get length() {
    return this.events.length;
  }

  export(): readonly AuditEvent[] {
    return this.events;
  }
}
