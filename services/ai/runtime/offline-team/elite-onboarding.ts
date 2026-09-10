export type OnboardingTier = 'FREE' | 'PRO' | 'BUSINESS' | 'ELITE';
export type EnrollmentStep = 'ACCOUNT' | 'IDENTITY' | 'MFA_PASSKEY' | 'PRIVACY' | 'CONTRACTS' | 'WAIVERS' | 'APP_SYNC' | 'AVATAR' | 'RECOVERY' | 'FINAL_REVIEW';

export interface EnrollmentReceipt {
  tenantId: string;
  userId: string;
  completedSteps: EnrollmentStep[];
  acceptedDocumentRefs: string[];
  privacyProfileRef: string;
  recoveryConfigured: boolean;
  deviceTrustVerified: boolean;
  tier: OnboardingTier;
  createdAt: string;
}

export const REQUIRED_ENROLLMENT_STEPS: EnrollmentStep[] = ['ACCOUNT','IDENTITY','MFA_PASSKEY','PRIVACY','CONTRACTS','WAIVERS','AVATAR','RECOVERY','FINAL_REVIEW'];

export function validateEnrollment(receipt: EnrollmentReceipt): boolean {
  if (!receipt.tenantId || !receipt.userId || !receipt.privacyProfileRef) return false;
  if (!receipt.recoveryConfigured || !receipt.deviceTrustVerified) return false;
  if (!receipt.acceptedDocumentRefs.length) return false;
  return REQUIRED_ENROLLMENT_STEPS.every(step => receipt.completedSteps.includes(step));
}

export const ELITE_ONBOARDING_GUARDRAILS = {
  explicitConsentRequired: true,
  preEnrollmentSecurityRequired: true,
  contractsAndWaiversVersioned: true,
  privacyChoicesBeforePersonalization: true,
  revocableAppSync: true,
  secretsInSourceAllowed: false,
};
