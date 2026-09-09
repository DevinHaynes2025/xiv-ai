import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CJ — XIV Intelligence Resource Grid + Autonomous Agent Apprenticeship Network +
 * Historical Knowledge Reconstruction Engine + Self-Optimizing Retrieval/Memory Lab +
 * Local/Cloud Model Federation + Universal Edge Runtime Mesh.
 *
 * SoT: GitHub #100. GitLab #34 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Resource grid = placement/accounting only — no autonomous spending/billing.
 * Apprenticeship: mentor/eval gates; skill ≠ permission; no authority transfer.
 * Historical reconstruction: evidence-backed; facts ≠ hypotheses ≠ sims; no soul-resurrection.
 * Retrieval/memory lab: sandbox candidates only; recommend ≠ auto production alter.
 * Model federation: local-first; sealed never silent cloud fallback; unconfigured UNAVAILABLE.
 * Edge runtime mesh: enrolled devices only; explicit handoff; no hidden deploy.
 * RUNNING_VERIFIED requires evidence if touching workforce status (reuse CI patterns).
 * Founder-sealed deny-by-default; security/correctness ahead of speed/energy.
 * L4=false. tip-land=NO.
 */

export const INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE = [
  'honesty_locks',
  'grid_place_account_resources',
  'grid_purchase_bill_spend_denied',
  'apprentice_open_with_mentor_eval_gate',
  'apprentice_cannot_gain_mentor_production_permissions',
  'reconstruction_evidence_backed',
  'reconstruction_without_evidence_not_verified_fact',
  'soul_afterlife_capability_claim_rejected',
  'retrieval_lab_sandbox_candidate',
  'retrieval_lab_auto_apply_production_denied',
  'federation_local_first',
  'federation_unconfigured_unavailable',
  'federation_sealed_no_silent_cloud',
  'edge_enroll_device',
  'edge_unenrolled_handoff_denied',
  'edge_explicit_handoff_only',
  'edge_hidden_deploy_denied',
  'freshness_sensitive_offline_stale_waiting',
  'evidence',
  'learning',
] as const;

export type CjHop = (typeof INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_CYCLE)[number];

export type CjEvidenceState =
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
  | 'LABELED_HYPOTHESIS'
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'RUNNING_VERIFIED'
  | 'ENROLLED'
  | 'PLACED'
  | 'ACCOUNTED';

export type CjHopRecord = {
  hop: CjHop;
  state: CjEvidenceState;
  summary: string;
  at: string;
};

export const CJ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  AUTONOMOUS_SPENDING: false as const,
  PURCHASE_AUTHORITY: false as const,
  BILLING_AUTHORITY: false as const,
  RESOURCE_GRID_IS_SPEND: false as const,
  RESOURCE_GRID_PLACEMENT_ACCOUNTING_ONLY: true as const,
  APPRENTICE_GAINS_MENTOR_PERMISSIONS: false as const,
  APPRENTICE_GAINS_PRODUCTION_PERMISSIONS: false as const,
  SKILL_IS_PERMISSION: false as const,
  AUTHORITY_TRANSFER_VIA_APPRENTICESHIP: false as const,
  MENTOR_EVAL_GATE_REQUIRED: true as const,
  RECONSTRUCTION_WITHOUT_EVIDENCE_IS_VERIFIED_FACT: false as const,
  FACTS_EQ_HYPOTHESES: false as const,
  FACTS_EQ_SIMULATIONS: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  AFTERLIFE_CAPABILITY_CLAIMS: false as const,
  RETRIEVAL_LAB_AUTO_APPLY_PRODUCTION: false as const,
  RETRIEVAL_LAB_SANDBOX_ONLY: true as const,
  MEMORY_LAB_AUTO_ALTER_INDEX_SCHEMA: false as const,
  RECOMMEND_EQ_AUTO_PRODUCTION_ALTER: false as const,
  LOCAL_FIRST_FEDERATION: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  EDGE_HANDOFF_UNENROLLED: false as const,
  EDGE_HIDDEN_DEPLOY: false as const,
  EDGE_HANDOFF_REQUIRES_EXPLICIT: true as const,
  DEVICE_ENROLLMENT_REQUIRED: true as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  SECURITY_CORRECTNESS_BEATS_SPEED_ENERGY: true as const,
  LEARNING_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CK — XIV Cognitive Infrastructure Grid + Department Agent Operating Companies + Deep Historical Archive Reconstruction + Adaptive Neural Index Evolution + Local Model Training/Evaluation Factory + Distributed Device Intelligence Fabric' as const;

export const GITHUB_SOT_ISSUE = 100 as const;
export const GITLAB_COORDINATION_ISSUE = 34 as const;

export const GRID_SPEND_DENIED =
  'INTELLIGENCE_RESOURCE_GRID_CANNOT_PURCHASE_BILL_OR_SPEND' as const;
export const APPRENTICE_PERMISSION_DENIED =
  'APPRENTICE_CANNOT_GAIN_MENTOR_OR_PRODUCTION_PERMISSIONS' as const;
export const RECONSTRUCTION_NOT_VERIFIED_FACT =
  'RECONSTRUCTION_WITHOUT_EVIDENCE_NOT_LABELED_VERIFIED_FACT' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_OR_AFTERLIFE_CAPABILITY_CLAIM_REJECTED' as const;
export const RETRIEVAL_LAB_AUTO_APPLY_DENIED =
  'RETRIEVAL_MEMORY_LAB_CANNOT_AUTO_APPLY_PRODUCTION_INDEX_OR_SCHEMA' as const;
export const SEALED_FEDERATION_CLOUD_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_CLOUD_FEDERATION_MEMBER' as const;
export const UNCONFIGURED_FEDERATION_UNAVAILABLE =
  'UNCONFIGURED_FEDERATION_PROVIDER_UNAVAILABLE' as const;
export const UNENROLLED_EDGE_HANDOFF_DENIED =
  'UNENROLLED_DEVICE_HANDOFF_DENIED_OR_UNAVAILABLE' as const;
export const HIDDEN_EDGE_DEPLOY_DENIED =
  'HIDDEN_EDGE_RUNTIME_DEPLOY_DENIED' as const;
export const FRESHNESS_STALE_OR_WAITING =
  'FRESHNESS_SENSITIVE_OFFLINE_PATH_STALE_OR_WAITING_DATA' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type CjActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'resource_grid_agent'
  | 'apprenticeship_mentor'
  | 'apprenticeship_apprentice'
  | 'reconstruction_engine'
  | 'retrieval_memory_lab'
  | 'model_federation_router'
  | 'edge_runtime_mesh'
  | 'ordinary_agent'
  | 'impersonator';

export type CjActor = {
  kind: CjActorKind;
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

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()): Record<string, PredecessorProbe> {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  const localBrain = join(root, 'services/ai/local-brain');
  const hasMod = (file: string) => existsSync(join(localBrain, file));

  return {
    CI: {
      tipProbe: hasMod('persistent-intelligence-economy-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred CI Persistent Intelligence Economy tip + report.',
    },
    CH: {
      tipProbe: hasMod('enterprise-knowledge-os-types.ts')
        ? 'PRESENT'
        : hasMod('knowledge-civilization-dept-universities-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CH_ENTERPRISE_KNOWLEDGE_OS_REPORT.md')
        ? 'PRESENT'
        : has('62L_CH_KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'CH Enterprise Knowledge OS / Knowledge Civilization when CI absent.',
    },
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS when CH/CI absent.',
    },
    CF: {
      tipProbe: hasMod('data-refinery-compression-replication-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication fallback base.',
    },
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CE Knowledge Excavation / Memory Lake ancestor @ 4a902ca.',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CD Data-Root / Local LLM / Archive Mesh ancestor.',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ Global Compute Nervous / Routing fallback @ ff72b94.',
    },
    BT: {
      tipProbe: hasMod('apprenticeship-experiment-evolution-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BT Apprenticeship / Experiment / Evolution patterns reused.',
    },
  };
}

export function containsForbiddenPrivateFields(payload?: Record<string, unknown>): boolean {
  if (!payload) return false;
  const keys = Object.keys(payload).map((k) => k.toLowerCase());
  return keys.some((k) =>
    (FORBIDDEN_PRIVATE_FIELDS as readonly string[]).some(
      (f) => k === f || k.includes(f) || k.includes('hidden_reasoning') || k.includes('private_cot'),
    ),
  );
}
