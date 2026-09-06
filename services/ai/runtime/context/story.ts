import type { BusinessHealthFinding, StoryBeat, StoryStance } from './findings';
import type { BusinessContext, DiagnosticStory } from './types';

export type BusinessNarrative = {
  prototype: true;
  signal: StoryBeat;
  change: StoryBeat;
  causeHypothesis: StoryBeat;
  businessImpact: StoryBeat;
  recommendation: StoryBeat;
  expectedOutcome: StoryBeat;
  evidence: {
    confidence: 'low' | 'medium' | 'high';
    quality: 'sample' | 'prototype';
    sourceLabels: readonly string[];
  };
  disclaimer: string;
};

const SAMPLE_BEATS: readonly Omit<StoryBeat, 'step'>[] = [
  { label: 'Supplier variability', stance: 'observed', prototype: true },
  { label: 'Safety stock increased', stance: 'inferred', prototype: true },
  { label: 'Warehouse congestion', stance: 'inferred', prototype: true },
  { label: 'Order cycle time increased', stance: 'inferred', prototype: true },
  { label: 'Fulfillment delays', stance: 'inferred', prototype: true },
  { label: 'Customer complaints', stance: 'hypothesized', prototype: true },
  { label: 'Review a six-hour recovery window', stance: 'recommended', prototype: true },
];

export function buildCausalChain(beats: readonly Omit<StoryBeat, 'step'>[] = SAMPLE_BEATS): StoryBeat[] {
  return beats.map((beat, index) => ({ ...beat, step: index + 1, prototype: true }));
}

export function buildNarrative(finding?: BusinessHealthFinding): BusinessNarrative {
  const chain = finding?.causalChain ?? buildCausalChain();
  const pick = (stance: StoryStance, fallback: string): StoryBeat =>
    chain.find((beat) => beat.stance === stance) ?? { step: 0, label: fallback, stance, prototype: true };

  return {
    prototype: true,
    signal: pick('observed', 'Sample operating signal'),
    change: pick('inferred', 'Sample operating change'),
    causeHypothesis: {
      step: 3,
      label: finding?.likelyCauses[0] ?? 'Supplier variability is a hypothesized first cause.',
      stance: 'hypothesized',
      prototype: true,
    },
    businessImpact: pick('inferred', finding?.businessImpact ?? 'Sample business impact'),
    recommendation: pick('recommended', finding?.recommendedActions[0] ?? 'Human review only'),
    expectedOutcome: {
      step: 7,
      label: 'If the hypothesis holds, a reviewed recovery window may ease congestion. This is not a forecast.',
      stance: 'hypothesized',
      prototype: true,
    },
    evidence: {
      confidence: finding?.confidence ?? 'low',
      quality: finding?.evidenceQuality ?? 'sample',
      sourceLabels: finding?.sourceLabels ?? ['prototype_sample'],
    },
    disclaimer:
      'Hypotheses are not facts. Sample/prototype evidence only. No ERP, WMS, or TMS is connected.',
  };
}

export function hypothesisIsMarked(narrative: BusinessNarrative) {
  return narrative.causeHypothesis.stance === 'hypothesized' && narrative.expectedOutcome.stance === 'hypothesized';
}

/**
 * Builds a labeled prototype diagnostic story. Does not claim causal certainty.
 */
export function buildDiagnosticStory(context: BusinessContext, finding?: BusinessHealthFinding): DiagnosticStory {
  const narrative = buildNarrative(finding);
  return {
    prototype: true,
    whatHappened:
      finding?.whatHappened ??
      `${context.organization.name} shows a watch-level health score of ${context.businessHealth.score} in sample context. ${context.operations.warehouse}`,
    whyItMatters:
      finding?.whyItMatters ??
      'If the sample chain holds, warehouse congestion can delay fulfillment and show up as customer complaints. This is a hypothesis, not a live operational fact.',
    likelyCauses: finding?.likelyCauses ?? [context.operations.supplier, context.operations.inventory, ...context.businessHealth.risks],
    businessImpact: finding?.businessImpact ?? context.businessHealth.summary,
    recommendedNextAction:
      finding?.recommendedActions[0] ??
      'A human should review the recovery window. No warehouse, supplier, or customer system should be changed automatically.',
    confidence: 'low',
    evidenceQuality: 'sample',
    sourceLabels: context.system.sourceLabels,
    causalChain: narrative.signal
      ? [
          narrative.signal,
          narrative.change,
          narrative.causeHypothesis,
          narrative.businessImpact,
          narrative.recommendation,
        ]
      : buildCausalChain(),
    disclaimer: narrative.disclaimer,
  };
}

export function storyHasPrototypeLabels(story: DiagnosticStory) {
  return (
    story.prototype === true &&
    story.evidenceQuality === 'sample' &&
    story.sourceLabels.includes('prototype_sample') &&
    story.causalChain.every((step) => step.prototype)
  );
}
