/**
 * Agent DevOps pipeline stages + deployment gates.
 */

import {
  AGENT_DEVOPS_ALLOWED_PREP,
  AGENT_DEVOPS_FORBIDDEN,
  AGENT_DEVOPS_STAGES,
  type AgentDevOpsAllowedPrep,
  type AgentDevOpsForbidden,
  type AgentDevOpsStage,
} from './types';

export type DevOpsRun = {
  runId: string;
  stage: AgentDevOpsStage;
  branch: string;
  sandbox: boolean;
  humanPolicyGatePassed: boolean;
  canaryApproved: boolean;
  productionDeployed: boolean;
};

export type DeploymentGateResult = {
  allowed: boolean;
  reason: string;
  requiresHumanPolicyGate: boolean;
};

export function listAgentDevOpsStages(): readonly AgentDevOpsStage[] {
  return AGENT_DEVOPS_STAGES;
}

export function listAgentDevOpsForbidden(): readonly AgentDevOpsForbidden[] {
  return AGENT_DEVOPS_FORBIDDEN;
}

export function listAgentDevOpsAllowedPrep(): readonly AgentDevOpsAllowedPrep[] {
  return AGENT_DEVOPS_ALLOWED_PREP;
}

export function openDevOpsRun(input: { runId: string; branch: string }): DevOpsRun {
  return {
    runId: input.runId,
    stage: 'IDEA',
    branch: input.branch,
    sandbox: true,
    humanPolicyGatePassed: false,
    canaryApproved: false,
    productionDeployed: false,
  };
}

export function advanceDevOpsStage(run: DevOpsRun): DevOpsRun | { allowed: false; reason: string } {
  const idx = AGENT_DEVOPS_STAGES.indexOf(run.stage);
  if (idx < 0 || idx >= AGENT_DEVOPS_STAGES.length - 1) {
    return { allowed: false, reason: 'devops_stage_terminal_or_unknown' };
  }
  const next = AGENT_DEVOPS_STAGES[idx + 1]!;
  if (next === 'PRODUCTION' && !run.humanPolicyGatePassed) {
    return { allowed: false, reason: 'human_policy_gate_required_before_production' };
  }
  if (next === 'CANARY' && run.stage === 'HUMAN_POLICY_GATE' && !run.humanPolicyGatePassed) {
    return { allowed: false, reason: 'human_policy_gate_required_before_canary' };
  }
  return {
    ...run,
    stage: next,
    sandbox: next !== 'PRODUCTION' && next !== 'CANARY' && next !== 'MONITOR',
  };
}

export function passHumanPolicyGate(run: DevOpsRun): DevOpsRun {
  if (run.stage !== 'HUMAN_POLICY_GATE' && run.stage !== 'RELEASE_CANDIDATE') {
    return run;
  }
  return { ...run, humanPolicyGatePassed: true, stage: 'HUMAN_POLICY_GATE' };
}

export function evaluateProductionDeploy(run: DevOpsRun): DeploymentGateResult {
  if (!run.humanPolicyGatePassed) {
    return {
      allowed: false,
      reason: 'independent_human_or_policy_gate_required',
      requiresHumanPolicyGate: true,
    };
  }
  if (run.stage !== 'CANARY' && run.stage !== 'PRODUCTION' && run.stage !== 'HUMAN_POLICY_GATE') {
    return {
      allowed: false,
      reason: 'not_at_deployable_stage',
      requiresHumanPolicyGate: true,
    };
  }
  return {
    allowed: true,
    reason: 'human_policy_gate_passed',
    requiresHumanPolicyGate: false,
  };
}

export function agentMaySilentConsequentialProdDeploy(): false {
  return false;
}

export function agentMayDisableSecurityGates(): false {
  return false;
}

export function agentMaySelfApprovePrivilegedChanges(): false {
  return false;
}

export function agentMayExpandCredentials(): false {
  return false;
}

export function agentMayForcePushProtectedBranches(): false {
  return false;
}

export function agentMayModifyAuditHistory(): false {
  return false;
}

export function evaluateForbiddenAction(action: AgentDevOpsForbidden): {
  allowed: false;
  action: AgentDevOpsForbidden;
} {
  return { allowed: false, action };
}

export function evaluatePrepAction(action: AgentDevOpsAllowedPrep): {
  allowed: true;
  grantsProductionAuthority: false;
  action: AgentDevOpsAllowedPrep;
} {
  return { allowed: true, grantsProductionAuthority: false, action };
}

export function recommendRollback(run: DevOpsRun, reason: string): {
  recommended: true;
  runId: string;
  reason: string;
  autoExecuted: false;
} {
  return {
    recommended: true,
    runId: run.runId,
    reason,
    autoExecuted: false,
  };
}

export function creativeCapabilityEqualsProductionAuthority(): false {
  return false;
}
