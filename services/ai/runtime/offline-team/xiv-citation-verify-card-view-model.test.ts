// 12D-314 — adversarial tests for the citation verify card view model.
// Central properties under attack:
//   1. THE DIGEST IS RE-DERIVED FROM THE DRAFT — never trusted.
//   2. THE CITATIONS ARE RE-EXTRACTED from the draft through the REAL
//      extractor and must match the packet exactly.
//   3. THE VERDICT IS RE-DERIVED — a verdict that does not match the
//      citations refuses.
//   4. Honest flags and bounds on every tamper direction; reordered or
//      smuggled keys refuse; a REAL refusal packet renders honestly.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS,
  CITATION_VERIFY_CARD_VIEW_MODEL_POLICY,
  buildCitationVerifyCardViewModel,
} from './xiv-citation-verify-card-view-model';
import {
  prepareCitationVerifyCard, buildCitationVerifyCardPacket,
} from './xiv-citation-verify-card';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'cvc-vm-tenant';

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `cvcvm-story-${String(n).padStart(3, '0')}`,
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
  q.settle(lease!, { outcome: 'DRAFT', outputHash: hashOf(n), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: story.id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: hashOf(n), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

function realPacket(entries: number): { packet: Record<string, unknown>; storyIds: string[] } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d-314vm-'));
  const q = new OfflineStoryQueue(join(dir, 'queue.sqlite'));
  const storyIds: string[] = [];
  try {
    for (let i = 1; i <= entries; i += 1) {
      const objective = `READ AND SUMMARIZE reviewed fact number ${i} about the architecture`;
      makeDone(q, i, objective);
      storyIds.push(makeStory(i, objective).id);
    }
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return { packet: JSON.parse(JSON.stringify(packet)) as Record<string, unknown>, storyIds };
  } finally {
    q.close();
    rmSync(dir, { recursive: true, force: true });
  }
}

async function cardFor(draft: string): Promise<Record<string, unknown>> {
  const { packet } = realPacket(3);
  const prepared = prepareCitationVerifyCard({ draft, memoryPacket: packet });
  if (prepared.status !== 'PREPARED') throw new Error(`fixture refused: ${(prepared as { reason: string }).reason}`);
  return JSON.parse(JSON.stringify(buildCitationVerifyCardPacket(prepared))) as Record<string, unknown>;
}

test('a verified ALL_CITATIONS_VERIFIED card renders PASSED with its citations', async () => {
  const { storyIds } = realPacket(3);
  const card = await cardFor(`Grounded [mem:${storyIds[1]}] and [mem:${storyIds[0]}].`);
  const vm = buildCitationVerifyCardViewModel(card);
  assert.equal(vm.kind, 'VERIFIED_CITATION_VERIFY_CARD');
  if (vm.kind !== 'VERIFIED_CITATION_VERIFY_CARD') return;
  assert.equal(vm.display.verdict, 'ALL_CITATIONS_VERIFIED');
  assert.equal(vm.display.citedCount, 2);
  assert.equal(vm.display.fabricatedCount, 0);
  assert.ok(vm.display.headline.includes('PASSED'));
  assert.ok(vm.display.headline.includes('2 citation(s) all in the verified carried set of 3'));
  assert.ok(vm.display.operatorNote.includes('digest was re-derived'));
  assert.ok(vm.display.operatorNote.includes('judges ONLY the citations'));
});

test('a zero-citation card renders honestly as UNGROUNDED', async () => {
  const card = await cardFor('My own reasoning only.');
  const vm = buildCitationVerifyCardViewModel(card);
  assert.equal(vm.kind, 'VERIFIED_CITATION_VERIFY_CARD');
  if (vm.kind !== 'VERIFIED_CITATION_VERIFY_CARD') return;
  assert.equal(vm.display.verdict, 'UNGROUNDED_NO_CITATIONS');
  assert.ok(vm.display.headline.includes('NO citations — an UNGROUNDED draft'));
});

test('a FABRICATED_CITATIONS card renders the fabricated ids so the operator can check by eye', async () => {
  const card = await cardFor('Grounded [mem:cvcvm-story-999] and [mem:cvcvm-story-001] supposedly.');
  const vm = buildCitationVerifyCardViewModel(card);
  assert.equal(vm.kind, 'VERIFIED_CITATION_VERIFY_CARD');
  if (vm.kind !== 'VERIFIED_CITATION_VERIFY_CARD') return;
  assert.equal(vm.display.verdict, 'FABRICATED_CITATIONS');
  assert.equal(vm.display.fabricatedCount, 1);
  assert.deepEqual([...vm.display.fabricatedStoryIds], ['cvcvm-story-999']);
  assert.ok(vm.display.headline.includes('Citation check FAILED'));
  assert.ok(vm.display.headline.includes('fabricated provenance, disclosed by id'));
});

test('a digest tamper (both directions) refuses the render', async () => {
  const card = await cardFor('Plain draft.');
  const edited = { ...card, draft: `${card.draft} tampered` };
  assert.equal(buildCitationVerifyCardViewModel(edited).kind, 'REFUSED');
  const forged = { ...card, draftSha256: 'a'.repeat(64) };
  assert.equal(buildCitationVerifyCardViewModel(forged).kind, 'REFUSED');
  const badChars = { ...card, draftChars: (card.draftChars as number) + 1 };
  assert.equal(buildCitationVerifyCardViewModel(badChars).kind, 'REFUSED');
});

test('a citation-list tamper refuses: re-extraction mismatch, duplicates, wrong count, bad shape', async () => {
  const { storyIds } = realPacket(3);
  const card = await cardFor(`Grounded [mem:${storyIds[0]}].`);
  const vm1 = buildCitationVerifyCardViewModel({ ...card, citedStoryIds: [storyIds[1]], citedCount: 1 });
  assert.equal(vm1.kind, 'REFUSED', 'a citedStoryIds list that does not match the re-extracted citations refuses');
  const vm2 = buildCitationVerifyCardViewModel({ ...card, citedCount: 2 });
  assert.equal(vm2.kind, 'REFUSED');
  const vm3 = buildCitationVerifyCardViewModel({ ...card, citedStoryIds: ['has space'], citedCount: 1 });
  assert.equal(vm3.kind, 'REFUSED');
  const vm4 = buildCitationVerifyCardViewModel({ ...card, verdict: 'UNGROUNDED_NO_CITATIONS' });
  assert.equal(vm4.kind, 'REFUSED', 'a verdict not derived from the citations refuses');
  const vm5 = buildCitationVerifyCardViewModel({ ...card, fabricatedStoryIds: [storyIds[0]], fabricatedCount: 1 });
  assert.equal(vm5.kind, 'REFUSED', 'a fabricated list containing a CARRIED id refuses');
  const vm6 = buildCitationVerifyCardViewModel({ ...card, carriedStoryIds: [] as string[], carriedCount: 0 });
  assert.equal(vm6.kind, 'REFUSED');
  const fabricatedCard = await cardFor('Grounded [mem:cvcvm-story-999] and [mem:cvcvm-story-001] supposedly.');
  const vm7 = buildCitationVerifyCardViewModel({ ...fabricatedCard, verdict: 'ALL_CITATIONS_VERIFIED' });
  assert.equal(vm7.kind, 'REFUSED', 'a verdict not derived from the citations refuses');
});

test('the honest-flag tamper directions all refuse', async () => {
  const { storyIds } = realPacket(3);
  const card = await cardFor(`Grounded [mem:${storyIds[0]}].`);
  const tampers: [string, Record<string, unknown>][] = [
    ['modelCalls 1', { modelCalls: 1 }],
    ['remoteCalls 1', { remoteCalls: 1 }],
    ['activated 1', { activated: 1 }],
    ['learningPromoted true', { learningPromoted: true }],
    ['humanDecision', { humanDecision: 'NOT_REQUIRED' }],
    ['policyVersion', { policyVersion: '12d-999-v9' }],
    ['kind', { kind: 'OTHER_CARD' }],
    ['tenantId empty', { tenantId: '' }],
    ['stoppedBefore', { stoppedBefore: 'nothing decides anything here' }],
    ['verdict unknown', { verdict: 'MADE_UP' }],
  ];
  for (const [label, tamper] of tampers) {
    const vm = buildCitationVerifyCardViewModel({ ...card, ...tamper });
    assert.equal(vm.kind, 'REFUSED', `tamper ${label} must refuse`);
  }
});

test('reordered keys and a smuggled key refuse; a REAL refusal packet renders honestly', async () => {
  const card = await cardFor('Plain draft.');
  const reordered: Record<string, unknown> = {};
  const keys = Object.keys(card);
  for (let i = keys.length - 1; i >= 0; i -= 1) reordered[keys[i]!] = (card as Record<string, unknown>)[keys[i]!];
  assert.equal(buildCitationVerifyCardViewModel(reordered).kind, 'REFUSED');
  assert.equal(buildCitationVerifyCardViewModel({ ...card, smuggled: 1 }).kind, 'REFUSED');
  const { packet } = realPacket(1);
  const refusedPacket = prepareCitationVerifyCard({ draft: 'a draft', memoryPacket: { ...packet, memoryDigest: 'd'.repeat(64) } });
  assert.equal(refusedPacket.status, 'REFUSED');
  const vm = buildCitationVerifyCardViewModel(refusedPacket);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(vm.display.bodyText.includes('NO card was rendered'));
});

test('junk inputs refuse and never throw; the render is deterministic', () => {
  for (const junk of [null, undefined, 'nope', [], {}, { status: 'OTHER' }]) {
    assert.equal(buildCitationVerifyCardViewModel(junk).kind, 'REFUSED');
  }
});

test('the guardrails are frozen and the honest flags are pinned', () => {
  assert.ok(Object.isFrozen(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS));
  assert.ok(Object.isFrozen(CITATION_VERIFY_CARD_VIEW_MODEL_POLICY));
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.digestReDerivedNeverTrusted, true);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.citationsReExtractedFromTheDraft, true);
  assert.equal(CITATION_VERIFY_CARD_VIEW_MODEL_GUARDRAILS.zeroCitationsRenderedAsUngrounded, true);
});

test('sibling door: the REAL 12D-310 extractor behavior is unchanged and the 12D-311 door still drafts', async () => {
  const sample = 'x [mem:abc-def_01] y';
  assert.deepEqual((await import('./xiv-assistant-memory-cited-turn')).extractCitedStoryIds(sample), ['abc-def_01']);
  const sibling = await import('./xiv-assistant-memory-cited-conversation');
  const { packet } = realPacket(1);
  const prepared = sibling.prepareAssistantMemoryCitedConversationTurn({
    tenantId: TENANT, conversationId: 'sib-cvc', userMessage: 'What holds?', priorTurns: [], memoryPacket: packet,
  });
  assert.equal(prepared.status, 'PREPARED', 'the 12D-311 door still prepares against a real packet');
});

test('source purity: the module imports no fs, no network primitives, no clock, no randomness', () => {
  const src = readFileSync(join(process.cwd(), 'runtime/offline-team/xiv-citation-verify-card-view-model.ts'), 'utf8');
  assert.ok(!/from 'node:fs'/.test(src), 'no fs import');
  assert.ok(!/fetch\(/.test(src), 'no fetch');
  assert.ok(!/http\.request|axios|XMLHttpRequest|WebSocket/.test(src), 'no network primitives');
  assert.ok(!/Date\.now|Math\.random/.test(src), 'deterministic: no clock, no randomness');
  assert.ok(!/node:sqlite/.test(src), 'no direct sqlite import');
});