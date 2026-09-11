import type { TwinMemoryEvent } from './consumer-twin-memory-timeline';

export interface RagQuery {
  tenantId: string;
  userId: string;
  text: string;
  maxResults: number;
  allowTopSecret: boolean;
}

export interface RagHit {
  id: string;
  score: number;
  summary: string;
  evidenceRefs: string[];
}

export function searchPrivateMemory(query: RagQuery, events: TwinMemoryEvent[]): RagHit[] {
  const terms = query.text.toLowerCase().split(/\s+/).filter(Boolean);
  return events
    .filter((e) => e.tenantId === query.tenantId && e.userId === query.userId)
    .filter((e) => e.approvedForRecall)
    .filter((e) => query.allowTopSecret || e.classification !== 'TOP_SECRET')
    .map((e) => {
      const hay = e.summary.toLowerCase();
      const matches = terms.filter((t) => hay.includes(t)).length;
      return { id: e.id, score: terms.length ? matches / terms.length : 0, summary: e.summary, evidenceRefs: e.evidenceRefs };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(query.maxResults, 25)));
}

export const privateRagPolicy = {
  externalVectorServiceByDefault: false,
  tenantIsolationRequired: true,
  evidenceRequiredForTrustedRecall: true,
  modelWeightMutationAllowed: false,
};
