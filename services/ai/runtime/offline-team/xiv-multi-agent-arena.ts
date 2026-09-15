// 12D-253 — XIV Multi-Agent Consensus Arena: the fail-closed CONTRACT layer
// for a 4-agent debate pipeline (Orchestrator → Generator → Adversary →
// Judge). No single agent has unilateral authority: a payload is released
// ONLY when the Adversary has explicitly stamped PASS and the Judge has
// explicitly authorized — and only the Judge can bind a 12D-241
// StoryShellPacket to the debate that authorized it.
//
// THIS MODULE WIRES NO MODEL. It defines the exact-key JSON envelopes the
// agents will pass, the turn-limit enforcer, and the consensus gate. The
// envelopes are authored by whoever operates the arena (today: the operator;
// a future story may feed local model weights through per-use authorization).
// Every honest flag reflects that: modelCalls 0, remoteCalls 0.
//
// The strict debate rules, structurally enforced:
//   * ZERO FREE-TEXT CHAT: agents communicate ONLY through exact-key JSON
//     envelopes. Any extra key, wrong role/payload pair, or malformed shape
//     refuses the step.
//   * TURN LIMITS: the Generator/Adversary debate runs at most
//     maxDebateTurns (3). A FAIL verdict on the last allowed turn CLOSES the
//     arena — no further steps, gate = HUMAN DECISION REQUIRED, nothing
//     released. An endless debate loop is structurally impossible.
//   * IMMUTABLE MEMORY: the transcript is an append-only hash chain — every
//     envelope carries parentDigest = the digest of the previous envelope
//     (or the arena genesis). Any mutation breaks the chain and refuses
//     verification. The final receipt binds the released packet to the
//     transcript digest, proving exactly how the conclusion was reached.
//   * ROLE SEQUENCE: ORCHESTRATOR first (plan topology only — no code, no
//     commands), then strict (GENERATOR → ADVERSARY) alternation per turn,
//     then JUDGE last. After an ADVERSARY PASS only the JUDGE may speak;
//     after an ADVERSARY FAIL before the last turn only the GENERATOR may
//     speak (turn+1).
//   * humanDecision: 'REQUIRED', learningPromoted: false, remoteCalls: 0,
//     modelCalls: 0, billionUsersProven: false on every surface.
//
// Disclosed residuals:
//   * A debate between impostor agents authorizes nothing real — the arena
//     authenticates the STRUCTURE of the consensus, not the identity or the
//     honesty of whichever agents authored the envelopes (the 12D-233
//     residual carries over: possession of the arena is not truth).
//   * An AUTHORIZED gate is authorization FOR HUMAN REVIEW, not an approval:
//     the 12D-241 packet the Judge releases still renders HUMAN DECISION
//     REQUIRED with no approve control. The arena never decides.
//   * The Judge's packetId binding is a digest binding — the packet itself
//     must be held and verified by the operator (verifyStoryShellPacket).

import { createHash } from 'crypto';
import {
  verifyStoryShellPacket, type StoryShellPacket,
} from './xiv-os-wire-contract';

export const XIV_MULTI_AGENT_ARENA_POLICY = Object.freeze({
  policyVersion: '12d-253-v1',
  domain: 'XIV_MULTI_AGENT_ARENA',
  envelopeVersion: 1 as const,
  maxDebateTurns: 3,
  maxPlanSteps: 16,
  roles: ['ORCHESTRATOR', 'GENERATOR', 'ADVERSARY', 'JUDGE'] as const,
});

export const XIV_MULTI_AGENT_ARENA_GUARDRAILS = Object.freeze({
  noUnilateralAuthority: true, // adversary PASS + judge authorize, or nothing
  zeroFreeTextChat: true, // exact-key JSON envelopes only
  turnLimitEnforced: true, // max 3 generator/adversary turns, then closed
  transcriptIsAppendOnlyHashChain: true,
  orchestratorCannotWriteCode: true,
  generatorCannotApproveOwnWork: true,
  adversaryMustExplicitlyStampVerdict: true,
  onlyJudgeReleasesThePacket: true,
  authorizedMeansReadyForHumanReview: true, // never an approval
  abortsFailsClosedToHumanDecision: true,
  secretsNeverEnter: true,
  zeroModelCalls: true, // this contract wires NO model — future story
  zeroRemoteCalls: true,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false, // a broken chain refuses; a human decides
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type ArenaRole = 'ORCHESTRATOR' | 'GENERATOR' | 'ADVERSARY' | 'JUDGE';

export type ArenaPayload =
  | Readonly<{ kind: 'PLAN_TOPOLOGY'; steps: readonly string[] }>
  | Readonly<{ kind: 'PROPOSED_SOLUTION'; proposal: string }>
  | Readonly<{ kind: 'VERDICT'; verdict: 'PASS' | 'FAIL'; reasons: readonly string[] }>
  | Readonly<{ kind: 'CONSENSUS'; outcome: 'AUTHORIZED' | 'ABORTED'; packetId: string | null }>;

export interface DebateEnvelope {
  readonly envelopeVersion: 1;
  readonly role: ArenaRole;
  readonly turn: number;
  /** sha256 over the canonical goal (deriveGoalDigest) — identical on every envelope. */
  readonly goalDigest: string;
  /** Digest of the previous envelope, or ARENA_GENESIS for the first step. */
  readonly parentDigest: string;
  readonly payload: ArenaPayload;
}

export interface ArenaTranscript {
  readonly arenaVersion: 1;
  readonly policyVersion: string;
  readonly goalDigest: string;
  readonly steps: ReadonlyArray<DebateEnvelope>;
  /** Digest of the last envelope, or ARENA_GENESIS on an empty transcript. */
  readonly headDigest: string;
}

export const ARENA_GENESIS = 'ARENA_GENESIS';

const ENVELOPE_KEYS = ['envelopeVersion', 'role', 'turn', 'goalDigest', 'parentDigest', 'payload'] as const;
const PAYLOAD_KEYS_BY_KIND: Record<string, readonly string[]> = {
  PLAN_TOPOLOGY: ['kind', 'steps'],
  PROPOSED_SOLUTION: ['kind', 'proposal'],
  VERDICT: ['kind', 'verdict', 'reasons'],
  CONSENSUS: ['kind', 'outcome', 'packetId'],
};
const PAYLOAD_KIND_BY_ROLE: Record<ArenaRole, ArenaPayload['kind']> = {
  ORCHESTRATOR: 'PLAN_TOPOLOGY',
  GENERATOR: 'PROPOSED_SOLUTION',
  ADVERSARY: 'VERDICT',
  JUDGE: 'CONSENSUS',
};
const HEX64_RE = /^[0-9a-f]{64}$/;

const sha256 = (v: string): string => createHash('sha256').update(v, 'utf8').digest('hex');

/** The goal digest: sha256 over the canonical goal. Deterministic per goal. */
export function deriveGoalDigest(goal: string): string {
  if (typeof goal !== 'string' || goal.length === 0)
    throw new Error('an arena goal is required; fail closed');
  return sha256(JSON.stringify({ domain: XIV_MULTI_AGENT_ARENA_POLICY.domain, goalVersion: 1, goal }));
}

/** The envelope digest: sha256 over the canonical envelope (full payload). */
export function deriveDebateDigest(envelope: Readonly<DebateEnvelope>): string {
  return sha256(JSON.stringify({
    domain: XIV_MULTI_AGENT_ARENA_POLICY.domain,
    envelopeVersion: envelope.envelopeVersion,
    role: envelope.role,
    turn: envelope.turn,
    goalDigest: envelope.goalDigest,
    parentDigest: envelope.parentDigest,
    payload: envelope.payload,
  }));
}

/** Shape-gate ONE envelope: exact keys, role/payload binding, field types. */
export function verifyDebateEnvelope(envelope: unknown): Readonly<DebateEnvelope> {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope))
    throw new Error('a debate envelope is required; fail closed');
  const e = envelope as unknown as Record<string, unknown>;
  const keys = Object.keys(e);
  if (keys.length !== ENVELOPE_KEYS.length || !ENVELOPE_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a debate envelope must have exactly the keys [${ENVELOPE_KEYS.join(', ')}] in order; fail closed`);
  if (e.envelopeVersion !== 1)
    throw new Error('debate envelope version must be 1; fail closed');
  const role = e.role;
  if (typeof role !== 'string' || !(XIV_MULTI_AGENT_ARENA_POLICY.roles as readonly string[]).includes(role))
    throw new Error(`a debate envelope role must be one of ${XIV_MULTI_AGENT_ARENA_POLICY.roles.join(' | ')}; fail closed`);
  if (typeof e.turn !== 'number' || !Number.isSafeInteger(e.turn) || e.turn < 0)
    throw new Error('a debate envelope turn must be a safe non-negative integer; fail closed');
  if (typeof e.goalDigest !== 'string' || !HEX64_RE.test(e.goalDigest))
    throw new Error('a debate envelope goalDigest must be lowercase hex64; fail closed');
  if (typeof e.parentDigest !== 'string' || e.parentDigest.length === 0)
    throw new Error('a debate envelope parentDigest must be a non-empty string; fail closed');
  const payload = e.payload;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload))
    throw new Error('a debate envelope carries a payload object; fail closed');
  const p = payload as unknown as Record<string, unknown>;
  const expectedKind = PAYLOAD_KIND_BY_ROLE[role as ArenaRole];
  if (p.kind !== expectedKind)
    throw new Error(`a ${role} envelope payload must be kind '${expectedKind}'; fail closed`);
  const expectedKeys = PAYLOAD_KEYS_BY_KIND[expectedKind];
  const payloadKeys = Object.keys(p);
  if (payloadKeys.length !== expectedKeys.length || !expectedKeys.every((k, i) => payloadKeys[i] === k))
    throw new Error(`a ${expectedKind} payload must have exactly the keys [${expectedKeys.join(', ')}] in order; fail closed`);
  if (expectedKind === 'PLAN_TOPOLOGY') {
    if (!Array.isArray(p.steps) || p.steps.length === 0 || p.steps.length > XIV_MULTI_AGENT_ARENA_POLICY.maxPlanSteps)
      throw new Error(`an orchestrator plan carries 1..${XIV_MULTI_AGENT_ARENA_POLICY.maxPlanSteps} steps; fail closed`);
    if (!p.steps.every((s) => typeof s === 'string' && s.length > 0))
      throw new Error('orchestrator plan steps must be non-empty strings; fail closed');
  }
  if (expectedKind === 'PROPOSED_SOLUTION') {
    if (typeof p.proposal !== 'string' || p.proposal.length === 0)
      throw new Error('a generator proposal must be a non-empty string; fail closed');
  }
  if (expectedKind === 'VERDICT') {
    if (p.verdict !== 'PASS' && p.verdict !== 'FAIL')
      throw new Error("an adversary verdict must be exactly 'PASS' or 'FAIL'; fail closed");
    if (!Array.isArray(p.reasons))
      throw new Error('an adversary verdict carries reasons; fail closed');
    if (!p.reasons.every((r) => typeof r === 'string'))
      throw new Error('adversary reasons must be strings; fail closed');
    if (p.verdict === 'FAIL' && p.reasons.length === 0)
      throw new Error('a FAIL verdict must carry at least one reason; fail closed');
  }
  if (expectedKind === 'CONSENSUS') {
    if (p.outcome !== 'AUTHORIZED' && p.outcome !== 'ABORTED')
      throw new Error("a judge consensus outcome must be exactly 'AUTHORIZED' or 'ABORTED'; fail closed");
    if (p.packetId !== null && (typeof p.packetId !== 'string' || !HEX64_RE.test(p.packetId)))
      throw new Error('a judge consensus packetId must be null or lowercase hex64; fail closed');
    if (p.outcome === 'AUTHORIZED' && (typeof p.packetId !== 'string' || !HEX64_RE.test(p.packetId)))
      throw new Error('an AUTHORIZED judge consensus must bind a packetId; fail closed');
  }
  return Object.freeze(envelope as unknown as DebateEnvelope);
}

/**
 * The allowed next role after a step, or null when the transcript is CLOSED.
 * After PASS only the Judge; after FAIL before the last turn only the
 * Generator (turn+1); after FAIL on the last turn the arena is CLOSED.
 */
function allowedNextRole(steps: ReadonlyArray<DebateEnvelope>): ArenaRole | null {
  if (steps.length === 0) return 'ORCHESTRATOR';
  const last = steps[steps.length - 1]!;
  const lastTurn = XIV_MULTI_AGENT_ARENA_POLICY.maxDebateTurns - 1;
  switch (last.role) {
    case 'ORCHESTRATOR': return 'GENERATOR';
    case 'GENERATOR': return 'ADVERSARY';
    case 'ADVERSARY': {
      if (last.payload.kind !== 'VERDICT') return null; // shape-gated upstream
      if (last.payload.verdict === 'PASS') return 'JUDGE';
      if (last.payload.verdict === 'FAIL' && last.turn < lastTurn) return 'GENERATOR';
      return null; // FAIL on the last allowed turn — the arena is CLOSED
    }
    case 'JUDGE': return null; // one judge step closes the arena
  }
}

/**
 * Append ONE shape-gated envelope to the append-only transcript. The chain
 * must link (parentDigest = head), the role must be the allowed next role,
 * and the turn must follow the debate rules. Returns a NEW frozen
 * transcript; the original is never mutated.
 */
export function appendArenaStep(
  transcript: Readonly<ArenaTranscript>,
  envelope: unknown,
): Readonly<ArenaTranscript> {
  if (!transcript || typeof transcript !== 'object' || Array.isArray(transcript))
    throw new Error('an arena transcript is required; fail closed');
  if (transcript.arenaVersion !== 1 || transcript.policyVersion !== XIV_MULTI_AGENT_ARENA_POLICY.policyVersion)
    throw new Error('an arena transcript must carry the current arena policy; fail closed');
  const e = verifyDebateEnvelope(envelope);
  const next = allowedNextRole(transcript.steps);
  if (next === null)
    throw new Error('the arena transcript is CLOSED — no further steps may be appended; fail closed');
  if (e.role !== next)
    throw new Error(`the next arena step must come from '${next}'; got '${e.role}'; fail closed`);
  if (e.goalDigest !== transcript.goalDigest)
    throw new Error('a debate envelope must carry the transcript goalDigest; fail closed');
  if (e.parentDigest !== transcript.headDigest)
    throw new Error('a debate envelope must link to the transcript headDigest — the chain is broken; fail closed');
  // Turn discipline.
  if (next === 'ORCHESTRATOR') {
    if (e.turn !== 0) throw new Error('the orchestrator step is turn 0; fail closed');
  } else if (next === 'GENERATOR') {
    const last = transcript.steps[transcript.steps.length - 1];
    const expectedTurn = last && last.role === 'ADVERSARY' ? last.turn + 1 : 0;
    if (e.turn !== expectedTurn)
      throw new Error(`the generator step must be turn ${expectedTurn}; fail closed`);
    if (e.turn >= XIV_MULTI_AGENT_ARENA_POLICY.maxDebateTurns)
      throw new Error('the debate turn limit is reached; fail closed');
  } else if (next === 'ADVERSARY') {
    const last = transcript.steps[transcript.steps.length - 1]!;
    if (e.turn !== last.turn)
      throw new Error('the adversary step must share the generator turn; fail closed');
  } else if (next === 'JUDGE') {
    if (e.turn !== 0) throw new Error('the judge step is turn 0; fail closed');
  }
  const digest = deriveDebateDigest(e);
  return Object.freeze({
    arenaVersion: 1 as const,
    policyVersion: XIV_MULTI_AGENT_ARENA_POLICY.policyVersion,
    goalDigest: transcript.goalDigest,
    steps: Object.freeze([...transcript.steps, e]),
    headDigest: digest,
  });
}

export function emptyArenaTranscript(goalDigest: string): Readonly<ArenaTranscript> {
  if (typeof goalDigest !== 'string' || !HEX64_RE.test(goalDigest))
    throw new Error('an arena transcript needs a hex64 goalDigest; fail closed');
  return Object.freeze({
    arenaVersion: 1 as const,
    policyVersion: XIV_MULTI_AGENT_ARENA_POLICY.policyVersion,
    goalDigest,
    steps: Object.freeze([]),
    headDigest: ARENA_GENESIS,
  });
}

/**
 * Full transcript verification: re-derives every envelope, replays the role
 * sequence and turn discipline, re-computes the chain, and checks the head.
 * ANY anomaly refuses.
 */
export function verifyArenaTranscript(transcript: Readonly<ArenaTranscript>): Readonly<{ ok: true; headDigest: string }> {
  if (!transcript || typeof transcript !== 'object' || Array.isArray(transcript))
    throw new Error('an arena transcript is required; fail closed');
  if (transcript.arenaVersion !== 1 || transcript.policyVersion !== XIV_MULTI_AGENT_ARENA_POLICY.policyVersion)
    throw new Error('an arena transcript must carry the current arena policy; fail closed');
  let head = ARENA_GENESIS;
  let steps: ReadonlyArray<DebateEnvelope> = Object.freeze([]);
  for (const raw of transcript.steps) {
    // appendArenaStep re-gates the raw envelope (shape, chain, role, turn)
    // against the prefix rebuilt so far — a single anomalous step refuses.
    const next = appendArenaStep(Object.freeze({
      arenaVersion: 1 as const,
      policyVersion: XIV_MULTI_AGENT_ARENA_POLICY.policyVersion,
      goalDigest: transcript.goalDigest,
      steps, headDigest: head,
    }), raw);
    steps = next.steps;
    head = deriveDebateDigest(steps[steps.length - 1]!);
  }
  if (head !== transcript.headDigest)
    throw new Error('arena transcript headDigest mismatch — the chain has been tampered with; fail closed');
  return Object.freeze({ ok: true, headDigest: head });
}

export type ArenaGateOutcome = 'AUTHORIZED' | 'HUMAN_DECISION_REQUIRED';

/**
 * The consensus gate: AUTHORIZED only when the transcript ENDS with a judge
 * CONSENSUS step whose outcome is AUTHORIZED AND the last adversary verdict
 * in the transcript is an explicit PASS. Everything else — an empty
 * transcript, an exhausted debate, an abort — is HUMAN_DECISION_REQUIRED.
 * The gate releases nothing by itself.
 */
export function gateConsensus(transcript: Readonly<ArenaTranscript>): Readonly<{
  outcome: ArenaGateOutcome;
  reason: string;
  transcriptDigest: string;
}> {
  verifyArenaTranscript(transcript);
  const last = transcript.steps[transcript.steps.length - 1];
  if (!last || last.role !== 'JUDGE' || last.payload.kind !== 'CONSENSUS')
    return Object.freeze({ outcome: 'HUMAN_DECISION_REQUIRED' as const, reason: 'no judge consensus step has been reached', transcriptDigest: transcript.headDigest });
  const lastAdversary = [...transcript.steps].reverse().find((s) => s.role === 'ADVERSARY');
  const adversaryPass = lastAdversary !== undefined
    && lastAdversary.payload.kind === 'VERDICT' && lastAdversary.payload.verdict === 'PASS';
  if (!adversaryPass)
    return Object.freeze({ outcome: 'HUMAN_DECISION_REQUIRED' as const, reason: 'the adversary never stamped an explicit PASS — no unilateral release', transcriptDigest: transcript.headDigest });
  if (last.payload.outcome !== 'AUTHORIZED')
    return Object.freeze({ outcome: 'HUMAN_DECISION_REQUIRED' as const, reason: 'the judge aborted the run', transcriptDigest: transcript.headDigest });
  return Object.freeze({
    outcome: 'AUTHORIZED' as const,
    reason: 'adversary PASS + judge authorize — ready for human review, never auto-approved',
    transcriptDigest: transcript.headDigest,
  });
}

/**
 * The arena receipt: binds a 12D-241 StoryShellPacket to the transcript that
 * authorized it. Requires the packet to verify, the gate to be AUTHORIZED,
 * and the judge step to bind exactly this packetId. Deterministic.
 */
export function deriveArenaReceipt(opts: Readonly<{
  transcript: Readonly<ArenaTranscript>;
  packet: Readonly<StoryShellPacket>;
}>): Readonly<{
  arenaVersion: 1;
  policyVersion: string;
  transcriptDigest: string;
  packetId: string;
  receipt: string;
  gate: Readonly<{ outcome: ArenaGateOutcome; reason: string; transcriptDigest: string }>;
}> {
  if (!opts || typeof opts !== 'object' || Array.isArray(opts))
    throw new Error('deriveArenaReceipt expects an options object; fail closed');
  const keys = Object.keys(opts);
  if (keys.length !== 2 || !['transcript', 'packet'].every((k, i) => keys[i] === k))
    throw new Error('deriveArenaReceipt options must have exactly the keys [transcript, packet] in order; fail closed');
  // verifyStoryShellPacket THROWS on any tamper (it never returns ok:false) —
  // a tampered packet refuses here before anything is bound.
  const verdict = verifyStoryShellPacket(opts.packet);
  const gate = gateConsensus(opts.transcript);
  if (gate.outcome !== 'AUTHORIZED')
    throw new Error(`consensus was not reached (${gate.reason}); nothing is released; fail closed`);
  const last = opts.transcript.steps[opts.transcript.steps.length - 1]!;
  if (last.payload.kind !== 'CONSENSUS' || last.payload.packetId !== verdict.packetId)
    throw new Error('the judge step does not bind this packetId; fail closed');
  const receipt = sha256(JSON.stringify({
    domain: 'XIV_ARENA_RECEIPT',
    receiptVersion: 1,
    transcriptDigest: gate.transcriptDigest,
    packetId: verdict.packetId,
  }));
  return Object.freeze({
    arenaVersion: 1 as const,
    policyVersion: XIV_MULTI_AGENT_ARENA_POLICY.policyVersion,
    transcriptDigest: gate.transcriptDigest,
    packetId: verdict.packetId,
    receipt,
    gate,
  });
}