// 12D-276 — adversarial tests for the reading source register. Central
// properties under attack:
//   1. PUBLIC-CLASS ONLY: a non-public source class cannot even
//      register — the security boundary is structural, not advisory.
//   2. THE CHAIN IS REAL: entries validate against their predecessors;
//      tampering refuses; replay re-derives every digest.
//   3. REGISTERED ≠ READ: the census never claims a read happened.
//   4. The honest boundary: secret re-gate, bounded entries, dedup,
//      measured counts, and the disclosed tail-truncation residual.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  READING_SOURCE_REGISTER_GUARDRAILS,
  READING_SOURCE_REGISTER_POLICY,
  registerReadingSource,
  replaySourceRegisterCensus,
  type ReadingSourceStore,
} from './xiv-reading-source-register';

const GENESIS = '12d-276-register-genesis';
const tenantId = 'reading-tenant';

class MemoryRegisterStore implements ReadingSourceStore {
  private lines: string[] | null = null;
  load(): readonly string[] | null { return this.lines; }
  save(lines: readonly string[]): void { this.lines = [...lines]; }
  // test-only helper for tamper cases
  mutate(fn: (lines: string[]) => string[]): void {
    if (this.lines === null) throw new Error('nothing to mutate');
    this.lines = fn(this.lines);
  }
  headDigest(): string {
    const lines = this.lines ?? [];
    if (lines.length === 0) throw new Error('empty register');
    return (JSON.parse(lines[lines.length - 1]!) as { entryDigest: string }).entryDigest;
  }
}

function source(overrides: Record<string, unknown> = {}) {
  return {
    tenantId, sourceId: 'psa-space', title: 'Psychopy — open-source psychology software',
    sourceUrl: 'https://github.com/psychopy/psychopy',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'GNU GPL v3 — public repository, cited verbatim',
    ...overrides,
  };
}

test('12d-276: a public source registers, chains, and censuses', () => {
  const store = new MemoryRegisterStore();
  const e1 = registerReadingSource(store, GENESIS, source());
  assert.match(e1.entryDigest, /^[0-9a-f]{64}$/);
  registerReadingSource(store, GENESIS, source({
    sourceId: 'odoo-erp', title: 'Odoo — open-source business suite',
    sourceUrl: 'https://github.com/odoo/odoo',
    licenseNote: 'LGPL v3 — public repository, cited verbatim',
  }));
  const census = replaySourceRegisterCensus(store, GENESIS);
  assert.equal(census.entries, 2);
  assert.equal(census.byClass.OPEN_SOURCE_REPO, 2);
  assert.equal(census.byClass.PUBLIC_WEB, 0);
  assert.equal(census.sourcesRead, 0, 'registered is NOT read');
  assert.equal(census.activated, 0);
  assert.equal(census.learningPromoted, false);
  assert.ok(census.remainingCapacity === READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister - 2);
});

test('12d-276: a NON-public source cannot even register — the boundary is structural', () => {
  const store = new MemoryRegisterStore();
  for (const badClass of ['TOP_SECRET', 'CONFIDENTIAL', 'PRIVATE', 'INTERNAL', '']) {
    assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceClass: badClass })), /cannot register/);
  }
  assert.equal(replaySourceRegisterCensus(store, GENESIS).entries, 0, 'nothing was registered');
});

test('12d-276: the secret re-gate lives inside the validator', () => {
  const store = new MemoryRegisterStore();
  assert.throws(() => registerReadingSource(store, GENESIS, source({
    title: 'Notes for sk-AAAAAAAAAAAAAAAAAAAAAAAAAAAA holders',
  })), /credential-shaped content/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({
    licenseNote: 'see -----BEGIN RSA PRIVATE KEY-----',
  })), /credential-shaped content/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({
    sourceUrl: 'https://example.com/?key=sk-BBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  })), /credential-shaped content/);
});

test('12d-276: tampering with a middle entry refuses; a lawful tail replays clean', () => {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, source());
  registerReadingSource(store, GENESIS, source({ sourceId: 'odoo-erp', title: 'Odoo — open-source business suite', sourceUrl: 'https://github.com/odoo/odoo', licenseNote: 'LGPL v3' }));
  registerReadingSource(store, GENESIS, source({ sourceId: 'spacy-nlp', title: 'spaCy — industrial NLP', sourceUrl: 'https://github.com/explosion/spaCy', licenseNote: 'MIT' }));
  const head = store.headDigest();
  // MIDDLE deletion is detected.
  const middleDeleted = store.load()!.filter((_, i) => i !== 1);
  const tampered = new MemoryStoreSim(middleDeleted);
  assert.throws(() => replaySourceRegisterCensus(tampered, GENESIS), /tampered/);
  // TAIL truncation replays clean as a SHORTER lawful register — the
  // DISCLOSED residual: detect it by comparing the head digest out of
  // band, never by replay alone.
  store.mutate((lines) => lines.slice(0, 2));
  assert.notEqual(store.headDigest(), head, 'the head digest MOVES on truncation — compare it out of band');
  const census = replaySourceRegisterCensus(store, GENESIS);
  assert.equal(census.entries, 2, 'the truncated tail replays as a shorter lawful register');
});

class MemoryStoreSim implements ReadingSourceStore {
  constructor(private readonly lines: string[]) {}
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('not used in this test'); }
}

test('12d-276: duplicate sourceIds refuse; a source registers exactly once', () => {
  const store = new MemoryRegisterStore();
  registerReadingSource(store, GENESIS, source());
  assert.throws(() => registerReadingSource(store, GENESIS, source()), /registers exactly once/);
});

test('12d-276: the exact-keys gate refuses reordering, extras, and absences', () => {
  const store = new MemoryRegisterStore();
  const reordered = {
    licenseNote: 'ok', sourceClass: 'PUBLIC_WEB', sourceUrl: 'https://example.com/doc',
    title: 'T', sourceId: 's1', tenantId,
  };
  assert.throws(() => registerReadingSource(store, GENESIS, reordered), /in order; fail closed/);
  const extra = { ...source(), smuggled: true } as unknown as Record<string, unknown>;
  assert.throws(() => registerReadingSource(store, GENESIS, extra), /in order; fail closed/);
  const missing = { tenantId, sourceId: 's1', title: 'T', sourceUrl: 'https://example.com', sourceClass: 'PUBLIC_WEB' };
  assert.throws(() => registerReadingSource(store, GENESIS, missing), /in order; fail closed/);
  for (const bad of [null, undefined, 42, 'text', [], true]) {
    assert.throws(() => registerReadingSource(store, GENESIS, bad), /fail closed/);
  }
});

test('12d-276: malformed fields and URLs fail closed', () => {
  const store = new MemoryRegisterStore();
  assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceUrl: 'http://example.com/doc' })), /https source URL/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceUrl: 'ftp://example.com' })), /https source URL/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceUrl: '' })), /https source URL/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceUrl: 42 })), /https source URL/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ title: '' })), /title/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ title: 'x'.repeat(201) })), /title/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ licenseNote: '' })), /license note/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ tenantId: 'bad tenant!' })), /tenant id/);
  assert.throws(() => registerReadingSource(store, GENESIS, source({ sourceId: 'bad id!' })), /source id/);
});

test('12d-276: over-budget entries refuse', () => {
  const store = new MemoryRegisterStore();
  assert.throws(() => registerReadingSource(store, 'tiny', source()), /at least 8 chars/);
  const longTitle = `x${'y'.repeat(5000)}`;
  assert.throws(() => registerReadingSource(store, GENESIS, source({
    title: longTitle.slice(0, 210),
  })), /title/);
});

test('12d-276: the store contract is fail-closed — a refusing store writes nothing', () => {
  const store = new RefusingStore();
  assert.throws(() => registerReadingSource(store, GENESIS, source()), /never writes/);
  assert.equal(store.load()!.length, 0, 'the refused append wrote nothing');
});

class RefusingStore implements ReadingSourceStore {
  private lines: string[] | null = [];
  load(): readonly string[] | null { return this.lines; }
  save(): void { throw new Error('this store never writes; fail closed'); }
}

test('12d-276: digest re-derivation — the chain digest is over the canonical entry', () => {
  const store = new MemoryRegisterStore();
  const entry = registerReadingSource(store, GENESIS, source());
  const canonical = JSON.stringify({
    tenantId, sourceId: 'psa-space',
    title: 'Psychopy — open-source psychology software',
    sourceUrl: 'https://github.com/psychopy/psychopy',
    sourceClass: 'OPEN_SOURCE_REPO',
    licenseNote: 'GNU GPL v3 — public repository, cited verbatim',
  }, ['tenantId', 'sourceId', 'title', 'sourceUrl', 'sourceClass', 'licenseNote']);
  const expected = createHash('sha256')
    .update(JSON.stringify([GENESIS, GENESIS, 'SOURCE_REGISTERED', canonical]), 'utf8')
    .digest('hex');
  assert.equal(entry.entryDigest, expected, 'the first entry chains from the genesis itself');
});

test('12d-276: guardrails and policy are pinned and frozen', () => {
  assert.ok(Object.isFrozen(READING_SOURCE_REGISTER_POLICY));
  assert.ok(Object.isFrozen(READING_SOURCE_REGISTER_GUARDRAILS));
  assert.deepEqual(READING_SOURCE_REGISTER_POLICY.sourceClasses, ['PUBLIC_WEB', 'OPEN_SOURCE_REPO', 'PUBLISHED_STANDARD']);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.publicClassOnly, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.registeredIsNotRead, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.secretReGateInsideTheValidator, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.tamperEvidentChain, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.tailTruncationResidualDisclosed, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.licenseNoted, true);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.billionUsersProven, false);
  assert.equal(READING_SOURCE_REGISTER_GUARDRAILS.humanDecision, 'REQUIRED');
});