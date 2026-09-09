import { cortexId } from './cortex-store';
import {
  type CognitiveProblem,
  type ProblemEdge,
  type ProblemNode,
  type SpecialistMethod,
} from './cognitive-compiler-types';

export type ProblemGraph = {
  problemId: string;
  tenantId: string;
  universeId: string;
  nodes: ProblemNode[];
  edges: ProblemEdge[];
  inventedFacts: false;
};

export type DecomposedTask = {
  id: string;
  parentProblemId: string;
  method: SpecialistMethod;
  statement: string;
  dependsOn: string[];
};

const KEYWORD_METHODS: Array<{ needles: string[]; method: SpecialistMethod }> = [
  { needles: ['symbol', 'algebra', 'polynomial', 'differentiate', 'expand'], method: 'symbolic_math' },
  { needles: ['numeric', 'root', 'integral', 'newton'], method: 'numerical_math' },
  { needles: ['probability', 'statistic', 'variance', 'binomial', 'normal'], method: 'probability_statistics' },
  { needles: ['bayes', 'posterior', 'prior'], method: 'bayesian' },
  { needles: ['optim', 'minimize', 'maximize', 'gradient'], method: 'optimization' },
  { needles: ['route', 'schedule', 'inventory', 'queue', 'capacity', 'network flow', 'or ', 'operations research'], method: 'operations_research' },
  { needles: ['monte carlo', 'simulate'], method: 'monte_carlo' },
  { needles: ['forecast', 'smooth', 'predict'], method: 'forecasting' },
  { needles: ['causal', 'cause', 'correlation'], method: 'causal_safeguard' },
  { needles: ['hypothesis', 'p-value', 'significance'], method: 'hypothesis_test' },
  { needles: ['trade-off', 'tradeoff', 'pareto', 'trade space'], method: 'trade_space' },
  { needles: ['algorithm', 'which method'], method: 'algorithm_selection' },
  { needles: ['complexity', 'big-o', 'runtime'], method: 'complexity_estimation' },
  { needles: ['counterexample', 'disprove'], method: 'counterexample' },
  { needles: ['verify', 'check result'], method: 'result_verification' },
  { needles: ['calibrat'], method: 'calibration' },
  { needles: ['sensitiv'], method: 'sensitivity' },
];

export function ingestComplexProblem(input: {
  tenantId: string;
  universeId: string;
  statement: string;
  sealed?: boolean;
}): CognitiveProblem {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.statement.trim()) throw new Error('PROBLEM_STATEMENT_REQUIRED');
  return {
    id: cortexId('prob'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    statement: input.statement.trim(),
    sealed: input.sealed === true,
    production: false,
    permissionChange: false,
  };
}

export function selectSpecialistMethods(statement: string): SpecialistMethod[] {
  const text = statement.toLowerCase();
  const selected = KEYWORD_METHODS.filter((item) => item.needles.some((needle) => text.includes(needle))).map(
    (item) => item.method,
  );
  const unique = [...new Set(selected)];
  if (unique.length === 0) return ['algorithm_selection', 'result_verification'];
  if (!unique.includes('result_verification')) unique.push('result_verification');
  if (!unique.includes('algorithm_selection')) unique.push('algorithm_selection');
  return unique;
}

export function buildProblemGraph(problem: CognitiveProblem): ProblemGraph {
  const methods = selectSpecialistMethods(problem.statement);
  const goal: ProblemNode = { id: `${problem.id}:goal`, kind: 'goal', label: problem.statement.slice(0, 240) };
  const methodNodes: ProblemNode[] = methods.map((method) => ({
    id: `${problem.id}:${method}`,
    kind: 'method',
    label: method,
    method,
    orDomain: method === 'operations_research' ? 'routing' : undefined,
  }));
  const evidence: ProblemNode = { id: `${problem.id}:evidence`, kind: 'evidence', label: 'independent verification' };
  const decision: ProblemNode = { id: `${problem.id}:decision`, kind: 'decision', label: 'bounded decision gate' };
  const nodes = [goal, ...methodNodes, evidence, decision];
  const edges: ProblemEdge[] = [
    ...methodNodes.map((node) => ({ from: goal.id, to: node.id, relation: 'decomposes_to' as const })),
    ...methodNodes.map((node) => ({ from: node.id, to: evidence.id, relation: 'solved_by' as const })),
    { from: evidence.id, to: decision.id, relation: 'reviews' },
  ];
  return {
    problemId: problem.id,
    tenantId: problem.tenantId,
    universeId: problem.universeId,
    nodes,
    edges,
    inventedFacts: false,
  };
}

export function decomposeProblem(graph: ProblemGraph): DecomposedTask[] {
  return graph.nodes
    .filter((node) => node.kind === 'method' && node.method)
    .map((node) => ({
      id: `${node.id}:task`,
      parentProblemId: graph.problemId,
      method: node.method as SpecialistMethod,
      statement: node.label,
      dependsOn: graph.edges.filter((edge) => edge.to === node.id).map((edge) => edge.from),
    }));
}

export function estimateComplexity(graph: ProblemGraph): {
  nodes: number;
  edges: number;
  bigO: string;
  verified: boolean;
  note: string;
} {
  const n = graph.nodes.length;
  const e = graph.edges.length;
  return {
    nodes: n,
    edges: e,
    bigO: `O(${n} + ${e}) graph walk + O(k) specialist solves`,
    verified: true,
    note: 'Complexity is of this bounded graph walk, not a claim about an unsolved research problem.',
  };
}
