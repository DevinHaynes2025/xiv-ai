import { PREMIUM_PRIMARY_NAV } from '../network-os/experience';
import type { SurfaceBreakpoint } from './types';

export const XIV_V5_TOKENS = {
  surface: 'deep_navy_near_black',
  accent: 'restrained_electric_blue',
  hierarchy: 'strong',
  vanityEngagement: false,
  copiesCompetitorIdentity: false,
} as const;

export function v5PrimaryNavUnchanged(): boolean {
  return PREMIUM_PRIMARY_NAV.join(',') === 'home,intelligence,network,meetings,ai';
}

export function layoutForBreakpoint(width: number): SurfaceBreakpoint {
  if (width >= 1280) return 'DESKTOP';
  if (width >= 768) return 'TABLET';
  return 'PHONE';
}

export function v5LayoutContract(breakpoint: SurfaceBreakpoint): {
  columns: 1 | 2 | 3;
  enlargedPhoneOnly: false;
} {
  if (breakpoint === 'DESKTOP') return { columns: 3, enlargedPhoneOnly: false };
  if (breakpoint === 'TABLET') return { columns: 2, enlargedPhoneOnly: false };
  return { columns: 1, enlargedPhoneOnly: false };
}
