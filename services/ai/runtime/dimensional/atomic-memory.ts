import { createHash } from 'node:crypto';

export type EvidenceState = 'OBSERVED' | 'DERIVED' | 'HYPOTHESIS' | 'SIMULATION';
export type TemporalEra = 'ANCIENT' | 'MEDIEVAL' | 'EARLY_MODERN' | 'INDUSTRIAL' | 'MODERN' | 'CONTEMPORARY' | 'FUTURE';

export interface AtomicFact {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  era: TemporalEra;
  sourceIds: string[];
  evidence: EvidenceState;
  confidence: number;
  observedAt?: string;
  validFrom?: string;
  validTo?: string;
}

export interface MemoryShard {
  shardId: string;
  dimension: number;
  region: string;
  factIds: string[];
  checksum: string;
  offlineEligible: boolean;
}

export interface HistoricalPath {
  factIds: string[];
  score: number;
  eras: TemporalEra[];
}

export function stableFactId(input: Omit<AtomicFact, 'id'>): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

export function validateFact(fact: AtomicFact): void {
  if (!fact.subject || !fact.predicate || !fact.object) throw new Error('fact triple required');
  if (fact.confidence < 0 || fact.confidence > 1) throw new Error('confidence must be 0..1');
  if (fact.evidence === 'OBSERVED' && fact.sourceIds.length === 0) {
    throw new Error('observed facts require source provenance');
  }
}

export function shardFacts(facts: AtomicFact[], dimension: number, region: string): MemoryShard {
  if (!Number.isInteger(dimension) || dimension < 1 || dimension > 100) {
    throw new Error('dimension must be an integer from 1 to 100');
  }
  facts.forEach(validateFact);
  const factIds = [...new Set(facts.map((f) => f.id))].sort();
  const checksum = createHash('sha256').update(factIds.join(':')).digest('hex');
  return {
    shardId: createHash('sha256').update(`${dimension}:${region}:${checksum}`).digest('hex'),
    dimension,
    region,
    factIds,
    checksum,
    offlineEligible: facts.every((f) => f.evidence !== 'HYPOTHESIS'),
  };
}

export function historicalPath(facts: AtomicFact[], startSubject: string, endObject: string): HistoricalPath | null {
  const bySubject = new Map<string, AtomicFact[]>();
  for (const fact of facts) {
    validateFact(fact);
    const list = bySubject.get(fact.subject) ?? [];
    list.push(fact);
    bySubject.set(fact.subject, list);
  }

  const queue: Array<{ node: string; ids: string[]; score: number; eras: TemporalEra[] }> = [
    { node: startSubject, ids: [], score: 1, eras: [] },
  ];
  const visited = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (visited.has(current.node)) continue;
    visited.add(current.node);
    for (const fact of bySubject.get(current.node) ?? []) {
      const nextIds = [...current.ids, fact.id];
      const nextScore = current.score * fact.confidence;
      const nextEras = [...current.eras, fact.era];
      if (fact.object === endObject) return { factIds: nextIds, score: nextScore, eras: nextEras };
      queue.push({ node: fact.object, ids: nextIds, score: nextScore, eras: nextEras });
    }
  }
  return null;
}

export const ATOMIC_MEMORY_GUARDRAILS = {
  literalAtomicStorageClaim: false,
  biologicalCloningCapability: false,
  provenanceRequiredForObservedFacts: true,
  hypothesesStoredAsFacts: false,
  offlinePrivateDataExportByDefault: false,
} as const;
