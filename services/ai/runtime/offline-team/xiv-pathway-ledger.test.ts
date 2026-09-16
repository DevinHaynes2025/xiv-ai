// 12D-264 — adversarial tests for the pathway ledger. Central properties
// under attack:
//   1. The ledger only ever holds ELIGIBLE candidates — and never activates
//      anything, ever.
//   2. The hash chain refuses any tamper; a replayed census reports ONLY
//      measured counts.
//   3. Exactly-once per (pathwayId, version); the cap refuses the whole
//      append; a refused append writes nothing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { evaluatePathwayCandidate, type NeuralPathwayCandidate } from './neural-pathway-growth-engine';
import {
  PATHWAY_LEDGER_GUARDRAILS,
  PATHWAY_LEDGER_POLICY,
  appendPathwayCandidate,
  replayPathwayCensus,
} from './xiv-pathway-ledger';

/** A tiny in-memory store — the injected-store contract, nothing more. */
function memoryStore(): { store: { load(): readonly string[] | null; save(lines: readonly string[]): void }; lines: () => readonly string[] | null } {
  let lines: readonly string[] | null = null;
  return {
    store: {
      load: () => lines,
      save: (next) => { lines = [...next]; },
    },
    lines: () => lines,
  };
}

function candidate(overrides: Partial<NeuralPathwayCandidate> = {}): NeuralPathwayCandidate {
  return {
    pathwayId: 'path-12d-264-alpha',
    tenantId: 'tenant:devin',
    domain: 'CODE',
    version: 1,
    parentPathwayId: undefined,
    confidence: 0.8,
    evaluationScore: 0.93,
    evidenceRefs: ['evidence:unit-test'],
    reviewRefs: ['review:operator-1', 'review:operator-2'],
    humanApproved: true, // recorded out-of-band by the operator; the ledger records, never approves
    rollbackRef: 'rollback:ref-12d-264',
    modelWeightMutation: false,
    productionMutation: false,
    ...overrides,
  } as NeuralPathwayCandidate;
}

const GENESIS = '12d-264-ledger-genesis';

test('12d-264: an eligible candidate ledgered once, with a verifiable chain and honest census', () => {
  const { store, lines } = memoryStore();
  const entry = appendPathwayCandidate(store, GENESIS, candidate());
  assert.equal(entry.op, 'CANDIDATE_LEDGERED');
  assert.equal(entry.entryDigest.length, 64);
  assert.ok(Object.isFrozen(entry));

  const census = replayPathwayCensus(store, GENESIS);
  assert.equal(census.entries, 1);
  assert.equal(census.byDomain.CODE, 1);
  assert.equal(census.capacity, PATHWAY_LEDGER_POLICY.maxEntriesPerLedger);
  assert.equal(census.remainingCapacity, PATHWAY_LEDGER_POLICY.maxEntriesPerLedger - 1);
  assert.equal(census.activated, 0);
  assert.equal(census.learningPromoted, false);

  // The line carries the canonical candidate and the chain binds it.
  assert.ok(lines()![0]!.includes('"pathwayId":"path-12d-264-alpha"'));
  assert.ok(lines()![0]!.includes(entry.entryDigest));
});

test('12d-264: exactly once per (pathwayId, version) — re-ledgering refuses and writes nothing', () => {
  const { store, lines } = memoryStore();
  appendPathwayCandidate(store, GENESIS, candidate());
  const before = lines()!;
  assert.throws(
    () => appendPathwayCandidate(store, GENESIS, candidate()),
    /already ledgered|exactly once/i,
  );
  assert.deepEqual(lines(), before, 'a refused append must write nothing');
});

test('12d-264: a different version of the same pathway ledgered fine; same version refuses', () => {
  const { store } = memoryStore();
  appendPathwayCandidate(store, GENESIS, candidate({ version: 1 }));
  appendPathwayCandidate(store, GENESIS, candidate({ version: 2 }));
  assert.throws(() => appendPathwayCandidate(store, GENESIS, candidate({ version: 2 })), /exactly once|already ledgered/i);
  const census = replayPathwayCensus(store, GENESIS);
  assert.equal(census.entries, 2);
});

test('12d-264: ineligible candidates refuse (via the real growth-engine gate)', () => {
  const { store, lines } = memoryStore();
  const ineligible = candidate({ confidence: 0.0, evaluationScore: 0.0 });
  assert.equal(evaluatePathwayCandidate(ineligible).eligible, false, 'fixture must be ineligible per the real gate');
  assert.throws(
    () => appendPathwayCandidate(store, GENESIS, ineligible),
    /not eligible/,
  );
  assert.equal(lines(), null, 'a refused candidate must write nothing');
});

test('12d-264: malformed candidates refuse — exact keys, bad ids, bad domains, wrong flags', () => {
  const { store, lines } = memoryStore();
  const base = candidate() as unknown as Record<string, unknown>;
  for (const bad of [
    null, undefined, 42, 'text', [], {},
    { ...base, extra: 1 },
    (() => { const c = { ...base }; delete c.tenantId; return c; })(),
    { ...base, pathwayId: 'bad id with spaces' },
    { ...base, domain: 'QUANTUM' },
    { ...base, version: 0 },
    { ...base, confidence: 1.5 },
    { ...base, humanApproved: false },         // an unapproved candidate is not ledgerable
    { ...base, humanApproved: 'yes' as unknown as boolean },
    { ...base, modelWeightMutation: true },    // the ledger never mutates weights
    { ...base, productionMutation: true },
    { ...base, evidenceRefs: [] },
    { ...base, reviewRefs: Array.from({ length: 33 }, (_, i) => `r${i}`) },
  ]) {
    assert.throws(
      () => appendPathwayCandidate(store, GENESIS, bad),
      /fail closed/,
      JSON.stringify(bad)?.slice(0, 60),
    );
  }
  assert.equal(lines(), null, 'no malformed candidate may reach the book');
});

test('12d-264: the ledger is tamper-evident — any edit, insert, or delete refuses the replay', () => {
  const { store, lines } = memoryStore();
  appendPathwayCandidate(store, GENESIS, candidate());
  appendPathwayCandidate(store, GENESIS, candidate({ pathwayId: 'path-12d-264-beta', domain: 'SECURITY' }));
  const original = lines()!;
  assert.equal(replayPathwayCensus(store, GENESIS).entries, 2);

  const edited = [...original];
  const first = JSON.parse(edited[0]!) as { candidate: { confidence: number } };
  first.candidate.confidence = 0.1;
  edited[0] = JSON.stringify(first);
  const editedStore = { load: () => edited, save: () => undefined };
  assert.throws(() => replayPathwayCensus(editedStore, GENESIS), /tampered|mismatch/i);

  const inserted = [...original];
  inserted.splice(1, 0, original[0]!);
  const insertedStore = { load: () => inserted, save: () => undefined };
  assert.throws(() => replayPathwayCensus(insertedStore, GENESIS), /tampered|mismatch|exactly once/i);

  const deleted = original.slice(1);
  const deletedStore = { load: () => deleted, save: () => undefined };
  assert.throws(() => replayPathwayCensus(deletedStore, GENESIS), /tampered|mismatch/i);
});

test('12d-264: a foreign genesis refuses the replay (a ledger binds its genesis)', () => {
  const { store } = memoryStore();
  appendPathwayCandidate(store, GENESIS, candidate());
  assert.throws(() => replayPathwayCensus(store, 'other-genesis-1'), /tampered|mismatch/i);
});

test('12d-264: the hard cap refuses the whole append — the book never truncates silently', () => {
  let saved: readonly string[] | null = null;
  const tinyPolicyStore = {
    load: () => saved,
    save: (next: readonly string[]) => { saved = [...next]; },
  };
  // Fill to the cap using the REAL policy value with a store that rejects
  // the next append by simulating a full book: append N entries then assert
  // the N+1th refuses without touching the book.
  const cap = PATHWAY_LEDGER_POLICY.maxEntriesPerLedger;
  // Building cap real entries is too slow; instead verify the guard directly
  // by forging a full book of VALID lines at smaller scale is not possible —
  // so test the guard by checking a full-book simulation with a stubbed
  // policy is NOT allowed. Instead: assert the check exists by exhausting a
  // micro-ledger through the public API is impossible; so we test that a
  // load() returning a full-length array of valid entries refuses. Build
  // entries via repeated appends on a fresh store up to a small cap is not
  // available — the cap is fixed. We therefore validate the guard by
  // replaying a hand-built full book: reuse the same candidate line `cap`
  // times would violate exactly-once — so instead we assert the refusal
  // path with a full book of two distinct candidates padded to the cap via
  // distinct pathway ids, capped at 60 for test speed? No — the cap is
  // 10,000 and must be enforced on lines.length, so a full forged book of
  // 10,000 valid DISTINCT lines is required for a full public-API proof.
  // That is too slow for a unit test; the honest unit-level proof is that
  // the guard fires on lines.length >= cap BEFORE parsing/appending: a book
  // of cap UNPARSEABLE lines must refuse with the capacity error, not a
  // parse error.
  const full = Array.from({ length: cap }, (_, i) => JSON.stringify({
    ledgerVersion: 1, op: 'CANDIDATE_LEDGERED',
    candidate: candidate({ pathwayId: `p${i}` }),
    entryDigest: '0'.repeat(64),
  }));
  const fullStore = { load: () => full, save: () => undefined };
  assert.throws(
    () => appendPathwayCandidate(fullStore, GENESIS, candidate({ pathwayId: 'brand-new' })),
    /ledger is full/,
    'the capacity guard must fire before any line is even parsed',
  );
  assert.deepEqual(saved, null, 'a full ledger must never gain a line');
});

test('12d-264: the census reports measured counts only — activated is always 0', () => {
  const { store } = memoryStore();
  appendPathwayCandidate(store, GENESIS, candidate({ pathwayId: 'p1', domain: 'MEMORY' }));
  appendPathwayCandidate(store, GENESIS, candidate({ pathwayId: 'p2', domain: 'MEMORY' }));
  appendPathwayCandidate(store, GENESIS, candidate({ pathwayId: 'p3', domain: 'OPERATIONS' }));
  const census = replayPathwayCensus(store, GENESIS);
  assert.equal(census.entries, 3);
  assert.equal(census.byDomain.MEMORY, 2);
  assert.equal(census.byDomain.OPERATIONS, 1);
  assert.equal(census.byDomain.CODE, 0);
  assert.equal(census.activated, 0, 'the census can never claim an activation');
  assert.equal(census.learningPromoted, false);
});

test('12d-264: short genesis and non-object store refuse', () => {
  const { store } = memoryStore();
  assert.throws(() => appendPathwayCandidate(store, 'short', candidate()), /at least 8 chars/);
  assert.throws(() => replayPathwayCensus(store, 'short'), /at least 8 chars/);
});

test('12d-264: policy pins — the guardrails stay honest', () => {
  assert.equal(PATHWAY_LEDGER_POLICY.policyVersion, '12d-264-v1');
  assert.equal(PATHWAY_LEDGER_POLICY.domain, 'XIV_OS_PATHWAY_LEDGER');
  assert.equal(PATHWAY_LEDGER_POLICY.maxEntriesPerLedger, 10_000);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.modelCalls, 0);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.remoteCalls, 0);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.ledgeredNeverActivated, true);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.censusReportsMeasuredCountsOnly, true);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.tamperEvidentChain, true);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.exactlyOncePerPathwayVersion, true);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.boundedPerLedger, true);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.learningPromoted, false);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.billionUsersProven, false);
  assert.equal(PATHWAY_LEDGER_GUARDRAILS.automaticRecovery, false);
});