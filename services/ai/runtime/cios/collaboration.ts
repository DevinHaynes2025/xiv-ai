/**
 * Agent collaboration objects — typed contracts for the Continuous Intelligence OS.
 * Collaboration ≠ shared permissions. Agents cannot self-grant authority.
 */

export type AgentIdentity = {
  agentId: string;
  societyRole: string;
  tenantId: string;
  universeId: string;
  selfGranted: false;
};

export type AgentCapability = {
  capabilityId: string;
  agentId: string;
  grantedByHumanOrPolicy: true;
  selfGranted: false;
};

export type AgentToolGrant = {
  grantId: string;
  agentId: string;
  toolId: string;
  guardianApproved: boolean;
  selfGranted: false;
};

export type AgentTask = {
  taskId: string;
  agentId: string;
  tenantId: string;
  bounded: true;
  silentProductionDeploy: false;
};

export type AgentTaskForce = {
  forceId: string;
  tenantId: string;
  members: readonly AgentIdentity[];
  grantsPermissions: false;
  transfersPermissions: false;
  temporary: true;
};

export type AgentMeeting = {
  meetingId: string;
  forceId: string;
  sharesPermissions: false;
};

export type AgentProposal = {
  proposalId: string;
  agentId: string;
  requiresHumanDecision: true;
  executes: false;
};

export type AgentCritique = {
  critiqueId: string;
  targetProposalId: string;
  agentId: string;
};

export type AgentVote = {
  voteId: string;
  meetingId: string;
  agentId: string;
  createsAuthority: false;
};

export type AgentEvidence = {
  evidenceId: string;
  sourceAuthorized: boolean;
  provenanceRequired: true;
};

export type AgentHandoff = {
  handoffId: string;
  fromAgentId: string;
  toAgentId: string;
  transfersPermissions: false;
};

export type AgentEvaluation = {
  evaluationId: string;
  agentId: string;
  taskId: string;
};

export type AgentLesson = {
  lessonId: string;
  agentId: string;
  rewritesSecurityPolicy: false;
};

export type AgentBudget = {
  budgetId: string;
  agentId: string;
  costCeiling: number;
  selfExpandable: false;
};

export type AgentRun = {
  runId: string;
  agentId: string;
  taskId: string;
  l4Enabled: false;
};

export type AgentCheckpoint = {
  checkpointId: string;
  runId: string;
  recoverable: true;
};

export type AgentFailure = {
  failureId: string;
  runId: string;
  escalatesPrivilege: false;
};

export type AgentRecovery = {
  recoveryId: string;
  failureId: string;
  bypassesGuardian: false;
};

export function createAgentIdentity(input: {
  agentId: string;
  societyRole: string;
  tenantId: string;
  universeId: string;
}): AgentIdentity {
  return {
    agentId: input.agentId,
    societyRole: input.societyRole,
    tenantId: input.tenantId,
    universeId: input.universeId,
    selfGranted: false,
  };
}

export function createAgentTaskForce(input: {
  forceId: string;
  tenantId: string;
  members: readonly AgentIdentity[];
}): AgentTaskForce {
  return {
    forceId: input.forceId,
    tenantId: input.tenantId,
    members: input.members,
    grantsPermissions: false,
    transfersPermissions: false,
    temporary: true,
  };
}

export function createAgentProposal(input: { proposalId: string; agentId: string }): AgentProposal {
  return {
    proposalId: input.proposalId,
    agentId: input.agentId,
    requiresHumanDecision: true,
    executes: false,
  };
}

export function createAgentHandoff(input: {
  handoffId: string;
  fromAgentId: string;
  toAgentId: string;
}): AgentHandoff {
  return {
    handoffId: input.handoffId,
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    transfersPermissions: false,
  };
}

export function createAgentRun(input: { runId: string; agentId: string; taskId: string }): AgentRun {
  return {
    runId: input.runId,
    agentId: input.agentId,
    taskId: input.taskId,
    l4Enabled: false,
  };
}

export function agentVoteCreatesAuthority(_vote: AgentVote): false {
  return false;
}

export function agentLessonRewritesSecurity(_lesson: AgentLesson): false {
  return false;
}

export function agentBudgetSelfExpands(_budget: AgentBudget): false {
  return false;
}

export function agentRecoveryBypassesGuardian(_recovery: AgentRecovery): false {
  return false;
}
