export type BusinessVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'suspended';

export type VerificationEvidenceKind =
  | 'business_registry'
  | 'domain_verification'
  | 'authorized_representative'
  | 'manual_review';

export type BusinessVerification = {
  organizationId: string;
  status: BusinessVerificationStatus;
  evidence: readonly VerificationEvidenceKind[];
  operational: false;
  provider: 'not_configured';
};

export function createBusinessVerification(organizationId: string): BusinessVerification {
  return {
    organizationId,
    status: 'unverified',
    evidence: [],
    operational: false,
    provider: 'not_configured',
  };
}

export function businessVerificationIsOperational() {
  return false;
}

export type LiveReadiness = 'eligible' | 'ineligible' | 'requires_review';

export function evaluateLiveReadiness(input: {
  identityVerified: boolean;
  businessVerified: boolean;
  tenantAuthorized: boolean;
  deviceSessionAcceptable: boolean;
  classificationAllowed: boolean;
  moderationConfigured: boolean;
  streamProviderConfigured: boolean;
}) {
  const checks = {
    identityVerified: input.identityVerified,
    businessVerified: input.businessVerified,
    tenantAuthorized: input.tenantAuthorized,
    deviceSessionAcceptable: input.deviceSessionAcceptable,
    classificationAllowed: input.classificationAllowed,
    moderationConfigured: input.moderationConfigured,
    streamProviderConfigured: input.streamProviderConfigured,
  };
  const vanityScore = null;
  if (!input.identityVerified || !input.tenantAuthorized || !input.classificationAllowed) {
    return { result: 'ineligible' as LiveReadiness, checks, vanityScore };
  }
  if (!input.businessVerified || !input.moderationConfigured || !input.streamProviderConfigured) {
    return { result: 'requires_review' as LiveReadiness, checks, vanityScore };
  }
  if (!input.deviceSessionAcceptable) {
    return { result: 'requires_review' as LiveReadiness, checks, vanityScore };
  }
  return { result: 'eligible' as LiveReadiness, checks, vanityScore };
}

export function issueLiveHostGrant(input: {
  consumer: boolean;
  persistenceReady: boolean;
  membershipActive: boolean;
  authorizedHostRole: boolean;
  verification: BusinessVerification;
  streamProviderConfigured: boolean;
}) {
  if (input.consumer) {
    return { allowed: false as const, reason: 'Consumers cannot host Business Live.' };
  }
  if (!input.persistenceReady || !input.membershipActive || !input.authorizedHostRole) {
    return { allowed: false as const, reason: 'Host grant requires persisted tenant membership and an authorized host role.' };
  }
  if (input.verification.status !== 'verified' || input.verification.operational) {
    return { allowed: false as const, reason: 'Business verification model exists but is NOT CONFIGURED / not verified.' };
  }
  if (!input.streamProviderConfigured) {
    return { allowed: false as const, reason: 'Live streaming provider remains NOT CONFIGURED.' };
  }
  return { allowed: false as const, reason: 'Host grant is prepared but not issued. Provider remains NOT CONFIGURED.' };
}
