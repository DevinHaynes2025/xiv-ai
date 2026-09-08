/**
 * Legitimate GPS business module uses only.
 */

import { LOCATION_PURPOSES, type LocationPurpose } from './types';

export type LocationBusinessModule = {
  purpose: LocationPurpose;
  legitimate: true;
  covert: false;
};

export function listLocationBusinessModules(): readonly LocationBusinessModule[] {
  return LOCATION_PURPOSES.map((purpose) => ({
    purpose,
    legitimate: true as const,
    covert: false as const,
  }));
}

export function isLegitimateLocationPurpose(purpose: LocationPurpose): true {
  void purpose;
  return true;
}

export function denyCovertLocationUse(): { allowed: false; reason: string } {
  return { allowed: false, reason: 'covert_tracking_forbidden' };
}
