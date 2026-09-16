// 12D-259 — adversarial tests for the story-shell packet ingest. The central
// properties under attack:
//   1. EVERY packet passes the 12D-254 gate before any view model exists.
//   2. A refused view model carries ZERO packet content (client or server).
//   3. Unparseable text refuses honestly with diagnostics, never a crash.
//   4. Per-packet all-or-nothing: one tampered packet never taints neighbors.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryShellPacket,
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import {
  STORY_SHELL_INGEST_GUARDRAILS,
  STORY_SHELL_INGEST_POLICY,
  ingestStoryShellPacketJson,
} from './xiv-story-shell-ingest';

function makePacket(storyId: string, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId,
    headline,
    bodyText: 'an operator-authored packet offered to the shell for display only',
    generatedAtMs: 1_000_000,
    avatar: null,
    decidingOver: 'whether the story may proceed to operator review in the custody stack',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'test fixture packet must verify');
  return packet;
}

const REFUSAL_NO_CONTENT = (vm: { display: { headline: string; bodyText: string } }, mustNotContain: string) => {
  assert.ok(!vm.display.headline.includes(mustNotContain), 'refusal headline must not leak packet content');
  assert.ok(!vm.display.bodyText.includes(mustNotContain), 'refusal body must not leak packet content');
};

test('12d-259: a valid single packet ingests to one fully verified view model', () => {
  const packet = makePacket('12d-259-ingest-happy', 'An intact operator packet');
  const result = ingestStoryShellPacketJson(JSON.stringify(packet));
  assert.equal(result.kind, 'INGESTED');
  assert.equal(result.policyVersion, '12d-254-v1');
  assert.equal(result.items.length, 1);
  assert.equal(result.parseReasons.length, 0);
  const vm = result.items[0]!;
  assert.equal(vm.kind, 'VERIFIED_PACKET');
  assert.ok(vm.kind === 'VERIFIED_PACKET');
  assert.equal(vm.display.headline, 'An intact operator packet');
  assert.equal(vm.display.storyId, '12d-259-ingest-happy');
  assert.equal(vm.packet.packetId, packet.packetId);
  assert.equal(vm.display.humanDecision, 'REQUIRED');
  assert.ok(Object.isFrozen(result), 'the ingest result must be frozen');
});

test('12d-259: a tampered packet ingests to a REFUSED view model carrying zero packet content', () => {
  const packet = makePacket('12d-259-ingest-tamper', 'A packet someone edits in flight');
  const tampered = JSON.parse(JSON.stringify(packet)) as { headline: string };
  tampered.headline = 'Edited in flight: unauthorized headline';
  const result = ingestStoryShellPacketJson(JSON.stringify(tampered));
  assert.equal(result.kind, 'INGESTED');
  assert.equal(result.items.length, 1);
  const vm = result.items[0]!;
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.match(vm.reason, /digest mismatch|tamper/i);
  REFUSAL_NO_CONTENT(vm, 'Edited in flight');
  REFUSAL_NO_CONTENT(vm, '12d-259-ingest-tamper');
  assert.ok(Object.isFrozen(vm));
});

test('12d-259: invalid JSON refuses as UNPARSEABLE with honest diagnostics and zero content', () => {
  const result = ingestStoryShellPacketJson('{"headline": "unterminated');
  assert.equal(result.kind, 'UNPARSEABLE');
  assert.equal(result.items.length, 0);
  assert.equal(result.parseReasons.length, 1);
  assert.match(result.parseReasons[0]!, /not valid JSON/i);
});

test('12d-259: non-string inputs refuse as UNPARSEABLE', () => {
  for (const bad of [null, undefined, 42, true, {}, [], { headline: 'an object is not packet text' }]) {
    const result = ingestStoryShellPacketJson(bad);
    assert.equal(result.kind, 'UNPARSEABLE', `input ${JSON.stringify(bad)} must refuse`);
    assert.match(result.parseReasons[0]!, /non-empty string/);
  }
});

test('12d-259: empty and oversized text refuse as UNPARSEABLE', () => {
  const empty = ingestStoryShellPacketJson('');
  assert.equal(empty.kind, 'UNPARSEABLE');
  assert.match(empty.parseReasons[0]!, /non-empty string/);
  const oversized = 'x'.repeat(STORY_SHELL_INGEST_POLICY.maxPacketTextChars + 1);
  const big = ingestStoryShellPacketJson(oversized);
  assert.equal(big.kind, 'UNPARSEABLE');
  assert.match(big.parseReasons[0]!, /exceeds/);
});

test('12d-259: a valid batch ingests to verified view models in order', () => {
  const a = makePacket('12d-259-batch-a', 'First packet');
  const b = makePacket('12d-259-batch-b', 'Second packet');
  const result = ingestStoryShellPacketJson(JSON.stringify([a, b]));
  assert.equal(result.kind, 'INGESTED');
  assert.equal(result.items.length, 2);
  assert.ok(result.items[0]!.kind === 'VERIFIED_PACKET' && result.items[0]!.display.storyId === '12d-259-batch-a');
  assert.ok(result.items[1]!.kind === 'VERIFIED_PACKET' && result.items[1]!.display.storyId === '12d-259-batch-b');
});

test('12d-259: a mixed batch judges each packet independently — one tamper refuses itself only', () => {
  const good = makePacket('12d-259-mixed-good', 'A good packet');
  const bad = makePacket('12d-259-mixed-bad', 'A packet to tamper with');
  const tampered = { ...JSON.parse(JSON.stringify(bad)), headline: 'Tainted headline' };
  const result = ingestStoryShellPacketJson(JSON.stringify([good, tampered]));
  assert.equal(result.kind, 'INGESTED');
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0]!.kind, 'VERIFIED_PACKET');
  assert.equal(result.items[1]!.kind, 'REFUSED');
  const refused = result.items[1]!;
  assert.ok(refused.kind === 'REFUSED');
  REFUSAL_NO_CONTENT(refused, 'Tainted headline');
  // The good neighbor is untouched by the tampered sibling.
  assert.ok(result.items[0]!.kind === 'VERIFIED_PACKET');
});

test('12d-259: batch size is bounded — empty and oversized batches refuse whole', () => {
  const empty = ingestStoryShellPacketJson(JSON.stringify([]));
  assert.equal(empty.kind, 'UNPARSEABLE');
  assert.match(empty.parseReasons[0]!, /at least one packet/);
  const oversized = Array.from({ length: STORY_SHELL_INGEST_POLICY.maxBatchSize + 1 }, (_, i) => makePacket(`12d-259-over-${i}`, `Packet ${i}`));
  const big = ingestStoryShellPacketJson(JSON.stringify(oversized));
  assert.equal(big.kind, 'UNPARSEABLE');
  assert.match(big.parseReasons[0]!, /exceeds 100 packets/);
});

test('12d-259: non-object batch elements refuse individually via the 12D-254 gate', () => {
  const good = makePacket('12d-259-junk-neighbor', 'A good packet beside junk');
  const result = ingestStoryShellPacketJson(JSON.stringify([good, 'junk-string', 7, null]));
  assert.equal(result.kind, 'INGESTED');
  assert.equal(result.items.length, 4);
  assert.equal(result.items[0]!.kind, 'VERIFIED_PACKET');
  for (const vm of result.items.slice(1)) {
    assert.equal(vm.kind, 'REFUSED');
    assert.ok(vm.kind === 'REFUSED');
    assert.match(vm.reason, /packet object is required/);
  }
});

test('12d-259: policy pins — bounded caps are sane and guardrails stay honest', () => {
  assert.equal(STORY_SHELL_INGEST_POLICY.policyVersion, '12d-259-v1');
  assert.equal(STORY_SHELL_INGEST_POLICY.domain, 'XIV_OS_STORY_SHELL_INGEST');
  assert.ok(STORY_SHELL_INGEST_POLICY.maxPacketTextChars >= 65_536, 'the text cap must admit real packets');
  assert.ok(STORY_SHELL_INGEST_POLICY.maxBatchSize >= 1 && STORY_SHELL_INGEST_POLICY.maxBatchSize <= 10_000);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.modelCalls, 0);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.remoteCalls, 0);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.refusedContentStaysServerSide, true);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.perPacketAllOrNothing, true);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.noApproveControl, true);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.learningPromoted, false);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.billionUsersProven, false);
  assert.equal(STORY_SHELL_INGEST_GUARDRAILS.automaticRecovery, false);
});