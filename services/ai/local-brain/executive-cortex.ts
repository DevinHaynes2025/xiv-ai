import { BUSINESS_DEPARTMENTS } from './business-structure';
import { retrieveEvidencePathway } from './cortex-evidence';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { appendEvidenceEvent } from './evidence-ledger';
import { storyAt } from './story-factory';
import { recordOutcomeAndLearn, runScenarioSimulation } from './simulation-lab';
import { strengthenCortexPathway } from './memory-cortex';
import { runTestingAgent } from './testing-agent';
import { runBoundedSelfImprovement } from './self-improvement-harness';
import { openResourceLedger, chargeResource, type ResourceLedger } from './resource-governance';
import { recruitExecutiveSpecialists } from './specialist-recruitment';
import { mintCompetingHypotheses } from './hypothesis-factory';
import { walkClosedIntelligenceLoop } from './bounded-feedback';
import { NeuralFeedbackPathways } from './neural-feedback';
import { recordAgentPerformance } from './agent-performance';
import { runGlobalMarketResearchCell } from './market-research-cells';
import { runCrossIndustryHistoricalIntelligence } from './historical-intelligence';
import { ingestOfflineKnowledgePack } from './offline-knowledge-packs';
import { runOfflineRndExperiment } from './rnd-laboratory';
import { inspectChipDataCenterNetwork, runBoundedSignalResearch, registerChipComputeNode } from './infra-intelligence';
import { inspectPhysicsResearchDomain, runExecutiveQuantumResearch } from './science-research';
import { enterOfflineCivilizationMode } from './offline-civilization-mode';
import { calibrateIntelligence } from './intelligence-calibration';
import { conveneAdversarialCouncil } from './adversarial-councils';
import { runDebriefRestCycle } from './debrief-rest';
import { buildFounderIntelligenceBrief } from './founder-intelligence-brief';
import { benchmarkLogicalScale } from './logical-scale';
import { cortexId } from './cortex-store';

export const EVIDENCE_STATES = ['PASS', 'FAIL', 'UNAVAILABLE', 'WAITING_DATA', 'UNKNOWN', 'NOT_TESTED'] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

export const EXECUTIVE_INTELLIGENCE_CYCLE = [
  'founder_intent',
  'story',
  'memory_context',
  'department',
  'specialist_council',
  'competing_hypotheses',
  'evidence',
  'simulation_experiment',
  'skeptic_security_review',
  'decision_options',
  'human_gate',
  'implementation_candidate',
  'test',
  'outcome',
  'learning',
  'neural_pathway_update',
  'debrief',
  'next_story',
] as const;

export type ExecutiveCycleStep = (typeof EXECUTIVE_INTELLIGENCE_CYCLE)[number];

export type ExecutiveCortex = {
  id: string;
  tenantId: string;
  universeId: string;
  cycle: typeof EXECUTIVE_INTELLIGENCE_CYCLE;
  l4AutonomyEnabled: false;
  claimsConsciousness: false;
  canFabricateFounderApproval: false;
  productionAuthorization: false;
};

export function createExecutiveCortex(input: { tenantId: string; universeId: string }): ExecutiveCortex {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  return {
    id: cortexId('exec'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: EXECUTIVE_INTELLIGENCE_CYCLE,
    l4AutonomyEnabled: false,
    claimsConsciousness: false,
    canFabricateFounderApproval: false,
    productionAuthorization: false,
  };
}

function mapEvidence(state: string): EvidenceState {
  if (state === 'AVAILABLE' || state === 'COMPLETED' || state === 'completed' || state === 'PASS' || state === 'LOCAL_EXECUTABLE') return 'PASS';
  if (state === 'FAIL' || state === 'denied' || state === 'DENIED') return 'FAIL';
  if (state === 'WAITING_DATA' || state === 'waiting_data') return 'WAITING_DATA';
  if (state === 'UNAVAILABLE' || state === 'unavailable') return 'UNAVAILABLE';
  if (state === 'NOT_TESTED') return 'NOT_TESTED';
  return 'UNKNOWN';
}

export async function runExecutiveIntelligenceCycle(input: {
  tenantId: string;
  universeId: string;
  founderIntent: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  permissionChange?: boolean;
  executeTests?: boolean;
  testCwd?: string;
  includeQuantum?: boolean;
  needsExternalFreshness?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.founderIntent.trim()) throw new Error('FOUNDER_INTENT_REQUIRED');
  const root = input.root ?? process.cwd();
  const cortex = createExecutiveCortex({ tenantId: input.tenantId, universeId: input.universeId });
  const steps: ExecutiveCycleStep[] = [...EXECUTIVE_INTELLIGENCE_CYCLE];
  const closedLoop = walkClosedIntelligenceLoop({});

  const ledger: ResourceLedger = await openResourceLedger({
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });

  const story = storyAt(62);
  const storyRecord = {
    ...story,
    goal: input.founderIntent.trim().slice(0, 180),
    outcome: `Founder intent captured as a Local Brain story. Persona remains ${story.persona}.`,
  };

  const pack = await ingestOfflineKnowledgePack({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    domain: 'technology',
    title: 'Executive cycle local pack',
    claims: [{
      id: `exec-pack-${cortex.id}`,
      label: 'Local founder intent',
      summary: input.founderIntent.trim().slice(0, 240),
      claimState: 'MODEL_INFERENCE',
      sourceRefs: ['synthetic:62lz-intent'],
    }],
    root,
  });

  const memory = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.founderIntent,
    partition: 'business',
    root,
  });

  const department = BUSINESS_DEPARTMENTS.find((item) => item.key === 'executive') ?? BUSINESS_DEPARTMENTS[0];
  const chargedAgents = await chargeResource({
    id: ledger.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agents: 4,
    modelCalls: 1,
    ms: 25,
    root,
  });
  const activeLedger = chargedAgents.allowed ? chargedAgents.ledger : ledger;

  const specialists = recruitExecutiveSpecialists({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: storyRecord.id,
    consequence: input.consequence,
    approved: true,
    ledger: activeLedger,
  });

  const hypotheses = await mintCompetingHypotheses({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: storyRecord.id,
    intent: input.founderIntent,
    localEvidenceRefs: memory.evidenceRefs,
    root,
  });

  const historical = await runCrossIndustryHistoricalIntelligence({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.founderIntent,
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });

  const market = await runGlobalMarketResearchCell({
    tenantId: input.tenantId,
    universeId: input.universeId,
    market: 'offline-local-index',
    needsExternalFreshness: input.needsExternalFreshness,
    root,
  });

  const civilization = await enterOfflineCivilizationMode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.founderIntent,
    requirement: {
      needsExternalFreshness: input.needsExternalFreshness === true,
      needsProductionWrite: input.production === true,
      needsPermissionChange: input.permissionChange === true,
    },
    root,
  });

  const rnd = await runOfflineRndExperiment({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.founderIntent,
    hypothesis: hypotheses[0]?.statement ?? input.founderIntent,
    includeQuantumLab: input.includeQuantum === true,
    consequence: input.consequence,
    memoryIds: memory.memoryIds.slice(0, 4),
    root,
  });

  registerChipComputeNode({
    id: `cpu-${cortex.id}`,
    family: 'cpu_x86_64',
    state: 'AVAILABLE',
    configured: true,
    authorized: true,
    locality: 'device',
    capabilities: ['local_research'],
    maxConcurrentTasks: 2,
    productionAuthorized: false,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Executive Cortex local CPU',
    provenanceRefs: ['synthetic:62lz-cpu'],
  });
  const infra = inspectChipDataCenterNetwork({
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  const signal = runBoundedSignalResearch({
    kind: 'radio',
    from: 'exec-lab',
    to: 'research-lab',
    distanceKm: 2,
  });
  const physics = inspectPhysicsResearchDomain('dark_matter_research');
  const quantum = input.includeQuantum
    ? runExecutiveQuantumResearch({
      id: `q-${cortex.id}`,
      objective: `Classical-first research for: ${input.founderIntent.slice(0, 80)}`,
      algorithm: 'qaoa',
      backend: 'classical_simulator',
      qubitCount: 4,
    })
    : null;

  const simulation = await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: hypotheses[0]?.statement ?? input.founderIntent,
    consequence: input.consequence,
    production: input.production,
    root,
  });

  const adversarial = await conveneAdversarialCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    question: input.founderIntent,
    candidateText: hypotheses[0]?.statement,
    consequence: input.consequence,
    production: input.production,
    permissionChange: input.permissionChange,
    root,
  });

  const gate = decisionGate({
    id: `exec-gate-${cortex.id}`,
    action: input.founderIntent,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.permissionChange === true,
    externalPublication: false,
  });

  const implementationCandidate = {
    kind: 'structured_proposal' as const,
    executable: gate.executableByAgent && adversarial.security.passed,
    mergeToMain: false as const,
    productionGitPush: false as const,
    reason: gate.executableByAgent
      ? 'Low-consequence sandbox candidate only. Not a merge or deploy.'
      : gate.reason,
  };

  let testState: EvidenceState = 'NOT_TESTED';
  let testResult: Awaited<ReturnType<typeof runTestingAgent>> | null = null;
  if (input.executeTests) {
    testResult = await runTestingAgent({
      cwd: input.testCwd ?? root,
      commands: ['git_status'],
    });
    testState = testResult.passed ? 'PASS' : 'FAIL';
  }

  const outcome = simulation.status === 'COMPLETED'
    ? await recordOutcomeAndLearn({
      tenantId: input.tenantId,
      universeId: input.universeId,
      simulationId: simulation.id,
      observed: `Executive cycle recorded a local outcome for ${input.founderIntent.slice(0, 80)}. Not reality.`,
      successful: testState !== 'FAIL',
      memoryIds: memory.memoryIds.slice(0, 8),
      evidenceRefs: memory.evidenceRefs,
      root,
    })
    : null;

  const calibration = await calibrateIntelligence({
    tenantId: input.tenantId,
    universeId: input.universeId,
    priorConfidence: 0.4,
    observedSuccess: testState === 'PASS' || simulation.status === 'COMPLETED',
    evidenceCount: memory.evidenceRefs.length,
    evidenceState: mapEvidence(memory.state),
    root,
  });

  const improvement = await runBoundedSelfImprovement({
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: `Improve ranking for: ${input.founderIntent.slice(0, 80)}`,
    observed: calibration.reason,
    successful: calibration.state === 'PASS',
    memoryIds: memory.memoryIds.slice(0, 4),
    evidenceRefs: memory.evidenceRefs,
    consequence: input.consequence,
    permissionChange: input.permissionChange,
    production: input.production,
    root,
  });

  const highways = new NeuralFeedbackPathways();
  highways.registerEndpoint({
    id: `intent:${input.tenantId}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Founder intent',
    kind: 'decision',
    provenanceRefs: ['founder-intent'],
  });
  highways.registerEndpoint({
    id: `memory:${input.tenantId}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: 'Memory / context',
    kind: 'knowledge',
    provenanceRefs: ['memory-cortex'],
  });
  const highway = highways.connect({
    tenantId: input.tenantId,
    universeId: input.universeId,
    from: `intent:${input.tenantId}`,
    to: `memory:${input.tenantId}`,
    provenanceRefs: ['founder-intent', 'memory-cortex'],
    correlationId: cortex.id,
    consequence: input.consequence,
    evidenceRefs: memory.evidenceRefs.length ? memory.evidenceRefs : ['synthetic:62lz-pathway'],
  });

  const strengthened = [];
  for (const id of memory.memoryIds.slice(0, 4)) {
    const next = await strengthenCortexPathway({
      id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      delta: calibration.state === 'PASS' ? 0.1 : 0.02,
      root,
    });
    strengthened.push({ id: next.id, pathwayStrength: next.pathwayStrength });
  }

  if (specialists.agents[0]) {
    await recordAgentPerformance({
      tenantId: input.tenantId,
      universeId: input.universeId,
      role: specialists.agents[0].role,
      taskId: storyRecord.id,
      successful: calibration.state !== 'FAIL',
      notes: specialists.reason,
      evidenceRefs: memory.evidenceRefs,
      root,
    });
  }

  const debrief = await runDebriefRestCycle({
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: storyRecord.id,
    ledger: activeLedger,
    whatWorked: [
      `cycle walked ${steps.length} executive steps`,
      `closed loop walked ${closedLoop.completed.length} hops`,
    ],
    whatFailed: [
      ...(testState === 'FAIL' ? ['allowlisted test hop failed'] : []),
      ...(gate.humanApprovalRequired ? ['human gate blocked execution'] : []),
    ],
    contradictions: hypotheses.slice(1).map((item) => item.id),
    evidenceLearned: memory.evidenceRefs,
    agentPerformance: specialists.agents.map((agent) => agent.role),
    remainingUnknowns: [
      ...(memory.inventedFacts ? [] : ['no invented facts']),
      ...(input.needsExternalFreshness ? ['external freshness WAITING_DATA'] : []),
    ],
    nextSafeStep: 'Review the Founder Intelligence Brief; do not merge main or tip-land xiv-v2.',
    root,
  });

  const haltedRecruitment = recruitExecutiveSpecialists({
    tenantId: input.tenantId,
    universeId: input.universeId,
    taskId: `${storyRecord.id}-post-debrief`,
    approved: true,
    ledger: { ...activeLedger, debriefLock: true, recruitmentHalted: true },
  });

  const brief = await buildFounderIntelligenceBrief({
    root,
    cycleId: cortex.id,
    evidenceStates: [
      { label: 'evidence', state: mapEvidence(memory.state) },
      { label: 'market', state: mapEvidence(market.state) },
      { label: 'historical', state: mapEvidence(historical.state) },
      { label: 'test', state: testState },
      { label: 'calibration', state: calibration.state },
      { label: 'quantum', state: quantum ? mapEvidence(quantum.experiment.state) : 'NOT_TESTED' },
    ],
  });

  const scale = benchmarkLogicalScale({
    tier: 'trillion',
    materializedContexts: 1 + hypotheses.length + specialists.agents.length,
    materializedPathways: highways.stats().logicalPathways,
  });

  await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: storyRecord.id,
    summary: `Executive Cortex cycle ${cortex.id} completed locally.`,
    payload: { steps, testState, humanApprovalRequired: gate.humanApprovalRequired },
  }, root);

  const nextStory = storyAt(63);

  return {
    cortex,
    steps,
    closedLoop,
    founderIntent: input.founderIntent.trim(),
    story: storyRecord,
    memory,
    department: department.key,
    specialists,
    hypotheses,
    evidence: memory,
    historical,
    market,
    pack,
    civilization,
    rnd,
    infra,
    signal,
    physics,
    quantum,
    simulation,
    adversarial,
    decisionOptions: {
      prepareLocally: gate.executableByAgent,
      humanApprovalRequired: gate.humanApprovalRequired,
      reason: gate.reason,
    },
    humanGate: gate,
    implementationCandidate,
    test: { state: testState, result: testResult },
    outcome,
    calibration,
    improvement,
    neuralPathway: highway,
    neuralStats: highways.stats(),
    strengthened,
    debrief,
    haltedRecruitment,
    brief,
    scale,
    nextStory: {
      id: nextStory.id,
      goal: nextStory.goal,
    },
    honesty: {
      l4AutonomyEnabled: false as const,
      inventedFacts: false as const,
      founderApprovalFabricated: false as const,
      claimsConsciousness: false as const,
      darkMatterAsInfrastructure: false as const,
      quantumAdvantageClaimed: false as const,
      tipLand: false as const,
      productionAuthorization: false as const,
    },
    productionAuthorization: false as const,
  };
}
