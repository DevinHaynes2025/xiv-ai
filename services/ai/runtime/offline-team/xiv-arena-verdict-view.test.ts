// 12D-262 — adversarial tests for the arena verdict view. Central properties
// under attack:
//   1. The WHOLE submission (transcript + packet + verdict + identity + clock)
//      verifies as one unit through the REAL 12D-253/12D-258 contracts before
//      anything renders.
//   2. A refusal carries ZERO packet, transcript, or receipt content.
//   3. An unauthorized debate never renders, whatever else is consistent.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendArenaStep,
  deriveGoalDigest,
  emptyArenaTranscript,
  gateConsensus,
  type ArenaRole,
  type ArenaTranscript,
} from './xiv-multi-agent-arena';
import {
  buildStoryShellPacket,
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import { FileCustodyJournalStore } from './operator-custody-journal';
import { journalArenaVerdict } from './xiv-arena-custody';
import {
  ARENA_VERDICT_VIEW_GUARDRAILS,
  ARENA_VERDICT_VIEW_POLICY,
  buildArenaVerdictViewModel,
} from './xiv-arena-verdict-view';

const GOAL = 'authorize one story-shell packet into the operator custody chain';
const goalDigest = deriveGoalDigest(GOAL);
const GENESIS = '12d-262-journal-genesis';
const OPERATOR = 'operator:devin';
const NOW_MS = 1_000_000;

function envelope(role: ArenaRole, turn: number, parentDigest: string, payload: unknown): unknown {
  return { envelopeVersion: 1, role, turn, goalDigest, parentDigest, payload };
}

const planSteps = ['draft the packet', 'hold the adversarial round', 'authorize for human review'];
const proposal = 'proposal: exact-key gates plus a hash-chained transcript, zero model calls';

function makePacket(storyId: string, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId,
    headline,
    bodyText: 'the arena authorized this packet for human review only',
    generatedAtMs: 1_000_000,
    avatar: null,
    decidingOver: 'whether the arena-consented story may be released to the shell',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'test fixture packet must verify');
  return packet;
}

function authorizedTranscript(packet: StoryShellPacket): ArenaTranscript {
  let t = emptyArenaTranscript(goalDigest);
  t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
  t = appendArenaStep(t, envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal }));
  t = appendArenaStep(t, envelope('ADVERSARY', 0, t.headDigest, { kind: 'VERDICT', verdict: 'PASS', reasons: [] }));
  t = appendArenaStep(t, envelope('JUDGE', 0, t.headDigest, {
    kind: 'CONSENSUS', outcome: 'AUTHORIZED', packetId: packet.packetId,
  }));
  return t;
}

/** A REAL verdict record produced through the real 12D-258 journaling path. */
function realVerdictRecord(transcript: ArenaTranscript, packet: StoryShellPacket): unknown {
  const dir = mkdtemp();
  const store = new FileCustodyJournalStore(join(dir, 'custody-journal.log'));
  try {
    return journalArenaVerdict({
      registry: new OperatorCustodyRegistry(GENESIS),
      store,
      journalGenesis: GENESIS,
      transcript,
      packet,
      registeredBy: OPERATOR,
      nowMs: NOW_MS,
    });
  } finally {
    rmTree(dir);
  }
}

// Minimal tmpdir helpers (avoid importing test-only fs glue twice).
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
function mkdtemp(): string {
  return mkdtempSync(join(tmpdir(), 'xiv-arena-verdict-view-'));
}
function rmTree(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

const submission = (transcript: ArenaTranscript, packet: StoryShellPacket, verdict: unknown) => ({
  transcript,
  packet,
  verdict,
  registeredBy: OPERATOR,
  nowMs: NOW_MS,
});

const REFUSAL_LEAK_CHECK = (
  vm: { display: { headline: string; bodyText: string; operatorNote: string } },
  ...secrets: string[]
) => {
  for (const secret of secrets) {
    assert.ok(!vm.display.headline.includes(secret), `headline leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.bodyText.includes(secret), `body leaked ${secret.slice(0, 30)}`);
    assert.ok(!vm.display.operatorNote.includes(secret), `operatorNote leaked ${secret.slice(0, 30)}`);
  }
};

test('12d-262: a real verdict submission renders a fully verified view', () => {
  const packet = makePacket('12d-262-verdict-view-happy', 'The arena spoke');
  const transcript = authorizedTranscript(packet);
  const verdict = realVerdictRecord(transcript, packet);
  const vm = buildArenaVerdictViewModel(submission(transcript, packet, verdict));
  assert.equal(vm.kind, 'VERIFIED_ARENA_VERDICT');
  assert.ok(vm.kind === 'VERIFIED_ARENA_VERDICT');
  assert.equal(vm.display.headline, 'Arena-authorized: The arena spoke');
  assert.equal(vm.display.storyId, '12d-262-verdict-view-happy');
  assert.equal(vm.display.purpose, 'xiv-os-arena-consensus');
  assert.equal(vm.display.registeredBy, OPERATOR);
  assert.equal(vm.display.registeredAtMs, NOW_MS);
  assert.equal(vm.display.arenaReceipt, (verdict as { arenaReceipt: string }).arenaReceipt);
  assert.equal(vm.display.arenaReceipt.length, 64);
  assert.ok(vm.display.operatorNote.includes('HUMAN'), 'the note must demand human review');
  assert.ok(Object.isFrozen(vm), 'the view model must be frozen');
});

test('12d-262: a tampered transcript refuses with zero content', () => {
  const packet = makePacket('12d-262-tamper-transcript', 'Tamper target');
  const transcript = authorizedTranscript(packet);
  const verdict = realVerdictRecord(transcript, packet);
  const forged = JSON.parse(JSON.stringify(transcript)) as ArenaTranscript;
  (forged.steps[1]!.payload as { proposal: string }).proposal = 'rewritten after the fact';
  const vm = buildArenaVerdictViewModel(submission(forged, packet, verdict));
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.match(vm.reason, /tampered|mismatch|headDigest/i);
  REFUSAL_LEAK_CHECK(vm, 'Tamper target', 'rewritten after the fact', (verdict as { arenaReceipt: string }).arenaReceipt);
});

test('12d-262: an unauthorized debate refuses even with a consistent record elsewhere', () => {
  const packet = makePacket('12d-262-unauthorized', 'Never authorized');
  let t = emptyArenaTranscript(goalDigest);
  t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
  t = appendArenaStep(t, envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal }));
  t = appendArenaStep(t, envelope('ADVERSARY', 0, t.headDigest, {
    kind: 'VERDICT', verdict: 'FAIL', reasons: ['the proposal leaks the goal into the headline'],
  }));
  const vm = buildArenaVerdictViewModel(submission(t, packet, { fake: true }));
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.match(vm.reason, /consensus was not reached/);
  REFUSAL_LEAK_CHECK(vm, 'Never authorized', '12d-262-unauthorized');
});

test('12d-262: a non-binding packet refuses — the judge bound a different packet', () => {
  const bound = makePacket('12d-262-bound', 'The bound packet');
  const other = makePacket('12d-262-other', 'An unbound packet');
  const transcript = authorizedTranscript(bound);
  const verdict = realVerdictRecord(transcript, bound);
  const vm = buildArenaVerdictViewModel(submission(transcript, other, verdict));
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  REFUSAL_LEAK_CHECK(vm, 'The bound packet', 'An unbound packet');
});

test('12d-262: a tampered verdict record refuses', () => {
  const packet = makePacket('12d-262-record-tamper', 'Record tamper');
  const transcript = authorizedTranscript(packet);
  const verdict = JSON.parse(JSON.stringify(realVerdictRecord(transcript, packet))) as Record<string, unknown>;
  verdict.registeredBy = 'operator:impostor';
  const vm = buildArenaVerdictViewModel(submission(transcript, packet, verdict));
  assert.equal(vm.kind, 'REFUSED');
  assert.ok(vm.kind === 'REFUSED');
  assert.match(vm.reason, /mismatch|tampered/i);
  REFUSAL_LEAK_CHECK(vm, 'Record tamper');
});

test('12d-262: a wrong operator identity or clock refuses the re-derivation', () => {
  const packet = makePacket('12d-262-identity', 'Identity check');
  const transcript = authorizedTranscript(packet);
  const verdict = realVerdictRecord(transcript, packet);
  const bad = buildArenaVerdictViewModel({ ...submission(transcript, packet, verdict), registeredBy: 'operator:other' });
  assert.equal(bad.kind, 'REFUSED');
  const badClock = buildArenaVerdictViewModel({ ...submission(transcript, packet, verdict), nowMs: NOW_MS + 1 });
  assert.equal(badClock.kind, 'REFUSED');
});

test('12d-262: the submission object is exact-keys-gated', () => {
  const packet = makePacket('12d-262-exact-keys', 'Exact keys');
  const transcript = authorizedTranscript(packet);
  const verdict = realVerdictRecord(transcript, packet);
  for (const bad of [
    null, undefined, 42, 'text', [], {},
    { transcript, packet, verdict, registeredBy: OPERATOR },                       // missing nowMs
    { transcript, packet, verdict, registeredBy: OPERATOR, nowMs: NOW_MS, extra: 1 }, // extra key
  ]) {
    const vm = buildArenaVerdictViewModel(bad);
    assert.equal(vm.kind, 'REFUSED', `submission ${String(JSON.stringify(bad) ?? String(bad)).slice(0, 40)} must refuse`);
    assert.ok(vm.kind === 'REFUSED');
  }
  // Reordered keys refuse (order is part of the contract).
  const reordered = { nowMs: NOW_MS, registeredBy: OPERATOR, verdict, packet, transcript };
  assert.equal(buildArenaVerdictViewModel(reordered).kind, 'REFUSED');
});

test('12d-262: bad registeredBy and nowMs gates fire before any content renders', () => {
  const packet = makePacket('12d-262-gates', 'Gate check');
  const transcript = authorizedTranscript(packet);
  const verdict = realVerdictRecord(transcript, packet);
  for (const registeredBy of ['', '  devin', 'bad;injection']) {
    const vm = buildArenaVerdictViewModel({ ...submission(transcript, packet, verdict), registeredBy });
    assert.equal(vm.kind, 'REFUSED');
    REFUSAL_LEAK_CHECK(vm, 'Gate check');
  }
  for (const nowMs of [-1, 1.5, NaN, '1000000' as unknown as number]) {
    const vm = buildArenaVerdictViewModel({ ...submission(transcript, packet, verdict), nowMs });
    assert.equal(vm.kind, 'REFUSED');
    REFUSAL_LEAK_CHECK(vm, 'Gate check');
  }
});

test('12d-262: policy pins — the guardrails stay honest', () => {
  assert.equal(ARENA_VERDICT_VIEW_POLICY.policyVersion, '12d-262-v1');
  assert.equal(ARENA_VERDICT_VIEW_POLICY.domain, 'XIV_OS_ARENA_VERDICT_VIEW');
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.modelCalls, 0);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.remoteCalls, 0);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.noApproveControl, true);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.verifyBeforeRender, true);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.wholeSubmissionOneUnit, true);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.learningPromoted, false);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.billionUsersProven, false);
  assert.equal(ARENA_VERDICT_VIEW_GUARDRAILS.automaticRecovery, false);
});