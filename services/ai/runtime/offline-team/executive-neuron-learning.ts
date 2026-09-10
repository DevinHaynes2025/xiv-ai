import { createHash } from 'node:crypto';

export type ExecutiveLesson = {
  tenantId: string;
  sourceRole: string;
  content: string;
  evidenceRefs: string[];
  approved: boolean;
  approvedBy?: string;
};

export type AtomicLearningCell = {
  cellId: string;
  tenantId: string;
  kind: 'EXECUTIVE_LESSON';
  content: string;
  sourceRole: string;
  evidenceRefs: string[];
  approvedBy: string;
  createdAt: string;
};

export const EXECUTIVE_LEARNING_GUARDRAILS = Object.freeze({
  requiresEvidence: true,
  requiresApproval: true,
  crossTenantWriteAllowed: false,
  modelWeightMutationAllowed: false,
  agentCodeRewriteAllowed: false,
  autonomousProductionMutationAllowed: false,
  maxLessonsPerCycle: 64,
});

export function compileExecutiveLessons(lessons: ExecutiveLesson[]): AtomicLearningCell[] {
  if (lessons.length > EXECUTIVE_LEARNING_GUARDRAILS.maxLessonsPerCycle) {
    throw new Error('lesson cycle exceeds bounded maximum');
  }
  return lessons.filter(l => l.approved && l.approvedBy && l.evidenceRefs.length > 0).map(l => {
    const payload = `${l.tenantId}|${l.sourceRole}|${l.content}|${l.evidenceRefs.join(',')}|${l.approvedBy}`;
    return {
      cellId: `adc_${createHash('sha256').update(payload).digest('hex')}`,
      tenantId: l.tenantId,
      kind: 'EXECUTIVE_LESSON',
      content: l.content,
      sourceRole: l.sourceRole,
      evidenceRefs: [...l.evidenceRefs],
      approvedBy: l.approvedBy!,
      createdAt: new Date().toISOString(),
    };
  });
}
