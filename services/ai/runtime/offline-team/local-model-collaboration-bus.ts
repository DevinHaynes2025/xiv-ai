export type CollaboratorId = 'OLLAMA_LOCAL' | 'CLAUDE_CODE_LOCAL';
export type CollaborationTaskKind = 'REASON' | 'CODE' | 'REVIEW' | 'ARCHITECTURE' | 'PATHWAY_PROPOSAL';
export type CollaborationSecurityClass = 'ORDINARY' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type CollaboratorStatus = 'TARGET' | 'CONFIGURED' | 'VERIFIED';

export interface CollaboratorReceipt {
  collaboratorId: CollaboratorId;
  status: CollaboratorStatus;
  receiptRef?: string;
  endpoint?: string;
  deviceLocalCli: boolean;
  modelExecutionLocal: boolean;
  productionAuthority: false;
  rawPrivateDataAllowed: boolean;
}

export interface CollaborationTask {
  taskId: string;
  tenantId: string;
  objective: string;
  kind: CollaborationTaskKind;
  securityClass: CollaborationSecurityClass;
  evidenceRefs: readonly string[];
  humanApprovalRequired: boolean;
}

export interface CollaborationAssignment {
  collaboratorId: CollaboratorId;
  enabled: boolean;
  mode: 'PRIMARY_LOCAL_REASONER' | 'SECONDARY_CODE_REVIEWER';
  reason: string;
  minimizedContextOnly: boolean;
}

export interface CollaborationPlan {
  taskId: string;
  tenantId: string;
  assignments: readonly CollaborationAssignment[];
  localFirst: true;
  productionMutationAllowed: false;
  autonomousDeployAllowed: false;
  modelWeightMutationAllowed: false;
  pathwayPromotionRequiresHumanApproval: true;
}

export interface PathwayCandidate {
  pathwayId: string;
  tenantId: string;
  evaluationScore: number;
  evidenceRefs: readonly string[];
  independentReviewRefs: readonly string[];
  securityClass: CollaborationSecurityClass;
  humanApproved: boolean;
}

export const LOCAL_MODEL_COLLABORATION_GUARDRAILS = {
  ollamaDefaultEndpoint: 'http://127.0.0.1:11434',
  claudeCodeIsLocalCliNotLocalModelGuarantee: true,
  topSecretClaudeReviewAllowed: false,
  confidentialClaudeReviewAllowedByDefault: false,
  productionMutationAllowed: false,
  autonomousDeployAllowed: false,
  modelWeightMutationAllowed: false,
  pathwayPromotionThreshold: 0.92,
  independentReviewCount: 2,
} as const;

function verified(receipts: readonly CollaboratorReceipt[], id: CollaboratorId): CollaboratorReceipt | undefined {
  return receipts.find((receipt) => receipt.collaboratorId === id && receipt.status === 'VERIFIED' && Boolean(receipt.receiptRef));
}

export function buildCollaborationPlan(input: {
  task: CollaborationTask;
  collaboratorReceipts: readonly CollaboratorReceipt[];
}): CollaborationPlan {
  const { task, collaboratorReceipts } = input;
  if (!task.taskId || !task.tenantId || !task.objective.trim()) throw new Error('task identity required');
  if (task.evidenceRefs.length === 0) throw new Error('task evidence required');

  const ollama = verified(collaboratorReceipts, 'OLLAMA_LOCAL');
  const claude = verified(collaboratorReceipts, 'CLAUDE_CODE_LOCAL');

  const ollamaEnabled = Boolean(ollama?.modelExecutionLocal && ollama.rawPrivateDataAllowed && ollama.productionAuthority === false);
  const claudeSecurityAllowed = task.securityClass === 'ORDINARY';
  const claudeEnabled = Boolean(
    claude &&
    claude.deviceLocalCli &&
    claude.productionAuthority === false &&
    claudeSecurityAllowed,
  );

  const assignments: CollaborationAssignment[] = [
    Object.freeze({
      collaboratorId: 'OLLAMA_LOCAL',
      enabled: ollamaEnabled,
      mode: 'PRIMARY_LOCAL_REASONER',
      reason: ollamaEnabled ? 'verified local model execution' : 'Ollama local execution not verified',
      minimizedContextOnly: false,
    }),
    Object.freeze({
      collaboratorId: 'CLAUDE_CODE_LOCAL',
      enabled: claudeEnabled,
      mode: 'SECONDARY_CODE_REVIEWER',
      reason: claudeEnabled ? 'verified Claude Code CLI for minimized ordinary-code review' : task.securityClass !== 'ORDINARY' ? 'Claude review restricted by security class' : 'Claude Code receipt not verified',
      minimizedContextOnly: true,
    }),
  ];

  if (task.securityClass === 'TOP_SECRET' && !ollamaEnabled) {
    throw new Error('TOP_SECRET collaboration requires verified local Ollama execution');
  }

  return Object.freeze({
    taskId: task.taskId,
    tenantId: task.tenantId,
    assignments: Object.freeze(assignments),
    localFirst: true,
    productionMutationAllowed: false,
    autonomousDeployAllowed: false,
    modelWeightMutationAllowed: false,
    pathwayPromotionRequiresHumanApproval: true,
  });
}

export function canPromoteReasoningPathway(candidate: PathwayCandidate): boolean {
  if (!candidate.pathwayId || !candidate.tenantId) return false;
  if (!Number.isFinite(candidate.evaluationScore) || candidate.evaluationScore < LOCAL_MODEL_COLLABORATION_GUARDRAILS.pathwayPromotionThreshold) return false;
  if (candidate.evidenceRefs.length === 0) return false;
  if (candidate.independentReviewRefs.length < LOCAL_MODEL_COLLABORATION_GUARDRAILS.independentReviewCount) return false;
  if (!candidate.humanApproved) return false;
  if (candidate.securityClass === 'TOP_SECRET') return false;
  return true;
}
