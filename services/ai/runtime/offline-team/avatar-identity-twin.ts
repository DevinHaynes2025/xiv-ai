import { createHash } from 'node:crypto';

export interface AvatarIdentityTwin {
  avatarId: string;
  tenantId: string;
  userId: string;
  displayName: string;
  localProfileRef: string;
  cloudProfileRef?: string;
  permissionRefs: string[];
  preferenceRefs: string[];
  modelContextRefs: string[];
  literalPersonClone: false;
  updatedAt: string;
}

export function buildAvatarIdentityTwin(input: Omit<AvatarIdentityTwin, 'avatarId' | 'literalPersonClone'>): AvatarIdentityTwin {
  if (!input.tenantId || !input.userId || !input.localProfileRef) throw new Error('tenant, user, and local profile required');
  const digest = createHash('sha256').update(`${input.tenantId}:${input.userId}:${input.localProfileRef}`).digest('hex');
  return { ...input, avatarId: `avatar:${digest.slice(0, 32)}`, literalPersonClone: false };
}

export const AVATAR_IDENTITY_GUARDRAILS = {
  literalCloneAllowed: false,
  cloudSyncRequiresConsent: true,
  crossTenantSharingAllowed: false,
  topSecretClientExposureAllowed: false,
  userCanRevokeSync: true,
};
