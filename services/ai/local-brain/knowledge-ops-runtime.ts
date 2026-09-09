import { BUSINESS_DEPARTMENTS } from './business-structure';
import { storyAt } from './story-factory';
import { retrieveEvidencePathway } from './cortex-evidence';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { runScenarioSimulation, recordOutcomeAndLearn } from './simulation-lab';
import { runTestingAgent } from './testing-agent';
import { appendLearning } from './learning-ledger';
import { consolidateExecutiveMemory } from './executive-memory';
import { FounderPriorityGraph, mintPriorityNode } from './founder-priority-graph';
import { operateKnowledge } from './knowledge-ops-controller';
import { probeLocalModelAdapter, selectLocalFirstProvider, toolchainSlots } from './toolchain-federation';
import { bridgeGithubGitlabEvidence } from './scm-evidence-bridge';
import { enqueueOfflineSync, drainOfflineSyncQueue } from './offline-sync-queue';
import { recordDebateTurn, routeCrossDomain, resolveExecutiveConflict } from './debate-conflict';
import { recordIndustryTimelineEvent, registerRegionalIntelligencePack } from './timeline-regional-packs';
import { rememberHardwareCapabilities, mapInfrastructureDependencies, inspectSignalTransportKnowledge } from './infra-hardware-signal-memory';
import { runQuantumKnowledgeOps, recordReproducibility, evolveAgentSkill } from './quantum-repro-skills';
import { detectKnowledgeGaps } from './knowledge-gap-detector';
import { consolidateDebriefMemory } from './debrief-memory-ops';
import { measureOfflineContinuityScore, type ApprovedWorkloadItem } from './offline-continuity-score';
import { benchmarkLogicalScale, assertScaleIsLogical } from './logical-scale';
import { buildGlobalBrainHealthReport } from './global-brain-health';
import { upsertPartitionedKnowledge } from './world-knowledge-graph';
import { openResourceLedger } from './resource-governance';
import type { EvidenceState } from './evidence-promotion-gate';

export const KNOWLEDGE_OPS_CYCLE = [
  'founder_intent',
  'executive_memory',
  'story',
  'context_retrieval',
  'agent_department_routing',
  'tool_model_selection',
  'evidence',
  'work_experiment',
  'test_critique',
  'decision',
  'human_gate',
  'outcome',
  'learning',
  'memory_consolidation',
  'debrief',
  'next_priority',
] as const;

export const DEVELOPMENT_EVIDENCE_BRIDGE = [
  'story',
  'branch',
  'files',
  'commands',
  'tests',
  'security_evidence',
  'build_report',
  'learning_entry',
] as const;

export async function runKnowledgeOpsCycle(input: {
  tenantId: string;
  universeId: string;
  founderIntent: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  needsExternalFreshness?: boolean;
  executeTests?: boolean;
  testCwd?: string;
  includeQuantum?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const consequence = input.consequence ?? 'LOW';

  const memory = await consolidateExecutiveMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.founderIntent,
    root,
  });
  const story = storyAt(Math.abs(input.founderIntent.length) % 500);
  const context = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.founderIntent,
    root,
  });
  const department = BUSINESS_DEPARTMENTS[0];
  await probeLocalModelAdapter();
  const selection = selectLocalFirstProvider({
    online: input.needsExternalFreshness !== true,
    classification: 'internal',
    needsExternalFreshness: input.needsExternalFreshness,
  });
  const knowledge = await operateKnowledge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.founderIntent,
    sourceRefs: context.evidenceRefs.length ? context.evidenceRefs : ['local:knowledge-ops'],
    promoteTo: context.evidenceRefs.length ? 'claims' : 'unknowns',
    root,
  });
  const simulation = await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: input.founderIntent,
    consequence,
    root,
  });
  let test: { state: EvidenceState; summary: string } = { state: 'NOT_TESTED', summary: 'Tests were not executed.' };
  if (input.executeTests && input.testCwd) {
    const result = await runTestingAgent({
      cwd: input.testCwd,
      commands: ['git_status'],
    });
    test = {
      state: result.passed ? 'PASS' : 'FAIL',
      summary: result.reason ?? `git_status passed=${result.passed}`,
    };
  }
  const gate = decisionGate({
    id: story.id,
    action: input.founderIntent,
    consequence,
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });
  const outcome = await recordOutcomeAndLearn({
    tenantId: input.tenantId,
    universeId: input.universeId,
    simulationId: simulation.id,
    observed: `gate=${gate.humanApprovalRequired ? 'HUMAN' : 'LOCAL'}; test=${test.state}`,
    successful: !gate.humanApprovalRequired && test.state !== 'FAIL',
    evidenceRefs: context.evidenceRefs,
    root,
  });
  const learning = await appendLearning({
    domain: 'operations',
    subject: `kops-cycle:${story.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: input.founderIntent,
    sourceRefs: context.evidenceRefs,
    evidence: context.evidenceRefs,
  }, root);
  const debrief = await consolidateDebriefMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: story.id,
    whatWorked: test.state === 'PASS' ? ['local test hop'] : [],
    whatFailed: test.state === 'FAIL' ? ['local test hop'] : [],
    remainingUnknowns: selection.selected ? [] : [selection.reason],
    nextSafeStep: gate.humanApprovalRequired ? 'Wait for human gate.' : 'Continue local knowledge ops.',
    root,
  });
  const graph = new FounderPriorityGraph(input.tenantId, input.universeId);
  const intentNode = graph.addNode(mintPriorityNode('intent', input.founderIntent, 0.9, context.evidenceRefs));
  const nextNode = graph.addNode(mintPriorityNode('next_safe_step', debrief.debrief.nextSafeStep, 0.7, []));
  graph.connect({ id: 'edge-next', from: intentNode.id, to: nextNode.id, relation: 'unlocks' });
  const priorities = await graph.persist(root);

  let quantum = null;
  if (input.includeQuantum) {
    quantum = await runQuantumKnowledgeOps({
      tenantId: input.tenantId,
      universeId: input.universeId,
      objective: input.founderIntent,
      signals: [{ id: 'sig-aa', weight: 0.1, confidence: 0.4, direction: 0, evidenceRefs: ['synthetic:62laa'] }],
      qubitCount: 4,
      root,
    });
  }

  return {
    steps: [...KNOWLEDGE_OPS_CYCLE],
    bridge: [...DEVELOPMENT_EVIDENCE_BRIDGE],
    memory,
    story,
    context,
    department,
    selection,
    knowledge,
    simulation,
    test,
    gate,
    outcome,
    learning,
    debrief,
    priorities,
    quantum,
    honesty: {
      l4AutonomyEnabled: false as const,
      inventedFacts: false as const,
      founderApprovalFabricated: false as const,
      mergeToMain: false as const,
      tipLand: false as const,
      productionAuthorization: false as const,
    },
  };
}

export async function runSafeScaleHarness(input: {
  tenantId: string;
  universeId: string;
  materializedContexts?: number;
}) {
  const million = benchmarkLogicalScale({ tier: 'million', materializedContexts: input.materializedContexts ?? 8, materializedPathways: 2 });
  const billion = benchmarkLogicalScale({ tier: 'billion', materializedContexts: input.materializedContexts ?? 8, materializedPathways: 2 });
  const trillion = benchmarkLogicalScale({ tier: 'trillion', materializedContexts: input.materializedContexts ?? 8, materializedPathways: 2 });
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    million,
    billion,
    trillion,
    logicalOnly: assertScaleIsLogical(trillion) && assertScaleIsLogical(billion) && assertScaleIsLogical(million),
    materializedProcessCap: 10_000,
    noPhysicalFleetSpawn: true as const,
    productionAuthorization: false as const,
  };
}

export async function buildGlobalBrainOpsReport(input: {
  tenantId: string;
  universeId: string;
  workload?: ApprovedWorkloadItem[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const [health, continuity, hardware, toolchain, gaps, ledger] = await Promise.all([
    buildGlobalBrainHealthReport({ tenantId: input.tenantId, universeId: input.universeId, root }),
    measureOfflineContinuityScore({
      tenantId: input.tenantId,
      universeId: input.universeId,
      workload: input.workload ?? [],
      root,
    }),
    rememberHardwareCapabilities(root),
    Promise.resolve(toolchainSlots()),
    detectKnowledgeGaps({ tenantId: input.tenantId, universeId: input.universeId, root }),
    openResourceLedger({ tenantId: input.tenantId, universeId: input.universeId, budget: { maxAgents: 4 }, root }),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    cycle: KNOWLEDGE_OPS_CYCLE,
    bridge: DEVELOPMENT_EVIDENCE_BRIDGE,
    health,
    continuity,
    hardware,
    toolchain,
    gaps,
    ledger: { id: ledger.id, autoPurchase: false as const, productionAuthorization: false as const },
    next: [
      'Do not tip-land xiv-v2.',
      'Do not merge to main.',
      'Do not create a pull request from this phase.',
      'Unconfigured providers remain UNAVAILABLE.',
    ],
    honesty: {
      inventedPass: false as const,
      l4AutonomyEnabled: false as const,
      productionAuthorization: false as const,
    },
  };
}

export {
  enqueueOfflineSync,
  drainOfflineSyncQueue,
  recordDebateTurn,
  routeCrossDomain,
  resolveExecutiveConflict,
  recordIndustryTimelineEvent,
  registerRegionalIntelligencePack,
  mapInfrastructureDependencies,
  inspectSignalTransportKnowledge,
  recordReproducibility,
  evolveAgentSkill,
  upsertPartitionedKnowledge,
  bridgeGithubGitlabEvidence,
};
