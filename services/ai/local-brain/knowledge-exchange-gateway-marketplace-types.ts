import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DE — XIV Superbrain Knowledge Exchange Kernel + Agent Gateway Marketplace +
 * Federated Data/Memory Fabric + Continuous Model Competition Lab +
 * Distributed Compute Capacity Planner + Autonomous AI Company Incubator +
 * Multi-Universe Resilience & Recovery Orchestrator.
 *
 * SoT: GitHub #122. GitLab #56 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Internal capability marketplace: registration ≠ authority/credentials/billing/deploy/
 * broader data access; deny-by-default.
 * Governed knowledge exchange; explicit data rights; local-first; sealed never silent
 * cloud/Universe fallback.
 * Continuous model tournaments: evaluation evidence; consensus/winner ≠ verified proof;
 * unconfigured UNAVAILABLE.
 * Compute-capacity forecasting: proxies/plans only; cannot spend money; unverified
 * hardware UNAVAILABLE.
 * AI company incubation: sandbox only; human approval for consequential changes;
 * no self-promote to production.
 * Multi-Universe resilience/recovery: signed; explicit recovery authorization;
 * orchestration ≠ auto prod restore.
 * Heartbeat truth; WAITING_NODE/OFFLINE_STOPPED; logical ≠ RUNNING_VERIFIED.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE = [
  'honesty_locks',
  'knowledge_exchange_kernel_bootstrap',
  'marketplace_listing_no_credentials_billing_deploy_broader_access',
  'missing_scope_denied_deny_by_default',
  'knowledge_exchange_without_rights_provenance_denied',
  'sealed_silent_route_denied',
  'tournament_winner_not_verified_proof_or_production_model',
  'capacity_planner_cannot_purchase_bill',
  'unverified_hardware_not_planned_as_live',
  'incubator_self_promote_denied_human_approval_gate',
  'recovery_without_authorization_denied',
  'unsigned_or_revoked_recovery_pack_rejected',
  'no_powered_node_waiting_or_stopped',
  'evidence',
  'learning',
] as const;

export type DeHop = (typeof KNOWLEDGE_EXCHANGE_GATEWAY_MARKETPLACE_CYCLE)[number];

export type DeEvidenceState =
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
  | 'NOT_APPLIED'
  | 'ATTRIBUTION_UNSAFE'
  | 'LOCAL_PREFERRED'
  | 'APPROVED'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'HYPOTHESIS'
  | 'UNPROMOTED'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'REVOKED'
  | 'CONSENSUS_ONLY'
  | 'WINNER_ONLY'
  | 'ACCOUNTING_ONLY'
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'LISTED'
  | 'ORCHESTRATED';

export type DeHopRecord = {
  hop: DeHop;
  state: DeEvidenceState;
  summary: string;
  at: string;
};

export const DE_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  LOGICAL_AUTO_RUNNING_VERIFIED: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  MARKETPLACE_LISTING_GRANTS_CREDENTIALS: false as const,
  MARKETPLACE_LISTING_GRANTS_BILLING: false as const,
  MARKETPLACE_LISTING_GRANTS_DEPLOY: false as const,
  MARKETPLACE_LISTING_GRANTS_BROADER_DATA_ACCESS: false as const,
  MARKETPLACE_MISSING_SCOPE_ALLOWED: false as const,
  KNOWLEDGE_EXCHANGE_WITHOUT_RIGHTS: false as const,
  KNOWLEDGE_EXCHANGE_WITHOUT_PROVENANCE: false as const,
  SEALED_SILENT_CLOUD_OR_UNIVERSE_FALLBACK: false as const,
  TOURNAMENT_WINNER_EQ_VERIFIED_PROOF: false as const,
  TOURNAMENT_WINNER_EQ_PRODUCTION_MODEL: false as const,
  UNCONFIGURED_MODEL_AVAILABLE: false as const,
  CAPACITY_PLANNER_CAN_SPEND: false as const,
  CAPACITY_PLANNER_CAN_PURCHASE: false as const,
  CAPACITY_PLANNER_CAN_BILL: false as const,
  UNVERIFIED_HARDWARE_PLANNED_AS_LIVE: false as const,
  INCUBATOR_SELF_PROMOTION_TO_PRODUCTION: false as const,
  INCUBATOR_CONSEQUENTIAL_WITHOUT_HUMAN_APPROVAL: false as const,
  RECOVERY_WITHOUT_AUTHORIZATION: false as const,
  UNSIGNED_RECOVERY_PACK_ACCEPTED: false as const,
  REVOKED_RECOVERY_PACK_ACCEPTED: false as const,
  ORCHESTRATION_EQ_AUTO_PROD_RESTORE: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  KERNEL_IS_COEXISTENCE_LAYER: true as const,
  KERNEL_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DF — XIV Capability Economy OS + Agent Tool/Plugin Commerce Layer + Distributed Knowledge Product Network + Continuous Model Research League + Adaptive Compute Planning Brain + Autonomous AI Business Factory + Multi-Universe Continuity Command Center' as const;

export const GITHUB_SOT_ISSUE = 122 as const;
export const GITLAB_COORDINATION_ISSUE = 56 as const;

export const MARKETPLACE_LISTING_NO_AUTHORITY =
  'MARKETPLACE_LISTING_DOES_NOT_GRANT_CREDENTIALS_BILLING_DEPLOY_OR_BROADER_ACCESS' as const;
export const MISSING_SCOPE_DENIED =
  'MARKETPLACE_OR_GATEWAY_MISSING_SCOPE_DENIED_BY_DEFAULT' as const;
export const KNOWLEDGE_EXCHANGE_RIGHTS_DENIED =
  'KNOWLEDGE_EXCHANGE_WITHOUT_EXPLICIT_DATA_RIGHTS_DENIED' as const;
export const KNOWLEDGE_EXCHANGE_PROVENANCE_DENIED =
  'KNOWLEDGE_EXCHANGE_WITHOUT_PROVENANCE_DENIED' as const;
export const SEALED_SILENT_ROUTE_DENIED =
  'SEALED_CONTENT_SILENT_CLOUD_OR_UNIVERSE_ROUTE_DENIED' as const;
export const TOURNAMENT_WINNER_NOT_PROOF =
  'TOURNAMENT_WINNER_OR_CONSENSUS_IS_NOT_VERIFIED_PROOF_OR_PRODUCTION_MODEL' as const;
export const UNCONFIGURED_MODEL_UNAVAILABLE =
  'UNCONFIGURED_MODEL_COMPETITION_TARGET_UNAVAILABLE' as const;
export const CAPACITY_PLANNER_SPEND_DENIED =
  'COMPUTE_CAPACITY_PLANNER_CANNOT_PURCHASE_OR_BILL' as const;
export const UNVERIFIED_HARDWARE_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_HARDWARE_NOT_PLANNED_AS_LIVE' as const;
export const INCUBATOR_SELF_PROMOTION_DENIED =
  'AI_COMPANY_INCUBATOR_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const INCUBATOR_HUMAN_APPROVAL_REQUIRED =
  'INCUBATOR_CONSEQUENTIAL_CHANGE_REQUIRES_HUMAN_APPROVAL_GATE' as const;
export const RECOVERY_WITHOUT_AUTH_DENIED =
  'RECOVERY_WITHOUT_EXPLICIT_AUTHORIZATION_DENIED' as const;
export const UNSIGNED_RECOVERY_PACK_REJECTED =
  'UNSIGNED_RESILIENCE_RECOVERY_PACK_REJECTED' as const;
export const REVOKED_RECOVERY_PACK_REJECTED =
  'REVOKED_RESILIENCE_RECOVERY_PACK_REJECTED' as const;
export const ORCHESTRATION_NOT_AUTO_PROD =
  'RESILIENCE_ORCHESTRATION_IS_NOT_AUTO_PRODUCTION_RESTORE' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'EXCHANGE_NODE_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_EXCHANGE_NODES = 512 as const;
export const MAX_MARKETPLACE_LISTINGS = 1024 as const;
export const MAX_FABRIC_PACKS = 512 as const;
export const MAX_TOURNAMENTS = 256 as const;
export const MAX_CAPACITY_TARGETS = 512 as const;
export const MAX_CAPACITY_LEDGER = 4096 as const;
export const MAX_INCUBATOR_COMPANIES = 512 as const;
export const MAX_RECOVERY_PACKS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DeActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'knowledge_exchange_curator'
  | 'marketplace_governor'
  | 'fabric_governor'
  | 'competition_lab_curator'
  | 'capacity_planner'
  | 'incubator_curator'
  | 'resilience_orchestrator'
  | 'ordinary_agent'
  | 'impersonator';

export type DeActor = {
  kind: DeActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
  scopes?: string[];
};

export type ExchangeNodeStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type HardwareKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type KnowledgeAssetClass =
  | 'approved_knowledge'
  | 'approved_index'
  | 'approved_model'
  | 'experiment_metadata'
  | 'sealed'
  | 'raw_private'
  | 'unapproved';

export type CapacityAction =
  | 'account'
  | 'forecast'
  | 'plan'
  | 'reserve'
  | 'release'
  | 'purchase'
  | 'bill'
  | 'spend';

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
    DD: {
      tipProbe:
        hasMod('cognitive-service-mesh-types.ts') ||
        has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DD_COGNITIVE_SERVICE_MESH_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'Preferred DD Cognitive Service Mesh tip + report. Poll with backoff when WAITING_DATA.',
    },
    DC: {
      tipProbe:
        hasMod('superbrain-service-fabric-types.ts') ||
        has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DC Superbrain Service Fabric fallback when DD absent.',
    },
    DB: {
      tipProbe:
        hasMod('superbrain-control-plane-types.ts') ||
        has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DB_SUPERBRAIN_CONTROL_PLANE_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DB Superbrain Control Plane fallback when DC absent.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel fallback when DB absent.',
    },
    CZ: {
      tipProbe:
        hasMod('intelligence-civilization-kernel-types.ts') ||
        has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CZ Intelligence Civilization Kernel fallback when DA absent.',
    },
    CY: {
      tipProbe:
        hasMod('knowledge-colony-operating-system-types.ts') ||
        has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CY Knowledge Colony OS sealed tip used when DD/DC/DB/DA/CZ WAITING_DATA.',
    },
    CX: {
      tipProbe:
        hasMod('persistent-knowledge-civilization-types.ts') ||
        has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CX Persistent Knowledge Civilization sealed tip.',
    },
  };
}
