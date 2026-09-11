export type PilotConnectivity = 'OFFLINE' | 'HYBRID' | 'ONLINE';
export type PilotClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface PilotModeProfile {
  tenantId: string;
  userId: string;
  deviceId: string;
  connectivity: PilotConnectivity;
  approvedKnowledgePackIds: string[];
  approvedCapabilityIds: string[];
  classificationCeiling: PilotClassification;
  homebaseCheckpointId: string;
}

export interface PilotModeRuntime {
  profile: PilotModeProfile;
  localFirst: true;
  productionMutationAllowed: false;
  topSecretExternalRoutingAllowed: false;
  requiresHomebaseReviewForPromotion: true;
}

export function createPilotModeRuntime(profile: PilotModeProfile): PilotModeRuntime {
  if (!profile.tenantId || !profile.userId || !profile.deviceId) throw new Error('tenant/user/device required');
  if (!profile.homebaseCheckpointId) throw new Error('homebase checkpoint required');
  return {
    profile,
    localFirst: true,
    productionMutationAllowed: false,
    topSecretExternalRoutingAllowed: false,
    requiresHomebaseReviewForPromotion: true,
  };
}
