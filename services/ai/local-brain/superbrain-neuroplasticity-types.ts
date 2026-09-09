import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BO — Superbrain Neuroplasticity Engine + Organization Knowledge DNA +
 * Agent Skill Evolution + Global Intelligence Immune System +
 * Adaptive Offline/Cloud Brain Layers contracts.
 *
 * SoT: GitHub #79. GitLab #13 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Neuroplasticity improves weights/strategies/mappings from **verified outcomes** only.
 * Cannot expand its own permissions or bypass human authority.
 * Skill evolution ≠ permission grant; learning ≠ authority.
 * Immune system: quarantine + revalidation — never silently trust stale/poisoned/corrupted artifacts.
 */

export const SUPERBRAIN_NEUROPLASTICITY_CYCLE = [
  'honesty_locks',
  'plasticity_verified_outcome_gate',
  'route_weight_adapt',
  'retrieval_strategy_adapt',
  'agent_task_mapping_adapt',
  'workcell_composition_adapt',
  'cache_placement_adapt',
  'resource_allocation_adapt',
  'self_permission_expansion_deny',
  'knowledge_dna_version',
  'org_isolation_seal',
  'skill_evolution_evaluate',
  'skill_not_permission_lock',
  'immune_detect_stale_poison',
  'immune_quarantine',
  'immune_revalidate',
  'corrupted_memory_revalidation',
  'adaptive_layer_place',
  'faster_route_cannot_bypass_quarantine',
  'evidence',
] as const;

export type BoHop = (typeof SUPERBRAIN_NEUROPLASTICITY_CYCLE)[number];

export type BoEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED'
  | 'REJECTED'
  | 'QUARANTINED'
  | 'REVALIDATION_REQUIRED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED';

export type BoHopRecord = {
  hop: BoHop;
  state: BoEvidenceState;
  summary: string;
  at: string;
};

export const BO_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  BYPASS_HUMAN_AUTHORITY: false as const,
  SKILL_EVOLUTION_IS_PERMISSION_GRANT: false as const,
  LEARNING_IS_AUTHORITY: false as const,
  UNVERIFIED_OUTCOME_UPDATES_WEIGHTS: false as const,
  SILENT_TRUST_STALE_OR_POISONED: false as const,
  FASTER_ROUTE_BYPASSES_QUARANTINE: false as const,
  CROSS_ORG_DNA_POOLING_DEFAULT: false as const,
  RAW_GLOBAL_KNOWLEDGE_POOLING: false as const,
  FORECAST_IS_VERIFIED_FACT: false as const,
  SIMULATION_IS_VERIFIED_FACT: false as const,
  RECOMMENDATION_IS_CHARGE_OR_DEPLOY: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  ORG_ISOLATION: true as const,
  PRIVACY_OVER_SPEED_OR_PRICE: true as const,
  IMMUNE_QUARANTINE_REQUIRED: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BP — Superbrain Cognitive Homeostasis + Organization Digital Genome Replication + Multi-Agent Skill Marketplace + Resilient Edge/Cloud Brain Mesh + Global Intelligence Recovery Fabric' as const;

export const GITHUB_SOT_ISSUE = 79 as const;
export const GITLAB_COORDINATION_ISSUE = 13 as const;

export const UNVERIFIED_OUTCOME_REJECTED = 'PLASTICITY_UNVERIFIED_OUTCOME_REJECTED';
export const SELF_PERMISSION_EXPANSION_DENIED = 'SELF_PERMISSION_EXPANSION_DENIED';
export const SKILL_NOT_PERMISSION = 'SKILL_EVOLUTION_IS_NOT_PERMISSION_GRANT';
export const ARTIFACT_QUARANTINED = 'POISONED_OR_STALE_ARTIFACT_QUARANTINED';
export const MEMORY_REVALIDATION_REQUIRED = 'CORRUPTED_MEMORY_REVALIDATION_REQUIRED';
export const CROSS_ORG_DNA_DENIED = 'CROSS_ORG_KNOWLEDGE_DNA_LEAK_DENIED';
export const QUARANTINE_BYPASS_DENIED = 'FASTER_ROUTE_CANNOT_BYPASS_IMMUNE_QUARANTINE';

export type PlasticityTarget =
  | 'route_weight'
  | 'retrieval_strategy'
  | 'agent_task_mapping'
  | 'workcell_composition'
  | 'cache_placement'
  | 'local_cloud_resource_allocation';

export type OutcomeVerification = 'verified' | 'unverified' | 'forecast' | 'simulation' | 'recommendation';

export type ArtifactTrustState =
  | 'trusted'
  | 'stale'
  | 'poisoned'
  | 'corrupted'
  | 'quarantined'
  | 'revalidation_required';

export type AdaptiveLocality = 'local' | 'edge' | 'cloud' | 'hybrid';

export type KnowledgeDnaKind =
  | 'durable_knowledge'
  | 'policy'
  | 'workflow'
  | 'lesson'
  | 'skill'
  | 'operating_pattern'
  | 'evidence_lineage';

function repoRootFromHere() {
  return join(dirname(fileURLToPath(import.meta.url)), '../../..');
}

export function predecessorMap(root = repoRootFromHere()) {
  const ops = join(root, 'docs/operations');
  const has = (file: string) => existsSync(join(ops, file));
  return {
    BN: {
      tipProbe: (has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'Preferred BN tip + report PRESENT — used as BO base.',
    },
    BM: {
      tipProbe: (has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BM ancestor of BN; available when BN unavailable.',
    },
    BL: {
      tipProbe: (has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BL ancestor of BM; available fallback if BM unavailable.',
    },
    BK: {
      tipProbe: (has('62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA') as 'PRESENT' | 'WAITING_DATA',
      report: has('62L_BK_SUPERBRAIN_COEXISTENCE_CODING_MESH_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BK tip may be present on origin; preference order still BN→BM→BL before BK.',
    },
    BJ: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BJ ancestor / included on BL tip; fallback if BL unavailable.',
    },
    BD: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BD ancestor.',
    },
    BA: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'BA ancestor.',
    },
    AY: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AY_GROWTH_MEDIA_ONBOARDING_SUPERBRAIN_REFINERY_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AY ancestor.',
    },
    AX: {
      tipProbe: 'PRESENT' as const,
      report: has('62L_AX_SOVEREIGN_SEALED_FABRIC_UX_TRUST_REPORT.md')
        ? ('PRESENT' as const)
        : ('MISSING' as const),
      note: 'AX ancestor.',
    },
  };
}

export function githubIssueSot() {
  return {
    githubIssue: GITHUB_SOT_ISSUE,
    githubRole: 'implementation_source_of_truth' as const,
    gitlabIssue: GITLAB_COORDINATION_ISSUE,
    gitlabRole: 'coordination_only' as const,
    note: 'GitHub #79 is SoT; GitLab #13 is coordination only. Issue API may be unreadable.',
  };
}
