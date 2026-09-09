/**
 * Phase 2I-A Business Live contracts. Hosting remains not_configured.
 */
export const BUSINESS_LIVE_CONTENT_EXAMPLES = [
  'product_demos',
  'founder_presentations',
  'business_education',
  'warehouse_manufacturing_operations',
  'company_announcements',
  'training',
  'entrepreneurship',
  'sales_demonstrations',
  'business_conferences',
] as const;

export type BusinessLivePolicyOutcome = 'allow' | 'allow_with_review' | 'interrupt' | 'block' | 'escalate';

export type BusinessLiveContentClassification =
  | 'business'
  | 'non_business_entertainment'
  | 'spam'
  | 'prohibited'
  | 'unknown';

export type BusinessLiveHost = {
  hostUserId: string;
  organizationId: string;
  verifiedRepresentative: boolean;
};

export type BusinessLiveAudience = {
  sessionId: string;
  visibility: 'organization' | 'universe' | 'invite_only' | 'public_business';
};

export type BusinessLiveStreamPolicy = {
  businessOnly: true;
  perfectModerationClaimed: false;
  evidenceRequired: true;
};

export type BusinessLiveModerationDecision = {
  outcome: BusinessLivePolicyOutcome;
  classification: BusinessLiveContentClassification;
  evidenceRefs: readonly string[];
  perfect: false;
  autoBan: false;
};

export type BusinessLiveTranscriptEvent = {
  eventId: string;
  sessionId: string;
  text: string;
  createdAt: string;
};

export type BusinessLiveArchivePolicy = {
  sessionId: string;
  privateCompanyStream: boolean;
  eligibleForGlobalBrain: false | 'explicit_share_required';
};

export type BusinessLiveIdentityRequirement = {
  hostVerificationRequired: true;
  livenessWhenRequired: boolean;
  faceSurveillanceDatabase: false;
};

export type BusinessLiveVerificationState = {
  identityVerified: boolean;
  livenessVerified: boolean;
  businessRepresentativeVerified: boolean;
  provider: 'not_configured';
};

export type BusinessLiveAuditEvent = {
  eventId: string;
  sessionId: string;
  action: string;
  createdAt: string;
};

export type BusinessLiveSession = {
  sessionId: string;
  organizationId: string;
  universeId: string | null;
  host: BusinessLiveHost;
  status: 'not_configured';
  classification: BusinessLiveContentClassification;
  persisted: false;
};

export function evaluateBusinessLivePolicy(input: {
  classification: BusinessLiveContentClassification;
  evidenceRefs: readonly string[];
}): BusinessLiveModerationDecision {
  if (input.evidenceRefs.length === 0) {
    return {
      outcome: 'block',
      classification: input.classification,
      evidenceRefs: [],
      perfect: false,
      autoBan: false,
    };
  }
  if (input.classification === 'prohibited' || input.classification === 'spam') {
    return {
      outcome: 'block',
      classification: input.classification,
      evidenceRefs: input.evidenceRefs,
      perfect: false,
      autoBan: false,
    };
  }
  if (input.classification === 'non_business_entertainment') {
    return {
      outcome: 'interrupt',
      classification: input.classification,
      evidenceRefs: input.evidenceRefs,
      perfect: false,
      autoBan: false,
    };
  }
  if (input.classification === 'unknown') {
    return {
      outcome: 'allow_with_review',
      classification: input.classification,
      evidenceRefs: input.evidenceRefs,
      perfect: false,
      autoBan: false,
    };
  }
  return {
    outcome: 'allow',
    classification: 'business',
    evidenceRefs: input.evidenceRefs,
    perfect: false,
    autoBan: false,
  };
}

export function privateArchiveEntersGlobalBrain() {
  return false;
}

export function businessLiveHostingEnabled() {
  return false;
}

export function businessLiveProviderStatus() {
  return 'not_configured' as const;
}
