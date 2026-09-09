import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DZ — XIV Supply Chain Intelligence Fabric + Global Historical Data Memory
 * Engine + Algorithm Discovery & Benchmark Factory + Universal Edge AI Runtime +
 * Agent Society Coordination Layer + Personal/Enterprise Knowledge Graph +
 * Industry App Composer + Launch Resilience & Trust Control Tower.
 *
 * SoT: GitHub #143. GitLab #77 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DY / DX / DW when PRESENT.
 * Autonomy boundary (hard): analyze / simulate / recommend / coordinate approved
 * workflows only — MUST NOT independently book freight, issue POs, sign contracts,
 * spend money, or change production systems.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 * Correlation ≠ causation; disruption/root-cause pathways = hypothesized unless verified.
 * Sim / forecast ≠ verified fact.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Learning / skill ≠ permission; discovery candidate ≠ production algorithm.
 * Promotion gate (hard): algorithms, devices, agents, app packs CANNOT self-promote
 * into production — require evidence → testing → permissions → rollback plan →
 * explicit authorization.
 * Quantum-inspired needs classical baselines; no unverified supremacy.
 * RUNNING_VERIFIED / offline / hardware / accuracy claims need real evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED; offline knowledge packs honest.
 * Authorized / public / licensed / customer-owned data only.
 * Knowledge-boundary firewalls: sealed deny cross-context / unlabeled leakage.
 * Sandbox industry-app composition ≠ production deploy.
 * Agent society shifts/meetings = governed; task-level reliability ≠ unrestricted autonomy.
 * Wedge-first: industry packs behind supply-chain pilot where applicable.
 * DB candidates NOT_APPLIED. tip-land=NO.
 */

export const SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE = [
  'honesty_locks',
  'supply_chain_intelligence_fabric_bootstrap',
  // A — Supply Chain Intelligence Fabric
  'root_cause_pathway_hypothesized_only',
  'disruption_propagation_neq_verified_causation',
  'freight_booking_denied',
  'purchase_order_denied',
  'contract_signing_denied',
  'spend_money_denied',
  'production_change_denied',
  // B — Global Historical Data Memory Engine
  'historical_memory_acl_deny_by_default',
  'label_alone_neq_historical_access',
  'temporal_knowledge_graph_acl_enforced',
  // C — Algorithm Discovery & Benchmark Factory
  'discovery_candidate_neq_production_algorithm',
  'quantum_inspired_requires_classical_baseline',
  'benchmark_gate_requires_reproducible_evidence',
  'algorithm_self_promotion_denied',
  // D — Universal Edge AI Runtime
  'edge_running_verified_needs_evidence',
  'offline_knowledge_pack_honest',
  'offline_without_powered_node_waiting_or_stopped',
  'device_self_promotion_denied',
  // E — Agent Society Coordination Layer
  'unsigned_agent_shift_denied',
  'unauthorized_society_meeting_denied',
  'task_reliability_neq_unrestricted_autonomy',
  'agent_self_promotion_denied',
  // F — Personal/Enterprise Knowledge Graph + Universal Knowledge Firewall
  'knowledge_firewall_sealed_deny_cross_context',
  'unlabeled_leakage_denied',
  'personal_enterprise_boundary_enforced',
  // G — Industry App Composer
  'sandbox_composition_neq_prod_deploy',
  'app_pack_self_promotion_denied',
  'wedge_first_industry_pack_gated',
  // H — Launch Resilience & Trust Control Tower
  'promotion_gate_requires_evidence_testing_permissions_rollback_auth',
  'trust_claim_needs_evidence',
  'digital_twin_neq_founder',
  'dy_dx_soft_wire_probe',
  'evidence',
  'learning',
] as const;

export type DzHop = (typeof SUPPLY_CHAIN_INTELLIGENCE_FABRIC_CYCLE)[number];

export type DzEvidenceState =
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
  | 'PROMOTION_DENIED';

export type DzHopRecord = {
  hop: DzHop;
  state: DzEvidenceState;
  summary: string;
  at: string;
};

export type DzActorKind =
  | 'supply_chain_intelligence_curator'
  | 'historical_memory_steward'
  | 'algorithm_discovery_operator'
  | 'edge_ai_runtime_operator'
  | 'agent_society_coordinator'
  | 'knowledge_graph_firewall_curator'
  | 'industry_app_composer'
  | 'launch_resilience_trust_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DzActor = {
  kind: DzActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 143;
export const GITLAB_COORDINATION_ISSUE = 77;

export const NEXT_PHASE_TITLE =
  '62L-EA — XIV Global Operations Intelligence Grid + Supply Chain Causal Graph + Historical Civilization & Enterprise Memory Atlas + Algorithm Evolution Laboratory + Offline Model Runtime Fabric + Agent Department Operating Network + Universal Knowledge Firewall + Business App Assembly Line + Launch Security & Reliability Nerve Center';

export const DZ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_SUPPLY_CHAIN_INTELLIGENCE_FABRIC_SHIPPED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  RECOMMENDATION_EQ_CHARGE: false as const,
  RECOMMENDATION_EQ_DEPLOY: false as const,
  RECOMMENDATION_EQ_SPEND: false as const,
  RECOMMENDATION_EQ_SIGN: false as const,
  RECOMMENDATION_EQ_PUBLISH: false as const,
  LABEL_ALONE_EQ_ACCESS: false as const,
  FREIGHT_BOOKING_AUTONOMOUS: false as const,
  PO_ISSUANCE_AUTONOMOUS: false as const,
  CONTRACT_SIGNING_AUTONOMOUS: false as const,
  SPEND_MONEY_AUTONOMOUS: false as const,
  PRODUCTION_CHANGE_AUTONOMOUS: false as const,
  PATHWAY_EQ_VERIFIED_CAUSATION: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  DISCOVERY_CANDIDATE_EQ_PRODUCTION_ALGORITHM: false as const,
  ALGORITHM_SELF_PROMOTION_ALLOWED: false as const,
  DEVICE_SELF_PROMOTION_ALLOWED: false as const,
  AGENT_SELF_PROMOTION_ALLOWED: false as const,
  APP_PACK_SELF_PROMOTION_ALLOWED: false as const,
  SANDBOX_COMPOSITION_EQ_PROD_DEPLOY: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM: false as const,
  QUANTUM_SUPREMACY_WITHOUT_EVIDENCE: false as const,
  CLASSICAL_BASELINE_OPTIONAL: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  CROSS_CONTEXT_LEAKAGE_ALLOWED: false as const,
  UNLABELED_LEAKAGE_ALLOWED: false as const,
  UNSIGNED_AGENT_SHIFT_ALLOWED: false as const,
  TASK_RELIABILITY_EQ_UNRESTRICTED_AUTONOMY: false as const,
  PROMOTION_WITHOUT_EXPLICIT_AUTH: false as const,
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  LEARNING_EQ_PERMISSION: false as const,
  CONSCIOUSNESS_CLAIMED: false as const,
  PUBLIC_LAUNCH_AUTHORIZED: false as const,
  CONTRACT_PAYMENT_AUTHORIZED: false as const,
});

export const AUTONOMY_BOUNDARY_DENIED_ACTIONS = Object.freeze([
  'book_freight',
  'issue_purchase_order',
  'sign_contract',
  'spend_money',
  'change_production_system',
] as const);

export type AutonomyBoundaryAction =
  (typeof AUTONOMY_BOUNDARY_DENIED_ACTIONS)[number];

export const PATHWAY_HYPOTHESIZED_ONLY =
  'ROOT_CAUSE_PATHWAY_HYPOTHESIZED_ONLY';
export const DISRUPTION_NEQ_CAUSATION =
  'DISRUPTION_PROPAGATION_NEQ_VERIFIED_CAUSATION';
export const FREIGHT_BOOKING_DENIED = 'FREIGHT_BOOKING_DENIED_AUTONOMY_BOUNDARY';
export const PURCHASE_ORDER_DENIED = 'PURCHASE_ORDER_DENIED_AUTONOMY_BOUNDARY';
export const CONTRACT_SIGNING_DENIED =
  'CONTRACT_SIGNING_DENIED_AUTONOMY_BOUNDARY';
export const SPEND_MONEY_DENIED = 'SPEND_MONEY_DENIED_AUTONOMY_BOUNDARY';
export const PRODUCTION_CHANGE_DENIED =
  'PRODUCTION_CHANGE_DENIED_AUTONOMY_BOUNDARY';
export const HISTORICAL_MEMORY_ACL_DENIED =
  'HISTORICAL_MEMORY_ACL_DENY_BY_DEFAULT';
export const LABEL_NEQ_HISTORICAL_ACCESS = 'LABEL_ALONE_NEQ_HISTORICAL_ACCESS';
export const TEMPORAL_KG_ACL = 'TEMPORAL_KNOWLEDGE_GRAPH_ACL_ENFORCED';
export const DISCOVERY_NEQ_PROD =
  'DISCOVERY_CANDIDATE_NEQ_PRODUCTION_ALGORITHM';
export const QUANTUM_NEEDS_CLASSICAL =
  'QUANTUM_INSPIRED_REQUIRES_CLASSICAL_BASELINE';
export const BENCHMARK_GATE_REQUIRED =
  'BENCHMARK_GATE_REQUIRES_REPRODUCIBLE_EVIDENCE';
export const ALGORITHM_SELF_PROMOTION_DENIED =
  'ALGORITHM_SELF_PROMOTION_DENIED';
export const EDGE_EVIDENCE_REQUIRED =
  'EDGE_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const OFFLINE_PACK_HONEST = 'OFFLINE_KNOWLEDGE_PACK_HONEST';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const DEVICE_SELF_PROMOTION_DENIED = 'DEVICE_SELF_PROMOTION_DENIED';
export const UNSIGNED_SHIFT_DENIED = 'UNSIGNED_AGENT_SHIFT_DENIED';
export const UNAUTHORIZED_SOCIETY_MEETING =
  'UNAUTHORIZED_SOCIETY_MEETING_DENIED';
export const TASK_RELIABILITY_NEQ_AUTONOMY =
  'TASK_RELIABILITY_NEQ_UNRESTRICTED_AUTONOMY';
export const AGENT_SELF_PROMOTION_DENIED = 'AGENT_SELF_PROMOTION_DENIED';
export const FIREWALL_CROSS_CONTEXT_DENIED =
  'KNOWLEDGE_FIREWALL_SEALED_DENY_CROSS_CONTEXT';
export const UNLABELED_LEAKAGE_DENIED = 'UNLABELED_LEAKAGE_DENIED';
export const PERSONAL_ENTERPRISE_BOUNDARY =
  'PERSONAL_ENTERPRISE_BOUNDARY_ENFORCED';
export const SANDBOX_NEQ_PROD = 'SANDBOX_COMPOSITION_NEQ_PROD_DEPLOY';
export const APP_PACK_SELF_PROMOTION_DENIED =
  'APP_PACK_SELF_PROMOTION_DENIED';
export const WEDGE_FIRST_GATED = 'WEDGE_FIRST_INDUSTRY_PACK_GATED';
export const PROMOTION_GATE_REQUIRED =
  'PROMOTION_GATE_REQUIRES_EVIDENCE_TESTING_PERMISSIONS_ROLLBACK_AUTH';
export const TRUST_EVIDENCE_REQUIRED = 'TRUST_CLAIM_NEEDS_EVIDENCE';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const MAX_PATHWAYS = 500;
export const MAX_HISTORICAL_NODES = 500;
export const MAX_DISCOVERIES = 500;
export const MAX_EDGE_PROBES = 500;
export const MAX_SOCIETY_EVENTS = 500;
export const MAX_FIREWALL_EVENTS = 500;
export const MAX_APP_COMPOSITIONS = 500;
export const MAX_TRUST_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DzActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DzPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, DzPredecessorProbe> {
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
    DY: {
      tipProbe:
        has(brain, 'intelligent-supply-chain-command-types.ts') ||
        has(brain, 'intelligent-supply-chain-command.ts') ||
        has(ops, '62L_DY_INTELLIGENT_SUPPLY_CHAIN_COMMAND_REPORT.md') ||
        hasPrefix(ops, '62L_DY_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DY_INTELLIGENT_SUPPLY_CHAIN_COMMAND_REPORT.md') ||
        hasPrefix(ops, '62L_DY_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'Preferred DY Intelligent Supply Chain Command tip + report.',
    },
    DX: {
      tipProbe:
        has(brain, 'autonomous-supply-chain-ops-types.ts') ||
        has(brain, 'autonomous-supply-chain-ops.ts') ||
        has(ops, '62L_DX_AUTONOMOUS_SUPPLY_CHAIN_OPS_REPORT.md') ||
        hasPrefix(ops, '62L_DX_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DX_AUTONOMOUS_SUPPLY_CHAIN_OPS_REPORT.md') ||
        hasPrefix(ops, '62L_DX_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DX Autonomous Supply Chain Ops fallback when DY absent.',
    },
    DW: {
      tipProbe:
        has(brain, 'supply-chain-superbrain-types.ts') ||
        has(brain, 'supply-chain-superbrain.ts') ||
        has(ops, '62L_DW_SUPPLY_CHAIN_SUPERBRAIN_REPORT.md') ||
        hasPrefix(ops, '62L_DW_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DW_SUPPLY_CHAIN_SUPERBRAIN_REPORT.md') ||
        hasPrefix(ops, '62L_DW_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DW Supply Chain Superbrain fallback when DX absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DY' | 'DX' | 'DW' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DY', 'DX', 'DW'] as const) {
    if (map[key].tipProbe === 'PRESENT') return key;
  }
  return 'NONE';
}

export const AUTONOMY_BOUNDARY = Object.freeze({
  allowed: [
    'analyze',
    'simulate',
    'recommend',
    'coordinate_approved_workflows',
  ] as const,
  denied: AUTONOMY_BOUNDARY_DENIED_ACTIONS,
  humanFounderGateRequired: true as const,
  denyByDefault: true as const,
});

export const PROMOTION_GATE = Object.freeze({
  selfPromotionForbidden: true as const,
  requiredSteps: [
    'evidence',
    'testing',
    'permissions',
    'rollback_plan',
    'explicit_authorization',
  ] as const,
  subjects: ['algorithm', 'device', 'agent', 'app_pack'] as const,
  defaultDeny: true as const,
});

export const PRODUCT_PHILOSOPHY = Object.freeze({
  pathwaysHypothesizedUnlessVerified: true,
  correlationNeqCausation: true,
  denyByDefaultAutonomyBoundary: true,
  founderHumanGatesRequired: true,
  historicalMemoryAclEnforced: true,
  classicalBaselineRequiredForQuantumInspired: true,
  discoveryCandidateNeqProductionAlgorithm: true,
  promotionGateHardDenySelfPromotion: true,
  edgeRuntimeEvidenceGates: true,
  offlineKnowledgePacksHonest: true,
  governedAgentSociety: true,
  knowledgeFirewallSealedDeny: true,
  sandboxCompositionNeqProdDeploy: true,
  wedgeFirstSupplyChainPilot: true,
  trustClaimNeedsEvidence: true,
  learningLoopBounded: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  discoveryCandidateNeqProductionAlgorithm: true,
  classicalBaselineRequired: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noUnverifiedSupremacyClaims: true,
  correlationNeqCausation: true,
  noSelfPromotionToProduction: true,
});
