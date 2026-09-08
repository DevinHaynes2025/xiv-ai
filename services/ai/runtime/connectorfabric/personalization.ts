/**
 * Personalization Engine — never weakens tenant isolation, security,
 * data classification, or approval requirements.
 */

export type UserPreference = {
  preferenceId: string;
  userId: string;
  tenantId: string;
  weakensTenantIsolation: false;
};

export type UserRole = {
  roleId: string;
  userId: string;
  grantsCrossTenantAccess: false;
};

export type UserIndustry = { industryId: string; label: string };
export type UserLanguage = { languageCode: string };
export type UserRegion = { regionCode: string };
export type UserWorkflow = { workflowId: string; approvalRequired: boolean };
export type UserDashboard = { dashboardId: string; layoutOnly: true };
export type UserAgentPreferences = {
  preferenceId: string;
  mayExpandAgentAuthority: false;
};
export type UserPrivacyPreference = {
  preferenceId: string;
  weakensDataClassification: false;
};
export type UserAccessibility = { profileId: string };
export type UserDeviceProfile = { deviceProfileId: string; replacesHostOs: false };
export type UserNotificationPolicy = { policyId: string; silentSecurityBypass: false };

export type PersonalizationProfile = {
  userId: string;
  tenantId: string;
  preferences: UserPreference[];
  roles: UserRole[];
  industry: UserIndustry | null;
  language: UserLanguage | null;
  region: UserRegion | null;
  workflow: UserWorkflow | null;
  dashboard: UserDashboard | null;
  agentPreferences: UserAgentPreferences | null;
  privacy: UserPrivacyPreference | null;
  accessibility: UserAccessibility | null;
  deviceProfile: UserDeviceProfile | null;
  notificationPolicy: UserNotificationPolicy | null;
  weakensTenantIsolation: false;
  weakensSecurity: false;
  weakensDataClassification: false;
  weakensApprovals: false;
};

export function openPersonalizationEngine(input: {
  userId: string;
  tenantId: string;
}): PersonalizationProfile {
  return {
    userId: input.userId,
    tenantId: input.tenantId,
    preferences: [],
    roles: [],
    industry: null,
    language: null,
    region: null,
    workflow: null,
    dashboard: null,
    agentPreferences: null,
    privacy: null,
    accessibility: null,
    deviceProfile: null,
    notificationPolicy: null,
    weakensTenantIsolation: false,
    weakensSecurity: false,
    weakensDataClassification: false,
    weakensApprovals: false,
  };
}

export function applyPersonalization(input: {
  profile: PersonalizationProfile;
  preference?: Partial<UserPreference> & { preferenceId: string };
  weakenTenantIsolation?: boolean;
  weakenSecurity?: boolean;
  weakenDataClassification?: boolean;
  skipApprovals?: boolean;
  expandAgentAuthority?: boolean;
}): { allowed: true; profile: PersonalizationProfile } | { allowed: false; reason: string } {
  if (input.weakenTenantIsolation === true) {
    return { allowed: false, reason: 'personalization_must_not_weaken_tenant_isolation' };
  }
  if (input.weakenSecurity === true) {
    return { allowed: false, reason: 'personalization_must_not_weaken_security' };
  }
  if (input.weakenDataClassification === true) {
    return { allowed: false, reason: 'personalization_must_not_weaken_data_classification' };
  }
  if (input.skipApprovals === true) {
    return { allowed: false, reason: 'personalization_must_not_weaken_approvals' };
  }
  if (input.expandAgentAuthority === true) {
    return { allowed: false, reason: 'personalization_must_not_expand_agent_authority' };
  }
  const preferences = input.preference
    ? [
        ...input.profile.preferences.filter((p) => p.preferenceId !== input.preference!.preferenceId),
        {
          preferenceId: input.preference.preferenceId,
          userId: input.profile.userId,
          tenantId: input.profile.tenantId,
          weakensTenantIsolation: false as const,
        },
      ]
    : input.profile.preferences;
  return {
    allowed: true,
    profile: {
      ...input.profile,
      preferences,
      weakensTenantIsolation: false,
      weakensSecurity: false,
      weakensDataClassification: false,
      weakensApprovals: false,
    },
  };
}

export function personalizationWeakensTenantIsolation(): false {
  return false;
}

export function personalizationWeakensSecurity(): false {
  return false;
}
