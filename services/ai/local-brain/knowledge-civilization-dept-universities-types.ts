import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CH — XIV Knowledge Civilization OS + Agent Department Universities +
 * Historical World Model Graph + Adaptive Database/Memory Fabric +
 * Multi-Model Expert Councils + Distributed Edge Intelligence Colony.
 *
 * SoT: GitHub #98. GitLab #32 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Skill transcripts + evaluation gates: learning measurable and reversible;
 * skill ≠ permission/authority.
 * Historical World Model: facts ≠ correlations ≠ causal hypotheses ≠ simulations.
 * Adaptive DB/Memory Fabric: propose from measured workload evidence only;
 * recommend/test ≠ auto-alter production DBs.
 * Multi-model councils local-first; sealed never silent cloud fallback.
 * Edge colony: explicit enrollment + permissions; unenrolled → UNAVAILABLE/DENIED.
 * No soul-resurrection claims; Founder-sealed deny-by-default.
 * L4=false. tip-land=NO.
 */

export const KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE = [
  'honesty_locks',
  'civilization_os_facade',
  'department_university_enroll',
  'skill_transcript_no_permission',
  'evaluation_decay_reverses_trust',
  'world_model_typed_states',
  'reject_correlation_to_fact',
  'reject_sim_to_verified_fact',
  'db_fabric_propose_from_evidence',
  'db_fabric_no_auto_apply',
  'proposal_without_evidence_rejected',
  'council_local_first',
  'unconfigured_provider_unavailable',
  'sealed_no_cloud_fallback',
  'edge_enroll_explicit',
  'unenrolled_edge_denied',
  'soul_claim_rejected',
  'evidence',
  'learning',
] as const;

export type ChHop = (typeof KNOWLEDGE_CIVILIZATION_DEPT_UNIVERSITIES_CYCLE)[number];

export type ChEvidenceState =
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
  | 'TRUSTED'
  | 'DECAYED'
  | 'REVERSED';

export type ChHopRecord = {
  hop: ChHop;
  state: ChEvidenceState;
  summary: string;
  at: string;
};

export const CH_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_ALTER_PRODUCTION_DB: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  SKILL_IS_PERMISSION: false as const,
  SKILL_IS_AUTHORITY: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_MODEL_FIRST: true as const,
  CLOUD_COUNCIL_REQUIRES_CONFIG_AUTH_VERIFY: true as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  FACTS_EQ_CORRELATIONS: false as const,
  CORRELATIONS_EQ_CAUSAL_HYPOTHESES: false as const,
  CAUSAL_HYPOTHESES_EQ_SIMULATIONS: false as const,
  SIMULATIONS_EQ_VERIFIED_FACTS: false as const,
  CORRELATION_PROMOTE_TO_FACT: false as const,
  SIM_PROMOTE_TO_VERIFIED_FACT: false as const,
  DB_PROPOSAL_REQUIRES_MEASURED_WORKLOAD: true as const,
  DB_CANDIDATES_AUTO_APPLIED: false as const,
  EDGE_REQUIRES_EXPLICIT_ENROLLMENT: true as const,
  EDGE_REQUIRES_EXPLICIT_PERMISSIONS: true as const,
  UNENROLLED_EDGE_ALLOWED: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  LEARNING_MEASURABLE: true as const,
  LEARNING_REVERSIBLE: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-CI — XIV Persistent Intelligence Economy + Agent Workforce Operating Ledger + World Knowledge Simulation Engine + Autonomous Database Research Lab + Local Model Evolution Academy + Global Edge Knowledge Exchange' as const;

export const GITHUB_SOT_ISSUE = 98 as const;
export const GITLAB_COORDINATION_ISSUE = 32 as const;

export const SKILL_TRANSCRIPT_NOT_PERMISSION =
  'DEPARTMENT_SKILL_TRANSCRIPT_DOES_NOT_GRANT_PERMISSIONS' as const;
export const EVALUATION_DECAY_REVERSES_TRUST =
  'FAILED_EVALUATION_OR_DECAY_REVERSES_TRUSTED_SKILL_STATUS' as const;
export const CORRELATION_TO_FACT_REJECTED =
  'WORLD_MODEL_REJECTS_PROMOTING_CORRELATION_TO_FACT' as const;
export const SIM_TO_VERIFIED_FACT_REJECTED =
  'WORLD_MODEL_REJECTS_PROMOTING_SIMULATION_TO_VERIFIED_FACT' as const;
export const DB_FABRIC_NO_AUTO_APPLY =
  'DB_MEMORY_FABRIC_PROPOSAL_CANNOT_AUTO_APPLY_PRODUCTION_SCHEMA' as const;
export const DB_PROPOSAL_WITHOUT_EVIDENCE_REJECTED =
  'PROPOSAL_WITHOUT_MEASURED_WORKLOAD_EVIDENCE_REJECTED' as const;
export const UNENROLLED_EDGE_DENIED =
  'UNENROLLED_EDGE_NODE_DENIED_OR_UNAVAILABLE' as const;
export const SEALED_NO_CLOUD_FALLBACK =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_CLOUD_COUNCIL_MEMBER' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_UNAVAILABLE' as const;
export const LOCAL_PREFERRED_OVER_CLOUD =
  'LOCAL_MODEL_PREFERRED_OVER_CLOUD_WHEN_BOTH_AVAILABLE' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;
export const WORLD_MODEL_HARD_SEPARATION =
  'FACTS_NE_CORRELATIONS_NE_CAUSAL_HYPOTHESES_NE_SIMULATIONS' as const;

export const DEPARTMENT_KEYS = [
  'law_governance',
  'healthcare_operations',
  'supply_chain',
  'engineering_hardware',
  'history_culture',
  'business',
  'finance',
  'research',
  'security',
  'executive_work',
] as const;

export type DepartmentKey = (typeof DEPARTMENT_KEYS)[number];

export type WorldModelNodeKind =
  | 'fact'
  | 'correlation'
  | 'causal_hypothesis'
  | 'simulation';

export type WorldModelTrustState =
  | 'recorded'
  | 'supported'
  | 'verified_fact'
  | 'rejected'
  | 'labeled_simulation';

export type DbFabricChangeKind =
  | 'schema'
  | 'index'
  | 'cache'
  | 'partition'
  | 'storage'
  | 'knowledge_pack';

export type ChActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'civilization_os_agent'
  | 'department_dean'
  | 'world_model_curator'
  | 'db_fabric_advisor'
  | 'expert_council_chair'
  | 'edge_colony_coordinator'
  | 'ordinary_agent'
  | 'impersonator';

export type ChActor = {
  kind: ChActorKind;
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
    CG: {
      tipProbe: hasMod('deep-knowledge-refinery-os-types.ts') ||
        has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'Preferred CG Deep Knowledge Refinery OS tip + report. Used as CH base when PRESENT.',
    },
    CF: {
      tipProbe:
        hasMod('data-refinery-compression-replication-types.ts') ||
        hasMod('global-data-refinery-civilization.ts') ||
        has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md') ||
        has('62L_CF_GLOBAL_DATA_REFINERY_CIVILIZATION_REPORT.md') ||
        has('62L_CF_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md') ||
        has('62L_CF_GLOBAL_DATA_REFINERY_CIVILIZATION_REPORT.md') ||
        has('62L_CF_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred CF after CG when CG absent.',
    },
    CE: {
      tipProbe: hasMod('knowledge-excavation-memory-lake-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CE_KNOWLEDGE_EXCAVATION_MEMORY_LAKE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CE Knowledge Excavation / Memory Lake tip (CG/CF ancestor).',
    },
    CD: {
      tipProbe: hasMod('data-root-local-llm-archive-mesh-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_CD_DATA_ROOT_LOCAL_LLM_ARCHIVE_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CD ancestor of CE base.',
    },
    CC: {
      tipProbe: has('62L_CC_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CC when CD→CE→CF→CG chain broken.',
    },
    CB: {
      tipProbe: has('62L_CB_REPORT.md') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_CB_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CB fallback.',
    },
    CA: {
      tipProbe:
        has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md') ||
        hasMod('distributed-intelligence-metabolism-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CA_DISTRIBUTED_INTELLIGENCE_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CA fallback.',
    },
    BZ: {
      tipProbe: hasMod('global-compute-nervous-routing-types.ts')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BZ_GLOBAL_COMPUTE_NERVOUS_ROUTING_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BZ @ ff72b94 in preference chain.',
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
