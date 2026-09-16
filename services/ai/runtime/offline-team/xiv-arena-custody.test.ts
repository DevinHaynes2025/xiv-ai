// 12D-258 — adversarial tests for the Arena↔Custody wiring. Every test
// drives a REAL refusal or a REAL journaling path against the real
// 12D-233 registry + 12D-236 journal. The central property under attack:
// **nothing reaches the journal unless the whole arena gate + receipt
// binding + registry discipline hold — and a refused op journals nothing.**

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  appendArenaStep,
  deriveArenaReceipt,
  deriveGoalDigest,
  emptyArenaTranscript,
  gateConsensus,
  type ArenaRole,
  type ArenaTranscript,
  type DebateEnvelope,
} from './xiv-multi-agent-arena';
import { buildStoryShellPacket, verifyStoryShellPacket, type StoryShellPacket } from './xiv-os-wire-contract';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import {
  FileCustodyJournalStore,
  replayCustodyJournal,
} from './operator-custody-journal';
import {
  ARENA_CUSTODY_GUARDRAILS,
  ARENA_CUSTODY_POLICY,
  journalArenaVerdict,
  verifyArenaVerdictRecord,
} from './xiv-arena-custody';

// ---------------------------------------------------------------------------
// Deterministic builders — the same real-path discipline as 12D-253's tests.
// ---------------------------------------------------------------------------

const GOAL = 'authorize one story-shell packet into the operator custody chain';
const goalDigest = deriveGoalDigest(GOAL);
const GENESIS = '12d-258-journal-genesis';
const OPERATOR = 'operator:devin';
const NOW_MS = 1_000_000;

function envelope(role: ArenaRole, turn: number, parentDigest: string, payload: unknown): unknown {
  return { envelopeVersion: 1, role, turn, goalDigest, parentDigest, payload };
}

const planSteps = ['draft the packet', 'hold the adversarial round', 'authorize for human review'];
const proposal = 'proposal: exact-key gates plus a hash-chained transcript, zero model calls';

function makePacket(generatedAtMs: number, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId: '12d-258-arena-custody-test',
    headline,
    bodyText: 'the arena authorized this packet for human review only',
    generatedAtMs,
    avatar: null,
    decidingOver: 'whether the arena-consented story may be released to the shell',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'test fixture packet must verify');
  return packet;
}

/** A REAL authorized transcript, built through real appendArenaStep calls. */
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

/** A real registry + a real local-file journal store in a fresh tmpdir. */
function freshStack(): { registry: OperatorCustodyRegistry; store: FileCustodyJournalStore; path: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-arena-custody-'));
  const path = join(dir, 'custody-journal.log');
  return {
    registry: new OperatorCustodyRegistry(GENESIS),
    store: new FileCustodyJournalStore(path),
    path,
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}

const journalOpts = (stack: { registry: OperatorCustodyRegistry; store: FileCustodyJournalStore }, transcript: ArenaTranscript, packet: StoryShellPacket) => ({
  registry: stack.registry,
  store: stack.store,
  journalGenesis: GENESIS,
  transcript,
  packet,
  registeredBy: OPERATOR,
  nowMs: NOW_MS,
});

// ---------------------------------------------------------------------------

test('12d-258: happy path journals exactly one register op and the record re-verifies', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Arena-authorized story');
    const transcript = authorizedTranscript(packet);
    const record = journalArenaVerdict({ ...journalOpts(stack, transcript, packet) });

    // The record carries the arena receipt — byte-equal to the direct derivation.
    const direct = deriveArenaReceipt({ transcript, packet });
    assert.equal(record.arenaReceipt, direct.receipt);
    assert.equal(record.transcriptDigest, direct.transcriptDigest);
    assert.equal(record.packetId, packet.packetId);
    assert.equal(record.purpose, 'xiv-os-arena-consensus');
    assert.equal(record.registeredBy, OPERATOR);
    assert.equal(record.registeredAtMs, NOW_MS);
    assert.ok(Object.isFrozen(record), 'the verdict record must be frozen');

    // The journal holds exactly one register line carrying the receipt.
    const lines = stack.store.load();
    assert.ok(lines && lines.length === 1, 'exactly one journal line expected');
    assert.ok(lines[0]!.includes('"op":"register"'), 'the op must be a register');
    assert.ok(lines[0]!.includes(record.arenaReceipt), 'the line must carry the arena receipt');
    assert.ok(lines[0]!.includes(ARENA_CUSTODY_POLICY.purpose), 'the line must carry the fixed purpose');

    // Replay cross-check: the journal alone rebuilds a registry that holds
    // this receipt under the fixed purpose (provable via a real authenticate).
    const replay = replayCustodyJournal(stack.store, GENESIS);
    assert.equal(replay.ops, 1);
    assert.doesNotThrow(() => replay.registry.authenticate({
      receiptSha256: record.arenaReceipt,
      purpose: ARENA_CUSTODY_POLICY.purpose,
      nowMs: NOW_MS + 1,
    }), 'the replayed ledger must hold the arena receipt');

    // The record re-derives from its own transcript+packet.
    assert.deepEqual(verifyArenaVerdictRecord(record, { transcript, packet, registeredBy: OPERATOR, nowMs: NOW_MS }), { ok: true });
  } finally {
    stack.cleanup();
  }
});

test('12d-258: an exhausted debate refuses — no judge consensus, nothing journaled', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Never authorized');
    let t = emptyArenaTranscript(goalDigest);
    t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
    t = appendArenaStep(t, envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal }));
    t = appendArenaStep(t, envelope('ADVERSARY', 0, t.headDigest, {
      kind: 'VERDICT', verdict: 'FAIL', reasons: ['the proposal leaks the goal into the headline'],
    }));
    assert.equal(gateConsensus(t).outcome, 'HUMAN_DECISION_REQUIRED');
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, t, packet) }),
      /consensus was not reached/,
    );
    assert.equal(stack.store.load(), null, 'a refused verdict must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: an aborted judge refuses — nothing journaled', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Aborted run');
    let t = emptyArenaTranscript(goalDigest);
    t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
    t = appendArenaStep(t, envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal }));
    t = appendArenaStep(t, envelope('ADVERSARY', 0, t.headDigest, { kind: 'VERDICT', verdict: 'PASS', reasons: [] }));
    t = appendArenaStep(t, envelope('JUDGE', 0, t.headDigest, {
      kind: 'CONSENSUS', outcome: 'ABORTED', packetId: null,
    }));
    assert.equal(gateConsensus(t).outcome, 'HUMAN_DECISION_REQUIRED');
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, t, packet) }),
      /consensus was not reached/,
    );
    assert.equal(stack.store.load(), null, 'a refused verdict must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: a tampered transcript refuses before anything is registered or journaled', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Tamper target');
    const transcript = authorizedTranscript(packet);
    // Forge the judge's packetId into binding a DIFFERENT packet without
    // recomputing anything — the chain replay must refuse.
    const forged = JSON.parse(JSON.stringify(transcript)) as ArenaTranscript;
    (forged.steps[3]!.payload as { packetId: string }).packetId = 'a'.repeat(64);
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, forged, packet) }),
      /tampered|headDigest mismatch|does not bind/i,
    );
    assert.equal(stack.store.load(), null, 'a refused verdict must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: a non-binding packet refuses — the judge bound a different packetId', () => {
  const stack = freshStack();
  try {
    const bound = makePacket(NOW_MS, 'The bound packet');
    const other = makePacket(NOW_MS + 1, 'An unbound packet');
    const transcript = authorizedTranscript(bound);
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, transcript, other) }),
      /does not bind/,
    );
    assert.equal(stack.store.load(), null, 'a refused verdict must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: a tampered packet refuses — the wire verifier fires before the registry', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Packet to tamper with');
    const transcript = authorizedTranscript(packet);
    const tampered = JSON.parse(JSON.stringify(packet)) as { headline: string };
    tampered.headline = 'Edited after authorization';
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, transcript, tampered as unknown as StoryShellPacket) }),
      /digest mismatch|tamper/i,
    );
    assert.equal(stack.store.load(), null, 'a refused verdict must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: double-journaling the same verdict refuses and leaves the store unchanged', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Once only');
    const transcript = authorizedTranscript(packet);
    const first = journalArenaVerdict({ ...journalOpts(stack, transcript, packet) });
    const before = stack.store.load();
    assert.ok(before && before.length === 1);
    assert.throws(
      () => journalArenaVerdict({ ...journalOpts(stack, transcript, packet) }),
      /already been registered|exactly once|reuse/i,
    );
    assert.deepEqual(stack.store.load(), before, 'the journal must not gain a line on refusal');
    assert.equal(first.arenaReceipt.length, 64);
  } finally {
    stack.cleanup();
  }
});

test('12d-258: registeredBy is gated by the operator-name discipline', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Identity gate');
    const transcript = authorizedTranscript(packet);
    for (const bad of ['', '  devin', 'operator name with spaces', 'x'.repeat(129), 'bad;injection']) {
      assert.throws(
        () => journalArenaVerdict({ ...journalOpts(stack, transcript, packet), registeredBy: bad }),
        /registeredBy/,
      );
    }
    assert.equal(stack.store.load(), null, 'a refused registeredBy must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: nowMs must be a safe non-negative integer', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Clock gate');
    const transcript = authorizedTranscript(packet);
    for (const bad of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, '1000000' as unknown as number]) {
      assert.throws(
        () => journalArenaVerdict({ ...journalOpts(stack, transcript, packet), nowMs: bad }),
        /nowMs/,
      );
    }
    assert.equal(stack.store.load(), null, 'a refused nowMs must journal nothing');
  } finally {
    stack.cleanup();
  }
});

test('12d-258: the options object is exact-keys-gated (extra, missing, reordered)', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Exact keys');
    const transcript = authorizedTranscript(packet);
    const base = journalOpts(stack, transcript, packet) as Record<string, unknown>;

    const extra = { ...base, freeText: 'smuggled' };
    assert.throws(() => journalArenaVerdict(extra as never), /exactly the keys/);
    const missing = { ...base } as Record<string, unknown>;
    delete missing.journalGenesis;
    assert.throws(() => journalArenaVerdict(missing as never), /exactly the keys/);
    const reordered: Record<string, unknown> = {};
    for (const k of ['packet', 'transcript', 'registeredBy', 'nowMs', 'journalGenesis', 'store', 'registry']) {
      reordered[k] = base[k];
    }
    assert.throws(() => journalArenaVerdict(reordered as never), /in order/);
    // A plain object pretending to be the registry refuses.
    const fakeRegistry = { ...base, registry: { register: () => undefined } } as Record<string, unknown>;
    assert.throws(() => journalArenaVerdict(fakeRegistry as never), /live 12D-233/);
    // A short genesis refuses.
    const shortGenesis = { ...base, journalGenesis: 'short' } as Record<string, unknown>;
    assert.throws(() => journalArenaVerdict(shortGenesis as never), /at least 8 chars/);
  } finally {
    stack.cleanup();
  }
});

test('12d-258: a tampered verdict record refuses re-verification (field, key, and foreign-transcript cases)', () => {
  const stack = freshStack();
  try {
    const packet = makePacket(NOW_MS, 'Record tamper');
    const transcript = authorizedTranscript(packet);
    const record = journalArenaVerdict({ ...journalOpts(stack, transcript, packet) }) as Record<string, unknown>;
    const sources = { transcript, packet, registeredBy: OPERATOR, nowMs: NOW_MS };

    // Flip any single field — the re-derivation must mismatch.
    for (const field of ['transcriptDigest', 'packetId', 'arenaReceipt', 'registeredBy']) {
      const edited = { ...record, [field]: field === 'registeredBy' ? 'operator:other' : 'b'.repeat(64) };
      assert.throws(
        () => verifyArenaVerdictRecord(edited, sources),
        /mismatch|tampered|unknown arena custody policy/i,
      );
    }
    // Extra key.
    const extra = { ...record, smuggled: true };
    assert.throws(() => verifyArenaVerdictRecord(extra, sources), /exactly the keys/);
    // Unknown policy version.
    const version = { ...record, policyVersion: '12d-999-v1' };
    assert.throws(() => verifyArenaVerdictRecord(version, sources), /policy version/);
    // A valid record against a FOREIGN (though itself valid) transcript —
    // the record binds its own transcript, not just "a" transcript.
    const otherPacket = makePacket(NOW_MS + 2, 'A different story');
    const otherTranscript = authorizedTranscript(otherPacket);
    assert.throws(
      () => verifyArenaVerdictRecord(record, { transcript: otherTranscript, packet: otherPacket, registeredBy: OPERATOR, nowMs: NOW_MS }),
      /mismatch/,
    );
  } finally {
    stack.cleanup();
  }
});

test('12d-258: policy pins — fixed purpose is registry-legal, guardrails stay honest', () => {
  assert.equal(ARENA_CUSTODY_POLICY.policyVersion, '12d-258-v1');
  assert.equal(ARENA_CUSTODY_POLICY.domain, 'XIV_OS_ARENA_CUSTODY');
  assert.equal(ARENA_CUSTODY_POLICY.purpose, 'xiv-os-arena-consensus');
  assert.ok(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(ARENA_CUSTODY_POLICY.purpose), 'the fixed purpose must satisfy the 12D-236 PURPOSE_RE');
  assert.equal(ARENA_CUSTODY_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(ARENA_CUSTODY_GUARDRAILS.modelCalls, 0);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.remoteCalls, 0);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.registerOnlyNeverConsumes, true);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.registryFirstNothingJournaledOnRefusal, true);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.learningPromoted, false);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.billionUsersProven, false);
  assert.equal(ARENA_CUSTODY_GUARDRAILS.automaticRecovery, false);
});