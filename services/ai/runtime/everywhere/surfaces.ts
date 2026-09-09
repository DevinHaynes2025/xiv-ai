import { nativeDesktopPackagingState } from './devices';
import { capabilityAvailabilityForSurface } from './capabilities';
import type { SurfaceLayout } from './types';

export type SurfacePreview = {
  layout: SurfaceLayout;
  priorities: readonly string[];
  nativePackaging: 'NOT_IMPLEMENTED';
  fabricatedAvailability: false;
};

export function layoutForWidth(width: number): SurfaceLayout {
  if (width >= 1280) return 'DESKTOP_WORKSPACE';
  if (width >= 1024) return 'WEB_RESPONSIVE';
  if (width >= 768) return 'TABLET_EXPANDED';
  return 'PHONE_COMPACT';
}

export function surfacePreview(layout: SurfaceLayout): SurfacePreview {
  const priorities =
    layout === 'PHONE_COMPACT'
      ? ['alerts', 'approvals', 'ai', 'messages', 'scan', 'quick_intelligence', 'gps_operations']
      : layout === 'TABLET_EXPANDED'
        ? ['operations', 'charts', 'sheets', 'meetings', 'warehouse', 'field_dashboards']
        : ['multi_panel', 'sheets', 'docs', 'research_rooms', 'company_brain', 'security_command', 'agent_command', 'administration'];
  return {
    layout,
    priorities,
    nativePackaging: nativeDesktopPackagingState(),
    fabricatedAvailability: false,
  };
}

export function surfaceCapabilitiesDoNotFabricateAvailability(): boolean {
  for (const surface of ['phone', 'tablet', 'desktop', 'web'] as const) {
    const availability = capabilityAvailabilityForSurface(surface);
    if (availability.location === 'GRANTED' || availability.camera === 'GRANTED') return false;
    if (availability.nativePackaging === 'GRANTED') return false;
  }
  return nativeDesktopPackagingState() === 'NOT_IMPLEMENTED';
}

export function supportedDeviceSurfaces() {
  return {
    phone: { ios: true, android: true, packaging: 'expo_mobile' as const, productionStoreListing: false },
    tablet: { ipad: true, androidTablet: true, adaptive: true, productionStoreListing: false },
    desktop: { windows: false, macos: false, linux: false, packaging: nativeDesktopPackagingState() },
    web: { responsive: true, productionHost: false },
    future: { xr: false, vehicle: false, industrial: false },
  };
}
