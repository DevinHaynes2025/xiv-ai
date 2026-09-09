import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EG — XIV Cognitive Operations Backbone + Moore's Law & Semiconductor
 * History Cortex + Nano-Agent Simulation Fabric + Hospital/Enterprise
 * Operations Grid + Marketing Intelligence Team + Federated Database Bundles +
 * Multi-Universe Simulation Network + Energy-Aware Edge/Cloud Runtime.
 *
 * SoT: GitHub #151. GitLab #84 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EF → EE → ED when PRESENT (EF preferred; else EE; else ED).
 * Unconfigured providers UNAVAILABLE.
 * Correlation ≠ causation; sim/forecast/trend ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 *
 * Architecture translations (hard):
 * - “Atom-sized trillions of agents” → highly compressed logical micro-agents
 *   and synthetic populations — NOT physical atom-scale agents or claimed
 *   hardware that does not exist.
 * - “Wormholes” → low-latency routing / cache / index shortcuts — NOT literal
 *   spacetime wormholes.
 * - “Parallel universes” → isolated simulation branches — NOT literal alternate
 *   realities.
 *
 * Moore’s Law / semiconductor history / compute economics = historical +
 * analytical; trends ≠ guaranteed future; authorized sources only.
 * GPU/chip quantitative analysis = advisory; ≠ fab remote control.
 * Quantum-inspired optimization needs classical baselines; no unverified supremacy.
 * Energy-aware scheduling recommend ≠ unauthorized power control of third-party infra.
 * Hospital/enterprise operations grid = planning/intelligence with human gates —
 * ≠ unauthorized clinical/physical control; not medical advice authority.
 * Lean management / marketing intelligence: recommend ≠ auto-campaign spend/publish;
 * marketing ≠ deceptive claims.
 * Federated database bundles / lakehouses: candidates NOT_APPLIED;
 * genome ≠ proprietary copy if soft-wired.
 * Scale targets ≠ current ownership claims.
 * Learning/skill ≠ permission; self-promotion denied.
 * RUNNING_VERIFIED / offline / hardware claims need evidence;
 * offline WAITING_NODE / OFFLINE_STOPPED.
 * Autonomy: no independent freight/PO/contract/spend/prod-change.
 * Anti-malware OS soft-wire preserved if present.
 * tip-land=NO.
 */

export const COGNITIVE_OPERATIONS_BACKBONE_CYCLE = [
  'honesty_locks',
  'cognitive_operations_backbone_bootstrap',
  // A — Cognitive Operations Backbone
  'governed_ops_backbone_deny_by_default',
  'consequential_ops_gated',
  'label_alone_neq_access',
  // B — Moore's Law & Semiconductor History Cortex
  'semiconductor_history_authorized_sources',
  'trend_neq_guaranteed_future',
  'compute_economics_analytical_only',
  // C — Nano-Agent Simulation Fabric
  'compressed_logical_micro_agents_only',
  'synthetic_population_neq_physical_atom_agents',
  'nano_agent_scale_target_neq_ownership',
  // D — Hospital/Enterprise Operations Grid
  'hospital_enterprise_planning_human_gates',
  'neq_clinical_authority',
  'neq_physical_control',
  // E — Marketing Intelligence Team
  'marketing_recommend_neq_spend',
  'marketing_recommend_neq_publish',
  'marketing_neq_deceptive_claims',
  // F — Federated Database Bundles
  'federated_bundle_candidates_not_applied',
  'lakehouse_candidate_not_applied',
  'genome_neq_proprietary_copy',
  // G — Multi-Universe Simulation Network
  'isolated_sim_branches_neq_literal_universes',
  'wormhole_eq_routing_cache_index_shortcut',
  'sim_neq_verified_fact',
  // H — Energy-Aware Edge/Cloud Runtime
  'energy_schedule_recommend_neq_power_control',
  'gpu_chip_quant_advisory_neq_fab_control',
  'quantum_inspired_classical_baseline',
  'offline_waiting_or_stopped',
  'ef_ee_ed_soft_wire_probe',
  'stealth_install_denied',
  'digital_twin_neq_founder',
  'autonomy_boundary_no_freight_po_spend',
  'evidence',
  'learning',
] as const;

export type EgHop = (typeof COGNITIVE_OPERATIONS_BACKBONE_CYCLE)[number];

export type EgEvidenceState =
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
  | 'LABELED_TREND'
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
  | 'SPECULATIVE'
  | 'DEFENSIVE_ONLY'
  | 'SCALE_TARGET_ONLY'
  | 'HISTORICAL_ANALYTICAL'
  | 'SYNTHETIC_POPULATION'
  | 'ROUTING_SHORTCUT'
  | 'ISOLATED_SIM_BRANCH';

export type EgHopRecord = {
  hop: EgHop;
  state: EgEvidenceState;
  summary: string;
  at: string;
};

export type EgActorKind =
  | 'cognitive_ops_curator'
  | 'semiconductor_history_steward'
  | 'nano_agent_fabric_operator'
  | 'hospital_enterprise_ops_planner'
  | 'marketing_intelligence_analyst'
  | 'federated_db_bundle_curator'
  | 'multi_universe_sim_operator'
  | 'energy_aware_runtime_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EgActor = {
  kind: EgActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 151;
export const GITLAB_COORDINATION_ISSUE = 84;

export const NEXT_PHASE_TITLE =
  '62L-EH — XIV Semiconductor Intelligence Superhighway + Massive Agent Simulation Engine + Compute Economics Optimizer + Universal Organization Digital Twin OS + Lean AI Workforce Factory + Marketing/Sales Growth Cortex + Hierarchical Database Universe + Energy-Efficient Global Runtime Grid';

/** Hard architecture translations — encode + test. */
export const ARCHITECTURE_TRANSLATIONS = Object.freeze({
  atomSizedTrillionsOfAgentsMeans:
    'highly_compressed_logical_micro_agents_and_synthetic_populations' as const,
  atomSizedTrillionsOfAgentsDoesNotMean:
    'physical_atom_scale_agents_or_nonexistent_hardware' as const,
  wormholesMeans:
    'low_latency_routing_cache_index_shortcuts' as const,
  wormholesDoesNotMean: 'literal_spacetime_wormholes' as const,
  parallelUniversesMeans: 'isolated_simulation_branches' as const,
  parallelUniversesDoesNotMean: 'literal_alternate_realities' as const,
});

export const EG_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_COGNITIVE_OPS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  FABRICATED_PROVIDER_CREDS_ALLOWED: false as const,
  MISSING_EVIDENCE_EQ_VERIFIED: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  TREND_EQ_GUARANTEED_FUTURE: false as const,
  PROTOTYPE_EQ_INVENTION: false as const,
  PHYSICAL_ATOM_AGENTS_CLAIMED: false as const,
  WORMHOLE_EQ_SPACETIME: false as const,
  UNIVERSE_EQ_LITERAL_REALITY: false as const,
  CLINICAL_AUTHORITY_CLAIMED: false as const,
  HOSPITAL_PHYSICAL_CONTROL_ALLOWED: false as const,
  MEDICAL_ADVICE_AUTHORITY: false as const,
  MARKETING_AUTO_SPEND_ALLOWED: false as const,
  MARKETING_AUTO_PUBLISH_ALLOWED: false as const,
  MARKETING_DECEPTIVE_CLAIMS_ALLOWED: false as const,
  ENERGY_EQ_UNAUTHORIZED_POWER_CONTROL: false as const,
  GPU_CHIP_ANALYSIS_EQ_FAB_CONTROL: false as const,
  QUANTUM_SUPREMACY_UNVERIFIED_ALLOWED: false as const,
  PROPRIETARY_DB_COPY_ALLOWED: false as const,
  SCALE_TARGET_EQ_OWNERSHIP: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  OFFENSIVE_EXPLOIT_TOOLING_ALLOWED: false as const,
  STEALTH_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_TAKEOVER_ALLOWED: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  SELF_PROMOTION_TO_PROD_ALLOWED: false as const,
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

export const GOVERNED_OPS_DENY_BY_DEFAULT = 'GOVERNED_OPS_BACKBONE_DENY_BY_DEFAULT';
export const CONSEQUENTIAL_OPS_GATED = 'CONSEQUENTIAL_OPS_GATED_DENIED';
export const LABEL_ALONE_NEQ_ACCESS = 'LABEL_ALONE_NEQ_ACCESS';
export const SEMICONDUCTOR_AUTHORIZED_SOURCES =
  'SEMICONDUCTOR_HISTORY_AUTHORIZED_SOURCES_ONLY';
export const TREND_NEQ_GUARANTEED_FUTURE = 'TREND_NEQ_GUARANTEED_FUTURE';
export const COMPUTE_ECONOMICS_ANALYTICAL =
  'COMPUTE_ECONOMICS_ANALYTICAL_ONLY';
export const COMPRESSED_LOGICAL_MICRO_AGENTS =
  'COMPRESSED_LOGICAL_MICRO_AGENTS_ONLY';
export const SYNTHETIC_NEQ_PHYSICAL_ATOM =
  'SYNTHETIC_POPULATION_NEQ_PHYSICAL_ATOM_AGENTS';
export const NANO_SCALE_TARGET_NEQ_OWNERSHIP =
  'NANO_AGENT_SCALE_TARGET_NEQ_OWNERSHIP';
export const HOSPITAL_PLANNING_HUMAN_GATES =
  'HOSPITAL_ENTERPRISE_PLANNING_HUMAN_GATES';
export const NEQ_CLINICAL_AUTHORITY = 'NEQ_CLINICAL_AUTHORITY';
export const NEQ_PHYSICAL_CONTROL = 'NEQ_PHYSICAL_CONTROL';
export const MARKETING_NEQ_SPEND = 'MARKETING_RECOMMEND_NEQ_SPEND';
export const MARKETING_NEQ_PUBLISH = 'MARKETING_RECOMMEND_NEQ_PUBLISH';
export const MARKETING_NEQ_DECEPTIVE = 'MARKETING_NEQ_DECEPTIVE_CLAIMS';
export const FEDERATED_BUNDLE_NOT_APPLIED =
  'FEDERATED_BUNDLE_CANDIDATES_NOT_APPLIED';
export const LAKEHOUSE_NOT_APPLIED = 'LAKEHOUSE_CANDIDATE_NOT_APPLIED';
export const GENOME_NEQ_PROPRIETARY = 'GENOME_NEQ_PROPRIETARY_COPY';
export const ISOLATED_SIM_NEQ_LITERAL =
  'ISOLATED_SIM_BRANCHES_NEQ_LITERAL_UNIVERSES';
export const WORMHOLE_EQ_ROUTING_SHORTCUT =
  'WORMHOLE_EQ_ROUTING_CACHE_INDEX_SHORTCUT';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const ENERGY_NEQ_POWER_CONTROL =
  'ENERGY_SCHEDULE_RECOMMEND_NEQ_POWER_CONTROL';
export const GPU_CHIP_NEQ_FAB = 'GPU_CHIP_QUANT_ADVISORY_NEQ_FAB_CONTROL';
export const CLASSICAL_BASELINE_REQUIRED =
  'QUANTUM_INSPIRED_CLASSICAL_BASELINE_REQUIRED';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WAITING_NODE_OR_OFFLINE_STOPPED';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const AUTONOMY_BOUNDARY_DENIED =
  'AUTONOMY_BOUNDARY_NO_FREIGHT_PO_SPEND';

export const MAX_OPS_EVENTS = 500;
export const MAX_HISTORY_EVENTS = 500;
export const MAX_NANO_FABRIC = 500;
export const MAX_HOSPITAL_OPS = 500;
export const MAX_MARKETING = 500;
export const MAX_DB_BUNDLES = 500;
export const MAX_SIM_NETWORK = 500;
export const MAX_ENERGY_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EgActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EgPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EgPredecessorProbe> {
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
    EF: {
      tipProbe:
        has(brain, 'neural-data-highway-types.ts') ||
        has(brain, 'neural-data-highway.ts') ||
        has(ops, '62L_EF_NEURAL_DATA_HIGHWAY_REPORT.md') ||
        hasPrefix(ops, '62L_EF_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EF_NEURAL_DATA_HIGHWAY_REPORT.md') ||
        hasPrefix(ops, '62L_EF_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred EF Neural Data Highway tip + report (may be absent if founder jumped to EG).',
    },
    EE: {
      tipProbe:
        has(brain, 'data-nervous-system-types.ts') ||
        has(brain, 'data-nervous-system.ts') ||
        has(ops, '62L_EE_DATA_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EE_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EE_DATA_NERVOUS_SYSTEM_REPORT.md') ||
        hasPrefix(ops, '62L_EE_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'EE Data Nervous System fallback when EF absent.',
    },
    ED: {
      tipProbe:
        has(brain, 'data-galaxy-industry-memory-os-types.ts') ||
        has(brain, 'data-galaxy-industry-memory-os.ts') ||
        has(ops, '62L_ED_DATA_GALAXY_INDUSTRY_MEMORY_OS_REPORT.md') ||
        hasPrefix(ops, '62L_ED_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_ED_DATA_GALAXY_INDUSTRY_MEMORY_OS_REPORT.md') ||
        hasPrefix(ops, '62L_ED_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'ED Data Galaxy & Industry Memory OS fallback when EF+EE absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'EF' | 'EE' | 'ED' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['EF', 'EE', 'ED'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  governedOpsDenyByDefault: true,
  consequentialOpsGated: true,
  labelAloneNeqAccess: true,
  semiconductorHistoryAuthorizedSourcesOnly: true,
  trendNeqGuaranteedFuture: true,
  computeEconomicsAnalyticalOnly: true,
  compressedLogicalMicroAgentsOnly: true,
  syntheticPopulationNeqPhysicalAtomAgents: true,
  nanoScaleTargetNeqOwnership: true,
  hospitalEnterprisePlanningHumanGates: true,
  neqClinicalAuthority: true,
  neqPhysicalControl: true,
  marketingRecommendNeqSpendPublish: true,
  marketingNeqDeceptiveClaims: true,
  federatedBundlesNotApplied: true,
  genomeNeqProprietaryCopy: true,
  isolatedSimBranchesNeqLiteralUniverses: true,
  wormholeEqRoutingCacheIndexShortcut: true,
  simNeqVerifiedFact: true,
  energyScheduleRecommendNeqPowerControl: true,
  gpuChipQuantAdvisoryNeqFabControl: true,
  quantumInspiredClassicalBaselineRequired: true,
  offlineHonestWaitingOrStopped: true,
  antiMalwareNoStealthInstall: true,
  denyByDefaultFounderSealed: true,
  digitalTwinNeqFounder: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  correlationNeqCausation: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noSelfPromotionToProduction: true,
  simForecastTrendNeqVerifiedFact: true,
  trendNeqGuaranteedFuture: true,
  classicalBaselineWhenQuantumInspired: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'label_provenance',
    'advise_semiconductor_history',
    'run_compressed_micro_agent_sim',
    'plan_hospital_enterprise_ops',
    'advise_marketing_intelligence',
    'propose_federated_db_candidates',
    'run_isolated_sim_branches',
    'advise_energy_aware_schedule',
  ] as const,
  denied: [
    'book_freight',
    'issue_purchase_order',
    'sign_contract',
    'spend_money',
    'change_production_system',
    'auto_campaign_spend',
    'auto_publish_marketing',
    'clinical_control',
    'physical_hospital_control',
    'unauthorized_power_control',
    'fab_remote_control',
    'claim_physical_atom_agents',
    'claim_literal_wormholes',
    'claim_literal_universes',
    'apply_live_db_migration',
    'stealth_install',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
