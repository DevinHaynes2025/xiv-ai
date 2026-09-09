import { publishAgentMessage } from './agent-bus';
import { planDemandAgents } from './demand-agent-planner';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { appendEvidenceEvent } from './evidence-ledger';
import { enqueueOfflineBrainJob } from './offline-brain-runtime';
import type { ConsequenceClass } from './decision-gate';

export async function conveneGlobalResearchCouncil(input: {
  tenantId: string;
  universeId: string;
  question: string;
  consequence?: ConsequenceClass;
  approved?: boolean;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.question.trim()) {
    throw new Error('RESEARCH_COUNCIL_SCOPE_REQUIRED');
  }

  const recruitment = planDemandAgents({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: `research_${input.question}`.slice(0, 80),
    requestedRoles: ['researcher', 'skeptic', 'evidence_verifier', 'knowledge_curator'],
    consequence: input.consequence ?? 'LOW',
    approved: input.approved ?? true,
  });

  const knowledge = await retrieveOfflineKnowledge(input.question, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
    needsExternalFreshness: input.needsExternalFreshness,
  });

  if (recruitment.status !== 'PLANNED') {
    return {
      status: recruitment.status,
      knowledge,
      inventedFacts: false as const,
      productionAuthorization: false as const,
      reason: `Global Research Council recruitment ${recruitment.status}.`,
    };
  }

  if (knowledge.state === 'WAITING_DATA') {
    return {
      status: 'WAITING_DATA' as const,
      knowledge,
      inventedFacts: false as const,
      productionAuthorization: false as const,
      reason: knowledge.reason,
    };
  }

  const message = publishAgentMessage({
    fromRole: 'researcher',
    toRole: 'skeptic',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'evidence',
    body: `Research Council local evidence for: ${input.question.trim()}. Refs: ${knowledge.evidenceRefs.join(', ') || 'none'}. Do not invent facts.`,
    evidenceRefs: knowledge.evidenceRefs,
    requiresHumanApproval: false,
  });

  await appendEvidenceEvent({
    kind: 'evidence',
    storyId: '62L-V',
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Global Research Council recorded local evidence for ${input.question.trim()}`,
    payload: { messageId: message.id, inventedFacts: false, evidenceRefs: knowledge.evidenceRefs },
  }, input.root);

  await enqueueOfflineBrainJob({
    kind: 'knowledge_retrieval',
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.question.trim(),
    payload: { needsExternalFreshness: input.needsExternalFreshness === true },
    root: input.root,
  });

  return {
    status: 'CONVENED' as const,
    knowledge,
    inventedFacts: false as const,
    productionAuthorization: false as const,
    reason: knowledge.evidenceRefs.length
      ? 'Research Council used local knowledge graph and learning ledger only.'
      : 'No matching local knowledge. Council will not invent facts or claim external freshness.',
    message,
    recruitment,
  };
}
