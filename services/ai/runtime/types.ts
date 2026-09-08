import type { TransportTier } from './flags';

/* ------------------------------------------------------------------ */
/* Result envelope                                                     */
/* ------------------------------------------------------------------ */

export type DenialCode =
  | 'deployment_state_queued'
  | 'autonomy_locked'
  | 'caller_unauthorized'
  | 'caller_tenant_mismatch'
  | 'agent_node_selection_forbidden'
  | 'permission_expansion_forbidden'
  | 'runtime_identity_unknown'
  | 'runtime_identity_rejected'
  | 'runtime_challenge_unknown'
  | 'runtime_revoked'
  | 'runtime_quarantined'
  | 'runtime_not_attested'
  | 'runtime_vendor_unproven'
  | 'attestation_transition_invalid'
  | 'workload_unknown'
  | 'workload_terminated'
  | 'assignment_unknown'
  | 'assignment_terminated'
  | 'model_unknown'
  | 'model_unavailable'
  | 'model_not_evaluated'
  | 'model_substitution_detected'
  | 'model_revoked'
  | 'budget_exhausted'
  | 'budget_limit_reached'
  | 'offline_package_unknown'
  | 'offline_signature_invalid'
  | 'offline_package_expired'
  | 'offline_grant_exceeded'
  | 'offline_consequential_forbidden'
  | 'offline_conflict_detected'
  | 'channel_tenant_mismatch'
  | 'channel_peer_unauthorized'
  | 'consequential_replay_blocked'
  | 'consequential_outcome_unknown'
  | 'no_eligible_runtime'
  | 'result_validation_failed'
  | 'validation_evidence_missing';

export type Denied = { ok: false; code: DenialCode; message: string };

export type Result<T> = ({ ok: true } & T) | Denied;

export function deny(code: DenialCode, message: string): Denied {
  return { ok: false, code, message };
}

/* ------------------------------------------------------------------ */
/* Tenancy                                                             */
/* ------------------------------------------------------------------ */

/**
 * Every stored row in the fabric carries a tenant scope. Section 24 requires
 * that a shared physical host never collapses Universe isolation, so reads are
 * filtered by scope rather than by node ownership.
 */
export type TenantScope = {
  organizationId: string;
  universeId: string;
};

export type TenancyMode = 'dedicated' | 'shared';

export type SecurityClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export const CLASSIFICATION_RANK: Readonly<Record<SecurityClassification, number>> = Object.freeze({
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
});

/* ------------------------------------------------------------------ */
/* Caller identity and authorization                                   */
/* ------------------------------------------------------------------ */

export type ActorType = 'guardian' | 'human_operator' | 'agent' | 'runtime_node' | 'observer';

export type RuntimePermission =
  | 'hardware.validate'
  | 'runtime.register'
  | 'runtime.attest'
  | 'runtime.heartbeat'
  | 'runtime.read'
  | 'runtime.lifecycle'
  | 'workload.submit'
  | 'workload.schedule'
  | 'workload.cancel'
  | 'workload.execute'
  | 'agent.assign'
  | 'model.register'
  | 'model.revoke'
  | 'offline.create'
  | 'offline.sync'
  | 'budget.write'
  | 'audit.read';

export type CallerContext = {
  actorType: ActorType;
  actorId: string;
  scope: TenantScope;
  /** Present only for `runtime_node` callers; bounds the caller to one node. */
  nodeId?: string;
  /** Agent identity, separate from the compute process it happens to run on. */
  agentId?: string;
};

/* ------------------------------------------------------------------ */
/* XHAL — hardware abstraction (section 2)                             */
/* ------------------------------------------------------------------ */

export type DeviceClass =
  | 'mobile_phone'
  | 'tablet'
  | 'laptop'
  | 'workstation'
  | 'edge_gateway'
  | 'industrial_controller'
  | 'vehicle'
  | 'cloud_cpu'
  | 'cloud_gpu'
  | 'data_center';

export type Architecture = 'x86_64' | 'arm64' | 'riscv64' | 'unknown';

export type CpuVendor = 'intel' | 'amd' | 'apple' | 'arm' | 'qualcomm' | 'ampere' | 'unknown';

export type GpuVendor = 'nvidia' | 'amd' | 'intel' | 'apple' | 'qualcomm' | 'none' | 'unknown';

export type AcceleratorSupport =
  | 'cpu_simd'
  | 'gpu_cuda'
  | 'gpu_rocm'
  | 'gpu_metal'
  | 'npu'
  | 'future_accelerator';

export type NetworkState = 'offline' | 'metered' | 'constrained' | 'online';

export type ThermalState = 'nominal' | 'elevated' | 'critical' | 'unknown';

export type EnergyState = {
  source: 'battery' | 'wall' | 'grid';
  batteryPercent: number | null;
  charging: boolean;
};

export type KeystoreClass = 'none' | 'software' | 'hardware' | 'secure_enclave';

export type SecurityPosture = {
  secureBoot: boolean;
  diskEncryption: boolean;
  keystore: KeystoreClass;
  screenLock: boolean;
  osPatchState: 'current' | 'stale' | 'unknown';
};

export type TrustLevel = 'untrusted' | 'basic' | 'verified' | 'trusted' | 'protected';

export const TRUST_RANK: Readonly<Record<TrustLevel, number>> = Object.freeze({
  untrusted: 0,
  basic: 1,
  verified: 2,
  trusted: 3,
  protected: 4,
});

/**
 * The capability record from story section 2. It deliberately carries no serial
 * numbers, user names, installed application lists or file paths: section 5
 * requires a node to report capability without exposing unnecessary hardware or
 * private user information.
 */
export type RuntimeCapabilityRecord = {
  runtimeNode: string;
  deviceClass: DeviceClass;
  architecture: Architecture;
  cpuVendor: CpuVendor;
  cpuFamily: string;
  gpuVendor: GpuVendor;
  gpuFamily: string;
  memoryAvailableMb: number;
  storageAvailableMb: number;
  networkState: NetworkState;
  acceleratorSupport: readonly AcceleratorSupport[];
  energyState: EnergyState;
  thermalState: ThermalState;
  securityState: SecurityPosture;
  trustLevel: TrustLevel;
  region: string;
  tenantScope: TenantScope;
  runtimeVersion: string;
  lastAttestation: string | null;
};

export type VendorSupportState = 'unproven' | 'in_validation' | 'proven';

export type HardwareLane = {
  id: string;
  label: string;
  architecture: Architecture;
  cpuVendor: CpuVendor;
  gpuVendor: GpuVendor;
  support: VendorSupportState;
  evidence: readonly string[];
  validatedAt: string | null;
  validatedBy: string | null;
};

/* ------------------------------------------------------------------ */
/* Capability descriptors (section 14)                                 */
/* ------------------------------------------------------------------ */

export type CapabilityDomain = 'cpu' | 'gpu' | 'npu' | 'storage' | 'ui';

export type CapabilityTier = 'tiny' | 'small' | 'medium' | 'large';

export const TIER_RANK: Readonly<Record<CapabilityTier, number>> = Object.freeze({
  tiny: 0,
  small: 1,
  medium: 2,
  large: 3,
});

/** Wire form: `domain.function.tier`, e.g. `gpu.inference.medium`. */
export type CapabilityDescriptor = string;

export type ParsedCapability = {
  domain: CapabilityDomain;
  fn: string;
  tier: CapabilityTier;
};

/* ------------------------------------------------------------------ */
/* Runtime node identity (section 9)                                   */
/* ------------------------------------------------------------------ */

export type NodeLifecycle = 'active' | 'paused' | 'draining' | 'quarantined' | 'revoked';

export type AttestationState =
  | 'unknown'
  | 'registered'
  | 'verified'
  | 'attested'
  | 'degraded'
  | 'quarantined'
  | 'revoked';

export type HealthState = 'unknown' | 'healthy' | 'degraded' | 'unreachable';

export type WorkloadKind =
  | 'inference'
  | 'embedding'
  | 'vision'
  | 'simulation'
  | 'agent_evaluation'
  | 'model_evaluation'
  | 'scientific'
  | 'parallel_analysis'
  | 'analysis'
  | 'ui_render'
  | 'sync';

export type NodeSecurityPolicy = {
  maxClassification: SecurityClassification;
  allowConsequentialActions: boolean;
  allowOfflinePackages: boolean;
  requiredAttestation: Extract<AttestationState, 'registered' | 'verified' | 'attested'>;
  tenancy: TenancyMode;
};

export type ResourceBudget = {
  cpuMillis: number;
  gpuMillis: number;
  ramMb: number;
  storageMb: number;
  networkMb: number;
  tokens: number;
  modelCalls: number;
  agentCount: number;
  taskCount: number;
  energyWh: number;
  costUsd: number;
  durationMs: number;
};

export type ResourceUsage = ResourceBudget;

export type RuntimeNodeRecord = {
  nodeId: string;
  organizationId: string;
  universeId: string;
  deviceId: string;
  nodeType: DeviceClass;
  trustLevel: TrustLevel;
  capabilities: readonly CapabilityDescriptor[];
  allowedWorkloads: readonly WorkloadKind[];
  securityPolicy: NodeSecurityPolicy;
  runtimeVersion: string;
  attestationState: AttestationState;
  healthState: HealthState;
  resourceBudget: ResourceBudget;
  lastSeen: string | null;
  createdAt: string;
  revokedAt: string | null;
  lifecycle: NodeLifecycle;
  transportTier: TransportTier;
  region: string;
  hardware: RuntimeCapabilityRecord;
};

export type AttestationRecord = {
  id: string;
  nodeId: string;
  at: string;
  fromState: AttestationState;
  toState: AttestationState;
  measurements: Readonly<Record<string, string>>;
  actorId: string;
  note: string;
};

export type HealthSample = {
  nodeId: string;
  at: string;
  healthState: HealthState;
  thermalState: ThermalState;
  energyState: EnergyState;
  networkState: NetworkState;
  memoryAvailableMb: number;
  cpuPressure: number;
  gpuPressure: number;
};

/* ------------------------------------------------------------------ */
/* Workloads, scheduling and assignments (sections 7, 8, 26)           */
/* ------------------------------------------------------------------ */

export type Placement = 'device' | 'edge' | 'cpu' | 'gpu' | 'private';

export type WorkloadEstimate = {
  computeUnits: number;
  memoryMb: number;
  storageMb: number;
  tokens: number;
  bandwidthMb: number;
  runtimeMs: number;
};

export type ModelRequirement = {
  family?: string;
  minContext?: number;
  requiredCapabilities?: readonly string[];
};

export type BoundedKernel = 'checksum' | 'vector_sum' | 'row_reduce';

/**
 * The only execution shape 62D models. Kernels are deterministic and hardware
 * independent by construction so the Intel, AMD and NVIDIA lanes are required
 * to agree on the result byte for byte.
 */
export type BoundedTask = {
  kernel: BoundedKernel;
  input: readonly number[];
};

export type WorkloadRequest = {
  kind: WorkloadKind;
  requestedCapability: CapabilityDescriptor;
  classification: SecurityClassification;
  dataResidency: readonly string[];
  latencyBudgetMs: number;
  estimate: WorkloadEstimate;
  /** True when completion causes an external side effect that must never be blindly replayed. */
  consequential: boolean;
  modelRequirement?: ModelRequirement;
  task: BoundedTask;
  agentId: string;
  meetingId?: string;
  sourceLabel: string;
  /** Agents may express need, not infrastructure. Any value here is refused. */
  preferredNodeId?: string;
};

export type WorkloadStatus =
  | 'submitted'
  | 'classified'
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'queued'
  | 'escalated'
  | 'cancelled'
  | 'failed'
  | 'held_for_human_review';

export type WorkloadRecord = {
  workloadId: string;
  organizationId: string;
  universeId: string;
  agentId: string;
  meetingId: string | null;
  kind: WorkloadKind;
  requestedCapability: CapabilityDescriptor;
  classification: SecurityClassification;
  dataResidency: readonly string[];
  latencyBudgetMs: number;
  estimate: WorkloadEstimate;
  consequential: boolean;
  modelRequirement: ModelRequirement | null;
  task: BoundedTask;
  status: WorkloadStatus;
  createdAt: string;
  sourceLabel: string;
  attempts: number;
};

export type WorkloadClassification = {
  workloadId: string;
  preferredPlacement: Placement;
  securityFloor: {
    minTrust: TrustLevel;
    minAttestation: AttestationState;
    requiresDedicatedTenancy: boolean;
  };
  requiresAccelerator: boolean;
  ladder: readonly string[];
};

export type EligibilityReason =
  | 'eligible'
  | 'capability_missing'
  | 'capability_tier_insufficient'
  | 'insufficient_trust'
  | 'attestation_insufficient'
  | 'tenant_mismatch'
  | 'budget_exhausted'
  | 'classification_exceeds_node_policy'
  | 'dedicated_tenancy_required'
  | 'region_not_permitted'
  | 'workload_kind_not_allowed'
  | 'vendor_unproven'
  | 'node_paused'
  | 'node_draining'
  | 'node_quarantined'
  | 'node_revoked'
  | 'node_unreachable'
  | 'memory_insufficient'
  | 'thermal_pressure'
  | 'energy_pressure'
  | 'network_offline'
  | 'consequential_not_permitted';

export type CandidateEvaluation = {
  nodeId: string;
  eligible: boolean;
  reason: EligibilityReason;
  placement: Placement | null;
  score: number | null;
};

export type CostEstimate = {
  computeUnits: number;
  tokens: number;
  storageMb: number;
  bandwidthMb: number;
  runtimeMs: number;
  energyWh: number;
  monetaryUsd: number;
};

export type ScheduleOutcome = 'scheduled' | 'queued' | 'escalated' | 'rejected';

export type ScheduleDecision = {
  workloadId: string;
  outcome: ScheduleOutcome;
  placement: Placement | null;
  nodeId: string | null;
  modelId: string | null;
  assignmentId: string | null;
  reason: string;
  candidates: readonly CandidateEvaluation[];
  cost: CostEstimate | null;
};

export type AssignmentStatus =
  | 'assigned'
  | 'running'
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'superseded';

export type ComputeAssignment = {
  assignmentId: string;
  workloadId: string;
  nodeId: string;
  organizationId: string;
  universeId: string;
  agentId: string;
  modelId: string | null;
  /** HMAC over the approved model binding. A node cannot mint one of these. */
  modelBinding: string | null;
  placement: Placement;
  status: AssignmentStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  checkpoint: AssignmentCheckpoint | null;
  terminationReason: string | null;
};

export type AssignmentCheckpoint = {
  at: string;
  progress: number;
  stateDigest: string;
};

/* ------------------------------------------------------------------ */
/* Agent mobility (section 15)                                         */
/* ------------------------------------------------------------------ */

/**
 * An agent's identity is not its compute process. This record binds an agent
 * identity to a runtime for a bounded set of capabilities; moving it does not
 * move data, and the destination must qualify independently.
 */
export type AgentRuntimeAssignment = {
  id: string;
  agentId: string;
  organizationId: string;
  universeId: string;
  nodeId: string;
  grantedCapabilities: readonly CapabilityDescriptor[];
  classificationCeiling: SecurityClassification;
  createdAt: string;
  releasedAt: string | null;
};

/* ------------------------------------------------------------------ */
/* Budgets (section 17)                                                */
/* ------------------------------------------------------------------ */

export type BudgetOwnerKind = 'universe' | 'node' | 'agent';

export type BudgetOwner = {
  kind: BudgetOwnerKind;
  id: string;
};

export type BudgetRecord = {
  scope: TenantScope;
  owner: BudgetOwner;
  limit: ResourceBudget;
  used: ResourceUsage;
};

/* ------------------------------------------------------------------ */
/* Model registry (sections 20, 21)                                    */
/* ------------------------------------------------------------------ */

export type ModelRuntimeType = 'hosted_api' | 'local_cpu' | 'local_gpu' | 'on_device';

export type ModelEvaluationState = 'unevaluated' | 'in_evaluation' | 'evaluated' | 'failed';

export type ModelAvailability = 'unavailable' | 'restricted' | 'available';

export type ModelRecord = {
  modelId: string;
  provider: string;
  modelFamily: string;
  runtimeType: ModelRuntimeType;
  capabilities: readonly CapabilityDescriptor[];
  contextLimit: number;
  approvedDomains: readonly WorkloadKind[];
  securityClassification: SecurityClassification;
  evaluationState: ModelEvaluationState;
  costProfile: { perThousandTokensUsd: number; perSecondUsd: number };
  hardwareRequirement: { acceleratorSupport: readonly AcceleratorSupport[]; minMemoryMb: number };
  availability: ModelAvailability;
  /** Stable identity of the served weights. Substitution changes this. */
  fingerprint: string;
  scope: TenantScope | null;
};

export type ModelEvaluationRecord = {
  id: string;
  modelId: string;
  at: string;
  actorId: string;
  suite: string;
  passed: boolean;
  note: string;
};

/* ------------------------------------------------------------------ */
/* Offline (sections 11, 12)                                           */
/* ------------------------------------------------------------------ */

export type OfflineGrant = {
  capabilities: readonly CapabilityDescriptor[];
  allowedModels: readonly string[];
  allowedWorkloads: readonly WorkloadKind[];
  classificationCeiling: SecurityClassification;
  maxTasks: number;
  maxTokens: number;
  maxDurationMs: number;
  /** Structurally false. Offline execution never gains external authority. */
  allowConsequentialActions: false;
};

export type OfflineWorkPackage = {
  packageId: string;
  organizationId: string;
  universeId: string;
  nodeId: string;
  agentIds: readonly string[];
  grant: OfflineGrant;
  baseStateVersion: number;
  issuedAt: string;
  expiresAt: string;
  issuedBy: string;
  signature: string;
};

export type OfflineTaskResult = {
  taskId: string;
  workloadKind: WorkloadKind;
  capability: CapabilityDescriptor;
  classification: SecurityClassification;
  modelId: string;
  tokensUsed: number;
  durationMs: number;
  outputDigest: string;
  consequentialAttempted: boolean;
  transcript: string;
};

export type OfflineSyncStatus = 'accepted' | 'rejected' | 'conflict';

export type SyncEvent = {
  id: string;
  packageId: string;
  at: string;
  status: OfflineSyncStatus;
  reason: string;
  acceptedTaskIds: readonly string[];
  rejectedTaskIds: readonly string[];
};

/* ------------------------------------------------------------------ */
/* Device network (section 13)                                         */
/* ------------------------------------------------------------------ */

export type DeviceChannel = {
  channelId: string;
  organizationId: string;
  universeId: string;
  fromNodeId: string;
  toNodeId: string;
  classificationCeiling: SecurityClassification;
  cipherSuite: string;
  openedAt: string;
};

/* ------------------------------------------------------------------ */
/* Lineage and security events (sections 23, 25)                       */
/* ------------------------------------------------------------------ */

export type LineageStage =
  | 'source'
  | 'classification'
  | 'node_ingress'
  | 'transformation'
  | 'node_egress'
  | 'agent'
  | 'meeting'
  | 'decision'
  | 'offline_sync';

export type LineageRecord = {
  id: string;
  at: string;
  organizationId: string;
  universeId: string;
  workloadId: string;
  stage: LineageStage;
  nodeId: string | null;
  agentId: string | null;
  modelId: string | null;
  meetingId: string | null;
  inputDigest: string | null;
  outputDigest: string | null;
  authorizationReason: string;
  note: string;
};

export type LineageReconstruction = {
  workloadId: string;
  chain: readonly LineageRecord[];
  hardware: readonly { nodeId: string; cpuVendor: CpuVendor; gpuVendor: GpuVendor; region: string }[];
  models: readonly string[];
  requestingAgentId: string | null;
  authorizationReasons: readonly string[];
  cost: CostEstimate | null;
};

export type SecurityEventKind =
  | 'runtime_identity_rejected'
  | 'runtime_quarantined'
  | 'runtime_revoked'
  | 'model_substitution_detected'
  | 'cross_tenant_read_blocked'
  | 'agent_node_selection_blocked'
  | 'permission_expansion_blocked'
  | 'offline_authority_exceeded'
  | 'budget_limit_reached'
  | 'consequential_replay_blocked'
  | 'post_termination_result_rejected'
  | 'result_validation_failed'
  | 'proximity_trust_rejected'
  | 'satellite_access_blocked';

export type RuntimeSecurityEvent = {
  id: string;
  at: string;
  organizationId: string;
  universeId: string;
  kind: SecurityEventKind;
  actorId: string;
  nodeId: string | null;
  workloadId: string | null;
  detail: string;
};

/* ------------------------------------------------------------------ */
/* Consequential action ledger (section 26)                            */
/* ------------------------------------------------------------------ */

export type ConsequentialState = 'in_flight' | 'committed' | 'held_for_human_review';

export type ConsequentialLedgerEntry = {
  workloadId: string;
  actionKey: string;
  state: ConsequentialState;
  assignmentId: string;
  at: string;
};
