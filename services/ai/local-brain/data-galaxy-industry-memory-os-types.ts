import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-ED — XIV Data Galaxy & Industry Memory OS + Federated Database Genome +
 * Lean Supply Chain Intelligence Factory + Enterprise Connector Federation +
 * Simulation Universes + Edge/Cloud AI Runtime + Personal/Business Knowledge
 * Control Tower.
 *
 * SoT: GitHub #148. GitLab #81 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire EC / EB / EA when PRESENT (EC preferred; EB used when EC absent).
 * Unconfigured providers/connectors UNAVAILABLE.
 * Correlation ≠ causation; sim/forecast ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 * Scale honesty (hard): “trillions” = future scale target, NOT current ownership
 * or ingested volume. Scale-target labels ≠ owned/verified corpus claims.
 * Digital genome / Federated Database Genome (hard): original XIV schemas +
 * lawful patterns only — NOT copied proprietary databases or source (incl. Oracle).
 * “Oracle-compatible” = authorized adapter/interface contracts only.
 * Million-scale synthetic supply-chain task generation = SYNTHETIC under governance.
 * Simulation Universes = isolated workspace/sim branches — not literal realities.
 * Lean/Six Sigma / Kaizen = advisory experiments; experiment ≠ production change.
 * Agriculture/retail/semiconductor twins = sim/advisory; ≠ physical control.
 * Historical market research = authorized/public/licensed sources only.
 * No consciousness claims.
 * Learning/skill ≠ permission; self-promotion to prod denied.
 * RUNNING_VERIFIED / offline / hardware claims need evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED.
 * DB candidates NOT_APPLIED; lakehouse/microdatabase candidates ≠ live migration.
 * Autonomy: no independent freight/PO/contract/spend/prod-change.
 * Anti-malware OS soft-wire: no stealth install / takeover / bypass / silent persistence.
 * Knowledge Control Tower: personal↔business firewall; ACL; sealed deny cross-context.
 * tip-land=NO.
 */

export const DATA_GALAXY_INDUSTRY_MEMORY_OS_CYCLE = [
  'honesty_locks',
  'data_galaxy_industry_memory_os_bootstrap',
  // A — Data Galaxy & Industry Memory OS
  'microdatabase_visual_navigation',
  'provenance_highway_labeled',
  'scale_target_neq_owned_corpus',
  'historical_industry_memory_acl',
  // B — Federated Database Genome
  'genome_original_xiv_schemas_only',
  'proprietary_db_copy_denied',
  'oracle_compatible_contract_only',
  // C — Lean Supply Chain Intelligence Factory
  'lean_six_sigma_advisory_only',
  'kaizen_experiment_neq_production_change',
  'synthetic_task_generation_labeled',
  'million_scale_synthetic_neq_customer_ownership',
  // D — Enterprise Connector Federation
  'authorized_connector_registered',
  'unconfigured_connector_unavailable',
  // E — Simulation Universes
  'sim_universe_isolated_workspace',
  'sim_neq_verified_fact',
  'industry_twin_neq_physical_control',
  'historical_market_research_authorized_sources',
  // F — Edge/Cloud AI Runtime
  'edge_cloud_workload_routing',
  'offline_agent_waiting_or_stopped',
  'runtime_evidence_gate',
  // G — Personal/Business Knowledge Control Tower
  'knowledge_tower_acl_deny',
  'personal_business_firewall',
  'cross_context_sealed_deny',
  // H — Soft-wire + promotion/evidence
  'ec_eb_ea_soft_wire_probe',
  'neural_nodes_evidence_gated',
  'self_promotion_denied',
  'stealth_install_denied',
  'digital_twin_neq_founder',
  'autonomy_boundary_no_freight_po_spend',
  'evidence',
  'learning',
] as const;

export type EdHop = (typeof DATA_GALAXY_INDUSTRY_MEMORY_OS_CYCLE)[number];

export type EdEvidenceState =
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
  | 'LABELED_SYNTHETIC'
  | 'SCALE_TARGET_ONLY'
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
  | 'PROMOTION_DENIED'
  | 'RESEARCH_SIM'
  | 'SPECULATIVE'
  | 'ORIGINAL_XIV_SCHEMA'
  | 'LAWFUL_PATTERN'
  | 'ORACLE_COMPATIBLE_CONTRACT';

export type EdHopRecord = {
  hop: EdHop;
  state: EdEvidenceState;
  summary: string;
  at: string;
};

export type EdActorKind =
  | 'data_galaxy_curator'
  | 'genome_steward'
  | 'lean_factory_operator'
  | 'connector_federation_admin'
  | 'simulation_universe_operator'
  | 'edge_cloud_runtime_operator'
  | 'knowledge_control_tower_steward'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EdActor = {
  kind: EdActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 148;
export const GITLAB_COORDINATION_ISSUE = 81;

export const NEXT_PHASE_TITLE =
  '62L-EE — XIV Data Nervous System + Autonomous Database Operations Brain + Historical Supply Chain Learning Cortex + Lean Enterprise Optimization Engine + Universal Industry Digital Twin Factory + Agent Knowledge Production Line + Edge/Cloud Continuity Grid + Launch Data Reliability Command Center';

export const ED_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_DATA_GALAXY_INDUSTRY_MEMORY_OS_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  UNCONFIGURED_CONNECTOR_EQ_AVAILABLE: false as const,
  TRILLIONS_EQ_CURRENT_OWNED_CORPUS: false as const,
  SCALE_TARGET_EQ_OWNED_VERIFIED_CORPUS: false as const,
  PROPRIETARY_DB_COPY_ALLOWED: false as const,
  ORACLE_REVERSE_COPY_ALLOWED: false as const,
  ORACLE_COMPATIBLE_EQ_PROPRIETARY_COPY: false as const,
  GENOME_EQ_COPIED_PROPRIETARY_SOURCE: false as const,
  SYNTHETIC_EQ_REAL_CUSTOMER_OWNERSHIP: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  SIM_UNIVERSE_EQ_LITERAL_REALITY: false as const,
  INDUSTRY_TWIN_EQ_PHYSICAL_CONTROL: false as const,
  KAIZEN_EXPERIMENT_EQ_PRODUCTION_CHANGE: false as const,
  LEAN_ADVISORY_EQ_AUTO_PROD_CHANGE: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  CROSS_CONTEXT_LEAKAGE_ALLOWED: false as const,
  STEALTH_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_TAKEOVER_ALLOWED: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  SELF_PROMOTION_ALLOWED: false as const,
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

export const SCALE_TARGET_NEQ_OWNED_CORPUS =
  'SCALE_TARGET_NEQ_OWNED_VERIFIED_CORPUS';
export const TRILLIONS_SCALE_TARGET_ONLY = 'TRILLIONS_SCALE_TARGET_ONLY';
export const MICRODB_NAV_OK = 'MICRODATABASE_VISUAL_NAVIGATION_OK';
export const PROVENANCE_HIGHWAY_LABELED = 'PROVENANCE_HIGHWAY_LABELED';
export const HISTORICAL_MEMORY_ACL_DENIED =
  'HISTORICAL_INDUSTRY_MEMORY_ACL_DENIED';
export const GENOME_ORIGINAL_XIV_ONLY = 'GENOME_ORIGINAL_XIV_SCHEMAS_ONLY';
export const PROPRIETARY_DB_COPY_DENIED = 'PROPRIETARY_DB_COPY_DENIED';
export const ORACLE_COMPATIBLE_CONTRACT_ONLY =
  'ORACLE_COMPATIBLE_CONNECTOR_CONTRACT_ONLY';
export const LEAN_ADVISORY_ONLY = 'LEAN_SIX_SIGMA_ADVISORY_ONLY';
export const KAIZEN_NEQ_PROD_CHANGE =
  'KAIZEN_EXPERIMENT_NEQ_PRODUCTION_CHANGE';
export const SYNTHETIC_TASK_LABELED = 'SYNTHETIC_TASK_GENERATION_LABELED';
export const MILLION_SYNTHETIC_NEQ_CUSTOMER =
  'MILLION_SCALE_SYNTHETIC_NEQ_CUSTOMER_OWNERSHIP';
export const CONNECTOR_REGISTERED = 'AUTHORIZED_CONNECTOR_REGISTERED';
export const UNCONFIGURED_CONNECTOR_UNAVAILABLE =
  'UNCONFIGURED_CONNECTOR_UNAVAILABLE';
export const SIM_UNIVERSE_ISOLATED = 'SIM_UNIVERSE_ISOLATED_WORKSPACE';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const TWIN_NEQ_PHYSICAL_CONTROL =
  'INDUSTRY_TWIN_NEQ_PHYSICAL_CONTROL';
export const HISTORICAL_RESEARCH_AUTHORIZED =
  'HISTORICAL_MARKET_RESEARCH_AUTHORIZED_SOURCES';
export const EDGE_CLOUD_ROUTED = 'EDGE_CLOUD_WORKLOAD_ROUTED';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_AGENT_WAITING_OR_STOPPED';
export const RUNTIME_EVIDENCE_REQUIRED = 'RUNTIME_EVIDENCE_GATE_REQUIRED';
export const KNOWLEDGE_TOWER_ACL_DENIED = 'KNOWLEDGE_TOWER_ACL_DENIED';
export const PERSONAL_BUSINESS_FIREWALL =
  'PERSONAL_BUSINESS_FIREWALL_ENFORCED';
export const CROSS_CONTEXT_SEALED_DENY = 'CROSS_CONTEXT_SEALED_DENY';
export const NEURAL_NODES_EVIDENCE_GATED = 'NEURAL_NODES_EVIDENCE_GATED';
export const SELF_PROMOTION_DENIED = 'SELF_PROMOTION_DENIED';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const AUTONOMY_FREIGHT_PO_SPEND_DENIED =
  'AUTONOMY_BOUNDARY_NO_FREIGHT_PO_SPEND';

export const MAX_GALAXY_EVENTS = 500;
export const MAX_GENOME_EVENTS = 500;
export const MAX_LEAN_EVENTS = 500;
export const MAX_CONNECTOR_EVENTS = 500;
export const MAX_SIM_EVENTS = 500;
export const MAX_RUNTIME_EVENTS = 500;
export const MAX_TOWER_EVENTS = 500;
export const MAX_SOFTWIRE_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EdActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EdPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EdPredecessorProbe> {
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
    EC: {
      tipProbe:
        has(brain, 'superbrain-orchestration-kernel-types.ts') ||
        has(brain, 'superbrain-orchestration-kernel.ts') ||
        has(ops, '62L_EC_SUPERBRAIN_ORCHESTRATION_KERNEL_REPORT.md') ||
        hasPrefix(ops, '62L_EC_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EC_SUPERBRAIN_ORCHESTRATION_KERNEL_REPORT.md') ||
        hasPrefix(ops, '62L_EC_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred EC Superbrain Orchestration Kernel tip + report (may be absent if founder jumped ED).',
    },
    EB: {
      tipProbe:
        has(brain, 'multi-model-superbrain-federation-types.ts') ||
        has(brain, 'multi-model-superbrain-federation.ts') ||
        has(ops, '62L_EB_MULTI_MODEL_SUPERBRAIN_FEDERATION_REPORT.md') ||
        hasPrefix(ops, '62L_EB_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_EB_MULTI_MODEL_SUPERBRAIN_FEDERATION_REPORT.md') ||
        hasPrefix(ops, '62L_EB_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'EB Multi-Model Superbrain Federation fallback when EC absent.',
    },
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
      note: 'EA Global Operations Intelligence Grid soft-wire.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'EC' | 'EB' | 'EA' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['EC', 'EB', 'EA'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  localCloudMicrodatabases: true,
  visualDbNavigation: true,
  provenanceHighways: true,
  scaleTargetNeqOwnedCorpus: true,
  trillionsFutureScaleTargetOnly: true,
  genomeOriginalXivSchemasAndLawfulPatternsOnly: true,
  proprietaryDbCopyDenied: true,
  oracleCompatibleMeansAuthorizedAdapterContractsOnly: true,
  leanSixSigmaAdvisoryExperiments: true,
  kaizenExperimentNeqProductionChange: true,
  syntheticTasksLabeledSynthetic: true,
  millionScaleSyntheticNeqCustomerOwnership: true,
  authorizedConnectorsOnly: true,
  unconfiguredConnectorsUnavailable: true,
  simulationUniversesIsolatedWorkspaces: true,
  simNeqVerifiedFact: true,
  industryTwinNeqPhysicalControl: true,
  historicalResearchAuthorizedSourcesOnly: true,
  edgeCloudWorkloadRoutingEvidenceGated: true,
  offlineAgentsHonestWaitingOrStopped: true,
  personalBusinessKnowledgeFirewall: true,
  sealedDenyCrossContext: true,
  antiMalwareNoStealthInstall: true,
  denyByDefaultFounderSealed: true,
  learningLoopBounded: true,
  digitalTwinNeqFounder: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  correlationNeqCausation: true,
  noSelfPromotionToProduction: true,
  simForecastNeqVerifiedFact: true,
  scaleTargetNeqOwnedCorpus: true,
  syntheticLabeledAlways: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'navigate_authorized_microdatabases',
    'generate_labeled_synthetic_tasks',
    'route_configured_edge_cloud_workloads',
    'run_kaizen_advisory_experiments',
  ] as const,
  denied: [
    'book_freight',
    'issue_purchase_order',
    'sign_contract',
    'spend_money',
    'change_production_system',
    'copy_proprietary_database',
    'reverse_copy_oracle_source',
    'claim_trillions_owned_corpus',
    'physical_control_via_twin',
    'stealth_install',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
