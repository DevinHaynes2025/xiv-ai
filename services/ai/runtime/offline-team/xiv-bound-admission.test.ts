// 12D-278 — adversarial tests for the bound admission bridge. Central
// properties under attack:
//   1. NO BINDING, NO ADMISSION: an unregistered reading physically
//      cannot pass — absent, unregistered, foreign, and truncated
//      registers all refuse BEFORE any queue write.
//   2. THE PREPARED DIGEST IS THE TRUTH: the binding is cross-gated
//      against prepareDocumentStories' own digest/tenant/document id —
//      declaring another document's digest refuses.
//   3. THE REAL CONTRACT does the work: admission is the actual 12D-275
//      door (measured, dedup'd, claimable), never re-implemented.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue } from './offline-story-queue';
import { prepareDocumentStories } from './xiv-document-ingest';
import { registerReadingSource, type ReadingSourceStore } from './xiv-reading-source-register';
import {
  BOUND_ADMISSION_GUARDRAILS,
  BOUND_ADMISSION_POLICY,
  admitBoundReading,
} from './xiv-bound-admission';

const GENESIS = '12d-278-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
  mutate(fn: (lines: string[]) => string[]): void {
    if (this.lines === null) throw new Error('nothing to mutate');
    this.lines = fn(this.lines);
  }
}

function registeredStore(): MemoryRegisterStore {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, {
    tenantId, sourceId: 'quantumlib-cirq',
    title: 'Cirq — open-source quantum circuit framework',
    sourceUrl: 'https://github.com/quantumlib/cirq',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'Apache 2.0 — public repository, cited verbatim',
  });
  return store;
}

const DOC = [
  'First paragraph of the bound reading.',
  'Second paragraph of the bound reading.',
].join('\n\n');

function setup() {
  const prepared = prepareDocumentStories({ tenantId, documentId: 'cirq-reading-1', title: 'Cirq reading', bodyText: DOC });
  return {
    prepared,
    bindingInput: {
      tenantId, sourceId: 'quantumlib-cirq',
      documentId: 'cirq-reading-1',
      documentDigestSha256: prepared.documentDigestSha256,
    },
  };
}

function openQueue(): { q: OfflineStoryQueue; dir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-bound-admission-'));
  return { q: new OfflineStoryQueue(join(dir, 'q.sqlite')), dir };
}

test('12d-278: a bound reading admits — binding receipt and measured admission travel together', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  const { q, dir } = openQueue();
  try {
    const result = admitBoundReading(q, store, GENESIS, prepared, bindingInput);
    assert.equal(result.kind, 'BOUND_READING_ADMITTED');
    assert.equal(result.policyVersion, BOUND_ADMISSION_POLICY.policyVersion);
    assert.equal(result.binding.sourceId, 'quantumlib-cirq');
    assert.match(result.binding.sourceEntryDigestSha256, /^[0-9a-f]{64}$/, 'provenance carried, not consumed');
    assert.equal(result.admission.inserted, prepared.chunkCount);
    assert.equal(result.census.liveAgentCount, null);
    assert.equal(result.learningPromoted, false);
    assert.equal(result.activated, 0);
    assert.equal(result.humanDecision, 'REQUIRED');
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: NO BINDING, NO ADMISSION — an unregistered reading refuses before any write', () => {
  const { prepared, bindingInput } = setup();
  const { q, dir } = openQueue();
  const cases: [string, ReadingSourceStore, Record<string, unknown>, RegExp][] = [
    ['empty register', new MemoryRegisterStore(), bindingInput, /NO REGISTER, NO BINDING/],
    ['unknown source', registeredStore(), { ...bindingInput, sourceId: 'never-registered' }, /NO REGISTER, NO BINDING/],
    // A foreign tenant is refused EARLIER — by the prepared cross-gate,
    // before the register is ever consulted.
    ['foreign tenant', registeredStore(), { ...bindingInput, tenantId: 'other-tenant' }, /binding tenant does not match/],
  ];
  try {
    for (const [label, store, bi, re] of cases) {
      assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, bi), re, label);
    }
    assert.equal(q.summary(tenantId).counts.length, 0, 'nothing was written');
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: the prepared digest is the truth — a declared digest mismatch refuses', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  const { q, dir } = openQueue();
  try {
    assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, { ...bindingInput, documentDigestSha256: 'a'.repeat(64) }), /digest does not match the prepared result/);
    assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, { ...bindingInput, documentId: 'another-doc' }), /document does not match/);
    assert.equal(q.summary(tenantId).counts.length, 0, 'nothing was written');
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: a tampered register refuses before any write', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  store.mutate((lines) => lines.map((l) => l.replace('"OPEN_SOURCE_REPO"', '"INTERNAL"')));
  const { q, dir } = openQueue();
  try {
    assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, bindingInput), /tampered/);
    assert.equal(q.summary(tenantId).counts.length, 0);
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: missing or malformed binding objects refuse', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  const { q, dir } = openQueue();
  try {
    for (const bad of [null, undefined, 42, 'text', [], true]) {
      assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, bad), /fail closed/);
    }
    const extra = { ...bindingInput, smuggled: true } as unknown as Record<string, unknown>;
    assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, extra), /in order; fail closed/);
    const reordered = {
      documentDigestSha256: bindingInput.documentDigestSha256, documentId: bindingInput.documentId,
      sourceId: bindingInput.sourceId, tenantId: bindingInput.tenantId,
    };
    assert.throws(() => admitBoundReading(q, store, GENESIS, prepared, reordered), /in order; fail closed/);
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: a foreign queue instance or register store refuses', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  const fake = { enqueue: () => ({ inserted: 1, duplicates: 0 }), summary: () => ({ counts: [], leaseHeld: false, leaseExpired: false, liveAgentCount: null, capacityRowsAreUserStories: false, hostWideCoordinationVerified: false }) };
  assert.throws(() => admitBoundReading(fake, store, GENESIS, prepared, bindingInput), /trusted OfflineStoryQueue instance/);
  const { q, dir } = openQueue();
  try {
    assert.throws(() => admitBoundReading(q, null, GENESIS, prepared, bindingInput), /trusted reading source register store/);
    assert.throws(() => admitBoundReading(q, { load: () => null }, GENESIS, prepared, bindingInput), /trusted reading source register store/);
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: idempotent bound re-admission — the queue dedup still governs', () => {
  const { prepared, bindingInput } = setup();
  const store = registeredStore();
  const { q, dir } = openQueue();
  try {
    const first = admitBoundReading(q, store, GENESIS, prepared, bindingInput);
    assert.equal(first.admission.inserted, prepared.chunkCount);
    const second = admitBoundReading(q, store, GENESIS, prepared, bindingInput);
    assert.equal(second.admission.inserted, 0);
    assert.equal(second.admission.duplicates, prepared.chunkCount);
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-278: guardrails and policy are pinned and frozen — the required-provenance door', () => {
  assert.ok(Object.isFrozen(BOUND_ADMISSION_POLICY));
  assert.ok(Object.isFrozen(BOUND_ADMISSION_GUARDRAILS));
  assert.equal(BOUND_ADMISSION_GUARDRAILS.noBindingNoAdmission, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.preparedDigestIsTheTruth, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.realQueueContractOnly, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.provenanceCarriedNotConsumed, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.noClaimNoSettleNoReview, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.noActivationPath, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.learningPromotionStaysCEOgated, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.shellDatabaseFree, true);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.modelCalls, 0);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.remoteCalls, 0);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.learningPromoted, false);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.automaticRecovery, false);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.billionUsersProven, false);
  assert.equal(BOUND_ADMISSION_GUARDRAILS.humanDecision, 'REQUIRED');
});