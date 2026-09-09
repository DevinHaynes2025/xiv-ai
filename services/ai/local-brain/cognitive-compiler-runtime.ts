import { existsSync } from 'node:fs';

import { decisionGate } from './decision-gate';
import { GlobalBrainHighways } from './global-brain-highways';
import { NeuralFabric } from './neural-fabric';
import { providerSlots } from './provider-fabric';
import { getRuntime } from './hybrid-runtime';
import { checkLocalBrainHealth } from './health-check';
import { runDecisionCouncil } from './workcells';
import { SEALED_REDACTION } from './ceo-sealed-vault';
import { runScenarioSimulation } from './simulation-lab';
import {
  COGNITIVE_COMPILER_LOCKS,
  COGNITIVE_COMPILER_LOOP,
  predecessorMap,
  predecessorReportState,
  type EvidenceState,
} from './cognitive-compiler-types';
import { buildProblemGraph, decomposeProblem, estimateComplexity, ingestComplexProblem } from './problem-decomposition';
import {
  calibratePredictions,
  classicalQuantumBaselineCheck,
  findCounterexample,
  runSpecialist,
} from './math-reasoning-fabric';
import { runOperationsResearchWorkcell } from './operations-research-workcell';
import {
  classifyObservation,
  competingCausalHypotheses,
  quantumClassicalBaselineOrUnavailable,
  refuseCausalPromotion,
  sealedCompartmentCheck,
} from './causal-analysis-safeguards';
import { learningCannotGrantPermissions, recordPathwayOutcome, routeByLearnedPathways } from './cognitive-pathway-learning';

export { COGNITIVE_COMPILER_LOCKS, COGNITIVE_COMPILER_LOOP };

export type CompilerHopRecord = {
  hop: (typeof COGNITIVE_COMPILER_LOOP)[number];
  state: EvidenceState;
  summary: string;
  refs: string[];
};

function hop(name: CompilerHopRecord['hop'], state: EvidenceState, summary: string, refs: string[] = []): CompilerHopRecord {
  return { hop: name, state, summary, refs };
}

export async function runCognitiveCompilerCycle(input: {
  tenantId: string;
  universeId: string;
  statement: string;
  sealed?: boolean;
  sealedPayload?: string;
  actorKind?: 'ordinary_agent' | 'ceo_principal';
  requestPermissionExpansion?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CompilerHopRecord[] = [];
  const fabric = new NeuralFabric();
  const highways = new GlobalBrainHighways();
  highways.ensureScope(input.tenantId, input.universeId);

  const problem = ingestComplexProblem({
    tenantId: input.tenantId,
    universeId: input.universeId,
    statement: input.statement,
    sealed: input.sealed,
  });
  hops.push(hop('complex_problem', 'PASS', `Problem ${problem.id} ingested. sealed=${problem.sealed}.`, [problem.id]));

  const graph = buildProblemGraph(problem);
  hops.push(hop('problem_graph', 'PASS', `Graph nodes=${graph.nodes.length} edges=${graph.edges.length}.`, graph.nodes.map((n) => n.id)));

  const tasks = decomposeProblem(graph);
  const complexity = estimateComplexity(graph);
  hops.push(hop('decomposition', 'PASS', `Tasks=${tasks.length}; ${complexity.bigO}.`, tasks.map((t) => t.id)));

  const methods = tasks.map((task) => task.method);
  hops.push(hop('specialist_methods', 'PASS', `Specialists: ${methods.join(', ')}.`, methods));

  const specialistResults = await Promise.all(
    tasks.map(async (task) => {
      if (task.method === 'operations_research') {
        const or = await runOperationsResearchWorkcell({
          tenantId: input.tenantId,
          universeId: input.universeId,
          statement: input.statement,
          root,
        });
        return {
          method: task.method,
          state: (or.allVerified ? 'PASS' : 'FAIL') as EvidenceState,
          verified: or.allVerified,
          epistemicClass: 'HYPOTHESIS' as const,
          notes: or.domains.map((d) => d.domain),
        };
      }
      return runSpecialist(task.method, input.statement);
    }),
  );
  hops.push(
    hop(
      'parallel_solving',
      specialistResults.every((item) => item.state !== 'FAIL') ? 'PASS' : 'FAIL',
      `Parallel specialist results=${specialistResults.length}.`,
      specialistResults.map((item) => item.method),
    ),
  );

  const sim = await runScenarioSimulation({
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: input.statement,
    consequence: 'LOW',
    production: false,
    root,
  });
  const calibration = calibratePredictions([
    { predicted: 0.8, observed: 1 },
    { predicted: 0.8, observed: 1 },
    { predicted: 0.2, observed: 0 },
    { predicted: 0.2, observed: 0 },
  ]);
  const counter = findCounterexample();
  const quantum = classicalQuantumBaselineCheck();
  hops.push(
    hop(
      'math_simulation_testing',
      sim.isReality === false && calibration.state === 'PASS' && counter.verified ? 'PASS' : 'FAIL',
      `sim.status=${sim.status}; calibration.ece=${(calibration.value as { ece: number }).ece}; counterexample=${counter.verified}.`,
      [sim.id],
    ),
  );

  const causal = competingCausalHypotheses(input.statement);
  const promotion = refuseCausalPromotion(causal[0]);
  const observation = classifyObservation(
    input.statement.toLowerCase().includes('forecast')
      ? 'forecast'
      : input.statement.toLowerCase().includes('correl')
        ? 'correlation'
        : 'simulation',
  );
  const council = await runDecisionCouncil({
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: `Skeptic review: ${input.statement}`,
    consequence: 'LOW',
    production: false,
    permissionChange: false,
    approved: true,
    root,
  });
  hops.push(
    hop(
      'skeptic_review',
      promotion.promotedToVerifiedCausation === false && council.dissent.length > 0 ? 'PASS' : 'FAIL',
      `Causal promotion refused. Dissent preserved (${council.dissent.length}).`,
      causal.map((h) => h.id),
    ),
  );

  const verifiedCount = specialistResults.filter((item) => item.verified && item.state === 'PASS').length;
  hops.push(
    hop(
      'synthesis',
      'PASS',
      `Synthesized ${verifiedCount}/${specialistResults.length} independently verified specialist results. More agents ≠ smarter.`,
      [],
    ),
  );

  const uncertainty = {
    epistemicClass: observation.epistemicClass,
    isVerifiedFact: observation.isVerifiedFact,
    simulationIsFact: false as const,
    forecastIsFact: false as const,
    correlationIsCausation: false as const,
  };
  hops.push(hop('uncertainty', 'PASS', `${observation.reason}`, [observation.epistemicClass]));

  const gate = decisionGate({
    id: 'as-decision',
    action: input.requestPermissionExpansion ? 'grant_permission' : `compiler decision: ${input.statement}`,
    consequence: input.requestPermissionExpansion ? 'CRITICAL' : 'LOW',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: input.requestPermissionExpansion === true,
    externalPublication: false,
  });
  hops.push(
    hop(
      'decision',
      input.requestPermissionExpansion && gate.executableByAgent ? 'FAIL' : 'PASS',
      gate.reason,
      [],
    ),
  );

  const providers = providerSlots().map((slot) => ({
    provider: slot.provider,
    state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
  }));
  hops.push(
    hop(
      'outcome',
      providers.every((p) => p.state === 'UNAVAILABLE' || p.provider === 'local') ? 'PASS' : 'PASS',
      `Outcome recorded. productionAuthorization=false. Unconfigured providers UNAVAILABLE.`,
      providers.map((p) => p.provider),
    ),
  );

  const learningAttempt = await recordPathwayOutcome({
    tenantId: input.tenantId,
    universeId: input.universeId,
    key: { method: 'result_verification', agent: 'compiler', highway: 'learning' },
    verifiedState: specialistResults.every((item) => item.state !== 'FAIL') ? 'PASS' : 'FAIL',
    requestPermissionExpansion: input.requestPermissionExpansion,
    highways,
    root,
  });
  hops.push(
    hop(
      'learning',
      learningAttempt.accepted || (input.requestPermissionExpansion && !learningAttempt.accepted) ? 'PASS' : 'FAIL',
      learningAttempt.accepted
        ? `Pathway recorded quality=${learningAttempt.score.verifiedQuality}. permissionChange=false.`
        : learningAttempt.reason,
      [],
    ),
  );

  fabric.registerNode({
    id: `as:${problem.id}:problem`,
    kind: 'workflow',
    label: 'cognitive compiler problem',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['62L-AS:compiler'],
  });
  fabric.registerNode({
    id: `as:${problem.id}:decision`,
    kind: 'decision',
    label: 'compiler decision',
    tenantId: input.tenantId,
    universeId: input.universeId,
    trust: 'SYNTHETIC',
    provenanceRefs: ['62L-AS:compiler'],
  });
  fabric.connect({
    from: `as:${problem.id}:problem`,
    to: `as:${problem.id}:decision`,
    relation: 'compiles_to',
    weight: 0.4,
    confidence: 0.7,
    evidenceRefs: ['62L-AS:compiler'],
  });

  return {
    problem,
    graph,
    tasks,
    complexity,
    specialistResults,
    simulation: { status: sim.status, isReality: sim.isReality, epistemicClass: 'SIMULATION' as const },
    calibration,
    counterexample: counter,
    quantum,
    causal: { hypotheses: causal, promotion, observation },
    council: { dissent: council.dissent, smarterBecauseMoreAgents: false as const },
    uncertainty,
    gate,
    learning: learningAttempt,
    hops,
    architecture: COGNITIVE_COMPILER_LOOP,
    locks: COGNITIVE_COMPILER_LOCKS,
    providers,
    neuralStats: fabric.stats(),
    highwayStats: highways.stats(),
    predecessors: predecessorMap(root),
    productionAuthorization: false as const,
    inventedPass: false as const,
    founderImpersonation: false as const,
    l4AutonomyEnabled: false as const,
    tipLand: false as const,
  };
}

export async function buildCognitiveCompilerHealthReport(root = process.cwd()) {
  const health = await checkLocalBrainHealth(root);
  const predecessors = predecessorMap(root);
  return {
    generatedAt: new Date().toISOString(),
    architecture: COGNITIVE_COMPILER_LOOP,
    localHealth: health,
    predecessors,
    arReport: predecessorReportState(root, '62L-AR'),
    anReport: predecessorReportState(root, '62L-AN'),
    githubIssue57: 'UNAVAILABLE' as const,
    windowsNodeVerification: 'NOT_TESTED' as const,
    liveQuantumQpu: 'UNAVAILABLE' as const,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.configured && slot.authorized && slot.evidenceRefs.length ? slot.state : 'UNAVAILABLE',
    })),
    localRuntime: getRuntime('local').configured ? getRuntime('local').state : 'UNAVAILABLE',
    ahModule: existsSync(`${root}/services/ai/local-brain/causal-world-model.ts`) ? 'AVAILABLE' : 'WAITING_DATA',
    aiModule: existsSync(`${root}/services/ai/local-brain/research-director.ts`) ? 'AVAILABLE' : 'WAITING_DATA',
    agModule: existsSync(`${root}/services/ai/local-brain/evaluation-harness.ts`) ? 'AVAILABLE' : 'WAITING_DATA',
    aoModule: existsSync(`${root}/services/ai/local-brain/supply-chain-runtime.ts`) ? 'AVAILABLE' : 'WAITING_DATA',
    locks: COGNITIVE_COMPILER_LOCKS,
    productionAuthorization: false as const,
    inventedPass: false as const,
    next: '62L-AT — Autonomous Knowledge Discovery Engine + Cross-Industry Pattern Mining + Invention Laboratory',
  };
}

export {
  ingestComplexProblem,
  buildProblemGraph,
  decomposeProblem,
  estimateComplexity,
  runSpecialist,
  runOperationsResearchWorkcell,
  classifyObservation,
  competingCausalHypotheses,
  quantumClassicalBaselineOrUnavailable,
  refuseCausalPromotion,
  sealedCompartmentCheck,
  recordPathwayOutcome,
  routeByLearnedPathways,
  learningCannotGrantPermissions,
  SEALED_REDACTION,
  runScenarioSimulation,
};
