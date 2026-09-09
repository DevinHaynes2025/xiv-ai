import { guardianOpsLayers } from '../diagnostics/guardian-ops';
import { describeTenantPersistenceBlock } from '../tenant/collision';
import { liveInfrastructureLabel } from '../live/catalog';
import { billionUserReady } from '../scale/horizon';
import type { OpsCenterSection } from './types';

export const OPS_CENTER_SECTIONS: readonly OpsCenterSection[] = [
  'platform_health',
  'ai_workforce',
  'security',
  'data_sources',
  'integrations',
  'live',
  'tenant_health',
  'regional_health',
  'queues',
  'incidents',
];

export function operationsCenterSnapshot() {
  const persistence = describeTenantPersistenceBlock();
  return {
    audience: 'developer_prototype' as const,
    consumerExposed: false,
    productionMonitoring: false,
    billionUserReady: billionUserReady(),
    sections: OPS_CENTER_SECTIONS,
    platformHealth: guardianOpsLayers().map((layer) => ({ layer: layer.layer, status: layer.status })),
    live: liveInfrastructureLabel(),
    tenantPersistence: persistence.status,
    schemaCollision: persistence.status === 'schema_collision',
  };
}

export function consumerMayOpenOperationsCenter() {
  return false;
}
