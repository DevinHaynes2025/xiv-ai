/**
 * 62L-AY Package logic — Basic / Pro / Elite / Enterprise / Government / Builder.
 * Entitlements are labeled capabilities — label alone ≠ access.
 * Packages do not grant autonomy. Package councils recommend; recommendations ≠ charge/deploy.
 */

import { decisionGate, type ConsequenceClass } from './decision-gate';
import {
  attemptChargeCustomer,
  attemptMutateBilling,
} from './cfo-pricing-engine';
import {
  AY_HONESTY,
  COUNCIL_RECOMMENDATION_ONLY,
  LABEL_IS_NOT_ACCESS,
  PACKAGE_NO_AUTONOMY,
  PACKAGE_TIERS,
  type PackageTier,
} from './growth-media-onboarding-types';

export type EntitlementLabel =
  | 'offline_brain'
  | 'media_prep'
  | 'data_refinery'
  | 'package_council'
  | 'builder_tools'
  | 'gov_compartment'
  | 'enterprise_ops'
  | 'autonomy_l4'; // labeled only — never granted by package

export type PackageDefinition = {
  tier: PackageTier;
  name: string;
  labeledEntitlements: EntitlementLabel[];
  /** Access grants require separate authorization — labels alone never grant. */
  accessGranted: false;
  autonomyGranted: false;
  executable: false;
  productionAuthorized: false;
};

export type EntitlementCheck = {
  tier: PackageTier;
  label: EntitlementLabel;
  labeled: boolean;
  access: false;
  autonomy: false;
  reason: string;
};

export type PackageCouncilRole = 'cfo' | 'coo' | 'executive';

export type PackageCouncilRecommendation = {
  role: PackageCouncilRole;
  recommendedTier: PackageTier;
  rationale: string;
  recommended: true;
  charged: false;
  deployed: false;
  billingMutated: false;
  autonomyGranted: false;
  humanApprovalRequired: true;
  executionAuthority: false;
  lock: typeof COUNCIL_RECOMMENDATION_ONLY;
};

const PACKAGE_CATALOG: Record<PackageTier, EntitlementLabel[]> = {
  basic: ['offline_brain'],
  pro: ['offline_brain', 'media_prep'],
  elite: ['offline_brain', 'media_prep', 'data_refinery', 'package_council'],
  enterprise: ['offline_brain', 'media_prep', 'data_refinery', 'package_council', 'enterprise_ops'],
  government: ['offline_brain', 'media_prep', 'data_refinery', 'package_council', 'enterprise_ops', 'gov_compartment'],
  builder: ['offline_brain', 'media_prep', 'data_refinery', 'package_council', 'builder_tools'],
};

export function listPackages(): PackageDefinition[] {
  return PACKAGE_TIERS.map((tier) => ({
    tier,
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    labeledEntitlements: [...PACKAGE_CATALOG[tier]],
    accessGranted: false,
    autonomyGranted: false,
    executable: false,
    productionAuthorized: false,
  }));
}

export function selectPackage(tier: PackageTier): PackageDefinition {
  const found = listPackages().find((p) => p.tier === tier);
  if (!found) throw new Error('UNKNOWN_PACKAGE_TIER');
  return found;
}

/** Label alone ≠ access. Even if labeled, access remains false until separate human auth. */
export function checkEntitlement(tier: PackageTier, label: EntitlementLabel): EntitlementCheck {
  const pkg = selectPackage(tier);
  const labeled = pkg.labeledEntitlements.includes(label);
  if (label === 'autonomy_l4') {
    return {
      tier,
      label,
      labeled: false,
      access: false,
      autonomy: false,
      reason: `${PACKAGE_NO_AUTONOMY}; L4_AUTONOMY_ENABLED=${AY_HONESTY.L4_AUTONOMY_ENABLED}`,
    };
  }
  return {
    tier,
    label,
    labeled,
    access: false,
    autonomy: false,
    reason: labeled
      ? `${LABEL_IS_NOT_ACCESS}; labeled capability requires separate authorization`
      : 'ENTITLEMENT_NOT_LABELED_ON_PACKAGE',
  };
}

export function proveLabelIsNotAccess(tier: PackageTier, label: EntitlementLabel) {
  const check = checkEntitlement(tier, label);
  return {
    labeled: check.labeled,
    access: check.access,
    autonomy: check.autonomy,
    labelIsNotAccess: check.labeled === true && check.access === false,
    packageDoesNotGrantAutonomy: check.autonomy === false && AY_HONESTY.l4AutonomyEnabled === false,
  };
}

export function convenePackageCouncil(input: {
  role: PackageCouncilRole;
  recommendedTier: PackageTier;
  rationale: string;
  humanPrincipal: 'human_cfo' | 'human_coo' | 'human_executive' | 'agent_council';
  humanApprove: boolean;
  consequence?: ConsequenceClass;
  impersonateFounder?: boolean;
}): PackageCouncilRecommendation & {
  approved: boolean;
  charged: false;
  deployed: false;
  state: 'PASS' | 'DENIED';
  reason: string;
} {
  if (input.impersonateFounder) {
    return {
      role: input.role,
      recommendedTier: input.recommendedTier,
      rationale: input.rationale,
      recommended: true,
      charged: false,
      deployed: false,
      billingMutated: false,
      autonomyGranted: false,
      humanApprovalRequired: true,
      executionAuthority: false,
      lock: COUNCIL_RECOMMENDATION_ONLY,
      approved: false,
      state: 'DENIED',
      reason: 'FOUNDER_IMPERSONATION_DENIED',
    };
  }

  if (input.humanPrincipal === 'agent_council') {
    return {
      role: input.role,
      recommendedTier: input.recommendedTier,
      rationale: input.rationale,
      recommended: true,
      charged: false,
      deployed: false,
      billingMutated: false,
      autonomyGranted: false,
      humanApprovalRequired: true,
      executionAuthority: false,
      lock: COUNCIL_RECOMMENDATION_ONLY,
      approved: false,
      state: 'DENIED',
      reason: 'AGENT_COUNCIL_CANNOT_APPROVE_CHARGE_OR_DEPLOY',
    };
  }

  const gate = decisionGate({
    id: `pkg_council_${input.role}`,
    action: 'package_recommendation',
    consequence: input.consequence ?? 'HIGH',
    production: false,
    financialCommitment: true,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const approved = Boolean(input.humanApprove && gate.humanApprovalRequired);
  return {
    role: input.role,
    recommendedTier: input.recommendedTier,
    rationale: input.rationale,
    recommended: true,
    charged: false,
    deployed: false,
    billingMutated: false,
    autonomyGranted: false,
    humanApprovalRequired: true,
    executionAuthority: false,
    lock: COUNCIL_RECOMMENDATION_ONLY,
    approved,
    state: approved ? 'PASS' : 'DENIED',
    reason: approved
      ? `${COUNCIL_RECOMMENDATION_ONLY}; human noted recommendation — still not charge/deploy`
      : gate.reason,
  };
}

export function attemptChargeFromPackageCouncil(): {
  charged: false;
  executed: false;
  amountCharged: 0;
  billingMutated: false;
  cfoChargeDenied: true;
  reason: string;
} {
  const cfo = attemptChargeCustomer({ sku: 'package-council', amount: 1, customerId: 'council-probe' });
  const billing = attemptMutateBilling({ sku: 'package-council', action: 'change_plan' });
  return {
    charged: false,
    executed: false,
    amountCharged: 0,
    billingMutated: false,
    cfoChargeDenied: cfo.charged === false && billing.billingMutated === false,
    reason: COUNCIL_RECOMMENDATION_ONLY,
  };
}

export function attemptMutateBillingFromPackageCouncil() {
  const billing = attemptMutateBilling({ sku: 'package-council', action: 'collect_payment' });
  return {
    billingMutated: false as const,
    executed: false as const,
    charged: false as const,
    cfoBillingMutated: billing.billingMutated,
    reason: COUNCIL_RECOMMENDATION_ONLY,
  };
}

export function attemptDeployFromPackageCouncil(): {
  deployed: false;
  executed: false;
  reason: string;
} {
  return {
    deployed: false,
    executed: false,
    reason: COUNCIL_RECOMMENDATION_ONLY,
  };
}
