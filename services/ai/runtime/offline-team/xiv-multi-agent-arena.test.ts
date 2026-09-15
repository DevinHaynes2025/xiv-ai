// 12D-253 — adversarial tests for the 4-Agent Consensus Arena contract.
// Every test drives a REAL refusal or a REAL consensus path — no fabricated
// outcomes. Attack surface: envelope exact-keys, role/payload binding, chain
// linking, turn discipline, the turn-limit closure, the consensus gate, the
// receipt binding, and transcript tamper detection.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import {
  ARENA_GENESIS,
  XIV_MULTI_AGENT_ARENA_GUARDRAILS,
  XIV_MULTI_AGENT_ARENA_POLICY,
  appendArenaStep,
  deriveArenaReceipt,
  deriveDebateDigest,
  deriveGoalDigest,
  emptyArenaTranscript,
  gateConsensus,
  verifyArenaTranscript,
  verifyDebateEnvelope,
  type ArenaRole,
  type ArenaTranscript,
  type DebateEnvelope,
} from './xiv-multi-agent-arena';
import {
  buildStoryShellPacket, verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';

const sha = (v: string): string => createHash('sha256').update(v, 'utf8').digest('hex');

// ---------------------------------------------------------------------------
// Deterministic builders. No randomness anywhere — digests must be stable.
// ---------------------------------------------------------------------------

const GOAL = 'write a local-only fail-closed module that never phones home';
const goalDigest = deriveGoalDigest(GOAL);

function envelope(role: ArenaRole, turn: number, parentDigest: string, payload: unknown): unknown {
  return { envelopeVersion: 1, role, turn, goalDigest, parentDigest, payload };
}

const planSteps = ['read the contract', 'write the module', 'test it locally'];
const proposalA = 'proposal v1: implement the module with exact-key gates';
const proposalB = 'proposal v2: implement with gates AND a hash-chain transcript';
const proposalC = 'proposal v3: implement with gates, hash chain, and no model calls';

const failReasons1 = ['the proposal does not bound the debate turn count'];
const failReasons2 = ['the proposal still does not pin humanDecision to REQUIRED'];
const failReasons3 = ['critical: the proposal still leaks the custody seed into the packet'];

/** Build a fresh transcript through REAL appendArenaStep calls. */
function runDebate(opts: Readonly<{
  genProposals: readonly string[];
  verdicts: ReadonlyArray<'PASS' | 'FAIL'>;
  judgeOutcome?: 'AUTHORIZED' | 'ABORTED';
  packetId?: string | null;
}>): ArenaTranscript {
  let t = emptyArenaTranscript(goalDigest);
  t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, t.headDigest, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));
  opts.genProposals.forEach((proposal, i) => {
    t = appendArenaStep(t, envelope('GENERATOR', i, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal }));
    const verdict = opts.verdicts[i];
    assert.ok(verdict, `verdict missing for turn ${i}`);
    t = appendArenaStep(t, envelope('ADVERSARY', i, t.headDigest, {
      kind: 'VERDICT', verdict, reasons: verdict === 'FAIL' ? failReasons1 : [],
    }));
  });
  if (opts.judgeOutcome !== undefined) {
    t = appendArenaStep(t, envelope('JUDGE', 0, t.headDigest, {
      kind: 'CONSENSUS', outcome: opts.judgeOutcome, packetId: opts.packetId ?? null,
    }));
  }
  return t;
}

/** A real, verified 12D-241 packet (built through the wire contract's gates). */
function makePacket(generatedAtMs: number, headline: string): StoryShellPacket {
  const packet = buildStoryShellPacket({
    storyId: '12d-253-arena-consensus-receipt-test',
    headline,
    bodyText: 'the arena debate authorized this packet for human review only',
    generatedAtMs,
    avatar: null,
    decidingOver: 'whether the arena-consented proposal may be executed locally',
  });
  assert.equal(verifyStoryShellPacket(packet).ok, true, 'test fixture packet must verify');
  return packet;
}

test('12d-253: goal digest is deterministic and payload-sensitive', () => {
  assert.equal(deriveGoalDigest(GOAL), deriveGoalDigest(GOAL));
  assert.notEqual(deriveGoalDigest(GOAL), deriveGoalDigest(`${GOAL} changed`));
  assert.throws(() => deriveGoalDigest(''), /goal is required/);
});

test('12d-253: envelope verification refuses exact-key violations, wrong role/payload pair, and bad fields', () => {
  const good: Record<string, unknown> = {
    envelopeVersion: 1, role: 'ORCHESTRATOR', turn: 0,
    goalDigest, parentDigest: ARENA_GENESIS,
    payload: { kind: 'PLAN_TOPOLOGY', steps: ['a'] },
  };
  assert.equal(verifyDebateEnvelope(good).role, 'ORCHESTRATOR');

  // Extra key smuggled in.
  const extra = { ...good, freeText: 'chat' };
  assert.throws(() => verifyDebateEnvelope(extra), /exactly the keys/);
  // Missing key.
  const missing = { ...good } as Record<string, unknown>;
  delete missing.parentDigest;
  assert.throws(() => verifyDebateEnvelope(missing), /exactly the keys/);
  // Reordered keys.
  const reordered = {
    payload: good.payload, role: good.role, turn: good.turn,
    goalDigest: good.goalDigest, parentDigest: good.parentDigest, envelopeVersion: 1,
  };
  assert.throws(() => verifyDebateEnvelope(reordered), /exactly the keys/);

  // Wrong role for the payload kind — a GENERATOR cannot speak a VERDICT.
  const impostor = envelope('GENERATOR', 0, ARENA_GENESIS, { kind: 'VERDICT', verdict: 'PASS', reasons: [] });
  assert.throws(() => verifyDebateEnvelope(impostor), /payload must be kind 'PROPOSED_SOLUTION'/);

  // A PASS with empty reasons is legal; a FAIL with none is refused.
  const passEmpty = envelope('ADVERSARY', 0, ARENA_GENESIS, { kind: 'VERDICT', verdict: 'PASS', reasons: [] });
  assert.equal(verifyDebateEnvelope(passEmpty).role, 'ADVERSARY');
  const failEmpty = envelope('ADVERSARY', 0, ARENA_GENESIS, { kind: 'VERDICT', verdict: 'FAIL', reasons: [] });
  assert.throws(() => verifyDebateEnvelope(failEmpty), /FAIL verdict must carry at least one reason/);
  // Neither PASS nor FAIL.
  const maybe = envelope('ADVERSARY', 0, ARENA_GENESIS, { kind: 'VERDICT', verdict: 'MAYBE', reasons: ['x'] });
  assert.throws(() => verifyDebateEnvelope(maybe), /exactly 'PASS' or 'FAIL'/);

  // Turn / digest field discipline.
  assert.throws(() => verifyDebateEnvelope({ ...good, turn: -1 }), /safe non-negative integer/);
  assert.throws(() => verifyDebateEnvelope({ ...good, goalDigest: 'zz' }), /hex64/);
  assert.throws(() => verifyDebateEnvelope({ ...good, parentDigest: '' }), /non-empty string/);

  // Role-specific payload gates.
  assert.throws(() => verifyDebateEnvelope(envelope('ORCHESTRATOR', 0, ARENA_GENESIS, { kind: 'PLAN_TOPOLOGY', steps: [] })), /1\.\.16 steps/);
  assert.throws(() => verifyDebateEnvelope(envelope('ORCHESTRATOR', 0, ARENA_GENESIS, { kind: 'PLAN_TOPOLOGY', steps: [1] })), /non-empty strings/);
  assert.throws(() => verifyDebateEnvelope(envelope('GENERATOR', 0, ARENA_GENESIS, { kind: 'PROPOSED_SOLUTION', proposal: '' })), /non-empty string/);
  const authorizedNoPacket = envelope('JUDGE', 0, ARENA_GENESIS, { kind: 'CONSENSUS', outcome: 'AUTHORIZED', packetId: null });
  assert.throws(() => verifyDebateEnvelope(authorizedNoPacket), /AUTHORIZED judge consensus must bind a packetId/);
  const abortedWithPacket = envelope('JUDGE', 0, ARENA_GENESIS, { kind: 'CONSENSUS', outcome: 'ABORTED', packetId: sha('x') });
  assert.equal(verifyDebateEnvelope(abortedWithPacket).role, 'JUDGE');
});

test('12d-253: appendArenaStep enforces role sequence, chain linkage, and turn discipline', () => {
  let t = emptyArenaTranscript(goalDigest);
  // First step must be the ORCHESTRATOR.
  assert.throws(() => appendArenaStep(t, envelope('JUDGE', 0, ARENA_GENESIS, { kind: 'CONSENSUS', outcome: 'ABORTED', packetId: null })), /must come from 'ORCHESTRATOR'/);
  // ORCHESTRATOR turn must be 0.
  assert.throws(() => appendArenaStep(t, envelope('ORCHESTRATOR', 1, ARENA_GENESIS, { kind: 'PLAN_TOPOLOGY', steps: planSteps })), /turn 0/);
  t = appendArenaStep(t, envelope('ORCHESTRATOR', 0, ARENA_GENESIS, { kind: 'PLAN_TOPOLOGY', steps: planSteps }));

  // Broken chain link.
  assert.throws(() => appendArenaStep(t, envelope('GENERATOR', 0, ARENA_GENESIS, { kind: 'PROPOSED_SOLUTION', proposal: proposalA })), /chain is broken/);
  // Foreign goal digest.
  const foreignGoal = envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: proposalA });
  (foreignGoal as { goalDigest: string }).goalDigest = deriveGoalDigest('a different goal entirely');
  assert.throws(() => appendArenaStep(t, foreignGoal), /transcript goalDigest/);
  // Out-of-turn speaker.
  assert.throws(() => appendArenaStep(t, envelope('ADVERSARY', 0, t.headDigest, { kind: 'VERDICT', verdict: 'PASS', reasons: [] })), /must come from 'GENERATOR'/);
  // GENERATOR skipping a turn.
  assert.throws(() => appendArenaStep(t, envelope('GENERATOR', 1, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: proposalA })), /turn 0/);

  t = appendArenaStep(t, envelope('GENERATOR', 0, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: proposalA }));
  // The adversary must share the generator's turn.
  assert.throws(() => appendArenaStep(t, envelope('ADVERSARY', 1, t.headDigest, { kind: 'VERDICT', verdict: 'PASS', reasons: [] })), /share the generator turn/);
});

test('12d-253: TURN LIMIT — a FAIL on the third turn closes the arena; no step, judge, or release follows', () => {
  const exhausted = runDebate({ genProposals: [proposalA, proposalB, proposalC], verdicts: ['FAIL', 'FAIL', 'FAIL'] });
  assert.equal(exhausted.steps.length, 1 /* plan */ + 3 /* turns */ * 2, 'three full debate turns');
  // CLOSED: nothing may be appended — including the Judge.
  assert.throws(() => appendArenaStep(exhausted, envelope('JUDGE', 0, exhausted.headDigest, { kind: 'CONSENSUS', outcome: 'ABORTED', packetId: null })), /CLOSED/);
  assert.throws(() => appendArenaStep(exhausted, envelope('GENERATOR', 3, exhausted.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: 'proposal v4' })), /CLOSED/);
  // Gate: HUMAN_DECISION_REQUIRED, never AUTHORIZED.
  const gate = gateConsensus(exhausted);
  assert.equal(gate.outcome, 'HUMAN_DECISION_REQUIRED');
  assert.equal(gate.reason, 'no judge consensus step has been reached');
});

test('12d-253: the turn-limit enforcer — turn 2 is still open; turn 3 refuses; FAIL on turn 2 closes', () => {
  let t = runDebate({ genProposals: [proposalA, proposalB], verdicts: ['FAIL', 'FAIL'] });
  // After two FAILs the arena is still OPEN — the third (turn 2) debate is legal.
  t = appendArenaStep(t, envelope('GENERATOR', 2, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: proposalC }));
  t = appendArenaStep(t, envelope('ADVERSARY', 2, t.headDigest, { kind: 'VERDICT', verdict: 'FAIL', reasons: failReasons3 }));
  // A FOURTH generator turn refuses — the debate is over, fail closed.
  assert.throws(() => appendArenaStep(t, envelope('GENERATOR', 3, t.headDigest, { kind: 'PROPOSED_SOLUTION', proposal: 'proposal v4' })), /CLOSED/);
});

test('12d-253: CONSENSUS PATH — adversary PASS, judge AUTHORIZED, gate AUTHORIZED with the transcript digest', () => {
  const t = runDebate({
    genProposals: [proposalA],
    verdicts: ['PASS'],
    judgeOutcome: 'AUTHORIZED',
    packetId: sha('packet-1'),
  });
  const gate = gateConsensus(t);
  assert.equal(gate.outcome, 'AUTHORIZED');
  assert.match(gate.reason, /adversary PASS \+ judge authorize/);
  assert.equal(gate.transcriptDigest, deriveDebateDigest(t.steps[t.steps.length - 1]!));
  assert.equal(verifyArenaTranscript(t).headDigest, gate.transcriptDigest);
});

test('12d-253: the judge CANNOT authorize while the adversary stands on FAIL — no unilateral release', () => {
  // Impostor transcript: a judge step injected directly behind a FAIL debate.
  // appendArenaStep refuses the judge after a FAIL-on-final turn.
  const failed = runDebate({ genProposals: [proposalA, proposalB, proposalC], verdicts: ['FAIL', 'FAIL', 'FAIL'] });
  const forgedJudge = envelope('JUDGE', 0, failed.headDigest, { kind: 'CONSENSUS', outcome: 'AUTHORIZED', packetId: sha('packet-1') });
  assert.throws(() => appendArenaStep(failed, forgedJudge), /CLOSED/);

  // A hand-forged transcript (judge appended by hand behind the FAIL) cannot
  // even be verified: the replay refuses the judge step after the closed
  // debate — the gate never evaluates a forged history.
  const forged: ArenaTranscript = {
    ...failed,
    steps: [...failed.steps, verifyDebateEnvelope(forgedJudge)],
    headDigest: deriveDebateDigest(verifyDebateEnvelope(forgedJudge)),
  };
  assert.throws(() => gateConsensus(forged), /CLOSED/);

  // Flipping the last FAIL verdict to PASS mutates the envelope digest — the
  // judge's parentDigest then points at the OLD digest and the chain breaks.
  const steps = failed.steps as unknown as DebateEnvelope[];
  const flipped: ArenaTranscript = {
    ...failed,
    steps: steps.map((s, i) => (i === steps.length - 1
      ? { ...s, payload: { kind: 'VERDICT' as const, verdict: 'PASS' as const, reasons: [] } }
      : s)),
  };
  assert.throws(() => verifyArenaTranscript(flipped), /chain is broken|mismatch|tampered/);
});

test('12d-253: ABORTED judge step after a PASS still gates to HUMAN_DECISION_REQUIRED', () => {
  const aborted = runDebate({
    genProposals: [proposalA],
    verdicts: ['PASS'],
    judgeOutcome: 'ABORTED',
    packetId: null,
  });
  const gate = gateConsensus(aborted);
  assert.equal(gate.outcome, 'HUMAN_DECISION_REQUIRED');
  assert.match(gate.reason, /judge aborted/);
  assert.equal(verifyArenaTranscript(aborted).ok, true);
});

test('12d-253: immutable memory — any tamper (swap, mutate, drop, append) breaks verification', () => {
  const t = runDebate({
    genProposals: [proposalA],
    verdicts: ['PASS'],
    judgeOutcome: 'AUTHORIZED',
    packetId: sha('packet-1'),
  });
  const steps = t.steps as unknown as DebateEnvelope[];

  // 1. Mutate an envelope in place (adversary verdict PASS→FAIL with a reason).
  const mutated: ArenaTranscript = {
    ...t,
    steps: steps.map((s) => (s.role === 'ADVERSARY' && s.payload.kind === 'VERDICT'
      ? { ...s, payload: { ...s.payload, verdict: 'FAIL' as const, reasons: ['mutated by the test adversary'] } }
      : s)),
  };
  assert.throws(() => verifyArenaTranscript(mutated), /tampered|mismatch|chain is broken|must come from/);

  // 2. Drop the middle step (the adversary) — role sequence + chain break.
  const dropped: ArenaTranscript = { ...t, steps: steps.filter((s) => s.role !== 'ADVERSARY') };
  assert.throws(() => verifyArenaTranscript(dropped), /chain is broken|must come from/);

  // 3. Truncate the judge step (head recomputed — this transcript is
  // internally consistent, it just never reached a consensus).
  const truncatedSteps = steps.slice(0, -1);
  const truncated: ArenaTranscript = {
    ...t,
    steps: truncatedSteps,
    headDigest: deriveDebateDigest(truncatedSteps[truncatedSteps.length - 1]!),
  };
  const gate = gateConsensus(truncated);
  assert.equal(gate.outcome, 'HUMAN_DECISION_REQUIRED');
  assert.match(gate.reason, /no judge consensus step/);

  // 4. Forge the headDigest without touching steps.
  assert.throws(() => verifyArenaTranscript({ ...t, headDigest: sha('forged-head') }), /tampered/);

  // 5. Wrong goalDigest on the transcript itself.
  assert.throws(() => verifyArenaTranscript({ ...t, goalDigest: deriveGoalDigest('other goal') }), /goalDigest/);
});

test('12d-253: empty transcript gates to HUMAN_DECISION_REQUIRED and refuses foreign goal digests', () => {
  const empty = emptyArenaTranscript(goalDigest);
  assert.throws(() => emptyArenaTranscript('not-hex'), /hex64 goalDigest/);
  const gate = gateConsensus(empty);
  assert.equal(gate.outcome, 'HUMAN_DECISION_REQUIRED');
  assert.match(gate.reason, /no judge consensus step/);
});

test('12d-253: receipt — binds a VERIFIED packet to an AUTHORIZED transcript, deterministic', () => {
  const packet = makePacket(1_000_000, 'arena consent reached for the local module');
  const t = runDebate({
    genProposals: [proposalA],
    verdicts: ['PASS'],
    judgeOutcome: 'AUTHORIZED',
    packetId: packet.packetId,
  });
  const r1 = deriveArenaReceipt({ transcript: t, packet });
  const r2 = deriveArenaReceipt({ transcript: t, packet });
  assert.equal(r1.receipt, r2.receipt);
  assert.equal(r1.transcriptDigest, gateConsensus(t).transcriptDigest);
  assert.equal(r1.packetId, packet.packetId);

  // Determinism across a full rebuild: same inputs → same receipt.
  const t2 = runDebate({
    genProposals: [proposalA],
    verdicts: ['PASS'],
    judgeOutcome: 'AUTHORIZED',
    packetId: packet.packetId,
  });
  assert.equal(deriveArenaReceipt({ transcript: t2, packet }).receipt, r1.receipt);

  // Receipt options are exact-keyed and ordered.
  assert.throws(() => deriveArenaReceipt({ packet, transcript: t } as unknown as Parameters<typeof deriveArenaReceipt>[0]), /exactly the keys/);

  // A different packet (different content) binds a different receipt — via its
  // own properly bound debate.
  const packetB = makePacket(1_000_000, 'arena consent reached for the second module');
  const tB = runDebate({
    genProposals: [proposalB],
    verdicts: ['PASS'],
    judgeOutcome: 'AUTHORIZED',
    packetId: packetB.packetId,
  });
  assert.notEqual(deriveArenaReceipt({ transcript: tB, packet: packetB }).receipt, r1.receipt);

  // The judge step must bind THIS packetId.
  const packetC = makePacket(1_000_000, 'arena consent reached for the third module');
  assert.throws(() => deriveArenaReceipt({ transcript: t, packet: packetC }), /does not bind this packetId/);
});

test('12d-253: receipt REFUSES an exhausted debate, an aborted judge, and a tampered packet', () => {
  const packet = makePacket(1_000_000, 'arena consent refused on the exhausted debate');
  const exhausted = runDebate({ genProposals: [proposalA, proposalB, proposalC], verdicts: ['FAIL', 'FAIL', 'FAIL'] });
  assert.throws(() => deriveArenaReceipt({ transcript: exhausted, packet }), /consensus was not reached.*no judge consensus/);

  const aborted = runDebate({
    genProposals: [proposalA], verdicts: ['PASS'], judgeOutcome: 'ABORTED', packetId: null,
  });
  assert.throws(() => deriveArenaReceipt({ transcript: aborted, packet }), /judge aborted/);

  // Tampered packet: the wire verifier's digest re-derivation refuses before
  // anything is bound.
  const okPacket = makePacket(1_000_000, 'arena consent reached for the tamper test');
  const t = runDebate({
    genProposals: [proposalA], verdicts: ['PASS'], judgeOutcome: 'AUTHORIZED', packetId: okPacket.packetId,
  });
  const tampered = { ...okPacket, headline: 'tampered headline in flight' } as unknown as StoryShellPacket;
  assert.throws(() => deriveArenaReceipt({ transcript: t, packet: tampered }), /digest|shape|fail closed/);
});

test('12d-253: policy and guardrails carry the honest flags verbatim', () => {
  assert.equal(XIV_MULTI_AGENT_ARENA_POLICY.maxDebateTurns, 3);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.zeroModelCalls, true);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.learningPromoted, false);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.billionUsersProven, false);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.authorizedMeansReadyForHumanReview, true);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.generatorCannotApproveOwnWork, true);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.orchestratorCannotWriteCode, true);
  assert.equal(XIV_MULTI_AGENT_ARENA_GUARDRAILS.onlyJudgeReleasesThePacket, true);
  assert.equal(Object.isFrozen(XIV_MULTI_AGENT_ARENA_POLICY), true);
  assert.equal(Object.isFrozen(XIV_MULTI_AGENT_ARENA_GUARDRAILS), true);
});