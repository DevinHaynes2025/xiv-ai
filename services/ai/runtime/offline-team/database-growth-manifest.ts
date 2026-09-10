export interface DatabaseGrowthManifest {
  tenantId: string;
  atomicCells: number;
  shards: number;
  documentsIndexed: number;
  lessonsStored: number;
  simulationsStored: number;
  targetScale: 'LOCAL_MVP' | 'MILLION_SCALE' | 'BILLION_SCALE' | 'TRILLION_SCALE_TARGET';
  evidence: readonly string[];
}

export const DATABASE_GROWTH_GUARDRAILS = {
  measuredCountsOnly: true,
  trillionScaleIsTargetNotClaim: true,
  crossTenantWritesAllowed: false,
  automaticCloudExpansionAllowed: false,
} as const;

export function validateGrowthManifest(manifest: DatabaseGrowthManifest): DatabaseGrowthManifest {
  const counts = [manifest.atomicCells, manifest.shards, manifest.documentsIndexed, manifest.lessonsStored, manifest.simulationsStored];
  if (counts.some((n) => !Number.isSafeInteger(n) || n < 0)) throw new Error('measured non-negative integer counts required');
  if (manifest.targetScale !== 'LOCAL_MVP' && manifest.evidence.length === 0) throw new Error('scale target requires evidence or planning reference');
  return Object.freeze({ ...manifest, evidence: Object.freeze([...manifest.evidence]) });
}
