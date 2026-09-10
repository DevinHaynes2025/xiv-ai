export type UniverseHomeMode = 'PERSONAL' | 'BUSINESS' | 'COMMUNITY' | 'LEARNING' | 'INNOVATION';

export interface AvatarUniverseHome {
  tenantId: string;
  userId: string;
  avatarId: string;
  mode: UniverseHomeMode;
  greeting: string;
  recommendedActions: string[];
  agentStatusRefs: string[];
  privacySummaryRef: string;
  securitySummaryRef: string;
  marketplaceBundleIds: string[];
  offlineReady: boolean;
}

export function buildAvatarUniverseHome(input: AvatarUniverseHome): AvatarUniverseHome {
  if (!input.tenantId || !input.userId || !input.avatarId) throw new Error('tenant, user and avatar required');
  if (!input.privacySummaryRef || !input.securitySummaryRef) throw new Error('privacy and security summaries required');
  return { ...input, recommendedActions: input.recommendedActions.slice(0, 8), marketplaceBundleIds: [...new Set(input.marketplaceBundleIds)] };
}

export const AVATAR_UNIVERSE_HOME_GUARDRAILS = {
  literalPersonClone: false,
  localFirstIdentity: true,
  cloudSyncRequiresConsent: true,
  crossTenantIdentityLinkingAllowed: false,
  topSecretClientExposureAllowed: false,
};
