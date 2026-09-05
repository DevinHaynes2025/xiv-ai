import { logAudit } from './audit';
import { completeGeminiStructured } from './gemini-provider';
import { gateStructuredOutput } from './policies';
import type { ApprovedDataContext, OrganizationContext, StructuredAgentOutput } from './types';

export async function runExecutiveTurn(input: {
  userId: string;
  userMessage: string;
  role: string;
  organizationContext?: OrganizationContext;
  approvedDataContext?: ApprovedDataContext;
}): Promise<StructuredAgentOutput> {
  logAudit({
    kind: 'message',
    agentType: 'executive_agent',
    userId: input.userId,
    note: 'executive_turn_accepted',
  });

  const raw = await completeGeminiStructured({
    userMessage: input.userMessage,
    role: input.role,
    organizationContext: input.organizationContext,
    approvedDataContext: input.approvedDataContext,
  });

  const gated = gateStructuredOutput(raw);

  logAudit({
    kind: gated.requiresApproval ? 'propose' : 'tool_invoke',
    agentType: 'executive_agent',
    userId: input.userId,
    riskLevel: gated.riskLevel,
    note: 'policy_gated_after_model',
  });

  return gated;
}
