import type { RevenueLabRole } from './cfo-ollama-revenue-lab';

export interface RevenueLabPosition {
  role: RevenueLabRole;
  response: string;
  confidence: number;
  evidenceRefs: readonly string[];
  objections: readonly string[];
}

export interface RevenueLabCouncilDecision {
  selectedRole: RevenueLabRole | null;
  recommendation: string | null;
  preservedPositions: readonly RevenueLabPosition[];
  unresolvedObjections: readonly string[];
  requiresHumanReview: boolean;
}

export const REVENUE_COUNCIL_GUARDRAILS = {
  preserveDisagreement: true,
  evidenceRequired: true,
  confidenceFloor: 0.5,
  humanReviewOnObjection: true,
  autonomousFinancialActionAllowed: false,
} as const;

export function decideRevenueCouncil(positions: readonly RevenueLabPosition[]): RevenueLabCouncilDecision {
  const valid = positions
    .filter((position) => position.confidence >= REVENUE_COUNCIL_GUARDRAILS.confidenceFloor)
    .filter((position) => position.evidenceRefs.length > 0)
    .sort((a, b) => b.confidence - a.confidence);

  const selected = valid[0] ?? null;
  const unresolvedObjections = positions.flatMap((position) => [...position.objections]);
  const closeCall = valid.length > 1 && Math.abs(valid[0].confidence - valid[1].confidence) < 0.1;

  return Object.freeze({
    selectedRole: selected?.role ?? null,
    recommendation: selected?.response ?? null,
    preservedPositions: Object.freeze([...positions]),
    unresolvedObjections: Object.freeze(unresolvedObjections),
    requiresHumanReview: !selected || closeCall || unresolvedObjections.length > 0,
  });
}
