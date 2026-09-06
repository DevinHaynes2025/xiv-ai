import type { BusinessContext, DiagnosticStory } from './types';

const SAMPLE_CHAIN = [
  'Supplier variability',
  'Safety stock increase',
  'Warehouse congestion',
  'Fulfillment delay',
  'Customer complaints',
] as const;

/**
 * Builds a labeled prototype diagnostic story. Does not claim causal certainty.
 */
export function buildDiagnosticStory(context: BusinessContext): DiagnosticStory {
  return {
    prototype: true,
    whatHappened: `${context.organization.name} shows a watch-level health score of ${context.businessHealth.score} in sample context. ${context.operations.warehouse}`,
    whyItMatters:
      'If the sample chain holds, warehouse congestion can delay fulfillment and show up as customer complaints. This is a hypothesis, not a live operational fact.',
    likelyCauses: [
      context.operations.supplier,
      context.operations.inventory,
      ...context.businessHealth.risks,
    ],
    businessImpact: context.businessHealth.summary,
    recommendedNextAction:
      'A human should review the recovery window. No warehouse, supplier, or customer system should be changed automatically.',
    confidence: 'low',
    evidenceQuality: 'sample',
    sourceLabels: context.system.sourceLabels,
    causalChain: SAMPLE_CHAIN.map((label) => ({ label, prototype: true as const })),
    disclaimer:
      'Sample/prototype evidence only. This causal chain is illustrative. XIV does not claim certainty and no ERP, WMS, or TMS is connected.',
  };
}

export function storyHasPrototypeLabels(story: DiagnosticStory) {
  return (
    story.prototype === true &&
    story.evidenceQuality === 'sample' &&
    story.sourceLabels.includes('prototype_sample') &&
    story.causalChain.every((step) => step.prototype) &&
    story.disclaimer.toLowerCase().includes('prototype')
  );
}
