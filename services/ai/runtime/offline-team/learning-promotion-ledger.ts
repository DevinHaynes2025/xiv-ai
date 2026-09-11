import type { KnowledgeClassification } from './offline-rag-retrieval-index';

export type LearningPromotionStatus = 'STAGED' | 'EVALUATED' | 'PROMOTED' | 'REJECTED';
export type LearningTargetMemory = 'AVATAR_PRIVATE' | 'COMPANY_TRUSTED';

export interface LearningCandidate {
  candidateId: string;
  tenantId: string;
  agentId: string;
  lesson: string;
  classification: KnowledgeClassification;
  citationRefs: readonly string[];
  evidenceRefs: readonly string[];
  createdAt: string;
}

export interface LearningEvaluation {
  evaluationId: string;
  score: number;
  evaluatorRole: string;
  evidenceRefs: readonly string[];
  evaluatedAt: string;
}

export interface LearningPromotionDecision {
  candidateId: string;
  target: LearningTargetMemory;
  status: LearningPromotionStatus;
  score: number | null;
  humanApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  reasons: readonly string[];
  modelWeightsMutated: false;
}

interface LedgerRow {
  candidate: LearningCandidate;
  evaluation?: LearningEvaluation;
  decision: LearningPromotionDecision;
}

export const LEARNING_PROMOTION_GUARDRAILS = {
  avatarMinimumScore: 0.75,
  companyMinimumScore: 0.85,
  citationsRequired: true,
  evaluationEvidenceRequired: true,
  companyHumanApprovalRequired: true,
  topSecretCompanyPromotionAllowed: false,
  modelWeightMutationAllowed: false,
} as const;

export class LearningPromotionLedger {
  private rows = new Map<string, LedgerRow>();

  stage(candidate: LearningCandidate): LearningPromotionDecision {
    if (!candidate.candidateId || !candidate.tenantId || !candidate.agentId || !candidate.lesson || !candidate.createdAt) throw new Error('candidate identity, tenant, agent, lesson and time required');
    if (candidate.citationRefs.length === 0 || candidate.evidenceRefs.length === 0) throw new Error('learning candidate requires citations and evidence');
    if (this.rows.has(candidate.candidateId)) throw new Error('duplicate learning candidate');
    const decision: LearningPromotionDecision = {
      candidateId: candidate.candidateId,
      target: 'AVATAR_PRIVATE',
      status: 'STAGED',
      score: null,
      humanApproved: false,
      reasons: ['awaiting evaluation'],
      modelWeightsMutated: false,
    };
    this.rows.set(candidate.candidateId, { candidate: { ...candidate, citationRefs: [...candidate.citationRefs], evidenceRefs: [...candidate.evidenceRefs] }, decision });
    return { ...decision, reasons: [...decision.reasons] };
  }

  evaluate(candidateId: string, evaluation: LearningEvaluation): LearningPromotionDecision {
    const row = this.requireRow(candidateId);
    if (evaluation.score < 0 || evaluation.score > 1) throw new Error('evaluation score must be between 0 and 1');
    if (!evaluation.evaluationId || !evaluation.evaluatorRole || !evaluation.evaluatedAt || evaluation.evidenceRefs.length === 0) throw new Error('evaluation identity, role, time and evidence required');
    row.evaluation = { ...evaluation, evidenceRefs: [...evaluation.evidenceRefs] };
    row.decision = {
      ...row.decision,
      status: 'EVALUATED',
      score: evaluation.score,
      reasons: evaluation.score >= LEARNING_PROMOTION_GUARDRAILS.avatarMinimumScore ? ['eligible for approval-gated promotion'] : ['evaluation score below promotion threshold'],
    };
    return { ...row.decision, reasons: [...row.decision.reasons] };
  }

  promote(candidateId: string, target: LearningTargetMemory, approval?: { approvedBy: string; approvedAt: string }): LearningPromotionDecision {
    const row = this.requireRow(candidateId);
    const evaluation = row.evaluation;
    const reasons: string[] = [];
    if (!evaluation) reasons.push('evaluation required');
    const threshold = target === 'COMPANY_TRUSTED' ? LEARNING_PROMOTION_GUARDRAILS.companyMinimumScore : LEARNING_PROMOTION_GUARDRAILS.avatarMinimumScore;
    if (evaluation && evaluation.score < threshold) reasons.push(`score below ${threshold}`);
    if (target === 'COMPANY_TRUSTED' && row.candidate.classification === 'TOP_SECRET') reasons.push('TOP_SECRET cannot enter ordinary company trusted memory');
    if (target === 'COMPANY_TRUSTED' && (!approval?.approvedBy || !approval.approvedAt)) reasons.push('human approval required for company trusted memory');

    const promoted = reasons.length === 0;
    row.decision = {
      candidateId,
      target,
      status: promoted ? 'PROMOTED' : 'REJECTED',
      score: evaluation?.score ?? null,
      humanApproved: Boolean(approval?.approvedBy && approval.approvedAt),
      approvedBy: approval?.approvedBy,
      approvedAt: approval?.approvedAt,
      reasons: promoted ? ['evidence, evaluation and policy gates satisfied'] : reasons,
      modelWeightsMutated: false,
    };
    return { ...row.decision, reasons: [...row.decision.reasons] };
  }

  get(candidateId: string): LearningPromotionDecision | undefined {
    const row = this.rows.get(candidateId);
    return row ? { ...row.decision, reasons: [...row.decision.reasons] } : undefined;
  }

  snapshot(tenantId: string): LearningPromotionDecision[] {
    return [...this.rows.values()]
      .filter(row => row.candidate.tenantId === tenantId)
      .map(row => ({ ...row.decision, reasons: [...row.decision.reasons] }));
  }

  private requireRow(candidateId: string): LedgerRow {
    const row = this.rows.get(candidateId);
    if (!row) throw new Error('learning candidate not found');
    return row;
  }
}
