import type { PersonClaimClass } from './types';

export type PersonEvidence = {
  source: string;
  retrievedAt: string;
  reference: string;
  license: string;
  public: true;
};

export type HistoricalIdentity = {
  personId: string;
  legalName: string;
  evidence: PersonEvidence;
  matched: true;
};

export type BiographicalClaim = {
  claimId: string;
  text: string;
  class: PersonClaimClass;
  evidence: PersonEvidence | null;
};

export type PersonSource = PersonEvidence;
export type PersonWork = { workId: string; title: string; evidence: PersonEvidence };
export type PersonPublication = { publicationId: string; title: string; evidence: PersonEvidence };
export type PersonPatent = { patentId: string; title: string; evidence: PersonEvidence };
export type PersonIdea = { ideaId: string; text: string; class: Exclude<PersonClaimClass, 'SIMULATED_RESPONSE'> };
export type PersonInfluence = { from: string; to: string; evidence: PersonEvidence };
export type PersonTimeline = { events: readonly BiographicalClaim[] };
export type PersonContradiction = { left: string; right: string; resolved: false };
export type PersonRightsState = { publicUseAllowed: boolean; privateAcquisition: false };

export type HistoricalPerson = {
  personId: string;
  name: string;
  identity?: HistoricalIdentity;
  claims: readonly BiographicalClaim[];
  completeLegacyBrain: false;
  actuallyAlive: false;
};

export type ObituarySource = PersonEvidence;
export type ObituaryRecord = { recordId: string; evidence: PersonEvidence };
export type ObituaryClaim = { text: string; evidence: PersonEvidence; class: 'BIOGRAPHICAL_FACT' | 'UNKNOWN' };
export type ObituaryEvidence = PersonEvidence;
export type ObituaryIdentityMatch = { personId: string; evidence: PersonEvidence; matched: true };

export const LEGACY_RESEARCH_AGENTS = [
  'Person Discovery',
  'Obituary Research',
  'Identity Resolution',
  'Biography',
  'Bibliography',
  'Archive',
  'Patent',
  'Publication',
  'Quote Verification',
  'Historical Context',
  'Legacy Knowledge',
  'Rights',
  'Contradiction',
  'Provenance',
] as const;

export const LEGACY_DISCLAIMER =
  'AI historical simulation based on available evidence. This is not the actual person and may not represent views they would hold today.';

export function createObituaryClaim(input: { text: string; evidence?: PersonEvidence | null }): ObituaryClaim | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference || !input.evidence.license) {
    return { allowed: false, reason: 'obituary_claim_requires_source' };
  }
  if (input.evidence.public !== true) {
    return { allowed: false, reason: 'private_obituary_acquisition_denied' };
  }
  return { text: input.text, evidence: input.evidence, class: 'BIOGRAPHICAL_FACT' };
}

export function matchHistoricalIdentity(input: {
  personId: string;
  legalName: string;
  evidence?: PersonEvidence | null;
}): HistoricalIdentity | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'identity_match_requires_evidence' };
  }
  return { personId: input.personId, legalName: input.legalName, evidence: input.evidence, matched: true };
}

export function obituaryAloneCreatesCompleteLegacyBrain(_record: ObituaryRecord | null): false {
  return false;
}

export function createHistoricalPerson(name: string, claims: readonly BiographicalClaim[] = []): HistoricalPerson {
  return { personId: `legacy:${name}`, name, claims, completeLegacyBrain: false, actuallyAlive: false };
}

export function aiInferenceIsDocumentedBelief(claim: BiographicalClaim): boolean {
  return claim.class !== 'AI_INFERENCE' && (claim.class === 'DOCUMENTED_IDEA' || claim.class === 'PRIMARY_SOURCE_STATEMENT');
}
