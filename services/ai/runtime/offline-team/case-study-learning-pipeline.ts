import { createHash } from 'node:crypto';

export interface CaseStudyLesson {
  tenantId: string;
  caseId: string;
  summary: string;
  evidenceRefs: string[];
  approved: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface CaseStudyLearningCell {
  cellId: string;
  tenantId: string;
  caseId: string;
  summary: string;
  evidenceRefs: string[];
  searchable: boolean;
  modelWeightsMutated: false;
  agentCodeRewritten: false;
}

export function ingestCaseStudyLesson(lesson: CaseStudyLesson): CaseStudyLearningCell {
  if (!lesson.approved) throw new Error('case-study lesson requires approval');
  if (!lesson.evidenceRefs.length) throw new Error('case-study lesson requires evidence');
  const digest = createHash('sha256')
    .update(JSON.stringify({ tenantId: lesson.tenantId, caseId: lesson.caseId, summary: lesson.summary, evidenceRefs: lesson.evidenceRefs }))
    .digest('hex');
  return {
    cellId: `casecell:${digest}`,
    tenantId: lesson.tenantId,
    caseId: lesson.caseId,
    summary: lesson.summary,
    evidenceRefs: lesson.evidenceRefs,
    searchable: lesson.classification !== 'TOP_SECRET',
    modelWeightsMutated: false,
    agentCodeRewritten: false,
  };
}

export const CASE_STUDY_LEARNING_GUARDRAILS = {
  approvalRequired: true,
  evidenceRequired: true,
  topSecretSearchable: false,
  modelWeightsMutated: false,
  autonomousSelfRewrite: false,
  quantumPath: 'SIMULATOR_OR_VERIFIED_ADAPTER_ONLY',
};
