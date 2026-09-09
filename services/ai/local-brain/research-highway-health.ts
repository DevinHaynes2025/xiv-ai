import { NeuralFabric } from './neural-fabric';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { listSignalPathways, signalInfrastructureHonesty, satelliteOrbitalGateway } from './signal-infrastructure';
import { knowledgePackStats } from './knowledge-packs';
import { simulationLabStats } from './simulation-lab';
import { cortexMemoryStats } from './memory-cortex';
import { worldKnowledgeStats } from './world-knowledge-graph';
import { CHIP_COMPUTE_HONESTY } from './chip-compute-graph';
import { PHYSICS_HONESTY } from './physics-domains';
import { listResearchJobs } from './offline-resilience';
import { checkLocalBrainHealth } from './health-check';

export const RESEARCH_HIGHWAYS = [
  'question',
  'hypothesis',
  'historical_evidence',
  'specialist_agents',
  'debate',
  'simulation_experiment',
  'result',
  'critique',
  'human_correction',
  'learning_ledger',
  'revised_hypothesis',
  'stronger_pathway',
] as const;

export async function buildResearchHighwayHealthMap(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const fabric = new NeuralFabric();
  fabric.registerNode({
    id: `research:${input.tenantId}`,
    kind: 'workflow',
    label: 'Offline Research Civilization',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['research-civilization'],
  });
  fabric.registerNode({
    id: `memory:${input.tenantId}`,
    kind: 'knowledge',
    label: 'Memory Cortex',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'UNKNOWN',
    provenanceRefs: ['memory-cortex'],
  });
  fabric.connect({
    from: `research:${input.tenantId}`,
    to: `memory:${input.tenantId}`,
    relation: 'research_highway',
    weight: 0.5,
    confidence: 0.5,
    evidenceRefs: ['research-civilization'],
  });

  const [health, memory, knowledge, packs, sims, jobs] = await Promise.all([
    checkLocalBrainHealth(root),
    cortexMemoryStats(root),
    worldKnowledgeStats(root),
    knowledgePackStats(root),
    simulationLabStats(root),
    listResearchJobs(root),
  ]);

  const satellite = satelliteOrbitalGateway();
  const signals = listSignalPathways().map((item) => ({
    kind: item.kind,
    state: item.state,
    mode: item.mode,
    controlsPhysicalDevices: item.controlsPhysicalDevices,
  }));

  return {
    generatedAt: new Date().toISOString(),
    highways: RESEARCH_HIGHWAYS,
    neural: fabric.stats(),
    localHealth: health,
    memory,
    knowledge,
    packs,
    simulations: sims,
    resilienceJobs: {
      total: jobs.length,
      queued: jobs.filter((job) => job.state === 'queued').length,
      waitingData: jobs.filter((job) => job.state === 'waiting_data').length,
      unavailable: jobs.filter((job) => job.state === 'unavailable').length,
      denied: jobs.filter((job) => job.state === 'denied').length,
      preferOffline: true as const,
    },
    signals,
    satellite: {
      controlPhysicalSatellites: satellite.controlPhysicalSatellites,
      hardwareAdapter: satellite.hardwareAdapter,
      starlinkTransport: satellite.starlinkTransport,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    cloudRuntimes: (['aws', 'azure', 'gcp'] as const).map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    honesty: {
      ...PHYSICS_HONESTY,
      ...CHIP_COMPUTE_HONESTY,
      ...signalInfrastructureHonesty(),
      satelliteControl: false as const,
      claimsConsciousness: false as const,
      l4AutonomyEnabled: false as const,
      productionAuthorization: false as const,
      inventedPass: false as const,
    },
  };
}
