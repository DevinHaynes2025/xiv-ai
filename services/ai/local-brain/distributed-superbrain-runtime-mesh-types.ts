import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DB — XIV Distributed Superbrain Runtime Mesh + Agent Department
 * Microservices + Neural Memory Streaming Fabric + Multi-Provider Model
 * Gateway + Universal Accelerator Scheduler + Autonomous Software R&D
 * Company Network + Universe State Replication & Recovery Grid.
 *
 * SoT: GitHub #119. GitLab #53 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Modular resilient mesh over DA kernel — not unsafe mega-merge of unrelated bulk.
 * Department microservices bounded; cannot self-grant production authority.
 * Memory streaming signed; sealed/raw private cannot silently stream cross-Universe/cloud.
 * Multi-provider model gateway: local-first; unconfigured UNAVAILABLE; consensus ≠ proof.
 * Accelerator scheduler: verified CPU/GPU/NPU/quantum only; classical baseline; no spend.
 * Software R&D workcells isolated; no self-promote/merge-to-prod.
 * Universe state replication: signed/revocable; recovery + rollback; authorized only.
 * Heartbeat truth; WAITING_NODE/OFFLINE_STOPPED; logical ≠ RUNNING_VERIFIED.
 * Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration applied.
 */

export const DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_CYCLE = [
  'honesty_locks',
  'distributed_superbrain_runtime_mesh_bootstrap',
  'microservice_self_escalate_production_authority_denied',
  'unsigned_memory_stream_rejected',
  'sealed_raw_private_silent_cross_universe_stream_denied',
  'unconfigured_provider_unavailable',
  'quantum_schedule_without_classical_baseline_rejected',
  'rnd_workcell_self_promote_merge_denied',
  'unsigned_revoked_replication_pack_rejected',
  'rollback_without_heartbeat_not_running_verified',
  'no_powered_node_waiting_or_offline_stopped',
  'scheduler_cannot_spend_bill',
  'consensus_only_gateway_output_not_verified_proof',
  'evidence',
  'learning',
] as const;

export type DbHop = (typeof DISTRIBUTED_SUPERBRAIN_RUNTIME_MESH_CYCLE)[number];

export type DbEvidenceState =
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
  | 'REUSED'
  | 'SIGNED'
  | 'UNSIGNED'
  | 'REVOKED'
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'FEDERATED'
  | 'CONSENSUS_ONLY'
  | 'SCHEDULED'
  | 'ROLLED_BACK';

export type DbHopRecord = {
  hop: DbHop;
  state: DbEvidenceState;
  summary: string;
  at: string;
};

export const DB_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  LOGICAL_EQ_RUNNING_VERIFIED: false as const,
  MATERIALIZED_EQ_RUNNING_VERIFIED: false as const,
  MICROSERVICE_SELF_ESCALATE_PRODUCTION_AUTHORITY: false as const,
  UNSIGNED_MEMORY_STREAM_ACCEPTED: false as const,
  SEALED_RAW_PRIVATE_SILENT_CROSS_UNIVERSE_STREAM: false as const,
  SEALED_RAW_PRIVATE_SILENT_CLOUD_STREAM: false as const,
  UNCONFIGURED_PROVIDER_AVAILABLE: false as const,
  UNCONFIGURED_MODEL_AVAILABLE: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  RND_WORKCELL_SELF_PROMOTE: false as const,
  RND_WORKCELL_MERGE_TO_PROD: false as const,
  REGISTRATION_EQ_AUTHORITY: false as const,
  UNSIGNED_REPLICATION_PACK_ACCEPTED: false as const,
  REVOKED_REPLICATION_PACK_ACCEPTED: false as const,
  ROLLBACK_INVENTS_RUNNING_VERIFIED: false as const,
  SCHEDULER_SPEND_ENABLED: false as const,
  SCHEDULER_BILL_ENABLED: false as const,
  CONSENSUS_EQ_PROOF: false as const,
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
  MESH_IS_MODULAR_RESILIENT: true as const,
  MESH_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DC — XIV Superbrain Service Fabric + Agent Department API Mesh + Distributed Memory Lake Streaming + Model Broker & Evaluation Grid + Adaptive Accelerator Federation + Autonomous AI Product Studio Network + Multi-Universe State Compiler & Disaster Recovery Fabric' as const;

export const GITHUB_SOT_ISSUE = 119 as const;
export const GITLAB_COORDINATION_ISSUE = 53 as const;

export const MICROSERVICE_SELF_ESCALATE_DENIED =
  'DEPARTMENT_MICROSERVICE_CANNOT_SELF_ESCALATE_PRODUCTION_AUTHORITY' as const;
export const UNSIGNED_MEMORY_STREAM_REJECTED =
  'UNSIGNED_MEMORY_STREAM_REJECTED' as const;
export const SEALED_RAW_PRIVATE_SILENT_STREAM_DENIED =
  'SEALED_OR_RAW_PRIVATE_SILENT_CROSS_UNIVERSE_OR_CLOUD_STREAM_DENIED' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_PROVIDER_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_SCHEDULE_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const RND_SELF_PROMOTE_DENIED =
  'RND_WORKCELL_SELF_PROMOTE_OR_MERGE_TO_PROD_DENIED' as const;
export const UNSIGNED_REPLICATION_REJECTED =
  'UNSIGNED_REPLICATION_PACK_REJECTED' as const;
export const REVOKED_REPLICATION_REJECTED =
  'REVOKED_REPLICATION_PACK_REJECTED' as const;
export const ROLLBACK_NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'ROLLBACK_DOES_NOT_INVENT_RUNNING_VERIFIED_WITHOUT_HEARTBEAT' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const SCHEDULER_SPEND_DENIED =
  'UNIVERSAL_ACCELERATOR_SCHEDULER_CANNOT_SPEND_OR_BILL' as const;
export const CONSENSUS_NOT_VERIFIED_PROOF =
  'CONSENSUS_ONLY_GATEWAY_OUTPUT_IS_NOT_VERIFIED_PROOF' as const;
export const REGISTRATION_NOT_AUTHORITY =
  'REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'MESH_NODE_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;

export const MAX_MESH_NODES = 1024 as const;
export const MAX_MICROSERVICES = 512 as const;
export const MAX_MEMORY_STREAMS = 4096 as const;
export const MAX_GATEWAY_PROVIDERS = 512 as const;
export const MAX_ACCELERATOR_TARGETS = 512 as const;
export const MAX_RND_WORKCELLS = 1024 as const;
export const MAX_REPLICATION_PACKS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DbActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'mesh_curator'
  | 'department_microservice_governor'
  | 'memory_stream_curator'
  | 'model_gateway_governor'
  | 'accelerator_scheduler'
  | 'rnd_network_governor'
  | 'replication_grid_governor'
  | 'ordinary_agent'
  | 'impersonator'
  | 'department_agent'
  | 'microservice_agent';

export type DbActor = {
  kind: DbActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type MeshNodeStatus =
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type AcceleratorKind = 'cpu' | 'gpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type MemoryContentClass = 'open' | 'sealed' | 'raw_private';

export type ProviderKind = 'local_model' | 'cloud_provider' | 'cloud_model';

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
    DA: {
      tipProbe:
        hasMod('superbrain-runtime-kernel-types.ts') ||
        has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_DA_SUPERBRAIN_RUNTIME_KERNEL_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred DA Superbrain Runtime Kernel tip + report. Used as base when PRESENT.',
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
      note: 'CZ Intelligence Civilization Kernel — WAITING_DATA if still landing.',
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
      note: 'CY Knowledge Colony OS in DA lineage.',
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
      note: 'CX Persistent Knowledge Civilization in lineage.',
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
      note: 'CW Autonomous Research Infrastructure OS @ 03584c6 in lineage.',
    },
  };
}
