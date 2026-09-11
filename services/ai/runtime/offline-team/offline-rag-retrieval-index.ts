import { createHash } from 'node:crypto';

export type KnowledgeClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface ApprovedKnowledgeRecord {
  knowledgeId: string;
  tenantId: string;
  title: string;
  content: string;
  sourceRef: string;
  evidenceRefs: readonly string[];
  classification: KnowledgeClassification;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RetrievalCitation {
  knowledgeId: string;
  title: string;
  sourceRef: string;
  evidenceRefs: readonly string[];
  sourceHash: string;
  classification: Exclude<KnowledgeClassification, 'TOP_SECRET'>;
}

export interface RetrievalHit {
  score: number;
  excerpt: string;
  citation: RetrievalCitation;
}

interface IndexedKnowledge {
  record: ApprovedKnowledgeRecord;
  sourceHash: string;
  tokens: Set<string>;
}

export const OFFLINE_RAG_GUARDRAILS = {
  approvalRequired: true,
  provenanceRequired: true,
  evidenceRequired: true,
  tenantIsolationRequired: true,
  topSecretOrdinaryIndexAllowed: false,
  retrievalMustReturnCitation: true,
  modelWeightsMutated: false,
  defaultMode: 'LEXICAL_LOCAL' as const,
};

function normalizeTokens(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]+/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2);
}

function excerptAround(content: string, queryTokens: Set<string>, maxLength = 220): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const words = clean.split(' ');
  const index = words.findIndex(word => queryTokens.has(word.toLowerCase().replace(/[^a-z0-9_\-]+/g, '')));
  const start = Math.max(0, index < 0 ? 0 : index - 14);
  return words.slice(start, start + 36).join(' ').slice(0, maxLength);
}

export class OfflineRagRetrievalIndex {
  private readonly byTenant = new Map<string, Map<string, IndexedKnowledge>>();

  index(record: ApprovedKnowledgeRecord): RetrievalCitation {
    if (!record.knowledgeId || !record.tenantId || !record.title || !record.content) throw new Error('knowledge/tenant/title/content required');
    if (!record.approved || !record.approvedBy || !record.approvedAt) throw new Error('knowledge requires explicit approval receipt');
    if (!record.sourceRef) throw new Error('knowledge requires provenance sourceRef');
    if (record.evidenceRefs.length === 0) throw new Error('knowledge requires evidence refs');
    if (record.classification === 'TOP_SECRET') throw new Error('TOP_SECRET is excluded from ordinary RAG indexes');

    const sourceHash = createHash('sha256').update(`${record.sourceRef}|${record.content}`).digest('hex');
    const tenant = this.byTenant.get(record.tenantId) ?? new Map<string, IndexedKnowledge>();
    tenant.set(record.knowledgeId, {
      record: { ...record, evidenceRefs: [...record.evidenceRefs] },
      sourceHash,
      tokens: new Set(normalizeTokens(`${record.title} ${record.content}`)),
    });
    this.byTenant.set(record.tenantId, tenant);
    return this.toCitation(tenant.get(record.knowledgeId)!);
  }

  query(tenantId: string, queryText: string, maxResults = 5): RetrievalHit[] {
    if (!tenantId || !queryText.trim()) throw new Error('tenant and query required');
    const queryTokens = new Set(normalizeTokens(queryText));
    if (queryTokens.size === 0) return [];
    const rows = [...(this.byTenant.get(tenantId)?.values() ?? [])];
    return rows
      .map(row => {
        const overlap = [...queryTokens].filter(token => row.tokens.has(token)).length;
        const score = overlap === 0 ? 0 : overlap / Math.sqrt(queryTokens.size * Math.max(row.tokens.size, 1));
        return {
          score,
          excerpt: excerptAround(row.record.content, queryTokens),
          citation: this.toCitation(row),
        };
      })
      .filter(hit => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.citation.knowledgeId.localeCompare(b.citation.knowledgeId))
      .slice(0, Math.max(1, Math.min(maxResults, 20)));
  }

  count(tenantId: string): number {
    return this.byTenant.get(tenantId)?.size ?? 0;
  }

  private toCitation(row: IndexedKnowledge): RetrievalCitation {
    return {
      knowledgeId: row.record.knowledgeId,
      title: row.record.title,
      sourceRef: row.record.sourceRef,
      evidenceRefs: [...row.record.evidenceRefs],
      sourceHash: row.sourceHash,
      classification: row.record.classification as Exclude<KnowledgeClassification, 'TOP_SECRET'>,
    };
  }
}
