import { INFORMATION_ROUTING_LOOP } from './information-control-tower-types';
import { predecessorModuleState } from './sovereign-sealed-types';
import {
  CONNECTIVITY_STATES,
  MOBILE_FIRST_LAYERS,
  UX_SHELLS,
  type ConnectivityState,
  type MobileFirstLayer,
  type UxShellId,
} from './sovereign-sealed-types';

export type ResponsiveTokens = {
  breakpointPhoneMax: 599;
  breakpointTabletMax: 1023;
  breakpointLaptopMax: 1439;
  spaceXs: 4;
  spaceSm: 8;
  spaceMd: 16;
  spaceLg: 24;
  spaceXl: 40;
  typeStory: 20;
  typeEvidence: 16;
  typeRaw: 13;
  minTouchTarget: 44;
  contrastRatioMin: 4.5;
  reducedMotion: boolean;
};

export const RESPONSIVE_TOKENS: ResponsiveTokens = {
  breakpointPhoneMax: 599,
  breakpointTabletMax: 1023,
  breakpointLaptopMax: 1439,
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 40,
  typeStory: 20,
  typeEvidence: 16,
  typeRaw: 13,
  minTouchTarget: 44,
  contrastRatioMin: 4.5,
  reducedMotion: false,
};

export type AdaptiveNavigation = {
  shell: UxShellId;
  pattern: 'bottom_tabs' | 'split_pane' | 'rail_control_tower';
  controlTowerPinned: boolean;
};

export type AccessibilityContract = {
  labelled: true;
  focusOrder: MobileFirstLayer[];
  minTouchTarget: 44;
  contrastRatioMin: 4.5;
  reducedMotionHonored: boolean;
  screenReaderSummary: string;
};

export type UxShellContract = {
  id: UxShellId;
  class: 'desktop' | 'laptop' | 'phone' | 'tablet';
  audience: 'executive' | 'consumer_employee' | 'mixed';
  navigation: AdaptiveNavigation;
  layers: MobileFirstLayer[];
  tokens: ResponsiveTokens;
  accessibility: AccessibilityContract;
  physicalDeviceVerified: false;
};

export type SessionContinuity = {
  ticketId: string;
  fromShell: UxShellId;
  toShell: UxShellId;
  deviceBound: true;
  copiesFounderSealed: false;
  requiresTrustGateway: true;
  allowed: boolean;
  reason: string;
};

const SHELL_NAV: Record<UxShellId, AdaptiveNavigation> = {
  desktop_executive: { shell: 'desktop_executive', pattern: 'rail_control_tower', controlTowerPinned: true },
  laptop: { shell: 'laptop', pattern: 'rail_control_tower', controlTowerPinned: true },
  phone_executive: { shell: 'phone_executive', pattern: 'bottom_tabs', controlTowerPinned: false },
  phone_consumer_employee: { shell: 'phone_consumer_employee', pattern: 'bottom_tabs', controlTowerPinned: false },
  tablet_2in1: { shell: 'tablet_2in1', pattern: 'split_pane', controlTowerPinned: true },
};

function shellClass(id: UxShellId): UxShellContract['class'] {
  if (id === 'desktop_executive') return 'desktop';
  if (id === 'laptop') return 'laptop';
  if (id === 'tablet_2in1') return 'tablet';
  return 'phone';
}

function audience(id: UxShellId): UxShellContract['audience'] {
  if (id === 'phone_consumer_employee') return 'consumer_employee';
  if (id === 'tablet_2in1' || id === 'laptop') return 'mixed';
  return 'executive';
}

export function responsiveTokensFor(width: number, reducedMotion = false): ResponsiveTokens {
  void width;
  return { ...RESPONSIVE_TOKENS, reducedMotion };
}

export function selectShell(input: { width: number; audience?: UxShellContract['audience']; executive?: boolean }): UxShellId {
  if (input.width <= RESPONSIVE_TOKENS.breakpointPhoneMax) {
    return input.executive === false && input.audience === 'consumer_employee' ? 'phone_consumer_employee' : 'phone_executive';
  }
  if (input.width <= RESPONSIVE_TOKENS.breakpointTabletMax) return 'tablet_2in1';
  if (input.width <= RESPONSIVE_TOKENS.breakpointLaptopMax) return 'laptop';
  return 'desktop_executive';
}

export function adaptiveNavigation(shell: UxShellId): AdaptiveNavigation {
  return { ...SHELL_NAV[shell] };
}

export function accessibilityContract(shell: UxShellId, reducedMotion = false): AccessibilityContract {
  return {
    labelled: true,
    focusOrder: [...MOBILE_FIRST_LAYERS],
    minTouchTarget: RESPONSIVE_TOKENS.minTouchTarget,
    contrastRatioMin: RESPONSIVE_TOKENS.contrastRatioMin,
    reducedMotionHonored: reducedMotion,
    screenReaderSummary: `${shell} shell. Business story first, evidence second, raw data third.`,
  };
}

export function buildShellContract(shell: UxShellId, reducedMotion = false): UxShellContract {
  return {
    id: shell,
    class: shellClass(shell),
    audience: audience(shell),
    navigation: adaptiveNavigation(shell),
    layers: [...MOBILE_FIRST_LAYERS],
    tokens: responsiveTokensFor(0, reducedMotion),
    accessibility: accessibilityContract(shell, reducedMotion),
    physicalDeviceVerified: false,
  };
}

export function listUxShellContracts(reducedMotion = false): UxShellContract[] {
  return UX_SHELLS.map((shell) => buildShellContract(shell, reducedMotion));
}

export function controlTowerUxSurface() {
  const anPresent = predecessorModuleState('AN') === 'AVAILABLE';
  return {
    reusedControlTowerLoop: anPresent ? INFORMATION_ROUTING_LOOP.slice() : [],
    controlTowerHop: anPresent ? ('control_tower' as const) : null,
    anModule: predecessorModuleState('AN'),
    universalControlTower: true as const,
    duplicatesAnRuntime: false as const,
    physicalControlTowerVerified: false as const,
  };
}

export function connectivityUx(state: ConnectivityState) {
  if (!CONNECTIVITY_STATES.includes(state)) {
    return { state: 'UNKNOWN' as const, eligibleLocalWork: true, liveProviders: 'UNAVAILABLE' as const };
  }
  return {
    state,
    eligibleLocalWork: true as const,
    liveProviders: state === 'live' ? ('UNAVAILABLE' as const) : ('UNAVAILABLE' as const),
    hybridContinuesLocal: state === 'hybrid',
    offlineFirst: state === 'offline' || state === 'hybrid',
  };
}

export function continueSecureSession(input: {
  ticketId: string;
  fromShell: UxShellId;
  toShell: UxShellId;
  trustGatewayVerified: boolean;
  copiesFounderSealed?: boolean;
}): SessionContinuity {
  if (input.copiesFounderSealed) {
    return {
      ticketId: input.ticketId,
      fromShell: input.fromShell,
      toShell: input.toShell,
      deviceBound: true,
      copiesFounderSealed: false,
      requiresTrustGateway: true,
      allowed: false,
      reason: 'Founder-sealed payloads cannot ride session continuity.',
    };
  }
  if (!input.trustGatewayVerified) {
    return {
      ticketId: input.ticketId,
      fromShell: input.fromShell,
      toShell: input.toShell,
      deviceBound: true,
      copiesFounderSealed: false,
      requiresTrustGateway: true,
      allowed: false,
      reason: 'UNVERIFIED_PLATFORM_UNAVAILABLE',
    };
  }
  return {
    ticketId: input.ticketId,
    fromShell: input.fromShell,
    toShell: input.toShell,
    deviceBound: true,
    copiesFounderSealed: false,
    requiresTrustGateway: true,
    allowed: true,
    reason: 'Device-bound session ticket accepted without sealed payload copy.',
  };
}
