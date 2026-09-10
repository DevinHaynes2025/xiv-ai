import type { LogicalAgent } from './adaptive-agent-factory';
import type { AtomicDataCellManifest } from './storage-compiler';
import type { ScenarioBranch } from './parallel-scenario-compiler';

export interface ControlTowerSnapshot {
  tenantId: string;
  logicalAgents: number;
  localPreferredAgents: number;
  atomicDataCells: number;
  localReplicas: number;
  cloudPlannedReplicas: number;
  simulationBranches: number;
  alerts: readonly string[];
  productionAuthority: false;
}

export function buildControlTowerSnapshot(input: {
  tenantId: string;
  agents: readonly LogicalAgent[];
  cells: readonly AtomicDataCellManifest[];
  scenarios: readonly ScenarioBranch[];
}): ControlTowerSnapshot {
  const agents = input.agents.filter((a) => a.tenantId === input.tenantId);
  const cells = input.cells.filter((c) => c.tenantId === input.tenantId);
  const scenarios = input.scenarios.filter((s) => s.tenantId === input.tenantId);
  const localReplicas = cells.flatMap((c) => c.replicas).filter((r) => r.provider === 'LOCAL' && r.status === 'LOCAL_PRESENT').length;
  const cloudPlannedReplicas = cells.flatMap((c) => c.replicas).filter((r) => r.provider !== 'LOCAL' && r.status === 'PLANNED').length;
  const alerts: string[] = [];
  if (cells.some((c) => c.provenanceRefs.length === 0)) alerts.push('DATA_WITHOUT_PROVENANCE');
  if (cloudPlannedReplicas > 0) alerts.push('CLOUD_REPLICAS_REQUIRE_ADAPTER_CONFIRMATION');
  return Object.freeze({
    tenantId: input.tenantId,
    logicalAgents: agents.length,
    localPreferredAgents: agents.filter((a) => a.localPreferred).length,
    atomicDataCells: cells.length,
    localReplicas,
    cloudPlannedReplicas,
    simulationBranches: scenarios.length,
    alerts: Object.freeze(alerts),
    productionAuthority: false,
  });
}
