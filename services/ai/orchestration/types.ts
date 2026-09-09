/**
 * 62L-GOB Local-First / Offline Agent Civilization
 *
 * Canonical ownership: **Global Operations Brain** (not Enterprise OS).
 * Soft-wire HC1–HC4 / compute-graph / core-compute / identity ES33 /
 * existing services/ai/* via existsSync. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR / no main merge.
 *
 * Local worktree access ≠ offline model inference.
 * Never claim agents operate offline unless a real local process,
 * model/runtime, and fresh heartbeat prove it.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_LABEL = '62L-GOB-LOCAL-FIRST' as const;
export const GITHUB_SOT_FAMILY = '62L-GOB' as const;
export const GITHUB_SOT_TITLE =
  '62L-GOB Local-First / Offline Agent Civilization — orchestration spine; message bus; bounded local worker; CPU-safe compute; DNA; packs; sync; control tower; L4=false' as const;

export const CANONICAL_BRAIN_OWNER = 'Global Operations Brain' as const;

export const ENTERPRISE_OS_NOTE =
  'Enterprise OS may reference/depend on Global Operations Brain local-first spine — MUST NOT copy into a parallel enterprise-only brain.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: MCP needsAuth / not resolved — no issue number invented.' as const;

export const GOB_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'Founder-authorized local model/runtime verification on enrolled Home Base node (CPU load+execute+heartbeat) — then optional AMD GPU/NPU probe under NOT_TESTED honesty.' as const;

export const HOME_BASE_CONCEPTUAL_PATH =
  'C:\\Users\\Devin\\xiv-ai (founder local worktree — implement portable relative paths in-repo)' as const;

/** Ordered advancement ladder — never skip. */
export const TRUTH_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type TruthLadderState = (typeof TRUTH_LADDER)[number];

export const COMPUTE_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'OFFLINE_STOPPED',
  'WAITING_NODE',
  'UNAVAILABLE',
] as const;

export type ComputeState = (typeof COMPUTE_STATES)[number];

export const CONTROL_TOWER_STATES = [
  'RUNNING_VERIFIED',
  'LOCAL_ONLY',
  'WAITING_NODE',
  'WAITING_DATA',
  'DEGRADED',
  'OFFLINE_STOPPED',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type ControlTowerState = (typeof CONTROL_TOWER_STATES)[number];

export const ALLOWED_TASK_CLASSES = [
  'LOCAL_SEARCH',
  'KNOWLEDGE_RETRIEVAL',
  'DOCUMENT_INDEXING',
  'CODE_ANALYSIS',
  'UNIT_TEST_PREPARATION',
  'CLASSICAL_QUANT_ANALYSIS',
  'SIMULATION',
  'BENCHMARK_ANALYSIS',
  'HISTORICAL_KNOWLEDGE_RETRIEVAL',
  'TASK_PLANNING',
  'EVIDENCE_REVIEW',
  'KNOWLEDGE_DEDUPLICATION',
] as const;

export type AllowedTaskClass = (typeof ALLOWED_TASK_CLASSES)[number];

export const DATA_CLASSES = [
  'PUBLIC_REFERENCE',
  'XIV_OWNED',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'EVIDENCE',
  'POLICY',
  'SKILL_CANDIDATE',
] as const;

export type DataClass = (typeof DATA_CLASSES)[number];

export const STORAGE_LOCATION_CLASSES = [
  'HOME_BASE',
  'LOCAL_NODE',
  'OFFLINE_PACK',
  'BACKUP',
  'AUTHORIZED_CLOUD',
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
] as const;

export type StorageLocationClass = (typeof STORAGE_LOCATION_CLASSES)[number];

export const OFFLINE_PACK_IDS = [
  'XIV_CORE',
  'SUPPLY_CHAIN',
  'GOVERNMENT_CONTRACTS',
  'SEMICONDUCTORS',
  'BUSINESS_HISTORY',
  'NEGOTIATION',
  'QUANTUM_RESEARCH',
  'SCIENCE_ENGINEERING',
  'AGENT_SKILLS',
] as const;

export type OfflinePackId = (typeof OFFLINE_PACK_IDS)[number];

export const LOCAL_LEARNING_STATES = [
  'LOCAL_CANDIDATE',
  'RECEIVED',
  'REVIEW_REQUIRED',
  'VALIDATED',
  'PROMOTED',
  'REJECTED',
] as const;

export type LocalLearningState = (typeof LOCAL_LEARNING_STATES)[number];

export const KG_NODE_KINDS = [
  'Source',
  'Claim',
  'Entity',
  'Domain',
  'Problem',
  'Algorithm',
  'Workload',
  'Runtime',
  'Hardware',
  'Benchmark',
  'Decision',
  'Outcome',
  'Lesson',
] as const;

export type KgNodeKind = (typeof KG_NODE_KINDS)[number];

export const KG_NODE_STATES = [
  'HYPOTHESIS',
  'DOCUMENTED',
  'SUPPORTED',
  'MEASURED',
  'VERIFIED',
  'CONTRADICTED',
  'STALE',
  'REGRESSED',
  'REJECTED',
] as const;

export type KgNodeState = (typeof KG_NODE_STATES)[number];

export const REVOCATION_STATES = [
  'ACTIVE',
  'REVOKED',
  'EXPIRED',
  'SUSPENDED',
] as const;

export type RevocationState = (typeof REVOCATION_STATES)[number];

export const RUNTIME_STATES = [
  'IDLE',
  'RUNNING',
  'WAITING_DATA',
  'WAITING_NODE',
  'CHECKPOINTED',
  'OFFLINE_STOPPED',
  'FAILED',
  'COMPLETED',
  'REVOKED',
] as const;

export type RuntimeState = (typeof RUNTIME_STATES)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type TenantScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type AgentContract = {
  agentId: string;
  agentType: string;
  homeUniverseId: string;
  tenantId: string;
  parentAgentId: string | null;
  missionId: string;
  taskId: string;
  allowedTools: readonly string[];
  allowedDataClasses: readonly DataClass[];
  computeBudget: number;
  storageBudget: number;
  dependencies: readonly string[];
  heartbeat: AgentHeartbeat | null;
  runtimeState: RuntimeState;
  returnPath: string;
  expiry: string;
  revocationState: RevocationState;
};

export type AgentHeartbeat = {
  agentId: string;
  nodeId: string;
  observedAt: string;
  state: ControlTowerState;
  detail?: string;
};

export type AgentReturnPayload = {
  result: unknown;
  evidence: readonly string[];
  tests: readonly string[];
  failures: readonly string[];
  contradictions: readonly string[];
  blockers: readonly string[];
  lessons: readonly string[];
  candidateSkills: readonly string[];
  nextAction: string;
};

export type MessageEnvelope = {
  messageId: string;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  senderAgentId: string;
  receiverAgentId: string;
  tenantId: string;
  homeUniverseId: string;
  purpose: string;
  dataClass: DataClass;
  payloadType: string;
  payload: Readonly<Record<string, unknown>>;
  evidenceRefs: readonly string[];
  createdAt: string;
  expiresAt: string;
  acknowledgement: 'NONE' | 'PENDING' | 'ACKED' | 'NACKED';
  signatureHash: string;
};

export type CheckpointRecord = {
  checkpointId: string;
  agentId: string;
  missionId: string;
  taskId: string;
  tenantId: string;
  homeUniverseId: string;
  runtimeState: RuntimeState;
  progressSummary: string;
  evidenceRefs: readonly string[];
  dependencySnapshot: readonly string[];
  computeState: ComputeState;
  createdAt: string;
  hash: string;
};

export type GobSoftWireSnapshot = {
  hc1HybridComputeHomeBase: SoftWirePresence;
  hc2ChipBottleneckAnalyzer: SoftWirePresence;
  hc3ComputeGraph: SoftWirePresence;
  hc4CoreCompute: SoftWirePresence;
  identityEs33: SoftWirePresence;
  localRuntime: SoftWirePresence;
  agentRouter: SoftWirePresence;
  modelRouter: SoftWirePresence;
  policies: SoftWirePresence;
  auth: SoftWirePresence;
  audit: SoftWirePresence;
  persistence: SoftWirePresence;
  diagnostics: SoftWirePresence;
  offlineBrainPackager: SoftWirePresence;
  pathwayPlasticity: SoftWirePresence;
};

export const GOB_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  MERGE_MAIN: false as const,

  PRESENCE_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  FABRICATE_GPU_VERIFIED: false as const,
  FABRICATE_NPU_VERIFIED: false as const,
  FABRICATE_OFFLINE_INFERENCE: false as const,
  FABRICATE_FRESH_DATA_WHEN_OFFLINE: false as const,
  LOCAL_WORKTREE_EQ_OFFLINE_INFERENCE: false as const,
  AGENTS_WORKING_WHILE_MACHINE_OFF: false as const,

  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  CROSS_TENANT_POOLING: false as const,
  AUTO_CLOUD_PURCHASE: false as const,
  SEALED_LOCAL_SILENT_CLOUD: false as const,
  TENANT_PRIVATE_GLOBAL_TRAINING: false as const,
  AUTO_GLOBALIZE_LOCAL_LEARNING: false as const,
  HIDDEN_COT_PERSISTENCE: false as const,
  UNSTRUCTURED_SHARED_GLOBAL_MEMORY: false as const,

  CLONE_VENDOR_PROPRIETARY_DB: false as const,
  CLONE_PRIVATE_INFRA_TRADE_SECRETS: false as const,
  CLONE_FIRMWARE_RESTRICTED_SOURCE: false as const,
  CLONE_PRIVATE_CHIP_IP: false as const,
  CLONE_CROSS_TENANT_CUSTOMER_DATA: false as const,

  PLASTICITY_MAY_CHANGE_PERMISSIONS: false as const,
  PLASTICITY_MAY_BYPASS_GUARDIAN: false as const,
  PLASTICITY_MAY_CHANGE_RLS: false as const,
  PLASTICITY_MAY_CHANGE_TENANT_BOUNDARIES: false as const,
  PLASTICITY_MAY_CHANGE_PRODUCTION_BILLING_CONTRACT: false as const,

  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME: true as const,
  ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN: false as const,
});

export const GOB_MAY = Object.freeze([
  'orchestrate_approved_local_research_indexing_retrieval_testing_simulation',
  'route_agent_messages_with_tenant_universe_isolation',
  'run_bounded_local_worker_on_allowed_task_classes',
  'cpu_safe_baseline_compute_with_truth_states',
  'checkpoint_and_return_receipts_to_home_base',
  'governed_replication_per_policy',
  'offline_brain_pack_manifest_and_sync_with_revocation_first',
  'plasticity_ranking_routing_retest_recommendation_confidence_only',
  'soft_wire_hc1_hc4_identity_local_runtime_when_present',
  'clone_xiv_owned_portable_dna_structures_only',
] as const);

export const GOB_MUST_NOT = Object.freeze([
  'claim_offline_inference_without_process_model_heartbeat',
  'fabricate_fresh_data_when_offline',
  'claim_gpu_npu_verified_without_load_execute_confirm_benchmark',
  'auto_globalize_local_learning',
  'silent_cloud_sealed_local_or_tenant_private_training',
  'persist_hidden_chain_of_thought',
  'weaken_guardian_rls_or_expand_permissions',
  'clone_vendor_proprietary_or_cross_tenant_data',
  'enable_l4_autonomy',
  'merge_main_or_open_pr_without_founder',
] as const);

export function assertGobLocksIntact(): boolean {
  return (
    GOB_LOCKS.L4_AUTONOMY_ENABLED === false &&
    GOB_LOCKS.TIP_LAND === false &&
    GOB_LOCKS.MERGE_MAIN === false &&
    GOB_LOCKS.MANAGE_PULL_REQUEST === false &&
    GOB_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    GOB_LOCKS.DB_CANDIDATES_APPLIED === false &&
    GOB_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    GOB_LOCKS.FABRICATE_OFFLINE_INFERENCE === false &&
    GOB_LOCKS.FABRICATE_FRESH_DATA_WHEN_OFFLINE === false &&
    GOB_LOCKS.LOCAL_WORKTREE_EQ_OFFLINE_INFERENCE === false &&
    GOB_LOCKS.AGENTS_WORKING_WHILE_MACHINE_OFF === false &&
    GOB_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    GOB_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    GOB_LOCKS.CROSS_TENANT_POOLING === false &&
    GOB_LOCKS.AUTO_CLOUD_PURCHASE === false &&
    GOB_LOCKS.SEALED_LOCAL_SILENT_CLOUD === false &&
    GOB_LOCKS.TENANT_PRIVATE_GLOBAL_TRAINING === false &&
    GOB_LOCKS.AUTO_GLOBALIZE_LOCAL_LEARNING === false &&
    GOB_LOCKS.HIDDEN_COT_PERSISTENCE === false &&
    GOB_LOCKS.UNSTRUCTURED_SHARED_GLOBAL_MEMORY === false &&
    GOB_LOCKS.CLONE_VENDOR_PROPRIETARY_DB === false &&
    GOB_LOCKS.CLONE_PRIVATE_INFRA_TRADE_SECRETS === false &&
    GOB_LOCKS.CLONE_FIRMWARE_RESTRICTED_SOURCE === false &&
    GOB_LOCKS.CLONE_PRIVATE_CHIP_IP === false &&
    GOB_LOCKS.CLONE_CROSS_TENANT_CUSTOMER_DATA === false &&
    GOB_LOCKS.PLASTICITY_MAY_CHANGE_PERMISSIONS === false &&
    GOB_LOCKS.PLASTICITY_MAY_BYPASS_GUARDIAN === false &&
    GOB_LOCKS.PLASTICITY_MAY_CHANGE_RLS === false &&
    GOB_LOCKS.PLASTICITY_MAY_CHANGE_TENANT_BOUNDARIES === false &&
    GOB_LOCKS.PLASTICITY_MAY_CHANGE_PRODUCTION_BILLING_CONTRACT === false &&
    GOB_LOCKS.GLOBAL_OPERATIONS_BRAIN_IS_CANONICAL_HOME === true &&
    GOB_LOCKS.ENTERPRISE_OS_MAY_BUILD_PARALLEL_BRAIN === false &&
    GOB_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    GOB_LOCKS.RECOMMEND_EQ_ACT === false
  );
}

export function scopesMatch(a: TenantScope, b: TenantScope): boolean {
  return (
    a.orgId === b.orgId &&
    a.tenantId === b.tenantId &&
    a.universeId === b.universeId
  );
}

export function softWireHopState(
  present: boolean,
): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

function softWireFile(
  fromDir: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(fromDir, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (caller maps via softWireHopState).
 */
export function gobSoftWireSnapshot(repoRoot?: string): GobSoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../..');
  const ai = join(here, '..');
  const localBrain = join(ai, 'local-brain');
  const computeGraph = join(ai, 'compute-graph');
  const coreCompute = join(ai, 'core-compute');
  const localRuntime = join(ai, 'local-runtime');

  return {
    hc1HybridComputeHomeBase: softWireFile(
      localBrain,
      'hybrid-compute-home-base-types.ts',
      'HC1 Hybrid Compute Home Base PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC1 absent — soft-wire WAITING_DATA.',
    ),
    hc2ChipBottleneckAnalyzer: softWireFile(
      localBrain,
      'chip-bottleneck-analyzer-types.ts',
      'HC2 Chip Bottleneck Analyzer PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC2 absent — soft-wire WAITING_DATA.',
    ),
    hc3ComputeGraph: softWireFile(
      computeGraph,
      'types.ts',
      'HC3 compute-graph PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC3 absent — soft-wire WAITING_DATA.',
    ),
    hc4CoreCompute: softWireFile(
      coreCompute,
      'types.ts',
      'HC4 core-compute PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC4 absent — soft-wire WAITING_DATA.',
    ),
    identityEs33: softWireFile(
      localBrain,
      'unified-identity-account-federation-types.ts',
      'ES33 identity federation PRESENT (soft-wire). Presence≠VERIFIED.',
      'ES33 absent — soft-wire WAITING_DATA.',
    ),
    localRuntime: softWireFile(
      localRuntime,
      'types.ts',
      'local-runtime PRESENT (soft-wire). Presence≠VERIFIED.',
      'local-runtime absent — soft-wire WAITING_DATA.',
    ),
    agentRouter: softWireFile(
      ai,
      'agent-router.ts',
      'agent-router PRESENT — reuse, do not duplicate.',
      'agent-router absent — soft-wire WAITING_DATA.',
    ),
    modelRouter: softWireFile(
      ai,
      'model-router.ts',
      'model-router PRESENT — reuse, do not duplicate.',
      'model-router absent — soft-wire WAITING_DATA.',
    ),
    policies: softWireFile(
      ai,
      'policies.ts',
      'policies PRESENT — reuse, do not duplicate.',
      'policies absent — soft-wire WAITING_DATA.',
    ),
    auth: softWireFile(
      ai,
      'auth.ts',
      'auth PRESENT — reuse, do not duplicate.',
      'auth absent — soft-wire WAITING_DATA.',
    ),
    audit: softWireFile(
      ai,
      'audit.ts',
      'audit PRESENT — reuse, do not duplicate.',
      'audit absent — soft-wire WAITING_DATA.',
    ),
    persistence: softWireFile(
      ai,
      'persistence.ts',
      'persistence PRESENT — reuse, do not duplicate.',
      'persistence absent — soft-wire WAITING_DATA.',
    ),
    diagnostics: softWireFile(
      ai,
      'diagnostics.ts',
      'diagnostics PRESENT — reuse, do not duplicate.',
      'diagnostics absent — soft-wire WAITING_DATA.',
    ),
    offlineBrainPackager: softWireFile(
      localBrain,
      'offline-brain-packager-types.ts',
      'ER14 Offline Brain Packager PRESENT (soft-wire). Presence≠VERIFIED.',
      'ER14 absent — soft-wire WAITING_DATA.',
    ),
    pathwayPlasticity: softWireFile(
      localBrain,
      'pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire). Presence≠VERIFIED.',
      'EQ15 absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function canAdvanceTruthLadder(
  from: TruthLadderState,
  to: TruthLadderState,
): boolean {
  const fromIdx = TRUTH_LADDER.indexOf(from);
  const toIdx = TRUTH_LADDER.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx === fromIdx + 1;
}

export const LOCAL_FIRST_CYCLE = [
  'honesty_locks',
  'canonical_brain_ownership',
  'soft_wire_audit',
  'agent_contracts',
  'message_bus',
  'task_graph_scope_inheritance',
  'local_worker_bounded',
  'compute_adapters_cpu_baseline',
  'digital_dna_manifest',
  'storage_replication_policy',
  'neural_kg_plasticity',
  'checkpoint_return_home',
  'offline_packs_sync',
  'control_tower',
  'evidence',
] as const;

export type GobHop = (typeof LOCAL_FIRST_CYCLE)[number];

export type GobEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'WAITING_DATA'
  | 'NOT_TESTED'
  | 'NOT_APPLIED'
  | ControlTowerState
  | ComputeState;

export type GobHopRecord = {
  hop: GobHop;
  state: GobEvidenceState;
  summary: string;
  at: string;
};
