/**
 * Identity & Trust foundation. Verification results only — no reusable biometric store.
 */
export type IdentityAssuranceLevel = 'none' | 'low' | 'medium' | 'high';

export type IdentityVerificationPurpose =
  | 'account_verification'
  | 'recovery'
  | 'trusted_device_enrollment'
  | 'business_representative_verification'
  | 'high_risk_approval'
  | 'verified_business_live_host';

export type IdentityVerificationResult = {
  identityVerified: boolean;
  livenessVerified: boolean;
  ageRequirementSatisfied: boolean;
  businessRepresentativeVerified: boolean;
  verificationProvider: 'not_configured';
  assuranceLevel: IdentityAssuranceLevel;
  verifiedAt: string | null;
  expiresAt: string | null;
  purpose: IdentityVerificationPurpose;
  rawBiometricStored: false;
  reusableFaceTemplateStored: false;
};

export type LivenessVerificationResult = {
  livenessVerified: boolean;
  provider: 'not_configured';
  rawBiometricStored: false;
};

export type BusinessRepresentativeVerification = {
  organizationId: string;
  userId: string;
  businessRepresentativeVerified: boolean;
  provider: 'not_configured';
};

export type DeviceTrustState = {
  deviceId: string;
  trusted: boolean;
  enrolled: false;
};

export type HighRiskApprovalRequirement = {
  required: true;
  identityVerified: boolean;
  livenessWhenRequired: boolean;
};

export type AgeAssuranceResult = {
  ageRequirementSatisfied: boolean;
  provider: 'not_configured';
  rawBiometricStored: false;
};

export const IDENTITY_CONTRACT_FIELDS = [
  'identityVerified',
  'livenessVerified',
  'ageRequirementSatisfied',
  'businessRepresentativeVerified',
  'verificationProvider',
  'assuranceLevel',
  'verifiedAt',
  'expiresAt',
] as const;

export const IDENTITY_FORBIDDEN_STORE_FIELDS = [
  'faceEmbedding',
  'faceTemplate',
  'rawFaceImage',
  'biometricTemplate',
  'reusableFacialImagery',
] as const;

export function identityStoresRawBiometrics() {
  return false;
}

export function identityPurposeAllowed(purpose: string) {
  return (
    purpose === 'account_verification' ||
    purpose === 'recovery' ||
    purpose === 'trusted_device_enrollment' ||
    purpose === 'business_representative_verification' ||
    purpose === 'high_risk_approval' ||
    purpose === 'verified_business_live_host'
  );
}

export function createUnconfiguredIdentityResult(
  purpose: IdentityVerificationPurpose,
): IdentityVerificationResult {
  return {
    identityVerified: false,
    livenessVerified: false,
    ageRequirementSatisfied: false,
    businessRepresentativeVerified: false,
    verificationProvider: 'not_configured',
    assuranceLevel: 'none',
    verifiedAt: null,
    expiresAt: null,
    purpose,
    rawBiometricStored: false,
    reusableFaceTemplateStored: false,
  };
}
