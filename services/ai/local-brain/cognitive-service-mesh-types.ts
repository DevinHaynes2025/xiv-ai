import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DD — XIV Cognitive Service Mesh + Department Agent Gateway Network +
 * Distributed Knowledge Lakehouse Federation + Model Evaluation & Routing Brain +
 * Adaptive Compute Resource Exchange + Autonomous AI Venture Studio System +
 * Multi-Universe Backup, Restore & Continuity Grid.
 *
 * SoT: GitHub #121. GitLab #55 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Department-agent gateways governed; cannot bypass sealed/auth scopes.
 * Federated lakehouse routing: authorized/signed only; no raw private pooling
 * by default; sealed cannot silent-route.
 * Continuous local/cloud model evaluation; local-first; consensus ≠ proof;
 * unconfigured UNAVAILABLE.
 * Compute-resource matching: verified AMD/NVIDIA/NPU/quantum only; classical
 * baseline; no spend/billing authority.
 * AI venture studios: sandbox product candidates only; no self-promote to
 * production.
 * Multi-Universe backup/restore testing: signed; explicit recovery
 * authorization gates; test ≠ auto production restore.
 * Heartbeat truth; WAITING_NODE/OFFLINE_STOPPED; logical ≠ RUNNING_VERIFIED.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration.
 */

export const COGNITIVE_SERVICE_MESH_CYCLE = [
  'honesty_locks',
  'cognitive_service_mesh_bootstrap',
  'gateway_bypass_sealed_auth_denied',
  'raw_private_lakehouse_federation_denied',
  'unsigned_federation_or_backup_pack_rejected',
  'unconfigured_model_cloud_unavailable',
  'evaluation_consensus_not_verified_proof',
  'unverified_accelerator_exchange_denied',
  'resource_exchange_cannot_purchase_bill',
  'venture_studio_self_promote_denied',
  'restore_without_recovery_authorization_denied',
  'backup_restore_test_not_auto_production_restore',
  'no_powered_node_waiting_or_stopped',
  'evidence',
  'learning',
] as const;

export type DdHop = (typeof COGNITIVE_SERVICE_MESH_CYCLE)[number];

export type DdEvidenceState =
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
  | 'CONSENSUS_ONLY'
  | 'TEST_ONLY'
  | 'ACCOUNTING_ONLY'
  | 'LOGICAL';

export type DdHopRecord = {
  hop: DdHop;
  state: DdEvidenceState;
  summary: string;
  at: string;
};

export const DD_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  LOGICAL_AUTO_RUNNING_VERIFIED: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  GATEWAY_BYPASS_SEALED_AUTH: false as const,
  RAW_PRIVATE_LAKEHOUSE_FEDERATION_DEFAULT: false as const,
  UNSIGNED_FEDERATION_PACK_ACCEPTED: false as const,
  UNSIGNED_BACKUP_PACK_ACCEPTED: false as const,
  SEALED_SILENT_LAKEHOUSE_ROUTE: false as const,
  UNCONFIGURED_MODEL_AVAILABLE: false as const,
  UNCONFIGURED_CLOUD_AVAILABLE: false as const,
  CONSENSUS_EQ_VERIFIED_PROOF: false as const,
  UNVERIFIED_ACCELERATOR_EXCHANGE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  RESOURCE_EXCHANGE_CAN_SPEND: false as const,
  RESOURCE_EXCHANGE_CAN_PURCHASE: false as const,
  RESOURCE_EXCHANGE_CAN_BILL: false as const,
  VENTURE_SELF_PROMOTION_TO_PRODUCTION: false as const,
  VENTURE_SANDBOX_CANDIDATES_ONLY: true as const,
  RESTORE_WITHOUT_RECOVERY_AUTHORIZATION: false as const,
  BACKUP_TEST_AUTO_PRODUCTION_RESTORE: false as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MESH_IS_COEXISTENCE_LAYER: true as const,
  MESH_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DE — XIV Superbrain Knowledge Exchange Kernel + Agent Gateway Marketplace + Federated Data/Memory Fabric + Continuous Model Competition Lab + Distributed Compute Capacity Planner + Autonomous AI Company Incubator + Multi-Universe Resilience & Recovery Orchestrator' as const;

export const GITHUB_SOT_ISSUE = 121 as const;
export const GITLAB_COORDINATION_ISSUE = 55 as const;

export const GATEWAY_BYPASS_DENIED =
  'DEPARTMENT_AGENT_GATEWAY_BYPASS_OF_SEALED_OR_AUTH_SCOPE_DENIED' as const;
export const RAW_PRIVATE_FEDERATION_DENIED =
  'RAW_PRIVATE_LAKEHOUSE_FEDERATION_DENIED_BY_DEFAULT' as const;
export const UNSIGNED_FEDERATION_PACK_REJECTED =
  'UNSIGNED_LAKEHOUSE_FEDERATION_PACK_REJECTED' as const;
export const UNSIGNED_BACKUP_PACK_REJECTED =
  'UNSIGNED_MULTI_UNIVERSE_BACKUP_PACK_REJECTED' as const;
export const UNCONFIGURED_MODEL_UNAVAILABLE =
  'UNCONFIGURED_MODEL_OR_CLOUD_UNAVAILABLE' as const;
export const CONSENSUS_NOT_VERIFIED_PROOF =
  'MODEL_EVALUATION_CONSENSUS_IS_NOT_VERIFIED_PROOF' as const;
export const UNVERIFIED_ACCELERATOR_DENIED =
  'UNVERIFIED_OR_UNCONFIGURED_ACCELERATOR_EXCHANGE_DENIED_OR_UNAVAILABLE' as const;
export const RESOURCE_EXCHANGE_SPEND_DENIED =
  'COMPUTE_RESOURCE_EXCHANGE_CANNOT_PURCHASE_OR_BILL' as const;
export const VENTURE_SELF_PROMOTION_DENIED =
  'AI_VENTURE_STUDIO_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const RESTORE_WITHOUT_AUTH_DENIED =
  'RESTORE_WITHOUT_EXPLICIT_RECOVERY_AUTHORIZATION_DENIED' as const;
export const BACKUP_TEST_NOT_AUTO_PROD =
  'BACKUP_RESTORE_TEST_IS_NOT_AUTO_PRODUCTION_RESTORE' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'MESH_NODE_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const SEALED_SILENT_ROUTE_DENIED =
  'SEALED_CONTENT_SILENT_LAKEHOUSE_OR_CLOUD_ROUTE_DENIED' as const;

export const MAX_MESH_NODES = 512 as const;
export const MAX_GATEWAYS = 256 as const;
export const MAX_FEDERATION_PACKS = 512 as const;
export const MAX_MODEL_TARGETS = 512 as const;
export const MAX_EVAL_ARTIFACTS = 2048 as const;
export const MAX_EXCHANGE_TARGETS = 512 as const;
export const MAX_EXCHANGE_LEDGER = 4096 as const;
export const MAX_VENTURE_PRODUCTS = 1024 as const;
export const MAX_BACKUP_PACKS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DdActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'mesh_curator'
  | 'department_gateway_governor'
  | 'lakehouse_federation_governor'
  | 'model_routing_brain'
  | 'compute_exchange_scheduler'
  | 'venture_studio_curator'
  | 'continuity_grid_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type DdActor = {
  kind: DdActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
  sealedScope?: boolean;
  authScope?: string[];
};

export type MeshNodeStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type AcceleratorKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type LakehouseAssetClass =
  | 'approved_knowledge'
  | 'approved_index'
  | 'approved_model'
  | 'experiment_metadata'
  | 'sealed'
  | 'raw_private'
  | 'unapproved';

export type ExchangeAction =
  | 'account'
  | 'match'
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
    DC: {
      tipProbe:
        hasMod('superbrain-service-fabric-types.ts') ||
        has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DC_SUPERBRAIN_SERVICE_FABRIC_REPORT.md') ? 'PRESENT' : 'MISSING',
      note:
        'Preferred DC Superbrain Service Fabric tip + report. Poll with backoff when WAITING_DATA.',
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
        hasMod('superbrain-os-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ||
        has('62L_DA_SUPERBRAIN_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ||
        has('62L_DA_SUPERBRAIN_OS_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'DA Superbrain Runtime Kernel / OS fallback when DB absent.',
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
      note: 'CY Knowledge Colony OS sealed tip used when DC/DB/DA/CZ WAITING_DATA.',
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
    CW: {
      tipProbe:
        hasMod('autonomous-research-infrastructure-os-types.ts') ||
        has('62L_CW_AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CW_AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CW Autonomous Research Infrastructure OS lineage.',
    },
  };
}
