import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CU — XIV Cognitive Research Cloud + Agent University Federation +
 * Continuous Local Model Academy + Distributed Experiment Memory +
 * Multi-Cloud Scientific Compute Fabric + Algorithm Evolution Graph +
 * Universal Tool/Plugin Runtime.
 *
 * SoT: GitHub #111. GitLab #45 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false. Experiments must be reproducible; negative
 * results stay searchable. Algorithm variants carry lineage. Local model
 * improvements = sandbox candidates until evaluation + human review.
 * No uncontrolled self-improvement; no unknown-rights training data.
 * Plugin/tool runtime: deny-by-default permissions; registration ≠ authority
 * (reuse CP). Multi-cloud scientific compute: local-first; AWS/GCP only when
 * configured+authorized+verified; sealed never silent cloud fallback.
 * Learning ≠ permission; no production deploy from queue; Founder-sealed
 * deny-by-default. tip-land=NO. No mega-delta swallow.
 */

export const COGNITIVE_RESEARCH_CLOUD_CYCLE = [
  'honesty_locks',
  'cognitive_research_cloud_bootstrap',
  'experiment_reproducibility_gate',
  'negative_result_searchable',
  'algorithm_variant_lineage',
  'local_model_sandbox_until_eval_review',
  'uncontrolled_self_improve_denied',
  'unknown_rights_training_denied',
  'university_federation_bounded',
  'university_skill_no_permission',
  'plugin_deny_by_default_missing_scope',
  'registration_no_authority',
  'scientific_compute_local_first',
  'unconfigured_aws_gcp_unavailable',
  'sealed_no_silent_cloud_compute',
  'queue_production_deploy_denied',
  'evidence',
  'learning',
] as const;

export type CuHop = (typeof COGNITIVE_RESEARCH_CLOUD_CYCLE)[number];

export type CuEvidenceState =
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
  | 'NEGATIVE_KEPT';

export type CuHopRecord = {
  hop: CuHop;
  state: CuEvidenceState;
  summary: string;
  at: string;
};

export const CU_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  EXPERIMENTS_REQUIRE_REPRODUCIBILITY_METADATA: true as const,
  EXPERIMENT_WITHOUT_REPRO_MARKED_VERIFIED: false as const,
  NEGATIVE_RESULTS_SEARCHABLE: true as const,
  NEGATIVE_RESULTS_DISCARDED: false as const,
  ALGORITHM_VARIANTS_CARRY_LINEAGE: true as const,
  LOCAL_MODEL_IMPROVEMENT_SANDBOX_UNTIL_EVAL_REVIEW: true as const,
  UNCONTROLLED_SELF_IMPROVEMENT: false as const,
  UNKNOWN_RIGHTS_TRAINING: false as const,
  DENY_BY_DEFAULT_PLUGIN_PERMISSIONS: true as const,
  MISSING_SCOPE_ALLOWED: false as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  REGISTRATION_EQ_AUTHORITY: false as const,
  SCIENTIFIC_COMPUTE_LOCAL_FIRST: true as const,
  AWS_GCP_REQUIRES_CONFIGURED_AUTHORIZED_VERIFIED: true as const,
  UNCONFIGURED_AWS_GCP_AVAILABLE: false as const,
  SEALED_SILENT_CLOUD_COMPUTE_FALLBACK: false as const,
  UNIVERSITY_SKILL_IS_PERMISSION: false as const,
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
  '62L-CV — XIV Distributed Intelligence Laboratory OS + Agent Research Workforce Federation + Local Model Evolution Graph + Global Experiment Data Lake + Heterogeneous Compute Scheduler + Autonomous Tool Research Factory + Scientific Knowledge Expansion Engine' as const;

export const GITHUB_SOT_ISSUE = 111 as const;
export const GITLAB_COORDINATION_ISSUE = 45 as const;

export const EXPERIMENT_WITHOUT_REPRO_NOT_VERIFIED =
  'EXPERIMENT_WITHOUT_REPRODUCIBILITY_METADATA_NOT_MARKED_VERIFIED' as const;
export const NEGATIVE_RESULT_KEPT_SEARCHABLE =
  'NEGATIVE_RESULT_REMAINS_SEARCHABLE_NOT_DISCARDED' as const;
export const ALGORITHM_LINEAGE_REQUIRED =
  'ALGORITHM_VARIANT_RETAINS_LINEAGE_PARENT_LINK' as const;
export const LOCAL_MODEL_SANDBOX_UNTIL_REVIEW =
  'LOCAL_MODEL_IMPROVEMENT_REMAINS_SANDBOX_UNTIL_EVAL_AND_HUMAN_REVIEW' as const;
export const UNCONTROLLED_SELF_IMPROVE_DENIED =
  'UNCONTROLLED_SELF_IMPROVEMENT_DENIED' as const;
export const UNKNOWN_RIGHTS_TRAINING_DENIED =
  'UNKNOWN_RIGHTS_TRAINING_DATA_DENIED' as const;
export const PLUGIN_MISSING_SCOPE_DENIED =
  'DENY_BY_DEFAULT_PLUGIN_MISSING_SCOPE_DENIED' as const;
export const REGISTRATION_NO_AUTHORITY =
  'PLUGIN_REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const UNCONFIGURED_COMPUTE_UNAVAILABLE =
  'UNCONFIGURED_AWS_OR_GCP_SCIENTIFIC_COMPUTE_UNAVAILABLE' as const;
export const SEALED_SILENT_CLOUD_COMPUTE_DENIED =
  'SEALED_WORKLOAD_CANNOT_SILENT_ROUTE_TO_CLOUD_COMPUTE' as const;
export const UNIVERSITY_SKILL_NO_PERMISSION =
  'UNIVERSITY_SKILL_DOES_NOT_ESCALATE_PERMISSION' as const;
export const QUEUE_DEPLOY_DENIED =
  'QUEUE_CANNOT_PRODUCTION_DEPLOY_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export type CuActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'research_cloud_curator'
  | 'university_dean'
  | 'model_academy_evaluator'
  | 'experiment_archivist'
  | 'compute_fabric_operator'
  | 'algorithm_lineage_curator'
  | 'plugin_runtime_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type CuActor = {
  kind: CuActorKind;
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
    CT: {
      tipProbe:
        hasMod('ai-research-civilization-os-types.ts') ||
        has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CT AI Research Civilization OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    CS: {
      tipProbe:
        hasMod('sovereign-research-lab-types.ts') ||
        has('62L_CS_SOVEREIGN_RESEARCH_LAB_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CS_SOVEREIGN_RESEARCH_LAB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CS Sovereign Research Lab when CT absent.',
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
      note: 'CR Hybrid Supercompute Universe OS when CT/CS absent.',
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
      note: 'CQ Offline Universe Quantum Genome — used as base when CT/CS/CR WAITING_DATA.',
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
      note: 'CP Knowledge Supply / Plugin Foundry @ e5e53b8 lineage (plugin deny-by-default reuse).',
    },
    CO: {
      tipProbe:
        hasMod('global-knowledge-exchange-os-types.ts') ||
        has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CO Global Knowledge Exchange OS when CP absent.',
    },
    CH: {
      tipProbe:
        hasMod('knowledge-civilization-dept-universities-types.ts') ||
        has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CH Knowledge Civilization / Dept Universities — university skill≠permission lineage.',
    },
  };
}
