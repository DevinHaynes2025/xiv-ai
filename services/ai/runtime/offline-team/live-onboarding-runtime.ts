export type EnrollmentState = 'PENDING' | 'VERIFIED' | 'ENROLLED' | 'SUSPENDED';

export interface EnrollmentReceipt {
  userId: string;
  tenantId: string;
  state: EnrollmentState;
  identityVerified: boolean;
  mfaVerified: boolean;
  contractsAccepted: boolean;
  privacyConfigured: boolean;
  deviceTrusted: boolean;
  consentRefs: string[];
}

export function canBootstrapAvatarBrain(r: EnrollmentReceipt): boolean {
  return r.state === 'ENROLLED' && r.identityVerified && r.mfaVerified && r.contractsAccepted && r.privacyConfigured && r.deviceTrusted && r.consentRefs.length > 0;
}

export const LIVE_ONBOARDING_GUARDRAILS = {
  explicitConsentRequired: true,
  enrollmentCannotBypassSecurity: true,
  topSecretValuesInClientStateAllowed: false,
  revokeAndSuspendSupported: true,
};
