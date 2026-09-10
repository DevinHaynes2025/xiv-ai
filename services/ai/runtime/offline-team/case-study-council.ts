export interface CaseCouncilMemo {
  role: string;
  recommendation: string;
  risks: string[];
  challenges: string[];
  evidenceRefs: string[];
  confidence: number;
}

export interface CaseCouncilResult {
  recommendation: string;
  dissent: CaseCouncilMemo[];
  averageConfidence: number;
  requiresHumanApproval: boolean;
}

export function synthesizeCaseCouncil(memos: CaseCouncilMemo[]): CaseCouncilResult {
  if (!memos.length) throw new Error('council memos required');
  if (memos.some(m => !m.evidenceRefs.length)) throw new Error('all memos require evidence');
  const avg = memos.reduce((s, m) => s + m.confidence, 0) / memos.length;
  const dissent = memos.filter(m => m.challenges.length > 0);
  return {
    recommendation: memos.slice().sort((a, b) => b.confidence - a.confidence)[0].recommendation,
    dissent,
    averageConfidence: avg,
    requiresHumanApproval: true,
  };
}

export const CASE_COUNCIL_GUARDRAILS = {
  preserveDissent: true,
  humanApprovalRequired: true,
  evidenceRequired: true,
  autonomousExecutionAllowed: false,
};
