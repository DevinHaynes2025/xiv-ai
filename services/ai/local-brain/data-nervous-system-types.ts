import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-EE — XIV Data Nervous System + Autonomous Database Operations Brain +
 * Historical Supply Chain Learning Cortex + Lean Enterprise Optimization Engine +
 * Universal Industry Digital Twin Factory + Agent Knowledge Production Line +
 * Edge/Cloud Continuity Grid + Launch Data Reliability Command Center.
 *
 * SoT: GitHub #149. GitLab #82 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire ED / EB when PRESENT (ED preferred; EB used when ED absent).
 * Unconfigured providers UNAVAILABLE.
 * Correlation ≠ causation; learning pathway outcome links are evidence-labeled —
 * correlation ≠ causation.
 * Sim/forecast/failure-simulation ≠ verified fact / ≠ real incident authority.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Recommendation ≠ charge/deploy/spend/sign/publish.
 * Data Nervous System pathway: source → pipeline → memory → agent → decision →
 * outcome → learning — must carry provenance + reliability evidence; missing
 * evidence → NOT_VERIFIED / deny consequential promotion.
 * “Trillions” / mega-scale = future target if soft-wired from ED — ≠ current
 * ownership claim.
 * Digital genome / schemas = original XIV + lawful patterns — ≠ proprietary copy.
 * Lean/Six Sigma/Kaizen + algorithm benchmarking: experiment ≠ prod change;
 * classical baselines for quantum-inspired if present; self-promotion denied.
 * Industry digital-twin templates = sim/advisory; ≠ physical control.
 * Agent knowledge production + peer review ≠ auto-permission grant /
 * ≠ auto-prod publish.
 * CPU/GPU/NPU edge/cloud continuity: RUNNING_VERIFIED needs evidence; offline
 * WAITING_NODE / OFFLINE_STOPPED.
 * Security-boundary testing = defensive; no offensive exploit tooling.
 * DB ops agents: health/SLO/sync recommendations ≠ auto live migration;
 * candidates NOT_APPLIED.
 * Autonomy: no independent freight/PO/contract/spend/prod-change.
 * Anti-malware OS soft-wire preserved if present.
 * tip-land=NO.
 */

export const DATA_NERVOUS_SYSTEM_CYCLE = [
  'honesty_locks',
  'data_nervous_system_bootstrap',
  // A — Data Nervous System
  'nervous_pathway_provenance_end_to_end',
  'missing_evidence_not_verified',
  'consequential_promotion_gated',
  // B — Autonomous Database Operations Brain
  'db_health_agent_recommend_only',
  'offline_cloud_sync_neq_auto_migrate',
  'data_slo_advisory_not_applied',
  // C — Historical Supply Chain Learning Cortex
  'historical_learning_evidence_labeled',
  'temporal_graph_correlation_neq_causation',
  'pathway_outcome_correlation_only',
  // D — Lean Enterprise Optimization Engine
  'lean_six_sigma_kaizen_experiment_only',
  'algorithm_benchmark_neq_prod_change',
  'classical_baseline_when_quantum_inspired',
  // E — Universal Industry Digital Twin Factory
  'industry_twin_template_sim_advisory',
  'sim_neq_verified_fact',
  'twin_neq_physical_control',
  // F — Agent Knowledge Production Line
  'knowledge_production_peer_review_required',
  'peer_review_neq_auto_permission_grant',
  'knowledge_neq_auto_prod_publish',
  // G — Edge/Cloud Continuity Grid
  'cpu_gpu_npu_continuity_evidence_gate',
  'failure_simulation_labeled',
  'offline_waiting_or_stopped',
  // H — Launch Data Reliability Command Center
  'security_boundary_defensive_only',
  'launch_data_reliability_evidence',
  'ed_eb_soft_wire_probe',
  'stealth_install_denied',
  'digital_twin_neq_founder',
  'autonomy_boundary_no_freight_po_spend',
  'evidence',
  'learning',
] as const;

export type EeHop = (typeof DATA_NERVOUS_SYSTEM_CYCLE)[number];

export type EeEvidenceState =
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
  | 'SPECULATIVE'
  | 'DEFENSIVE_ONLY'
  | 'SCALE_TARGET_ONLY';

export type EeHopRecord = {
  hop: EeHop;
  state: EeEvidenceState;
  summary: string;
  at: string;
};

export type EeActorKind =
  | 'data_nervous_system_curator'
  | 'db_ops_agent'
  | 'supply_chain_learning_steward'
  | 'lean_optimization_operator'
  | 'industry_twin_factory_operator'
  | 'knowledge_production_editor'
  | 'edge_cloud_continuity_operator'
  | 'launch_reliability_commander'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type EeActor = {
  kind: EeActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 149;
export const GITLAB_COORDINATION_ISSUE = 82;

export const NEXT_PHASE_TITLE =
  '62L-EF — XIV Neural Data Highway + Self-Healing Data Fabric + Supply Chain Knowledge Genome + Continuous Improvement AI Factory + Global Digital Twin Network + Agent Learning University + Distributed Local/Cloud Brain Runtime + Launch Mission Assurance System';

export const EE_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_DATA_NERVOUS_SYSTEM_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  RECOMMENDATION_EQ_AUTO_MIGRATE: false as const,
  SYNC_EQ_AUTO_MIGRATE: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  UNCONFIGURED_PROVIDER_EQ_AVAILABLE: false as const,
  FABRICATED_PROVIDER_CREDS_ALLOWED: false as const,
  MISSING_EVIDENCE_EQ_VERIFIED: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  SIM_EQ_VERIFIED_FACT: false as const,
  FAILURE_SIM_EQ_REAL_INCIDENT: false as const,
  TWIN_EQ_PHYSICAL_CONTROL: false as const,
  PEER_REVIEW_EQ_AUTO_PERMISSION_GRANT: false as const,
  KNOWLEDGE_EQ_AUTO_PROD_PUBLISH: false as const,
  EXPERIMENT_EQ_PROD_CHANGE: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  OFFENSIVE_EXPLOIT_TOOLING_ALLOWED: false as const,
  STEALTH_INSTALL_ALLOWED: false as const,
  UNAUTHORIZED_TAKEOVER_ALLOWED: false as const,
  PERMISSION_BYPASS_ALLOWED: false as const,
  SILENT_PERSISTENCE_ALLOWED: false as const,
  TRILLIONS_EQ_CURRENT_OWNERSHIP: false as const,
  PROPRIETARY_DB_COPY_ALLOWED: false as const,
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

export const NERVOUS_PATHWAY_STAGES = [
  'source',
  'pipeline',
  'memory',
  'agent',
  'decision',
  'outcome',
  'learning',
] as const;

export type NervousPathwayStage = (typeof NERVOUS_PATHWAY_STAGES)[number];

export const PATHWAY_PROVENANCE_REQUIRED =
  'NERVOUS_PATHWAY_PROVENANCE_RELIABILITY_REQUIRED';
export const MISSING_EVIDENCE_NOT_VERIFIED = 'MISSING_EVIDENCE_NOT_VERIFIED';
export const CONSEQUENTIAL_PROMOTION_GATED =
  'CONSEQUENTIAL_PROMOTION_GATED_DENIED';
export const DB_HEALTH_RECOMMEND_ONLY = 'DB_HEALTH_AGENT_RECOMMEND_ONLY';
export const SYNC_NEQ_AUTO_MIGRATE = 'OFFLINE_CLOUD_SYNC_NEQ_AUTO_MIGRATE';
export const DATA_SLO_NOT_APPLIED = 'DATA_SLO_ADVISORY_NOT_APPLIED';
export const HISTORICAL_LEARNING_LABELED =
  'HISTORICAL_LEARNING_EVIDENCE_LABELED';
export const TEMPORAL_CORRELATION_ONLY =
  'TEMPORAL_GRAPH_CORRELATION_NEQ_CAUSATION';
export const PATHWAY_OUTCOME_CORRELATION =
  'PATHWAY_OUTCOME_CORRELATION_ONLY';
export const LEAN_EXPERIMENT_ONLY =
  'LEAN_SIX_SIGMA_KAIZEN_EXPERIMENT_ONLY';
export const BENCHMARK_NEQ_PROD = 'ALGORITHM_BENCHMARK_NEQ_PROD_CHANGE';
export const CLASSICAL_BASELINE_REQUIRED =
  'CLASSICAL_BASELINE_WHEN_QUANTUM_INSPIRED';
export const TWIN_SIM_ADVISORY = 'INDUSTRY_TWIN_TEMPLATE_SIM_ADVISORY';
export const SIM_NEQ_FACT = 'SIM_NEQ_VERIFIED_FACT';
export const TWIN_NEQ_PHYSICAL = 'TWIN_NEQ_PHYSICAL_CONTROL';
export const PEER_REVIEW_REQUIRED =
  'KNOWLEDGE_PRODUCTION_PEER_REVIEW_REQUIRED';
export const PEER_REVIEW_NEQ_GRANT =
  'PEER_REVIEW_NEQ_AUTO_PERMISSION_GRANT';
export const KNOWLEDGE_NEQ_AUTO_PUBLISH =
  'KNOWLEDGE_NEQ_AUTO_PROD_PUBLISH';
export const CONTINUITY_EVIDENCE_REQUIRED =
  'CPU_GPU_NPU_CONTINUITY_EVIDENCE_GATE';
export const FAILURE_SIM_LABELED = 'FAILURE_SIMULATION_LABELED';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WAITING_NODE_OR_OFFLINE_STOPPED';
export const SECURITY_DEFENSIVE_ONLY =
  'SECURITY_BOUNDARY_DEFENSIVE_ONLY';
export const LAUNCH_RELIABILITY_EVIDENCE =
  'LAUNCH_DATA_RELIABILITY_EVIDENCE';
export const STEALTH_INSTALL_DENIED = 'STEALTH_INSTALL_DENIED';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';
export const AUTONOMY_BOUNDARY_DENIED =
  'AUTONOMY_BOUNDARY_NO_FREIGHT_PO_SPEND';

export const MAX_PATHWAYS = 500;
export const MAX_DB_OPS = 500;
export const MAX_LEARNING_EVENTS = 500;
export const MAX_LEAN_EXPERIMENTS = 500;
export const MAX_TWIN_TEMPLATES = 500;
export const MAX_KNOWLEDGE_ITEMS = 500;
export const MAX_CONTINUITY_PROBES = 500;
export const MAX_LAUNCH_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: EeActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type EePredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, EePredecessorProbe> {
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
      note: 'Preferred ED Data Galaxy & Industry Memory OS tip + report.',
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
      note: 'EB Multi-Model Superbrain Federation fallback when ED absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'ED' | 'EB' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['ED', 'EB'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const PRODUCT_PHILOSOPHY = Object.freeze({
  nervousPathwayProvenanceRequired: true,
  missingEvidenceNotVerified: true,
  consequentialPromotionGated: true,
  dbOpsRecommendNeqAutoMigrate: true,
  syncNeqAutoMigrate: true,
  correlationNeqCausation: true,
  leanExperimentNeqProdChange: true,
  industryTwinSimAdvisoryOnly: true,
  twinNeqPhysicalControl: true,
  peerReviewNeqAutoGrant: true,
  knowledgeNeqAutoProdPublish: true,
  continuityEvidenceGated: true,
  failureSimulationLabeled: true,
  offlineHonestWaitingOrStopped: true,
  securityBoundaryDefensiveOnly: true,
  noOffensiveExploitTooling: true,
  antiMalwareNoStealthInstall: true,
  denyByDefaultFounderSealed: true,
  digitalTwinNeqFounder: true,
  trillionsFutureTargetOnly: true,
  proprietaryDbCopyDenied: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  pathwayOutcomeEvidenceLabeled: true,
  correlationNeqCausation: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noSelfPromotionToProduction: true,
  simForecastFailureSimNeqVerifiedFact: true,
  classicalBaselineWhenQuantumInspired: true,
});

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'label_provenance',
    'advise_db_health_slo',
    'run_lean_experiments_sandboxed',
    'peer_review_knowledge_candidates',
    'defensive_security_boundary_test',
  ] as const,
  denied: [
    'book_freight',
    'issue_purchase_order',
    'sign_contract',
    'spend_money',
    'change_production_system',
    'auto_migrate_live_db',
    'auto_grant_permission',
    'auto_publish_prod',
    'offensive_exploit',
    'stealth_install',
  ] as const,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});
