import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BW — Planetary Chip Intelligence Fabric + Founder Avatar Delegate Universe +
 * Law/Ethics Governance + Verified Web Knowledge Mining + Universal Device/Plugin Neural Mesh.
 *
 * SoT: GitHub #87. GitLab #21 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Sparse logical address spaces / partitioning / sharding / streaming / compression /
 * indexing / queues / routing are benchmarkable claims — NOT unlimited capacity and
 * NOT trillions of live processes. Founder-avatar delegates cannot impersonate founder,
 * approve deals, move money, deploy production, or publish externally. Unknown
 * consent/licensing/jurisdiction/ownership/provider/device/hardware → DENIED or
 * WAITING_DATA (never silent pass). Verified-source web mining only. L4=false.
 */

export const PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_CYCLE = [
  'honesty_locks',
  'chip_fabric_map',
  'workload_chip_optimize_verified_only',
  'quantum_requires_classical_baseline',
  'avatar_sparse_activate',
  'avatar_hard_denies',
  'law_ethics_unknown_deny',
  'web_mining_verified_only',
  'article_draft_no_external_publish',
  'device_provider_unenrolled_unavailable',
  'sparse_neural_route_bounded',
  'trillion_catalog_no_trillion_processes',
  'capacity_claim_needs_benchmark',
  'evidence',
  'learning',
] as const;

export type BwHop = (typeof PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_CYCLE)[number];

export type BwEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
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
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'BOUNDED'
  | 'SPARSE_LOGICAL';

export type BwHopRecord = {
  hop: BwHop;
  state: BwEvidenceState;
  summary: string;
  at: string;
};

export const BW_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  FOUNDER_IMPERSONATION: false as const,
  AVATAR_APPROVE_DEALS: false as const,
  AVATAR_MOVE_MONEY: false as const,
  AVATAR_DEPLOY_PRODUCTION: false as const,
  AVATAR_EXTERNAL_PUBLISH: false as const,
  UNKNOWN_CONSENT_SILENT_PASS: false as const,
  UNKNOWN_LICENSE_SILENT_PASS: false as const,
  UNKNOWN_JURISDICTION_SILENT_PASS: false as const,
  UNKNOWN_OWNERSHIP_SILENT_PASS: false as const,
  UNVERIFIED_WEB_SOURCE_MINING: false as const,
  ARTICLE_AUTO_EXTERNAL_PUBLISH: false as const,
  UNCONFIGURED_DEVICE_AVAILABLE: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  TRILLION_LIVE_PROCESSES: false as const,
  UNLIMITED_CAPACITY_CLAIM: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  LEARNING_IS_PERMISSION: false as const,
  RECOMMENDATION_IS_CHARGE_DEPLOY_PUBLISH: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  SPARSE_LOGICAL_ONLY: true as const,
  VERIFIED_SOURCES_ONLY: true as const,
  CAPACITY_REQUIRES_BENCHMARK: true as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-BX — XIV Neural Chip OS Abstraction + Global Semiconductor Digital Twin + Device Intelligence Marketplace + Quantum Workload Compiler + Business Knowledge Broadcasting Network + Planetary Superbrain Routing Cortex' as const;

export const GITHUB_SOT_ISSUE = 87 as const;
export const GITLAB_COORDINATION_ISSUE = 21 as const;

export const AVATAR_IMPERSONATION_DENIED = 'FOUNDER_AVATAR_IMPERSONATION_DENIED' as const;
export const AVATAR_DEAL_APPROVAL_DENIED = 'FOUNDER_AVATAR_DEAL_APPROVAL_DENIED' as const;
export const AVATAR_MONEY_MOVE_DENIED = 'FOUNDER_AVATAR_MONEY_MOVE_DENIED' as const;
export const AVATAR_DEPLOY_DENIED = 'FOUNDER_AVATAR_PRODUCTION_DEPLOY_DENIED' as const;
export const AVATAR_PUBLISH_DENIED = 'FOUNDER_AVATAR_EXTERNAL_PUBLISH_DENIED' as const;
export const UNKNOWN_CONSENT_DENIED = 'UNKNOWN_CONSENT_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_LICENSE_DENIED = 'UNKNOWN_LICENSE_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_JURISDICTION_DENIED = 'UNKNOWN_JURISDICTION_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_OWNERSHIP_DENIED = 'UNKNOWN_OWNERSHIP_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_PROVIDER_ACCESS_DENIED = 'UNKNOWN_PROVIDER_ACCESS_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_DEVICE_ENROLLMENT_DENIED = 'UNKNOWN_DEVICE_ENROLLMENT_DENIED_OR_WAITING_DATA' as const;
export const UNKNOWN_HARDWARE_SUPPORT_DENIED = 'UNKNOWN_HARDWARE_SUPPORT_DENIED_OR_WAITING_DATA' as const;
export const UNVERIFIED_WEB_SOURCE_DENIED = 'UNVERIFIED_WEB_SOURCE_MINING_DENIED' as const;
export const ARTICLE_EXTERNAL_PUBLISH_DENIED = 'ARTICLE_EXTERNAL_PUBLISH_DENIED_WITHOUT_HUMAN_GATE' as const;
export const UNCONFIGURED_DEVICE_UNAVAILABLE = 'UNCONFIGURED_OR_UNENROLLED_DEVICE_UNAVAILABLE' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE = 'UNCONFIGURED_PROVIDER_UNAVAILABLE' as const;
export const QUANTUM_CLASSICAL_BASELINE_REQUIRED = 'QUANTUM_ROUTE_REQUIRES_CLASSICAL_BASELINE' as const;
export const QUANTUM_NO_ADVANTAGE_WITHOUT_EVIDENCE = 'QUANTUM_ADVANTAGE_CLAIM_WITHOUT_EVIDENCE_DENIED' as const;
export const CHIP_TARGET_UNVERIFIED = 'WORKLOAD_CHIP_TARGET_UNVERIFIED_CANDIDATE_ONLY' as const;
export const TRILLION_PROCESSES_DENIED = 'TRILLION_LIVE_PROCESSES_DENIED_SPARSE_LOGICAL_ONLY' as const;
export const CAPACITY_UNVERIFIED = 'CAPACITY_CLAIM_NOT_VERIFIED_WITHOUT_BENCHMARK' as const;
export const ACTIVATION_BOUNDED = 'SPARSE_ACTIVATION_BOUNDED' as const;

export type BwActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'founder_avatar_delegate'
  | 'chip_fabric_agent'
  | 'ethics_gate'
  | 'web_miner'
  | 'article_drafter'
  | 'device_mesh_adapter'
  | 'neural_router'
  | 'ordinary_agent'
  | 'impersonator';

export type BwActor = {
  kind: BwActorKind;
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
    BV: {
      tipProbe:
        has('62L_BV_AI_SYSTEMS_ARCHITECTURE_INSTITUTE_REPORT.md') ||
        hasMod('ai-systems-architecture-institute.ts') ||
        has('62L_BV_SYSTEMS_ARCHITECTURE_BUILD_INTELLIGENCE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_BV_AI_SYSTEMS_ARCHITECTURE_INSTITUTE_REPORT.md') ||
        has('62L_BV_SYSTEMS_ARCHITECTURE_BUILD_INTELLIGENCE_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred BV tip + report. May be WAITING_DATA if never queued; BW proceeds from BU when BV absent.',
    },
    BU: {
      tipProbe:
        has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md') ||
        hasMod('code-research-benchmark-strategy-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BU tip @ 342585a when BV WAITING_DATA. Used as BW base.',
    },
    BT: {
      tipProbe:
        has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md') ||
        hasMod('apprenticeship-experiment-evolution-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BT ancestor of BU.',
    },
    BS: {
      tipProbe:
        has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md') ||
        hasMod('software-engineering-university.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BS Engineering University ancestor.',
    },
    BR: {
      tipProbe: hasMod('structured-code-memory.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_BR_STRUCTURED_CODE_MEMORY_DEBUG_ACADEMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BR Structured Code Memory ancestor.',
    },
    BQ: {
      tipProbe: hasMod('polyglot-language-registry.ts') ? 'PRESENT' : 'WAITING_DATA',
      report: has('62L_BQ_POLYGLOT_CODING_CIVILIZATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BQ polyglot honesty reused conceptually.',
    },
    BP: {
      tipProbe: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BP Cognitive Homeostasis ancestor.',
    },
    BO: {
      tipProbe: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BO_SUPERBRAIN_NEUROPLASTICITY_IMMUNE_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BO Superbrain Neuroplasticity ancestor.',
    },
    BN: {
      tipProbe: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BN_SUPERBRAIN_NEURAL_GROWTH_METABOLISM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BN tip may remain WAITING_DATA.',
    },
    BM: {
      tipProbe: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BM Org Neural Federation ancestor.',
    },
    BL: {
      tipProbe: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BL Org Agent Universes ancestor.',
    },
    BJ: {
      tipProbe: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BJ Offline Intelligence OS ancestor.',
    },
  };
}
