import type { MarketplaceCategory } from './types';
import { MARKETPLACE_CATEGORIES } from './types';

export type Marketplace = {
  marketplaceId: string;
  paidRankingUndisclosed: false;
  fakeReviewsAllowed: false;
};

export type MarketplaceListing = {
  listingId: string;
  pluginId: string;
  category: MarketplaceCategory;
  published: boolean;
  installedAccess: false;
};

export type MarketplacePublisher = {
  publisherId: string;
  verified: boolean;
};

export type MarketplaceReview = {
  reviewId: string;
  fabricated: false;
  createsVerification: false;
};

export type MarketplaceApproval = {
  listingId: string;
  approved: boolean;
};

export type MarketplaceInstallRequest = {
  listingId: string;
  tenantId: string;
  organizationApproved: boolean;
};

export type MarketplaceLicense = {
  licenseId: string;
  listingId: string;
  tenantId: string;
};

export type MarketplaceEntitlement = {
  entitlementId: string;
  tenantId: string;
  listingId: string;
  grantsRuntimeAuthority: false;
};

export type MarketplaceBillingReference = {
  referenceId: string;
  rawSecret: never;
};

export type MarketplaceTrustSignal = {
  listingId: string;
  followerCount: number;
  affectsSecurityAuthority: false;
};

export type MarketplaceSecurityStatus = {
  listingId: string;
  scanPassed: boolean;
  verifiedByReview: false;
};

export type PrivatePluginCatalog = {
  catalogId: string;
  tenantId: string;
};

export type PrivatePluginListing = {
  listingId: string;
  catalogId: string;
  tenantId: string;
};

export type PrivatePublisher = {
  publisherId: string;
  tenantId: string;
};

export type PrivateEntitlement = {
  entitlementId: string;
  tenantId: string;
};

export type PrivateInstallPolicy = {
  tenantId: string;
  defaultDeny: true;
};

export function createMarketplace(): Marketplace {
  void MARKETPLACE_CATEGORIES;
  return { marketplaceId: 'xiv-marketplace', paidRankingUndisclosed: false, fakeReviewsAllowed: false };
}

export function createMarketplaceListing(input: {
  listingId: string;
  pluginId: string;
  category: MarketplaceCategory;
}): MarketplaceListing {
  return {
    listingId: input.listingId,
    pluginId: input.pluginId,
    category: input.category,
    published: true,
    installedAccess: false,
  };
}

export function marketplaceListingGrantsInstalledAccess(_listing: MarketplaceListing): false {
  return false;
}

export function createMarketplaceReview(input: { fabricated?: boolean }): { allowed: false; reason: string } | MarketplaceReview {
  if (input.fabricated === true) {
    return { allowed: false, reason: 'fake_reviews_denied' };
  }
  return { reviewId: 'review-1', fabricated: false, createsVerification: false };
}

export function marketplaceReviewCreatesVerification(_review: MarketplaceReview): false {
  return false;
}

export function marketplacePaidRankingAllowed(input: { paid: boolean; disclosed: boolean }): boolean {
  if (input.paid && !input.disclosed) return false;
  return true;
}

export function followerCountAffectsSecurityAuthority(_count: number): false {
  return false;
}

export function createPrivateCatalog(tenantId: string): PrivatePluginCatalog {
  return { catalogId: `catalog:${tenantId}`, tenantId };
}

export function readPrivateCatalog(catalog: PrivatePluginCatalog, viewerTenantId: string) {
  if (catalog.tenantId !== viewerTenantId) {
    return { allowed: false as const, reason: 'private_catalog_cannot_leak_cross_tenant' };
  }
  return { allowed: true as const, catalog };
}

export function privateCatalogLeaksCrossTenant(): false {
  return false;
}
