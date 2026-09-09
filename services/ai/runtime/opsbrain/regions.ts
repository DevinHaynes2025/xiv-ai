import type { OpsRegion } from './types';
import { OPS_REGIONS } from './types';

export type ResidencyPolicy = {
  tenantId: string;
  requiredRegion: OpsRegion;
};

export function routeToNearestRegion(input: { requested?: OpsRegion; policy?: ResidencyPolicy }) {
  void OPS_REGIONS;
  if (input.policy && input.requested && input.requested !== input.policy.requiredRegion) {
    return { allowed: false as const, reason: 'data_residency_policy_blocks_cross_region_move' };
  }
  return { allowed: true as const, region: input.policy?.requiredRegion ?? input.requested ?? 'NORTH_AMERICA', live: false as const };
}

export function regionalServicesAreProductionLive(): false {
  return false;
}

export function residencyIsPolicyDriven(): true {
  return true;
}
