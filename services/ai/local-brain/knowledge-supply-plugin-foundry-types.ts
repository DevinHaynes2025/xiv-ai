import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CP — XIV Global Knowledge Supply Chain + Plugin/Tool Foundry +
 * Agent-Built AI Services + Regional Data Refinery Nodes + International
 * Institutional Memory Graph + Multi-Cloud Knowledge Distribution Network.
 *
 * SoT: GitHub #106. GitLab #40 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * Plugin/tool foundry: reuse approved plugins first; new builds sandbox only.
 * Promotion requires unit/integration/security tests, benchmarks, human review.
 * Registration ≠ authority, credentials, billing, deployment, or broader data access.
 * Third-party plugins: manifests, scopes, licensing/terms, health, circuit breakers,
 * SBOMs, secret refs, deny-by-default permissions.
 * Unconfigured/unhealthy → UNAVAILABLE; circuit open on failure.
 * Regional data refinery nodes: authorized only; no arbitrary discovery.
 * Multi-cloud distribution: signed approved packages only; revocable.
 * Institutional memory graph: provenance-aware; facts ≠ sims.
 * Local-first; sealed never silent cloud fallback; Founder-sealed deny-by-default.
 * L4=false. tip-land=NO. No mega-delta swallow.
 */

export const KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE = [
  'honesty_locks',
  'supply_chain_bootstrap',
  'reuse_approved_plugin_preferred',
  'new_plugin_sandbox_until_promotion',
  'registration_no_authority',
  'deny_by_default_missing_scope',
  'unhealthy_plugin_circuit_open',
  'promotion_gates_required',
  'agent_self_assign_unpromoted_denied',
  'refinery_node_authorized_only',
  'unapproved_refinery_composition_denied',
  'institutional_graph_typed',
  'reject_sim_to_fact',
  'distribution_signed_only',
  'unsigned_or_revoked_package_rejected',
  'sealed_no_silent_plugin_cloud',
  'evidence',
  'learning',
] as const;

export type CpHop = (typeof KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_CYCLE)[number];

export type CpEvidenceState =
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
  | 'PROMOTED'
  | 'SIGNED'
  | 'REVOKED'
  | 'CIRCUIT_OPEN'
  | 'REUSED';

export type CpHopRecord = {
  hop: CpHop;
  state: CpEvidenceState;
  summary: string;
  at: string;
};

export const CP_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  REUSE_APPROVED_PLUGINS_FIRST: true as const,
  NEW_BUILDS_SANDBOX_ONLY: true as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  REGISTRATION_GRANTS_CREDENTIALS: false as const,
  REGISTRATION_GRANTS_BILLING: false as const,
  REGISTRATION_GRANTS_DEPLOYMENT: false as const,
  REGISTRATION_GRANTS_BROADER_DATA_ACCESS: false as const,
  DENY_BY_DEFAULT_PERMISSIONS: true as const,
  MISSING_SCOPE_ALLOWED: false as const,
  UNHEALTHY_PLUGIN_AVAILABLE: false as const,
  CIRCUIT_OPENS_ON_FAILURE: true as const,
  PROMOTION_REQUIRES_UNIT_TESTS: true as const,
  PROMOTION_REQUIRES_INTEGRATION_TESTS: true as const,
  PROMOTION_REQUIRES_SECURITY_TESTS: true as const,
  PROMOTION_REQUIRES_BENCHMARKS: true as const,
  PROMOTION_REQUIRES_HUMAN_REVIEW: true as const,
  AGENT_SELF_ASSIGN_UNPROMOTED: false as const,
  ARBITRARY_REFINERY_DISCOVERY: false as const,
  UNAPPROVED_REFINERY_COMPOSITION: false as const,
  DISTRIBUTION_REQUIRES_SIGNATURE: true as const,
  DISTRIBUTION_REVOKABLE: true as const,
  AUTO_TRUST_UNSIGNED_PACKAGES: false as const,
  SEALED_SILENT_PLUGIN_CLOUD_FALLBACK: false as const,
  FACTS_EQ_SIMULATIONS: false as const,
  SIM_PROMOTE_TO_FACT: false as const,
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
  '62L-CQ — XIV Autonomous Tool Ecosystem + Agent Plugin Marketplace + AI Service Composer + Multi-Agent Software Factory + Universal Connector Fabric + Self-Expanding Capability Graph + Distributed Tool Runtime Network' as const;

export const GITHUB_SOT_ISSUE = 106 as const;
export const GITLAB_COORDINATION_ISSUE = 40 as const;

export const REGISTRATION_NO_AUTHORITY =
  'REGISTRATION_DOES_NOT_GRANT_AUTHORITY_CREDENTIALS_BILLING_DEPLOYMENT_OR_BROADER_DATA_ACCESS' as const;
export const MISSING_SCOPE_DENIED =
  'DENY_BY_DEFAULT_MISSING_SCOPE_DENIED' as const;
export const UNHEALTHY_PLUGIN_CIRCUIT_OPEN =
  'UNHEALTHY_OR_UNCONFIGURED_PLUGIN_CIRCUIT_OPEN_UNAVAILABLE' as const;
export const SANDBOX_UNTIL_PROMOTION =
  'NEW_PLUGIN_REMAINS_SANDBOX_UNTIL_PROMOTION_GATES_PASS' as const;
export const PROMOTION_GATES_INCOMPLETE =
  'PROMOTION_REQUIRES_UNIT_INTEGRATION_SECURITY_BENCHMARKS_HUMAN_REVIEW' as const;
export const AGENT_SELF_ASSIGN_DENIED =
  'AGENT_CANNOT_SELF_ASSIGN_UNPROMOTED_PLUGIN_WITH_ELEVATED_PERMISSIONS' as const;
export const REUSE_PREFERRED =
  'REUSE_APPROVED_PLUGIN_PREFERRED_OVER_DUPLICATE_BUILD' as const;
export const UNAPPROVED_REFINERY_DENIED =
  'UNAPPROVED_REFINERY_NODE_COMPOSITION_DENIED' as const;
export const ARBITRARY_REFINERY_DISCOVERY_DENIED =
  'ARBITRARY_REFINERY_NODE_DISCOVERY_DENIED_AUTHORIZED_ONLY' as const;
export const UNSIGNED_OR_REVOKED_PACKAGE_REJECTED =
  'UNSIGNED_OR_REVOKED_DISTRIBUTION_PACKAGE_REJECTED' as const;
export const SEALED_SILENT_PLUGIN_CLOUD_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_VIA_PLUGIN_CLOUD_GATEWAY' as const;
export const SIM_TO_FACT_REJECTED =
  'INSTITUTIONAL_MEMORY_GRAPH_REJECTS_PROMOTING_SIMULATION_TO_FACT' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SOUL_CLAIM_REJECTED =
  'SOUL_RESURRECTION_CLAIM_REJECTED_FOUNDER_SEALED_DENY_BY_DEFAULT' as const;

export const GRAPH_HARD_SEPARATION = 'FACTS_NE_SIMULATIONS_PROVENANCE_AWARE' as const;

export type InstitutionalMemoryKind = 'fact' | 'correlation' | 'hypothesis' | 'simulation';

export type PluginLifecycleState =
  | 'sandbox'
  | 'candidate'
  | 'approved'
  | 'promoted'
  | 'revoked'
  | 'unavailable'
  | 'denied';

export type PluginHealthState =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'unconfigured'
  | 'circuit_open';

export type CpActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'supply_chain_curator'
  | 'foundry_builder'
  | 'plugin_governor'
  | 'refinery_composer'
  | 'memory_curator'
  | 'distribution_operator'
  | 'ordinary_agent'
  | 'impersonator';

export type CpActor = {
  kind: CpActorKind;
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
    CO: {
      tipProbe:
        hasMod('global-knowledge-exchange-os-types.ts') ||
        has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CO_GLOBAL_KNOWLEDGE_EXCHANGE_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'Preferred CO Global Knowledge Exchange OS tip + report. Poll with backoff when WAITING_DATA.',
    },
    CN: {
      tipProbe:
        hasMod('world-knowledge-routing-os-types.ts') ||
        has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CN_WORLD_KNOWLEDGE_ROUTING_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CN World Knowledge Routing OS when CO absent.',
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
      note: 'CM Sovereign Regional Knowledge Clouds when CN/CO absent.',
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
      note:
        'CL Global Knowledge Server Constellation — used as base tip when CO/CN/CM WAITING_DATA.',
    },
    CK: {
      tipProbe:
        hasMod('cognitive-infra-mini-cloud-history-types.ts') ||
        has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CK_COGNITIVE_INFRA_MINI_CLOUD_HISTORY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CK Cognitive Infra / Mini-Cloud / History (parallel tip may exist on origin).',
    },
    CJ: {
      tipProbe:
        hasMod('intelligence-resource-grid-apprenticeship-types.ts') ||
        has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CJ_INTELLIGENCE_RESOURCE_GRID_APPRENTICESHIP_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CJ @ 478feb135420443b647676df81cd42b868f3aad4 lineage when CK absent.',
    },
    CI: {
      tipProbe:
        hasMod('persistent-intelligence-economy-types.ts') ||
        has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CI_PERSISTENT_INTELLIGENCE_ECONOMY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CI Persistent Intelligence Economy (CL ancestor).',
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
      note: 'CH Knowledge Civilization / Dept Universities.',
    },
    CG: {
      tipProbe:
        hasMod('deep-knowledge-refinery-os-types.ts') ||
        has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CG_DEEP_KNOWLEDGE_REFINERY_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CG Deep Knowledge Refinery OS — refinery composition builds on CF/CG.',
    },
    CF: {
      tipProbe:
        hasMod('data-refinery-compression-replication-types.ts') ||
        has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CF_DATA_REFINERY_COMPRESSION_REPLICATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CF Data Refinery / Compression / Replication.',
    },
  };
}
