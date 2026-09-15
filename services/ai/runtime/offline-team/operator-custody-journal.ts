// 12D-236 — Durable Operator Custody Journal: the durable replay store that 12D-121
// (instruction-adoption gate) and 12D-233 (custody registry) both DISCLOSE as a
// residual: "durable cross-process replay protection requires a durable atomic
// replay store — a future, separately reviewed story." This module is that story.
//
// What it provides, as a pure contract with an injected LOCAL file store:
//   * APPEND: every custody event (registration, consumption) is appended as one
//     JSONL line carrying its own hash-chained journal digest — the journal is
//     tamper-evident INDEPENDENTLY of the registry's in-memory ledger.
//   * REPLAY: a fresh OperatorCustodyRegistry is rebuilt by replaying the journal
//     ops IN ORDER through the registry's own fail-closed gates — re-registration,
//     replay, cross-purpose reuse, and out-of-order consumption refuse exactly as
//     they do live. After replay, the rebuilt registry's verifyLedger() must pass
//     AND its ledger must match the journal line-for-line; any divergence refuses
//     the load (fail-closed, never repaired).
//   * ATOMICITY: writes land through the injected store; the fs-backed store
//     writes to a temp file and renames, so a crash mid-write cannot produce a
//     half-journal that silently loads.
//
// Disclosed residuals, stated plainly (the 12D-233 disclosures carry over):
//   * The journal is LOCAL-plane only. It does NOT make the registry multi-machine:
//     two processes writing separate journal files still have separate registries;
//     one process owning the journal per custody seed remains the operator's
//     discipline (single-writer, same as every other ledger on this branch).
//   * A journal fed by an impostor records an impostor's ops — registration is not
//     issuance proof (the 12D-233 disclosure stands verbatim).
//   * The journal AUTHENTICATES the custody chain, not the operator: possession of
//     the journal file is not authorization.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     billionUsersProven: false on every surface. It calls nothing remote.

import { createHash } from 'crypto';
import * as fs from 'fs';
import {
  OperatorCustodyRegistry, type CustodyEvent, type CustodyRecord,
} from './operator-custody-registry';

export const OPERATOR_CUSTODY_JOURNAL_POLICY = Object.freeze({
  policyVersion: '12d-236-v1',
  journalVersion: 1,
  maxLineChars: 4096,
});

export const OPERATOR_CUSTODY_JOURNAL_GUARDRAILS = Object.freeze({
  replayRefusesOnAnyAnomaly: true, // out-of-order, replayed, or divergent ops refuse the load
  journalIsIndependentlyTamperEvident: true,
  atomicReplaceOnWrite: true, // temp file + rename; a partial write never loads silently
  localPlaneOnly: true, // no remote calls, ever
  singleWriterDiscipline: true, // one process per journal file — operator discipline, disclosed
  recordsFrozenAfterCreation: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false, // a divergent journal refuses; a human decides, never auto-repair
  humanDecision: 'REQUIRED' as const,
});

const digestOf = (parts: readonly (string | number)[]): string =>
  createHash('sha256').update(parts.join('|')).digest('hex');

export type CustodyJournalOp = 'register' | 'authenticate';

export interface CustodyJournalEntry {
  readonly journalVersion: 1;
  readonly op: CustodyJournalOp;
  /** Canonical op input — the exact fields the registry contract requires. */
  readonly input: {
    readonly receiptSha256: string;
    readonly purpose: string;
    readonly registeredBy?: string;
    readonly issuedAtMs?: number;
    readonly registeredAtMs?: number;
    readonly nowMs?: number;
  };
  /** sha256 over (journalGenesis + prevDigest + op + canonical input JSON). */
  readonly journalDigest: string;
}

const CANONICAL_ORDER = ['receiptSha256', 'purpose', 'registeredBy', 'issuedAtMs', 'registeredAtMs', 'nowMs'] as const;

const canonicalInput = (input: CustodyJournalEntry['input']): string => {
  const ordered: Record<string, unknown> = {};
  for (const k of CANONICAL_ORDER) {
    if (input[k] !== undefined) ordered[k] = input[k];
  }
  return JSON.stringify(ordered);
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const PURPOSE_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

/** The injected store contract — a LOCAL file, never a network sink. */
export interface CustodyJournalStore {
  /** The current journal lines, or null when no journal exists yet. */
  load(): readonly string[] | null;
  /** Atomically replace the journal with the given lines (temp + rename). */
  save(lines: readonly string[]): void;
}

/**
 * Append one custody operation to the journal and apply it to the registry. The
 * registry call happens FIRST: if the registry refuses (replay, cross-purpose,
 * out-of-order), NOTHING is journaled — the journal only ever records ops the
 * registry accepted, so a journal replay can never diverge from the live contract.
 */
export function appendCustodyOp(
  registry: OperatorCustodyRegistry,
  store: CustodyJournalStore,
  journalGenesis: string,
  op: CustodyJournalOp,
  input: CustodyJournalEntry['input'],
): Readonly<{ entry: CustodyJournalEntry; record: Readonly<CustodyRecord> }> {
  if (!(registry instanceof OperatorCustodyRegistry))
    throw new Error('a live 12D-233 OperatorCustodyRegistry is required; fail closed');
  if (op !== 'register' && op !== 'authenticate')
    throw new Error(`unknown custody journal op ${String(op)}; fail closed`);
  if (typeof journalGenesis !== 'string' || journalGenesis.length < 8)
    throw new Error('the journal genesis must be a string of at least 8 chars; fail closed');

  // Apply through the registry FIRST — refused ops never reach the journal.
  let record: Readonly<CustodyRecord>;
  if (op === 'register') {
    record = registry.register({
      receiptSha256: input.receiptSha256, purpose: input.purpose,
      registeredBy: input.registeredBy ?? '', issuedAtMs: input.issuedAtMs ?? -1,
      registeredAtMs: input.registeredAtMs ?? -1,
    });
  } else {
    const consumed = registry.authenticate({
      receiptSha256: input.receiptSha256, purpose: input.purpose, nowMs: input.nowMs ?? -1,
    });
    record = registry.recordFor(input.receiptSha256)!;
    void consumed;
  }

  // Journal the op with its own independent hash chain — walk the existing
  // chain (verifying every prior line) to find the current head digest.
  const existing = store.load();
  let prevDigest = journalGenesis;
  if (existing) {
    for (const line of existing) {
      prevDigest = parseJournalLine(line, journalGenesis, prevDigest).journalDigest;
    }
  }
  const canonical = canonicalInput(input);
  const entry: CustodyJournalEntry = Object.freeze({
    journalVersion: 1 as const,
    op,
    input: Object.freeze(input),
    journalDigest: digestOf([journalGenesis, prevDigest, op, canonical]),
  });
  const line = JSON.stringify(entry);
  if (line.length > OPERATOR_CUSTODY_JOURNAL_POLICY.maxLineChars)
    throw new Error(`custody journal line exceeds ${OPERATOR_CUSTODY_JOURNAL_POLICY.maxLineChars} chars; fail closed`);
  store.save([...(existing ?? []), line]);
  return Object.freeze({ entry, record });
}

/** Parse and validate one journal line against the independent chain. */
function parseJournalLine(line: string, journalGenesis: string, prevDigest: string): CustodyJournalEntry {
  if (typeof line !== 'string' || line.length > OPERATOR_CUSTODY_JOURNAL_POLICY.maxLineChars)
    throw new Error('custody journal line malformed or oversized; fail closed');
  let raw: unknown;
  try { raw = JSON.parse(line); } catch { throw new Error('custody journal line is not JSON; fail closed'); }
  if (!isRecord(raw)) throw new Error('custody journal line is not an object; fail closed');
  if (raw.journalVersion !== 1) throw new Error('unknown custody journal version; fail closed');
  if (raw.op !== 'register' && raw.op !== 'authenticate')
    throw new Error('unknown custody journal op; fail closed');
  const input = raw.input;
  if (!isRecord(input) || !hex64(input.receiptSha256)
    || typeof input.purpose !== 'string' || !PURPOSE_RE.test(input.purpose))
    throw new Error('custody journal op input malformed; fail closed');
  if (raw.op === 'register' && (!isRecord(input)
    || typeof input.registeredBy !== 'string'
    || !safeInt(input.issuedAtMs) || !safeInt(input.registeredAtMs)))
    throw new Error('custody journal register op input malformed; fail closed');
  if (raw.op === 'authenticate' && !safeInt(input.nowMs))
    throw new Error('custody journal authenticate op input malformed; fail closed');
  const e: CustodyJournalEntry = {
    journalVersion: 1 as const,
    op: raw.op,
    input: input as CustodyJournalEntry['input'],
    journalDigest: typeof raw.journalDigest === 'string' ? raw.journalDigest : '',
  };
  const expect = digestOf([journalGenesis, prevDigest, e.op, canonicalInput(e.input)]);
  if (e.journalDigest !== expect)
    throw new Error('custody journal digest mismatch — the journal has been tampered with; fail closed');
  return Object.freeze(e);
}

/**
 * Rebuild a registry from a journal. The ops replay through the registry's own
 * fail-closed contract in order; afterwards the rebuilt registry's ledger must
 * match the journal line-for-line and verify. ANY anomaly refuses the load —
 * a tampered journal is never silently repaired.
 */
export function replayCustodyJournal(
  store: CustodyJournalStore,
  journalGenesis: string,
): Readonly<{ registry: OperatorCustodyRegistry; ops: number }> {
  if (typeof journalGenesis !== 'string' || journalGenesis.length < 8)
    throw new Error('the journal genesis must be a string of at least 8 chars; fail closed');
  const lines = store.load();
  if (!lines) throw new Error('no custody journal found; fail closed');
  const registry = new OperatorCustodyRegistry(journalGenesis);
  let prev = journalGenesis;
  let ops = 0;
  for (const line of lines) {
    const e = parseJournalLine(line, journalGenesis, prev);
    prev = e.journalDigest;
    if (e.op === 'register') {
      registry.register({
        receiptSha256: e.input.receiptSha256, purpose: e.input.purpose,
        registeredBy: e.input.registeredBy ?? '',
        issuedAtMs: e.input.issuedAtMs ?? -1, registeredAtMs: e.input.registeredAtMs ?? -1,
      });
    } else {
      registry.authenticate({
        receiptSha256: e.input.receiptSha256, purpose: e.input.purpose, nowMs: e.input.nowMs ?? -1,
      });
    }
    ops += 1;
  }
  // The rebuilt ledger must verify AND match the journal op-for-op.
  const verdict = registry.verifyLedger();
  if (!verdict.ok) throw new Error('the rebuilt custody ledger failed verification; fail closed');
  if (verdict.entries !== ops)
    throw new Error('the rebuilt custody ledger does not match the journal; fail closed');
  const events: readonly CustodyEvent[] = registry.ledgerEntries();
  for (let i = 0; i < events.length; i++) {
    const expectedKind = lines[i]!.includes('"op":"register"') ? 'CUSTODY_REGISTERED' : 'CUSTODY_CONSUMED';
    if (events[i]!.kind !== expectedKind)
      throw new Error(`rebuilt custody ledger diverges from the journal at entry ${i}; fail closed`);
  }
  return Object.freeze({ registry, ops });
}

/**
 * A local-file store: atomic replace (temp file + rename) so a crash mid-write
 * can never leave a half-journal that silently loads. LOCAL plane only.
 */
export class FileCustodyJournalStore implements CustodyJournalStore {
  readonly #path: string;
  readonly #tmpPath: string;

  constructor(path: string) {
    if (typeof path !== 'string' || path.length < 1 || path.includes('\0'))
      throw new Error('a journal file path is required; fail closed');
    this.#path = path;
    this.#tmpPath = `${path}.tmp`;
  }

  load(): readonly string[] | null {
    try {
      const raw = fs.readFileSync(this.#path, 'utf8');
      return raw.length === 0 ? [] : raw.split('\n').filter((l) => l.length > 0);
    } catch {
      return null; // no journal yet — the caller decides what "no journal" means
    }
  }

  save(lines: readonly string[]): void {
    const payload = `${lines.join('\n')}\n`;
    fs.writeFileSync(this.#tmpPath, payload, 'utf8');
    fs.renameSync(this.#tmpPath, this.#path); // atomic on POSIX and NTFS
  }
}