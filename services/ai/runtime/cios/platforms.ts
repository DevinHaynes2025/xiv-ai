/**
 * Cross-platform capability contracts.
 * XIV does NOT replace host OSes; runs above/alongside as governed BI OS layer.
 * NVIDIA = accelerator provider, not authority layer.
 */

import { PLATFORM_CAPABILITIES, type PlatformCapability } from './types';

export type PlatformCapabilityContract = {
  platform: PlatformCapability;
  replacesHostOs: false;
  nvidiaIsAuthority: false;
  state: 'NOT_CONFIGURED';
  productionLive: false;
};

export type CrossPlatformFabric = {
  platforms: readonly PlatformCapabilityContract[];
  replacesHostOperatingSystems: false;
  nvidiaIsAuthorityLayer: false;
  productionLive: false;
};

export function openCrossPlatformFabric(): CrossPlatformFabric {
  return {
    platforms: PLATFORM_CAPABILITIES.map((platform) => ({
      platform,
      replacesHostOs: false as const,
      nvidiaIsAuthority: false as const,
      state: 'NOT_CONFIGURED' as const,
      productionLive: false as const,
    })),
    replacesHostOperatingSystems: false,
    nvidiaIsAuthorityLayer: false,
    productionLive: false,
  };
}

export function listPlatformCapabilities(): readonly PlatformCapability[] {
  return PLATFORM_CAPABILITIES;
}

export function xivReplacesHostOs(_platform: PlatformCapability): false {
  return false;
}

export function nvidiaIsAuthorityLayer(): false {
  return false;
}

export function nvidiaAcceleratorCreatesAuthority(): false {
  return false;
}

export function routeNvidiaAcceleration(input: {
  guardianApproved: boolean;
  purpose: string;
  claimsAuthority?: boolean;
}) {
  if (input.claimsAuthority === true) {
    return { allowed: false as const, reason: 'nvidia_is_accelerator_not_authority' };
  }
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'guardian_required_for_acceleration' };
  }
  return {
    allowed: true as const,
    accelerator: 'NVIDIA_ACCELERATION' as const,
    authorityGranted: false as const,
    state: 'NOT_CONFIGURED' as const,
  };
}
