export interface MiningRecord {
  id: string;
  sourceId: string;
  text: string;
  timestamp?: string;
  tags: readonly string[];
}

export interface MiningFinding {
  findingId: string;
  recordIds: readonly string[];
  pattern: string;
  confidence: number;
  evidenceCount: number;
  inferred: true;
}

export const DATA_MINING_GUARDRAILS = {
  provenanceRequired: true,
  privateCrossTenantMiningAllowed: false,
  unsupportedPatternBecomesFact: false,
  productionMutationAllowed: false,
} as const;

export function mineTokenFrequency(records: readonly MiningRecord[], minimumCount = 2): MiningFinding[] {
  const counts = new Map<string, { count: number; ids: Set<string> }>();
  for (const record of records) {
    if (!record.sourceId) throw new Error('sourceId required for provenance');
    const tokens = record.text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
    for (const token of new Set(tokens)) {
      const current = counts.get(token) ?? { count: 0, ids: new Set<string>() };
      current.count += 1;
      current.ids.add(record.id);
      counts.set(token, current);
    }
  }
  return [...counts.entries()]
    .filter(([, v]) => v.count >= minimumCount)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .map(([token, v]) => ({
      findingId: `token:${token}`,
      recordIds: Object.freeze([...v.ids]),
      pattern: token,
      confidence: Math.min(0.99, v.count / Math.max(records.length, 1)),
      evidenceCount: v.count,
      inferred: true as const,
    }));
}
