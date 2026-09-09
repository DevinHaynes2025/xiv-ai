import { decisionGate, type ConsequenceClass } from './decision-gate';
import {
  CFO_RECOMMENDATION_IS_NOT_CHARGE,
  type AvEvidenceState,
} from './universal-runtime-types';

export type BundleChannel = 'offline' | 'hybrid' | 'live';

export type CostModel = {
  sku: string;
  fixedCost: number;
  variableCost: number;
  unitCost: number;
  units: number;
};

export type PackageDesign = {
  sku: string;
  name: string;
  features: string[];
  executable: false;
};

export type PricingScenario = {
  sku: string;
  channel: BundleChannel;
  listPrice: number;
  discount: number;
  netPrice: number;
};

export type MarginResult = {
  netPrice: number;
  unitCost: number;
  unitMargin: number;
  marginRate: number | null;
  state: AvEvidenceState;
};

export type BreakEvenResult = {
  units: number | null;
  state: AvEvidenceState;
  reason: string;
};

export type SensitivityRow = {
  priceDelta: number;
  netPrice: number;
  unitMargin: number;
  breakEvenUnits: number | null;
};

export type CfoRecommendation = {
  sku: string;
  channel: BundleChannel;
  recommendedPrice: number;
  recommended: true;
  charged: false;
  billingMutated: false;
  humanApprovalRequired: true;
  executionAuthority: false;
};

export type CfoCycleInput = {
  sku: string;
  name: string;
  features: string[];
  fixedCost: number;
  variableCost: number;
  unitCost: number;
  units: number;
  listPrice: number;
  discount?: number;
  channel: BundleChannel;
  humanPrincipal: 'human_cfo' | 'ceo' | 'agent_cfo';
  humanApprove: boolean;
  consequence?: ConsequenceClass;
  impersonateFounder?: boolean;
};

export function modelCost(input: CostModel) {
  const total = input.fixedCost + input.variableCost * input.units;
  return {
    ...input,
    totalCost: total,
    productionWrite: false as const,
    billingMutated: false as const,
  };
}

export function designPackage(input: { sku: string; name: string; features: string[] }): PackageDesign {
  return { sku: input.sku, name: input.name, features: [...input.features], executable: false };
}

export function selectBundle(channel: BundleChannel) {
  return {
    channel,
    liveBillingConnected: false as const,
    hybridDoesNotCharge: true as const,
    offlineOnly: channel === 'offline',
  };
}

export function priceScenario(input: { sku: string; channel: BundleChannel; listPrice: number; discount?: number }): PricingScenario {
  const discount = Math.max(0, Math.min(1, input.discount ?? 0));
  return {
    sku: input.sku,
    channel: input.channel,
    listPrice: input.listPrice,
    discount,
    netPrice: input.listPrice * (1 - discount),
  };
}

export function computeMargin(netPrice: number, unitCost: number): MarginResult {
  const unitMargin = netPrice - unitCost;
  if (!(netPrice > 0)) {
    return { netPrice, unitCost, unitMargin, marginRate: null, state: 'UNAVAILABLE' };
  }
  return { netPrice, unitCost, unitMargin, marginRate: unitMargin / netPrice, state: 'PASS' };
}

export function breakEven(fixedCost: number, netPrice: number, variableCost: number): BreakEvenResult {
  const contribution = netPrice - variableCost;
  if (!(contribution > 0)) {
    return { units: null, state: 'UNAVAILABLE', reason: 'Non-positive contribution margin. Break-even is not invented.' };
  }
  return { units: fixedCost / contribution, state: 'PASS', reason: 'Classical break-even = fixed / (price - variable).' };
}

export function sensitivity(input: { listPrice: number; unitCost: number; variableCost: number; fixedCost: number; deltas?: number[] }) {
  const deltas = input.deltas ?? [-0.1, 0, 0.1];
  const rows: SensitivityRow[] = deltas.map((priceDelta) => {
    const netPrice = input.listPrice * (1 + priceDelta);
    const unitMargin = netPrice - input.unitCost;
    const be = breakEven(input.fixedCost, netPrice, input.variableCost);
    return { priceDelta, netPrice, unitMargin, breakEvenUnits: be.units };
  });
  return { rows, inventedOptimum: false as const };
}

export function recommendPricing(input: CfoCycleInput): CfoRecommendation {
  const scenario = priceScenario(input);
  return {
    sku: input.sku,
    channel: input.channel,
    recommendedPrice: scenario.netPrice,
    recommended: true,
    charged: false,
    billingMutated: false,
    humanApprovalRequired: true,
    executionAuthority: false,
  };
}

export function humanApprovePricing(input: CfoCycleInput) {
  if (input.impersonateFounder) {
    return {
      accepted: false as const,
      approved: false as const,
      charged: false as const,
      billingMutated: false as const,
      reason: 'FOUNDER_IMPERSONATION_DENIED',
    };
  }
  if (input.humanPrincipal === 'agent_cfo') {
    return {
      accepted: false as const,
      approved: false as const,
      charged: false as const,
      billingMutated: false as const,
      reason: 'AGENT_CFO_CANNOT_APPROVE',
    };
  }
  const gate = decisionGate({
    id: `cfo-${input.sku}`,
    action: 'approve_pricing_recommendation',
    consequence: input.consequence ?? 'HIGH',
    production: true,
    financialCommitment: true,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  if (!input.humanApprove) {
    return {
      accepted: false as const,
      approved: false as const,
      charged: false as const,
      billingMutated: false as const,
      reason: 'HUMAN_APPROVAL_REQUIRED',
      gate,
    };
  }
  return {
    accepted: true as const,
    approved: true as const,
    charged: false as const,
    billingMutated: false as const,
    reason: 'Human approved the recommendation. Approval is not a charge or billing mutation.',
    gate,
    executionAuthority: false as const,
  };
}

export function attemptChargeCustomer(_input: { sku: string; amount: number; customerId: string }) {
  return {
    charged: false as const,
    billingMutated: false as const,
    executed: false as const,
    amountCharged: 0 as const,
    reason: CFO_RECOMMENDATION_IS_NOT_CHARGE,
  };
}

export function attemptMutateBilling(_input: { sku: string; action: 'create_invoice' | 'change_plan' | 'collect_payment' }) {
  return {
    charged: false as const,
    billingMutated: false as const,
    executed: false as const,
    reason: CFO_RECOMMENDATION_IS_NOT_CHARGE,
  };
}

export function proveRecommendationIsNotCharge(recommendation: CfoRecommendation) {
  const charge = attemptChargeCustomer({ sku: recommendation.sku, amount: recommendation.recommendedPrice, customerId: 'cust-probe' });
  const billing = attemptMutateBilling({ sku: recommendation.sku, action: 'create_invoice' });
  return {
    recommended: recommendation.recommended,
    charged: false as const,
    billingMutated: false as const,
    chargeAttemptDenied: charge.charged === false && charge.executed === false,
    billingAttemptDenied: billing.billingMutated === false && billing.executed === false,
    reason: CFO_RECOMMENDATION_IS_NOT_CHARGE,
  };
}
