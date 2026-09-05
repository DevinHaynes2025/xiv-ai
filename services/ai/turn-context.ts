import type {
  AgentRole,
  AgentSessionContext,
  AgentTurnContext,
  AgentType,
  ApprovedDataContext,
  OrganizationContext,
} from './types';

export function agentTypeForRole(role: AgentRole | null | undefined): AgentType | null {
  if (!role) return null;
  if (role === 'employee') return 'employee_agent';
  if (role === 'business_owner') return 'business_agent';
  if (role === 'executive') return 'executive_agent';
  return 'consumer_agent';
}

export function organizationContextFor(role: AgentRole, anonymous: boolean): OrganizationContext {
  if (anonymous || role === 'employee') {
    return {
      kind: 'placeholder_universe',
      name: 'Company universe',
      detail: 'Organization membership is not connected. This tenant is a visual stand-in.',
    };
  }
  return {
    kind: 'demo_tenant',
    name: 'Northstar Logistics',
    detail: 'Demo tenant. Metrics and connectors are synthetic.',
  };
}

export function approvedDataContextFor(input: {
  role: AgentRole;
  anonymous: boolean;
  alias?: string;
  displayName?: string;
  interests: string[];
}): ApprovedDataContext {
  if (input.anonymous || input.role === 'employee') {
    return {
      alias: input.alias,
      universeNote: 'Placeholder organization universe only. Legal identity is not included.',
    };
  }

  const approved: ApprovedDataContext = {
    profileName: input.displayName,
    interests: input.interests,
  };

  if (input.role === 'business_owner' || input.role === 'executive') {
    approved.metricsNote = 'Synthetic business health 86. No live ledger.';
    approved.systemsNote = 'ERP/CRM/warehouse placeholders. No credentials.';
  }

  return approved;
}

export function toAgentTurnContext(session: AgentSessionContext, userMessage: string): AgentTurnContext {
  return {
    userMessage,
    role: session.role,
    organizationContext: session.organizationContext,
    approvedDataContext: session.approvedDataContext,
  };
}

export function withTurnContext(
  session: Omit<AgentSessionContext, 'agentType' | 'organizationContext' | 'approvedDataContext'> & {
    agentType?: AgentType;
  },
): AgentSessionContext {
  const agentType = session.agentType ?? agentTypeForRole(session.role) ?? 'consumer_agent';
  return {
    ...session,
    agentType,
    organizationContext: organizationContextFor(session.role, session.anonymous),
    approvedDataContext: approvedDataContextFor(session),
  };
}
