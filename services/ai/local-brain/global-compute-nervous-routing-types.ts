import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-BZ — Global Compute Nervous System + Chip Design Knowledge Foundry +
 * Distributed Memory/Cache Intelligence + Universal AI Device Federation +
 * Business Signal Exchange + Superbrain Cognitive Routing Optimizer.
 *
 * SoT: GitHub #90. GitLab #24 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Unconfigured nodes/devices/providers = UNAVAILABLE.
 * Cannot expand its own permissions (hard deny).
 * Placement firewalls + failover = plans/recommendations; not silent production infra mutation.
 * Device federation: authorized only; revocation/quarantine enforced.
 * Business-signal exchange: derived/authorized signals; contradiction handling;
 * no default raw private pooling (reuse BM-style derived-only defaults).
 * Cost/consequence weights ≠ purchasing/billing authority.
 * Cache coherence / route recompilation on change — trust/policy still beat speed.
 * Chip-design foundry = knowledge/sandbox candidates; ≠ fab production authority.
 * Founder-sealed deny-by-default; learning ≠ permission. L4=false.
 */

export const GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE = [
  'honesty_locks',
  'node_topology_authorize',
  'unconfigured_node_unavailable',
  'compute_health_observe',
  'placement_firewall_evaluate',
  'failover_plan_recommend',
  'chip_foundry_capture_candidate',
  'chip_foundry_not_fab_authority',
  'cache_coherence_contract',
  'stale_cache_not_fresh_verified',
  'invalidation_on_change',
  'device_federation_enroll',
  'revocation_quarantine_enforce',
  'business_signal_derived_only',
  'contradiction_surface',
  'route_optimize_sparse',
  'sealed_trust_beats_speed',
  'route_recompile_on_change',
  'optimizer_no_purchase_bill',
  'self_permission_expansion_denied',
  'evidence',
  'learning',
] as const;

export type BzHop = (typeof GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE)[number];

export type BzEvidenceState =
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
  | 'CONTRADICTION'
  | 'QUARANTINED'
  | 'REVOKED'
  | 'ATTRIBUTION_UNSAFE'
  | 'NOT_APPLIED'
  | 'BOUNDED'
  | 'SPARSE';

export type BzHopRecord = {
  hop: BzHop;
  state: BzEvidenceState;
  summary: string;
  at: string;
};

export const BZ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  AUTO_PRODUCTION_DEPLOY: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  SELF_PERMISSION_EXPANSION: false as const,
  SILENT_PRODUCTION_INFRA_MUTATION: false as const,
  PLACEMENT_FAILOVER_IS_MUTATION: false as const,
  UNCONFIGURED_NODE_AVAILABLE: false as const,
  UNCONFIGURED_DEVICE_AVAILABLE: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  REVOKED_DEVICE_RECEIVES_WORK: false as const,
  QUARANTINED_DEVICE_RECEIVES_WORK: false as const,
  STALE_CACHE_LABELED_FRESH_VERIFIED: false as const,
  RAW_PRIVATE_SIGNAL_POOL_DEFAULT: false as const,
  CONTRADICTION_SILENT_PICK: false as const,
  SPEED_OVERRIDES_SEALED_TRUST: false as const,
  COST_WEIGHT_IS_PURCHASE_AUTHORITY: false as const,
  CONSEQUENCE_WEIGHT_IS_BILLING_AUTHORITY: false as const,
  OPTIMIZER_PURCHASE_BILL_CHARGE: false as const,
  CHIP_FOUNDRY_IS_FAB_PRODUCTION: false as const,
  LEARNING_IS_PERMISSION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  PLACEMENT_FAILOVER_PLAN_ONLY: true as const,
  DEVICE_AUTHORIZED_ONLY: true as const,
  REVOCATION_QUARANTINE_ENFORCED: true as const,
  DERIVED_AUTHORIZED_SIGNALS_ONLY: true as const,
  CONTRADICTION_SURFACED: true as const,
  TRUST_POLICY_BEATS_SPEED: true as const,
  CACHE_COHERENCE_REQUIRED: true as const,
  ROUTE_RECOMPILE_ON_CHANGE: true as const,
  CHIP_FOUNDRY_SANDBOX_CANDIDATES: true as const,
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
  '62L-CA — Distributed Intelligence Metabolism + Universal Memory Hierarchy Compiler + Semiconductor Research Civilization + Agent Compute Market Simulator + Cross-Device Knowledge Circulation + Superbrain Resource Homeostasis Engine' as const;

export const GITHUB_SOT_ISSUE = 90 as const;
export const GITLAB_COORDINATION_ISSUE = 24 as const;

export const UNCONFIGURED_NODE_UNAVAILABLE =
  'UNCONFIGURED_COMPUTE_NODE_UNAVAILABLE' as const;
export const PLACEMENT_FIREWALL_BLOCKED =
  'PLACEMENT_FIREWALL_BLOCKED_DISALLOWED_CLOUD_OR_SEALED_ROUTE' as const;
export const SELF_PERMISSION_EXPANSION_DENIED =
  'SELF_PERMISSION_EXPANSION_HARD_DENIED' as const;
export const REVOKED_DEVICE_DENIED =
  'REVOKED_OR_QUARANTINED_DEVICE_CANNOT_RECEIVE_WORK' as const;
export const STALE_CACHE_NOT_FRESH =
  'STALE_CACHE_NOT_TREATED_AS_FRESH_VERIFIED' as const;
export const CONTRADICTION_SURFACED =
  'CONTRADICTORY_BUSINESS_SIGNALS_SURFACED_NOT_SILENTLY_PICKED' as const;
export const RAW_PRIVATE_SIGNAL_DENIED =
  'RAW_PRIVATE_BUSINESS_SIGNAL_POOLING_DENIED_DERIVED_ONLY' as const;
export const SEALED_TRUST_BEATS_SPEED =
  'LOW_TRUST_FASTER_ROUTE_LOSES_TO_SEALED_POLICY' as const;
export const OPTIMIZER_NO_PURCHASE =
  'ROUTING_OPTIMIZER_NO_PURCHASE_BILL_CHARGE_AUTHORITY' as const;
export const CHIP_FOUNDRY_NOT_FAB =
  'CHIP_DESIGN_FOUNDRY_OUTPUT_SANDBOXED_NOT_FAB_PRODUCTION_AUTHORIZED' as const;
export const FAILOVER_PLAN_ONLY =
  'FAILOVER_AND_PLACEMENT_ARE_PLANS_RECOMMENDATIONS_NOT_INFRA_MUTATION' as const;
export const ROUTE_RECOMPILED =
  'ROUTE_RECOMPILED_ON_HARDWARE_DEVICE_SOURCE_OR_CACHE_CHANGE' as const;

export const FORBIDDEN_PRIVATE_FIELDS = Object.freeze([
  'hidden_reasoning_trace',
  'private_chain_of_thought',
  'private_cot',
  'hidden_cot',
  'secret_reasoning',
  'internal_monologue',
] as const);

export const APPROVED_SIGNAL_KINDS = [
  'derived_signal',
  'authorized_benchmark',
  'aggregate_metric',
  'lesson',
  'anomaly_label',
  'forecast_label',
] as const;

export type ApprovedSignalKind = (typeof APPROVED_SIGNAL_KINDS)[number];

export type BzActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'compute_nervous_agent'
  | 'chip_foundry_curator'
  | 'cache_intelligence_agent'
  | 'device_federation_agent'
  | 'business_signal_broker'
  | 'cognitive_routing_optimizer'
  | 'ordinary_agent'
  | 'impersonator';

export type BzActor = {
  kind: BzActorKind;
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
    BY: {
      tipProbe:
        has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md') ||
        hasMod('hardware-cortex-synapse-compiler-types.ts')
          ? has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md')
            ? 'PRESENT'
            : 'WAITING_DATA'
          : 'WAITING_DATA',
      report: has('62L_BY_HARDWARE_CORTEX_SYNAPSE_COMPILER_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'Preferred BY Hardware Cortex / Synapse Compiler tip + report. Rebase when PRESENT on origin.',
    },
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
      note: 'BX Neural Chip OS / Semiconductor Twin preferred after BY; used when BY absent.',
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
      note: 'BW Planetary Chip / Founder Avatar / Ethics when BY/BX absent.',
    },
    BU: {
      tipProbe: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BU_CODE_RESEARCH_BENCHMARK_STRATEGY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BU Code Research / Benchmark / Strategy tip @ 342585a used when BY→BX→BW WAITING_DATA.',
    },
    BT: {
      tipProbe: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BT_APPRENTICESHIP_EXPERIMENT_EVOLUTION_GRAPH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BT ancestor of BU base.',
    },
    BM: {
      tipProbe:
        has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md') ||
        hasMod('org-neural-federation-types.ts')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_BM_ORG_NEURAL_FEDERATION_BI_NERVOUS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BM derived-only business-signal defaults reused conceptually.',
    },
    BL: {
      tipProbe: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'WAITING_DATA',
      report: has('62L_BL_ORG_AGENT_UNIVERSES_TRUST_FABRIC_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'BL trust fabric ancestor.',
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
