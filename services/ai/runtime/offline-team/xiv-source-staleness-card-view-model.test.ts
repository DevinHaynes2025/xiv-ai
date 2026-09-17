// 12D-315 — adversarial tests for the source staleness card VIEW MODEL.
// The VM is the last line: it re-computes the ENTIRE derivation from the
// card's own inputs (REAL 12D-306 gate, re-parsed digest heads, re-screened
// digest entries) and refuses any card whose rows, counts, id lists or
// verdict do not match its own derivation — tampered cards render NOTHING.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  prepareSourceStalenessCard, buildSourceStalenessCardPacket,
} from './xiv-source-staleness-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import { buildSourceStalenessCardViewModel } from './xiv-source-staleness-card-view-model';

const TENANT = 'sscv-tenant';

function sourceDigest(n: number): string {
  return createHash('sha256').update(`source-bytes-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `sscv-story-${String(n).padStart(3, '0')}`,
    tenantId: TENANT,
    roleId: 'memory_curator',
    objective,
    acceptance: ['the fact is bounded and screened'],
    dependencies: [],
    sourceRevision: 'a'.repeat(40),
    masterPlanSha256: 'b'.repeat(64),
    securityClass: 'ORDINARY',
    kind: 'PRODUCT_STORY',
  };
}

function makeDone(q: OfflineStoryQueue, n: number, objective: string): void {
  const story = makeStory(n, objective);
  q.enqueue([story]);
  const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: createHash('sha256').update(`out-${n}`).digest('hex'), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: createHash('sha256').update(`out-${n}`).digest('hex'), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

interface World {
  packet: Record<string, unknown>;
  docIds: string[];
  recordedFullDigests: Record<string, string>;
}

function realPacket(entries: number): World {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-315-vm-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  const docIds: string[] = [];
  const recordedFullDigests: Record<string, string> = {};
  try {
    for (let i = 1; i <= entries; i += 1) {
      const objective = `READ AND SUMMARIZE reviewed fact ${i} about the architecture Source: doc:sscv-doc-${i}:${sourceDigest(i).slice(0, 16)}`;
      makeDone(q, i, objective);
      docIds.push(`sscv-doc-${i}`);
      recordedFullDigests[`sscv-doc-${i}`] = sourceDigest(i);
    }
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return { packet: JSON.parse(JSON.stringify(packet)) as Record<string, unknown>, docIds, recordedFullDigests };
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function digestEntries(world: World, mutate?: (docId: string) => string): { documentId: string; digestSha256: string }[] {
  return world.docIds.map((documentId) => ({
    documentId,
    digestSha256: mutate !== undefined ? mutate(documentId) : world.recordedFullDigests[documentId]!,
  }));
}

/** Build an INTACT card packet from a real packet + real digests. */
function intactCard(world: World, mutate?: (docId: string) => string): Record<string, unknown> {
  const prepared = prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: digestEntries(world, mutate) });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') throw new Error('fixture refused');
  const card = buildSourceStalenessCardPacket(prepared);
  assert.equal(card.status, 'VERIFIED');
  return JSON.parse(JSON.stringify(card)) as Record<string, unknown>;
}

test('an intact ALL_CURRENT card renders VERIFIED with a PASSED headline and frozen rows', () => {
  const world = realPacket(2);
  const vm = buildSourceStalenessCardViewModel(intactCard(world));
  assert.equal(vm.kind, 'VERIFIED_SOURCE_STALENESS_CARD');
  if (vm.kind !== 'VERIFIED_SOURCE_STALENESS_CARD') return;
  assert.equal(vm.display.verdict, 'ALL_CURRENT');
  assert.ok(vm.display.headline.includes('PASSED'));
  assert.ok(vm.display.headline.includes('2'));
  assert.equal(vm.display.tenantId, TENANT);
  assert.equal(vm.display.staleCount, 0);
  assert.equal(vm.display.uncheckedCount, 0);
  assert.deepEqual([...vm.display.assessed], [...vm.display.assessed]);
  assert.ok(vm.display.operatorNote.includes('RE-DERIVED'));
  assert.ok(vm.display.operatorNote.includes('12d-315-v1'));
});

test('an intact STALE card renders FAILED with the moved evidence disclosed BY storyId', () => {
  const world = realPacket(2);
  const moved = 'd'.repeat(64);
  const vm = buildSourceStalenessCardViewModel(intactCard(world, (docId) => (docId === 'sscv-doc-1' ? moved : world.recordedFullDigests[docId]!)));
  assert.equal(vm.kind, 'VERIFIED_SOURCE_STALENESS_CARD');
  if (vm.kind !== 'VERIFIED_SOURCE_STALENESS_CARD') return;
  assert.equal(vm.display.verdict, 'STALE_SOURCES_PRESENT');
  assert.ok(vm.display.headline.includes('FAILED'));
  assert.ok(vm.display.headline.includes('1 reviewed fact(s) cite moved evidence'));
  assert.deepEqual([...vm.display.staleDocumentIds], ['sscv-doc-1']);
  assert.deepEqual([...vm.display.affectedStoryIds], ['sscv-story-001']);
  assert.equal(vm.display.staleCount, 1);
});

test('an intact UNCHECKED card renders INCOMPLETE — unchecked never looks like current', () => {
  const world = realPacket(2);
  const prepared = prepareSourceStalenessCard({ memoryPacket: world.packet, currentDigests: digestEntries(world).slice(0, 1) });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') return;
  const partialCard = JSON.parse(JSON.stringify(buildSourceStalenessCardPacket(prepared))) as Record<string, unknown>;
  const vm = buildSourceStalenessCardViewModel(partialCard);
  assert.equal(vm.kind, 'VERIFIED_SOURCE_STALENESS_CARD');
  if (vm.kind !== 'VERIFIED_SOURCE_STALENESS_CARD') return;
  assert.equal(vm.display.verdict, 'UNCHECKED_SOURCES_PRESENT');
  assert.ok(vm.display.headline.includes('INCOMPLETE'));
  assert.equal(vm.display.uncheckedCount, 1);
});

test('tampered assessed ROWS refuse — the VM re-derives them from the objectives', () => {
  const world = realPacket(2);
  const card = intactCard(world);
  const rows = card.assessed as Record<string, unknown>[];
  const flipped = rows.map((r) => ({ ...r, verdict: r.verdict === 'CURRENT' ? 'STALE' : 'CURRENT' }));
  const vm = buildSourceStalenessCardViewModel({ ...card, assessed: flipped });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('re-derived'));
});

test('a tampered VERDICT refuses', () => {
  const world = realPacket(2);
  const vm = buildSourceStalenessCardViewModel({ ...intactCard(world), verdict: 'STALE_SOURCES_PRESENT' });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('verdict does not match'));
});

test('tampered staleCount / staleDocumentIds / affectedStoryIds / uncheckedCount all refuse', () => {
  const world = realPacket(2);
  const base = intactCard(world);
  const countTampered = { ...base, staleCount: 1 } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(countTampered).kind, 'REFUSED');
  const idsTampered = { ...base, staleDocumentIds: ['sscv-doc-999'] } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(idsTampered).kind, 'REFUSED');
  const affectedTampered = { ...base, affectedStoryIds: ['sscv-story-999'] } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(affectedTampered).kind, 'REFUSED');
  const uncheckedTampered = { ...base, uncheckedCount: 5 } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(uncheckedTampered).kind, 'REFUSED');
});

test('a tampered inner memoryPacket refuses — the REAL gate re-runs on the card input', () => {
  const world = realPacket(2);
  const card = intactCard(world);
  const inner = card.memoryPacket as Record<string, unknown>;
  const tampered = { ...card, memoryPacket: { ...inner, memoryDigest: 'f'.repeat(64) } } as unknown;
  const vm = buildSourceStalenessCardViewModel(tampered);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('re-verification'));
});

test('tampered currentDigests inside the card refuse — shape is re-screened', () => {
  const world = realPacket(2);
  const card = intactCard(world);
  const badShape = { ...card, currentDigests: [{ documentId: 'sscv-doc-1', digestSha256: 'NOT-HEX' }] } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(badShape).kind, 'REFUSED');
  const badDup = { ...card, currentDigests: [...digestEntries(world), ...digestEntries(world)] } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(badDup).kind, 'REFUSED');
});

test('a REFUSED card packet renders a REFUSED VM echoing NO content and NO reason body', () => {
  const world = realPacket(2);
  const refused = prepareSourceStalenessCard({ memoryPacket: { ...world.packet, memoryDigest: 'e'.repeat(64) }, currentDigests: digestEntries(world) });
  assert.equal(refused.status, 'REFUSED');
  const vm = buildSourceStalenessCardViewModel(refused);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.ok(!vm.display.bodyText.includes('sscv'), 'no document content echoed');
  assert.ok(vm.display.headline.includes('HUMAN DECISION REQUIRED'));
});

test('key order and extra keys refuse; honest flags and tenant consistency are enforced', () => {
  const world = realPacket(2);
  const card = intactCard(world);
  const reordered: Record<string, unknown> = {};
  for (const k of Object.keys(card).reverse()) reordered[k] = (card as Record<string, unknown>)[k];
  assert.equal(buildSourceStalenessCardViewModel(reordered).kind, 'REFUSED');
  assert.equal(buildSourceStalenessCardViewModel({ ...card, smuggled: 1 }).kind, 'REFUSED');
  const flagsTampered = { ...card, learningPromoted: true } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(flagsTampered).kind, 'REFUSED');
  const tenantTampered = { ...card, tenantId: 'other-tenant' } as unknown;
  assert.equal(buildSourceStalenessCardViewModel(tenantTampered).kind, 'REFUSED');
});

test('source purity: the VM imports no fs, no network primitives, no clock, no randomness', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-source-staleness-card-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import');
});