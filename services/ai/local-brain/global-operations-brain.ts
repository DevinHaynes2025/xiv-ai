import {
  BJ_LOCKS,
  BRAIN_SUBSYSTEMS,
  type BrainSubsystemId,
  type BrainSubsystemStatus,
} from './global-operations-brain-types';

/**
 * Global Operations Brain root façade / registry.
 * Wires existing 62L modules by reference — does not duplicate prior phase code.
 */

const MODULE_HINTS: Record<BrainSubsystemId, string> = {
  memory_cortex: 'memory-cortex.ts / cortex-runtime.ts (62L-X)',
  knowledge_atlas: 'knowledge-lake.ts / offline-intelligence-index.ts (62L-AB)',
  offline_world_model: 'simulation-lab.ts / logical-universe-graph.ts (probe; BE WAITING_DATA)',
  agent_civilization: 'agent-population.ts / agent-mesh.ts / collaboration-protocol.ts',
  agent_university: 'probe_only — BG WAITING_DATA',
  neural_bus: 'agent-neural-bus.ts / persistent-agent-bus.ts (62L-BD)',
  research_civilization: 'global-research-council.ts (probe; BH WAITING_DATA)',
  discovery_foundry: 'probe_only — BI WAITING_DATA',
  business_industry_intelligence: 'marketing-intelligence-council.ts / quant-logic.ts',
  security_guardian: 'sandbox-guard.ts / security-verifier.ts / ceo-sealed-vault.ts',
  executive_cortex: 'executive-decision-cortex.ts (62L-BJ) + decision-gate.ts + founder-decision-engine.ts',
  local_edge_cloud_runtime: 'hybrid-edge-cloud-runtime.ts / device-node-runtime.ts / offline-brain-runtime.ts',
  workforce_scheduler: 'global-agent-workforce-scheduler.ts (62L-BJ) + agent-population.ts + kpi-scheduler.ts',
  business_world_simulation: 'business-world-simulation.ts (62L-BJ) + founder-digital-twin.ts',
  decision_outcome_learning: 'decision-outcome-learning.ts (62L-BJ) + learning-ledger.ts',
  executive_control_tower: 'executive-control-tower-api.ts (62L-BJ) + information-control-tower-runtime.ts (62L-AN)',
};

const WAITING: BrainSubsystemId[] = [
  'agent_university',
  'discovery_foundry',
  'research_civilization',
  'offline_world_model',
];

const WIRED: BrainSubsystemId[] = [
  'memory_cortex',
  'knowledge_atlas',
  'agent_civilization',
  'neural_bus',
  'business_industry_intelligence',
  'security_guardian',
  'executive_cortex',
  'local_edge_cloud_runtime',
  'workforce_scheduler',
  'business_world_simulation',
  'decision_outcome_learning',
  'executive_control_tower',
];

export function registerBrainSubsystems(): BrainSubsystemStatus[] {
  return BRAIN_SUBSYSTEMS.map((id) => {
    let binding: BrainSubsystemStatus['binding'] = 'probe_only';
    if (WIRED.includes(id)) binding = 'wired';
    if (WAITING.includes(id)) binding = 'waiting_data';
    return {
      id,
      binding,
      moduleHint: MODULE_HINTS[id],
      productionAuthorization: false,
    };
  });
}

export function getBrainSubsystem(id: BrainSubsystemId, registry = registerBrainSubsystems()) {
  return registry.find((s) => s.id === id) ?? null;
}

export function brainRegistryHonesty() {
  return {
    banner: 'Global Operations Brain is an integration root, not a mega-PR boundary.',
    locks: BJ_LOCKS,
    subsystemCount: BRAIN_SUBSYSTEMS.length,
    wiredCount: WIRED.length,
    waitingCount: WAITING.length,
    productionAuthorization: false as const,
    l4AutonomyEnabled: BJ_LOCKS.L4_AUTONOMY_ENABLED,
    megaPrBulkIncluded: BJ_LOCKS.MEGA_PR_BULK_INCLUDED,
  };
}

export function describeGlobalOperationsBrain() {
  const registry = registerBrainSubsystems();
  return {
    name: 'Global Operations Brain',
    role: 'architectural_root_facade',
    registry,
    honesty: brainRegistryHonesty(),
  };
}
