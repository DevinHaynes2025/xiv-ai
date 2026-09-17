// 12D-316 — adversarial tests for the stale-source re-ingestion plan.
// Central properties under attack:
//   1. STALE IS RE-DERIVED through the REAL 12D-315 contract — a CURRENT
//      or UNCHECKED source refuses with "nothing to re-ingest"; a
//      tampered packet refuses.
//   2. THE STORIES COME FROM THE REAL 12D-274 INGEST DOOR — the plan
//      never re-implements chunking/digesting; over-budget paragraphs
//      refuse through the door's own rule; the plan cap holds.
//   3. THE SUCCESSOR ID MUST BE GENUINELY NEW — the stale id itself and
//      every assessed document refuse.
//   4. NOTHING IS ADMITTED HERE: no queue, no model, no fetch; honest
//      flags pinned; secrets never processed and never echoed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  STALE_REINGEST_PLAN_GUARDRAILS, STALE_REINGEST_PLAN_POLICY,
  prepareStaleReingestPlan, buildStaleReingestPlanPacket,
  type StaleReingestPlanPrepared,
} from './xiv-stale-reingest-plan';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'srp-tenant';
const DOC_ID = 'srp-doc-1';
const OLD_HEAD = createHash('sha256').update('old-bytes').digest('hex').slice(0, 16);
const NEW_FULL = 'd'.repeat(64); // a genuinely moved digest for the CURRENT bytes

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `srp-story-${String(n).padStart(3, '0')}`,
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
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-316-'));
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

const NEW_BODY = 'The successor source text.\n\nSecond paragraph with more of the successor content.';
const NEW_TITLE = 'srp successor source';

function planInput(packet: Record<string, unknown>, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    memoryPacket: packet,
    currentDigests: [{ documentId: DOC_ID, digestSha256: NEW_FULL }],
    staleDocumentId: DOC_ID,
    newDocumentId: 'srp-successor-doc-1',
    newTitle: NEW_TITLE,
    newBodyText: NEW_BODY,
    ...overrides,
  };
}

function planFor(packet: Record<string, unknown>, overrides: Record<string, unknown> = {}): StaleReingestPlanPrepared {
  const prepared = prepareStaleReingestPlan(planInput(packet, overrides));
  assert.equal(prepared.status, 'PREPARED');
  if (prepared.status !== 'PREPARED') throw new Error('fixture refused');
  return prepared;
}

test('a STALE assessment yields a plan with the full lineage disclosed and REAL-door stories', () => {
  const packet = realPacket();
  const prepared = planFor(packet);
  assert.equal(prepared.tenantId, TENANT);
  assert.equal(prepared.previousDigestHead, OLD_HEAD);
  assert.equal(prepared.currentDigestHead, NEW_FULL.slice(0, 16));
  assert.equal(prepared.newDocumentId, 'srp-successor-doc-1');
  assert.equal(prepared.chunkCount, 1, 'the REAL 12D-274 door packed both paragraphs into one bounded chunk');
  assert.ok(prepared.newDigestSha256.length === 64);
  assert.ok(prepared.stories.length === 1);
  const card = buildStaleReingestPlanPacket(prepared);
  assert.equal(card.status, 'VERIFIED');
  if (card.status !== 'VERIFIED') return;
  assert.deepEqual([...card.storyIds], prepared.stories.map((s) => s.id));
  // The emitted stories carry the successor docRef — the new evidence version.
  const docRe = /doc:([^:\s"]+):([0-9a-f]{16})/;
  const m = prepared.stories[0]!.objective.match(docRe);
  assert.ok(m);
  assert.equal(m![1], 'srp-successor-doc-1');
  assert.equal(m![2], prepared.newDigestSha256.slice(0, 16));
  assert.equal(card.modelCalls, 0);
  assert.equal(card.remoteCalls, 0);
  assert.equal(card.activated, 0);
  assert.equal(card.learningPromoted, false);
  assert.equal(card.humanDecision, 'REQUIRED');
  assert.ok(card.stoppedBefore.includes('nothing admitted'));
  assert.ok(Object.isFrozen(card));
});

test('a CURRENT source refuses with nothing to re-ingest', () => {
  const packet = realPacket();
  const prepared = prepareStaleReingestPlan(planInput(packet, {
    currentDigests: [{ documentId: DOC_ID, digestSha256: OLD_HEAD + '0'.repeat(48) }],
  }));
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(prepared.reason.includes('CURRENT, not STALE'));
});

test('an UNCHECKED source (no supplied digest) refuses with nothing to re-ingest', () => {
  const packet = realPacket();
  const prepared = prepareStaleReingestPlan(planInput(packet, { currentDigests: [{ documentId: 'unrelated-doc', digestSha256: 'a'.repeat(64) }] }));
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(prepared.reason.includes('UNCHECKED, not STALE'));
});

test('a tampered memory packet refuses through the REAL staleness derivation', () => {
  const packet = realPacket();
  const prepared = prepareStaleReingestPlan(planInput(packet, { memoryPacket: { ...packet, memoryDigest: 'f'.repeat(64) } }));
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status !== 'REFUSED') return;
  assert.ok(prepared.reason.includes('refused'));
  assert.ok(!prepared.reason.includes('srp-story'), 'no storyId echoed');
});

test('the successor id must be genuinely NEW: the stale id and every assessed id refuse', () => {
  const packet = realPacket();
  const self = prepareStaleReingestPlan(planInput(packet, { newDocumentId: DOC_ID }));
  assert.equal(self.status, 'REFUSED');
  if (self.status === 'REFUSED') assert.ok(self.reason.includes('collides'));
  const other = prepareStaleReingestPlan(planInput(packet, {
    currentDigests: [
      { documentId: DOC_ID, digestSha256: NEW_FULL },
      { documentId: 'unrelated-doc', digestSha256: 'a'.repeat(64) },
    ],
    newDocumentId: 'unrelated-doc',
  }));
  assert.equal(other.status, 'REFUSED', 'a SUPPLIED digest document is assessed too — collision refuses');
  if (other.status === 'REFUSED') assert.ok(other.reason.includes('collides'));
});

test('the REAL ingest door rules carry through: over-budget paragraph and secrets refuse', () => {
  const packet = realPacket();
  const longPara = 'x'.repeat(2201);
  const oversized = prepareStaleReingestPlan(planInput(packet, { newBodyText: longPara }));
  assert.equal(oversized.status, 'REFUSED');
  if (oversized.status === 'REFUSED') assert.ok(oversized.reason.includes('2200'), 'the REAL door refusal is relayed');
  const secret = prepareStaleReingestPlan(planInput(packet, { newBodyText: 'key ghp_' + 'A'.repeat(36) + ' leaked' }));
  assert.equal(secret.status, 'REFUSED');
  if (secret.status === 'REFUSED') assert.ok(!secret.reason.includes('ghp_'), 'never echoes the secret');
});

test('the plan cap: a successor producing over 24 chunks refuses as one deliberate plan', () => {
  const packet = realPacket();
  const bigBody = Array.from({ length: 30 }, (_, i) => `Paragraph ${i}. ${'y'.repeat(2100)}`).join('\n\n');
  const prepared = prepareStaleReingestPlan(planInput(packet, { newBodyText: bigBody }));
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(prepared.reason.includes('plan cap'));
});

test('bounds, junk inputs, wrong keys and wrong ORDER all refuse', () => {
  const packet = realPacket();
  for (const junk of [null, undefined, 'nope', [], {}, { memoryPacket: packet }, planInput(packet, { smuggled: 1 })]) {
    assert.equal(prepareStaleReingestPlan(junk).status, 'REFUSED');
  }
  const reordered = planInput(packet);
  const orderedKeys = ['memoryPacket', 'currentDigests', 'staleDocumentId', 'newDocumentId', 'newTitle', 'newBodyText'];
  const wrongOrder: Record<string, unknown> = {};
  for (const k of orderedKeys.slice().reverse()) wrongOrder[k] = reordered[k];
  assert.equal(prepareStaleReingestPlan(wrongOrder).status, 'REFUSED', 'exact keys IN ORDER');
  const badId = prepareStaleReingestPlan(planInput(packet, { staleDocumentId: 'not id shaped!' }));
  assert.equal(badId.status, 'REFUSED');
});

test('a target document the packet does not carry refuses', () => {
  const packet = realPacket();
  const prepared = prepareStaleReingestPlan(planInput(packet, { staleDocumentId: 'not-carried-doc' }));
  assert.equal(prepared.status, 'REFUSED');
  if (prepared.status === 'REFUSED') assert.ok(prepared.reason.includes('not carried'));
});

test('the packet is never built from a non-PREPARED plan', () => {
  const packet = realPacket();
  const refused = prepareStaleReingestPlan(planInput(packet, { staleDocumentId: 'not-carried-doc' }));
  assert.equal(refused.status, 'REFUSED');
  const card = buildStaleReingestPlanPacket(refused as never);
  assert.equal(card.status, 'REFUSED');
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(STALE_REINGEST_PLAN_GUARDRAILS));
  assert.ok(Object.isFrozen(STALE_REINGEST_PLAN_POLICY));
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.modelCalls, 0);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.remoteCalls, 0);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.learningPromoted, false);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.activated, 0);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.collectsNothing, true);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.automaticRecovery, false);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.billionUsersProven, false);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.theRealStalenessDerivation, true);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.theRealIngestDoor, true);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.staleOnlyReingested, true);
  assert.equal(STALE_REINGEST_PLAN_GUARDRAILS.nothingAdmittedHere, true);
  assert.equal(STALE_REINGEST_PLAN_POLICY.policyVersion, '12d-316-v1');
});

test('source purity: the module imports no fs, no network primitives, no clock, no randomness, no sqlite', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-stale-reingest-plan.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch — the operator supplies the bytes');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import (the queue stays behind its doors)');
});