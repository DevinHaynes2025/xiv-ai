// 12D-125 — Governed BUSINESS HEALTH SCORE contract (XIV Twelve layer: the master
// plan's first executive question — "How is my business doing, what needs attention,
// and why?").
//
// The master plan's governing rules for Business Health, verbatim:
//   "Scores should never be arbitrary; each score must trace back to measurable factors."
//   "The Story Engine explains the score in plain language."
//   "Health can be organized by finance, operations, customers, people, technology and
//    supply chain."
//
// What this contract is — and is not. It is the GOVERNANCE ENVELOPE for a health
// score: callers DECLARE factor scores (finance, operations, customers, people,
// technology, supply chain), each carrying a declared BASIS (the measurable evidence
// behind the number). The overall score is never caller-supplied and never arbitrary —
// it is DERIVED here, deterministically, as a weighted mean, and the derivation is
// re-derived and enforced by the invariant check (the 12D-124 lesson applied at
// construction: a forged score, a forged scoreId, or an untraceable factor fails
// closed). Attention items are classified by POLICY thresholds, not opinions. Plain-
// language explanations enter only as 12D-124 story references — this runtime
// generates no narrative and makes no model call. Nothing connects to live data yet:
// `scoresFromLiveData: 0` is structural. The TREAT rung ("human-approved actions") is
// handed to 12D-121 the same way 12D-124 hands it over: as a REQUIREMENT on the
// record, never a routing this runtime performs.

import { createHash } from 'node:crypto';

export const BUSINESS_HEALTH_POLICY = Object.freeze({
  domains: Object.freeze([
    'FINANCE',
    'OPERATIONS',
    'CUSTOMERS',
    'PEOPLE',
    'TECHNOLOGY',
    'SUPPLY_CHAIN',
  ]) as readonly string[],
  minFactors: 1,
  maxFactors: 24,
  factorScoreMin: 0,
  factorScoreMax: 100,
  // Weights are integer percents that MUST sum to exactly 100 — the weighted mean is
  // then an exact integer points sum over 100, with no float drift anywhere.
  weightSumExact: 100,
  maxFactorIdChars: 128,
  maxDeclaredByChars: 128,
  maxBasisChars: 500,
  maxDeclaredByScoreChars: 128,
  // Attention thresholds (policy, not inference): a factor at or above needsAttentionAt
  // and above watchAt is STABLE; at or below watchAt but above needsAttentionAt is
  // WATCH; at or below needsAttentionAt is NEEDS_ATTENTION.
  needsAttentionAtOrBelow: 50,
  watchAtOrBelow: 75,
  maxStoriesPerFactor: 1,
  maxScoreRefChars: 128,
});

export const BUSINESS_HEALTH_GUARDRAILS = Object.freeze({
  scoresAreDerivedNeverArbitrary: true, // the overall score is computed, never caller-supplied
  everyFactorCarriesDeclaredBasis: true, // "each score must trace back to measurable factors"
  explanationsAreStoryReferences: true, // plain language comes from 12D-124 stories, not this runtime
  attentionIsClassifiedByPolicy: true, // fixed thresholds, no inference, no model
  scoresFromLiveDataOnlyByFutureMeasuredContract: true,
  executesNothing: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface HealthFactor {
  readonly factorId: string;
  readonly domain: 'FINANCE' | 'OPERATIONS' | 'CUSTOMERS' | 'PEOPLE' | 'TECHNOLOGY' | 'SUPPLY_CHAIN';
  /** Declared 0-100 score for this factor. */
  readonly score: number;
  /** Integer percent weight; all weights must sum to exactly 100. */
  readonly weight: number;
  /** The declared measurable basis this score traces back to — REQUIRED, verbatim. */
  readonly basis: string;
  readonly declaredBy: string;
  readonly declaredAtMs: number;
}

export interface FactorStoryReference {
  readonly factorId: string;
  /** A 12D-124 GOVERNED_STORY id (64-hex sha256) — "the Story Engine explains the
   *  score in plain language". This contract stores the REFERENCE, never the narrative. */
  readonly storyId: string;
}

export interface AttentionItem {
  readonly factorId: string;
  readonly domain: string;
  readonly score: number;
  readonly status: 'NEEDS_ATTENTION' | 'WATCH' | 'STABLE';
}

export interface GovernedHealthScore {
  readonly kind: 'GOVERNED_HEALTH_SCORE';
  readonly scoreId: string;
  readonly factors: readonly Readonly<HealthFactor>[];
  /** Exact weighted points: sum(score * weight), integer because weights are percents. */
  readonly overallScorePoints: number;
  /** overallScorePoints / 100 — the derived weighted mean on the 0-100 scale. */
  readonly overallScore: number;
  readonly attentionItems: readonly Readonly<AttentionItem>[];
  readonly stories: readonly Readonly<FactorStoryReference>[];
  readonly guardrails: Readonly<typeof BUSINESS_HEALTH_GUARDRAILS>;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  /** No live metric is connected to this contract — structurally zero, forever. */
  readonly scoresFromLiveData: 0;
  readonly automaticRecovery: false;
  readonly billionUsersProven: false;
}

export interface ScoreReviewRecord {
  readonly kind: 'SCORE_REVIEW_RECORD';
  readonly scoreId: string;
  readonly overallScorePoints: number;
  readonly reviewedBy: string;
  readonly reviewedAtMs: number;
  readonly decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  readonly operatorReceiptSha256: string;
  /** A REQUIREMENT, never a claim that routing happened: this runtime opens no
   *  workflow. Any resulting action (the master plan's TREAT rung) MUST pass a 12D-121
   *  decision-safety workflow FIRST. */
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

// The EXACT declared shapes: a factor or story reference carrying undeclared fields
// would ride into the governed packet unvalidated and escape the scoreId digest —
// two materially different packets would share one identity (adversarial-review
// finding). Rejected at compose time and re-checked by the invariants.
const FACTOR_KEYS = Object.freeze([
  'factorId', 'domain', 'score', 'weight', 'basis', 'declaredBy', 'declaredAtMs',
]);
const STORY_KEYS = Object.freeze(['factorId', 'storyId']);
const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

/**
 * The score identity, RE-DERIVED, never trusted (the 12D-121/12D-124 digest
 * discipline): a canonical serialization of EVERY declared input — all factors with
 * their bases, the story references, and the derived points. Used by
 * composeGovernedHealthScore to stamp the id and by assertHealthScoreInvariants to
 * re-derive and compare it.
 */
const deriveScoreId = (
  factors: readonly HealthFactor[],
  stories: readonly FactorStoryReference[],
  overallScorePoints: number,
): string => sha256(JSON.stringify({
  factors: factors.map((f) => ({
    factorId: f.factorId, domain: f.domain, score: f.score, weight: f.weight,
    basis: f.basis, declaredBy: f.declaredBy, declaredAtMs: f.declaredAtMs,
  })),
  stories: stories.map((s) => ({ factorId: s.factorId, storyId: s.storyId })),
  overallScorePoints,
}));

const deriveOverallPoints = (factors: readonly HealthFactor[]): number =>
  factors.reduce((a, f) => a + f.score * f.weight, 0);

const classifyStatus = (score: number): AttentionItem['status'] =>
  score <= BUSINESS_HEALTH_POLICY.needsAttentionAtOrBelow ? 'NEEDS_ATTENTION'
    : score <= BUSINESS_HEALTH_POLICY.watchAtOrBelow ? 'WATCH'
      : 'STABLE';

function assertFactor(factor: unknown): asserts factor is HealthFactor {
  const f = factor as HealthFactor | null;
  // The exact declared shape is checked FIRST: an undeclared extra field or a missing
  // declared key fails the shape gate before any field validation (a missing key would
  // otherwise fail its own field check instead — still fail-closed, but the shape gate
  // is the authoritative rejection).
  if (!hasExactKeys(f, FACTOR_KEYS))
    throw new Error('health factor carries undeclared fields; fail closed');
  if (!f || !id(f.factorId, BUSINESS_HEALTH_POLICY.maxFactorIdChars))
    throw new Error('health factor id invalid; fail closed');
  if (!BUSINESS_HEALTH_POLICY.domains.includes(f.domain))
    throw new Error('health factor domain unknown; fail closed');
  if (!safeInt(f.score) || f.score < BUSINESS_HEALTH_POLICY.factorScoreMin
    || f.score > BUSINESS_HEALTH_POLICY.factorScoreMax)
    throw new Error('health factor score outside the 0-100 policy scale; fail closed');
  if (!safeInt(f.weight) || f.weight < 1 || f.weight > BUSINESS_HEALTH_POLICY.weightSumExact)
    throw new Error('health factor weight must be a positive integer percent; fail closed');
  if (!boundedText(f.basis, BUSINESS_HEALTH_POLICY.maxBasisChars))
    throw new Error('health factor basis must be declared; a score without a measurable basis is arbitrary; fail closed');
  if (!id(f.declaredBy, BUSINESS_HEALTH_POLICY.maxDeclaredByChars))
    throw new Error('health factor declarer identity invalid; fail closed');
  if (!safeInt(f.declaredAtMs) || f.declaredAtMs <= 0)
    throw new Error('health factor timestamp invalid; fail closed');
}

/**
 * Compose a governed health score from DECLARED factors and OPTIONAL 12D-124 story
 * references. Pure: validates everything fail-closed, derives the overall score as an
 * exact weighted points sum (weights must sum to exactly 100 percents), classifies
 * attention items by policy thresholds (worst first, deterministic order), and stamps
 * a deterministic scoreId binding every declared input AND the derived points. The
 * frozen packet is self-checked through assertHealthScoreInvariants before it is ever
 * returned. A caller cannot supply the overall score — there is no such input.
 */
export function composeGovernedHealthScore(input: {
  factors: ReadonlyArray<{
    factorId: string; domain: HealthFactor['domain']; score: number; weight: number;
    basis: string; declaredBy: string; declaredAtMs: number;
  }>;
  stories?: ReadonlyArray<{ factorId: string; storyId: string }>;
}): Readonly<GovernedHealthScore> {
  if (!Array.isArray(input?.factors) || input.factors.length < BUSINESS_HEALTH_POLICY.minFactors
    || input.factors.length > BUSINESS_HEALTH_POLICY.maxFactors)
    throw new Error('health factors outside policy; fail closed');
  for (const f of input.factors) assertFactor(f);
  const seen = new Set<string>();
  for (const f of input.factors) {
    if (seen.has(f.factorId)) throw new Error('duplicate health factor id; fail closed');
    seen.add(f.factorId);
  }
  const weightSum = input.factors.reduce((a, f) => a + f.weight, 0);
  if (weightSum !== BUSINESS_HEALTH_POLICY.weightSumExact)
    throw new Error(`health factor weights must sum to exactly ${BUSINESS_HEALTH_POLICY.weightSumExact} percents; fail closed`);
  const stories = input.stories ?? [];
  if (!Array.isArray(stories) || stories.length > input.factors.length * BUSINESS_HEALTH_POLICY.maxStoriesPerFactor)
    throw new Error('story references outside policy; fail closed');
  const factorIds = new Set(seen);
  const seenStories = new Set<string>();
  const storiesPerFactor = new Map<string, number>();
  for (const s of stories) {
    if (!s || !id(s.factorId, BUSINESS_HEALTH_POLICY.maxFactorIdChars) || !factorIds.has(s.factorId))
      throw new Error('story reference does not belong to any declared factor; fail closed');
    if (!hex64(s.storyId))
      throw new Error('story references must be 12D-124 GOVERNED_STORY ids (64-hex sha256); fail closed');
    if (!hasExactKeys(s, STORY_KEYS))
      throw new Error('story reference carries undeclared fields; fail closed');
    const key = `${s.factorId}:${s.storyId}`;
    if (seenStories.has(key)) throw new Error('duplicate story reference; fail closed');
    seenStories.add(key);
    const n = (storiesPerFactor.get(s.factorId) ?? 0) + 1;
    if (n > BUSINESS_HEALTH_POLICY.maxStoriesPerFactor)
      throw new Error(`factor ${s.factorId} exceeds maxStoriesPerFactor (${BUSINESS_HEALTH_POLICY.maxStoriesPerFactor}); fail closed`);
    storiesPerFactor.set(s.factorId, n);
  }
  const overallScorePoints = deriveOverallPoints(input.factors);
  const overallScore = overallScorePoints / 100;
  const scoreId = deriveScoreId(input.factors, stories, overallScorePoints);
  const attentionItems = [...input.factors]
    .sort((a, b) => a.score - b.score || (a.factorId < b.factorId ? -1 : 1))
    .map((f) => Object.freeze({
      factorId: f.factorId,
      domain: f.domain,
      score: f.score,
      status: classifyStatus(f.score),
    }));
  const packet = Object.freeze({
    kind: 'GOVERNED_HEALTH_SCORE' as const,
    scoreId,
    // Projected to the DECLARED keys only — nothing outside the digest can ever ship
    // (adversarial-review finding: a wholesale spread let undeclared fields ride into
    // the packet while escaping the scoreId).
    factors: Object.freeze(input.factors.map((f) => Object.freeze({
      factorId: f.factorId,
      domain: f.domain,
      score: f.score,
      weight: f.weight,
      basis: f.basis,
      declaredBy: f.declaredBy,
      declaredAtMs: f.declaredAtMs,
    }))),
    overallScorePoints,
    overallScore,
    attentionItems: Object.freeze(attentionItems),
    stories: Object.freeze(stories.map((s) => Object.freeze({
      factorId: s.factorId,
      storyId: s.storyId,
    }))),
    guardrails: BUSINESS_HEALTH_GUARDRAILS,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    scoresFromLiveData: 0 as const,
    automaticRecovery: false as const,
    billionUsersProven: false as const,
  });
  // Construction ships no score it would itself reject.
  assertHealthScoreInvariants(packet);
  return packet;
}

/**
 * Mechanical invariant check for any governed health score, fail-closed: the frozen
 * canonical guardrails, every factor validated by this contract's own rules, the
 * weight sum pinned to exactly 100, the overall score RE-DERIVED from the factors
 * (a forged overall or a doctored factor is rejected, never repaired), attention
 * items re-derived and re-classified by the policy thresholds, story references
 * checked against the declared factors, and the full constitution flag set. The
 * scoreId is re-derived from the declared content. Used by tests, by construction,
 * and by any future surface.
 */
export function assertHealthScoreInvariants(score: Readonly<GovernedHealthScore>): void {
  if (!score || score.kind !== 'GOVERNED_HEALTH_SCORE' || !Object.isFrozen(score))
    throw new Error('not a frozen GOVERNED_HEALTH_SCORE; fail closed');
  // Structural freeze: the packet's sub-arrays AND their elements must be frozen too —
  // a frozen shell over an unfrozen factors array once passed the check and accepted an
  // in-place push after a review was issued (adversarial-review finding).
  for (const sub of [score.factors, score.attentionItems, score.stories]) {
    if (!Array.isArray(sub) || !Object.isFrozen(sub)
      || !sub.every((el) => el !== null && typeof el === 'object' && Object.isFrozen(el)))
      throw new Error('governed score sub-structure not frozen; fail closed');
  }
  if (score.guardrails !== BUSINESS_HEALTH_GUARDRAILS || !Object.isFrozen(score.guardrails))
    throw new Error('guardrails must be the frozen BUSINESS_HEALTH_GUARDRAILS; fabricated guardrails fail closed');
  if (!Array.isArray(score.factors) || score.factors.length < BUSINESS_HEALTH_POLICY.minFactors
    || score.factors.length > BUSINESS_HEALTH_POLICY.maxFactors)
    throw new Error('health factors outside policy; fail closed');
  const seen = new Set<string>();
  for (const f of score.factors) {
    assertFactor(f);
    if (seen.has(f.factorId)) throw new Error('duplicate health factor id; fail closed');
    seen.add(f.factorId);
  }
  if (score.factors.reduce((a, f) => a + f.weight, 0) !== BUSINESS_HEALTH_POLICY.weightSumExact)
    throw new Error(`health factor weights must sum to exactly ${BUSINESS_HEALTH_POLICY.weightSumExact} percents; fail closed`);
  // The overall score is RE-DERIVED, never trusted: a forged packet claiming points it
  // does not derive — or a doctored factor — fails closed here.
  const derivedPoints = deriveOverallPoints(score.factors);
  if (score.overallScorePoints !== derivedPoints
    || score.overallScore !== derivedPoints / 100)
    throw new Error('overall score does not re-derive from the declared factors; fail closed');
  // Attention items re-derived and re-classified: STRUCTURAL comparison with identical
  // key order — JSON.stringify distinguishes '42' from 42 and now covers the domain
  // field, which a template-string compare once dropped (adversarial-review finding).
  const expectedAttention = [...score.factors]
    .sort((a, b) => a.score - b.score || (a.factorId < b.factorId ? -1 : 1))
    .map((f) => ({ factorId: f.factorId, domain: f.domain, score: f.score, status: classifyStatus(f.score) }));
  const actualAttention = score.attentionItems.map((i) => ({
    factorId: i.factorId, domain: i.domain, score: i.score, status: i.status,
  }));
  if (JSON.stringify(actualAttention) !== JSON.stringify(expectedAttention))
    throw new Error('attention items do not re-derive from the factors under the policy thresholds; fail closed');
  // Story references must reference DECLARED factors, be 12D-124 story ids, carry the
  // exact declared shape, and respect the PER-FACTOR cap (maxStoriesPerFactor).
  if (!Array.isArray(score.stories) || score.stories.length > score.factors.length * BUSINESS_HEALTH_POLICY.maxStoriesPerFactor)
    throw new Error('story references outside policy; fail closed');
  const seenStories = new Set<string>();
  const storiesPerFactor = new Map<string, number>();
  for (const s of score.stories) {
    if (!s || !id(s.factorId, BUSINESS_HEALTH_POLICY.maxFactorIdChars) || !seen.has(s.factorId))
      throw new Error('story reference does not belong to any declared factor; fail closed');
    if (!hex64(s.storyId))
      throw new Error('story references must be 12D-124 GOVERNED_STORY ids (64-hex sha256); fail closed');
    if (!hasExactKeys(s, STORY_KEYS))
      throw new Error('story reference carries undeclared fields; fail closed');
    const key = `${s.factorId}:${s.storyId}`;
    if (seenStories.has(key)) throw new Error('duplicate story reference; fail closed');
    seenStories.add(key);
    const n = (storiesPerFactor.get(s.factorId) ?? 0) + 1;
    if (n > BUSINESS_HEALTH_POLICY.maxStoriesPerFactor)
      throw new Error(`factor ${s.factorId} exceeds maxStoriesPerFactor (${BUSINESS_HEALTH_POLICY.maxStoriesPerFactor}); fail closed`);
    storiesPerFactor.set(s.factorId, n);
  }
  // The scoreId is RE-DERIVED from the declared content (64-hex enforced here too).
  if (!hex64(score.scoreId) || score.scoreId !== deriveScoreId(score.factors, score.stories, score.overallScorePoints))
    throw new Error('scoreId does not re-derive from the declared score content; fail closed');
  if (score.learningPromoted !== false || score.scoresFromLiveData !== 0)
    throw new Error('a health score is derived evidence, never promoted learning, and never from live data; fail closed');
  if (score.humanDecision !== 'REQUIRED' || score.automaticRecovery !== false
    || score.modelCalls !== 0 || score.remoteCalls !== 0 || score.billionUsersProven !== false)
    throw new Error('health score must carry the honest governance flags');
}

/**
 * Record the HUMAN review of a health score — receipt-gated (64-hex sha256 operator
 * receipt, the 12D-119/12D-121/12D-124 discipline). The record carries the derived
 * points it reviewed, its requiresDecisionSafetyWorkflowBeforeAnyAction flag is a
 * REQUIREMENT (the master plan's TREAT rung — human-approved actions — must pass a
 * 12D-121 workflow first, in a system outside this runtime), and it authorizes
 * NOTHING and executes NOTHING. Learning is never promoted from either decision.
 */
export function recordScoreReview(
  score: Readonly<GovernedHealthScore>,
  input: {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
    operatorReceiptSha256: string;
    reviewedBy: string;
    reviewedAtMs: number;
  },
): Readonly<ScoreReviewRecord> {
  assertHealthScoreInvariants(score);
  const known = ['ACCEPTED_FOR_HUMAN_REVIEW', 'DECLINED_BY_HUMAN'] as const;
  if (!(known as readonly string[]).includes(input?.decision))
    throw new Error('score review decision unknown; fail closed');
  if (!hex64(input.operatorReceiptSha256))
    throw new Error('a score review requires a 64-hex sha256 operator receipt; fail closed');
  if (!id(input.reviewedBy, BUSINESS_HEALTH_POLICY.maxDeclaredByChars))
    throw new Error('reviewer identity invalid; fail closed');
  if (!safeInt(input.reviewedAtMs) || input.reviewedAtMs <= 0)
    throw new Error('review timestamp invalid; fail closed');
  // A review chronologically CANNOT predate every factor it reviews (the 12D-121/124
  // temporal rule); backfilled reviews are impossible orderings, rejected.
  const earliestDeclaration = Math.min(...score.factors.map((f) => f.declaredAtMs));
  if (input.reviewedAtMs < earliestDeclaration)
    throw new Error('review timestamp predates the declared factors; fail closed');
  return Object.freeze({
    kind: 'SCORE_REVIEW_RECORD' as const,
    scoreId: score.scoreId,
    overallScorePoints: score.overallScorePoints,
    reviewedBy: input.reviewedBy,
    reviewedAtMs: input.reviewedAtMs,
    decision: input.decision,
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