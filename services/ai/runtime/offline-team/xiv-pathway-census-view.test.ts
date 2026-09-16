// 12D-271 — adversarial tests for the pathway census view. Central
// properties under attack:
//   1. The FULL 12D-264 replay runs before any count renders — one edited,
//      inserted, or deleted line refuses the WHOLE submission with ZERO
//      ledger content.
//   2. MEASURED COUNTS ONLY: the render reports exactly what the book
//      holds; `activated` is the literal 0; an empty ledger renders the
//      measured 0 and claims nothing about scale.
//   3. NO WRITE PATH: the view's store refuses save — a census never
//      appends.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PATHWAY_LEDGER_POLICY,
  appendPathwayCandidate,
  type PathwayLedgerStore,
} from './xiv-pathway-ledger';
import { evaluatePathwayCandidate } from './neural-pathway-growth-engine';
import {
  PATHWAY_CENSUS_VIEW_GUARDRAILS,
  PATHWAY_CENSUS_VIEW_POLICY,
  buildPathwayCensusViewModel,
} from './xiv-pathway-census-view';

const GENESIS = '12d-271-census-genesis';
const tenantId = 'census-tenant';

class MemoryLedgerStore implements PathwayLedgerStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
  get written(): readonly string[] { return this.lines ?? []; }
}

function eligibleCandidate(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    pathwayId: 'pathway-271', tenantId,
    domain: 'CODE', version: 1,
    parentPathwayId: 'pathway-root',
    confidence: 0.9, evaluationScore: 0.95,
    evidenceRefs: ['run:census-1'],
    reviewRefs: ['review:census-1', 'review:census-2'],
    humanApproved: true,
    rollbackRef: 'rollback:census-271',
    modelWeightMutation: false, productionMutation: false,
    ...overrides,
  };
}

function ledgerWith(...candidates: readonly Record<string, unknown>[]) {
  const store = new MemoryLedgerStore();
  for (const c of candidates) appendPathwayCandidate(store, GENESIS, c);
  return store;
}

function submission(store: PathwayLedgerStore, genesis: string = GENESIS) {
  return { ledgerGenesis: genesis, lines: [...store.load() ?? []] };
}

const REFUSAL_LEAK_CHECK = (
  vm: { display: { headline: string; bodyText: string; operatorNote: string }; reason: string },
  ...secrets: string[]
) => {
  for (const secret of secrets) {
    assert.ok(!vm.display.headline.includes(secret), `headline leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.bodyText.includes(secret), `body leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.operatorNote.includes(secret), `operatorNote leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.reason.includes(secret), `reason leaked ${secret.slice(0, 30)}`);
  }
};

test('12d-271: a clean ledger renders the measured census', () => {
  const store = ledgerWith(
    eligibleCandidate(),
    eligibleCandidate({ pathwayId: 'pathway-271-b', version: 2, domain: 'SECURITY' }),
    eligibleCandidate({ pathwayId: 'pathway-271-c', domain: 'SECURITY' }),
  );
  const vm = buildPathwayCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_PATHWAY_CENSUS');
  assert.equal(vm.policyVersion, PATHWAY_CENSUS_VIEW_POLICY.policyVersion);
  assert.equal(vm.display.entries, 3);
  assert.equal(vm.display.capacity, PATHWAY_LEDGER_POLICY.maxEntriesPerLedger);
  assert.equal(vm.display.remainingCapacity, PATHWAY_LEDGER_POLICY.maxEntriesPerLedger - 3);
  assert.equal(vm.display.byDomain['CODE'], 1);
  assert.equal(vm.display.byDomain['SECURITY'], 2);
  assert.equal(vm.display.activated, 0);
  assert.ok(vm.display.status.includes('MEASURED counts only'));
  assert.ok(vm.display.operatorNote.includes('12D-233 residual'));
  assert.ok(vm.display.operatorNote.includes('never verifies who approved'));
  assert.ok(vm.display.operatorNote.includes('can never append'));
  assert.ok(Object.isFrozen(vm) && Object.isFrozen(vm.display) && Object.isFrozen(vm.display.byDomain));
});

test('12d-271: an empty ledger renders the measured 0 and claims nothing about scale', () => {
  const store = new MemoryLedgerStore();
  const vm = buildPathwayCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_PATHWAY_CENSUS');
  assert.equal(vm.display.entries, 0);
  assert.equal(vm.display.activated, 0);
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('trillion'), 'no scale claims beyond the book');
  assert.ok(!rendered.includes('2,000,000'), 'the queue ceiling is not a ledger claim');
});

test('12d-271: TAMPER — one edited candidate field refuses the whole submission with zero leak', () => {
  const store = ledgerWith(eligibleCandidate());
  const tampered = JSON.parse(store.written[0]!) as Record<string, unknown>;
  const candidate = tampered.candidate as Record<string, unknown>;
  candidate.confidence = 0.99;
  const vm = buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines: [JSON.stringify(tampered)] });
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.ok(vm.reason.includes('tampered') || vm.reason.includes('mismatch'));
  REFUSAL_LEAK_CHECK(vm, 'pathway-271', tenantId, GENESIS);
});

test('12d-271: TAMPER — an inserted foreign line refuses', () => {
  const store = ledgerWith(
    eligibleCandidate(),
    eligibleCandidate({ pathwayId: 'pathway-271-b', version: 2 }),
  );
  const forged = { ledgerVersion: 1, op: 'CANDIDATE_LEDGERED', candidate: eligibleCandidate({ pathwayId: 'pathway-forged' }), entryDigest: 'f'.repeat(64) };
  const lines = [store.written[0]!, JSON.stringify(forged), store.written[1]!];
  const vm = buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'pathway-forged', 'pathway-271', tenantId);
});

test('12d-271: TAMPER — a deleted line refuses (the chain breaks)', () => {
  const store = ledgerWith(
    eligibleCandidate(),
    eligibleCandidate({ pathwayId: 'pathway-271-b', version: 2 }),
  );
  const vm = buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines: [store.written[1]!] });
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'pathway-271-b', tenantId);
});

test('12d-271: a foreign genesis refuses (a census binds its genesis)', () => {
  const store = ledgerWith(eligibleCandidate());
  const vm = buildPathwayCensusViewModel(submission(store, 'foreign-genesis-xx'));
  assert.equal(vm.kind, 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'pathway-271', tenantId);
});

test('12d-271: a submission with more lines than the hard cap refuses BEFORE the replay', () => {
  const lines: string[] = Array.from({ length: PATHWAY_LEDGER_POLICY.maxEntriesPerLedger + 1 }, () => 'x');
  const vm = buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines });
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.reason.includes('never hold more than'));
});

test('12d-271: the exact-keys gate refuses reordering, extras, and absences', () => {
  const store = ledgerWith(eligibleCandidate());
  const reordered = { lines: [...store.load()!], ledgerGenesis: GENESIS } as unknown as Record<string, unknown>;
  assert.equal(buildPathwayCensusViewModel(reordered).kind, 'REFUSED');
  const extra = { ledgerGenesis: GENESIS, lines: [...store.load()!], smuggled: true } as unknown as Record<string, unknown>;
  assert.equal(buildPathwayCensusViewModel(extra).kind, 'REFUSED');
  const missing = { ledgerGenesis: GENESIS } as unknown as Record<string, unknown>;
  assert.equal(buildPathwayCensusViewModel(missing).kind, 'REFUSED');
  const shortGenesis = { ledgerGenesis: 'short', lines: [] } as unknown as Record<string, unknown>;
  assert.equal(buildPathwayCensusViewModel(shortGenesis).kind, 'REFUSED');
});

test('12d-271: malformed submissions HOLD — null, array, string, number, boolean, undefined', () => {
  for (const raw of [null, [], 'string', 42, true, undefined]) {
    const vm = buildPathwayCensusViewModel(raw);
    assert.equal(vm.kind, 'REFUSED', `${String(raw)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
    assert.ok(vm.reason.length > 0);
  }
  // a non-string line and a non-array lines field refuse too
  const store = ledgerWith(eligibleCandidate());
  assert.equal(buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines: [store.written[0], 42] }).kind, 'REFUSED');
  assert.equal(buildPathwayCensusViewModel({ ledgerGenesis: GENESIS, lines: 'not-an-array' }).kind, 'REFUSED');
});

test('12d-271: the verified census never carries an affordance and claims no activation', () => {
  const store = ledgerWith(eligibleCandidate());
  const vm = buildPathwayCensusViewModel(submission(store));
  assert.ok(vm.kind === 'VERIFIED_PATHWAY_CENSUS');
  const rendered = JSON.stringify(vm);
  assert.ok(!rendered.includes('"activated":1'), 'activated is the literal 0');
  assert.ok(!rendered.includes('promote'), 'no learning promotion verb');
  assert.ok(rendered.includes('never activated'), 'the honest pin renders');
  // and the census carries NO candidate material — counts only
  assert.ok(!rendered.includes('pathway-271'), 'no pathway ids in a census render');
  assert.ok(!rendered.includes('rollback'), 'no candidate fields in a census render');
});

test('12d-271: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(PATHWAY_CENSUS_VIEW_POLICY));
  assert.ok(Object.isFrozen(PATHWAY_CENSUS_VIEW_GUARDRAILS));
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.automaticRecovery, false);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.measuredCountsOnly, true);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.noWritePath, true);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.noActivationPath, true);
  assert.equal(PATHWAY_CENSUS_VIEW_GUARDRAILS.tamperEvidentEndToEnd, true);
  // sanity: the fixtures actually gate through the real engine
  assert.equal(evaluatePathwayCandidate(eligibleCandidate() as never).eligible, true);
});