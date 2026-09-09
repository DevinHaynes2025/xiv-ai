export type SupplyChainImpact = {
  supplierDelay: true;
  projectedShortage: boolean;
  productionImpact: boolean;
  customerImpact: boolean;
  alternatives: readonly string[];
  financialImpact: boolean;
  evidenceRequired: true;
  executesWithoutApproval: false;
};

export function reasonSupplierDelay(input: { evidence?: string }) {
  if (!input.evidence) {
    return { allowed: false as const, reason: 'supply_chain_reasoning_requires_evidence' };
  }
  return {
    allowed: true as const,
    impact: {
      supplierDelay: true as const,
      projectedShortage: true,
      productionImpact: true,
      customerImpact: true,
      alternatives: ['alternate_supplier'],
      financialImpact: true,
      evidenceRequired: true as const,
      executesWithoutApproval: false as const,
    } satisfies SupplyChainImpact,
  };
}

export function createExecutiveBrief(input: { evidence?: string; confidence?: 'low' | 'medium' }) {
  if (!input.evidence) {
    return { allowed: false as const, reason: 'executive_recommendation_requires_evidence' };
  }
  return {
    allowed: true as const,
    brief: {
      whatHappened: 'Observed supplier delay',
      whyItMatters: 'May affect fulfillment',
      businessImpact: 'Projected shortage',
      evidence: input.evidence,
      options: ['wait', 'reallocate', 'alternate_supplier'],
      risks: ['late_delivery'],
      recommendation: 'Review alternate supplier',
      decisionNeeded: true,
      owner: 'operations',
      deadline: 'human_set',
      confidence: input.confidence ?? 'low',
      certainty: false as const,
    },
  };
}
