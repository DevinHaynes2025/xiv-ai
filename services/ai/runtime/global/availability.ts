import type { CapabilityStatus, DeploymentCapability } from './types';

export const CONCEPTUAL_DEPLOY_REGIONS = [
  'us',
  'europe',
  'africa',
  'asia_pacific',
  'china_specialized',
  'middle_east',
  'south_america',
] as const;

export function capabilityNotConfigured(regionId: string): DeploymentCapability {
  return {
    regionId,
    regionAvailability: 'not_configured',
    dataResidencyRequirement: 'requires_legal_review',
    providerAvailability: 'not_configured',
    modelAvailability: 'not_configured',
    storageAvailability: 'not_configured',
    integrationAvailability: 'not_configured',
    complianceReviewRequired: true,
    deployed: false,
  };
}

export function chinaDeploymentCapability(): DeploymentCapability {
  return {
    regionId: 'china_specialized',
    regionAvailability: 'not_configured',
    dataResidencyRequirement: 'requires_legal_review',
    providerAvailability: 'requires_local_partner',
    modelAvailability: 'requires_legal_review',
    storageAvailability: 'requires_local_partner',
    integrationAvailability: 'requires_legal_review',
    complianceReviewRequired: true,
    deployed: false,
  };
}

export function xivIsDeployedInChina() {
  return false;
}

export function regionalFailoverStatus(): CapabilityStatus {
  return 'not_configured';
}

export function regionalFailoverIsPlanned() {
  return {
    status: 'planned' as const,
    currentResources: false,
    reason: 'Regional failover is architected. No cloud region resources are provisioned in this phase.',
  };
}
