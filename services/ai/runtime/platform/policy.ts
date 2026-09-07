import type { DeveloperDocContract, DesktopFoundationSurface, EnterprisePolicyPackKind } from './types';
import { DEVELOPER_DOC_CONTRACTS, DESKTOP_FOUNDATION_SURFACES } from './types';

export type PlatformLicense = { licenseId: string; grantsAuthorization: false };
export type OrganizationLicense = { organizationId: string; licenseId: string };
export type PluginLicense = { pluginId: string; licenseId: string };
export type IndustryPackLicense = { packId: string; licenseId: string };
export type OEMLicense = { partnerId: string; live: false };
export type DeveloperLicense = { developerId: string; licenseId: string };
export type Entitlement = { entitlementId: string; overridesAuthorization: false };
export type LicensePolicy = { authorizationRequired: true };
export type LicenseAudit = { eventId: string; licenseId: string };

export type EnterprisePolicyPack = {
  kind: EnterprisePolicyPackKind;
  restrictsCapabilities: true;
  pluginOverride: false;
};

export function createLicense(kind: 'platform' | 'organization' | 'plugin' | 'industry' | 'oem' | 'developer'): PlatformLicense {
  void kind;
  return { licenseId: `${kind}-license`, grantsAuthorization: false };
}

export function licenseOverridesAuthorization(_license: PlatformLicense | Entitlement): false {
  return false;
}

export function evaluateLicensedAction(input: { licensed: boolean; authorized: boolean }) {
  if (input.authorized !== true) {
    return { allowed: false as const, reason: 'license_cannot_override_authorization' };
  }
  if (input.licensed !== true) {
    return { allowed: false as const, reason: 'license_required' };
  }
  return { allowed: true as const };
}

export function createEnterprisePolicyPack(kind: EnterprisePolicyPackKind): EnterprisePolicyPack {
  return { kind, restrictsCapabilities: true, pluginOverride: false };
}

export function pluginOverridesEnterprisePolicy(_pack: EnterprisePolicyPack): false {
  return false;
}

export function evaluatePluginAgainstPolicy(input: {
  pack: EnterprisePolicyPack;
  pluginRequestsOverride: boolean;
}) {
  if (input.pluginRequestsOverride) {
    return { allowed: false as const, reason: 'plugin_cannot_override_enterprise_policy' };
  }
  return { allowed: true as const, restricted: input.pack.restrictsCapabilities };
}

export function developerDocContract(name: DeveloperDocContract): { name: DeveloperDocContract; architectureOnly: true } {
  void DEVELOPER_DOC_CONTRACTS;
  return { name, architectureOnly: true };
}

export function desktopFoundationSurface(name: DesktopFoundationSurface): {
  name: DesktopFoundationSurface;
  nativeBinary: false;
} {
  void DESKTOP_FOUNDATION_SURFACES;
  return { name, nativeBinary: false };
}
