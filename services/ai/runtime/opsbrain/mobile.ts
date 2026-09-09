import { androidReplacesHostOs } from '../pocket/device';
import { nativeDesktopPackagingState } from '../everywhere/devices';
import { layoutForBreakpoint } from '../premium/design';
import type { DistributionChannel, DistributionState, MobileSurface } from './types';
import { DISTRIBUTION_CHANNELS, MOBILE_SURFACES } from './types';

export type MobileRuntimeLayer =
  | 'Identity'
  | 'DeviceTrust'
  | 'Guardian'
  | 'UniverseAccess'
  | 'AgentRuntime'
  | 'OfflinePocketBrain'
  | 'Media'
  | 'Search'
  | 'Messaging'
  | 'Workflows'
  | 'Marketplace'
  | 'IndustryPacks';

export type AdaptivePriority =
  | 'alerts'
  | 'approvals'
  | 'agent_conversations'
  | 'scanning'
  | 'meetings'
  | 'supplier_communication'
  | 'intelligence'
  | 'quick_dashboards'
  | 'warehouse_operations'
  | 'maps'
  | 'charts'
  | 'documents'
  | 'command_centers'
  | 'multi_agent_workspaces'
  | 'barcode'
  | 'nfc'
  | 'camera'
  | 'offline_workflows'
  | 'inventory';

export const MOBILE_RUNTIME_LAYERS: readonly MobileRuntimeLayer[] = [
  'Identity',
  'DeviceTrust',
  'Guardian',
  'UniverseAccess',
  'AgentRuntime',
  'OfflinePocketBrain',
  'Media',
  'Search',
  'Messaging',
  'Workflows',
  'Marketplace',
  'IndustryPacks',
];

export function xivSupportsEveryPhone(): false {
  void MOBILE_SURFACES;
  return false;
}

export function xivReplacesHostMobileOs(): false {
  return androidReplacesHostOs();
}

export function nativeDesktopClientShipped(): false {
  void nativeDesktopPackagingState();
  return false;
}

export function distributionChannelState(_channel: DistributionChannel): DistributionState {
  void DISTRIBUTION_CHANNELS;
  return 'FOUNDATION';
}

export function appStoreListingIsLive(): false {
  return false;
}

export function googlePlayListingIsLive(): false {
  return false;
}

export function enterpriseManagedInstallIsLive(): false {
  return false;
}

export function webPwaIsProductionLive(): false {
  return false;
}

export function classifyMobileSurface(input: {
  platform: 'ios' | 'android' | 'web';
  width: number;
  rugged?: boolean;
  foldable?: boolean;
}): MobileSurface {
  if (input.rugged === true) return 'RUGGED_WAREHOUSE';
  if (input.foldable === true) return 'FOLDABLE';
  if (input.platform === 'web') return 'WEB_FALLBACK';
  const breakpoint = layoutForBreakpoint(input.width);
  if (input.platform === 'ios') return breakpoint === 'PHONE' ? 'IPHONE' : 'IPAD';
  return breakpoint === 'PHONE' ? 'ANDROID_PHONE' : 'ANDROID_TABLET';
}

export function adaptivePriorities(surface: MobileSurface): readonly AdaptivePriority[] {
  if (surface === 'RUGGED_WAREHOUSE') {
    return ['barcode', 'nfc', 'camera', 'warehouse_operations', 'offline_workflows', 'inventory', 'scanning'];
  }
  if (surface === 'IPAD' || surface === 'ANDROID_TABLET') {
    return [
      'warehouse_operations',
      'maps',
      'charts',
      'documents',
      'command_centers',
      'multi_agent_workspaces',
      'intelligence',
      'approvals',
    ];
  }
  return [
    'alerts',
    'approvals',
    'agent_conversations',
    'scanning',
    'meetings',
    'supplier_communication',
    'intelligence',
    'quick_dashboards',
  ];
}

export function phoneContainsEntireXiv(): false {
  return false;
}

export function trillionsOfObjectsProven(): false {
  return false;
}
