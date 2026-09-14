import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  BUSINESS_HEALTH_POLICY, BUSINESS_HEALTH_GUARDRAILS,
  composeGovernedHealthScore, assertHealthScoreInvariants, recordScoreReview,
  type GovernedHealthScore,
} from './business-health-score-contract';

const RECEIPT = 'a'.repeat(64);
const STORY = 'b'.repeat(64);

type ScoreInput = Parameters<typeof composeGovernedHealthScore>[0];

const mkInput = (): ScoreInput => ({
  factors: [
    { factorId: 'factor.supplier-risk', domain: 'SUPPLY_CHAIN', score: 42, weight: 20,
      basis: '12D-103-style drill: 3 vendor SLA breaches measured in the declared window', declaredBy: 'ops-analyst-7', declaredAtMs: 1757700000000 },
    { factorId: 'factor.cash-flow', domain: 'FINANCE', score: 71, weight: 40,
      basis: 'declared receivables aging and runway figures', declaredBy: 'cfo-agent-2', declaredAtMs: 1757700000001 },
    { factorId: 'factor.customer-stability', domain: 'CUSTOMERS', score: 88, weight: 40,
      basis: 'declared churn and complaint-volume figures', declaredBy: 'customer-agent-3', declaredAtMs: 1757700000002 },
  ],
  stories: [
    { factorId: 'factor.supplier-risk', storyId: STORY },
  ],
});

const mkScore = (): GovernedHealthScore => composeGovernedHealthScore(mkInput());

test('policy and guardrails are frozen and honest', () => {
  assert.equal(Object.isFrozen(BUSINESS_HEALTH_POLICY), true);
  assert.equal(Object.isFrozen(BUSINESS_HEALTH_GUARDRAILS), true);
  assert.deepEqual([...BUSINESS_HEALTH_POLICY.domains],
    ['FINANCE', 'OPERATIONS', 'CUSTOMERS', 'PEOPLE', 'TECHNOLOGY', 'SUPPLY_CHAIN']);
  assert.equal(BUSINESS_HEALTH_POLICY.weightSumExact, 100);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.scoresAreDerivedNeverArbitrary, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.everyFactorCarriesDeclaredBasis, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.explanationsAreStoryReferences, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.attentionIsClassifiedByPolicy, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.executesNothing, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.zeroModelCalls, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.automaticRecovery, false);
  assert.equal(BUSINESS_HEALTH_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('composeGovernedHealthScore derives the overall score (never caller-supplied) and classifies attention by policy', () => {
  const score = mkScore();
  assert.equal(score.kind, 'GOVERNED_HEALTH_SCORE');
  assert.equal(Object.isFrozen(score), true);
  assert.equal(Object.isFrozen(score.factors), true);
  assert.equal(Object.isFrozen(score.attentionItems), true);
  assert.equal(score.guardrails, BUSINESS_HEALTH_GUARDRAILS, 'the guardrails are the canonical frozen guardrails');
  // Derived, exact: 42*20 + 71*40 + 88*40 = 840 + 2840 + 3520 = 7200 points -> 72.0.
  assert.equal(score.overallScorePoints, 7200);
  assert.equal(score.overallScore, 72);
  assert.equal(score.humanDecision, 'REQUIRED');
  assert.equal(score.learningPromoted, false);
  assert.equal(score.modelCalls, 0);
  assert.equal(score.remoteCalls, 0);
  assert.equal(score.scoresFromLiveData, 0);
  assert.equal(score.automaticRecovery, false);
  assert.equal(score.billionUsersProven, false);
  // Attention items: worst first, deterministic order, classified by policy.
  // 42 -> NEEDS_ATTENTION, 71 -> WATCH, 88 -> STABLE.
  assert.deepEqual(score.attentionItems.map((i) => [i.factorId, i.score, i.status]), [
    ['factor.supplier-risk', 42, 'NEEDS_ATTENTION'],
    ['factor.cash-flow', 71, 'WATCH'],
    ['factor.customer-stability', 88, 'STABLE'],
  ]);
  assert.match(score.scoreId, /^[0-9a-f]{64}$/);
  assert.doesNotThrow(() => assertHealthScoreInvariants(score));
  const again = mkScore();
  assert.equal(again.scoreId, score.scoreId, 'scoreId is a deterministic sha256 of the declared inputs and derived points');
  // Tie on score breaks deterministically by factorId.
  const tied = composeGovernedHealthScore({
    factors: [
      { factorId: 'factor.b', domain: 'FINANCE', score: 50, weight: 50, basis: 'x', declaredBy: 'a', declaredAtMs: 1 },
      { factorId: 'factor.a', domain: 'PEOPLE', score: 50, weight: 50, basis: 'y', declaredBy: 'a', declaredAtMs: 2 },
    ],
  });
  assert.deepEqual(tied.attentionItems.map((i) => i.factorId), ['factor.a', 'factor.b'],
    'equal scores sort by factorId, deterministically');
});

test('scoreId binds every declared input (single-variable isolation) and the derived points', () => {
  const score = mkScore();
  assert.notEqual(composeGovernedHealthScore({
    ...mkInput(),
    factors: mkInput().factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, score: 43 } : f),
  }).scoreId, score.scoreId, 'a changed factor score changes the scoreId');
  assert.notEqual(composeGovernedHealthScore({
    ...mkInput(),
    factors: mkInput().factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, basis: 'a different declared basis' } : f),
  }).scoreId, score.scoreId, 'a changed basis changes the scoreId');
  assert.notEqual(composeGovernedHealthScore({
    ...mkInput(),
    factors: mkInput().factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, weight: 19 }
      : f.factorId === 'factor.cash-flow' ? { ...f, weight: 41 } : f),
  }).scoreId, score.scoreId, 'changed weights (sum kept at 100) change the scoreId');
  assert.notEqual(composeGovernedHealthScore({
    ...mkInput(),
    stories: [],
  }).scoreId, score.scoreId, 'changed story references change the scoreId');
  // The transplanted-basis scenario: the same numeric score with a different declared
  // basis is a DIFFERENT score — traceability is part of the identity.
  assert.notEqual(composeGovernedHealthScore({
    ...mkInput(),
    factors: mkInput().factors.map((f) => f.factorId === 'factor.cash-flow'
      ? { ...f, declaredBy: 'different-declarer' } : f),
  }).scoreId, score.scoreId, 'a changed declarer changes the scoreId');
});

test('composeGovernedHealthScore fails closed on undeclared or out-of-policy inputs', () => {
  const inp = mkInput();
  // Scores outside the 0-100 scale.
  for (const bad of [-1, 101, 42.5]) {
    assert.throws(() => composeGovernedHealthScore({
      ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
        ? { ...f, score: bad } : f),
    }), /0-100 policy scale/);
  }
  // Weight problems: zero, negative, fractional, and a sum that is not exactly 100.
  for (const bad of [0, -10, 0.5]) {
    assert.throws(() => composeGovernedHealthScore({
      ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
        ? { ...f, weight: bad } : f),
    }), /positive integer percent/);
  }
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, weight: f.weight + 1 } : f),
  }), /exactly 100 percents/);
  // Missing or blank basis — "scores should never be arbitrary".
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, basis: '   ' } : f),
  }), /basis must be declared/);
  // Unknown domain, duplicate factor id, bad identity/timestamp.
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, domain: 'MAGIC' as 'FINANCE' } : f),
  }), /domain unknown/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp,
    factors: [...inp.factors, { ...inp.factors[0]!, factorId: 'factor.supplier-risk' }],
  }), /duplicate health factor id/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, declaredBy: 'ops analyst 7!' } : f),
  }), /declarer identity invalid/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, declaredAtMs: 0 } : f),
  }), /timestamp invalid/);
  // Empty factors.
  assert.throws(() => composeGovernedHealthScore({ ...inp, factors: [] }), /factors outside policy/);
  // Story-reference discipline: unknown factor, non-hex id, duplicate reference.
  assert.throws(() => composeGovernedHealthScore({
    ...inp, stories: [{ factorId: 'factor.not-declared', storyId: STORY }],
  }), /does not belong to any declared factor/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp, stories: [{ factorId: 'factor.supplier-risk', storyId: 'not-a-sha256' }],
  }), /12D-124 GOVERNED_STORY ids/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp, stories: [{ factorId: 'factor.supplier-risk', storyId: STORY }, { factorId: 'factor.supplier-risk', storyId: STORY }],
  }), /duplicate story reference/);
  // The PER-FACTOR cap (maxStoriesPerFactor) is enforced, not just the aggregate:
  // two DISTINCT story ids on ONE factor fail closed (adversarial-review finding:
  // the aggregate length check allowed three distinct stories on a single factor).
  assert.throws(() => composeGovernedHealthScore({
    ...inp,
    stories: [
      { factorId: 'factor.supplier-risk', storyId: STORY },
      { factorId: 'factor.supplier-risk', storyId: 'c'.repeat(64) },
    ],
  }), /exceeds maxStoriesPerFactor/);
  // Undeclared extra fields fail closed — a smuggled field would ride into the packet
  // unvalidated and escape the scoreId digest, so two different packets would share
  // one identity (adversarial-review BLOCKING finding).
  assert.throws(() => composeGovernedHealthScore({
    ...inp,
    factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, scoreFromLiveDatabase: 'prod-primary' } : f),
  }), /factor carries undeclared fields/);
  assert.throws(() => composeGovernedHealthScore({
    ...inp,
    factors: inp.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? { ...f, basis: undefined } : f),
  } as unknown as ScoreInput), /basis must be declared/, 'a field set to undefined fails its own validation');
  const { declaredAtMs: _missing, ...missingKeyFactor } = inp.factors[0]!;
  assert.throws(() => composeGovernedHealthScore({
    ...inp, factors: [missingKeyFactor, ...inp.factors.slice(1)],
  } as unknown as ScoreInput), /factor carries undeclared fields/, 'a MISSING declared key fails the exact-shape check');
  assert.throws(() => composeGovernedHealthScore({
    ...inp,
    stories: [{ factorId: 'factor.supplier-risk', storyId: STORY, narrative: 'smuggled' }],
  } as unknown as ScoreInput), /story reference carries undeclared fields/);
});

test('assertHealthScoreInvariants is tamper-evident: forged scores, scoreIds, classifications and flags all fail closed', () => {
  const score = mkScore();
  // A forged overall score (points or the derived number).
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, overallScorePoints: 9999,
  }) as unknown as GovernedHealthScore), /overall score does not re-derive/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, overallScore: 99,
  }) as unknown as GovernedHealthScore), /overall score does not re-derive/);
  // A doctored factor: re-freeze with a score change but the original scoreId and points.
  const doctored = Object.freeze({
    ...score,
    factors: Object.freeze(score.factors.map((f) => f.factorId === 'factor.cash-flow'
      ? Object.freeze({ ...f, score: 95 }) : f)),
  }) as unknown as GovernedHealthScore;
  assert.throws(() => assertHealthScoreInvariants(doctored), /overall score does not re-derive/);
  // Re-classified attention items.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    attentionItems: Object.freeze(score.attentionItems.map((i) => i.factorId === 'factor.supplier-risk'
      ? Object.freeze({ ...i, status: 'STABLE' as const }) : i)),
  }) as unknown as GovernedHealthScore), /attention items do not re-derive/);
  // An attention item with a SWAPPED domain passes a template-string compare but not a
  // structural one (adversarial-review finding) — the FINANCE factor labeled SUPPLY_CHAIN.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    attentionItems: Object.freeze(score.attentionItems.map((i) => i.factorId === 'factor.cash-flow'
      ? Object.freeze({ ...i, domain: 'SUPPLY_CHAIN' }) : i)),
  }) as unknown as GovernedHealthScore), /attention items do not re-derive/);
  // A string-typed score coerces through template literals but fails structurally.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    attentionItems: Object.freeze(score.attentionItems.map((i) => i.factorId === 'factor.supplier-risk'
      ? Object.freeze({ ...i, score: String(i.score) }) : i)),
  }) as unknown as GovernedHealthScore), /attention items do not re-derive/);
  // The PER-FACTOR story cap is re-checked by the invariants: a hand-built packet with
  // two distinct stories on one factor fails closed before the scoreId check runs.
  const multiStory = Object.freeze({
    ...score,
    stories: Object.freeze([
      Object.freeze({ factorId: 'factor.supplier-risk', storyId: STORY }),
      Object.freeze({ factorId: 'factor.supplier-risk', storyId: 'c'.repeat(64) }),
    ]),
  }) as unknown as GovernedHealthScore;
  assert.throws(() => assertHealthScoreInvariants(multiStory), /exceeds maxStoriesPerFactor/);
  // Undeclared fields on a hand-built packet's factor or story reference.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    factors: Object.freeze(score.factors.map((f) => f.factorId === 'factor.supplier-risk'
      ? Object.freeze({ ...f, basisSource: 'smuggled' }) : f)),
  }) as unknown as GovernedHealthScore), /factor carries undeclared fields/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    stories: Object.freeze([Object.freeze({ factorId: 'factor.supplier-risk', storyId: STORY, narrative: 'smuggled' })]),
  }) as unknown as GovernedHealthScore), /story reference carries undeclared fields/);
  // A frozen shell over an UNFROZEN sub-array is rejected — the freeze guarantee covers
  // the internals, not just the top level (adversarial-review finding).
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, factors: [...score.factors],
  }) as unknown as GovernedHealthScore), /sub-structure not frozen/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, attentionItems: [...score.attentionItems],
  }) as unknown as GovernedHealthScore), /sub-structure not frozen/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, stories: [...score.stories],
  }) as unknown as GovernedHealthScore), /sub-structure not frozen/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    factors: Object.freeze(score.factors.map((f) => ({ ...f }))),
  }) as unknown as GovernedHealthScore), /sub-structure not frozen/,
  'an UNFROZEN element inside a frozen array is rejected too');
  // A forged or foreign scoreId.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, scoreId: 'not-a-sha256',
  }) as unknown as GovernedHealthScore), /scoreId does not re-derive/);
  const foreign = mkScore();
  const transplanted = Object.freeze({
    ...score,
    factors: Object.freeze(score.factors.map((f) => f.factorId === 'factor.cash-flow'
      ? Object.freeze({ ...f, basis: 'hostile re-label' }) : f)),
    scoreId: foreign.scoreId,
  }) as unknown as GovernedHealthScore;
  assert.throws(() => assertHealthScoreInvariants(transplanted), /scoreId does not re-derive/);
  // Claims of live data or promoted learning.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, scoresFromLiveData: 5,
  }) as unknown as GovernedHealthScore), /never from live data/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, learningPromoted: true,
  }) as unknown as GovernedHealthScore), /never promoted learning/);
  // Gutted governance flags.
  for (const [field, value] of [
    ['humanDecision', 'AUTOMATIC'], ['modelCalls', 2], ['remoteCalls', 1], ['automaticRecovery', true],
  ] as Array<[string, unknown]>) {
    assert.throws(() => assertHealthScoreInvariants(
      Object.freeze({ ...score, [field]: value }) as unknown as GovernedHealthScore),
      /honest governance flags|never from live data/);
  }
  // Fabricated guardrails, weight-sum tamper, unfrozen packet.
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score, guardrails: Object.freeze({ ...BUSINESS_HEALTH_GUARDRAILS }),
  }) as unknown as GovernedHealthScore), /frozen BUSINESS_HEALTH_GUARDRAILS/);
  assert.throws(() => assertHealthScoreInvariants(Object.freeze({
    ...score,
    factors: Object.freeze(score.factors.map((f) => Object.freeze({ ...f, weight: f.weight + 1 }))),
  }) as unknown as GovernedHealthScore), /exactly 100 percents/);
  assert.throws(() => assertHealthScoreInvariants({ ...score } as unknown as GovernedHealthScore), /frozen GOVERNED_HEALTH_SCORE/);
  // Caller-side mutation of frozen arrays cannot change the shipped packet.
  const score2 = mkScore();
  assert.throws(() => { (score2.factors as unknown as unknown[]).pop(); }, TypeError);
  assert.equal(score2.factors.length, 3);
});

test('recordScoreReview is receipt-gated; every record requires a 12D-121 workflow before ANY action', () => {
  const score = mkScore();
  // Malformed or missing receipts fail closed.
  for (const bad of ['', 'zz', 'A'.repeat(64), 'a'.repeat(63)]) {
    assert.throws(() => recordScoreReview(score, {
      decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
      operatorReceiptSha256: bad, reviewedBy: 'ceo', reviewedAtMs: 1757800000000,
    }), /operator receipt/);
  }
  // Unknown decisions fail closed.
  assert.throws(() => recordScoreReview(score, {
    decision: 'AUTO_EXECUTED' as 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: 1757800000000,
  }), /decision unknown/);
  // Invalid reviewer identity or timestamp fails closed.
  assert.throws(() => recordScoreReview(score, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo dev', reviewedAtMs: 1757800000000,
  }), /reviewer identity/);
  // A review cannot chronologically predate the declared factors (backfilled reviews).
  assert.throws(() => recordScoreReview(score, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: 1,
  }), /predates the declared factors/);
  assert.throws(() => recordScoreReview(score, {
    decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: score.factors[0]!.declaredAtMs - 1,
  }), /predates the declared factors/);
  // The accepted record requires a 12D-121 workflow and authorizes nothing.
  const accepted = recordScoreReview(score, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: 1757800000000,
  });
  assert.equal(accepted.kind, 'SCORE_REVIEW_RECORD');
  assert.equal(accepted.scoreId, score.scoreId);
  assert.equal(accepted.overallScorePoints, score.overallScorePoints);
  assert.equal(accepted.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  assert.equal(accepted.executedByThisRuntime, false);
  assert.equal(accepted.productionExecutionAllowed, false);
  assert.equal(accepted.humanDecision, 'REQUIRED');
  assert.equal(accepted.learningPromoted, false);
  assert.equal(accepted.modelCalls, 0);
  assert.equal(accepted.remoteCalls, 0);
  assert.equal(accepted.automaticRecovery, false);
  assert.equal(accepted.billionUsersProven, false);
  assert.equal(Object.isFrozen(accepted), true);
  // A DECLINE is recorded verbatim, same governance shape.
  const declined = recordScoreReview(score, {
    decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: 1757800000001,
  });
  assert.equal(declined.decision, 'DECLINED_BY_HUMAN');
  assert.equal(declined.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  // A review against a tampered score fails closed first.
  const tampered = Object.freeze({ ...score, scoresFromLiveData: 9 }) as unknown as GovernedHealthScore;
  assert.throws(() => recordScoreReview(tampered, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, reviewedBy: 'ceo', reviewedAtMs: 1757800000002,
  }), /never from live data/);
});