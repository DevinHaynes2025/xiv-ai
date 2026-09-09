import type { AgentFoundryState } from './types';

export type AgentSpecification = {
  specId: string;
  role: string;
  toolsRequested: readonly string[];
  permissionsRequested: readonly string[];
  state: AgentFoundryState;
  autonomousProduction: false;
};

export function draftAgentSpecification(input: {
  role: string;
  toolsRequested?: readonly string[];
  permissionsRequested?: readonly string[];
}): AgentSpecification {
  return {
    specId: `foundry:${input.role}`,
    role: input.role,
    toolsRequested: input.toolsRequested ?? [],
    permissionsRequested: input.permissionsRequested ?? [],
    state: 'PROPOSED',
    autonomousProduction: false,
  };
}

export function foundrySelfDeploy(spec: AgentSpecification): { allowed: false; reason: string; state: AgentFoundryState } {
  void spec;
  return { allowed: false, reason: 'agent_foundry_cannot_self_deploy', state: 'HUMAN_APPROVAL' };
}

export function foundrySelfGrantTools(spec: AgentSpecification): { allowed: false; reason: string } {
  void spec;
  return { allowed: false, reason: 'new_agent_cannot_self_grant_tools' };
}

export function foundrySelfGrantPermissions(spec: AgentSpecification): { allowed: false; reason: string } {
  void spec;
  return { allowed: false, reason: 'new_agent_cannot_self_grant_permissions' };
}

export function foundryMayDeployWithoutHumanApproval(): false {
  return false;
}
