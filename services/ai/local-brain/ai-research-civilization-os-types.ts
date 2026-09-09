import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CT — XIV AI Research Civilization OS + Multi-Model Training Federation +
 * Distributed Knowledge Memory Compiler + Autonomous Simulation Laboratory +
 * Accelerator/Quantum Optimization Grid + Global Scientific Discovery Graph +
 * Self-Improving Toolchain Academy.
 *
 * SoT: GitHub #110. GitLab #44 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false. No uncontrolled self-improvement.
 * No unknown-rights training data. No unsupported quantum claims.
 * Classical baseline required; QPU/simulator only when verified.
 * Local-first multi-model training/evaluation; sealed never silent cloud.
 * Simulation labs: multi-Universe sims labeled; sim ≠ verified fact.
 * Toolchain academy: sandbox only; learning ≠ permission.
 * Scientific discovery graph: hypothesis ≠ verified; correlation ≠ causation.
 * Memory compiler candidates NOT_APPLIED; no auto production schema.
 * Founder-sealed deny-by-default. Queue cannot production-deploy.
 * tip-land=NO. No mega-delta swallow.
 */

export const AI_RESEARCH_CIVILIZATION_OS_CYCLE = [
  'honesty_locks',
  'research_civilization_bootstrap',
  'bounded_research_schools_labs',
  'multi_model_training_federation_local_first',
  'unknown_rights_training_denied',
  'sealed_training_eval_no_silent_cloud',
  'knowledge_memory_compiler_candidates',
  'memory_compiler_no_auto_prod_schema',
  'autonomous_simulation_lab_bounded',
  'sim_output_not_verified_discovery',
  'accelerator_quantum_grid_classical_baseline',
  'unconfigured_accelerator_qpu_unavailable',
  'quantum_claim_without_evidence_rejected',
  'scientific_discovery_graph_typed',
  'correlation_to_causation_rejected',
  'toolchain_academy_sandbox_only',
  'academy_skill_no_permission_escalation',
  'uncontrolled_self_improvement_denied',
  'queue_production_deploy_denied',
  'evidence',
  'learning',
] as const;

export type CtHop = (typeof AI_RESEARCH_CIVILIZATION_OS_CYCLE)[number];

export type CtEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'SANDBOXED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'LABELED_SIMULATION'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'HYPOTHESIS'
  | 'CORRELATION'
  | 'CAUSATION_BLOCKED';

export type CtHopRecord = {
  hop: CtHop;
  state: CtEvidenceState;
  summary: string;
  at: string;
};

export const CT_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  UNCONTROLLED_SELF_IMPROVEMENT: false as const,
  OPEN_ENDED_SELF_MODIFY: false as const,
  UNKNOWN_RIGHTS_TRAINING: false as const,
  SEALED_SILENT_CLOUD_TRAINING_EVAL: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  UNCONFIGURED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_QPU_AVAILABLE: false as const,
  SIM_EQ_VERIFIED_DISCOVERY: false as const,
  SIM_AUTO_LABEL_VERIFIED: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  HYPOTHESIS_EQ_VERIFIED: false as const,
  ACADEMY_SKILL_ESCALATES_PERMISSIONS: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  MEMORY_COMPILER_AUTO_APPLY_PROD_SCHEMA: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
  RESEARCH_SCHOOLS_BOUNDED: true as const,
  MULTI_UNIVERSE_SIMS_LABELED: true as const,
  TOOLCHAIN_ACADEMY_SANDBOX_ONLY: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CU — XIV Cognitive Research Cloud + Agent University Federation + Continuous Local Model Academy + Distributed Experiment Memory + Multi-Cloud Scientific Compute Fabric + Algorithm Evolution Graph + Universal Tool/Plugin Runtime' as const;

export const GITHUB_SOT_ISSUE = 110 as const;
export const GITLAB_COORDINATION_ISSUE = 44 as const;

export const UNCONTROLLED_SELF_IMPROVEMENT_DENIED =
  'UNCONTROLLED_SELF_IMPROVEMENT_OR_OPEN_ENDED_SELF_MODIFY_DENIED' as const;
export const UNKNOWN_RIGHTS_TRAINING_DENIED =
  'TRAINING_ON_UNKNOWN_RIGHTS_DATA_DENIED' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_CLAIM_WITHOUT_EVIDENCE_OR_CLASSICAL_BASELINE_REJECTED' as const;
export const QUEUE_PRODUCTION_DEPLOY_DENIED =
  'QUEUE_CANNOT_PRODUCTION_DEPLOY' as const;
export const SEALED_SILENT_CLOUD_TRAINING_DENIED =
  'SEALED_TRAINING_EVAL_CANNOT_SILENT_ROUTE_TO_CLOUD' as const;
export const SIM_NOT_VERIFIED_DISCOVERY =
  'SIM_OUTPUT_NOT_LABELED_VERIFIED_DISCOVERY' as const;
export const ACADEMY_SKILL_NO_ESCALATION =
  'ACADEMY_SKILL_DOES_NOT_ESCALATE_PERMISSIONS' as const;
export const MEMORY_COMPILER_NO_AUTO_PROD =
  'MEMORY_COMPILER_CANNOT_AUTO_APPLY_PRODUCTION_SCHEMA' as const;
export const UNCONFIGURED_ACCELERATOR_UNAVAILABLE =
  'UNCONFIGURED_ACCELERATOR_OR_QPU_UNAVAILABLE' as const;
export const CORRELATION_TO_CAUSATION_REJECTED =
  'DISCOVERY_GRAPH_REJECTS_CORRELATION_TO_CAUSATION_WITHOUT_EVIDENCE' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export type DiscoveryEdgeKind =
  | 'hypothesis'
  | 'correlation'
  | 'evidence'
  | 'causation'
  | 'simulation'
  | 'verified_discovery';

export type RightsClass =
  | 'known_licensed'
  | 'founder_owned'
  | 'public_domain'
  | 'unknown'
  | 'restricted'
  | 'stolen';

export type AcceleratorKind = 'cpu' | 'gpu' | 'npu' | 'qpu' | 'simulator';

export type CtActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'research_dean'
  | 'lab_director'
  | 'training_federation_curator'
  | 'memory_compiler'
  | 'simulation_operator'
  | 'accelerator_planner'
  | 'discovery_curator'
  | 'academy_mentor'
  | 'ordinary_agent'
  | 'impersonator';

export type CtActor = {
  kind: CtActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type PredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA' | 'MISSING';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    CS: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CS_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ||
        has('62L_CS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_CS_COGNITIVE_RESEARCH_CLOUD_REPORT.md') || has('62L_CS_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred CS tip + 62L_CS_*REPORT.md. Poll with backoff when WAITING_DATA.',
    },
    CR: {
      tipProbe:
        hasMod('hybrid-supercompute-universe-os-types.ts') ||
        has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CR Hybrid Supercompute Universe OS when CS absent. Branch cursor/62l-cr-hybrid-supercompute-universe-os-4059.',
    },
    CQ: {
      tipProbe:
        hasMod('offline-universe-quantum-genome-types.ts') ||
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md') ||
        has('62L_CQ_AUTONOMOUS_TOOL_ECOSYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md') ||
        has('62L_CQ_AUTONOMOUS_TOOL_ECOSYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'CQ when CS/CR absent. Poll with backoff.',
    },
    CP: {
      tipProbe:
        hasMod('knowledge-supply-plugin-foundry-types.ts') ||
        has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CP @ e5e53b87cfe71a0fbeef2545918a846edf76196d fallback when CQ WAITING_DATA.',
    },
    CO: {
      tipProbe:
        hasMod('global-knowledge-exchange-os-types.ts') ||
        has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CO @ 29b18b2 lineage when CP used as base.',
    },
    CN: {
      tipProbe:
        hasMod('world-knowledge-routing-os-types.ts') ||
        has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CN World Knowledge Routing OS ancestor.',
    },
    CM: {
      tipProbe:
        hasMod('sovereign-regional-knowledge-clouds-types.ts') ||
        has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CM_SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CM Sovereign Regional Knowledge Clouds ancestor.',
    },
    CL: {
      tipProbe:
        hasMod('global-knowledge-server-constellation-types.ts') ||
        has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CL_GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CL Global Knowledge Server Constellation ancestor.',
    },
  };
}
