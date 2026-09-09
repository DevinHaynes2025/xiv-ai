import { runBoundedQuantumLab, runQuantumLabWithClassicalBridge } from './quantum-research-lab';
import { appendLearning } from './learning-ledger';
import { recordAgentPerformance } from './agent-performance';
import type { MeshAgentRole } from './agent-mesh';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { QuantSignal } from './quant-logic';
import type { QuantOptimizationProblem } from './quantum-research';

export async function runQuantumKnowledgeOps(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  signals: QuantSignal[];
  qubitCount: number;
  algorithm?: 'qaoa' | 'vqe' | 'amplitude_estimation' | 'quantum_walk' | 'custom_research';
  backend?: 'classical_simulator' | 'quantum_simulator' | 'quantum_qpu';
  backendVerified?: boolean;
  problem?: QuantOptimizationProblem;
  root?: string;
}) {
  if (input.signals.length === 0) throw new Error('QUANTUM_KNOWLEDGE_REQUIRES_CLASSICAL_SIGNALS');
  const lab = runBoundedQuantumLab({
    id: cortexId('qops'),
    objective: input.objective,
    algorithm: input.algorithm ?? 'qaoa',
    backend: input.backend ?? 'classical_simulator',
    qubitCount: input.qubitCount,
    backendVerified: input.backendVerified,
    problem: input.problem,
  });
  const bridge = await runQuantumLabWithClassicalBridge({
    tenantId: input.tenantId,
    universeId: input.universeId,
    signals: input.signals,
    quantum: {
      id: lab.experiment.id,
      objective: input.objective,
      algorithm: input.algorithm ?? 'qaoa',
      backend: input.backend ?? 'classical_simulator',
      qubitCount: input.qubitCount,
      backendVerified: input.backendVerified,
    },
    problem: input.problem,
    root: input.root,
  });
  return {
    lab,
    bridge,
    classicalBaselineRequired: true as const,
    claimsQuantumAdvantage: false as const,
    simulatorIsNotQpu: lab.experiment.backend !== 'quantum_qpu',
    qpuState: lab.experiment.backend === 'quantum_qpu' ? lab.experiment.state : 'NOT_USED',
    productionAuthorization: false as const,
  };
}

export type ReproducibilityRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  branch?: string;
  files: string[];
  commands: string[];
  tests: string[];
  securityEvidence: string[];
  buildReport?: string;
  learningEntryId?: string;
  inventedPass: false;
  productionAuthorization: false;
  createdAt: string;
};

type ReproStore = { records: ReproducibilityRecord[] };

function reproPath(root: string) {
  return xivLocalPath(root, 'reproducibility-ledger.json');
}

export async function recordReproducibility(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  branch?: string;
  files: string[];
  commands: string[];
  tests: string[];
  securityEvidence: string[];
  buildReport?: string;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const learning = await appendLearning({
    domain: 'operations',
    subject: `repro:${input.storyId}`,
    claimState: 'PRIMARY_SOURCE',
    summary: `story=${input.storyId}; files=${input.files.length}; tests=${input.tests.join(',')}`,
    sourceRefs: input.securityEvidence,
    evidence: [...input.files, ...input.commands, ...input.tests],
  }, root);
  const record: ReproducibilityRecord = {
    id: cortexId('repro'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    branch: input.branch,
    files: [...input.files],
    commands: [...input.commands],
    tests: [...input.tests],
    securityEvidence: [...input.securityEvidence],
    buildReport: input.buildReport,
    learningEntryId: learning.id,
    inventedPass: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  const parsed = await readJsonFile<ReproStore>(reproPath(root), { records: [] });
  const records = Array.isArray(parsed.records) ? parsed.records : [];
  records.push(record);
  await writeJsonFileAtomic(reproPath(root), { records: records.slice(-10_000) });
  return record;
}

export async function listReproducibility(input: { tenantId: string; universeId: string; root?: string }) {
  const parsed = await readJsonFile<ReproStore>(reproPath(input.root ?? process.cwd()), { records: [] });
  const records = Array.isArray(parsed.records) ? parsed.records : [];
  return records.filter((record) => record.tenantId === input.tenantId && record.universeId === input.universeId);
}

export type SkillScore = {
  role: MeshAgentRole;
  successes: number;
  failures: number;
  score: number;
  canExpandPermissions: false;
  canDeployProduction: false;
};

type SkillStore = { scores: SkillScore[] };

function skillPath(root: string) {
  return xivLocalPath(root, 'agent-skill-evolution.json');
}

export async function evolveAgentSkill(input: {
  tenantId: string;
  universeId: string;
  role: MeshAgentRole;
  taskId: string;
  successful: boolean;
  notes: string;
  evidenceRefs?: string[];
  root?: string;
}) {
  await recordAgentPerformance(input);
  const root = input.root ?? process.cwd();
  const parsed = await readJsonFile<SkillStore>(skillPath(root), { scores: [] });
  const scores = Array.isArray(parsed.scores) ? parsed.scores : [];
  let score = scores.find((item) => item.role === input.role);
  if (!score) {
    score = {
      role: input.role,
      successes: 0,
      failures: 0,
      score: 0.5,
      canExpandPermissions: false,
      canDeployProduction: false,
    };
    scores.push(score);
  }
  if (input.successful) score.successes += 1;
  else score.failures += 1;
  const total = score.successes + score.failures;
  score.score = total === 0 ? 0.5 : score.successes / total;
  score.canExpandPermissions = false;
  score.canDeployProduction = false;
  await writeJsonFileAtomic(skillPath(root), { scores });
  return score;
}
