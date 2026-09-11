export type BrainSecurityClass = 'ORDINARY' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type BrainAgentRole =
  | 'LOCAL_ARCHITECT'
  | 'OLLAMA_BUILDER'
  | 'MEMORY_CURATOR'
  | 'SECURITY_GUARDIAN'
  | 'QA_REVIEWER'
  | 'LEARNING_RECORDER'
  | 'ILM_REVIEWER'
  | 'CLAUDE_REVIEWER';

export type ReviewerAdapterId = 'ILM' | 'CLAUDE';
export type ReviewerAdapterStatus = 'TARGET' | 'CONFIGURED' | 'VERIFIED';

export interface ReviewerAdapterReceipt {
  adapterId: ReviewerAdapterId;
  status: ReviewerAdapterStatus;
  receiptRef?: string;
  networkRequired: boolean;
  privateDataAllowed: false;
  productionAuthority: false;
}

export interface OfflineBrainMission {
  missionId: string;
  tenantId: string;
  objective: string;
  securityClass: BrainSecurityClass;
  requestedRoles: readonly BrainAgentRole[];
  evidenceRefs: readonly string[];
  humanApprovalRequired: boolean;
}

export interface CouncilSeat {
  role: BrainAgentRole;
  execution: 'LOCAL' | 'OPTIONAL_EXTERNAL_REVIEW';
  enabled: boolean;
  reason: string;
}

export interface OfflineBrainCouncilPlan {
  missionId: string;
  tenantId: string;
  localFirst: true;
  offlineCapable: true;
  maxConcurrentAgents: 8;
  productionMutationAllowed: false;
  autonomousDeployAllowed: false;
  modelWeightMutationAllowed: false;
  cloudExecutionVerified: false;
  seats: readonly CouncilSeat[];
  evidenceRefs: readonly string[];
}

export interface OfflineBrainLearningCandidate {
  candidateId: string;
  tenantId: string;
  securityClass: BrainSecurityClass;
  evaluationScore: number;
  evidenceRefs: readonly string[];
  humanApproved: boolean;
}

export const OFFLINE_BRAIN_COUNCIL_GUARDRAILS = {
  localFirst: true,
  offlineCapable: true,
  maxConcurrentAgents: 8,
  productionMutationAllowed: false,
  autonomousDeployAllowed: false,
  modelWeightMutationAllowed: false,
  externalReviewerPrivateDataAllowed: false,
  topSecretExternalReviewAllowed: false,
  learningPromotionThreshold: 0.9,
} as const;

function externalReviewerSeat(
  role: 'ILM_REVIEWER' | 'CLAUDE_REVIEWER',
  securityClass: BrainSecurityClass,
  adapters: readonly ReviewerAdapterReceipt[],
): CouncilSeat {
  const adapterId: ReviewerAdapterId = role === 'ILM_REVIEWER' ? 'ILM' : 'CLAUDE';
  const adapter = adapters.find((candidate) => candidate.adapterId === adapterId);

  if (securityClass === 'TOP_SECRET') {
    return Object.freeze({ role, execution: 'OPTIONAL_EXTERNAL_REVIEW', enabled: false, reason: 'TOP_SECRET stays local' });
  }
  if (!adapter || adapter.status !== 'VERIFIED' || !adapter.receiptRef) {
    return Object.freeze({ role, execution: 'OPTIONAL_EXTERNAL_REVIEW', enabled: false, reason: `${adapterId} adapter not verified` });
  }
  if (adapter.privateDataAllowed || adapter.productionAuthority) {
    return Object.freeze({ role, execution: 'OPTIONAL_EXTERNAL_REVIEW', enabled: false, reason: `${adapterId} adapter violates council guardrails` });
  }
  return Object.freeze({ role, execution: 'OPTIONAL_EXTERNAL_REVIEW', enabled: true, reason: `${adapterId} verified for minimized review only` });
}

export function planOfflineBrainCouncil(input: {
  mission: OfflineBrainMission;
  reviewerAdapters?: readonly ReviewerAdapterReceipt[];
}): OfflineBrainCouncilPlan {
  const { mission } = input;
  if (!mission.missionId || !mission.tenantId || !mission.objective.trim()) throw new Error('mission identity required');
  if (mission.evidenceRefs.length === 0) throw new Error('mission evidence required');

  const roles = [...new Set(mission.requestedRoles)].slice(0, OFFLINE_BRAIN_COUNCIL_GUARDRAILS.maxConcurrentAgents);
  const seats = roles.map((role): CouncilSeat => {
    if (role === 'ILM_REVIEWER' || role === 'CLAUDE_REVIEWER') {
      return externalReviewerSeat(role, mission.securityClass, input.reviewerAdapters ?? []);
    }
    return Object.freeze({ role, execution: 'LOCAL', enabled: true, reason: 'local bounded council seat' });
  });

  return Object.freeze({
    missionId: mission.missionId,
    tenantId: mission.tenantId,
    localFirst: true,
    offlineCapable: true,
    maxConcurrentAgents: 8,
    productionMutationAllowed: false,
    autonomousDeployAllowed: false,
    modelWeightMutationAllowed: false,
    cloudExecutionVerified: false,
    seats: Object.freeze(seats),
    evidenceRefs: Object.freeze([...mission.evidenceRefs]),
  });
}

export function canPromoteLearning(candidate: OfflineBrainLearningCandidate): boolean {
  if (!candidate.candidateId || !candidate.tenantId) return false;
  if (candidate.evidenceRefs.length === 0) return false;
  if (!Number.isFinite(candidate.evaluationScore) || candidate.evaluationScore < OFFLINE_BRAIN_COUNCIL_GUARDRAILS.learningPromotionThreshold) return false;
  if (!candidate.humanApproved) return false;
  if (candidate.securityClass === 'TOP_SECRET') return false;
  return true;
}
