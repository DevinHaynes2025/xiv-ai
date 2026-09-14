// 12D-124 — Governed STORY ENGINE contract (XIV Twelve layer: Business Intelligence —
// "turn a KPI change into a causal narrative and options for humans").
//
// The master plan's investor demo needs the STORY ENGINE: a KPI change becomes a causal
// narrative and treatment options a human can act on. The 12D-122 Expo screen shows the
// governed shape with example data; this module is its BACKEND CONTRACT.
//
// What this contract is — and is not. It is the GOVERNANCE ENVELOPE for a story: it
// takes a DECLARED metric change, a DECLARED context, a DECLARED (human- or
// analyst-authored) narrative, and DECLARED treatment options, and it wraps them in a
// fail-closed, honest, auditable packet where every treatment requires a human decision
// and learning is NEVER promoted. It is NOT a story generator: no model call exists in
// this runtime, the narrative arrives authored, and nothing is inferred — a signal
// without an explicit declared source never becomes a story.
//
// The ladder (12D-122's SIGNAL→LEARNING, verbatim):
//   SIGNAL -> CONTEXT -> STORY -> TREATMENT -> ACTION -> LEARNING
//
// Handoff to 12D-121: selecting a treatment is a HUMAN decision recorded here with an
// operator receipt, and the record states that any resulting action MUST go through a
// 12D-121 decision-safety workflow before any instruction can exist. This runtime
// MATERIALIZES NOTHING and LEARNS NOTHING: `learningPromoted: false` is structural.

import { createHash } from 'node:crypto';

export const STORY_ENGINE_POLICY = Object.freeze({
  maxMetricIdChars: 128,
  maxDeclaredByChars: 128,
  maxMagnitudeChars: 200,
  maxNarrativeChars: 2000,
  maxContextLines: 8,
  maxContextLineChars: 300,
  maxTreatments: 5,
  minTreatments: 1,
  maxTreatmentIdChars: 128,
  maxTreatmentDescriptionChars: 500,
  maxDecidedByChars: 128,
  storyLadder: Object.freeze([
    'SIGNAL',
    'CONTEXT',
    'STORY',
    'TREATMENT',
    'ACTION',
    'LEARNING',
  ]) as readonly string[],
  knownDirections: Object.freeze(['IMPROVED', 'DEGRADED']) as readonly string[],
  // The ONLY accepted signal source: a metric change DECLARED to this contract. A model
  // never detects a signal here; "model-detected" or "inferred" sources fail closed.
  knownSignalSources: Object.freeze(['DECLARED_METRIC_CHANGE']) as readonly string[],
  knownDecisions: Object.freeze(['ACCEPTED_FOR_HUMAN_REVIEW', 'DECLINED_BY_HUMAN']) as readonly string[],
});

export const STORY_ENGINE_GUARDRAILS = Object.freeze({
  storiesAreDeclaredNotInferred: true, // a signal without an explicit declared source never becomes a story
  narrativesAreAuthoredNotGenerated: true, // no model call exists in this runtime
  everyTreatmentRequiresHumanDecision: true,
  learningIsNeverPromoted: true, // a story is evidence, never training data
  executesNothing: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface MetricSignal {
  readonly metricId: string;
  readonly direction: 'IMPROVED' | 'DEGRADED';
  /** The DECLARED change, verbatim (e.g. "14% of purchase orders slipped +6 days"). */
  readonly magnitude: string;
  readonly declaredBy: string;
  readonly declaredAtMs: number;
  readonly source: 'DECLARED_METRIC_CHANGE';
}

export interface TreatmentOption {
  readonly treatmentId: string;
  readonly description: string;
  readonly decision: 'REQUIRES_HUMAN_APPROVAL';
}

export interface GovernedStory {
  readonly kind: 'GOVERNED_STORY';
  readonly storyId: string;
  readonly signal: Readonly<MetricSignal>;
  readonly context: readonly string[];
  readonly narrative: string;
  readonly treatments: readonly Readonly<TreatmentOption>[];
  readonly ladder: readonly string[];
  readonly guardrails: Readonly<typeof STORY_ENGINE_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  /** No live metric is connected to this contract — structurally zero, forever. */
  readonly storiesFromLiveData: 0;
  readonly automaticRecovery: false;
  readonly billionUsersProven: false;
}

export interface StoryDecisionRecord {
  readonly kind: 'STORY_DECISION_RECORD';
  readonly storyId: string;
  readonly treatmentId: string;
  /** The description the human actually decided on — the record is self-describing. */
  readonly treatmentDescription: string;
  readonly decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  readonly decidedBy: string;
  readonly decidedAtMs: number;
  readonly operatorReceiptSha256: string;
  /** A REQUIREMENT, never a claim that routing happened: this runtime opens no
   *  workflow. Any resulting action MUST pass a 12D-121 decision-safety workflow
   *  FIRST, in a system outside this runtime, before any instruction can exist. */
  readonly requiresDecisionSafetyWorkflowBeforeAnyAction: true;
  readonly executedByThisRuntime: false;
  readonly productionExecutionAllowed: false;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const id = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= max && /^[A-Za-z0-9_.:@-]+$/.test(v);
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const boundedText = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length >= 1 && v.length <= max;

/**
 * The story identity, RE-DERIVED, never trusted (the 12D-121 genesis/proposal-digest
 * discipline): a canonical serialization of EVERY declared input — the full signal
 * (magnitude and declarer included), the context, the narrative, and the treatment
 * list. JSON.stringify of a fixed-key object literal is deterministic and injects no
 * delimiter ambiguity (a '|' inside a declared magnitude would break a joined-string
 * preimage; it cannot break this form). Used by composeGovernedStory to stamp the id
 * and by assertStoryInvariants to re-derive and compare it.
 */
const deriveStoryId = (
  signal: MetricSignal,
  context: readonly string[],
  narrative: string,
  treatments: ReadonlyArray<{ treatmentId: string; description: string }>,
): string => sha256(JSON.stringify({
  metricId: signal.metricId,
  direction: signal.direction,
  declaredAtMs: signal.declaredAtMs,
  magnitude: signal.magnitude,
  declaredBy: signal.declaredBy,
  source: signal.source,
  context: [...context],
  narrative,
  treatments: treatments.map((t) => ({ treatmentId: t.treatmentId, description: t.description })),
}));

function assertSignal(signal: unknown): asserts signal is MetricSignal {
  const s = signal as MetricSignal | null;
  if (!s || !id(s.metricId, STORY_ENGINE_POLICY.maxMetricIdChars))
    throw new Error('story metric id invalid; fail closed');
  if (!STORY_ENGINE_POLICY.knownDirections.includes(s.direction))
    throw new Error('signal direction unknown; fail closed');
  if (!boundedText(s.magnitude, STORY_ENGINE_POLICY.maxMagnitudeChars))
    throw new Error('signal magnitude must be declared; fail closed');
  if (!id(s.declaredBy, STORY_ENGINE_POLICY.maxDeclaredByChars))
    throw new Error('signal declarer identity invalid; fail closed');
  if (!safeInt(s.declaredAtMs) || s.declaredAtMs <= 0)
    throw new Error('signal timestamp invalid; fail closed');
  if (s.source !== 'DECLARED_METRIC_CHANGE')
    throw new Error('signals are DECLARED, never inferred or model-detected; fail closed');
}

/**
 * Compose a governed story from DECLARED inputs: a metric signal, context lines, an
 * authored narrative, and treatment options. Pure: validates everything fail-closed and
 * derives a deterministic storyId. Fails closed on any undeclared, malformed, or
 * out-of-policy input — including treatments beyond policy, duplicate treatment ids,
 * and any signal that does not carry the DECLARED_METRIC_CHANGE source. The frozen
 * packet is self-checked through assertStoryInvariants before it is ever returned.
 */
export function composeGovernedStory(input: {
  signal: MetricSignal;
  context: readonly string[];
  narrative: string;
  treatments: ReadonlyArray<{ treatmentId: string; description: string }>;
}): Readonly<GovernedStory> {
  assertSignal(input?.signal);
  if (!Array.isArray(input.context) || input.context.length < 1
    || input.context.length > STORY_ENGINE_POLICY.maxContextLines
    || !input.context.every((l) => boundedText(l, STORY_ENGINE_POLICY.maxContextLineChars)))
    throw new Error('story context invalid; fail closed');
  if (!boundedText(input.narrative, STORY_ENGINE_POLICY.maxNarrativeChars))
    throw new Error('story narrative must be authored; fail closed');
  if (!Array.isArray(input.treatments) || input.treatments.length < STORY_ENGINE_POLICY.minTreatments
    || input.treatments.length > STORY_ENGINE_POLICY.maxTreatments)
    throw new Error('story treatments outside policy; fail closed');
  const seenTreatments = new Set<string>();
  for (const t of input.treatments) {
    if (!t || !id(t.treatmentId, STORY_ENGINE_POLICY.maxTreatmentIdChars))
      throw new Error('treatment identity invalid; fail closed');
    if (seenTreatments.has(t.treatmentId)) throw new Error('duplicate treatment id; fail closed');
    seenTreatments.add(t.treatmentId);
    if (!boundedText(t.description, STORY_ENGINE_POLICY.maxTreatmentDescriptionChars))
      throw new Error('treatment description invalid; fail closed');
  }
  const storyId = deriveStoryId(input.signal, input.context, input.narrative, input.treatments);
  const packet = Object.freeze({
    kind: 'GOVERNED_STORY' as const,
    storyId,
    signal: Object.freeze({ ...input.signal }),
    context: Object.freeze([...input.context]),
    narrative: input.narrative,
    treatments: Object.freeze(input.treatments.map((t) => Object.freeze({
      treatmentId: t.treatmentId,
      description: t.description,
      decision: 'REQUIRES_HUMAN_APPROVAL' as const,
    }))),
    ladder: STORY_ENGINE_POLICY.storyLadder,
    guardrails: STORY_ENGINE_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    storiesFromLiveData: 0 as const,
    automaticRecovery: false as const,
    billionUsersProven: false as const,
  });
  // Construction ships no story it would itself reject.
  assertStoryInvariants(packet);
  return packet;
}

/**
 * Mechanical invariant check for any governed story, fail-closed: the frozen canonical
 * guardrails, the exact SIGNAL→LEARNING ladder, EVERY treatment requiring human
 * approval, learning never promoted, no stories from live data, and the full
 * constitution flag set. A story that fails these invariants is rejected, never
 * repaired. Used by tests, by construction, and by any future surface.
 */
export function assertStoryInvariants(story: Readonly<GovernedStory>): void {
  if (!story || story.kind !== 'GOVERNED_STORY' || !Object.isFrozen(story))
    throw new Error('not a frozen GOVERNED_STORY; fail closed');
  if (story.guardrails !== STORY_ENGINE_GUARDRAILS || !Object.isFrozen(story.guardrails))
    throw new Error('guardrails must be the frozen STORY_ENGINE_GUARDRAILS; fabricated guardrails fail closed');
  assertSignal(story.signal);
  if (!Array.isArray(story.context) || story.context.length < 1
    || story.context.length > STORY_ENGINE_POLICY.maxContextLines
    || !story.context.every((l) => boundedText(l, STORY_ENGINE_POLICY.maxContextLineChars)))
    throw new Error('story context invalid; fail closed');
  if (!boundedText(story.narrative, STORY_ENGINE_POLICY.maxNarrativeChars))
    throw new Error('story narrative must be authored; fail closed');
  // The story id is RE-DERIVED from the declared content, never trusted: a forged or
  // foreign storyId — or one stamped from a DIFFERENT story's content — fails closed,
  // so a receipt-backed decision record can never attach to content the id does not
  // describe.
  if (!hex64(story.storyId)
    || story.storyId !== deriveStoryId(story.signal, story.context, story.narrative, story.treatments))
    throw new Error('storyId does not re-derive from the declared story content; fail closed');
  if (!Array.isArray(story.treatments) || story.treatments.length < 1
    || story.treatments.length > STORY_ENGINE_POLICY.maxTreatments)
    throw new Error('story treatments outside policy; fail closed');
  const ids = new Set<string>();
  for (const t of story.treatments) {
    if (!t || !id(t.treatmentId, STORY_ENGINE_POLICY.maxTreatmentIdChars)
      || !boundedText(t.description, STORY_ENGINE_POLICY.maxTreatmentDescriptionChars))
      throw new Error('treatment malformed; fail closed');
    if (ids.has(t.treatmentId)) throw new Error('duplicate treatment id; fail closed');
    ids.add(t.treatmentId);
    if (t.decision !== 'REQUIRES_HUMAN_APPROVAL')
      throw new Error('every treatment requires a human decision; a story never self-approves; fail closed');
  }
  if (JSON.stringify(story.ladder) !== JSON.stringify([...STORY_ENGINE_POLICY.storyLadder]))
    throw new Error('story ladder must be the exact SIGNAL→LEARNING ladder; fail closed');
  if (story.learningPromoted !== false || story.storiesFromLiveData !== 0)
    throw new Error('a story is evidence, never promoted learning, and never from live data; fail closed');
  if (story.humanDecision !== 'REQUIRED' || story.automaticRecovery !== false
    || story.modelCalls !== 0 || story.remoteCalls !== 0 || story.billionUsersProven !== false)
    throw new Error('story must carry the honest governance flags');
}

/**
 * Record the HUMAN decision on a story's treatment — receipt-gated (64-hex sha256
 * operator receipt, the 12D-119/12D-121 discipline). The record carries the treatment
 * DESCRIPTION alongside the id, so it evidences exactly what was decided, and its
 * requiresDecisionSafetyWorkflowBeforeAnyAction flag is a REQUIREMENT — this runtime
 * opens no 12D-121 workflow; any resulting action MUST pass one first, in a system
 * outside this runtime. This record authorizes NOTHING and executes NOTHING. Declining
 * is recorded verbatim. Learning is never promoted from either.
 */
export function recordTreatmentDecision(
  story: Readonly<GovernedStory>,
  input: {
    treatmentId: string;
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
    operatorReceiptSha256: string;
    decidedBy: string;
    decidedAtMs: number;
  },
): Readonly<StoryDecisionRecord> {
  assertStoryInvariants(story);
  if (!STORY_ENGINE_POLICY.knownDecisions.includes(input?.decision))
    throw new Error('treatment decision unknown; fail closed');
  const treatment = story.treatments.find((t) => t.treatmentId === input.treatmentId);
  if (!treatment) throw new Error('treatment does not belong to this story; fail closed');
  if (!hex64(input.operatorReceiptSha256))
    throw new Error('a treatment decision requires a 64-hex sha256 operator receipt; fail closed');
  if (!id(input.decidedBy, STORY_ENGINE_POLICY.maxDecidedByChars))
    throw new Error('decider identity invalid; fail closed');
  if (!safeInt(input.decidedAtMs) || input.decidedAtMs <= 0)
    throw new Error('decision timestamp invalid; fail closed');
  // A decision chronologically CANNOT predate the declared signal it responds to —
  // backfilled approvals are impossible orderings, rejected (the 12D-121 rule).
  if (input.decidedAtMs < story.signal.declaredAtMs)
    throw new Error('decision timestamp predates the declared signal; fail closed');
  return Object.freeze({
    kind: 'STORY_DECISION_RECORD' as const,
    storyId: story.storyId,
    treatmentId: input.treatmentId,
    treatmentDescription: treatment.description,
    decision: input.decision,
    decidedBy: input.decidedBy,
    decidedAtMs: input.decidedAtMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    requiresDecisionSafetyWorkflowBeforeAnyAction: true as const,
    executedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}