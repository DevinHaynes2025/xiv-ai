import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-DA — XIV Superbrain Runtime Kernel + Autonomous Department Operating
 * System + Neural Knowledge Event Bus + Local/Cloud Model Federation +
 * Heterogeneous Compute Control Plane + Agent Software Company Factory +
 * Distributed Universe Continuity Engine.
 *
 * SoT: GitHub #118. GitLab #52 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Coherent runtime kernel over advanced subsystems — not undifferentiated mega-merge.
 * Exact agent/workcell state tracking; RUNNING_VERIFIED only with heartbeat/runtime evidence.
 * Offline: WAITING_NODE / OFFLINE_STOPPED when no powered authorized node.
 * Logical ≠ materialized ≠ RUNNING_VERIFIED.
 * Bounded department operating systems; cannot self-grant production authority.
 * Signed knowledge-event routing; sealed/raw private cannot silently cross Universes/cloud.
 * Local-first cloud/model federation; unconfigured providers UNAVAILABLE.
 * AMD/NVIDIA/NPU/quantum placement: verified only; classical baseline for quantum; no spend authority.
 * Agent-run sandbox software factory; no self-promote to production; registration ≠ authority.
 * Universe continuity/recovery: signed/revocable; authorized only.
 * Consensus ≠ proof; Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration applied.
 */

export const SUPERBRAIN_RUNTIME_KERNEL_CYCLE = [
  'honesty_locks',
  'superbrain_runtime_kernel_bootstrap',
  'department_self_grant_production_authority_denied',
  'unsigned_knowledge_event_rejected',
  'sealed_raw_private_silent_federation_universe_denied',
  'unconfigured_cloud_model_accelerator_unavailable',
  'quantum_without_classical_baseline_rejected',
  'software_factory_self_promote_merge_denied',
  'continuity_pack_unsigned_revoked_rejected',
  'control_plane_cannot_spend_bill',
  'missing_heartbeat_not_running_verified',
  'no_powered_node_waiting_or_offline_stopped',
  'logical_population_not_running_verified',
  'evidence',
  'learning',
] as const;

export type DaHop = (typeof SUPERBRAIN_RUNTIME_KERNEL_CYCLE)[number];

export type DaEvidenceState =
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
  | 'FEDERATED';

export type DaHopRecord = {
  hop: DaHop;
  state: DaEvidenceState;
  summary: string;
  at: string;
};

export const DA_LOCKS = Object.freeze({
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
  DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY: false as const,
  UNSIGNED_KNOWLEDGE_EVENT_ACCEPTED: false as const,
  SEALED_RAW_PRIVATE_SILENT_FEDERATION: false as const,
  SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE: false as const,
  UNCONFIGURED_CLOUD_PROVIDER_AVAILABLE: false as const,
  UNCONFIGURED_MODEL_AVAILABLE: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  SOFTWARE_FACTORY_SELF_PROMOTE: false as const,
  SOFTWARE_FACTORY_MERGE_TO_PROD: false as const,
  REGISTRATION_EQ_AUTHORITY: false as const,
  UNSIGNED_CONTINUITY_PACK_ACCEPTED: false as const,
  REVOKED_CONTINUITY_PACK_ACCEPTED: false as const,
  CONTROL_PLANE_SPEND_ENABLED: false as const,
  CONTROL_PLANE_BILL_ENABLED: false as const,
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
  OS_IS_COEXISTENCE_LAYER: true as const,
  OS_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DB — XIV Distributed Superbrain Runtime Mesh + Agent Department Microservices + Neural Memory Streaming Fabric + Multi-Provider Model Gateway + Universal Accelerator Scheduler + Autonomous Software R&D Company Network + Universe State Replication & Recovery Grid' as const;

export const GITHUB_SOT_ISSUE = 118 as const;
export const GITLAB_COORDINATION_ISSUE = 52 as const;

export const DEPARTMENT_SELF_GRANT_DENIED =
  'DEPARTMENT_CANNOT_SELF_GRANT_PRODUCTION_AUTHORITY' as const;
export const UNSIGNED_KNOWLEDGE_EVENT_REJECTED =
  'UNSIGNED_KNOWLEDGE_EVENT_REJECTED' as const;
export const SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED =
  'SEALED_OR_RAW_PRIVATE_SILENT_FEDERATION_OR_UNIVERSE_ROUTE_DENIED' as const;
export const UNCONFIGURED_PROVIDER_UNAVAILABLE =
  'UNCONFIGURED_CLOUD_MODEL_OR_ACCELERATOR_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PLACEMENT_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const SOFTWARE_FACTORY_SELF_PROMOTE_DENIED =
  'SOFTWARE_FACTORY_SELF_PROMOTE_OR_MERGE_TO_PROD_DENIED' as const;
export const UNSIGNED_CONTINUITY_REJECTED =
  'UNSIGNED_CONTINUITY_PACK_REJECTED' as const;
export const REVOKED_CONTINUITY_REJECTED =
  'REVOKED_CONTINUITY_PACK_REJECTED' as const;
export const CONTROL_PLANE_SPEND_DENIED =
  'HETEROGENEOUS_COMPUTE_CONTROL_PLANE_CANNOT_SPEND_OR_BILL' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'AGENT_OR_WORKCELL_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const LOGICAL_NOT_RUNNING_VERIFIED =
  'LOGICAL_POPULATION_IS_NOT_RUNNING_VERIFIED' as const;
export const REGISTRATION_NOT_AUTHORITY =
  'REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_DEPARTMENTS = 256 as const;
export const MAX_KNOWLEDGE_EVENTS = 4096 as const;
export const MAX_FEDERATION_MEMBERS = 512 as const;
export const MAX_COMPUTE_TARGETS = 512 as const;
export const MAX_SOFTWARE_PRODUCTS = 1024 as const;
export const MAX_CONTINUITY_PACKS = 512 as const;
export const MAX_WORKCELLS = 1024 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type DaActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'superbrain_kernel_curator'
  | 'department_os_governor'
  | 'knowledge_event_bus_curator'
  | 'model_federation_governor'
  | 'compute_control_plane'
  | 'software_factory_governor'
  | 'universe_continuity_governor'
  | 'ordinary_agent'
  | 'impersonator'
  | 'department_agent';

export type DaActor = {
  kind: DaActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type WorkcellStatus =
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type AcceleratorKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type KnowledgeContentClass = 'open' | 'sealed' | 'raw_private';

export type FederationMemberKind = 'local_model' | 'cloud_provider' | 'cloud_model';

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
    CZ: {
      tipProbe:
        hasMod('intelligence-civilization-kernel-types.ts') ||
        has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CZ_INTELLIGENCE_CIVILIZATION_KERNEL_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CZ Intelligence Civilization Kernel tip + report. WAITING_DATA if still landing.',
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
      note: 'CY Knowledge Colony OS — used as base when CZ WAITING_DATA.',
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
      note: 'CX Persistent Knowledge Civilization in CY lineage.',
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
    CV: {
      tipProbe:
        hasMod('distributed-intelligence-laboratory-os-types.ts') ||
        has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CV @ c35e474 in lineage.',
    },
  };
}
