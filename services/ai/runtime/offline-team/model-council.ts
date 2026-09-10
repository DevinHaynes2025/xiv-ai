import type { HighwayProvider } from './neural-highway';

export interface CouncilPosition {
  provider: HighwayProvider;
  proposal: string;
  confidence: number;
  evidenceRefs: readonly string[];
  objections: readonly string[];
}

export interface CouncilDecision {
  selectedProvider: HighwayProvider | null;
  selectedProposal: string | null;
  preservedPositions: readonly CouncilPosition[];
  unresolvedObjections: readonly string[];
  requiresHumanReview: boolean;
}

export const MODEL_COUNCIL_GUARDRAILS = {
  preserveDisagreement: true,
  evidenceRequiredForSelection: true,
  humanReviewOnCloseCall: true,
  autonomousProductionAuthority: false,
} as const;

export function decideCouncil(positions: readonly CouncilPosition[]): CouncilDecision {
  const valid = positions.filter((p) => p.confidence >= 0 && p.confidence <= 1 && p.evidenceRefs.length > 0);
  const ranked = [...valid].sort((a, b) => b.confidence - a.confidence);
  const top = ranked[0] ?? null;
  const second = ranked[1] ?? null;
  const unresolved = [...new Set(valid.flatMap((p) => p.objections))];
  const closeCall = !!(top && second && Math.abs(top.confidence - second.confidence) < 0.1);

  return Object.freeze({
    selectedProvider: top?.provider ?? null,
    selectedProposal: top?.proposal ?? null,
    preservedPositions: Object.freeze([...positions]),
    unresolvedObjections: Object.freeze(unresolved),
    requiresHumanReview: closeCall || unresolved.length > 0 || !top,
  });
}
