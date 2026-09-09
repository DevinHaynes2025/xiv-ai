/**
 * Historical & Global Intelligence Library — lawful public/licensed sources only.
 * Separated from company/private intelligence. No government classified acquisition.
 */
import type { IntelligenceLane } from './types';

export type IntelligenceLibraryRecord = {
  recordId: string;
  lane: IntelligenceLane;
  license: 'public_domain' | 'open' | 'licensed' | 'company_private';
  governmentClassified: false;
};

export type IntelligenceLibrary = {
  libraryId: string;
  companyPrivateSeparated: true;
  acceptsGovernmentClassified: false;
  productionLive: false;
};

export function openIntelligenceLibrary(): IntelligenceLibrary {
  return {
    libraryId: 'global-intelligence-library',
    companyPrivateSeparated: true,
    acceptsGovernmentClassified: false,
    productionLive: false,
  };
}

export function ingestIntelligenceRecord(input: {
  lane: IntelligenceLane;
  license: IntelligenceLibraryRecord['license'];
  governmentClassified?: boolean;
  claimsClassifiedIntel?: boolean;
}) {
  if (input.governmentClassified === true || input.claimsClassifiedIntel === true) {
    return { allowed: false as const, reason: 'no_government_classified_acquisition' };
  }
  if (input.lane === 'GLOBAL_PUBLIC' && input.license === 'company_private') {
    return { allowed: false as const, reason: 'private_cannot_enter_global_lane' };
  }
  if (input.lane === 'GLOBAL_PUBLIC' && input.license !== 'public_domain' && input.license !== 'open' && input.license !== 'licensed') {
    return { allowed: false as const, reason: 'global_lane_requires_lawful_public_or_licensed' };
  }
  return {
    allowed: true as const,
    record: {
      recordId: `il:${input.lane}`,
      lane: input.lane,
      license: input.license,
      governmentClassified: false as const,
    } satisfies IntelligenceLibraryRecord,
  };
}

export function privateIntelligenceEqualsGlobal(): false {
  return false;
}

export function companyPrivateAutoEntersGlobalLibrary(): false {
  return false;
}

export function claimsGovernmentClassifiedIntel(): false {
  return false;
}
