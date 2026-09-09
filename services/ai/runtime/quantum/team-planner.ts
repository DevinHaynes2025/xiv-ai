/**
 * 62L-EX8 — Mission Planner for Quantum Agent Team.
 * Decomposes founder/user missions into child tasks under Agent Mesh.
 * Child inherits tenant/Universe; permissions/tools/data/execution/budget ≤ parent.
 */

import {
  spawnChildAgent,
  registerQuantumTeamAgent,
  type ChildSpawnInput,
  type Denied,
  type Ok,
} from './agent-team.ts';
import type {
  ComputeBudget,
  DataClass,
  ExecutionClass,
  QuantumTeamAgentContract,
  QuantumTeamRole,
} from './agent-team-types.ts';

export type MissionPlanInput = {
  missionId: string;
  founderObjective: string;
  tenantId: string;
  universeId: string;
  homeBaseReturnPath: string;
  createdAt: string;
  expiresAt: string;
  computeBudget: ComputeBudget;
  allowedDataClasses: readonly DataClass[];
  allowedExecutionClasses: readonly ExecutionClass[];
  allowedTools?: readonly string[];
  webOnline?: boolean;
  physicalQpuOnline?: boolean;
};

export type PlannedChildSpec = {
  role: QuantumTeamRole;
  purpose: string;
  expectedOutput: string;
  evidenceRequirements: readonly string[];
  executionClasses: readonly ExecutionClass[];
  dataClasses: readonly DataClass[];
  computeBudget: ComputeBudget;
};

export type MissionPlan = {
  missionId: string;
  tenantId: string;
  universeId: string;
  plannerAgent: QuantumTeamAgentContract;
  children: readonly QuantumTeamAgentContract;
  orphanCount: 0;
  pathway: readonly string[];
};

const DEFAULT_DECOMPOSITION: readonly PlannedChildSpec[] = [
  {
    role: 'ProblemFormulationAgent',
    purpose: 'Formulate problem representation',
    expectedOutput: 'problem_spec',
    evidenceRequirements: ['problem_hash'],
    executionClasses: ['CLASSICAL'],
    dataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    computeBudget: { maxCpuMs: 10_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
  {
    role: 'ClassicalBaselineAgent',
    purpose: 'Run classical baseline',
    expectedOutput: 'baseline_receipt',
    evidenceRequirements: ['baseline_receipt'],
    executionClasses: ['CLASSICAL'],
    dataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    computeBudget: { maxCpuMs: 20_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
  {
    role: 'QuantumInspiredResearchAgent',
    purpose: 'Explore quantum-inspired candidate',
    expectedOutput: 'qi_candidate',
    evidenceRequirements: ['candidate_receipt'],
    executionClasses: ['CLASSICAL', 'QUANTUM_INSPIRED'],
    dataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    computeBudget: { maxCpuMs: 20_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
  {
    role: 'SimulationAgent',
    purpose: 'Local simulator experiment when authorized',
    expectedOutput: 'simulation_result',
    evidenceRequirements: ['sim_receipt'],
    executionClasses: ['CLASSICAL', 'SIMULATED_QUANTUM'],
    dataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    computeBudget: { maxCpuMs: 15_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
  {
    role: 'BenchmarkAgent',
    purpose: 'Comparable benchmark pack',
    expectedOutput: 'benchmark_result',
    evidenceRequirements: ['benchmark_receipt'],
    executionClasses: ['CLASSICAL'],
    dataClasses: ['BENCHMARK_FIXTURE'],
    computeBudget: { maxCpuMs: 10_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
  {
    role: 'ReviewerAgent',
    purpose: 'Structured review without hidden CoT',
    expectedOutput: 'review_result',
    evidenceRequirements: ['review_receipt'],
    executionClasses: ['CLASSICAL'],
    dataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    computeBudget: { maxCpuMs: 5_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
  },
];

export function planQuantumMission(
  input: MissionPlanInput,
  decomposition: readonly PlannedChildSpec[] = DEFAULT_DECOMPOSITION,
): Ok<MissionPlan> | Denied {
  const planner = registerQuantumTeamAgent({
    agentId: `${input.missionId}:QuantumMissionAgent`,
    agentRole: 'QuantumMissionAgent',
    missionId: input.missionId,
    taskId: `${input.missionId}:root`,
    parentTaskId: null,
    tenantId: input.tenantId,
    universeId: input.universeId,
    allowedTools: input.allowedTools ?? ['local-search', 'evidence-review', 'task-planning'],
    allowedDataClasses: input.allowedDataClasses,
    allowedExecutionClasses: input.allowedExecutionClasses,
    computeBudget: input.computeBudget,
    memoryBudget: { maxMb: 1024 },
    timeBudget: { maxWallClockMs: 600_000 },
    expectedOutput: 'mission_plan',
    evidenceRequirements: ['mission_plan', 'child_returns'],
    returnPath: input.homeBaseReturnPath,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    webOnline: input.webOnline,
    physicalQpuOnline: input.physicalQpuOnline,
    hybridRouterAuthorized: true,
  });
  if (!planner.ok) return planner;

  const children: QuantumTeamAgentContract[] = [];
  for (let i = 0; i < decomposition.length; i++) {
    const spec = decomposition[i]!;
    const spawnInput: ChildSpawnInput = {
      childAgentId: `${input.missionId}:${spec.role}:${i}`,
      childTaskId: `${input.missionId}:child:${i}`,
      agentRole: spec.role,
      allowedDataClasses: spec.dataClasses,
      allowedExecutionClasses: spec.executionClasses,
      computeBudget: spec.computeBudget,
      expectedOutput: spec.expectedOutput,
      evidenceRequirements: spec.evidenceRequirements,
      returnPath: input.homeBaseReturnPath,
      expiresAt: input.expiresAt,
    };
    const child = spawnChildAgent(planner.value, spawnInput, input.createdAt);
    if (!child.ok) return child;
    // Enforce inheritance honesty.
    if (child.value.tenantId !== input.tenantId) {
      return { ok: false, reason: 'CHILD_TENANT_DRIFT', decision: 'DENIED' };
    }
    if (child.value.universeId !== input.universeId) {
      return { ok: false, reason: 'CHILD_UNIVERSE_DRIFT', decision: 'DENIED' };
    }
    if (child.value.parentTaskId !== planner.value.taskId) {
      return { ok: false, reason: 'ORPHAN_CHILD_DENIED', decision: 'DENIED' };
    }
    children.push(child.value);
  }

  return {
    ok: true,
    value: {
      missionId: input.missionId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      plannerAgent: planner.value,
      children,
      orphanCount: 0,
      pathway: [
        'FounderUserMission',
        'HomeBase',
        'MissionPlanner',
        'QuantumAgentTeam',
        'ChildTasks',
      ],
    },
  };
}
