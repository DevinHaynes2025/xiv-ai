import { decisionGate, type ConsequenceClass } from './decision-gate';
import { parsePluginManifest, type PluginPermission } from './software-factory-plugins';
import { FACTORY_HONESTY } from './software-factory-types';
import {
  attemptChargeCustomer,
  attemptMutateBilling,
  humanApprovePricing,
  recommendPricing,
  type BundleChannel,
  type CfoCycleInput,
} from './cfo-pricing-engine';
import {
  MARKETPLACE_CHARGE_DENIED,
  type CommunityAudience,
  type ExperienceTier,
  type LocaleCode,
} from './business-os-types';
import { enforceAdultAccess, redactCeoSealed, type AgeAttestation } from './business-os-safety';

export type SdkContract = {
  sdkId: string;
  name: string;
  version: string;
  publisher: string;
  thirdParty: true;
  productionAuthorization: false;
  permissionExpansion: false;
  factoryReleased: false;
  marketplacePublished: false;
  sandboxOnly: true;
};

export function publishDeveloperSdk(input: {
  sdkId: string;
  name: string;
  version: string;
  publisher: string;
  requestedPermissions?: PluginPermission[];
}): { accepted: boolean; sdk: SdkContract | null; reason: string; factoryHonesty: typeof FACTORY_HONESTY } {
  const parsed = parsePluginManifest({
    pluginId: input.sdkId,
    name: input.name,
    version: input.version,
    publisher: input.publisher,
    requestedPermissions: input.requestedPermissions ?? ['read_local_docs', 'write_sandbox_files'],
  });
  if (!parsed.accepted) {
    return { accepted: false, sdk: null, reason: parsed.reason, factoryHonesty: FACTORY_HONESTY };
  }
  return {
    accepted: true,
    sdk: {
      sdkId: parsed.manifest.pluginId,
      name: parsed.manifest.name,
      version: parsed.manifest.version,
      publisher: parsed.manifest.publisher,
      thirdParty: true,
      productionAuthorization: false,
      permissionExpansion: false,
      factoryReleased: false,
      marketplacePublished: false,
      sandboxOnly: true,
    },
    reason: 'Developer SDK is a sandbox contract. It does not release, publish, or grant production authority.',
    factoryHonesty: FACTORY_HONESTY,
  };
}

export type PlatformFeeContract = {
  contractId: string;
  appId: string;
  platformFeeBps: number;
  revenueShareBps: number;
  tier: ExperienceTier;
  recommended: true;
  charged: false;
  billingMutated: false;
  humanApprovalRequired: true;
  executionAuthority: false;
  liveBillingConnected: false;
};

export function recommendPlatformFeeContract(input: {
  contractId: string;
  appId: string;
  platformFeeBps: number;
  revenueShareBps: number;
  tier: ExperienceTier;
}): PlatformFeeContract {
  return {
    contractId: input.contractId,
    appId: input.appId,
    platformFeeBps: input.platformFeeBps,
    revenueShareBps: input.revenueShareBps,
    tier: input.tier,
    recommended: true,
    charged: false,
    billingMutated: false,
    humanApprovalRequired: true,
    executionAuthority: false,
    liveBillingConnected: false,
  };
}

export function attemptMarketplaceCharge(input: { appId: string; amount: number; customerId: string }) {
  const cfo = attemptChargeCustomer({ sku: input.appId, amount: input.amount, customerId: input.customerId });
  return {
    charged: false as const,
    billingMutated: false as const,
    executed: false as const,
    amountCharged: 0 as const,
    cfoAlsoDenied: cfo.charged === false && cfo.executed === false,
    reason: MARKETPLACE_CHARGE_DENIED,
  };
}

export function attemptMarketplaceBillingMutation(input: { appId: string; action: 'create_invoice' | 'change_plan' | 'collect_payment' }) {
  const cfo = attemptMutateBilling({ sku: input.appId, action: input.action });
  return {
    charged: false as const,
    billingMutated: false as const,
    executed: false as const,
    cfoAlsoDenied: cfo.billingMutated === false && cfo.executed === false,
    reason: MARKETPLACE_CHARGE_DENIED,
  };
}

export function humanApproveMarketplaceContract(input: {
  contract: PlatformFeeContract;
  humanPrincipal: 'human_cfo' | 'ceo' | 'agent_marketplace' | 'agent_cfo';
  humanApprove: boolean;
  impersonateFounder?: boolean;
  consequence?: ConsequenceClass;
}) {
  const cfoInput: CfoCycleInput = {
    sku: input.contract.appId,
    name: input.contract.appId,
    features: ['marketplace_contract'],
    fixedCost: 0,
    variableCost: 0,
    unitCost: 0,
    units: 1,
    listPrice: 0,
    channel: input.contract.tier,
    humanPrincipal: input.humanPrincipal === 'agent_marketplace' ? 'agent_cfo' : input.humanPrincipal,
    humanApprove: input.humanApprove,
    consequence: input.consequence ?? 'HIGH',
    impersonateFounder: input.impersonateFounder,
  };
  const approval = humanApprovePricing(cfoInput);
  return {
    ...approval,
    charged: false as const,
    billingMutated: false as const,
    executionAuthority: false as const,
    liveBillingConnected: false as const,
  };
}

export function proveMarketplaceRecommendationIsNotCharge(contract: PlatformFeeContract) {
  const charge = attemptMarketplaceCharge({ appId: contract.appId, amount: 99, customerId: 'cust-probe' });
  const billing = attemptMarketplaceBillingMutation({ appId: contract.appId, action: 'create_invoice' });
  const cfoRec = recommendPricing({
    sku: contract.appId,
    name: contract.appId,
    features: ['marketplace'],
    fixedCost: 1,
    variableCost: 1,
    unitCost: 1,
    units: 1,
    listPrice: 10,
    channel: contract.tier,
    humanPrincipal: 'human_cfo',
    humanApprove: false,
  });
  return {
    recommended: contract.recommended && cfoRec.recommended,
    charged: false as const,
    billingMutated: false as const,
    chargeAttemptDenied: charge.charged === false && charge.executed === false,
    billingAttemptDenied: billing.billingMutated === false && billing.executed === false,
    reason: MARKETPLACE_CHARGE_DENIED,
  };
}

export type MarketplaceListing = {
  appId: string;
  title: string;
  publisher: string;
  tier: ExperienceTier;
  published: false;
  customerAuthorized: false;
  charged: false;
};

export function listAppMarketplace(input: { listings: Array<{ appId: string; title: string; publisher: string; tier: ExperienceTier }> }) {
  return input.listings.map((item) => ({
    ...item,
    published: false as const,
    customerAuthorized: false as const,
    charged: false as const,
  })) satisfies MarketplaceListing[];
}

export function selectExperienceTier(tier: ExperienceTier) {
  return {
    tier,
    liveBillingConnected: false as const,
    hybridDoesNotCharge: true as const,
    offlineOnly: tier === 'offline',
  };
}

export type BusinessBundle = {
  bundleId: string;
  layers: string[];
  executable: false;
  charged: false;
};

export function designBusinessBundle(input: { bundleId: string; layers: string[] }): BusinessBundle {
  return { bundleId: input.bundleId, layers: [...input.layers], executable: false, charged: false };
}

export type OrgDigitalTwinHomepage = {
  orgId: string;
  locale: LocaleCode;
  liveTwinConnected: false;
  productionEffect: false;
  partnershipClaimed: false;
  sealed: ReturnType<typeof redactCeoSealed>;
};

export function orgDigitalTwinHomepage(input: { orgId: string; locale?: LocaleCode; sealedPayload?: string }): OrgDigitalTwinHomepage {
  return {
    orgId: input.orgId,
    locale: input.locale ?? 'en',
    liveTwinConnected: false,
    productionEffect: false,
    partnershipClaimed: false,
    sealed: redactCeoSealed(input.sealedPayload ?? 'org-homepage', Boolean(input.sealedPayload)),
  };
}

export const LOCALE_CATALOG: readonly LocaleCode[] = ['en', 'es', 'fr', 'ar', 'zh', 'hi', 'pt', 'sw'];

export function multilingualExperience(locale: LocaleCode) {
  return {
    locale,
    cataloged: LOCALE_CATALOG.includes(locale),
    translationPartnership: false as const,
    adultGated: true as const,
  };
}

export function openCommunitySurface(input: {
  audience: CommunityAudience;
  age: AgeAttestation;
  locale?: LocaleCode;
}) {
  const age = enforceAdultAccess(input.age);
  if (!age.allowed) {
    return {
      audience: input.audience,
      opened: false as const,
      state: age.state,
      reason: age.reason,
      identityPartnership: false as const,
    };
  }
  return {
    audience: input.audience,
    opened: true as const,
    state: 'PASS' as const,
    reason: `18+ ${input.audience} business community surface. Not a social-network partnership.`,
    identityPartnership: false as const,
    locale: multilingualExperience(input.locale ?? 'en'),
  };
}

export function extensibleEcosystemPlatform(input: {
  sdk: ReturnType<typeof publishDeveloperSdk>;
  marketplace: MarketplaceListing[];
  contract: PlatformFeeContract;
}) {
  return {
    sdkAccepted: input.sdk.accepted,
    marketplaceListings: input.marketplace.length,
    published: false as const,
    charged: false as const,
    productionAuthorization: false as const,
    permissionExpansion: false as const,
    contractRecommended: input.contract.recommended,
    liveBillingConnected: false as const,
  };
}

export type BundleChannelAlias = BundleChannel;
