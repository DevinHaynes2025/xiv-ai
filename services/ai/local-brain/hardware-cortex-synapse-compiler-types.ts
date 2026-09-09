import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BY — Universal Hardware Knowledge Cortex + Semiconductor Innovation Laboratory +
 * Multi-Device Agent Runtime + Economic Compute Scheduler +
 * Verified Global Business Intelligence Stream + Superbrain Synapse Compiler.
 *
 * SoT: GitHub #89. GitLab #23 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Semiconductor Innovation Lab = sandbox; research ≠ production chip/deploy authority.
 * Economic scheduler compares latency, cost proxies, trust, locality, residency,
 * business priority, resource pressure — agents have no purchasing or billing authority.
 * Recommendation ≠ charge/buy/deploy; cost proxy ≠ live invoice.
 * BI stream must be verified/provenance-aware; unverified → DENIED/UNAVAILABLE.
 * Synapse Compiler turns approved relationships into sparse governed routes —
 * not silent privilege expansion.
 * Offline island mode bounded; freshness-sensitive → STALE/WAITING_DATA.
 * Unverified hardware/devices UNAVAILABLE. Founder-sealed deny-by-default.
 * Speed never overrides security/trust. L4=false.
 */

export const HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE = [
  'honesty_locks',
  'hardware_knowledge_cortex_ingest',
  'hardware_provenance_freshness_gate',
  'unverified_hardware_unavailable',
  'semiconductor_lab_sandbox_experiment',
  'lab_output_not_production_authorized',
  'multi_device_handoff_checkpoint',
  'handoff_no_authority_transfer',
  'offline_island_freshness_gate',
  'economic_scheduler_place',
  'scheduler_no_purchase_bill_charge',
  'sealed_trust_beats_cheaper_faster',
  'bi_stream_verified_provenance_gate',
  'unverified_bi_denied',
  'synapse_compile_approved_only',
  'unapproved_relationship_denied',
  'sparse_governed_routes',
  'evidence',
  'learning',
] as const;

export type ByHop = (typeof HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE)[number];

export type ByEvidenceState =
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
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'BOUNDED'
  | 'SPARSE';

export type ByHopRecord = {
  hop: ByHop;
  state: ByEvidenceState;
  summary: string;
  at: string;
};

export const BY_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  PRODUCTION_CHIP_DEPLOY_AUTHORITY: false as const,
  LAB_OUTPUT_IS_PRODUCTION: false as const,
  AGENT_PURCHASING_AUTHORITY: false as const,
  AGENT_BILLING_AUTHORITY: false as const,
  AGENT_CHARGE_AUTHORITY: false as const,
  COST_PROXY_IS_LIVE_INVOICE: false as const,
  RECOMMENDATION_IS_CHARGE_BUY_DEPLOY: false as const,
  CHEAPER_FASTER_BYPASSES_SEALED_TRUST: false as const,
  UNVERIFIED_BI_LABELED_VERIFIED: false as const,
  RAW_PRIVATE_BI_POOLING_DEFAULT: false as const,
  UNAPPROVED_SYNAPSE_COMPILE: false as const,
  SYNAPSE_SILENT_PRIVILEGE_EXPANSION: false as const,
  HANDOFF_TRANSFERS_AUTHORITY: false as const,
  UNVERIFIED_DEVICE_RUNTIME_AVAILABLE: false as const,
  UNVERIFIED_HARDWARE_AVAILABLE: false as const,
  UNBOUNDED_OFFLINE_ISLAND: false as const,
  FRESHNESS_SENSITIVE_SILENT_PASS: false as const,
  SPEED_OVERRIDES_SECURITY_TRUST: false as const,
  LEARNING_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LAB_SANDBOX_ONLY: true as const,
  SCHEDULER_RECOMMENDATION_ONLY: true as const,
  BI_VERIFIED_PROVENANCE_REQUIRED: true as const,
  SYNAPSE_APPROVED_RELATIONSHIPS_ONLY: true as const,
  SPARSE_GOVERNED_ROUTES: true as const,
  OFFLINE_ISLAND_BOUNDED: true as const,
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
  '62L-BZ — Global Compute Nervous System + Chip Design Knowledge Foundry + Distributed Memory/Cache Intelligence + Universal AI Device Federation + Business Signal Exchange + Superbrain Cognitive Routing Optimizer' as const;

export const GITHUB_SOT_ISSUE = 89 as const;
export const GITLAB_COORDINATION_ISSUE = 23 as const;

export const UNVERIFIED_HARDWARE_UNAVAILABLE =
  'UNVERIFIED_HARDWARE_KNOWLEDGE_OR_DEVICE_UNAVAILABLE' as const;
export const LAB_SANDBOXED_NOT_PRODUCTION =
  'SEMICONDUCTOR_LAB_OUTPUT_SANDBOXED_NOT_PRODUCTION_AUTHORIZED' as const;
export const SCHEDULER_NO_PURCHASE =
  'ECONOMIC_SCHEDULER_NO_PURCHASE_BILL_CHARGE_AUTHORITY' as const;
export const SEALED_TRUST_DENY_BEATS_COST =
  'SEALED_OR_TRUST_DENY_BEATS_CHEAPER_FASTER_ROUTE' as const;
export const UNVERIFIED_BI_DENIED =
  'UNVERIFIED_BI_STREAM_ITEM_DENIED_OR_NOT_LABELED_VERIFIED' as const;
export const UNAPPROVED_SYNAPSE_DENIED =
  'SYNAPSE_COMPILE_UNAPPROVED_RELATIONSHIP_DENIED' as const;
export const HANDOFF_NO_AUTHORITY =
  'MULTI_DEVICE_HANDOFF_PRESERVES_CHECKPOINT_NO_AUTHORITY_TRANSFER' as const;
export const OFFLINE_ISLAND_STALE =
  'OFFLINE_ISLAND_FRESHNESS_SENSITIVE_STALE_OR_WAITING_DATA' as const;
export const UNVERIFIED_DEVICE_UNAVAILABLE =
  'UNVERIFIED_DEVICE_RUNTIME_UNAVAILABLE' as const;
export const COST_PROXY_NOT_INVOICE =
  'COST_PROXY_IS_NOT_LIVE_INVOICE' as const;
export const RECOMMENDATION_NOT_CHARGE =
  'RECOMMENDATION_IS_NOT_CHARGE_BUY_OR_DEPLOY' as const;
export const HIDDEN_REASONING_TRACE_REJECTED =
  'HIDDEN_REASONING_TRACE_REJECTED' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export type ConfidenceLabel =
  | 'low'
  | 'medium'
  | 'high'
  | 'unverified'
  | 'evidence_backed';

export type FreshnessLabel = 'fresh' | 'stale' | 'unknown' | 'waiting_data';

export type ByActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'hardware_curator'
  | 'lab_researcher'
  | 'device_runtime_agent'
  | 'economic_scheduler'
  | 'bi_stream_curator'
  | 'synapse_compiler'
  | 'ordinary_agent'
  | 'impersonator';

export type ByActor = {
  kind: ByActorKind;
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
    BX: {
      tipProbe:
        has('62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md') ||
        hasMod('neural-chip-os-semiconductor-twin-types.ts')
          ? has('62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BX Neural Chip OS / Semiconductor Twin tip + report. Poll origin until CLEAR.',
    },
    BW: {
      tipProbe:
        has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md') ||
        hasMod('planetary-chip-founder-avatar-ethics-types.ts')
          ? has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BW Planetary Chip / Founder Avatar / Ethics tip used when BX absent.',
    },
    BV: {
      tipProbe:
        has('62L_BV_SYSTEMS_ARCHITECTURE_BUILD_RUNTIME_REPORT.md') ||
        hasMod('systems-architecture-institute-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BV_SYSTEMS_ARCHITECTURE_BUILD_RUNTIME_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BV Systems Architecture Institute tip if present between BW and BU.',
    },
    BU: {
      tipProbe: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU Code Research / Benchmark / Strategy tip @ 342585a used as scaffold base while BX/BW land.',
    },
    BT: {
      tipProbe: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BT Apprenticeship / Experiment / Evolution Graph ancestor.',
    },
    BS: {
      tipProbe: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BS_ENGINEERING_UNIVERSITY_MEMORY_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BS Engineering University / Memory Cortex ancestor.',
    },
    BP: {
      tipProbe: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BP_COGNITIVE_HOMEOSTASIS_GENOME_RECOVERY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BP Cognitive Homeostasis / Offline island honesty reused conceptually.',
    },
    BJ: {
      tipProbe: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BJ_OFFLINE_INTELLIGENCE_OS_EXEC_CORTEX_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BJ Offline Intelligence OS / Exec Cortex ancestor.',
    },
    BD: {
      tipProbe: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BD_COGNITIVE_MEMORY_CHIP_NEURAL_BUS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BD Cognitive Memory Chip / Neural Bus ancestor.',
    },
    BA: {
      tipProbe: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BA_NEURAL_DATABASE_OS_WAREHOUSE_API_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BA Neural Database OS ancestor.',
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

/**
 * Probe preferred BX / BW modules when present on the tree (after rebase).
 * Presence ≠ production authority.
 */
export function probeBxBwLayers(root = repoRootFromHere()): {
  bx: 'PRESENT' | 'WAITING_DATA';
  bw: 'PRESENT' | 'WAITING_DATA';
  modules: string[];
} {
  const localBrain = join(root, 'services/ai/local-brain');
  const mods = [
    'neural-chip-os-semiconductor-twin-types.ts',
    'neural-chip-hal.ts',
    'semiconductor-digital-twin.ts',
    'planetary-superbrain-routing-cortex.ts',
    'planetary-chip-founder-avatar-ethics-types.ts',
  ];
  const present = mods.filter((m) => existsSync(join(localBrain, m)));
  const bxPresent =
    existsSync(join(localBrain, 'neural-chip-os-semiconductor-twin-types.ts')) ||
    existsSync(join(root, 'docs/operations/62L_BX_NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_REPORT.md'));
  const bwPresent =
    existsSync(join(localBrain, 'planetary-chip-founder-avatar-ethics-types.ts')) ||
    existsSync(join(root, 'docs/operations/62L_BW_PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_REPORT.md'));
  return {
    bx: bxPresent ? 'PRESENT' : 'WAITING_DATA',
    bw: bwPresent ? 'PRESENT' : 'WAITING_DATA',
    modules: present,
  };
}
