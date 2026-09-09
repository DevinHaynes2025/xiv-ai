import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 62L-CW — XIV Autonomous Research Infrastructure OS + Persistent Offline Agent
 * Laboratories + Distributed Model/Tool Experiment Graph + Global Knowledge
 * Lakehouse + Adaptive Compute Fabric + Scientific Algorithm Discovery Foundry +
 * Universe Intelligence Replication Network.
 *
 * SoT: GitHub #114. GitLab #48 is coordination only.
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 *
 * L4_AUTONOMY_ENABLED=false.
 * Offline realism: if every authorized device is powered off → WAITING_NODE or
 * OFFLINE_STOPPED — do not pretend agents continue working.
 * Heartbeat-based workforce truth; RUNNING_VERIFIED only with evidence.
 * Model/tool/algorithm lineage required.
 * Knowledge lakehouse: governed; authorized sources; no unknown-rights data.
 * Adaptive compute: verified CPU/GPU/NPU/quantum only; classical baseline for
 * quantum; unconfigured → UNAVAILABLE.
 * Algorithm discovery: reproducible; negative results retained; hypothesis ≠ verified.
 * Universe intelligence replication: signed; explicitly authorized Universes/nodes
 * only; revocable; no raw private pooling by default.
 * Local-first; sealed never silent cloud fallback; learning ≠ permission;
 * Founder-sealed deny-by-default.
 * tip-land=NO. No mega-delta swallow.
 */

export const AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE = [
  'honesty_locks',
  'research_infra_os_bootstrap',
  'offline_lab_all_devices_powered_off',
  'heartbeat_missing_not_running_verified',
  'experiment_model_tool_lineage_required',
  'unauthorized_universe_replication_denied',
  'unsigned_revoked_replication_pack_rejected',
  'unconfigured_accelerator_qpu_unavailable',
  'quantum_without_classical_baseline_rejected',
  'unknown_rights_lakehouse_intake_denied',
  'algorithm_discovery_without_repro_not_verified',
  'sealed_no_silent_cloud_compute',
  'evidence',
  'learning',
] as const;

export type CwHop = (typeof AUTONOMOUS_RESEARCH_INFRASTRUCTURE_OS_CYCLE)[number];

export type CwEvidenceState =
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
  | 'REVOKED';

export type CwHopRecord = {
  hop: CwHop;
  state: CwEvidenceState;
  summary: string;
  at: string;
};

export const CW_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  FOUNDER_SEALED_DENY_BY_DEFAULT: true as const,
  LOCAL_FIRST: true as const,
  EVIDENCE_FIRST: true as const,
  RUNNING_VERIFIED_WITHOUT_HEARTBEAT: false as const,
  OFFLINE_DEVICES_PRETEND_RUNNING: false as const,
  MODEL_TOOL_EXPERIMENT_REQUIRES_LINEAGE: true as const,
  UNKNOWN_RIGHTS_LAKEHOUSE_INTAKE: false as const,
  UNVERIFIED_ACCELERATOR_AVAILABLE: false as const,
  UNCONFIGURED_TARGET_AVAILABLE: false as const,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED: true as const,
  ALGORITHM_VERIFIED_WITHOUT_REPRODUCIBILITY: false as const,
  HYPOTHESIS_EQ_VERIFIED: false as const,
  NEGATIVE_RESULTS_RETAINED: true as const,
  UNAUTHORIZED_UNIVERSE_REPLICATION: false as const,
  UNSIGNED_REPLICATION_PACK_ACCEPTED: false as const,
  REVOKED_REPLICATION_PACK_ACCEPTED: false as const,
  RAW_PRIVATE_POOLING_BY_DEFAULT: false as const,
  SEALED_SILENT_CLOUD_COMPUTE_FALLBACK: false as const,
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
  '62L-CX — XIV Persistent Knowledge Civilization + Offline Research Colony Network + Multi-Model Evolution Laboratory + Distributed Scientific Memory Fabric + Adaptive Accelerator Grid + Agent-Built Research Tool Ecosystem + Cross-Universe Intelligence Compiler' as const;

export const GITHUB_SOT_ISSUE = 114 as const;
export const GITLAB_COORDINATION_ISSUE = 48 as const;

export const ALL_DEVICES_OFFLINE_WAITING_OR_STOPPED =
  'ALL_AUTHORIZED_DEVICES_POWERED_OFF_WAITING_NODE_OR_OFFLINE_STOPPED' as const;
export const NO_HEARTBEAT_NOT_RUNNING_VERIFIED =
  'AGENT_OR_LAB_WITHOUT_HEARTBEAT_RUNTIME_EVIDENCE_NOT_RUNNING_VERIFIED' as const;
export const LINEAGE_REQUIRED =
  'EXPERIMENT_MODEL_OR_TOOL_NODE_REQUIRES_LINEAGE' as const;
export const UNAUTHORIZED_UNIVERSE_REPLICATION_DENIED =
  'UNAUTHORIZED_UNIVERSE_INTELLIGENCE_REPLICATION_DENIED' as const;
export const UNSIGNED_REPLICATION_REJECTED =
  'UNSIGNED_REPLICATION_PACK_REJECTED' as const;
export const REVOKED_REPLICATION_REJECTED =
  'REVOKED_REPLICATION_PACK_REJECTED' as const;
export const UNVERIFIED_ACCELERATOR_UNAVAILABLE =
  'UNVERIFIED_OR_UNCONFIGURED_ACCELERATOR_OR_QPU_UNAVAILABLE' as const;
export const QUANTUM_WITHOUT_BASELINE_REJECTED =
  'QUANTUM_PLACEMENT_WITHOUT_CLASSICAL_BASELINE_REJECTED' as const;
export const UNKNOWN_RIGHTS_LAKEHOUSE_DENIED =
  'UNKNOWN_RIGHTS_LAKEHOUSE_INTAKE_DENIED' as const;
export const ALGORITHM_NOT_VERIFIED_WITHOUT_REPRO =
  'ALGORITHM_DISCOVERY_WITHOUT_REPRODUCIBILITY_NOT_VERIFIED' as const;
export const SEALED_SILENT_CLOUD_COMPUTE_DENIED =
  'SEALED_CONTENT_CANNOT_SILENT_ROUTE_TO_CLOUD_COMPUTE' as const;
export const MEGA_DELTA_SWALLOW_DENIED =
  'ATTRIBUTION_UNSAFE_MEGA_DELTA_SWALLOW_DENIED' as const;
export const HYPOTHESIS_NOT_VERIFIED =
  'HYPOTHESIS_IS_NOT_VERIFIED_CLAIM' as const;

export const MAX_OFFLINE_LABS = 256 as const;
export const MAX_EXPERIMENT_GRAPH_NODES = 2048 as const;
export const MAX_LAKEHOUSE_OBJECTS = 4096 as const;
export const MAX_COMPUTE_TARGETS = 512 as const;
export const MAX_ALGORITHM_CANDIDATES = 1024 as const;
export const MAX_REPLICATION_PACKS = 512 as const;
export const HEARTBEAT_TTL_MS = 60_000 as const;

export type CwActorKind =
  | 'ceo_principal'
  | 'human_operator'
  | 'research_infra_curator'
  | 'offline_lab_governor'
  | 'experiment_graph_curator'
  | 'lakehouse_governor'
  | 'compute_fabric_scheduler'
  | 'algorithm_foundry_curator'
  | 'universe_replication_governor'
  | 'ordinary_agent'
  | 'impersonator';

export type CwActor = {
  kind: CwActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  role: string;
  permissionLevel: number;
  authorityLevel: number;
};

export type OfflineLabStatus =
  | 'REGISTERED'
  | 'RUNNING_VERIFIED'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'HEARTBEAT_STALE'
  | 'DENIED'
  | 'UNKNOWN';

export type ComputeTargetKind = 'cpu' | 'gpu' | 'npu' | 'quantum';

export type RightsClass =
  | 'authorized_owned'
  | 'authorized_licensed'
  | 'public_domain'
  | 'unknown_rights'
  | 'restricted'
  | 'stolen_or_leaked';

export type ExperimentGraphNodeKind = 'model' | 'tool' | 'experiment' | 'algorithm';

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
    CV: {
      tipProbe:
        hasMod('distributed-intelligence-laboratory-os-types.ts') ||
        has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CV_DISTRIBUTED_INTELLIGENCE_LABORATORY_OS_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note:
        'Preferred CV Distributed Intelligence Laboratory OS tip @ c35e474 + report. Poll with backoff when WAITING_DATA.',
    },
    CU: {
      tipProbe:
        hasMod('cognitive-research-cloud-types.ts') ||
        has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CU_COGNITIVE_RESEARCH_CLOUD_REPORT.md') ? 'PRESENT' : 'MISSING',
      note: 'CU Cognitive Research Cloud fallback when CV absent.',
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
    CP: {
      tipProbe:
        hasMod('knowledge-supply-plugin-foundry-types.ts') ||
        has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
          ? 'PRESENT'
          : 'WAITING_DATA',
      report: has('62L_CP_KNOWLEDGE_SUPPLY_PLUGIN_FOUNDRY_REPORT.md')
        ? 'PRESENT'
        : 'MISSING',
      note: 'CP Knowledge Supply / Plugin Foundry lineage.',
    },
  };
}
