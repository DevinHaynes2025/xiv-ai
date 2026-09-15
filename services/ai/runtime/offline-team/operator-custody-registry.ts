// 12D-233 — Operator Custody Registry: the out-of-band receipt authenticator that
// every receipt-gated contract on the ladder has DISCLOSED as a residual.
//
// Six contracts on this branch disclose the same residual: "receipts authenticate
// OUT-OF-BAND via the operator custody registry" — the scaling bridge (12D-130),
// the failover bridge (12D-131), the sync bridge (12D-232), the
// instruction-adoption gate, the tenant-routed queue, and the offline agent
// runtime (12D-231). Until now no such registry existed: every contract bound
// declared receipt STRINGS for shape and separation only, and disclosed that a
// recomputed digest is self-consistent and authenticates nothing by itself.
//
// This module is that registry, as a pure, fail-closed, local-first contract:
//   * REGISTER: the operator records each issued receipt, once, with its purpose.
//     A receipt may be registered exactly once — re-registration (including for a
//     different purpose) is refused. Registration does NOT prove the operator
//     issued the receipt (disclosed below); it proves the operator's local
//     registry KNOWS it.
//   * AUTHENTICATE + CONSUME: a gate presenting a registered receipt gets it
//     verified for the matching purpose and CONSUMED — exactly one consumption per
//     receipt, ever. A second presentation (the replay that collapses the
//     separation between authorization gates) is refused. A receipt registered
//     for one purpose presented at another gate is refused. Consumption cannot
//     predate registration.
//   * This is the enforcement point for "one instruction per reconciled batch"
//     (12D-232) and the receipt-separation residuals of 12D-130/131: with the
//     registry wired in, a reused or cross-gate receipt refuses at the gate,
//     instead of being disclosed.
//   * Every event lands in an append-only, hash-chained ledger with frozen
//     records, exactly as 12D-231.
//
// Disclosed residual, stated plainly: the registry is a LOCAL component on the
// same plane as every runtime. It narrows the residual — a receipt that was
// never registered, reused, cross-purpose, or already consumed now REFUSES —
// but it does not replace custody: the operator still holds the original
// receipt material out-of-band, and a registry fed by an impostor records an
// impostor's receipts. The registry is also process-local (in-memory), NOT
// durable: a restarted process forgets prior registrations, and a second
// process has its own — durable cross-process replay protection remains a
// future, separately reviewed story (the 12D-121 adoption gate discloses the
// same limit). humanDecision: 'REQUIRED', learningPromoted: false,
// remoteCalls: 0, billionUsersProven: false on every surface. It calls nothing.

import { createHash } from 'crypto';

export const OPERATOR_CUSTODY_POLICY = Object.freeze({
  policyVersion: '12d-233-v1',
  /** Receipts are 64-hex sha256 — the same convention as every receipt-gated contract. */
  receiptHexChars: 64,
  maxPurposeChars: 128,
  maxRegistrantChars: 128,
  maxNoteChars: 256,
});

export const OPERATOR_CUSTODY_GUARDRAILS = Object.freeze({
  receiptsAreRegisteredExactlyOnce: true,
  oneConsumptionPerReceipt: true,
  crossPurposeReuseRefused: true,
  consumptionCannotPredateRegistration: true,
  registrationIsNotIssuanceProof: true, // disclosed residual: out-of-band custody still owns authenticity
  processLocalNotDurable: true, // disclosed residual: replay protection dies with the process
  ledgerTamperEvident: true,
  recordsFrozenAfterCreation: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface CustodyRecord {
  readonly receiptSha256: string;
  readonly purpose: string;
  readonly registeredBy: string;
  /** The time the operator says the receipt was ISSUED (out-of-band fact, bound verbatim). */
  readonly issuedAtMs: number;
  readonly registeredAtMs: number;
  /** sha256 over (genesis + 'CUSTODY' + receipt + purpose + registrant + issuedAt + registeredAt). */
  readonly recordDigest: string;
}

export type CustodyEventKind =
  | 'CUSTODY_REGISTERED' | 'CUSTODY_CONSUMED';

export interface CustodyEvent {
  readonly seq: number;
  readonly atMs: number;
  readonly receiptSha256: string;
  readonly purpose: string;
  readonly kind: CustodyEventKind;
  readonly detail: string;
  /** sha256 over (genesis + prevHash + seq + atMs + receipt + purpose + kind + detail). */
  readonly hash: string;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const PURPOSE_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

const digestOf = (parts: readonly (string | number)[]): string =>
  createHash('sha256').update(parts.join('|')).digest('hex');

const short = (v: string): string => `${v.slice(0, 8)}…`;

/**
 * The operator's local custody registry for single-use operator receipts.
 * Pure: no model calls, no remote calls, no provider fallback, no execution.
 */
export class OperatorCustodyRegistry {
  readonly #genesis: string;
  readonly #records = new Map<string, CustodyRecord>();
  readonly #events: CustodyEvent[] = [];
  #seq = 0;

  constructor(seed: string) {
    if (typeof seed !== 'string' || seed.length < 8)
      throw new Error('custody registry seed must be a string of at least 8 chars; fail closed');
    this.#genesis = digestOf([seed, 'OPERATOR_CUSTODY_GENESIS']);
  }

  /**
   * Record that an operator receipt was ISSUED for exactly one purpose. Idempotent
   * refusal on re-registration: a receipt may be registered exactly once, and never
   * for a second purpose — a receipt reused across gates is the collapse the
   * receipt-gated ladder refuses.
   */
  register(input: {
    receiptSha256: string;
    purpose: string;
    registeredBy: string;
    issuedAtMs: number;
    registeredAtMs: number;
    note?: string;
  }): Readonly<CustodyRecord> {
    if (!input || typeof input !== 'object')
      throw new Error('custody registration input required; fail closed');
    if (!hex64(input.receiptSha256))
      throw new Error('the registered receipt must be 64-hex sha256; fail closed');
    if (typeof input.purpose !== 'string' || !PURPOSE_RE.test(input.purpose))
      throw new Error(`the custody purpose must match ${PURPOSE_RE.source}; fail closed`);
    if (typeof input.registeredBy !== 'string' || !ID_RE.test(input.registeredBy))
      throw new Error(`the registrant identity must match ${ID_RE.source}; fail closed`);
    if (!safeInt(input.issuedAtMs) || input.issuedAtMs < 0)
      throw new Error('issued time invalid; fail closed');
    if (!safeInt(input.registeredAtMs) || input.registeredAtMs < 0)
      throw new Error('registration time invalid; fail closed');
    if (input.registeredAtMs < input.issuedAtMs)
      throw new Error('a receipt cannot be registered before it was issued; fail closed');
    if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > OPERATOR_CUSTODY_POLICY.maxNoteChars))
      throw new Error(`the custody note must be at most ${OPERATOR_CUSTODY_POLICY.maxNoteChars} chars; fail closed`);
    const existing = this.#records.get(input.receiptSha256);
    if (existing) {
      if (existing.purpose === input.purpose)
        throw new Error(`receipt ${short(input.receiptSha256)} is already registered; a receipt is registered exactly once; fail closed`);
      throw new Error(`receipt ${short(input.receiptSha256)} is registered for purpose ${existing.purpose}; cross-purpose re-registration refused; fail closed`);
    }
    const record: CustodyRecord = Object.freeze({
      receiptSha256: input.receiptSha256,
      purpose: input.purpose,
      registeredBy: input.registeredBy,
      issuedAtMs: input.issuedAtMs,
      registeredAtMs: input.registeredAtMs,
      recordDigest: digestOf([
        this.#genesis, 'CUSTODY', input.receiptSha256, input.purpose,
        input.registeredBy, input.issuedAtMs, input.registeredAtMs,
      ]),
    });
    this.#records.set(input.receiptSha256, record);
    this.#append(input.receiptSha256, input.purpose, 'CUSTODY_REGISTERED', input.registeredAtMs,
      `registered by ${input.registeredBy} (issued at ${input.issuedAtMs}); out-of-band authenticity disclosed`);
    return record;
  }

  /**
   * Verify a presented receipt against the registry and CONSUME it. Exactly one
   * consumption per receipt, ever: a replayed receipt refuses; a receipt
   * registered for a different purpose refuses; consumption cannot predate
   * registration. Returns a frozen, hash-chained consumption record.
   */
  authenticate(input: { receiptSha256: string; purpose: string; nowMs: number }): Readonly<{
    receiptSha256: string;
    purpose: string;
    consumedAtMs: number;
    registrationIssuedAtMs: number;
    registrationRegisteredAtMs: number;
  }> {
    if (!input || typeof input !== 'object')
      throw new Error('custody authentication input required; fail closed');
    if (!hex64(input.receiptSha256))
      throw new Error('the presented receipt must be 64-hex sha256; fail closed');
    if (typeof input.purpose !== 'string' || !PURPOSE_RE.test(input.purpose))
      throw new Error(`the presented purpose must match ${PURPOSE_RE.source}; fail closed`);
    if (!safeInt(input.nowMs) || input.nowMs < 0)
      throw new Error('authentication time invalid; fail closed');
    const record = this.#records.get(input.receiptSha256);
    if (!record)
      throw new Error(`receipt ${short(input.receiptSha256)} is not in the custody registry; fail closed`);
    if (record.purpose !== input.purpose)
      throw new Error(`receipt ${short(input.receiptSha256)} is registered for purpose ${record.purpose}, not ${input.purpose}; cross-purpose reuse refused; fail closed`);
    if (input.nowMs < record.issuedAtMs)
      throw new Error('the receipt cannot be consumed before it was issued; fail closed');
    // Single-use: exactly one CUSTODY_CONSUMED event may exist for this receipt.
    const consumed = this.#events.some(
      (e) => e.kind === 'CUSTODY_CONSUMED' && e.receiptSha256 === input.receiptSha256,
    );
    if (consumed)
      throw new Error(`receipt ${short(input.receiptSha256)} was already consumed; single-use refused; fail closed`);
    this.#append(input.receiptSha256, input.purpose, 'CUSTODY_CONSUMED', input.nowMs,
      `consumed once for ${input.purpose}; replay of this receipt will refuse`);
    return Object.freeze({
      receiptSha256: input.receiptSha256,
      purpose: input.purpose,
      consumedAtMs: input.nowMs,
      registrationIssuedAtMs: record.issuedAtMs,
      registrationRegisteredAtMs: record.registeredAtMs,
    });
  }

  /** Read-only verification: is this receipt registered (and unconsumed) for this purpose? */
  verify(input: { receiptSha256: string; purpose: string }): Readonly<{
    registered: boolean;
    consumed: boolean;
    purpose: string;
  }> {
    if (!input || typeof input !== 'object'
      || !hex64(input.receiptSha256)
      || typeof input.purpose !== 'string' || !PURPOSE_RE.test(input.purpose))
      throw new Error('malformed custody verification input; fail closed');
    const record = this.#records.get(input.receiptSha256);
    if (!record)
      return Object.freeze({ registered: false, consumed: false, purpose: input.purpose });
    const consumed = this.#events.some(
      (e) => e.kind === 'CUSTODY_CONSUMED' && e.receiptSha256 === input.receiptSha256,
    );
    return Object.freeze({
      registered: record.purpose === input.purpose,
      consumed,
      purpose: input.purpose,
    });
  }

  recordFor(receiptSha256: string): Readonly<CustodyRecord> | null {
    if (!hex64(receiptSha256))
      throw new Error('the receipt must be 64-hex sha256; fail closed');
    return this.#records.get(receiptSha256) ?? null;
  }

  /** Tamper-evident check over the whole append-only custody ledger. */
  verifyLedger(): { ok: boolean; entries: number } {
    let prev = this.#genesis;
    for (let i = 0; i < this.#events.length; i++) {
      const e = this.#events[i];
      const expect = digestOf([
        this.#genesis, prev, String(e.seq), String(e.atMs),
        e.receiptSha256, e.purpose, e.kind, e.detail,
      ]);
      if (e.seq !== i || e.hash !== expect) return { ok: false, entries: this.#events.length };
      prev = e.hash;
    }
    return { ok: true, entries: this.#events.length };
  }

  ledgerEntries(): readonly CustodyEvent[] {
    return this.#events;
  }

  #append(receiptSha256: string, purpose: string, kind: CustodyEventKind, atMs: number, detail: string): void {
    const seq = this.#seq++;
    const prev = this.#events.length > 0 ? this.#events[this.#events.length - 1]!.hash : this.#genesis;
    const hash = digestOf([
      this.#genesis, prev, String(seq), String(atMs), receiptSha256, purpose, kind, detail,
    ]);
    this.#events.push(Object.freeze({ seq, atMs, receiptSha256, purpose, kind, detail, hash }));
  }
}