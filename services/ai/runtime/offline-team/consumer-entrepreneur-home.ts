export type HomeMode = 'CONSUMER' | 'CREATOR' | 'ENTREPRENEUR' | 'EMPLOYEE' | 'EXECUTIVE';

export interface ConsumerHomeProfile {
  tenantId: string;
  userId: string;
  mode: HomeMode;
  twinEnabled: boolean;
  consentRefs: string[];
  localFirst: true;
  offlineCapable: true;
  allowedCapabilities: string[];
}

export function canLearnFromProfile(profile: ConsumerHomeProfile): boolean {
  return profile.twinEnabled && profile.consentRefs.length > 0;
}

export const consumerHomePolicy = {
  consumerFirst: true,
  rawPrivateCentralPooling: false,
  personalizedExperienceLocalByDefault: true,
  capabilityConsentRequired: true,
  userCanCorrectExportForget: true,
};
