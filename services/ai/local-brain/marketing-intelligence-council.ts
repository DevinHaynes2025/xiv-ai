import { publishAgentMessage, inbox } from './agent-bus';
import { planDemandAgents } from './demand-agent-planner';
import { appendEvidenceEvent } from './evidence-ledger';
import type { ConsequenceClass } from './decision-gate';

export async function conveneMarketingIntelligenceCouncil(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  consequence?: ConsequenceClass;
  approved?: boolean;
  publishExternally?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.topic.trim()) {
    throw new Error('MARKETING_COUNCIL_SCOPE_REQUIRED');
  }
  if (input.publishExternally) {
    return {
      status: 'DENIED' as const,
      externalPublication: false as const,
      productionAuthorization: false as const,
      reason: 'Marketing Intelligence Council cannot publish externally or impersonate the founder.',
      messages: [],
    };
  }

  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: `mkt_${input.topic}`.slice(0, 80),
    requestedRoles: ['business_analyst', 'skeptic', 'evidence_verifier', 'executive_synthesizer'],
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  if (recruitment.status !== 'PLANNED') {
    return {
      status: recruitment.status,
      externalPublication: false as const,
      productionAuthorization: false as const,
      reason: `Marketing council recruitment ${recruitment.status}.`,
      messages: [],
    };
  }

  const message = publishAgentMessage({
    fromRole: 'business_analyst',
    toRole: 'executive_synthesizer',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'decision_support',
    body: `Marketing Intelligence Council recommendation-only briefing: ${input.topic.trim()}`,
    evidenceRefs: ['62L-V:marketing-council'],
    requiresHumanApproval: (input.consequence ?? 'LOW') !== 'LOW',
  });

  await appendEvidenceEvent({
    kind: 'communication',
    storyId: '62L-V',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Marketing Intelligence Council convened for ${input.topic.trim()}`,
    payload: { messageId: message.id, externalPublication: false },
  }, input.root);

  return {
    status: 'CONVENED' as const,
    externalPublication: false as const,
    productionAuthorization: false as const,
    reason: 'Council produced an internal recommendation. No external campaign, spend, or founder impersonation.',
    messages: inbox('executive_synthesizer', input.tenantId, input.universeId),
    recruitment,
  };
}
