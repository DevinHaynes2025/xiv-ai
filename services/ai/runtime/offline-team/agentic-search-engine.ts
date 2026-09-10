import { createHash } from 'node:crypto';

export type SearchSource = 'COMPANY_BRAIN' | 'COMMUNITY' | 'APPROVED_PUBLIC' | 'HISTORICAL_GRAPH';

export interface AgenticSearchQuery {
  tenantId: string;
  text: string;
  sources: SearchSource[];
  allowOnline: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface SearchEvidence {
  source: SearchSource;
  ref: string;
  summary: string;
  confidence: number;
  tenantId?: string;
}

export interface AgenticSearchResult {
  queryHash: string;
  answerMode: 'LOCAL_ONLY' | 'HYBRID';
  evidence: SearchEvidence[];
  requiresHumanReview: boolean;
}

export function planAgenticSearch(query: AgenticSearchQuery, evidence: SearchEvidence[]): AgenticSearchResult {
  if (!query.tenantId.trim()) throw new Error('tenant required');
  if (!query.text.trim()) throw new Error('query required');
  if (query.classification === 'TOP_SECRET' && query.allowOnline) throw new Error('TOP_SECRET search must remain local');
  const safeEvidence = evidence.filter(item => !item.tenantId || item.tenantId === query.tenantId);
  if (safeEvidence.length !== evidence.length) throw new Error('cross-tenant search evidence blocked');
  const hash = createHash('sha256').update(JSON.stringify(query)).digest('hex');
  return {
    queryHash: hash,
    answerMode: query.allowOnline ? 'HYBRID' : 'LOCAL_ONLY',
    evidence: safeEvidence,
    requiresHumanReview: safeEvidence.some(e => e.confidence < 0.65),
  };
}

export const AGENTIC_SEARCH_GUARDRAILS = {
  correlationIsCausation: false,
  evidenceRequired: true,
  tenantIsolation: true,
  topSecretOnlineAllowed: false,
  provenanceRequired: true,
};
