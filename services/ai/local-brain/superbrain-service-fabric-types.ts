import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DC — XIV Superbrain Service Fabric + Agent Department API Mesh +
 * Distributed Memory Lake Streaming + Model Broker & Evaluation Grid +
 * Adaptive Accelerator Federation + Autonomous AI Product Studio Network +
 * Multi-Universe State Compiler & Disaster Recovery Fabric.
 *
 * SoT: GitHub #120. GitLab #54 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Service/API fabric formalizes boundaries — not production public exposure without gates.
 * Memory-lake streaming signed; sealed/raw private cannot silently stream.
 * Model broker local-first; continuous evaluation; consensus ≠ proof; unconfigured UNAVAILABLE.
 * Accelerator federation: verified only; classical baseline for quantum; no spend.
 * AI Product Studios isolated; no self-promote to production.
 * Multi-Universe state compiler: signed; DR = simulation/rollback planning ≠ real disaster
 * authorization / auto prod restore without gate.
 * Heartbeat truth; WAITING_NODE/OFFLINE_STOPPED; logical ≠ RUNNING_VERIFIED.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration applied.
 */

export const SUPERBRAIN_SERVICE_FABRIC_CYCLE = [
  'honesty_locks',
  'service_fabric_bootstrap',
  'api_mesh_sealed_auth_bypass_denied',
  'unsigned_memory_lake_stream_rejected',
  'sealed_raw_private_silent_stream_denied',
  'unconfigured_model_provider_unavailable',
  'broker_consensus_not_verified_proof',
  'unverified_accelerator_unavailable',
  'federation_cannot_spend_bill',
  'studio_self_promote_to_production_denied',
  'dr_simulation_not_auto_production_restore',
  'unsigned_revoked_state_compile_pack_rejected',
  'no_powered_node_waiting_or_offline_stopped',
  'evidence',
  'learning',
] as const;

export type DcHop = (typeof SUPERBRAIN_SERVICE_FABRIC_CYCLE)[number];

export type DcEvidenceState =
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
  | 'SEARCHABLE'
  | 'LINEAGED'
  | 'NEGATIVE_KEPT'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'HYPOTHESIS'
  | 'UNPROMOTED'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'CONSENSUS_ONLY'
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'ACCOUNTING_ONLY'
  | 'SIMULATION_ONLY'
  | 'ISOLATED';

export type DcHopRecord = {
  hop: DcHop;
  state: DcEvidenceState;
  summary: string;
  at: string;
};

export const DC_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  SERVICE_FABRIC_PUBLIC_EXPOSURE_WITHOUT_GATES: false as const,
  API_MESH_BYPASS_SEALED_AUTH: false as const,
  UNSIGNED_MEMORY_LAKE_STREAM_ACCEPTED: false as const,
  SILENT_SEALED_OR_RAW_PRIVATE_STREAM: false as const,
  UNCONFIGURED_MODEL_PROVIDER_AVAILABLE: false as const,
  CONSENSUS_EQ_VERIFIED_PROOF: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  FEDERATION_CAN_SPEND_MONEY: false as const,
  FEDERATION_CAN_BILL: false as const,
  STUDIO_SELF_PROMOTION_TO_PRODUCTION: false as const,
  STUDIO_ISOLATED: true as const,
  DR_SIMULATION_AUTO_PRODUCTION_RESTORE: false as const,
  UNSIGNED_STATE_COMPILE_PACK_ACCEPTED: false as const,
  REVOKED_STATE_COMPILE_PACK_ACCEPTED: false as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  LOGICAL_EQ_RUNNING_VERIFIED: false as const,
  LEARNING_GRANTS_PERMISSION: false as const,
  QUEUE_PRODUCTION_DEPLOY: false as const,
  SOUL_RESURRECTION_CLAIMS: false as const,
  MEGA_PR_BULK_INCLUDED: false as const,
  INVENTED_PASS: false as const,
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  LIVE_SUPABASE_APPLY: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FABRIC_IS_COEXISTENCE_LAYER: true as const,
  FABRIC_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DD — XIV Cognitive Service Mesh + Department Agent Gateway Network + Distributed Knowledge Lakehouse Federation + Model Evaluation & Routing Brain + Adaptive Compute Resource Exchange + Autonomous AI Venture Studio System + Multi-Universe Backup, Restore & Continuity Grid' as const;

export const GITHUB_SOT_ISSUE = 120 as const;
export const GITLAB_COORDINATION_ISSUE = 54 as const;

export const API_MESH_SEALED_AUTH_BYPASS_DENIED =
  'AGENT_DEPARTMENT_API_MESH_CANNOT_BYPASS_SEALED_OR_AUTH_SCOPES' as const;
export const UNSIGNED_MEMORY_LAKE_STREAM_REJECTED =
  'UNSIGNED_MEMORY_LAKE_STREAM_REJECTED' as const;
export const SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED =
  'SEALED_OR_RAW_PRIVATE_SILENT_MEMORY_LAKE_STREAM_DENIED' as const;
export const UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_MODEL_PROVIDER_UNAVAILABLE' as const;
export const BROKER_CONSENSUS_NOT_VERIFIED_PROOF =
  'MODEL_BROKER_CONSENSUS_ONLY_IS_NOT_VERIFIED_PROOF' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_ACCELERATOR_UNAVAILABLE' as const;
export const FEDERATION_SPEND_DENIED =
  'ADAPTIVE_ACCELERATOR_FEDERATION_CANNOT_SPEND_OR_BILL' as const;
export const STUDIO_SELF_PROMOTION_DENIED =
  'AI_PRODUCT_STUDIO_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const DR_SIMULATION_NOT_AUTO_RESTORE =
  'DR_SIMULATION_IS_NOT_AUTO_PRODUCTION_RESTORE' as const;
export const UNSIGNED_OR_REVOKED_STATE_PACK_REJECTED =
  'UNSIGNED_OR_REVOKED_MULTI_UNIVERSE_STATE_COMPILE_PACK_REJECTED' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_FABRIC_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'FABRIC_NODE_WITHOUT_HEARTBEAT_NOT_RUNNING_VERIFIED' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_FEDERATION_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;

export const MAX_FABRIC_SERVICES = 512 as const;
export const MAX_API_MESH_CALLS = 4096 as const;
export const MAX_MEMORY_STREAMS = 2048 as const;
export const MAX_MODEL_PROVIDERS = 256 as const;
export const MAX_BROKER_EVALS = 4096 as const;
export const MAX_ACCELERATOR_TARGETS = 512 as const;
export const MAX_FEDERATION_LEDGER = 4096 as const;
export const MAX_PRODUCT_STUDIOS = 1024 as const;
export const MAX_STATE_COMPILE_PACKS = 512 as const;
export const MAX_DR_PLANS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DcActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'service_fabric_curator'
  | 'department_api_governor'
  | 'memory_lake_streamer'
  | 'model_broker'
  | 'accelerator_federation_scheduler'
  | 'ai_product_studio_curator'
  | 'state_compiler_governor'
  | 'dr_planner'
  | 'ordinary_agent'
  | 'impersonator';

export type DcActor = {
  kind: DcActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type FabricNodeStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type AcceleratorKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type MemoryAssetClass =
  | 'approved_knowledge'
  | 'approved_index'
  | 'experiment_metadata'
  | 'sealed'
  | 'raw_private'
  | 'unapproved';

export type AuthScope =
  | 'public_gated'
  | 'org_internal'
  | 'sealed'
  | 'founder_sealed'
  | 'raw_private';

export type FederationAction =
  | 'account'
  | 'reserve'
  | 'release'
  | 'spend'
  | 'bill'
  | 'purchase';

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
    DB: {
      tipProbe:
        hasMod('distributed-superbrain-runtime-mesh-types.ts') ||
        has('62L_DB_DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DB_DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DB Distributed Superbrain Runtime Mesh tip + report. Poll with backoff when WAITING_DATA.',
    },
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'DA Superbrain Runtime Kernel — used as base when DB WAITING_DATA.',
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
      note: 'CZ Intelligence Civilization Kernel fallback when DA absent (sibling of DA on CY).',
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
      note: 'CY Knowledge Colony OS lineage under DA.',
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
      note: 'CX Persistent Knowledge Civilization sealed fallback.',
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
