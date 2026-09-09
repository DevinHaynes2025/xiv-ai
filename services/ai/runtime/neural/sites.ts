/**
 * Site preview / sandbox surfaces only. Not production hosting.
 */

export type SitePreview = {
  previewId: string;
  productionHosted: false;
  publicHostingEnabled: false;
  sandboxOnly: true;
};

export type SiteSandbox = {
  sandboxId: string;
  accessesProductionData: false;
  canPublishWithoutApproval: false;
};

export type SitePublishGate = {
  humanApproved: boolean;
  securityReviewed: boolean;
  guardianApproved: boolean;
};

export function openSitePreview(input: { tenantId: string; universeId: string }): SitePreview {
  return {
    previewId: `site-preview:${input.tenantId}:${input.universeId}`,
    productionHosted: false,
    publicHostingEnabled: false,
    sandboxOnly: true,
  };
}

export function openSiteSandbox(input: { tenantId: string }): SiteSandbox {
  return {
    sandboxId: `site-sandbox:${input.tenantId}`,
    accessesProductionData: false,
    canPublishWithoutApproval: false,
  };
}

export function publishSite(input: SitePublishGate & { selfPublish: boolean }) {
  if (input.selfPublish) {
    return { allowed: false as const, reason: 'site_cannot_self_publish_to_production' };
  }
  if (!(input.humanApproved && input.securityReviewed && input.guardianApproved)) {
    return { allowed: false as const, reason: 'site_publish_requires_approvals' };
  }
  return { allowed: false as const, reason: 'production_hosting_not_enabled_in_phase_2iw' };
}

export function sitesAreProductionHosted(): false {
  return false;
}

export function siteSandboxAccessesProduction(): false {
  return false;
}
