import { androidReplacesHostOs } from '../pocket/device';
import type { HostPlatform } from './types';

export function xivReplacesHostOperatingSystem(_platform: HostPlatform): boolean {
  return androidReplacesHostOs();
}

export function xivHardwareIsProductionLive(): false {
  return false;
}

export function ownershipEquityPercentageHardcoded(): false {
  return false;
}

export const HOST_PLUG_IN_PLATFORMS: readonly HostPlatform[] = ['IOS', 'ANDROID', 'WINDOWS', 'MACOS', 'WEB', 'DESKTOP', 'TV'];
