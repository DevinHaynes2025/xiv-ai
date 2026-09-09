import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CZ — XIV Intelligence Civilization Kernel + Autonomous Research Department
 * Network + Multi-Model Cognitive Workbench + Distributed Knowledge/Experiment
 * Event Fabric + GPU/NPU/Quantum Resource Scheduler + Agent-Generated AI Product
 * Factory + Global Universe Routing & Recovery Mesh.
 *
 * SoT: GitHub #117. GitLab #51 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Consolidate into governed intelligence kernel — coexistence under Superbrain,
 * not unsafe mega-merge.
 * Logical ≠ materialized ≠ RUNNING_VERIFIED; heartbeat truth;
 * offline WAITING_NODE/OFFLINE_STOPPED.
 * Multi-model workbench: evidence + dissent workspaces; consensus ≠ proof.
 * Scheduler: verified AMD/NVIDIA/NPU/quantum only; classical baseline;
 * unconfigured UNAVAILABLE; no spend/bill.
 * Agent-generated AI product factory: sandbox → gates; no self-production-promote;
 * registration ≠ authority; no spend.
 * Universe routing/recovery: authorized only; signed; cannot silently move
 * sealed/raw private data; recovery cannot invent RUNNING_VERIFIED without heartbeat.
 * Local-first; Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow. No PR / no prod deploy / no DB migration applied.
 */

export const INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE = [
  'honesty_locks',
  'intelligence_civilization_kernel_bootstrap',
  'department_self_grant_production_authority_denied',
  'workbench_dissent_preserved',
  'consensus_only_not_verified_proof',
  'unverified_accelerator_qpu_unavailable',
  'quantum_without_classical_baseline_rejected',
  'product_factory_self_promote_denied',
  'sealed_raw_private_silent_universe_route_denied',
  'recovery_without_heartbeat_not_running_verified',
  'no_powered_node_waiting_or_offline_stopped',
  'accounting_scheduler_cannot_spend_bill',
  'evidence',
  'learning',
] as const;

export type CzHop = (typeof INTELLIGENCE_CIVILIZATION_KERNEL_CYCLE)[number];

export type CzEvidenceState =
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
  | 'REVOKED'
  | 'CONSENSUS'
  | 'DISSENT_PRESERVED'
  | 'EVIDENCE'
  | 'NOT_PROOF';

export type CzHopRecord = {
  hop: CzHop;
  state: CzEvidenceState;
  summary: string;
  at: string;
};

export const CZ_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  DEPARTMENT_SELF_GRANT_PRODUCTION_AUTHORITY: false as const,
  CONSENSUS_EQ_VERIFIED_PROOF: false as const,
  DISSENT_SILENCED_BY_MAJORITY: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  PRODUCT_FACTORY_SELF_PROMOTE: false as const,
  REGISTRATION_EQ_AUTHORITY: false as const,
  FACTORY_SPEND_ENABLED: false as const,
  SCHEDULER_SPEND_BILL_ENABLED: false as const,
  UNAUTHORIZED_UNIVERSE_ROUTE: false as const,
  UNSIGNED_UNIVERSE_ROUTE_ACCEPTED: false as const,
  SEALED_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE: false as const,
  RECOVERY_INVENTS_RUNNING_VERIFIED: false as const,
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
  KERNEL_IS_COEXISTENCE_LAYER: true as const,
  KERNEL_SWALLOWS_UNRELATED_MEGA_DELTA: false as const,
  UNSAFE_MEGA_MERGE: false as const,
});

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const NEXT_PHASE_TITLE =
  '62L-DA — XIV Superbrain Runtime Kernel + Autonomous Department Operating System + Neural Knowledge Event Bus + Local/Cloud Model Federation + Heterogeneous Compute Control Plane + Agent Software Company Factory + Distributed Universe Continuity Engine' as const;

export const GITHUB_SOT_ISSUE = 117 as const;
export const GITLAB_COORDINATION_ISSUE = 51 as const;

export const DEPARTMENT_SELF_GRANT_DENIED =
  'RESEARCH_DEPARTMENT_CANNOT_SELF_GRANT_PRODUCTION_AUTHORITY' as const;
export const DISSENT_PRESERVED =
  'WORKBENCH_DISSENT_PRESERVED_NOT_SILENCED_BY_MAJORITY_CONSENSUS' as const;
export const CONSENSUS_NOT_VERIFIED_PROOF =
  'CONSENSUS_ONLY_OUTPUT_NOT_LABELED_VERIFIED_PROOF' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_ACCELERATOR_OR_QPU_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_SCHEDULE_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const PRODUCT_FACTORY_SELF_PROMOTE_DENIED =
  'AGENT_PRODUCT_FACTORY_SELF_PRODUCTION_PROMOTE_DENIED' as const;
export const SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED =
  'SEALED_OR_RAW_PRIVATE_SILENT_UNIVERSE_ROUTE_DENIED' as const;
export const RECOVERY_NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'RECOVERY_CANNOT_INVENT_RUNNING_VERIFIED_WITHOUT_HEARTBEAT' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const ACCOUNTING_SCHEDULER_SPEND_DENIED =
  'ACCOUNTING_OR_SCHEDULER_CANNOT_SPEND_OR_BILL' as const;
export const UNSIGNED_UNIVERSE_ROUTE_REJECTED =
  'UNSIGNED_UNIVERSE_ROUTE_REJECTED' as const;
export const UNAUTHORIZED_UNIVERSE_ROUTE_DENIED =
  'UNAUTHORIZED_UNIVERSE_ROUTE_DENIED' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const REGISTRATION_NOT_AUTHORITY =
  'PRODUCT_REGISTRATION_IS_NOT_PRODUCTION_AUTHORITY' as const;

export const MAX_RESEARCH_DEPARTMENTS = 256 as const;
export const MAX_WORKBENCH_SESSIONS = 1024 as const;
export const MAX_EVENT_FABRIC_EVENTS = 8192 as const;
export const MAX_SCHEDULER_TARGETS = 512 as const;
export const MAX_PRODUCT_CANDIDATES = 1024 as const;
export const MAX_UNIVERSE_ROUTES = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type CzActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'intelligence_kernel_curator'
  | 'research_department_governor'
  | 'cognitive_workbench_curator'
  | 'event_fabric_curator'
  | 'resource_scheduler'
  | 'product_factory_governor'
  | 'universe_routing_governor'
  | 'ordinary_agent'
  | 'impersonator'
  | 'department_agent';

export type CzActor = {
  kind: CzActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type AcceleratorVendor = 'amd' | 'nvidia' | 'npu' | 'quantum' | 'cpu_classical';

export type MeshNodeStatus =
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

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
    CY: {
      tipProbe:
        hasMod('knowledge-colony-operating-system-types.ts') ||
        has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CY_KNOWLEDGE_COLONY_OPERATING_SYSTEM_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CY Knowledge Colony Operating System tip @ c182f7d + report. Used as base.',
    },
    CX: {
      tipProbe:
        hasMod('persistent-knowledge-civilization-types.ts') ||
        hasMod('knowledge-civilization-kernel-types.ts') ||
        has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md') ||
        has('62L_CX_KNOWLEDGE_CIVILIZATION_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report:
        has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md') ||
        has('62L_CX_KNOWLEDGE_CIVILIZATION_KERNEL_REPORT.md')
          ? 'PRESENT'
          : 'MISSING',
      note: 'CX Persistent Knowledge Civilization @ 63e79c1 in lineage.',
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
      note:
        'CW Autonomous Research Infrastructure OS @ 03584c6 in lineage.',
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
      note: 'CV Distributed Intelligence Laboratory OS @ c35e474 in lineage.',
    },
    CU: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CU Cognitive Research Cloud @ 2db3e44 in lineage; ops report may be MISSING.',
    },
    CT: {
      tipProbe:
        hasMod('ai-research-civilization-os-types.ts') ||
        has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CT AI Research Civilization OS when CU absent.',
    },
    CR: {
      tipProbe:
        hasMod('hybrid-supercompute-universe-os-types.ts') ||
        has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CR_HYBRID_SUPERCOMPUTE_UNIVERSE_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CR Hybrid Supercompute Universe OS fallback.',
    },
    CQ: {
      tipProbe:
        hasMod('offline-universe-quantum-genome-types.ts') ||
        has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CQ_OFFLINE_UNIVERSE_QUANTUM_GENOME_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CQ Offline Universe Quantum Genome lineage fallback.',
    },
  };
}
