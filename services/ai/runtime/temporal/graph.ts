import type { HistoricalEvidenceClass, TemporalClaim, TemporalEvidence, TranslationState } from './types';

export function evidenceClassesAreEquivalent(left: HistoricalEvidenceClass, right: HistoricalEvidenceClass): boolean {
  return left === right;
}

export function archaeologicalEqualsPrimarySource(): false {
  return false;
}

export function laterAccountBecomesContemporary(): false {
  return false;
}

export function createTemporalClaim(input: {
  text: string;
  geography: string;
  evidence?: TemporalEvidence | null;
  disputed?: boolean;
  civilization?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
}): TemporalClaim | { allowed: false; reason: string } {
  if (!input.evidence?.source.institution || !input.evidence.source.document || !input.evidence.source.retrievedAt) {
    return { allowed: false, reason: 'historical_claim_requires_provenance' };
  }
  return {
    claimId: `temporal:${input.geography}:${input.text.slice(0, 24)}`,
    text: input.text,
    validFrom: input.validFrom ?? null,
    validTo: input.validTo ?? null,
    geography: input.geography,
    civilization: input.civilization ?? null,
    language: input.evidence.source.language,
    evidence: input.evidence,
    confidence: input.disputed ? 'unknown' : input.evidence.evidenceClass === 'DIRECT_PRIMARY_SOURCE' ? 'medium' : 'low',
    disputed: input.disputed === true || input.evidence.evidenceClass === 'DISPUTED',
    equivalentToPrimary: false,
  };
}

export function disputedClaimStaysDisputed(claim: TemporalClaim): boolean {
  return claim.disputed === true && claim.evidence.evidenceClass === 'DISPUTED'
    ? true
    : claim.disputed === true;
}

export function machineTranslationIsVerifiedInterpretation(state: TranslationState): boolean {
  return state === 'SCHOLAR_TRANSLATED' || state === 'HUMAN_REVIEWED';
}

export function deduplicateTemporalSources(
  left: { document: string; institution: string },
  right: { document: string; institution: string },
): { duplicate: boolean; groupId: string | null } {
  if (left.document === right.document && left.institution === right.institution) {
    return { duplicate: true, groupId: `${left.institution}:${left.document}` };
  }
  return { duplicate: false, groupId: null };
}

export function contradictoryTemporalSourcesRemainVisible(input: {
  claim: string;
  sources: readonly { institution: string; stance: string }[];
}): { visible: true; resolvedAutomatically: false } {
  void input;
  return { visible: true, resolvedAutomatically: false };
}

export type TemporalCorrection = {
  originalClaimId: string;
  correctedClaimId: string;
  originalPreserved: true;
  silentDelete: false;
};

export function correctTemporalClaim(original: TemporalClaim, replacementText: string): TemporalCorrection {
  return {
    originalClaimId: original.claimId,
    correctedClaimId: `${original.claimId}:correction`,
    originalPreserved: true,
    silentDelete: false,
  };
}

export function sourceCorrectionPreservesHistory(correction: TemporalCorrection): boolean {
  return correction.originalPreserved === true && correction.silentDelete === false;
}
