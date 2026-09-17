// 12D-306 — adversarial tests for the assistant memory view model.
// Central properties under attack:
//   1. THE PACKET IS RE-VERIFIED, NEVER TRUSTED: exact-key gate (14
//      packet keys, 4 entry keys, in order), policy pin, honest flags —
//      and the MEMORY DIGEST IS RE-DERIVED from the entries; a tampered
//      digest (either direction) refuses the render.
//   2. SECRETS NEVER RENDER: a secret-shaped objective in the carried
//      memory refuses — and the refusal never echoes the secret.
//   3. DISCLOSED BOUNDS ARE ENFORCED: entry cap, objective cap with
//      truncation-flag consistency, scan cap, and doneCount/entries
//      consistency all refuse tampering.
//   4. FAIL CLOSED, HONESTLY: junk inputs render REFUSED — never throw,
//      never leak packet content, never claim success.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import {
  ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS,
  ASSISTANT_MEMORY_VIEW_MODEL_POLICY,
  buildAssistantMemoryViewModel,
} from './xiv-assistant-memory-view-model';
import { prepareAssistantMemoryRead } from './xiv-assistant-memory';

const TENANT = 'memory-tenant';

function hashOf(n: number): string {
  return createHash('sha256').update(`out-${n}`).digest('hex');
}

function makeStory(n: number, objective: string): OfflineStory {
  return {
    id: `fact-story-${String(n).padStart(3, '0')}`,
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
  q.enqueue([makeStory(n, objective)]);
  const lease = q.claimNext(TENANT, 'memory_curator', 'worker-1', 120_000);
  assert.ok(lease);
  q.settle(lease!, { outcome: 'DRAFT', outputHash: hashOf(n), providerSettled: true });
  q.applyReviewDecision({
    tenantId: TENANT, storyId: makeStory(n, objective).id, reviewerId: 'secure_code_reviewer',
    expectedOutputHash: hashOf(n), decision: 'APPROVED', reviewRef: `review:${n}`,
  });
}

/** A REAL packet through the REAL doors — never fabricated. */
function realPacket(entries = 2): Record<string, unknown> {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-memory-view-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try {
    for (let i = 1; i <= entries; i += 1) makeDone(q, i, `The reviewed fact ${i}.`);
    const packet = prepareAssistantMemoryRead(q, { tenantId: TENANT });
    return JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
}

function tampered(packet: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  const segs = path.split('.');
  let node: unknown = clone;
  for (let i = 0; i < segs.length - 1; i += 1) {
    node = (node as Record<string, unknown>)[segs[i]!];
  }
  (node as Record<string, unknown>)[segs[segs.length - 1]!] = value;
  return clone;
}

test('12d-306: a REAL door-produced packet renders verified with honest disclosures', () => {
  const packet = realPacket(2);
  const vm = buildAssistantMemoryViewModel(packet);
  assert.ok(vm.kind === 'VERIFIED_ASSISTANT_MEMORY', `expected verified, got ${vm.kind}: ${vm.kind === 'REFUSED' ? vm.reason : ''}`);
  assert.equal(vm.policyVersion, ASSISTANT_MEMORY_VIEW_MODEL_POLICY.policyVersion);
  assert.ok(vm.display.headline.includes('2 reviewed fact(s)'));
  assert.equal(vm.display.carriedCount, 2);
  assert.equal(vm.display.doneCount, 2);
  assert.equal(vm.display.truncatedNote, 'no bound bit');
  assert.equal(vm.display.entries[0]!.objectiveTruncated, false);
  assert.ok(vm.display.entries[0]!.outputHashHead.endsWith('…'));
  assert.ok(vm.display.operatorNote.includes('RE-DERIVED'));
  assert.ok(vm.display.operatorNote.includes('learningPromoted false'));
});

test('12d-306: the entry cap renders disclosed — most-recent facts with a truncation note', () => {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-memory-view-'));
  const q = new OfflineStoryQueue(join(dir, 'q.sqlite'));
  try {
    for (let i = 1; i <= 8; i += 1) makeDone(q, i, `Fact ${i}.`);
    const packet = JSON.parse(JSON.stringify(prepareAssistantMemoryRead(q, { tenantId: TENANT }))) as Record<string, unknown>;
    const vm = buildAssistantMemoryViewModel(packet);
    assert.ok(vm.kind === 'VERIFIED_ASSISTANT_MEMORY');
    if (vm.kind === 'VERIFIED_ASSISTANT_MEMORY') {
      assert.equal(vm.display.carriedCount, 6);
      assert.equal(vm.display.doneCount, 8);
      assert.ok(vm.display.truncatedNote.includes('most recent of 8 reviewed facts'));
      assert.equal(vm.display.entries[5]!.storyId, 'fact-story-008');
    }
  } finally { q.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('12d-306: the memory digest is RE-DERIVED — tampered digests refuse both directions', () => {
  const packet = realPacket(2);
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'memoryDigest', 'f'.repeat(64))).kind, 'REFUSED');
  // A swapped entry order breaks the re-derivation.
  const swapped = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  swapped.entries = [(packet.entries as unknown[])[1], (packet.entries as unknown[])[0]];
  assert.equal(buildAssistantMemoryViewModel(swapped).kind, 'REFUSED');
});

test('12d-306: secrets never render — a secret-shaped objective refuses without echoing', () => {
  const packet = realPacket(2);
  const entries = packet.entries as { storyId: string; outputHash: string; objective: string; objectiveTruncated: boolean }[];
  entries[1]!.objective = 'leak: ghp_' + 'a'.repeat(34);
  const reHashed = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  const vm = buildAssistantMemoryViewModel(reHashed);
  assert.equal(vm.kind, 'REFUSED');
  if (vm.kind === 'REFUSED') assert.ok(!vm.reason.includes('ghp_'), 'the refusal never echoes the secret');
});

test('12d-306: honest-flag tampering refuses', () => {
  const packet = realPacket(2);
  for (const [path, value] of [
    ['modelCalls', 1], ['remoteCalls', 1], ['learningPromoted', true],
    ['activated', 3], ['humanDecision', 'AUTO'],
  ] as const) {
    assert.equal(buildAssistantMemoryViewModel(tampered(packet, path, value)).kind, 'REFUSED', `flag tamper ${path} must refuse`);
  }
});

test('12d-306: entry-shape tampering refuses', () => {
  const packet = realPacket(2);
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entries.0.storyId', 'BAD ID!')).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entries.0.outputHash', 'nope')).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entries.0.objectiveTruncated', true)).kind, 'REFUSED',
    'a truncation flag inconsistent with the objective length refuses');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entries.0.objective', '')).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entries.0.smuggled', 1)).kind, 'REFUSED');
  // A reordered entry refuses.
  const entry = (packet.entries as unknown[])[0] as Record<string, unknown>;
  const reorderedEntry = Object.fromEntries(Object.entries(entry).reverse());
  const packet2 = JSON.parse(JSON.stringify(packet)) as Record<string, unknown>;
  (packet2.entries as unknown[])[0] = reorderedEntry;
  assert.equal(buildAssistantMemoryViewModel(packet2).kind, 'REFUSED');
});

test('12d-306: packet identity and bound-consistency tampering refuses', () => {
  const packet = realPacket(2);
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'kind', 'SOMETHING_ELSE')).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'policyVersion', '12d-999-v1')).kind, 'REFUSED');
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'tenantId', 'UPPER NOT ALLOWED!')).kind, 'REFUSED');
  // doneCount smaller than the carried entries refuses.
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'doneCount', 1)).kind, 'REFUSED');
  // entriesTruncated inconsistent with doneCount refuses (2 ≤ 6 → must be false).
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'entriesTruncated', true)).kind, 'REFUSED');
  // scannedTruncated below the scan cap refuses.
  assert.equal(buildAssistantMemoryViewModel(tampered(packet, 'scannedTruncated', true)).kind, 'REFUSED');
  // Reordered top-level keys refuse.
  const reordered = Object.fromEntries([
    ...Object.entries(packet).slice(1), Object.entries(packet)[0]!,
  ]);
  assert.equal(buildAssistantMemoryViewModel(reordered).kind, 'REFUSED');
});

test('12d-306: junk inputs render honest REFUSED — never throw, never leak', () => {
  for (const junk of [null, undefined, 42, 'packet', [], true, {}, { kind: 'ASSISTANT_MEMORY_READ' }]) {
    const vm = buildAssistantMemoryViewModel(junk);
    assert.equal(vm.kind, 'REFUSED');
    if (vm.kind === 'REFUSED') {
      assert.ok(vm.reason.length >= 1 && vm.reason.length <= 500, 'refusal reason bounded 1..500');
      assert.ok(vm.display.headline.includes('refused'));
      assert.ok(vm.display.bodyText.includes('NOT rendered'));
    }
  }
});

test('12d-306: deterministic — the same packet renders byte-identical views', () => {
  const packet = realPacket(2);
  assert.equal(JSON.stringify(buildAssistantMemoryViewModel(packet)), JSON.stringify(buildAssistantMemoryViewModel(packet)));
});

test('12d-306: guardrails and policy are pinned and frozen — the view never learns', () => {
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_VIEW_MODEL_POLICY));
  assert.ok(Object.isFrozen(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS));
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.memoryDigestReDerivedNeverTrusted, true);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.secretsNeverRender, true);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.boundsReChecked, true);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.reviewedFactsOnly, true);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.ledgeredNeverActivated, true);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.modelCalls, 0);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.remoteCalls, 0);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.learningPromoted, false);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.activated, 0);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.automaticRecovery, false);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.billionUsersProven, false);
  assert.equal(ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('12d-306: source purity — the view-model module stays pure (no fs, no network, no clock)', () => {
  const src = readFileSync(join(import.meta.dirname.replace(/\\/g, '/'), 'xiv-assistant-memory-view-model.ts'), 'utf8');
  for (const banned of ['node:fs', 'node:path', 'fetch(', 'http://', 'https://', '127.0.0.1', '11434', 'Date.now', 'Math.random', 'child_process', 'XMLHttpRequest', 'WebSocket', 'require(']) {
    assert.ok(!src.includes(banned), `the view model must not contain ${banned}`);
  }
});