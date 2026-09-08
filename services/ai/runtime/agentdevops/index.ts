/**
 * Phase 2I-AC Agent DevOps barrel.
 * Semi-autonomous build/test/debate/RC/canary; consequential prod behind human/policy gate.
 * Creative capability ≠ production authority. L4 disabled.
 */

export type {
  AgentDevOpsAllowedPrep,
  AgentDevOpsForbidden,
  AgentDevOpsStage,
  CodeReviewRole,
  CreativeCapability,
} from './types';
export {
  AGENT_DEVOPS_ALLOWED_PREP,
  AGENT_DEVOPS_FORBIDDEN,
  AGENT_DEVOPS_STAGES,
  CODE_REVIEW_CHAIN,
  CREATIVE_CAPABILITIES,
} from './types';

export {
  advanceDevOpsStage,
  agentMayDisableSecurityGates,
  agentMayExpandCredentials,
  agentMayForcePushProtectedBranches,
  agentMayModifyAuditHistory,
  agentMaySelfApprovePrivilegedChanges,
  agentMaySilentConsequentialProdDeploy,
  creativeCapabilityEqualsProductionAuthority,
  evaluateForbiddenAction,
  evaluatePrepAction,
  evaluateProductionDeploy,
  listAgentDevOpsAllowedPrep,
  listAgentDevOpsForbidden,
  listAgentDevOpsStages,
  openDevOpsRun,
  passHumanPolicyGate,
  recommendRollback,
} from './pipeline';
export type { DeploymentGateResult, DevOpsRun } from './pipeline';

export {
  castReviewVote,
  evaluateHighRiskApproval,
  listCodeReviewChain,
  listCreativeCapabilities,
  moreAgentsMeansMorePermissions,
  moreIntelligenceMeansMoreAuthority,
  openAgentCreativeControl,
  openCodeReviewChain,
  selfApprovePrivilegedChange,
} from './review';
export type {
  CodeReviewChain,
  CreativeControl,
  ReviewVerdict,
  ReviewVote,
} from './review';
