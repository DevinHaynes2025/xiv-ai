import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CV — XIV Distributed Intelligence Laboratory OS + Agent Research Workforce
 * Federation + Local Model Evolution Graph + Global Experiment Data Lake +
 * Heterogeneous Compute Scheduler + Autonomous Tool Research Factory +
 * Scientific Knowledge Expansion Engine.
 *
 * SoT: GitHub #112. GitLab #46 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Truthful agent/workcell census — RUNNING_VERIFIED only with heartbeat/runtime evidence.
 * Local-model evolution lineage required; sandbox until eval+human review.
 * Experiment data lake: governed; reproducible; searchable negatives; no unknown-rights data.
 * Heterogeneous scheduler: verified CPU/AMD/NVIDIA/NPU/quantum only; classical baseline for
 * quantum; unconfigured → UNAVAILABLE.
 * Tool research factory: security/SBOM/benchmark gates; deny-by-default; registration ≠ authority.
 * Scientific knowledge expansion: lawful authorized sources only; hypothesis ≠ verified.
 * Local-first; sealed never silent cloud fallback; no production deploy from queue.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow.
 */

export const DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE = [
  'honesty_locks',
  'lab_os_bootstrap',
  'workforce_federation_census',
  'workcell_without_heartbeat_not_running_verified',
  'census_cannot_invent_live_agents',
  'model_evolution_lineage_required',
  'model_evolution_sandbox_until_eval_review',
  'experiment_lake_unknown_rights_denied',
  'experiment_negatives_searchable',
  'scheduler_unverified_accelerator_unavailable',
  'quantum_without_classical_baseline_rejected',
  'tool_without_sbom_security_unpromoted',
  'knowledge_unauthorized_source_denied',
  'sealed_no_silent_cloud_accelerator',
  'skill_tool_grant_no_permission_escalation',
  'queue_production_deploy_denied',
  'evidence',
  'learning',
] as const;

export type CvHop = (typeof DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_CYCLE)[number];

export type CvEvidenceState =
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
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'SEARCHABLE'
  | 'LINEAGED'
  | 'NEGATIVE_KEPT'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'HYPOTHESIS'
  | 'UNPROMOTED';

export type CvHopRecord = {
  hop: CvHop;
  state: CvEvidenceState;
  summary: string;
  at: string;
};

export const CV_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  CENSUS_CAN_INVENT_LIVE_AGENTS: false as const,
  MODEL_EVOLUTION_REQUIRES_LINEAGE: true as const,
  MODEL_EVOLUTION_SANDBOX_UNTIL_EVAL_REVIEW: true as const,
  UNKNOWN_RIGHTS_DATASET_INTAKE: false as const,
  NEGATIVE_RESULTS_SEARCHABLE: true as const,
  NEGATIVE_RESULTS_DISCARDED: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  TOOL_PROMOTION_REQUIRES_SBOM: true as const,
  TOOL_PROMOTION_REQUIRES_SECURITY_GATE: true as const,
  TOOL_PROMOTION_REQUIRES_BENCHMARK: true as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  UNAUTHORIZED_KNOWLEDGE_SOURCE_ALLOWED: false as const,
  HYPOTHESIS_EQ_VERIFIED: false as const,
  SEALED_SILENT_CLOUD_ACCELERATOR_FALLBACK: false as const,
  SKILL_TOOL_GRANT_IS_PERMISSION: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CW — XIV Persistent Research Civilization + Offline Agent Laboratory Network + Model/Algorithm Genome Compiler + Distributed Scientific Memory Fabric + Cross-Accelerator Runtime Optimizer + Autonomous Plugin Engineering Institute + Global Evidence Graph Expansion' as const;

export const GITHUB_SOT_ISSUE = 112 as const;
export const GITLAB_COORDINATION_ISSUE = 46 as const;

export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'WORKCELL_OR_AGENT_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;
export const CENSUS_INVENT_LIVE_DENIED =
  'CENSUS_CANNOT_INVENT_LIVE_AGENTS_WITHOUT_REGISTRATION_AND_EVIDENCE' as const;
export const MODEL_LINEAGE_REQUIRED =
  'MODEL_EVOLUTION_NODE_REQUIRES_LINEAGE_PARENT_AND_METADATA' as const;
export const MODEL_SANDBOX_UNTIL_REVIEW =
  'MODEL_EVOLUTION_REMAINS_SANDBOX_UNTIL_EVAL_AND_HUMAN_REVIEW' as const;
export const UNKNOWN_RIGHTS_INTAKE_DENIED =
  'UNKNOWN_RIGHTS_DATASET_INTAKE_DENIED' as const;
export const NEGATIVE_RESULT_KEPT_SEARCHABLE =
  'NEGATIVE_EXPERIMENT_RESULT_REMAINS_SEARCHABLE' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_ACCELERATOR_OR_QPU_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_SCHEDULE_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const TOOL_UNPROMOTED_WITHOUT_GATES =
  'TOOL_WITHOUT_SBOM_SECURITY_BENCHMARK_GATES_REMAINS_UNPROMOTED' as const;
export const REGISTRATION_NO_AUTHORITY =
  'TOOL_OR_SKILL_REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const UNAUTHORIZED_KNOWLEDGE_DENIED =
  'KNOWLEDGE_EXPANSION_FROM_UNAUTHORIZED_SOURCE_DENIED' as const;
export const HYPOTHESIS_NOT_VERIFIED =
  'HYPOTHESIS_IS_NOT_VERIFIED_CLAIM' as const;
export const SEALED_SILENT_CLOUD_ACCELERATOR_DENIED =
  'SEALED_JOB_CANNOT_SILENT_ROUTE_TO_CLOUD_ACCELERATOR_GATEWAY' as const;
export const SKILL_TOOL_NO_PERMISSION_ESCALATION =
  'SKILL_OR_TOOL_GRANT_DOES_NOT_ESCALATE_PERMISSION' as const;
export const QUEUE_DEPLOY_DENIED =
  'QUEUE_CANNOT_PRODUCTION_DEPLOY_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export const MAX_FEDERATED_WORKCELLS = 256 as const;
export const MAX_EVOLUTION_GRAPH_NODES = 1024 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type CvActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'lab_os_curator'
  | 'workforce_federator'
  | 'model_evolution_curator'
  | 'experiment_lake_governor'
  | 'compute_scheduler'
  | 'tool_factory_governor'
  | 'knowledge_expansion_curator'
  | 'ordinary_agent'
  | 'impersonator';

export type CvActor = {
  kind: CvActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type WorkcellCensusStatus =
  | 'REGISTERED'
  | 'HEARTBEAT_STALE'
  | 'RUNNING_VERIFIED'
  | 'OFFLINE'
  | 'DENIED'
  | 'UNKNOWN';

export type ComputeTargetKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type RightsClass =
  | 'authorized_owned'
  | 'authorized_licensed'
  | 'public_domain'
  | 'unknown_rights'
  | 'restricted'
  | 'stolen_or_leaked';

export type KnowledgeSourceAuthorization =
  | 'authorized_scientific'
  | 'authorized_technical'
  | 'unauthorized'
  | 'unknown';

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
    CU: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'Preferred CU Cognitive Research Cloud tip + report. Poll with backoff when WAITING_DATA.',
    },
    CT: {
      tipProbe:
        hasMod('ai-research-civilization-os-types.ts') ||
        has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CT AI Research Civilization OS when CU absent.',
    },
    CS: {
      tipProbe:
        hasMod('cs-phase-types.ts') || has('62L_CS_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CS if present between CT and CR.',
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
      note: 'CR Hybrid Supercompute Universe OS fallback.',
    },
    CQ: {
      tipProbe:
        hasMod('offline-universe-quantum-genome-types.ts') ||
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CQ @ c8c10d36c78308ef126d3d8a10ce30b9c0f98ea7 when CU/CT/CR absent.',
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
      note: 'CP @ e5e53b8 lineage fallback.',
    },
  };
}
