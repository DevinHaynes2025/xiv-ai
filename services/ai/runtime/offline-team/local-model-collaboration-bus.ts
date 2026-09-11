export type CollaboratorId = 'OLLAMA_LOCAL' | 'CLAUDE_CODE_LOCAL' | 'GROK_XAI';
export type CollaborationTaskKind = 'REASON' | 'CODE' | 'REVIEW' | 'ARCHITECTURE' | 'PATHWAY_PROPOSAL';
export type CollaborationSecurityClass = 'ORDINARY' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type CollaboratorStatus = 'TARGET' | 'CONFIGURED' | 'VERIFIED';

export interface CollaboratorReceipt {
  collaboratorId: CollaboratorId;
  status: CollaboratorStatus;
  receiptRef?: string;
  endpoint?: string;
  // Legacy receipts can deserialize, but are ineligible until renewed with these fields.
  tenantId?: string;
  verifiedAt?: string;
  expiresAt?: string;
  providerId?: string;
  modelId?: string;
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
  externalReviewApproved?: boolean;
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
  collaboratorsAvailable: boolean;
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
  maximumReceiptAgeMs: 300_000,
} as const;
const nonblank = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const validRefs = (value: readonly string[]): boolean => Array.isArray(value) && value.length > 0 && value.every(nonblank);

/** Fixed IP literals only: no DNS, credentials, alternate port, query, or redirected origin. */
export function isApprovedOllamaLoopback(endpoint: unknown): boolean {
  return typeof endpoint === 'string' && /^http:\/\/(127\.0\.0\.1|\[::1\]):11434\/?$/.test(endpoint);
}

/** A freshness/policy check, NOT cryptographic authentication of an untrusted receipt. */
export function isFreshCollaboratorReceipt(receipt: CollaboratorReceipt, tenantId: string, nowMs = Date.now()): boolean {
  const at = Date.parse(receipt.verifiedAt ?? '');
  const expires = Date.parse(receipt.expiresAt ?? '');
  return Number.isFinite(nowMs) && Number.isFinite(at) && Number.isFinite(expires)
    && receipt.tenantId === tenantId && nonblank(tenantId)
    && receipt.status === 'VERIFIED' && nonblank(receipt.receiptRef)
    && nonblank(receipt.providerId) && nonblank(receipt.modelId)
    && receipt.productionAuthority === false
    && at <= nowMs && nowMs < expires && expires > at
    && expires - at <= LOCAL_MODEL_COLLABORATION_GUARDRAILS.maximumReceiptAgeMs
    && nowMs - at <= LOCAL_MODEL_COLLABORATION_GUARDRAILS.maximumReceiptAgeMs;
}
function verified(receipts: readonly CollaboratorReceipt[], id: CollaboratorId, tenantId: string, nowMs: number): CollaboratorReceipt | undefined {
  const scoped = receipts.filter(r => r.collaboratorId === id && r.tenantId === tenantId);
  // Ambiguous duplicate observations fail closed. The heartbeat store must keep its newest receipt.
  return scoped.length === 1 && isFreshCollaboratorReceipt(scoped[0], tenantId, nowMs) ? scoped[0] : undefined;
}
export function buildCollaborationPlan(input: {
  task: CollaborationTask;
  collaboratorReceipts: readonly CollaboratorReceipt[];
  nowMs?: number;
  networkAvailable?: boolean;
}): CollaborationPlan {
  const { task, collaboratorReceipts } = input;
  const nowMs = input.nowMs ?? Date.now();
  if (![task.taskId, task.tenantId, task.objective].every(nonblank) || !Number.isFinite(nowMs)) throw new Error('task identity and valid clock required');
  if (!validRefs(task.evidenceRefs)) throw new Error('task evidence required');
  if (!['ORDINARY', 'CONFIDENTIAL', 'TOP_SECRET'].includes(task.securityClass)) throw new Error('unknown security class');
  if (!['REASON', 'CODE', 'REVIEW', 'ARCHITECTURE', 'PATHWAY_PROPOSAL'].includes(task.kind)) throw new Error('unknown task kind');
  if (task.kind === 'PATHWAY_PROPOSAL' && task.humanApprovalRequired !== true) throw new Error('pathway proposals require human approval gate');
  const ollama = verified(collaboratorReceipts, 'OLLAMA_LOCAL', task.tenantId, nowMs);
  const claude = verified(collaboratorReceipts, 'CLAUDE_CODE_LOCAL', task.tenantId, nowMs);
  const grok = verified(collaboratorReceipts, 'GROK_XAI', task.tenantId, nowMs);
  const ollamaEnabled = Boolean(ollama && isApprovedOllamaLoopback(ollama.endpoint)
    && ollama.providerId === 'ollama' && ollama.modelExecutionLocal === true
    && !/cloud/i.test(ollama.modelId ?? '')
    && (task.securityClass === 'ORDINARY' || ollama.rawPrivateDataAllowed === true));
  const externalAllowed = task.securityClass === 'ORDINARY' && task.externalReviewApproved === true && input.networkAvailable === true;
  const claudeEnabled = Boolean(externalAllowed && claude?.deviceLocalCli === true && claude.rawPrivateDataAllowed === false);
  const grokEnabled = Boolean(externalAllowed && grok?.providerId === 'xai'
    && grok.endpoint === 'https://api.x.ai/v1' && grok.modelExecutionLocal === false && grok.rawPrivateDataAllowed === false);
  const assignments: CollaborationAssignment[] = [
    { collaboratorId: 'OLLAMA_LOCAL', enabled: ollamaEnabled, mode: 'PRIMARY_LOCAL_REASONER', reason: ollamaEnabled ? 'fresh tenant-scoped local receipt' : 'local receipt, endpoint, or data permission unavailable', minimizedContextOnly: false },
    { collaboratorId: 'CLAUDE_CODE_LOCAL', enabled: claudeEnabled, mode: 'SECONDARY_CODE_REVIEWER', reason: claudeEnabled ? 'approved ordinary review; provider/model recorded separately from CLI' : 'external review not authorized, unavailable, or stale', minimizedContextOnly: true },
    { collaboratorId: 'GROK_XAI', enabled: grokEnabled, mode: 'SECONDARY_CODE_REVIEWER', reason: grokEnabled ? 'approved ordinary review through xAI' : 'external review not authorized, unavailable, or stale', minimizedContextOnly: true },
  ];
  if (task.securityClass === 'TOP_SECRET' && !ollamaEnabled) throw new Error('TOP_SECRET collaboration requires verified local Ollama execution');
  return Object.freeze({ taskId: task.taskId, tenantId: task.tenantId,
    assignments: Object.freeze(assignments.map(a => Object.freeze(a))),
    collaboratorsAvailable: assignments.some(a => a.enabled), localFirst: true,
    productionMutationAllowed: false, autonomousDeployAllowed: false, modelWeightMutationAllowed: false,
    pathwayPromotionRequiresHumanApproval: true });
}
export function canPromoteReasoningPathway(candidate: PathwayCandidate): boolean {
  return [candidate.pathwayId, candidate.tenantId].every(nonblank)
    && Number.isFinite(candidate.evaluationScore) && candidate.evaluationScore >= LOCAL_MODEL_COLLABORATION_GUARDRAILS.pathwayPromotionThreshold && candidate.evaluationScore <= 1
    && validRefs(candidate.evidenceRefs) && validRefs(candidate.independentReviewRefs)
    && new Set(candidate.independentReviewRefs.map(r => r.trim())).size >= LOCAL_MODEL_COLLABORATION_GUARDRAILS.independentReviewCount
    && candidate.humanApproved === true && ['ORDINARY', 'CONFIDENTIAL'].includes(candidate.securityClass);
}
