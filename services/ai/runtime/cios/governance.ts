/**
 * Agent MAY / MAY NOT governance for Continuous Intelligence OS.
 * More capability ≠ more authority. L4 remains disabled.
 */

import {
  AGENT_ALLOWED_ACTIONS,
  AGENT_FORBIDDEN_ACTIONS,
  type AgentAllowedAction,
  type AgentForbiddenAction,
} from './types';

export type GovernanceDecision =
  | { allowed: true; action: AgentAllowedAction }
  | { allowed: false; action: AgentForbiddenAction | string; reason: string };

export function listAllowedAgentActions(): readonly AgentAllowedAction[] {
  return AGENT_ALLOWED_ACTIONS;
}

export function listForbiddenAgentActions(): readonly AgentForbiddenAction[] {
  return AGENT_FORBIDDEN_ACTIONS;
}

export function evaluateAgentAction(action: AgentAllowedAction | AgentForbiddenAction): GovernanceDecision {
  if ((AGENT_FORBIDDEN_ACTIONS as readonly string[]).includes(action)) {
    return {
      allowed: false,
      action: action as AgentForbiddenAction,
      reason: `forbidden:${action}`,
    };
  }
  if ((AGENT_ALLOWED_ACTIONS as readonly string[]).includes(action)) {
    return { allowed: true, action: action as AgentAllowedAction };
  }
  return { allowed: false, action, reason: 'unknown_action_default_deny' };
}

export function agentMaySelfGrantPermissions(): false {
  return false;
}

export function agentMayCreateHiddenCredentials(): false {
  return false;
}

export function agentMayDisableGuardian(): false {
  return false;
}

export function agentMayWeakenTenantIsolation(): false {
  return false;
}

export function agentMaySilentProductionDeploy(): false {
  return false;
}

export function agentMayPromoteToL4(): false {
  return false;
}

export function agentMayReadUnauthorizedTenantData(): false {
  return false;
}

export function agentMayRewriteAuthority(): false {
  return false;
}

export function agentMayBypassHumanApproval(): false {
  return false;
}

export function agentMayBypassGuardian(): false {
  return false;
}

export function requestForbiddenAction(action: AgentForbiddenAction) {
  return {
    allowed: false as const,
    action,
    reason: `agents_may_not_${action.toLowerCase()}`,
  };
}

export function moreCapabilityMeansMoreAuthority(): false {
  return false;
}
