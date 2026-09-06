import { AuthorityLevel, boundedAutonomyEnabled, hasMinimumAuthority, type AuthorityLevel as Authority } from './authority';
import { getXivAgent, type XivAgentDefinition } from './agents';
import { getRuntimeTool, type RuntimeToolDefinition } from './tools';

export type RuntimeEnvironment = 'prototype' | 'development' | 'production';

export type PolicyVerdict = 'allowed' | 'denied' | 'requires_approval';

export type PolicyInput = {
  agentId: string;
  toolId: string;
  environment?: RuntimeEnvironment;
  /** When set, overrides the agent's default authority for this evaluation. */
  authorityLevel?: Authority;
  /** True only after an explicit human approval decision. */
  approved?: boolean;
};

export type PolicyEvaluation = {
  verdict: PolicyVerdict;
  reason: string;
  agentId: string;
  toolId: string;
  authorityLevel?: Authority;
  environment: RuntimeEnvironment;
};

export type PolicyRegistries = {
  getAgent: (id: string) => XivAgentDefinition | undefined;
  getTool: (id: string) => RuntimeToolDefinition | undefined;
};

const DEFAULT_REGISTRIES: PolicyRegistries = {
  getAgent: getXivAgent,
  getTool: getRuntimeTool,
};

function deny(input: PolicyInput, environment: RuntimeEnvironment, reason: string, authorityLevel?: Authority): PolicyEvaluation {
  return {
    verdict: 'denied',
    reason,
    agentId: input.agentId,
    toolId: input.toolId,
    authorityLevel,
    environment,
  };
}

/**
 * Deterministic policy. The language model is never the security authority.
 */
export function evaluatePolicy(input: PolicyInput, registries: PolicyRegistries = DEFAULT_REGISTRIES): PolicyEvaluation {
  const environment = input.environment ?? 'prototype';
  const agent = registries.getAgent(input.agentId);
  if (!agent) {
    return deny(input, environment, 'Unknown agent is not registered.');
  }

  const tool = registries.getTool(input.toolId);
  if (!tool) {
    return deny(input, environment, 'Unknown tool is not registered.');
  }

  const authority = input.authorityLevel ?? agent.defaultAuthority;

  if (agent.status === 'future') {
    return deny(input, environment, `${agent.name} is registered as future and cannot invoke tools.`, authority);
  }

  if (tool.humanOnly || tool.requiredAuthority === AuthorityLevel.L5_HumanOnly) {
    return deny(input, environment, `${tool.name} is human-only (L5). Agents cannot execute it.`, authority);
  }

  if (authority === AuthorityLevel.L5_HumanOnly) {
    return deny(input, environment, 'L5 human-only authority cannot be exercised by an agent.', authority);
  }

  if (!agent.allowedTools.includes(tool.id)) {
    return deny(input, environment, `${agent.name} is not allowlisted for ${tool.name}.`, authority);
  }

  if (!tool.allowedAgentIds.includes(agent.id)) {
    return deny(input, environment, `${tool.name} does not permit ${agent.name}.`, authority);
  }

  if (!hasMinimumAuthority(authority, tool.requiredAuthority)) {
    return deny(
      input,
      environment,
      `${agent.name} holds ${authority}, but ${tool.name} requires ${tool.requiredAuthority}.`,
      authority,
    );
  }

  if (environment === 'production' && (tool.riskLevel === 'high' || tool.riskLevel === 'critical') && !tool.readOnly) {
    return deny(input, environment, 'High-risk write tools are blocked in production by policy.', authority);
  }

  const consequential = !tool.readOnly || tool.requiresApproval || tool.riskLevel === 'high' || tool.riskLevel === 'critical';

  if (consequential) {
    if (input.approved) {
      return deny(
        input,
        environment,
        'Approval was recorded, but Phase 2A still refuses execution of consequential tools.',
        authority,
      );
    }

    if (!hasMinimumAuthority(authority, AuthorityLevel.L3_HumanApproval) && !tool.readOnly) {
      return deny(input, environment, `${agent.name} may not propose executable changes below L3.`, authority);
    }

    if (authority === AuthorityLevel.L4_BoundedAutonomy && !boundedAutonomyEnabled()) {
      return {
        verdict: 'requires_approval',
        reason: 'L4 bounded autonomy is reserved. This action still requires human approval.',
        agentId: agent.id,
        toolId: tool.id,
        authorityLevel: authority,
        environment,
      };
    }

    return {
      verdict: 'requires_approval',
      reason: `${tool.name} is consequential and requires explicit human approval.`,
      agentId: agent.id,
      toolId: tool.id,
      authorityLevel: authority,
      environment,
    };
  }

  return {
    verdict: 'allowed',
    reason: `${tool.name} is a read-only allowlisted tool within ${agent.name} authority ${authority}.`,
    agentId: agent.id,
    toolId: tool.id,
    authorityLevel: authority,
    environment,
  };
}
