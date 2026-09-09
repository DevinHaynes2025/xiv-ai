import { inspectBrainHighwayHealth, type BrainHighwayHealthMap } from './brain-highway-health';
import { congestionStats, listDeadLetters } from './congestion-deadletter';
import { unconfiguredCloudSlots } from './local-cloud-routing';
import { listToolModelRegistry } from './tool-model-registry';
import type { GlobalBrainHighways } from './global-brain-highways';
import type { SparseRoutingTable } from './sparse-routing-tables';

export type BrainTransitHealthMap = {
  generatedAt: string;
  highways: BrainHighwayHealthMap;
  congestion: ReturnType<typeof congestionStats>;
  deadLetters: number;
  sparseRoutes: number;
  cloudUnavailable: string[];
  localModel: 'AVAILABLE' | 'UNAVAILABLE';
  productionAuthorization: false;
};

export function inspectBrainTransitHealth(input: {
  highways: GlobalBrainHighways;
  routes: SparseRoutingTable;
  tenantId: string;
  universeId: string;
}): BrainTransitHealthMap {
  const highways = inspectBrainHighwayHealth(input.highways, {
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  const registry = listToolModelRegistry();
  const localModel = registry.find((entry) => entry.id === 'local_model')?.state ?? 'UNAVAILABLE';
  return {
    generatedAt: new Date().toISOString(),
    highways,
    congestion: congestionStats(),
    deadLetters: listDeadLetters(input.tenantId, input.universeId).length,
    sparseRoutes: input.routes.lookupScoped(input.tenantId, input.universeId).length,
    cloudUnavailable: unconfiguredCloudSlots().map((slot) => slot.id),
    localModel,
    productionAuthorization: false,
  };
}
