import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EB — XIV Multi-Model Superbrain Federation + Distributed AI Cloud & GPU
 * Exchange + Quantum Optimization Highway + Civilization/Scientific Memory Cortex +
 * Universal Local AI Node Runtime + Agent Research Society + Spatial/XR Command
 * Universe + Global Search & Knowledge Infrastructure.
 *
 * SoT: GitHub #146. GitLab #80 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EA / DZ when PRESENT.
 * Unconfigured providers UNAVAILABLE (incl. Grok/xAI and other model providers).
 * Correlation ≠ causation; sim/forecast/benchmark ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 * Cloud cost controls: recommend ≠ auto-spend; scheduling ≠ unauthorized charge.
 * Quantum-inspired optimization benchmarking requires classical baselines;
 * no unverified supremacy.
 * Speculative cosmology/ET/metaphysics remain RESEARCH_SIM if soft-wired from EA.
 * No consciousness claims.
 * Learning/skill ≠ permission; self-promotion to prod denied.
 * RUNNING_VERIFIED / offline node / GPU / hardware claims need real evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED; local AI nodes / offline agents honest.
 * Authorized/public/licensed/customer-owned data only.
 * DB candidates NOT_APPLIED.
 * Permission-aware global search: ACL; no cross-context leakage.
 * XR/spatial command ≠ covert capture; biometric defaults OFF.
 * Anti-malware OS soft-wire: no stealth install / unauthorized takeover /
 * permission bypass / silent persistence.
 * Autonomy: no independent freight/PO/contract/spend/prod-change.
 * tip-land=NO.
 */

export const MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE = [
  'honesty_locks',
  'multi_model_superbrain_federation_bootstrap',
  // A — Multi-Model Superbrain Federation
  'multi_model_routing_local_cloud_fallback',
  'unconfigured_provider_unavailable',
  'grok_xai_unconfigured_unavailable',
  // B — Distributed AI Cloud & GPU Exchange
  'vgpu_planning_recommend_neq_auto_spend',
  'cloud_cost_control_no_unauthorized_charge',
  'gpu_running_verified_needs_evidence',
  // C — Quantum Optimization Highway
  'quantum_optimization_requires_classical_baseline',
  'no_unverified_quantum_supremacy',
  'quantum_benchmark_neq_verified_fact',
  // D — Civilization/Scientific Memory Cortex
  'memory_cortex_acl_deny_by_default',
  'speculative_cosmology_quarantined_research_sim',
  'label_alone_neq_memory_access',
  // E — Universal Local AI Node Runtime
  'local_ai_node_running_verified_needs_evidence',
  'offline_agent_waiting_or_stopped',
  'local_node_self_promotion_denied',
  // F — Agent Research Society
  'unauthorized_research_team_denied',
  'research_society_neq_unrestricted_autonomy',
  'agent_research_self_promotion_denied',
  // G — Spatial/XR Command Universe
  'xr_spatial_neq_covert_capture',
  'biometric_defaults_off',
  'spatial_command_governed',
  // H — Global Search & Knowledge Infrastructure
  'permission_aware_search_acl',
  'cross_context_search_leakage_denied',
  'neural_nodes_evidence_gated',
  'stealth_install_denied',
  'ea_dz_soft_wire_probe',
  'digital_twin_neq_founder',
  'evidence',
  'learning',
] as const;

export type EbHop = (typeof MULTI_MODEL_SUPERBRAIN_FEDERATION_CYCLE)[number];

export type EbEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
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
  | 'LABELED_FORECAST'
  | 'LABELED_EXPERIMENT'
  | 'HYPOTHESIZED_PATHWAY'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'CONTRACT_ONLY'
  | 'TEST_ONLY'
  | 'LOGICAL'
  | 'ARCHITECTURE_TARGET'
  | 'CORRELATION_ONLY'
  | 'ADVISORY_ONLY'
  | 'CLASSICAL_BASELINE_REQUIRED'
  | 'PROMOTION_DENIED'
  | 'RESEARCH_SIM'
  | 'SPECULATIVE';

export type EbHopRecord = {
  hop: EbHop;
  state: EbEvidenceState;
  summary: string;
  at: string;
};

export type EbActorKind =
  | 'multi_model_federation_curator'
  | 'gpu_exchange_planner'
  | 'quantum_optimization_operator'
  | 'memory_cortex_steward'
  | 'local_ai_node_operator'
  | 'agent_research_coordinator'
  | 'spatial_xr_commander'
  | 'global_search_curator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EbActor = {
  kind: EbActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 146;
export const GITLAB_COORDINATION_ISSUE = 80;

export const NEXT_PHASE_TITLE =
  '62L-EC — XIV Superbrain Orchestration Kernel + Model/Agent Mission Planner + Federated Compute Scheduler + Knowledge Provenance Engine + Local/Cloud Runtime Supervisor + Research-to-Product Pipeline + Supply Chain Launch Pilot Control Tower + Security/Trust Command Center';

export const EB_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_MULTI_MODEL_SUPERBRAIN_FEDERATION_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  RECOMMENDATION_EQ_AUTO_SPEND: false as const,
  SCHEDULING_EQ_UNAUTHORIZED_CHARGE: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  FABRICATED_PROVIDER_CREDS_ALLOWED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM: false as const,
  QUANTUM_SUPREMACY_WITHOUT_EVIDENCE: false as const,
  CLASSICAL_BASELINE_OPTIONAL: false as const,
  BENCHMARK_EQ_VERIFIED_FACT: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  CROSS_CONTEXT_LEAKAGE_ALLOWED: false as const,
  COVERT_XR_CAPTURE_ALLOWED: false as const,
  BIOMETRIC_DEFAULTS_ON: false as const,
  STEALTH_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_TAKEOVER_ALLOWED: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  RESEARCH_SOCIETY_EQ_UNRESTRICTED_AUTONOMY: false as const,
  LOCAL_NODE_SELF_PROMOTION_ALLOWED: false as const,
  AGENT_RESEARCH_SELF_PROMOTION_ALLOWED: false as const,
  SPECULATIVE_EQ_VERIFIED_FACT: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  FREIGHT_BOOKING_AUTONOMOUS: false as const,
  PO_ISSUANCE_AUTONOMOUS: false as const,
  CONTRACT_SIGNING_AUTONOMOUS: false as const,
  SPEND_MONEY_AUTONOMOUS: false as const,
  PRODUCTION_CHANGE_AUTONOMOUS: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_UNAVAILABLE';
export const GROK_XAI_UNCONFIGURED_UNAVAILABLE =
  'GROK_XAI_UNCONFIGURED_UNAVAILABLE';
export const LOCAL_CLOUD_FALLBACK_ROUTED = 'LOCAL_CLOUD_FALLBACK_ROUTED';
export const VGPU_RECOMMEND_NEQ_AUTO_SPEND =
  'VGPU_PLANNING_RECOMMEND_NEQ_AUTO_SPEND';
export const CLOUD_COST_NO_UNAUTHORIZED_CHARGE =
  'CLOUD_COST_CONTROL_NO_UNAUTHORIZED_CHARGE';
export const GPU_EVIDENCE_REQUIRED =
  'GPU_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const QUANTUM_NEEDS_CLASSICAL =
  'QUANTUM_OPTIMIZATION_REQUIRES_CLASSICAL_BASELINE';
export const NO_UNVERIFIED_SUPREMACY = 'NO_UNVERIFIED_QUANTUM_SUPREMACY';
export const QUANTUM_BENCHMARK_NEQ_FACT =
  'QUANTUM_BENCHMARK_NEQ_VERIFIED_FACT';
export const MEMORY_CORTEX_ACL_DENIED =
  'MEMORY_CORTEX_ACL_DENY_BY_DEFAULT';
export const SPECULATIVE_QUARANTINED =
  'SPECULATIVE_COSMOLOGY_QUARANTINED_RESEARCH_SIM';
export const LABEL_NEQ_MEMORY_ACCESS = 'LABEL_ALONE_NEQ_MEMORY_ACCESS';
export const LOCAL_NODE_EVIDENCE_REQUIRED =
  'LOCAL_AI_NODE_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_AGENT_WAITING_OR_STOPPED';
export const LOCAL_NODE_SELF_PROMOTION_DENIED =
  'LOCAL_NODE_SELF_PROMOTION_DENIED';
export const UNAUTHORIZED_RESEARCH_TEAM =
  'UNAUTHORIZED_RESEARCH_TEAM_DENIED';
export const RESEARCH_NEQ_AUTONOMY =
  'RESEARCH_SOCIETY_NEQ_UNRESTRICTED_AUTONOMY';
export const AGENT_RESEARCH_SELF_PROMOTION_DENIED =
  'AGENT_RESEARCH_SELF_PROMOTION_DENIED';
export const XR_NEQ_COVERT_CAPTURE = 'XR_SPATIAL_NEQ_COVERT_CAPTURE';
export const BIOMETRIC_DEFAULTS_OFF = 'BIOMETRIC_DEFAULTS_OFF';
export const SPATIAL_COMMAND_GOVERNED = 'SPATIAL_COMMAND_GOVERNED';
export const SEARCH_ACL_DENIED = 'PERMISSION_AWARE_SEARCH_ACL_DENIED';
export const SEARCH_CROSS_CONTEXT_DENIED =
  'CROSS_CONTEXT_SEARCH_LEAKAGE_DENIED';
export const NEURAL_NODES_EVIDENCE_GATED = 'NEURAL_NODES_EVIDENCE_GATED';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const MAX_ROUTES = 500;
export const MAX_GPU_PLANS = 500;
export const MAX_QUANTUM_BENCH = 500;
export const MAX_MEMORY_EVENTS = 500;
export const MAX_NODE_PROBES = 500;
export const MAX_RESEARCH_EVENTS = 500;
export const MAX_XR_EVENTS = 500;
export const MAX_SEARCH_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EbActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EbPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EbPredecessorProbe> {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ops = join(root, 'docs/operations');
  const brain = join(root, 'services/ai/local-brain');
  const has = (dir: string, file: string) => existsSync(join(dir, file));
  const hasPrefix = (dir: string, prefix: string) => {
    try {
      return readdirSync(dir).some((f) => f.startsWith(prefix));
    } catch {
      return false;
    }
  };

  return {
    EA: {
      tipProbe:
        has(brain, 'global-operations-intelligence-grid-types.ts') ||
        has(brain, 'global-operations-intelligence-grid.ts') ||
        has(ops, '62L_EA_GLOBAL_OPERATIONS_INTELLIGENCE_GRID_REPORT.md') ||
        hasPrefix(ops, '62L_EA_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EA_GLOBAL_OPERATIONS_INTELLIGENCE_GRID_REPORT.md') ||
        hasPrefix(ops, '62L_EA_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred EA Global Operations Intelligence Grid tip + report.',
    },
    DZ: {
      tipProbe:
        has(brain, 'supply-chain-intelligence-fabric-types.ts') ||
        has(brain, 'supply-chain-intelligence-fabric.ts') ||
        has(ops, '62L_DZ_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_DZ_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DZ_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_REPORT.md') ||
        hasPrefix(ops, '62L_DZ_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DZ Supply Chain Intelligence Fabric fallback when EA absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'EA' | 'DZ' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['EA', 'DZ'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  multiModelLocalFirstFallback: true,
  unconfiguredProvidersUnavailable: true,
  recommendNeqAutoSpend: true,
  classicalBaselineRequiredForQuantumOptimization: true,
  speculativeQuarantinedResearchSim: true,
  localAiNodesEvidenceGated: true,
  offlineAgentsHonestWaitingOrStopped: true,
  governedAgentResearchSociety: true,
  xrSpatialNeqCovertCapture: true,
  biometricDefaultsOff: true,
  permissionAwareGlobalSearchAcl: true,
  noCrossContextSearchLeakage: true,
  antiMalwareNoStealthInstall: true,
  denyByDefaultFounderSealed: true,
  learningLoopBounded: true,
  digitalTwinNeqFounder: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  classicalBaselineRequired: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noUnverifiedSupremacyClaims: true,
  correlationNeqCausation: true,
  noSelfPromotionToProduction: true,
  simForecastBenchmarkNeqVerifiedFact: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'route_configured_models',
    'plan_vgpu_without_spend',
    'coordinate_approved_research',
  ] as const,
  denied: [
    'book_freight',
    'issue_purchase_order',
    'sign_contract',
    'spend_money',
    'change_production_system',
    'auto_spend_cloud',
    'unauthorized_charge',
    'stealth_install',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
