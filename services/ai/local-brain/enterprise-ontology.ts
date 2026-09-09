export type EnterpriseEntityKind =
  | 'organization'
  | 'business_unit'
  | 'department'
  | 'location'
  | 'facility'
  | 'supplier'
  | 'customer'
  | 'product'
  | 'service'
  | 'asset'
  | 'process'
  | 'metric'
  | 'risk'
  | 'initiative';

export type EnterpriseEntity = {
  id: string;
  kind: EnterpriseEntityKind;
  name: string;
  organizationId: string;
  universeId: string;
  sourceRefs: string[];
  freshness?: string;
  confidence?: number;
};

export type EnterpriseRelation = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  sourceRefs: string[];
  confidence?: number;
};

export type KpiDefinition = {
  key: string;
  name: string;
  description: string;
  unit: string;
  formula: string;
  sourceRefs: string[];
  ownerDepartment?: string;
};

export type EnterpriseSnapshot = {
  organizationId: string;
  universeId: string;
  asOf: string;
  entities: EnterpriseEntity[];
  relations: EnterpriseRelation[];
  metrics: Array<{ kpi: KpiDefinition; value: number | null; freshness: string; confidence?: number }>;
};

export function validateSnapshot(snapshot: EnterpriseSnapshot) {
  const errors: string[] = [];
  for (const metric of snapshot.metrics) {
    if (metric.value === null) continue;
    if (!Number.isFinite(metric.value)) errors.push(`Metric ${metric.kpi.key} is not finite.`);
    if (!metric.kpi.sourceRefs.length) errors.push(`Metric ${metric.kpi.key} is missing source provenance.`);
  }
  for (const entity of snapshot.entities) {
    if (entity.organizationId !== snapshot.organizationId || entity.universeId !== snapshot.universeId) {
      errors.push(`Entity ${entity.id} crosses the snapshot tenant/Universe boundary.`);
    }
  }
  return { valid: errors.length === 0, errors };
}
