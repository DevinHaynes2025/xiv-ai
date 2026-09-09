import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DY — XIV Intelligent Supply Chain Command OS + Global Knowledge Retrieval
 * Cortex + Autonomous Experiment & Optimization Lab + Universal Device/Chip
 * Scheduler + Long-Term Memory Graph + Agent Collaboration Protocol +
 * Industry Solution Factory + Launch Observability & Recovery Brain.
 *
 * SoT: GitHub #142. GitLab #76 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Soft-wire DX / DW / DV when PRESENT.
 * Autonomy boundary (hard): analyze / simulate / recommend / coordinate approved
 * workflows only — MUST NOT independently book freight, issue POs, sign contracts,
 * spend money, or change production systems.
 * Recommendation ≠ charge / deploy / spend / sign / publish.
 * Correlation ≠ causation; sim / forecast / experiment ≠ verified fact; prototype ≠ invention.
 * CEO/founder-sealed: deny-by-default; label alone ≠ access; Digital Twin ≠ founder.
 * Learning / skill ≠ permission; experiment candidate ≠ production change.
 * Quantum-inspired approaches require classical baselines; keep only reproducible
 * evidence-backed improvements — no unverified supremacy claims.
 * RUNNING_VERIFIED / compatibility / offline / hardware / accuracy claims need real evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * Authorized / public / licensed / customer-owned data only.
 * Wedge-first: industry solution packs behind supply-chain pilot.
 * Agent meetings/collaboration = governed protocol; ≠ unrestricted autonomy.
 * Rollback/recovery planning ≠ auto-rollback of prod without gates.
 * Listing ≠ auto-grant. DB candidates NOT_APPLIED. tip-land=NO.
 */

export const INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE = [
  'honesty_locks',
  'intelligent_supply_chain_command_bootstrap',
  // A — Intelligent Supply Chain Command OS
  'recovery_playbook_advisory_only',
  'freight_booking_denied',
  'purchase_order_denied',
  'contract_signing_denied',
  'spend_money_denied',
  'production_change_denied',
  // B — Global Knowledge Retrieval Cortex
  'retrieval_acl_deny_by_default',
  'label_alone_neq_retrieval_access',
  'historical_timeline_acl_enforced',
  // C — Autonomous Experiment & Optimization Lab
  'experiment_candidate_neq_production_change',
  'quantum_inspired_requires_classical_baseline',
  'retain_only_reproducible_evidence_backed',
  'unverified_supremacy_claim_denied',
  // D — Universal Device/Chip Scheduler
  'device_schedule_running_verified_needs_evidence',
  'unauthorized_device_schedule_denied',
  'offline_without_powered_node_waiting_or_stopped',
  // E — Long-Term Memory Graph
  'ltm_sealed_deny_unenrolled',
  'ltm_governed_acl',
  // F — Agent Collaboration Protocol
  'unsigned_agent_meeting_denied',
  'unauthorized_collaboration_denied',
  'collaboration_neq_unrestricted_autonomy',
  // G — Industry Solution Factory
  'solution_listing_neq_auto_grant',
  'wedge_first_non_supply_chain_pack_gated',
  // H — Launch Observability & Recovery Brain
  'rollback_plan_neq_auto_prod_rollback',
  'observability_claim_needs_evidence',
  'digital_twin_neq_founder',
  'dx_dw_soft_wire_probe',
  'evidence',
  'learning',
] as const;

export type DyHop = (typeof INTELLIGENT_SUPPLY_CHAIN_COMMAND_CYCLE)[number];

export type DyEvidenceState =
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
  | 'CLASSICAL_BASELINE_REQUIRED';

export type DyHopRecord = {
  hop: DyHop;
  state: DyEvidenceState;
  summary: string;
  at: string;
};

export type DyActorKind =
  | 'supply_chain_command_curator'
  | 'knowledge_retrieval_steward'
  | 'experiment_lab_operator'
  | 'device_chip_scheduler'
  | 'ltm_graph_curator'
  | 'agent_collaboration_moderator'
  | 'industry_solution_factory_curator'
  | 'observability_recovery_operator'
  | 'human_approver'
  | 'founder'
  | 'digital_twin'
  | 'agent';

export type DyActor = {
  kind: DyActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED';

export const GITHUB_SOT_ISSUE = 142;
export const GITLAB_COORDINATION_ISSUE = 76;

export const NEXT_PHASE_TITLE =
  '62L-DZ — XIV Supply Chain Intelligence Fabric + Global Historical Data Memory Engine + Algorithm Discovery & Benchmark Factory + Universal Edge AI Runtime + Agent Society Coordination Layer + Personal/Enterprise Knowledge Graph + Industry App Composer + Launch Resilience & Trust Control Tower';

export const DY_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  LOCAL_FIRST: true as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  FULL_PRODUCTION_INTELLIGENT_SUPPLY_CHAIN_COMMAND_SHIPPED: false as const,
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
  EXPERIMENT_CANDIDATE_EQ_PRODUCTION_CHANGE: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM: false as const,
  QUANTUM_SUPREMACY_WITHOUT_EVIDENCE: false as const,
  CLASSICAL_BASELINE_OPTIONAL: false as const,
  RETAIN_WITHOUT_REPRODUCIBLE_EVIDENCE: false as const,
  RUNNING_VERIFIED_WITHOUT_EVIDENCE: false as const,
  UNENROLLED_LTM_ACCESS_ALLOWED: false as const,
  UNSIGNED_AGENT_MEETING_ALLOWED: false as const,
  COLLABORATION_EQ_UNRESTRICTED_AUTONOMY: false as const,
  LISTING_EQ_AUTO_GRANT: false as const,
  BROADER_INDUSTRY_BEFORE_SUPPLY_CHAIN_PILOT: false as const,
  ROLLBACK_PLAN_EQ_AUTO_PROD_ROLLBACK: false as const,
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

export const RECOVERY_PLAYBOOK_ADVISORY_ONLY =
  'RECOVERY_PLAYBOOK_ADVISORY_ONLY';
export const FREIGHT_BOOKING_DENIED = 'FREIGHT_BOOKING_DENIED_AUTONOMY_BOUNDARY';
export const PURCHASE_ORDER_DENIED = 'PURCHASE_ORDER_DENIED_AUTONOMY_BOUNDARY';
export const CONTRACT_SIGNING_DENIED = 'CONTRACT_SIGNING_DENIED_AUTONOMY_BOUNDARY';
export const SPEND_MONEY_DENIED = 'SPEND_MONEY_DENIED_AUTONOMY_BOUNDARY';
export const PRODUCTION_CHANGE_DENIED =
  'PRODUCTION_CHANGE_DENIED_AUTONOMY_BOUNDARY';
export const RETRIEVAL_ACL_DENIED = 'RETRIEVAL_ACL_DENY_BY_DEFAULT';
export const LABEL_NEQ_RETRIEVAL_ACCESS = 'LABEL_ALONE_NEQ_RETRIEVAL_ACCESS';
export const HISTORICAL_TIMELINE_ACL = 'HISTORICAL_TIMELINE_ACL_ENFORCED';
export const EXPERIMENT_NEQ_PROD = 'EXPERIMENT_CANDIDATE_NEQ_PRODUCTION_CHANGE';
export const QUANTUM_NEEDS_CLASSICAL =
  'QUANTUM_INSPIRED_REQUIRES_CLASSICAL_BASELINE';
export const RETAIN_REPRODUCIBLE_ONLY =
  'RETAIN_ONLY_REPRODUCIBLE_EVIDENCE_BACKED';
export const SUPREMACY_DENIED = 'UNVERIFIED_SUPREMACY_CLAIM_DENIED';
export const DEVICE_EVIDENCE_REQUIRED =
  'DEVICE_SCHEDULE_RUNNING_VERIFIED_NEEDS_EVIDENCE';
export const UNAUTHORIZED_DEVICE_SCHEDULE = 'UNAUTHORIZED_DEVICE_SCHEDULE_DENIED';
export const OFFLINE_WAITING_OR_STOPPED =
  'OFFLINE_WITHOUT_POWERED_NODE_WAITING_OR_STOPPED';
export const LTM_UNENROLLED_DENIED = 'LTM_SEALED_DENY_UNENROLLED';
export const LTM_ACL_DENIED = 'LTM_GOVERNED_ACL';
export const UNSIGNED_MEETING_DENIED = 'UNSIGNED_AGENT_MEETING_DENIED';
export const UNAUTHORIZED_COLLAB_DENIED = 'UNAUTHORIZED_COLLABORATION_DENIED';
export const COLLAB_NEQ_AUTONOMY =
  'COLLABORATION_NEQ_UNRESTRICTED_AUTONOMY';
export const LISTING_NEQ_AUTO_GRANT = 'SOLUTION_LISTING_NEQ_AUTO_GRANT';
export const WEDGE_FIRST_GATED = 'WEDGE_FIRST_NON_SUPPLY_CHAIN_PACK_GATED';
export const ROLLBACK_PLAN_NEQ_AUTO =
  'ROLLBACK_PLAN_NEQ_AUTO_PROD_ROLLBACK';
export const OBSERVABILITY_EVIDENCE_REQUIRED =
  'OBSERVABILITY_CLAIM_NEEDS_EVIDENCE';
export const TWIN_NEQ_FOUNDER = 'DIGITAL_TWIN_NEQ_FOUNDER';

export const MAX_RECOVERY_PLAYBOOKS = 500;
export const MAX_RETRIEVAL_QUERIES = 500;
export const MAX_EXPERIMENTS = 500;
export const MAX_DEVICE_SCHEDULES = 500;
export const MAX_LTM_NODES = 500;
export const MAX_COLLAB_MEETINGS = 500;
export const MAX_SOLUTION_PACKS = 500;
export const MAX_OBSERVABILITY_EVENTS = 500;
export const MAX_AUDIT_EVENTS = 5000;

export function isHumanOrFounder(actor: DyActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export type DyPredecessorProbe = {
  tipProbe: 'PRESENT' | 'WAITING_DATA';
  report: 'PRESENT' | 'MISSING';
  note: string;
};

export function predecessorMap(
  repoRoot?: string,
): Record<string, DyPredecessorProbe> {
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
      note: 'Preferred DX Autonomous Supply Chain Ops tip + report.',
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
    DV: {
      tipProbe:
        has(brain, 'universal-data-industry-cortex-types.ts') ||
        has(brain, 'universal-data-industry-cortex.ts') ||
        has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md') ||
        hasPrefix(ops, '62L_DV_')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has(ops, '62L_DV_UNIVERSAL_DATA_INDUSTRY_CORTEX_REPORT.md') ||
        hasPrefix(ops, '62L_DV_')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DV Universal Data & Industry Cortex fallback when DW absent.',
    },
  };
}

export function detectPredecessorLayer(
  repoRoot?: string,
): 'DX' | 'DW' | 'DV' | 'NONE' {
  const map = predecessorMap(repoRoot);
  for (const key of ['DX', 'DW', 'DV'] as const) {
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

export const PRODUCT_PHILOSOPHY = Object.freeze({
  recoveryPlaybooksAdvisoryOnly: true,
  denyByDefaultAutonomyBoundary: true,
  founderHumanGatesRequired: true,
  retrievalAclAndHistoricalTimelines: true,
  classicalBaselineRequiredForQuantumInspired: true,
  retainOnlyReproducibleEvidenceBacked: true,
  deviceSchedulerEvidenceGates: true,
  governedLongTermMemoryGraph: true,
  signedAuthorizedAgentCollaborationOnly: true,
  solutionListingNeqAutoGrant: true,
  wedgeFirstSupplyChainPilot: true,
  rollbackPlanNeqAutoProdRollback: true,
  offlineHonestWaitingOrStopped: true,
  learningLoopBounded: true,
});

export const LEARNING_LOOP_RULES = Object.freeze({
  learningNeqPermission: true,
  experimentCandidateNeqProductionChange: true,
  classicalBaselineRequired: true,
  retainOnlyReproducibleEvidenceBackedImprovements: true,
  noUnverifiedSupremacyClaims: true,
  correlationNeqCausation: true,
});
