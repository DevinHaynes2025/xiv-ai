import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CY — XIV Knowledge Colony Operating System + Persistent Agent Research
 * Societies + Multi-Model Intelligence Compiler + Distributed Memory/Experiment
 * Nervous System + Adaptive GPU/Quantum Compute Economy + Agent-Built AI Service
 * Foundry + Universe Knowledge Routing Grid.
 *
 * SoT: GitHub #116. GitLab #50 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Logical populations ≠ materialized ≠ RUNNING_VERIFIED workers.
 * Heartbeat truth; missing heartbeat → not RUNNING_VERIFIED.
 * Offline stop realism: no powered authorized node → WAITING_NODE / OFFLINE_STOPPED.
 * Compute/resource accounting cannot spend money / purchase / bill.
 * Multi-model consensus is never treated as verified proof.
 * Universe routing cannot silently move sealed or raw private data.
 * Unsigned route packs rejected; signed routes between authorized Universes only.
 * Verified AMD/NVIDIA/NPU/quantum only; classical baseline for quantum;
 * unconfigured → UNAVAILABLE.
 * Agent-built AI services: sandbox → gates; registration ≠ authority;
 * no self-promotion to production.
 * Local-first; Founder-sealed deny-by-default; learning ≠ permission.
 * tip-land=NO. No mega-delta swallow.
 */

export const KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE = [
  'honesty_locks',
  'colony_os_bootstrap',
  'logical_population_not_auto_running_verified',
  'society_missing_heartbeat_not_running_verified',
  'no_powered_node_waiting_or_stopped',
  'economy_cannot_spend_purchase_bill',
  'compiler_consensus_not_verified_proof',
  'nervous_system_sync_bounded',
  'unverified_gpu_qpu_unavailable',
  'quantum_without_classical_baseline_rejected',
  'service_self_promote_to_production_denied',
  'sealed_or_raw_private_silent_universe_route_denied',
  'unsigned_route_pack_rejected',
  'evidence',
  'learning',
] as const;

export type CyHop = (typeof KNOWLEDGE_COLONY_OPERATING_SYSTEM_CYCLE)[number];

export type CyEvidenceState =
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
  | 'ACCOUNTING_ONLY';

export type CyHopRecord = {
  hop: CyHop;
  state: CyEvidenceState;
  summary: string;
  at: string;
};

export const CY_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  LOGICAL_POPULATION_AUTO_RUNNING_VERIFIED: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  ECONOMY_CAN_SPEND_MONEY: false as const,
  ECONOMY_CAN_PURCHASE: false as const,
  ECONOMY_CAN_BILL: false as const,
  CONSENSUS_EQ_VERIFIED_PROOF: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  SERVICE_SELF_PROMOTION_TO_PRODUCTION: false as const,
  REGISTRATION_GRANTS_AUTHORITY: false as const,
  SERVICE_SANDBOX_UNTIL_GATES: true as const,
  SILENT_SEALED_OR_RAW_PRIVATE_UNIVERSE_ROUTE: false as const,
  UNSIGNED_ROUTE_PACK_ACCEPTED: false as const,
  UNAUTHORIZED_UNIVERSE_ROUTE: false as const,
  SEALED_SILENT_CLOUD_FALLBACK: false as const,
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
  '62L-CZ — XIV Intelligence Civilization Kernel + Autonomous Research Department Network + Multi-Model Cognitive Workbench + Distributed Knowledge/Experiment Event Fabric + GPU/NPU/Quantum Resource Scheduler + Agent-Generated AI Product Factory + Global Universe Routing & Recovery Mesh' as const;

export const GITHUB_SOT_ISSUE = 116 as const;
export const GITLAB_COORDINATION_ISSUE = 50 as const;

export const LOGICAL_POPULATION_NOT_RUNNING_VERIFIED =
  'LOGICAL_POPULATION_COUNT_IS_NOT_AUTO_RUNNING_VERIFIED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'SOCIETY_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;
export const NO_POWERED_NODE_WAITING_OR_STOPPED =
  'NO_POWERED_AUTHORIZED_NODE_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const ECONOMY_SPEND_DENIED =
  'COMPUTE_RESOURCE_ACCOUNTING_CANNOT_SPEND_PURCHASE_OR_BILL' as const;
export const CONSENSUS_NOT_VERIFIED_PROOF =
  'MULTI_MODEL_CONSENSUS_IS_NOT_VERIFIED_PROOF' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_GPU_OR_QPU_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_SCHEDULE_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const SERVICE_SELF_PROMOTION_DENIED =
  'AGENT_BUILT_AI_SERVICE_CANNOT_SELF_PROMOTE_TO_PRODUCTION' as const;
export const REGISTRATION_NO_AUTHORITY =
  'SERVICE_REGISTRATION_DOES_NOT_GRANT_AUTHORITY' as const;
export const SEALED_OR_RAW_PRIVATE_ROUTE_DENIED =
  'SEALED_OR_RAW_PRIVATE_DATA_SILENT_UNIVERSE_ROUTE_DENIED' as const;
export const UNSIGNED_ROUTE_PACK_REJECTED =
  'UNSIGNED_UNIVERSE_KNOWLEDGE_ROUTE_PACK_REJECTED' as const;
export const UNAUTHORIZED_UNIVERSE_ROUTE_DENIED =
  'UNAUTHORIZED_UNIVERSE_KNOWLEDGE_ROUTE_DENIED' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;

export const MAX_SOCIETIES = 256 as const;
export const MAX_LOGICAL_POPULATIONS = 1024 as const;
export const MAX_COMPILER_ARTIFACTS = 2048 as const;
export const MAX_NERVOUS_SYNC_EVENTS = 4096 as const;
export const MAX_COMPUTE_TARGETS = 512 as const;
export const MAX_ECONOMY_LEDGER_ENTRIES = 4096 as const;
export const MAX_AI_SERVICES = 1024 as const;
export const MAX_ROUTE_PACKS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type CyActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'colony_os_curator'
  | 'society_governor'
  | 'intelligence_compiler'
  | 'nervous_system_governor'
  | 'compute_economy_scheduler'
  | 'ai_service_foundry_curator'
  | 'universe_routing_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type CyActor = {
  kind: CyActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type SocietyStatus =
  | 'REGISTERED'
  | 'LOGICAL'
  | 'MATERIALIZED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type ComputeTargetKind = 'cpu' | 'amd' | 'nvidia' | 'npu' | 'quantum';

export type KnowledgeAssetClass =
  | 'approved_knowledge'
  | 'approved_skill'
  | 'approved_index'
  | 'approved_model'
  | 'experiment_metadata'
  | 'sealed'
  | 'raw_private'
  | 'unapproved';

export type EconomyAction =
  | 'account'
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
    CX: {
      tipProbe:
        hasMod('persistent-knowledge-civilization-types.ts') ||
        has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CX_PERSISTENT_KNOWLEDGE_CIVILIZATION_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CX Persistent Knowledge Civilization tip + report. Poll with backoff when WAITING_DATA.',
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
      note: 'CW Autonomous Research Infrastructure OS fallback when CX absent.',
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
      note: 'CV @ c35e474 fallback when CW absent.',
    },
    CU: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CU Cognitive Research Cloud lineage.',
    },
    CT: {
      tipProbe:
        hasMod('ai-research-civilization-os-types.ts') ||
        has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CT_AI_RESEARCH_CIVILIZATION_OS_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CT AI Research Civilization OS lineage.',
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
      note: 'CR Hybrid Supercompute Universe OS lineage.',
    },
  };
}
