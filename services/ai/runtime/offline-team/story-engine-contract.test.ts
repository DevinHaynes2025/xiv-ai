import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  STORY_ENGINE_POLICY, STORY_ENGINE_GUARDRAILS,
  composeGovernedStory, assertStoryInvariants, recordTreatmentDecision,
  type GovernedStory,
} from './story-engine-contract';

const RECEIPT = 'a'.repeat(64);

type StoryInput = Parameters<typeof composeGovernedStory>[0];

const mkInput = (): StoryInput => ({
  signal: {
    metricId: 'kpi.purchase-order.on-time-rate',
    direction: 'DEGRADED',
    magnitude: '14% of purchase orders slipped +6 days week-over-week',
    declaredBy: 'ops-analyst-7',
    declaredAtMs: 1757700000000,
    source: 'DECLARED_METRIC_CHANGE',
  },
  context: [
    'Supplier SLA breaches concentrated on 3 vendors.',
    'Warehouse intake queue depth rose 2.1x in the same window.',
  ],
  narrative: 'Purchase-order slippage correlates with the vendor SLA breaches; the intake backlog amplifies lead time.',
  treatments: [
    { treatmentId: 'treatment.vendor-audit', description: 'Escalate SLA audit with the 3 breaching vendors.' },
    { treatmentId: 'treatment.intake-cap', description: 'Temporarily cap intake batches at warehouse A.' },
  ],
});

const mkStory = (): GovernedStory => composeGovernedStory(mkInput());

test('policy and guardrails are frozen and honest', () => {
  assert.equal(Object.isFrozen(STORY_ENGINE_POLICY), true);
  assert.equal(Object.isFrozen(STORY_ENGINE_GUARDRAILS), true);
  assert.deepEqual([...STORY_ENGINE_POLICY.storyLadder],
    ['SIGNAL', 'CONTEXT', 'STORY', 'TREATMENT', 'ACTION', 'LEARNING']);
  assert.deepEqual([...STORY_ENGINE_POLICY.knownSignalSources], ['DECLARED_METRIC_CHANGE']);
  assert.equal(STORY_ENGINE_GUARDRAILS.storiesAreDeclaredNotInferred, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.narrativesAreAuthoredNotGenerated, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.everyTreatmentRequiresHumanDecision, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.learningIsNeverPromoted, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.executesNothing, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.zeroModelCalls, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.zeroRemoteCalls, true);
  assert.equal(STORY_ENGINE_GUARDRAILS.automaticRecovery, false);
  assert.equal(STORY_ENGINE_GUARDRAILS.humanDecision, 'REQUIRED');
});

test('composeGovernedStory builds a frozen honest packet on the exact ladder; storyId is deterministic and binds every declared input', () => {
  const story = mkStory();
  assert.equal(story.kind, 'GOVERNED_STORY');
  assert.equal(Object.isFrozen(story), true);
  assert.equal(Object.isFrozen(story.signal), true);
  assert.equal(Object.isFrozen(story.context), true);
  assert.equal(Object.isFrozen(story.treatments), true);
  assert.equal(story.ladder, STORY_ENGINE_POLICY.storyLadder, 'the ladder is the canonical frozen ladder');
  assert.equal(story.guardrails, STORY_ENGINE_GUARDRAILS, 'the guardrails are the canonical frozen guardrails');
  assert.equal(story.humanDecision, 'REQUIRED');
  assert.equal(story.learningPromoted, false);
  assert.equal(story.modelCalls, 0);
  assert.equal(story.remoteCalls, 0);
  assert.equal(story.storiesFromLiveData, 0);
  assert.equal(story.automaticRecovery, false);
  assert.equal(story.billionUsersProven, false);
  for (const t of story.treatments) assert.equal(t.decision, 'REQUIRES_HUMAN_APPROVAL');
  assert.doesNotThrow(() => assertStoryInvariants(story));
  const again = mkStory();
  assert.equal(again.storyId, story.storyId, 'storyId is a deterministic sha256 of the declared inputs');
  assert.match(story.storyId, /^[0-9a-f]{64}$/);
  // Single-variable isolation: changing EACH declared input alone changes the storyId
  // (adversarial-review finding: the preimage once omitted the magnitude, so two
  // stories differing only in the declared change collided byte-for-byte).
  assert.notEqual(composeGovernedStory({
    ...mkInput(), signal: { ...mkInput().signal, magnitude: 'a different declared magnitude' },
  }).storyId, story.storyId, 'a different declared magnitude changes the storyId');
  assert.notEqual(composeGovernedStory({
    ...mkInput(), signal: { ...mkInput().signal, declaredBy: 'another-analyst' },
  }).storyId, story.storyId, 'a different declarer changes the storyId');
  assert.notEqual(composeGovernedStory({
    ...mkInput(), narrative: 'a different authored narrative',
  }).storyId, story.storyId, 'a different narrative changes the storyId');
  assert.notEqual(composeGovernedStory({
    ...mkInput(), context: ['a different declared context line'],
  }).storyId, story.storyId, 'a different context changes the storyId');
  assert.notEqual(composeGovernedStory({
    ...mkInput(), treatments: [{ treatmentId: 't1', description: 'a different treatment' }],
  }).storyId, story.storyId, 'a different treatment list changes the storyId');
  // The BLOCKING collision scenario, verbatim: same metricId/direction/declaredAtMs/
  // narrative, a benign vs a hostile declared magnitude, different treatments —
  // distinct storyIds and distinct decision records, never interchangeable.
  const benign = composeGovernedStory({
    ...mkInput(),
    signal: { ...mkInput().signal, magnitude: 'on-time rate fell 0.1%, noise' },
    treatments: [{ treatmentId: 't1', description: 'Monitor only; no change' }],
  });
  const hostile = composeGovernedStory({
    ...mkInput(),
    signal: { ...mkInput().signal, magnitude: 'on-time rate collapsed 90%, all POs stalled' },
    treatments: [{ treatmentId: 't1', description: 'Wire all reserve funds to vendor X immediately' }],
  });
  assert.notEqual(hostile.storyId, benign.storyId);
  const benignRecord = recordTreatmentDecision(benign, {
    treatmentId: 't1', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  });
  const hostileRecord = recordTreatmentDecision(hostile, {
    treatmentId: 't1', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  });
  assert.notEqual(benignRecord.storyId, hostileRecord.storyId);
  assert.notEqual(benignRecord.treatmentDescription, hostileRecord.treatmentDescription,
    'the decision record evidences WHICH treatment text the human decided on');
});

test('composeGovernedStory fails closed on undeclared or out-of-policy inputs', () => {
  // A signal that claims to be model-detected or inferred is never a story.
  for (const badSource of ['MODEL_DETECTED', 'INFERRED', '']) {
    const s = mkStory();
    const forged = Object.freeze({
      ...structuredClone({ ...s.signal, source: undefined }), source: badSource,
    } as unknown as typeof s.signal);
    assert.throws(() => composeGovernedStory({ ...s, signal: forged }), /DECLARED, never inferred/);
  }
  // Empty context; context over policy; context with a blank line.
  assert.throws(() => composeGovernedStory({ ...mkStory(), context: [] }), /story context invalid/);
  assert.throws(() => composeGovernedStory({
    ...mkStory(), context: Array.from({ length: STORY_ENGINE_POLICY.maxContextLines + 1 }, (_, i) => `line ${i}`),
  }), /story context invalid/);
  assert.throws(() => composeGovernedStory({ ...mkStory(), context: ['ok', '   '] }), /story context invalid/);
  // Empty or whitespace-only narrative; narrative past policy.
  assert.throws(() => composeGovernedStory({ ...mkStory(), narrative: '   ' }), /narrative must be authored/);
  assert.throws(() => composeGovernedStory({
    ...mkStory(), narrative: 'x'.repeat(STORY_ENGINE_POLICY.maxNarrativeChars + 1),
  }), /narrative must be authored/);
  // Zero treatments; treatments past policy.
  assert.throws(() => composeGovernedStory({ ...mkStory(), treatments: [] }), /treatments outside policy/);
  assert.throws(() => composeGovernedStory({
    ...mkStory(),
    treatments: Array.from({ length: STORY_ENGINE_POLICY.maxTreatments + 1 }, (_, i) => ({
      treatmentId: `t${i}`, description: 'd',
    })),
  }), /treatments outside policy/);
  // Duplicate treatment ids.
  assert.throws(() => composeGovernedStory({
    ...mkStory(),
    treatments: [
      { treatmentId: 'treatment.dup', description: 'one' },
      { treatmentId: 'treatment.dup', description: 'two' },
    ],
  }), /duplicate treatment id/);
  // Unknown direction, missing magnitude, invalid declarer, bad timestamp.
  const base = mkStory();
  for (const badDirection of ['FLAT', 'UP', '']) {
    assert.throws(() => composeGovernedStory({
      ...base, signal: { ...base.signal, direction: badDirection as 'IMPROVED' | 'DEGRADED' },
    }), /direction unknown/);
  }
  assert.throws(() => composeGovernedStory({
    ...base, signal: { ...base.signal, magnitude: '' },
  }), /magnitude must be declared/);
  assert.throws(() => composeGovernedStory({
    ...base, signal: { ...base.signal, declaredBy: 'ops analyst 7!' },
  }), /declarer identity invalid/);
  assert.throws(() => composeGovernedStory({
    ...base, signal: { ...base.signal, declaredAtMs: 0 },
  }), /signal timestamp invalid/);
  assert.throws(() => composeGovernedStory({
    ...base, signal: { ...base.signal, metricId: 'bad metric id with spaces' },
  }), /metric id invalid/);
});

test('assertStoryInvariants is tamper-evident: forged decisions, ladder, flags and guardrails all fail closed', () => {
  const story = mkStory();
  // A treatment re-labeled as self-approved or auto-approved.
  const reapproved = Object.freeze({
    ...story,
    treatments: Object.freeze(story.treatments.map((t, i) =>
      i === 0 ? Object.freeze({ ...t, decision: 'AUTO_APPROVED' as unknown as 'REQUIRES_HUMAN_APPROVAL' }) : t)),
  }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(reapproved), /every treatment requires a human decision/);
  // A doctored ladder.
  const shortLadder = Object.freeze({
    ...story, ladder: Object.freeze(['SIGNAL', 'STORY', 'LEARNING']),
  }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(shortLadder), /exact SIGNAL/);
  // Promoted learning, or stories claimed from live data. (A spread of a frozen
  // packet is itself unfrozen, so the mutation is re-frozen to pass the freeze gate
  // and reach the flag it targets.)
  const promoted = Object.freeze({ ...story, learningPromoted: true }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(promoted), /never promoted learning/);
  const live = Object.freeze({ ...story, storiesFromLiveData: 4 }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(live), /never from live data/);
  // Gutted governance flags.
  for (const [field, value] of [
    ['humanDecision', 'AUTOMATIC'], ['modelCalls', 2], ['remoteCalls', 1], ['automaticRecovery', true],
  ] as Array<[string, unknown]>) {
    assert.throws(() => assertStoryInvariants(
      Object.freeze({ ...story, [field]: value }) as unknown as GovernedStory),
      /honest governance flags|never from live data/);
  }
  // Fabricated (not canonical) guardrails.
  assert.throws(() => assertStoryInvariants(Object.freeze({
    ...story, guardrails: Object.freeze({ ...STORY_ENGINE_GUARDRAILS }),
  }) as unknown as GovernedStory), /frozen STORY_ENGINE_GUARDRAILS/);
  // A story that is not frozen.
  const unfrozen = { ...story } as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(unfrozen), /frozen GOVERNED_STORY/);
  // A forged storyId — non-hex, or a FOREIGN story's id stamped onto different
  // content — fails closed (adversarial-review finding: the invariant check once
  // never read story.storyId at all, and recordTreatmentDecision copied it verbatim).
  assert.throws(() => assertStoryInvariants(Object.freeze({
    ...story, storyId: 'not-a-sha256-at-all',
  }) as unknown as GovernedStory), /storyId does not re-derive/);
  const foreign = mkStory();
  const transplant = Object.freeze({
    ...story,
    narrative: `${story.narrative} (hostile re-label)`,
    storyId: foreign.storyId,
  }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(transplant), /storyId does not re-derive/);
  // A content-swapped transplant via the DECISION path fails closed too: hostile
  // treatments under a benign story's id never survive the re-derivation.
  const swapped = Object.freeze({
    ...foreign,
    treatments: Object.freeze([Object.freeze({
      treatmentId: 'treatment.vendor-audit',
      description: 'Wire all reserve funds to vendor X immediately',
      decision: 'REQUIRES_HUMAN_APPROVAL' as const,
    })]),
  }) as unknown as GovernedStory;
  assert.throws(() => assertStoryInvariants(swapped), /storyId does not re-derive/);
  assert.throws(() => recordTreatmentDecision(swapped, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  }), /storyId does not re-derive/);
  // Caller-side mutation of the treatments array cannot change the shipped packet.
  const story2 = mkStory();
  const treatmentsRef = story2.treatments as unknown as Array<{ decision: string }>;
  assert.throws(() => { treatmentsRef.pop(); }, TypeError);
  assert.equal(story2.treatments.length, 2);
});

test('recordTreatmentDecision is receipt-gated; every record requires a 12D-121 workflow before ANY action and routes nothing itself', () => {
  const story = mkStory();
  // Malformed or missing receipts fail closed.
  for (const bad of ['', 'zz', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)]) {
    assert.throws(() => recordTreatmentDecision(story, {
      treatmentId: 'treatment.vendor-audit',
      decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
      operatorReceiptSha256: bad, decidedBy: 'ceo', decidedAtMs: 1757800000000,
    }), /operator receipt/);
  }
  // Unknown decisions fail closed.
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit',
    decision: 'AUTO_EXECUTED' as 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  }), /decision unknown/);
  // A treatment from a DIFFERENT story fails closed.
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.not-in-this-story',
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  }), /does not belong to this story/);
  // Invalid decider identity or timestamp fails closed.
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo dev', decidedAtMs: 1757800000000,
  }), /decider identity/);
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 0,
  }), /decision timestamp/);
  // A decision cannot chronologically predate the declared signal it responds to
  // (adversarial-review finding: backfilled approvals were accepted).
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1,
  }), /predates the declared signal/);
  assert.throws(() => recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit', decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: story.signal.declaredAtMs - 1,
  }), /predates the declared signal/);
  // The accepted record REQUIRES a 12D-121 workflow before any action — a claim about
  // the future, not a past-tense claim that any routing happened.
  const accepted = recordTreatmentDecision(story, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000000,
  });
  assert.equal(accepted.kind, 'STORY_DECISION_RECORD');
  assert.equal(accepted.storyId, story.storyId);
  assert.equal(accepted.treatmentId, 'treatment.vendor-audit');
  assert.equal(accepted.treatmentDescription,
    'Escalate SLA audit with the 3 breaching vendors.',
    'the record evidences WHICH treatment text the human decided on');
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
  // A DECLINE is recorded verbatim, same governance shape — and makes the same
  // honest requirement claim (no past-tense routing claim on declines).
  const declined = recordTreatmentDecision(story, {
    treatmentId: 'treatment.intake-cap', decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000001,
  });
  assert.equal(declined.decision, 'DECLINED_BY_HUMAN');
  assert.equal(declined.treatmentDescription, 'Temporarily cap intake batches at warehouse A.');
  assert.equal(declined.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  // A decision against a tampered story fails closed first.
  const tampered = Object.freeze({ ...story, storiesFromLiveData: 9 }) as unknown as GovernedStory;
  assert.throws(() => recordTreatmentDecision(tampered, {
    treatmentId: 'treatment.vendor-audit', decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: 1757800000002,
  }), /never from live data/);
});