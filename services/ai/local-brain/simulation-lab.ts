import { appendLearning } from './learning-ledger';
import { decisionGate, type ConsequenceClass } from './decision-gate';
import { evaluateQuantSignals, type QuantSignal } from './quant-logic';
import { createQuantumExperiment, validateQuantProblem, type QuantOptimizationProblem } from './quantum-research';
import { retrieveEvidencePathway } from './cortex-evidence';
import { rememberCortexTrace, strengthenCortexPathway } from './memory-cortex';
import { getRuntime } from './hybrid-runtime';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ScenarioStatus = 'COMPLETED' | 'UNAVAILABLE' | 'HUMAN_APPROVAL_REQUIRED' | 'BLOCKED';

export type ScenarioSimulation = {
  id: string;
  tenantId: string;
  universeId: string;
  hypothesis: string;
  status: ScenarioStatus;
  isReality: false;
  productionAuthorization: false;
  evidenceRefs: string[];
  notes: string[];
  decision: ReturnType<typeof decisionGate>;
  createdAt: string;
};

export type QuantQuantumBridgeResult = {
  classical: ReturnType<typeof evaluateQuantSignals>;
  quantum: ReturnType<typeof createQuantumExperiment> | null;
  quantumState: 'NOT_REQUESTED' | 'READY_FOR_SIMULATION' | 'UNAVAILABLE';
  claimsQuantumAdvantage: false;
  productionDependency: false;
  tradingAuthorized: false;
};

type SimStore = { runs: ScenarioSimulation[] };

function simPath(root: string) {
  return xivLocalPath(root, 'simulation-lab.json');
}

async function loadSims(root: string) {
  const parsed = await readJsonFile<SimStore>(simPath(root), { runs: [] });
  return Array.isArray(parsed.runs) ? parsed.runs : [];
}

async function saveSims(root: string, runs: ScenarioSimulation[]) {
  await writeJsonFileAtomic(simPath(root), { runs: runs.slice(-2_000) });
}

export async function runScenarioSimulation(input: {
  tenantId: string;
  universeId: string;
  hypothesis: string;
  consequence?: ConsequenceClass;
  production?: boolean;
  root?: string;
}): Promise<ScenarioSimulation> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.hypothesis.trim()) throw new Error('SCENARIO_HYPOTHESIS_REQUIRED');
  const root = input.root ?? process.cwd();
  const gate = decisionGate({
    id: cortexId('sim-gate'),
    action: `Simulate: ${input.hypothesis}`,
    consequence: input.consequence ?? 'LOW',
    production: input.production === true,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  const evidence = await retrieveEvidencePathway({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.hypothesis,
    root,
  });

  const status: ScenarioStatus = !gate.executableByAgent
    ? 'HUMAN_APPROVAL_REQUIRED'
    : evidence.state === 'WAITING_DATA' || evidence.state === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : 'COMPLETED';

  const run: ScenarioSimulation = {
    id: cortexId('sim'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    hypothesis: input.hypothesis.trim(),
    status,
    isReality: false,
    productionAuthorization: false,
    evidenceRefs: evidence.evidenceRefs,
    notes: [
      'Simulation is not reality and is not a future fact.',
      'Cloud/quantum execution is not a production dependency of this lab.',
      evidence.reason,
      gate.reason,
    ],
    decision: gate,
    createdAt: new Date().toISOString(),
  };

  const runs = await loadSims(root);
  runs.push(run);
  await saveSims(root, runs);

  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'scenario',
    claimState: 'PREDICTION',
    label: `Scenario: ${input.hypothesis.slice(0, 80)}`,
    summary: `status=${status}; isReality=false; evidence=${evidence.evidenceRefs.length}`,
    evidenceRefs: evidence.evidenceRefs,
    sourceRefs: [`sim:${run.id}`],
    retentionClass: 'working',
    root,
  });

  return run;
}

export async function runClassicalQuantQuantumBridge(input: {
  tenantId: string;
  universeId: string;
  signals: QuantSignal[];
  quantum?: Parameters<typeof createQuantumExperiment>[0];
  problem?: QuantOptimizationProblem;
  root?: string;
}): Promise<QuantQuantumBridgeResult> {
  const classical = evaluateQuantSignals(input.signals);
  if (input.problem) validateQuantProblem(input.problem);
  if (!input.quantum) {
    return {
      classical,
      quantum: null,
      quantumState: 'NOT_REQUESTED',
      claimsQuantumAdvantage: false,
      productionDependency: false,
      tradingAuthorized: false,
    };
  }

  const experiment = createQuantumExperiment(input.quantum);
  const cloud = getRuntime('gcp');
  const quantumState: QuantQuantumBridgeResult['quantumState'] =
    experiment.state === 'UNAVAILABLE' || (experiment.backend !== 'classical_simulator' && cloud.state !== 'AVAILABLE')
      ? 'UNAVAILABLE'
      : experiment.state === 'READY_FOR_SIMULATION'
        ? 'READY_FOR_SIMULATION'
        : 'UNAVAILABLE';

  await appendLearning({
    domain: 'science',
    subject: `quant-quantum-bridge:${experiment.id}`,
    claimState: 'MODEL_INFERENCE',
    summary: `classical=${classical.recommendation}; quantum=${quantumState}; advantage=false`,
    sourceRefs: input.signals.flatMap((signal) => signal.evidenceRefs),
    evidence: [`experiment:${experiment.id}`],
  }, input.root);

  return {
    classical,
    quantum: experiment,
    quantumState,
    claimsQuantumAdvantage: false,
    productionDependency: false,
    tradingAuthorized: false,
  };
}

export async function recordOutcomeAndLearn(input: {
  tenantId: string;
  universeId: string;
  simulationId: string;
  observed: string;
  successful: boolean;
  memoryIds?: string[];
  evidenceRefs?: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const learning = await appendLearning({
    domain: 'business',
    subject: `outcome:${input.simulationId}`,
    claimState: input.successful ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    summary: input.observed,
    sourceRefs: [`sim:${input.simulationId}`, ...(input.evidenceRefs ?? [])],
    evidence: input.evidenceRefs ?? [],
    taskId: input.simulationId,
  }, root);

  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'outcome',
    claimState: input.successful ? 'VERIFIED_FACT' : 'MODEL_INFERENCE',
    label: `Outcome ${input.simulationId}`,
    summary: input.observed,
    evidenceRefs: [`learn:${learning.id}`, ...(input.evidenceRefs ?? [])],
    sourceRefs: [`sim:${input.simulationId}`],
    pathwayStrength: input.successful ? 0.55 : 0.2,
    retentionClass: 'durable',
    root,
  });

  const strengthened = [];
  for (const id of input.memoryIds ?? []) {
    const next = await strengthenCortexPathway({
      id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      delta: input.successful ? 0.15 : -0.1,
      root,
    });
    strengthened.push({ id: next.id, pathwayStrength: next.pathwayStrength });
  }

  return {
    learning,
    memory,
    strengthened,
    productionAuthorization: false as const,
  };
}

export async function simulationLabStats(root = process.cwd()) {
  const runs = await loadSims(root);
  return {
    runs: runs.length,
    completed: runs.filter((run) => run.status === 'COMPLETED').length,
    unavailable: runs.filter((run) => run.status === 'UNAVAILABLE').length,
    isReality: false as const,
    productionAuthorization: false as const,
  };
}
