export interface MasterPlanLesson {
  lessonId: string;
  topic: string;
  principle: string;
  sourceRefs: string[];
  requiresHumanApproval: boolean;
}

export const MASTER_PLAN_CURRICULUM: MasterPlanLesson[] = [
  { lessonId: 'mp-01', topic: 'execution', principle: 'Build the future vision with disciplined MVP sequencing and proof before scale.', sourceRefs: ['master-plan:13','master-plan:23','master-plan:74'], requiresHumanApproval: false },
  { lessonId: 'mp-02', topic: 'security', principle: 'Tenant isolation, least privilege, secrets outside source, auditability, recovery and human approval are architectural defaults.', sourceRefs: ['master-plan:17','master-plan:27','master-plan:29','master-plan:143'], requiresHumanApproval: true },
  { lessonId: 'mp-03', topic: 'experience', principle: 'Story first, evidence second, raw data third; mobile is a first-class product, not a reduced desktop dashboard.', sourceRefs: ['master-plan:63','master-plan:71','master-plan:114','master-plan:154','master-plan:155'], requiresHumanApproval: false },
  { lessonId: 'mp-04', topic: 'agents', principle: 'Use specialized governed agents with scoped tools, memory, evaluations, monitoring, audit and human authority for consequential decisions.', sourceRefs: ['master-plan:20','master-plan:52','master-plan:61','master-plan:94','master-plan:95'], requiresHumanApproval: true },
  { lessonId: 'mp-05', topic: 'models', principle: 'Remain model-agnostic; route by privacy, cost, latency, quality and capability. Evaluate before production changes.', sourceRefs: ['master-plan:117','master-plan:141','master-plan:157'], requiresHumanApproval: true },
  { lessonId: 'mp-06', topic: 'company-brain', principle: 'The Company Brain models entities, relationships, history, actions and outcomes above the storage layer.', sourceRefs: ['master-plan:93','master-plan:116','master-plan:131','master-plan:132'], requiresHumanApproval: false },
  { lessonId: 'mp-07', topic: 'android', principle: 'Android Studio validates the mobile experience; real device or emulator evidence is required before compatibility claims.', sourceRefs: ['master-plan:139','master-plan:144','master-plan:165','master-plan:176'], requiresHumanApproval: false },
];

export const MASTER_PLAN_LEARNING_GUARDRAILS = {
  sourceBackedOnly: true,
  modelWeightMutationAllowed: false,
  autonomousPolicyRewriteAllowed: false,
  founderApprovalRequiredForMissionOrSecurityChanges: true,
};
