import { publishAgentMessage } from './agent-bus';
import { BUSINESS_DEPARTMENTS } from './business-structure';
import { buildFounderReport } from './founder-report';
import { NeuralFabric } from './neural-fabric';
import { getRuntime } from './hybrid-runtime';
import { providerSlots } from './provider-fabric';
import { getAgentTool } from '../tools';
import { authorizeTool } from '../policies';
import { cortexMemoryStats } from './memory-cortex';
import { worldKnowledgeStats } from './world-knowledge-graph';
import { retrieveEvidencePathway } from './cortex-evidence';
import { conveneHistoricalCulturalCouncil, listCouncils, councilStats } from './cortex-councils';
import {
  recordOutcomeAndLearn,
  runClassicalQuantQuantumBridge,
  runScenarioSimulation,
  simulationLabStats,
} from './simulation-lab';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import type { QuantSignal } from './quant-logic';
import type { QuantOptimizationProblem } from './quantum-research';
import { checkLocalBrainHealth } from './health-check';

export const CORTEX_ARCHITECTURE = [
  'founder_digital_twin',
  'neural_highways',
  'agent_bus',
  'tool_mesh',
  'departments',
  'memory_cortex',
  'world_knowledge_graph',
  'evidence',
  'agent_councils',
  'simulation',
  'decision',
  'build_test',
  'outcome',
  'learning',
  'memory',
  'stronger_future_pathways',
] as const;

export type CortexPathwayStep = (typeof CORTEX_ARCHITECTURE)[number];

function consultToolMesh() {
  const tool = getAgentTool('search_knowledge');
  const decision = authorizeTool({
    agentType: 'employee_agent',
    toolId: 'search_knowledge',
    approved: true,
    anonymous: false,
  });
  return {
    toolId: tool.id,
    layer: tool.layer,
    allowed: decision.allowed,
    liveSystems: 'UNAVAILABLE' as const,
    reason: 'Tool Mesh is consulted locally. Unconfigured live systems remain UNAVAILABLE.',
  };
}

export async function runMemoryCortexPathway(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  consequence?: ConsequenceClass;
  conveneCouncil?: boolean;
  simulate?: boolean;
  signals?: QuantSignal[];
  quantum?: Parameters<typeof runClassicalQuantQuantumBridge>[0]['quantum'];
  problem?: QuantOptimizationProblem;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const steps: CortexPathwayStep[] = [...CORTEX_ARCHITECTURE];

  const twin = await buildFounderReport(root);
  const highways = new NeuralFabric();
  highways.registerNode({
    id: `twin:${input.tenantId}`,
    kind: 'agent',
    label: 'Founder Digital Twin brief (not the real founder)',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['founder-report'],
  });
  highways.registerNode({
    id: `memory:${input.tenantId}`,
    kind: 'knowledge',
    label: 'Memory Cortex',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'UNKNOWN',
    provenanceRefs: ['memory-cortex'],
  });
  highways.connect({
    from: `twin:${input.tenantId}`,
    to: `memory:${input.tenantId}`,
    relation: 'neural_highway',
    weight: 0.4,
    confidence: 0.5,
    evidenceRefs: ['founder-report'],
  });

  const bus = publishAgentMessage({
    fromRole: 'executive_synthesizer',
    toRole: 'memory_librarian',
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'task',
    body: `Cortex pathway: ${input.objective}`,
    evidenceRefs: [],
    requiresHumanApproval: (input.consequence ?? 'LOW') !== 'LOW',
  });

  const toolMesh = consultToolMesh();
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.objective,
    root,
  });

  const council = input.conveneCouncil === false
    ? null
    : await conveneHistoricalCulturalCouncil({
      tenantId: input.tenantId,
      universeId: input.universeId,
      topic: input.objective,
      root,
    });

  const simulation = input.simulate === false
    ? null
    : await runScenarioSimulation({
      tenantId: input.tenantId,
      universeId: input.universeId,
      hypothesis: input.objective,
      consequence: input.consequence,
      root,
    });

  const gate = decisionGate({
    id: `cortex-decision-${bus.id}`,
    action: input.objective,
    consequence: input.consequence ?? 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });

  const quant = input.signals
    ? await runClassicalQuantQuantumBridge({
      tenantId: input.tenantId,
      universeId: input.universeId,
      signals: input.signals,
      quantum: input.quantum,
      problem: input.problem,
      root,
    })
    : null;

  const outcome = simulation && simulation.status === 'COMPLETED'
    ? await recordOutcomeAndLearn({
      tenantId: input.tenantId,
      universeId: input.universeId,
      simulationId: simulation.id,
      observed: `Local simulation completed for ${input.objective}. Not reality.`,
      successful: true,
      memoryIds: evidence.memoryIds.slice(0, 8),
      evidenceRefs: evidence.evidenceRefs,
      root,
    })
    : null;

  return {
    steps,
    twin: {
      source: 'founder-report' as const,
      twinIsRealFounder: false as const,
      headline: twin.headline,
      safety: twin.safety,
    },
    neuralHighways: highways.stats(),
    agentBusMessageId: bus.id,
    toolMesh,
    departments: BUSINESS_DEPARTMENTS.map((department) => department.key),
    evidence,
    council,
    simulation,
    decision: gate,
    buildTest: {
      executed: false as const,
      reason: 'Build/test remains an allowlisted sandbox hop; this pathway records the decision and does not merge, deploy, or push.',
    },
    quant,
    outcome,
    providers: providerSlots().map((slot) => ({ provider: slot.provider, state: slot.state, configured: slot.configured })),
    productionAuthorization: false as const,
    next: '62L-Y — Global Brain Executive Cortex + Autonomous Research Laboratory',
  };
}

export async function buildCortexHealthReport(root = process.cwd()) {
  const [health, memory, knowledge, simulations, founder] = await Promise.all([
    checkLocalBrainHealth(root),
    cortexMemoryStats(root),
    worldKnowledgeStats(root),
    simulationLabStats(root),
    buildFounderReport(root),
  ]);
  const councils = await listCouncils('health-probe', 'health-universe', root);
  const cloud = ['aws', 'azure', 'gcp'] as const;
  return {
    generatedAt: new Date().toISOString(),
    architecture: CORTEX_ARCHITECTURE,
    localHealth: health,
    memory,
    knowledge,
    simulations,
    councils: councilStats(councils),
    retentionPolicy: {
      ephemeralTtlMs: 60 * 60_000,
      workingTtlMs: 7 * 24 * 60 * 60_000,
      durableTtlMs: 90 * 24 * 60 * 60_000,
      archivalTtlMs: null,
      contradictionHistoryDeleted: false as const,
    },
    founderTwinIsRealFounder: false as const,
    neuralTransit: {
      source: 'neural-fabric' as const,
      note: '62L-W Neural Transit is reused when that module is on the tree; this health view uses Neural Fabric highways already present on Local Brain.',
      productionAuthorization: false as const,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
      configured: slot.configured,
    })),
    cloudRuntimes: cloud.map((provider) => {
      const runtime = getRuntime(provider);
      return { provider, state: runtime.configured ? runtime.state : 'UNAVAILABLE' };
    }),
    quantumProductionDependency: false as const,
    safety: founder.safety,
    productionAuthorization: false as const,
    inventedPass: false as const,
    next: '62L-Y — Global Brain Executive Cortex + Autonomous Research Laboratory',
  };
}
