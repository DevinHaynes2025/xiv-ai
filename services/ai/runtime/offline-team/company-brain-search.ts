import { PersistentCompanyBrain } from './persistent-company-brain';

export interface BrainSearchResult {
  id: string;
  sourceId: string;
  score: number;
  snippet: string;
  evidenceRefs: string[];
}

export function searchCompanyBrain(brain: PersistentCompanyBrain, tenantId: string, query: string, limit = 8): BrainSearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return brain.list(tenantId)
    .filter(r => r.searchable)
    .map(r => {
      const text = r.text.toLowerCase();
      const score = terms.reduce((n, t) => n + (text.includes(t) ? 1 : 0), 0);
      return { id: r.id, sourceId: r.sourceId, score, snippet: r.text.slice(0, 240), evidenceRefs: r.evidenceRefs };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 32)));
}
