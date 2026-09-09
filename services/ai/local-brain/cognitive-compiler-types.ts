import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const COGNITIVE_COMPILER_LOOP = [
  'complex_problem',
  'problem_graph',
  'decomposition',
  'specialist_methods',
  'parallel_solving',
  'math_simulation_testing',
  'skeptic_review',
  'synthesis',
  'uncertainty',
  'decision',
  'outcome',
  'learning',
] as const;

export type CognitiveCompilerHop = (typeof COGNITIVE_COMPILER_LOOP)[number];

export type EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

/** Visible epistemic class. Simulation/forecast must never be labeled VERIFIED_FACT. */
export type EpistemicClass = 'VERIFIED_FACT' | 'SIMULATION' | 'FORECAST' | 'HYPOTHESIS' | 'UNKNOWN';

export const COGNITIVE_COMPILER_LOCKS = {
  L4_AUTONOMY_ENABLED: false,
  AUTO_PRODUCTION_DEPLOY: false,
  PRODUCTION_DATABASE_WRITE: false,
  PRODUCTION_GIT_PUSH: false,
  AUTO_PERMISSION_EXPANSION: false,
  PRODUCTION_AUTHORIZATION: false,
  FOUNDER_IMPERSONATION: false,
  TIP_LAND: false,
  INVENT_PASS: false,
  INVENT_MATHEMATICAL_PROOF: false,
  CORRELATION_EQUALS_CAUSATION: false,
  SIMULATION_IS_VERIFIED_FACT: false,
  FORECAST_IS_VERIFIED_FACT: false,
  CLAIMS_QUANTUM_ADVANTAGE: false,
  CEO_SEALED_REPLICATING: false,
  SMARTER_BECAUSE_MORE_AGENTS: false,
} as const;

export const CORRELATION_IS_NOT_CAUSATION =
  'Correlation is not causation. Competing mechanisms remain hypotheses until independently verified.';

export const SIMULATION_IS_NOT_FACT =
  'Simulation and forecast are not verified facts. They remain SIMULATION/FORECAST until independently verified.';

export const SPECIALIST_METHODS = [
  'symbolic_math',
  'numerical_math',
  'probability_statistics',
  'bayesian',
  'optimization',
  'operations_research',
  'monte_carlo',
  'forecasting',
  'causal_safeguard',
  'hypothesis_test',
  'trade_space',
  'algorithm_selection',
  'complexity_estimation',
  'counterexample',
  'result_verification',
  'calibration',
  'sensitivity',
] as const;

export type SpecialistMethod = (typeof SPECIALIST_METHODS)[number];

export const OR_WORKCELL_DOMAINS = [
  'routing',
  'scheduling',
  'inventory',
  'capacity',
  'queueing',
  'network_flow',
  'information_supply_chain',
] as const;

export type OrWorkcellDomain = (typeof OR_WORKCELL_DOMAINS)[number];

export type PredecessorId =
  | '62L-AR'
  | '62L-AQ'
  | '62L-AP'
  | '62L-AO'
  | '62L-AN'
  | '62L-AH'
  | '62L-AI'
  | '62L-AG'
  | '62L-AM';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  '62L-AR': 'distributed-memory-neural-highway.ts',
  '62L-AQ': 'enterprise-nervous-system.ts',
  '62L-AP': 'enterprise-ops-planner.ts',
  '62L-AO': 'supply-chain-runtime.ts',
  '62L-AN': 'information-control-tower-runtime.ts',
  '62L-AH': 'causal-world-model.ts',
  '62L-AI': 'research-director.ts',
  '62L-AG': 'evaluation-harness.ts',
  '62L-AM': 'information-data-fabric.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  '62L-AR': '62L_AR_DISTRIBUTED_MEMORY_NEURAL_HIGHWAY_COMPILER_REPORT.md',
  '62L-AQ': '62L_AQ_ENTERPRISE_NERVOUS_SYSTEM_ETHICAL_SENTINEL_REPORT.md',
  '62L-AP': '62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md',
  '62L-AO': '62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md',
  '62L-AN': '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md',
  '62L-AH': '62L_AH_CAUSAL_WORLD_MODEL_DIGITAL_TWINS_REPORT.md',
  '62L-AI': '62L_AI_AUTONOMOUS_RESEARCH_DIRECTOR_REPORT.md',
  '62L-AG': '62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md',
  '62L-AM': '62L_AM_INFORMATION_SUPPLY_CHAIN_DATA_FABRIC_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): EvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id])) ? 'PASS' : 'WAITING_DATA';
}

export function predecessorMap(cwd = process.cwd()): Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: EvidenceState }> {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [id, { module: predecessorModuleState(id), report: predecessorReportState(cwd, id) }]),
  ) as Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: EvidenceState }>;
}

export type ProblemNodeKind = 'goal' | 'constraint' | 'unknown' | 'method' | 'evidence' | 'decision';

export type ProblemNode = {
  id: string;
  kind: ProblemNodeKind;
  label: string;
  method?: SpecialistMethod;
  orDomain?: OrWorkcellDomain;
};

export type ProblemEdge = {
  from: string;
  to: string;
  relation: 'depends_on' | 'decomposes_to' | 'solved_by' | 'reviews' | 'learns_from';
};

export type CognitiveProblem = {
  id: string;
  tenantId: string;
  universeId: string;
  statement: string;
  sealed: boolean;
  production: false;
  permissionChange: false;
};
