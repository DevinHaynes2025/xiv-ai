import type { TwinMemoryRecord } from './persistent-twin-memory-store';

export interface SemanticHit {
  memoryId: string;
  score: number;
  text: string;
  evidenceRefs: string[];
  classification: TwinMemoryRecord['classification'];
}

function tokenize(input: string): Set<string> {
  return new Set(input.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter(x => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

export function searchLocalTwinMemory(records: TwinMemoryRecord[], query: string, limit = 8): SemanticHit[] {
  const q = tokenize(query);
  return records
    .filter(r => r.recallAllowed)
    .map(r => ({
      memoryId: r.memoryId,
      score: jaccard(q, tokenize(r.text)),
      text: r.text,
      evidenceRefs: r.evidenceRefs,
      classification: r.classification,
    }))
    .filter(hit => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(limit, 32)));
}

export const semanticIndexPolicy = {
  externalVectorServiceRequired: false,
  embeddingsRequired: false,
  topSecretLeavesDevice: false,
  modelWeightMutationAllowed: false,
};
