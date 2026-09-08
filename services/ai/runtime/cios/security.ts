/**
 * Security expansion beyond Twelve — more capability ≠ more authority.
 */

import { SECURITY_EXPANSION_CONTROLS, type SecurityExpansionControl } from './types';

export type SecurityExpansionFabric = {
  controls: readonly SecurityExpansionControl[];
  moreCapabilityMeansMoreAuthority: false;
  bypassable: false;
  productionLive: false;
};

export function openSecurityExpansion(): SecurityExpansionFabric {
  return {
    controls: SECURITY_EXPANSION_CONTROLS,
    moreCapabilityMeansMoreAuthority: false,
    bypassable: false,
    productionLive: false,
  };
}

export function listSecurityExpansionControls(): readonly SecurityExpansionControl[] {
  return SECURITY_EXPANSION_CONTROLS;
}

export function securityExpansionBypassable(): false {
  return false;
}

export function securityExpansionGrantsAuthority(): false {
  return false;
}

export function evaluateSecurityControl(input: {
  control: SecurityExpansionControl;
  enabled: boolean;
  claimsAuthorityBoost?: boolean;
}) {
  if (input.claimsAuthorityBoost === true) {
    return { allowed: false as const, reason: 'more_capability_does_not_mean_more_authority' };
  }
  if (!input.enabled) {
    return { allowed: false as const, reason: 'security_control_required', control: input.control };
  }
  return { allowed: true as const, control: input.control, authorityBoost: false as const };
}
