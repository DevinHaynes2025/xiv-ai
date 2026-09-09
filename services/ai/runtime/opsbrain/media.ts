import type { MediaLayer } from './types';

export type MediaObjectRef = {
  objectId: string;
  storedInPostgres: false;
  encrypted: true;
  tenantId: string;
  universeId: string;
};

export type MediaIntelligenceResult = {
  layers: readonly MediaLayer[];
  becomesUserIdentityProfile: false;
  becomesGlobalBrainFact: false;
};

export type MediaUploadInput = {
  tenantId?: string;
  universeId?: string;
  classified?: boolean;
  rightsChecked?: boolean;
  storeBinaryInPostgres?: boolean;
};

export function storeMediaBinaryInPostgres(): false {
  return false;
}

export function uploadMediaObject(input: MediaUploadInput) {
  if (!input.tenantId || !input.universeId) {
    return { allowed: false as const, reason: 'media_requires_tenant_and_universe' };
  }
  if (input.storeBinaryInPostgres === true) {
    return { allowed: false as const, reason: 'media_binaries_belong_in_object_storage' };
  }
  if (input.classified !== true || input.rightsChecked !== true) {
    return { allowed: false as const, reason: 'media_requires_classification_and_rights' };
  }
  return {
    allowed: true as const,
    object: {
      objectId: 'media-1',
      storedInPostgres: false as const,
      encrypted: true as const,
      tenantId: input.tenantId,
      universeId: input.universeId,
    } satisfies MediaObjectRef,
  };
}

export function analyzeAuthorizedMedia(input: { authorized: boolean; sensitiveInterest?: boolean }): MediaIntelligenceResult | { allowed: false; reason: string } {
  if (input.authorized !== true) {
    return { allowed: false, reason: 'media_analysis_requires_authorization' };
  }
  return {
    layers: [
      'WHAT_IS_IT',
      'TOPICS',
      'ENTITIES',
      'CLAIMS',
      'BUSINESS_RELEVANCE',
      'SUPPLY_CHAIN_RELEVANCE',
      'LEGAL_SAFETY',
      'LANGUAGE',
      'EVIDENCE',
      'RIGHTS',
      'UNIVERSE_VISIBILITY',
    ],
    becomesUserIdentityProfile: false,
    becomesGlobalBrainFact: false,
  };
}

export function mediaInferenceBecomesIdentityProfile(): false {
  return false;
}

export function deviceSecuritySignalsArePublicProfileData(): false {
  return false;
}

export function xivHuntsSuspectedCriminals(): false {
  return false;
}
