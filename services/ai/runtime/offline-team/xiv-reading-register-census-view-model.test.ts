// 12D-293 — adversarial suite for the reading register census view
// model. Every test drives the REAL 12D-276 register contract
// (registerReadingSource) to produce real chained lines; the view model
// must verify through the REAL chain walk + census before rendering,
// refuse tampered/empty/malformed submissions with ZERO register
// content, disclose the head digest for the out-of-band tail-truncation
// comparison, and stay pinned to the honest flags.
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  registerReadingSource, type ReadingSourceStore,
} from './xiv-reading-source-register';
import {
  buildReadingRegisterCensusViewModel,
  READING_REGISTER_CENSUS_VIEW_MODEL_POLICY,
  READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS,
} from './xiv-reading-register-census-view-model';

const GENESIS = 'census-view-genesis-001';

class MemStore {
  private lines: string[] = [];
  load(): readonly string[] { return this.lines; }
  save(next: readonly string[]): void { this.lines = [...next]; }
}

const mkSource = (sourceId: string, sourceClass: 'PUBLIC_WEB' | 'OPEN_SOURCE_REPO' | 'PUBLISHED_STANDARD') => ({
  tenantId: 'xiv-os',
  sourceId,
  title: `Test source ${sourceId}`,
  sourceUrl: `https://example.org/${sourceId}`,
  sourceClass,
  licenseNote: 'Test license note',
});

/** Registers REAL chained entries and returns { lines, headDigest }. */
const mkRegister = (specs: readonly { sourceId: string; sourceClass: 'PUBLIC_WEB' | 'OPEN_SOURCE_REPO' | 'PUBLISHED_STANDARD' }[]) => {
  const store = new MemStore() as unknown as ReadingSourceStore;
  for (const s of specs) registerReadingSource(store, GENESIS, mkSource(s.sourceId, s.sourceClass));
  const lines = [...(store.load() as readonly string[])];
  const vm = buildReadingRegisterCensusViewModel({ registerGenesis: GENESIS, lines });
  assert.equal(vm.kind, 'VERIFIED_REGISTER_CENSUS');
  if (vm.kind !== 'VERIFIED_REGISTER_CENSUS') throw new Error('unreachable');
  return { lines, headDigest: vm.display.headDigest, lastRecord: vm.display.records[vm.display.records.length - 1]! };
};

const SUBMIT = (lines: readonly string[]) =>
  buildReadingRegisterCensusViewModel({ registerGenesis: GENESIS, lines });

test('12D-293: happy path — real registered sources render the measured census, every record, and the head digest', () => {
  const { lines, headDigest, lastRecord } = mkRegister([
    { sourceId: 'src-a', sourceClass: 'PUBLIC_WEB' },
    { sourceId: 'src-b', sourceClass: 'OPEN_SOURCE_REPO' },
    { sourceId: 'src-c', sourceClass: 'OPEN_SOURCE_REPO' },
  ]);
  const vm = SUBMIT(lines);
  assert.equal(vm.kind, 'VERIFIED_REGISTER_CENSUS');
  if (vm.kind !== 'VERIFIED_REGISTER_CENSUS') throw new Error('unreachable');
  assert.equal(vm.policyVersion, '12d-293-v1');
  assert.equal(vm.display.entries, 3);
  assert.equal(vm.display.capacity, 10000);
  assert.equal(vm.display.remainingCapacity, 9997);
  assert.deepEqual(vm.display.byClass, { PUBLIC_WEB: 1, OPEN_SOURCE_REPO: 2, PUBLISHED_STANDARD: 0 });
  assert.equal(vm.display.sourcesRead, 0); // PINNED by the register contract
  assert.equal(vm.display.records.length, 3); // no truncation
  assert.equal(vm.display.records[0]!.sourceId, 'src-a');
  assert.equal(vm.display.records[0]!.sourceUrl, 'https://example.org/src-a');
  assert.equal(vm.display.headDigest, lastRecord.entryDigest); // head = last entry
  assert.equal(vm.display.headDigest, headDigest);
  assert.match(vm.display.operatorNote, /REGISTERED IS NOT READ/);
  assert.match(vm.display.operatorNote, /sourcesRead field is pinned 0/);
  assert.match(vm.display.operatorNote, /out of band/); // tail-truncation residual disclosed
  assert.match(vm.display.headline, /registered is NOT read/);
});

test('12D-293: a tampered MIDDLE line refuses the whole submission', () => {
  const { lines } = mkRegister([
    { sourceId: 'src-a', sourceClass: 'PUBLIC_WEB' },
    { sourceId: 'src-b', sourceClass: 'OPEN_SOURCE_REPO' },
    { sourceId: 'src-c', sourceClass: 'OPEN_SOURCE_REPO' },
  ]);
  const tampered = lines.map((l, i) => (i === 1 ? l.replace('src-b', 'src-evil') : l));
  const vm = SUBMIT(tampered);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') throw new Error('unreachable');
  assert.match(vm.reason, /fail closed/);
  // ZERO register content in the refusal
  const raw = JSON.stringify(vm);
  assert.ok(!raw.includes('src-a'));
  assert.ok(!raw.includes('src-b'));
  assert.ok(!raw.includes('src-evil'));
  assert.ok(!raw.includes('example.org'));
});

test('12D-293: a TAIL truncation still verifies (the disclosed residual) — the head digest CHANGES so the operator can detect it out of band', () => {
  const full = mkRegister([
    { sourceId: 'src-a', sourceClass: 'PUBLIC_WEB' },
    { sourceId: 'src-b', sourceClass: 'OPEN_SOURCE_REPO' },
    { sourceId: 'src-c', sourceClass: 'OPEN_SOURCE_REPO' },
  ]);
  const truncated = SUBMIT(full.lines.slice(0, 2));
  assert.equal(truncated.kind, 'VERIFIED_REGISTER_CENSUS');
  if (truncated.kind !== 'VERIFIED_REGISTER_CENSUS') throw new Error('unreachable');
  assert.equal(truncated.display.entries, 2);
  assert.notEqual(truncated.display.headDigest, full.headDigest); // detectable out of band
  assert.equal(truncated.display.headDigest, truncated.display.records[1]!.entryDigest);
});

test('12D-293: an EMPTY register refuses — no zero-entry success is ever fabricated', () => {
  const vm = SUBMIT([]);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') throw new Error('unreachable');
  assert.match(vm.reason, /empty/);
});

test('12D-293: malformed submissions refuse — wrong keys, wrong order, non-object, bad types, short genesis', () => {
  const { lines } = mkRegister([{ sourceId: 'src-a', sourceClass: 'PUBLIC_WEB' }]);
  const bads: readonly unknown[] = [
    null,
    'nope',
    42,
    [1, 2],
    { lines }, // missing registerGenesis
    { registerGenesis: GENESIS }, // missing lines
    { registerGenesis: GENESIS, lines, extra: 1 }, // extra key
    { lines, registerGenesis: GENESIS }, // wrong order
    { registerGenesis: 'short', lines },
    { registerGenesis: GENESIS, lines: [123] }, // non-string line
    { registerGenesis: GENESIS, lines: 'not-an-array' },
  ];
  for (const bad of bads) {
    const vm = buildReadingRegisterCensusViewModel(bad);
    assert.equal(vm.kind, 'REFUSED', `expected refusal for ${JSON.stringify(bad)}`);
    if (vm.kind !== 'REFUSED') throw new Error('unreachable');
    assert.match(vm.reason, /fail closed/);
  }
});

test('12D-293: every refusal carries zero register content — the body never leaks lines, genesis, sources, or counts', () => {
  const { lines } = mkRegister([
    { sourceId: 'src-a', sourceClass: 'PUBLIC_WEB' },
    { sourceId: 'src-b', sourceClass: 'OPEN_SOURCE_REPO' },
  ]);
  for (const bad of [null, { registerGenesis: GENESIS, lines: [] }, { registerGenesis: GENESIS, lines: lines.map((l) => l + 'x') }]) {
    const vm = buildReadingRegisterCensusViewModel(bad);
    assert.equal(vm.kind, 'REFUSED');
    if (vm.kind !== 'REFUSED') throw new Error('unreachable');
    const raw = JSON.stringify(vm);
    assert.ok(!raw.includes(GENESIS));
    assert.ok(!raw.includes('src-a'));
    assert.ok(!raw.includes('src-b'));
    assert.ok(!raw.includes('example.org'));
    assert.ok(!raw.includes('"entries"'));
    assert.ok(!raw.includes('records'));
  }
});

test('12D-293: the view model NEVER THROWS on any input and the frozen guardrails are pinned', () => {
  for (const garbage of [undefined, NaN, () => 1, Symbol('x'), { registerGenesis: 7, lines: {} }]) {
    const vm = buildReadingRegisterCensusViewModel(garbage as unknown);
    assert.ok(vm.kind === 'VERIFIED_REGISTER_CENSUS' || vm.kind === 'REFUSED');
  }
  assert.deepEqual({ ...READING_REGISTER_CENSUS_VIEW_MODEL_POLICY }, {
    policyVersion: '12d-293-v1',
    domain: 'XIV_OS_READING_REGISTER_CENSUS_VIEW_MODEL',
  });
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.registeredIsNotRead, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.noWritePath, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.noActivationPath, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.noTruncation, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.refusedRendersAsRefused, true);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(READING_REGISTER_CENSUS_VIEW_MODEL_POLICY), true);
  assert.equal(Object.isFrozen(READING_REGISTER_CENSUS_VIEW_MODEL_GUARDRAILS), true);
});

test('12D-293: source-level purity — the view model imports NO fs, NO network primitive, NO caller', () => {
  const src = readFileSync(join(process.cwd(), 'runtime', 'offline-team', 'xiv-reading-register-census-view-model.ts'), 'utf8');
  assert.ok(!src.includes('node:fs'));
  assert.ok(!src.includes('fetch('));
  assert.ok(!src.includes('127.0.0.1'));
  assert.ok(!src.includes('buildLoopbackCaller'));
  assert.ok(!src.includes('writeFile'));
  // it verifies through the REAL contracts, not reimplementations
  assert.ok(src.includes("from './xiv-reading-source-register'"));
  assert.ok(src.includes('readSourceRegisterEntries'));
  assert.ok(src.includes('replaySourceRegisterCensus'));
});