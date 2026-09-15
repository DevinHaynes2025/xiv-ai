// 12D-244 — Custody Operator Runner: executes an OPERATOR-AUTHORED plan of
// custody ops (12D-233 register / authenticate) against a 12D-237 custody
// session and returns an evidence packet for the run. This is the operator's
// loop that collects evidence — not an autonomous loop: the plan is written
// by the operator, the runner applies it verbatim, and every refusal stops
// the run.
//
// Fail-closed shape:
//   * TWO-PHASE execution. Phase 1 shape-gates EVERY step (exact keys per op,
//     types, hex64 receipts, safe timestamps, plan size) — a malformed plan
//     refuses BEFORE ANY apply, so nothing is journaled from a broken plan.
//   * Phase 2 executes steps IN ORDER, stopping on the FIRST registry
//     refusal. Refused ops are never journaled (12D-236 applies the registry
//     first), ops BEFORE the refusal STAY applied (no rollback is claimed —
//     custody journals are append-only; "undo" would be a lie), and later
//     steps are reported `pending`.
//   * The evidence packet is frozen and DETERMINISTIC: `runId` is a sha256
//     over the canonical run description {domain, mode, steps, applied
//     digests} — same plan, same journal history, same runId. The seed is
//     NEVER serialized into the evidence; verifying the journal itself is the
//     operator re-providing the seed out of band (12D-237 discipline).
//   * `verifyCustodySession` runs at run end; if the journal fails
//     verification the run throws — an evidence packet never claims
//     journalVerified: true unverified.
//   * Evidence guardrails are compared BY VALUE per key (JSON-round-trip
//     safe) — the 12D-241 reference-equality lesson applied at design time.
//
// Disclosed residuals:
//   * `verifyCustodyRunEvidence` re-derives `runId` from the operator's plan
//     + the evidence's own applied digests — it proves the BINDING between
//     evidence and plan, NOT that the journal digests are authentic. Ledger
//     authenticity is `verifyCustodySession(session, store, seed)` with the
//     operator's seed, out of band, unchanged.
//   * The runner does not read the journal file for evidence — the caller's
//     store does that. One process per journal file (single-writer operator
//     discipline), carried from 12D-237.
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface. It calls
//     nothing remote and nothing model-shaped.

import { createHash } from 'crypto';
import {
  openCustodySession, verifyCustodySession,
} from './custody-session';
import type {
  CustodyJournalStore, CustodyJournalOp, CustodyConsumption,
  CustodyJournalEntry,
} from './operator-custody-journal';

export const CUSTODY_RUNNER_POLICY = Object.freeze({
  policyVersion: '12d-244-v1',
  domain: 'XIV_CUSTODY_RUNNER',
  maxPlanSteps: 64,
  minSeedChars: 8,
});

export const CUSTODY_RUNNER_GUARDRAILS = Object.freeze({
  executesOnlyOperatorAuthoredPlans: true,
  stopsOnFirstRefusal: true,
  appliedOpsStayApplied: true, // append-only custody; no rollback claims
  refusedOpsNeverJournaled: true, // registry first, then journal (12D-236)
  planRefusesEmpty: true,
  planRefusesOverMax: true,
  malformedPlanRefusesBeforeAnyApply: true,
  collectsReceiptEvidence: true,
  seedNeverSerializesIntoEvidence: true,
  journalVerifiedStampedOnlyAfterVerification: true,
  deterministicRunId: true,
  secretsNeverEnter: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // a refusal stops the run; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const SEED_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;

const RUN_OPTS_KEYS = ['store', 'seed', 'mode', 'steps'];
const REGISTER_STEP_KEYS = ['op', 'receiptSha256', 'purpose', 'registeredBy', 'issuedAtMs', 'atMs'];
const AUTH_STEP_KEYS = ['op', 'receiptSha256', 'purpose', 'atMs'];
// The evidence's key shape; 'refused' appears only when the run stopped.
const EVIDENCE_BASE_KEYS = [
  'schemaVersion', 'policyVersion', 'runId', 'mode', 'applied', 'pending',
  'opsBefore', 'opsAfter', 'journalVerified', 'guardrails',
];
const EVIDENCE_FULL_KEYS = [
  'schemaVersion', 'policyVersion', 'runId', 'mode', 'applied', 'refused',
  'pending', 'opsBefore', 'opsAfter', 'journalVerified', 'guardrails',
];

export interface CustodyRunnerRegisterStep {
  op: 'register';
  receiptSha256: string;
  purpose: string;
  registeredBy: string;
  issuedAtMs: number;
  atMs: number;
}

export interface CustodyRunnerAuthenticateStep {
  op: 'authenticate';
  receiptSha256: string;
  purpose: string;
  atMs: number;
}

export type CustodyRunnerStep =
  | Readonly<CustodyRunnerRegisterStep>
  | Readonly<CustodyRunnerAuthenticateStep>;

export interface CustodyRunAppliedOp {
  index: number;
  op: CustodyJournalOp;
  journalDigest: string;
  receiptSha256: string;
  purpose: string;
  /** Present only when the step consumed a receipt (op === 'authenticate'). */
  consumed?: Readonly<CustodyConsumption>;
}

export interface CustodyRunEvidence {
  schemaVersion: 1;
  policyVersion: string;
  runId: string;
  mode: 'bootstrap' | 'resume';
  applied: ReadonlyArray<CustodyRunAppliedOp>;
  /** The FIRST registry refusal, when the run stopped mid-plan. */
  refused?: Readonly<{ index: number; op: CustodyJournalOp; reason: string }>;
  /** Indices after the refusal (or an empty array on a full run). */
  pending: ReadonlyArray<number>;
  opsBefore: number;
  opsAfter: number;
  journalVerified: true;
  guardrails: typeof CUSTODY_RUNNER_GUARDRAILS;
}

function exactKeys(value: object, expected: readonly string[], what: string): void {
  const actual = Object.keys(value);
  if (actual.length !== expected.length || !expected.every((k, i) => actual[i] === k))
    throw new Error(`${what} must have exactly the keys [${expected.join(', ')}]; fail closed`);
}

function requireSafeNonNegative(value: unknown, what: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error(`${what} must be a safe non-negative integer ms timestamp; fail closed`);
  return value;
}

/**
 * Shape-gate a plan step and return it as a frozen normalized copy in a
 * fixed key order (canonical serialization for the runId digest).
 */
function gateStep(step: unknown, index: number): CustodyRunnerStep {
  if (!step || typeof step !== 'object' || Array.isArray(step))
    throw new Error(`plan step ${index} must be an object; fail closed`);
  const s = step as Record<string, unknown>;
  const op = s.op;
  if (op !== 'register' && op !== 'authenticate')
    throw new Error(`plan step ${index}: op must be 'register' or 'authenticate'; fail closed`);
  const receiptSha256 = s.receiptSha256;
  if (typeof receiptSha256 !== 'string' || !HEX64_RE.test(receiptSha256))
    throw new Error(`plan step ${index}: receiptSha256 must be lowercase hex64; fail closed`);
  const purpose = s.purpose;
  if (typeof purpose !== 'string' || purpose.length === 0)
    throw new Error(`plan step ${index}: purpose must be a non-empty string; fail closed`);
  if (op === 'register') {
    exactKeys(s, REGISTER_STEP_KEYS, `plan step ${index} (register)`);
    const registeredBy = s.registeredBy;
    if (typeof registeredBy !== 'string' || registeredBy.length === 0)
      throw new Error(`plan step ${index}: registeredBy must be a non-empty string; fail closed`);
    const issuedAtMs = requireSafeNonNegative(s.issuedAtMs, `plan step ${index}: issuedAtMs`);
    const atMs = requireSafeNonNegative(s.atMs, `plan step ${index}: atMs`);
    return Object.freeze({
      op: 'register' as const,
      receiptSha256,
      purpose,
      registeredBy,
      issuedAtMs,
      atMs,
    });
  }
  exactKeys(s, AUTH_STEP_KEYS, `plan step ${index} (authenticate)`);
  const atMs = requireSafeNonNegative(s.atMs, `plan step ${index}: atMs`);
  return Object.freeze({ op: 'authenticate' as const, receiptSha256, purpose, atMs });
}

function gatePlan(steps: readonly CustodyRunnerStep[]): ReadonlyArray<CustodyRunnerStep> {
  if (!Array.isArray(steps))
    throw new Error('plan steps must be an array; fail closed');
  if (steps.length === 0)
    throw new Error('an empty custody plan is refused — the operator authors a real run; fail closed');
  if (steps.length > CUSTODY_RUNNER_POLICY.maxPlanSteps)
    throw new Error(`a custody plan is capped at ${CUSTODY_RUNNER_POLICY.maxPlanSteps} steps; fail closed`);
  return Object.freeze(steps.map((s, i) => gateStep(s, i)));
}

/**
 * The canonical runId digest: sha256 over the frozen run description. The
 * seed is deliberately ABSENT — the evidence travels without custody control
 * material (the operator re-provides the seed out of band).
 */
function deriveRunId(
  mode: 'bootstrap' | 'resume',
  steps: ReadonlyArray<CustodyRunnerStep>,
  applied: ReadonlyArray<Pick<CustodyRunAppliedOp, 'index' | 'journalDigest'>>,
): string {
  return createHash('sha256').update(JSON.stringify({
    domain: CUSTODY_RUNNER_POLICY.domain,
    mode,
    steps: steps.map((s) => ({ ...s })),
    applied: applied.map((a) => ({ index: a.index, journalDigest: a.journalDigest })),
  }), 'utf8').digest('hex');
}

/**
 * Execute an operator-authored custody plan through a 12D-237 session.
 * Phase 1 gates the whole plan; phase 2 applies in order and stops on the
 * first registry refusal. The returned evidence is frozen; the seed never
 * serializes into it.
 */
export function runCustodyPlan(opts: {
  store: CustodyJournalStore;
  seed: string;
  mode: 'bootstrap' | 'resume';
  steps: readonly CustodyRunnerStep[];
}): Readonly<CustodyRunEvidence> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('runCustodyPlan expects an options object; fail closed');
  exactKeys(opts, RUN_OPTS_KEYS, 'runCustodyPlan options');
  const { store, mode } = opts;
  const seed = opts.seed;
  if (typeof seed !== 'string' || !SEED_RE.test(seed))
    throw new Error(`the custody seed must match ${SEED_RE.source} (>= ${CUSTODY_RUNNER_POLICY.minSeedChars} chars); fail closed`);
  if (mode !== 'bootstrap' && mode !== 'resume')
    throw new Error(`custody run mode must be 'bootstrap' or 'resume'; fail closed`);

  // Phase 1: gate EVERY step before ANY apply.
  const gated = gatePlan(opts.steps);

  const session = openCustodySession(store, { seed, mode });
  const opsBefore = session.ops;

  const applied: CustodyRunAppliedOp[] = [];
  let refused: { index: number; op: CustodyJournalOp; reason: string } | undefined;
  const pending: number[] = [];

  // Phase 2: execute in order; stop on the FIRST registry refusal.
  for (let i = 0; i < gated.length; i += 1) {
    const step = gated[i];
    const input: CustodyJournalEntry['input'] =
      step.op === 'register'
        ? {
            receiptSha256: step.receiptSha256,
            purpose: step.purpose,
            registeredBy: step.registeredBy,
            issuedAtMs: step.issuedAtMs,
            registeredAtMs: step.atMs,
          }
        : {
            receiptSha256: step.receiptSha256,
            purpose: step.purpose,
            nowMs: step.atMs,
          };
    try {
      const result = session.apply(step.op, input);
      applied.push(Object.freeze({
        index: i,
        op: step.op,
        journalDigest: result.entry.journalDigest,
        receiptSha256: step.receiptSha256,
        purpose: step.purpose,
        ...(result.consumed !== undefined ? { consumed: result.consumed } : {}),
      }));
    } catch (err) {
      refused = Object.freeze({
        index: i,
        op: step.op,
        reason: err instanceof Error ? err.message : String(err),
      });
      for (let j = i + 1; j < gated.length; j += 1) pending.push(j);
      break;
    }
  }

  // The evidence never claims journalVerified unverified — this throws if
  // the journal diverged, refusing the run rather than stamping a lie.
  verifyCustodySession(session, store, seed);

  const opsAfter = session.ops;
  const runId = deriveRunId(mode, gated, applied);

  return Object.freeze({
    schemaVersion: 1 as const,
    policyVersion: CUSTODY_RUNNER_POLICY.policyVersion,
    runId,
    mode,
    applied: Object.freeze(applied),
    ...(refused !== undefined ? { refused } : {}),
    pending: Object.freeze(pending),
    opsBefore,
    opsAfter,
    journalVerified: true as const,
    guardrails: CUSTODY_RUNNER_GUARDRAILS,
  });
}

function guardrailsMatchByValue(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const expected = CUSTODY_RUNNER_GUARDRAILS as Record<string, unknown>;
  const actual = value as Record<string, unknown>;
  const expectedKeys = Object.keys(expected);
  const actualKeys = Object.keys(actual);
  if (expectedKeys.length !== actualKeys.length) return false;
  // Compare per key by value (JSON-round-trip safe), key order included.
  return expectedKeys.every((k, i) => actualKeys[i] === k && JSON.stringify(actual[k]) === JSON.stringify(expected[k]));
}

/**
 * Re-derive the runId from the operator's plan and the evidence's applied
 * digests. This proves the evidence BINDS to this plan (and that its honest
 * flags are the pinned ones) — it does NOT prove the journal digests
 * authentic; that is verifyCustodySession with the operator's seed.
 */
export function verifyCustodyRunEvidence(
  evidence: Readonly<CustodyRunEvidence>,
  plan: readonly CustodyRunnerStep[],
  mode: 'bootstrap' | 'resume',
): Readonly<{ ok: true; runId: string }> {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence))
    throw new Error('a custody run evidence packet is required; fail closed');
  const e = evidence as unknown as Record<string, unknown>;
  const expectedKeys = 'refused' in e ? EVIDENCE_FULL_KEYS : EVIDENCE_BASE_KEYS;
  exactKeys(e, expectedKeys, 'custody run evidence');
  if (e.schemaVersion !== 1)
    throw new Error('custody run evidence schemaVersion must be 1; fail closed');
  if (e.policyVersion !== CUSTODY_RUNNER_POLICY.policyVersion)
    throw new Error(`custody run evidence policyVersion must be '${CUSTODY_RUNNER_POLICY.policyVersion}'; fail closed`);
  if (e.mode !== mode)
    throw new Error(`custody run evidence mode must be '${mode}'; fail closed`);
  if (e.journalVerified !== true)
    throw new Error("custody run evidence journalVerified must be pinned true (the run refuses to emit an unverified packet); fail closed");
  if (!guardrailsMatchByValue(e.guardrails))
    throw new Error('custody run evidence guardrails must equal the frozen 12D-244 guardrails BY VALUE; fail closed');
  if (typeof e.runId !== 'string' || !HEX64_RE.test(e.runId))
    throw new Error('custody run evidence runId must be lowercase hex64; fail closed');

  const gated = gatePlan(plan);
  const applied = e.applied;
  if (!Array.isArray(applied))
    throw new Error('custody run evidence applied must be an array; fail closed');
  for (const a of applied) {
    if (!a || typeof a !== 'object' || Array.isArray(a))
      throw new Error('each applied op must be an object; fail closed');
    const aa = a as Record<string, unknown>;
    if (typeof aa.index !== 'number' || !Number.isSafeInteger(aa.index) || aa.index < 0)
      throw new Error('each applied op needs a safe non-negative index; fail closed');
    if (typeof aa.journalDigest !== 'string' || !HEX64_RE.test(aa.journalDigest))
      throw new Error('each applied op needs a hex64 journalDigest; fail closed');
  }
  const reDerived = deriveRunId(
    mode,
    gated,
    (applied as ReadonlyArray<{ index: number; journalDigest: string }>),
  );
  if (reDerived !== e.runId)
    throw new Error('custody run evidence runId mismatch — tampered or foreign evidence; fail closed');
  return Object.freeze({ ok: true, runId: reDerived });
}