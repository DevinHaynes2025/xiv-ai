import { providerSlots } from './provider-fabric';
import {
  TRUST_PLATFORMS,
  UNVERIFIED_PLATFORM_UNAVAILABLE,
  type AxEvidenceState,
  type TrustPlatform,
} from './sovereign-sealed-types';

export type PlatformTrustRecord = {
  platform: TrustPlatform;
  registered: boolean;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  state: AxEvidenceState;
  reason: string;
};

const DEFAULT_UNVERIFIED: Omit<PlatformTrustRecord, 'platform'> = {
  registered: false,
  configured: false,
  authorized: false,
  verified: false,
  state: 'UNAVAILABLE',
  reason: UNVERIFIED_PLATFORM_UNAVAILABLE,
};

export function listTrustPlatforms(): readonly TrustPlatform[] {
  return TRUST_PLATFORMS;
}

export function evaluatePlatformTrust(input: {
  platform: TrustPlatform;
  registered?: boolean;
  configured?: boolean;
  authorized?: boolean;
  verified?: boolean;
}): PlatformTrustRecord {
  if (!TRUST_PLATFORMS.includes(input.platform)) {
    return {
      platform: 'web',
      ...DEFAULT_UNVERIFIED,
      reason: UNVERIFIED_PLATFORM_UNAVAILABLE,
    };
  }
  const registered = Boolean(input.registered);
  const configured = Boolean(input.configured);
  const authorized = Boolean(input.authorized);
  const verified = Boolean(input.verified);
  if (!(registered && configured && authorized && verified)) {
    return {
      platform: input.platform,
      registered,
      configured,
      authorized,
      verified: false,
      state: 'UNAVAILABLE',
      reason: UNVERIFIED_PLATFORM_UNAVAILABLE,
    };
  }
  return {
    platform: input.platform,
    registered: true,
    configured: true,
    authorized: true,
    verified: true,
    state: 'PASS',
    reason: 'Platform completed registered → configured → authorized → verified.',
  };
}

export function defaultGatewayMatrix(): PlatformTrustRecord[] {
  return TRUST_PLATFORMS.map((platform) => evaluatePlatformTrust({ platform }));
}

export function gatewayProviderHonesty() {
  return providerSlots().map((slot) => ({
    provider: slot.provider,
    state: slot.state,
    configured: slot.configured,
    authorized: slot.authorized,
  }));
}

export function assertUnverifiedUnavailable(record: PlatformTrustRecord) {
  if (record.verified && record.state === 'PASS') return record;
  return {
    ...record,
    verified: false,
    state: 'UNAVAILABLE' as const,
    reason: UNVERIFIED_PLATFORM_UNAVAILABLE,
  };
}
