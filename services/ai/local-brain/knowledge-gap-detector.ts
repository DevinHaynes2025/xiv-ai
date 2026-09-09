import { recallCortexTraces } from './memory-cortex';
import { listKnowledgePacks } from './knowledge-packs';
import { listPromotedEvidence } from './evidence-promotion-gate';
import { domainById, KNOWLEDGE_DOMAINS } from './knowledge-domains';
import type { EvidenceState } from './evidence-promotion-gate';

export type KnowledgeGap = {
  domainId: string;
  label: string;
  state: EvidenceState;
  reason: string;
};

export async function detectKnowledgeGaps(input: {
  tenantId: string;
  universeId: string;
  domainIds?: string[];
  root?: string;
}) {
  const domains = (input.domainIds ?? KNOWLEDGE_DOMAINS.map((item) => item.id))
    .map((id) => domainById(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const traces = await recallCortexTraces({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const packs = await listKnowledgePacks({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const promoted = await listPromotedEvidence({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const gaps: KnowledgeGap[] = [];
  for (const domain of domains) {
    const hasTrace = traces.some((trace) => trace.summary.toLowerCase().includes(domain.id) || trace.label.toLowerCase().includes(domain.label.toLowerCase()));
    const hasPack = packs.some((pack) => pack.domain === domain.id);
    const hasVerified = promoted.some((record) => record.promotion === 'verified' && record.summary.toLowerCase().includes(domain.id));
    if (hasVerified || hasPack || hasTrace) continue;
    gaps.push({
      domainId: domain.id,
      label: domain.label,
      state: 'UNKNOWN',
      reason: 'No tenant-scoped traces, packs, or verified evidence exist for this domain. Gap is UNKNOWN, not invented knowledge.',
    });
  }
  return {
    gaps,
    covered: domains.length - gaps.length,
    inventedFacts: false as const,
    productionAuthorization: false as const,
  };
}
