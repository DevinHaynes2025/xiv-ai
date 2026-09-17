// 12D-316 — adversarial tests for the stale re-ingestion plan VIEW
// MODEL. The VM re-derives the ENTIRE plan from the packet's own inputs
// through ONLY real contracts (REAL 12D-306 memory gate, REAL 12D-315
// staleness contract, REAL 12D-274 ingest door) and refuses any packet
// whose lineage, digest, chunk count, story ids or stories do not match
// — tampered plans render NOTHING.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  prepareStaleReingestPlan, buildStaleReingestPlanPacket,
} from './xiv-stale-reingest-plan';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';
import { buildStaleReingestPlanViewModel } from './xiv-stale-reingest-plan-view-model';

const TENANT = 'srpv-tenant';
const DOC_ID = 'srpv-doc-1';
const OLD_HEAD = createHash('sha256').update('old-bytes').digest('hex').slice(0, 16);
const NEW_FULL = 'd'.repeat(64);
const NEW_BODY = 'The successor source text.\n\nSecond paragraph with more of the successor content.';
const NEW_TITLE = 'srpv successor source';

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `srpv-story-${String(n).padStart(3, '0')}`,
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

function realPacket(): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-316-vm-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  try {
    const objective = `READ AND SUMMARIZE reviewed fact 1 Source: doc:${DOC_ID}:${OLD_HEAD}`;
    makeDone(q, 1, objective);
    return JSON.parse(JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }))) as Record<string, unknown>;
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

function intactPlan(): Record<string, unknown> {
  const packet = realPacket();
  const prepared = prepareStaleReingestPlan({
    memoryPacket: packet,
    currentDigests: [{ documentId: DOC_ID, digestSha256: NEW_FULL }],
    staleDocumentId: DOC_ID,
    newDocumentId: 'srpv-successor-doc-1',
    newTitle: NEW_TITLE,
    newBodyText: NEW_BODY,
  });
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') throw new Error('fixture refused');
  const plan = buildStaleReingestPlanPacket(prepared);
  assert.equal(plan.status, 'VERIFIED');
  return JSON.parse(JSON.stringify(plan)) as Record<string, unknown>;
}

test('an intact plan renders VERIFIED with the full lineage headline and frozen fields', () => {
  const vm = buildStaleReingestPlanViewModel(intactPlan());
  assert.equal(vm.kind, 'VERIFIED_STALE_REINGEST_PLAN');
  if (vm.kind !== 'VERIFIED_STALE_REINGEST_PLAN') return;
  assert.ok(vm.display.headline.includes('supersedes stale srpv-doc-1'));
  assert.ok(vm.display.headline.includes('nothing admitted here'));
  assert.equal(vm.display.tenantId, TENANT);
  assert.equal(vm.display.previousDigestHead, OLD_HEAD);
  assert.equal(vm.display.currentDigestHead, NEW_FULL.slice(0, 16));
  assert.equal(vm.display.newDocumentId, 'srpv-successor-doc-1');
  assert.equal(vm.display.chunkCount, 1);
  assert.ok(vm.display.operatorNote.includes('12D-275/12D-278'));
  assert.ok(vm.display.operatorNote.includes('RE-DERIVED'));
});

test('tampered storyIds refuse — the REAL door re-derives them', () => {
  const plan = intactPlan();
  const vm = buildStaleReingestPlanViewModel({ ...plan, storyIds: ['tampered-id'] });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('storyIds do not match'));
});

test('a tampered successor digest refuses', () => {
  const plan = intactPlan();
  const vm = buildStaleReingestPlanViewModel({ ...plan, newDigestSha256: 'a'.repeat(64) });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('digest does not match'));
});

test('tampered STORIES refuse — the VM re-derives every story via the REAL 12D-274 door', () => {
  const plan = intactPlan();
  const stories = JSON.parse(JSON.stringify(plan.stories)) as Record<string, unknown>[];
  const mutated = stories.map((s) => ({ ...s, objective: 'TAMPERED ' + String(s.objective) }));
  const vm = buildStaleReingestPlanViewModel({ ...plan, stories: mutated });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('stories do not match'));
});

test('tampered chunkCount and tampered lineage heads refuse', () => {
  const plan = intactPlan();
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, chunkCount: 9 }).kind, 'REFUSED');
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, previousDigestHead: '0'.repeat(16) }).kind, 'REFUSED');
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, currentDigestHead: '0'.repeat(16) }).kind, 'REFUSED');
});

test('a tampered inner memoryPacket refuses — the REAL 12D-306 gate re-runs', () => {
  const plan = intactPlan();
  const inner = plan.memoryPacket as Record<string, unknown>;
  const vm = buildStaleReingestPlanViewModel({ ...plan, memoryPacket: { ...inner, memoryDigest: 'f'.repeat(64) } });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('re-verification'));
});

test('tampered currentDigests refuse — the STALE re-derivation must still hold', () => {
  const plan = intactPlan();
  const vm = buildStaleReingestPlanViewModel({
    ...plan,
    currentDigests: [{ documentId: DOC_ID, digestSha256: OLD_HEAD + '0'.repeat(48) }],
  });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('not STALE'));
});

test('a tampered successor BODY refuses — the REAL door re-derives a different digest', () => {
  const plan = intactPlan();
  const vm = buildStaleReingestPlanViewModel({ ...plan, newBodyText: String(plan.newBodyText) + ' extra bytes' });
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.reason.includes('digest does not match'));
});

test('a REFUSED plan packet renders a REFUSED VM echoing NO content', () => {
  const packet = realPacket();
  const refused = prepareStaleReingestPlan({
    memoryPacket: packet,
    currentDigests: [{ documentId: DOC_ID, digestSha256: OLD_HEAD + '0'.repeat(48) }],
    staleDocumentId: DOC_ID,
    newDocumentId: 'srpv-successor-doc-1',
    newTitle: NEW_TITLE,
    newBodyText: NEW_BODY,
  });
  assert.equal(refused.status, 'REFUSED');
  const vm = buildStaleReingestPlanViewModel(refused);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind !== 'REFUSED') return;
  assert.ok(!vm.display.bodyText.includes('srpv'), 'no content echoed');
  assert.ok(vm.display.headline.includes('HUMAN DECISION REQUIRED'));
});

test('key order and extra keys refuse; honest flags and tenant consistency are enforced', () => {
  const plan = intactPlan();
  const reordered: Record<string, unknown> = {};
  for (const k of Object.keys(plan).reverse()) reordered[k] = (plan as Record<string, unknown>)[k];
  assert.equal(buildStaleReingestPlanViewModel(reordered).kind, 'REFUSED');
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, smuggled: 1 }).kind, 'REFUSED');
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, learningPromoted: true }).kind, 'REFUSED');
  assert.equal(buildStaleReingestPlanViewModel({ ...plan, tenantId: 'other-tenant' }).kind, 'REFUSED');
});

test('source purity: the VM imports no fs, no network primitives, no clock, no randomness', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-stale-reingest-plan-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import');
});