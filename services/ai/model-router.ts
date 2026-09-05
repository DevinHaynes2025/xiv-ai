import { authorizeTool } from './policies';
import { getAgentTool } from './tools';
import type {
  Agent,
  AgentAction,
  AgentSessionContext,
  AgentToolId,
  AgentTurnResult,
  ModelProviderId,
} from './types';

export type ModelCompleteInput = {
  agent: Agent;
  context: AgentSessionContext;
  userMessage: string;
  role: AgentSessionContext['role'];
  organizationContext: AgentSessionContext['organizationContext'];
  approvedDataContext: AgentSessionContext['approvedDataContext'];
};

export type ModelProvider = {
  id: ModelProviderId;
  complete: (input: ModelCompleteInput) => Promise<AgentTurnResult>;
};

export const EXECUTIVE_SUPPLIER_SIMULATION = {
  summary: 'Supplier risk is elevated.',
  recommendation: 'Run supplier reallocation simulation.',
  riskLevel: 'medium' as const,
  requiresApproval: true,
  evidence: ['Supplier lead-time variance increased', 'Inventory buffer levels rose'],
};

function supplierSimulationAction(agent: Agent, context: AgentSessionContext): AgentAction | undefined {
  const proposed = propose(
    agent,
    context,
    'simulate_supplier_reallocation',
    EXECUTIVE_SUPPLIER_SIMULATION.recommendation,
    EXECUTIVE_SUPPLIER_SIMULATION.summary,
    EXECUTIVE_SUPPLIER_SIMULATION.evidence.map((label, index) => ({
      id: `ev${index + 1}`,
      label,
      detail: label,
      source: 'mock.governed',
    })),
    EXECUTIVE_SUPPLIER_SIMULATION.riskLevel,
  );
  if (!proposed) return undefined;
  return {
    ...proposed,
    recommendation: EXECUTIVE_SUPPLIER_SIMULATION.recommendation,
    requiresApproval: EXECUTIVE_SUPPLIER_SIMULATION.requiresApproval,
    riskLevel: EXECUTIVE_SUPPLIER_SIMULATION.riskLevel,
  };
}

function actionId() {
  return `act_${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

const HIGH_INTENT =
  /move money|wire transfer|payroll|terminate account|delete account|enterprise permission|large purchase|production system|change production|fire employee|grant admin/i;

function propose(
  agent: Agent,
  context: AgentSessionContext,
  toolId: AgentToolId,
  title: string,
  summary: string,
  evidence: AgentAction['evidence'],
  riskLevel?: AgentAction['riskLevel'],
): AgentAction | undefined {
  const decision = authorizeTool({
    agentType: agent.type,
    toolId,
    anonymous: context.anonymous,
  });
  if (!decision.allowed) return undefined;
  const tool = getAgentTool(toolId);
  return {
    id: actionId(),
    agentType: agent.type,
    toolId,
    title,
    summary,
    riskLevel: riskLevel ?? tool.riskLevel,
    status: 'proposed',
    requiresApproval: decision.requiresApproval,
    prototype: true,
    evidence,
    createdAt: nowIso(),
  };
}

async function completeMockTurn(input: ModelCompleteInput): Promise<AgentTurnResult> {
  const text = input.userMessage.trim().toLowerCase();
  const who = input.approvedDataContext.alias
    ?? input.context.alias
    ?? (input.context.anonymous ? 'this alias' : input.approvedDataContext.profileName?.split(' ')[0] || 'you');

  if (HIGH_INTENT.test(input.userMessage)) {
    return {
      reply: 'Refused. That is a high-risk action. XIV agents cannot move money, change payroll, terminate accounts, alter enterprise permissions, execute large purchases, or change production systems.',
      blocked: 'policy_high_risk_blocked',
      provider: 'mock',
    };
  }

  if (input.agent.type === 'executive_agent') {
    const wantsHealthAction =
      text.includes('business health') ||
      text.includes('recommend the next action') ||
      text.includes('realloc') ||
      text.includes('supplier') ||
      text.includes('simulate');

    if (wantsHealthAction) {
      const proposedAction = supplierSimulationAction(input.agent, input.context);
      return {
        reply: `${EXECUTIVE_SUPPLIER_SIMULATION.summary}\nRecommendation: ${EXECUTIVE_SUPPLIER_SIMULATION.recommendation}`,
        summary: EXECUTIVE_SUPPLIER_SIMULATION.summary,
        recommendation: EXECUTIVE_SUPPLIER_SIMULATION.recommendation,
        riskLevel: EXECUTIVE_SUPPLIER_SIMULATION.riskLevel,
        requiresApproval: EXECUTIVE_SUPPLIER_SIMULATION.requiresApproval,
        proposedAction,
        provider: 'mock',
      };
    }

    return {
      reply: 'Company health is a synthetic 86. I can draft a chair sentence or recommend a supplier reallocation simulation. I will not act without your approval.',
      invokeToolId: 'summarize_company_health',
      proposedAction: propose(
        input.agent,
        input.context,
        'draft_chair_brief',
        'Draft chair brief sentence',
        'Prepare one overnight sentence for the chair packet. It is not sent.',
        [
          {
            id: 'evc1',
            label: 'Overnight bookings',
            detail: 'Nordic corridor recovered after the weather hold in the mock briefing.',
            source: 'mock.briefing',
          },
        ],
      ),
      provider: 'mock',
    };
  }

  if (input.agent.type === 'business_agent') {
    return {
      reply: 'Business Health is a mock 86. I can restate that score or list placeholder connectors. I cannot reach live systems from this device.',
      invokeToolId: 'summarize_business_health',
      provider: 'mock',
    };
  }

  if (input.agent.type === 'employee_agent') {
    return {
      reply: `I only see this floor as ${who}. I will not use a legal name. I can summarize mock themes or prepare a private wellness prompt.`,
      invokeToolId: 'read_organization_universe',
      provider: 'mock',
    };
  }

  return {
    reply: `${who}, I can work from saved interests and mock opportunities. I will ask before any write-shaped action.`,
    invokeToolId: 'search_opportunities',
    provider: 'mock',
  };
}

const mockProvider: ModelProvider = {
  id: 'mock',
  complete: completeMockTurn,
};

/** Live Gemini is server-only (`gemini-provider.ts` via `server.ts`). This in-app provider stays mocked so Metro never bundles a model key. */
const geminiProvider: ModelProvider = {
  id: 'gemini',
  complete: async (input) => {
    const result = await mockProvider.complete(input);
    return { ...result, provider: 'gemini' };
  },
};

const openaiProvider: ModelProvider = {
  id: 'openai',
  complete: async (input) => {
    const result = await mockProvider.complete(input);
    return { ...result, provider: 'openai' };
  },
};

const futureProvider: ModelProvider = {
  id: 'future',
  complete: async (input) => {
    const result = await mockProvider.complete(input);
    return { ...result, provider: 'future' };
  },
};

const PROVIDERS: Record<ModelProviderId, ModelProvider> = {
  mock: mockProvider,
  gemini: geminiProvider,
  openai: openaiProvider,
  future: futureProvider,
};

export function resolveModelProvider(id: ModelProviderId = 'mock'): ModelProvider {
  return PROVIDERS[id] ?? mockProvider;
}

export async function completeAgentTurn(input: ModelCompleteInput & { provider?: ModelProviderId }): Promise<AgentTurnResult> {
  const provider = resolveModelProvider(input.provider ?? 'mock');
  return provider.complete(input);
}
