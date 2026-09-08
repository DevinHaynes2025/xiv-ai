/**
 * XIV distributed runtime layer (2I-AI-62D) domain types.
 *
 * Every type here is bounded: it describes the staging-scale control plane that
 * this package actually implements. Nothing in this file promises production
 * hardware, production providers, or production scale.
 */

export type TenantRef = {
  organizationId: string;
  universeId: string;
};

/** Node lifecycle. `revoked` is terminal: a revoked node can never return. */
export type NodeState = 'pending' | 'active' | 'paused' | 'quarantined' | 'revoked';

export type HardwareClassId =
  | 'cpu_x86_intel'
  | 'cpu_x86_amd'
  | 'cpu_arm64'
  | 'gpu_nvidia'
  | 'gpu_apple'
  | 'edge_arm32'
  | 'mobile_ios'
  | 'mobile_android';

export type Accelerator = 'avx2' | 'neon' | 'cuda' | 'metal' | 'npu';

/**
 * A hardware class is only `configured` when the release actually wires a
 * runtime for it. Unconfigured classes report UNAVAILABLE — never "supported".
 */
export type HardwareClass = {
  classId: HardwareClassId;
  label: string;
  configured: boolean;
  accelerators: readonly Accelerator[];
  /** Numeric tolerance the reference workload result must fall inside. */
  resultTolerance: number;
  unavailableReason?: string;
};

export type HardwareProfile = {
  classId: HardwareClassId;
  vendor: string;
  cores: number;
  ramMb: number;
  accelerators: readonly Accelerator[];
};

export type HardwareRequirement = {
  classIds?: readonly HardwareClassId[];
  accelerator?: Accelerator;
  minCores?: number;
  minRamMb?: number;
};

export type Capability =
  | 'node.register'
  | 'node.control'
  | 'workload.submit'
  | 'workload.submit.protected'
  | 'agent.register'
  | 'agent.activate'
  | 'model.invoke'
  | 'offline.package.issue'
  | 'offline.external_action'
  | 'meeting.host'
  | 'approval.grant'
  | 'tenant.bypass';

export type PrincipalKind = 'human' | 'service' | 'agent';

export type Principal = {
  principalId: string;
  kind: PrincipalKind;
  tenant: TenantRef;
  capabilities: readonly Capability[];
};

/** Only `verifyPrincipal` can mint this. Unauthenticated callers cannot forge it. */
export type AuthenticatedPrincipal = Principal & {
  readonly authenticated: true;
  tokenId: string;
  verifiedAt: number;
};

export type WorkloadClassification = 'public' | 'internal' | 'confidential' | 'restricted';

/**
 * Full AC-08 control set. Every field is mandatory so a workload can never be
 * admitted with an unbounded dimension.
 */
export type ResourceBudget = {
  cpuMillis: number;
  gpuMillis: number;
  ramMb: number;
  storageMb: number;
  networkKb: number;
  modelCalls: number;
  modelTokens: number;
  maxDurationMs: number;
  maxAgents: number;
  maxTasks: number;
  maxCostUsd: number;
  /** Mandatory ceiling: execution is terminated when wall time passes this. */
  hardTerminationMs: number;
};

export type ResourceDimension = keyof Omit<ResourceBudget, 'hardTerminationMs'>;

export type WorkloadSpec = {
  workloadId: string;
  tenant: TenantRef;
  classification: WorkloadClassification;
  requiredCapabilities: readonly Capability[];
  hardware: HardwareRequirement;
  budget: ResourceBudget;
  agentId?: string;
  modelId?: string;
  /** Consequential workloads must carry full lineage and (if set) an approval. */
  consequential: boolean;
  requiresApproval: boolean;
  sourceId?: string;
};

export type RuntimeNode = {
  nodeId: string;
  tenant: TenantRef;
  hardware: HardwareProfile;
  state: NodeState;
  enrollmentFingerprint: string;
  enrollmentId: string;
  ownerPrincipalId: string;
  registeredAt: number;
  lastSeenAt: number;
  /** Set when the node is paused, quarantined or revoked. */
  controlReason?: string;
  degraded: boolean;
  capacity: NodeCapacity;
};

export type NodeCapacity = {
  cpuMillis: number;
  gpuMillis: number;
  ramMb: number;
  concurrentWorkloads: number;
};

export type AttestationVerdict = 'pass' | 'fail';

export type AttestationRecord = {
  attestationId: string;
  nodeId: string;
  verdict: AttestationVerdict;
  /** Measured boot/runtime state; compared against the node's trust policy. */
  measurements: Readonly<Record<string, string>>;
  issuedAt: number;
  expiresAt: number;
  signature: string;
};

export type AttestationState = {
  nodeId: string;
  status: 'required_pass' | 'expired' | 'failed' | 'absent';
  attestationId?: string;
  verdict?: AttestationVerdict;
  expiresAt?: number;
  evaluatedAt: number;
};

export type TrustPolicy = {
  /** Classifications that may not run without a fresh passing attestation. */
  protectedClassifications: readonly WorkloadClassification[];
  maxAttestationAgeMs: number;
  requiredMeasurements: readonly string[];
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
};

/** Single-use signed authorization for exactly one workload execution. */
export type AuthorizationGrant = {
  grantId: string;
  workloadId: string;
  tenant: TenantRef;
  principalId: string;
  classification: WorkloadClassification;
  capabilities: readonly Capability[];
  requiresApproval: boolean;
  approvalId?: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
};

export type RoutingRejectionReason =
  | 'no_eligible_runtime'
  | 'tenant_mismatch'
  | 'universe_mismatch'
  | 'unsupported_hardware'
  | 'attestation_required'
  | 'node_unavailable'
  | 'budget_exhausted'
  | 'capacity_exhausted'
  | 'hardware_unconfigured';

export type RoutingDecision =
  | {
      outcome: 'assigned';
      nodeId: string;
      decisionId: string;
      decidedAt: number;
      decisionMicros: number;
      candidatesConsidered: number;
      rejectedNodes: Readonly<Record<string, RoutingRejectionReason>>;
    }
  | {
      outcome: 'rejected';
      reason: RoutingRejectionReason;
      decisionId: string;
      decidedAt: number;
      decisionMicros: number;
      candidatesConsidered: number;
      rejectedNodes: Readonly<Record<string, RoutingRejectionReason>>;
    };

export type LogicalAgentIdentity = {
  agentId: string;
  tenant: TenantRef;
  agentKey: string;
  classification: WorkloadClassification;
  registeredAt: number;
  /** Logical agents are dormant records. Activation is a separate authorized act. */
  active: boolean;
  assignedNodeId?: string;
  activationCount: number;
};

export type AgentAssignment = {
  assignmentId: string;
  agentId: string;
  nodeId: string;
  tenant: TenantRef;
  classification: WorkloadClassification;
  assignedAt: number;
  releasedAt?: number;
  reason: string;
};

export type ModelApprovalGate = {
  evaluationId: string;
  passed: boolean;
  evaluatedAt: number;
  evidenceUri: string;
};

export type ModelRegistryEntry = {
  modelId: string;
  provider: string;
  displayName: string;
  approved: boolean;
  /** Providers with no configured credentials stay UNAVAILABLE. */
  providerConfigured: boolean;
  evaluationGate?: ModelApprovalGate;
  maxTokens: number;
  costPerKTokenUsd: number | null;
  classifications: readonly WorkloadClassification[];
};

export type ModelInvocationRecord = {
  invocationId: string;
  workloadId: string;
  modelId: string;
  provider: string;
  tenant: TenantRef;
  nodeId: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number | null;
  costAttributable: boolean;
  at: number;
};

export type ControlCommandKind =
  | 'STOP_TASK'
  | 'STOP_AGENT'
  | 'STOP_MEETING'
  | 'PAUSE_NODE'
  | 'QUARANTINE_NODE'
  | 'REVOKE_NODE';

export type ControlCommand = {
  commandId: string;
  kind: ControlCommandKind;
  targetId: string;
  tenant: TenantRef;
  issuedByPrincipalId: string;
  issuedAt: number;
  acknowledgedAt?: number;
  effectiveAt?: number;
  ackLatencyMs?: number;
  outcome: 'acknowledged' | 'rejected';
  reason: string;
};

export type WorkloadState =
  | 'submitted'
  | 'authorized'
  | 'routed'
  | 'running'
  | 'completed'
  | 'failed'
  | 'terminated'
  | 'rejected'
  | 'recovered';

export type WorkloadUsage = {
  workloadId: string;
  tenant: TenantRef;
  nodeId: string | null;
  consumed: Record<ResourceDimension, number>;
  costUsd: number;
  costAttributed: boolean;
  startedAt: number | null;
  endedAt: number | null;
  durationMs: number;
  terminatedByLimit: ResourceDimension | 'duration' | null;
};

export type WorkloadRecord = {
  workloadId: string;
  tenant: TenantRef;
  spec: WorkloadSpec;
  state: WorkloadState;
  nodeId: string | null;
  grantId: string | null;
  attestationId: string | null;
  submittedAt: number;
  acceptedAt: number | null;
  startedAt: number | null;
  endedAt: number | null;
  acceptanceMs: number | null;
  schedulingMs: number | null;
  startLatencyMs: number | null;
  failureReason: string | null;
  rejectionReason: string | null;
  externalActionIds: string[];
};

export type LineageStage =
  | 'source'
  | 'classification'
  | 'organization_universe'
  | 'agent'
  | 'model'
  | 'runtime'
  | 'transformation'
  | 'meeting_task'
  | 'recommendation'
  | 'approval'
  | 'result';

export type LineageRecord = {
  lineageId: string;
  workloadId: string;
  tenant: TenantRef;
  stage: LineageStage;
  reference: string;
  detail: string;
  at: number;
  previousHash: string;
  hash: string;
};

export type AuditEvent = {
  eventId: string;
  sequence: number;
  tenant: TenantRef | null;
  category:
    | 'node'
    | 'attestation'
    | 'authorization'
    | 'routing'
    | 'workload'
    | 'agent'
    | 'model'
    | 'control'
    | 'offline'
    | 'meeting'
    | 'recovery'
    | 'isolation'
    | 'resource'
    | 'security'
    | 'release';
  kind: string;
  subjectId: string;
  principalId: string | null;
  detail: Readonly<Record<string, unknown>>;
  at: number;
  previousHash: string;
  hash: string;
};

export type OfflinePackageGrant = {
  packageId: string;
  tenant: TenantRef;
  agentId: string;
  nodeId: string;
  issuedByPrincipalId: string;
  capabilities: readonly Capability[];
  classification: WorkloadClassification;
  maxTasks: number;
  budget: ResourceBudget;
  issuedAt: number;
  expiresAt: number;
  nonce: string;
  signature: string;
};

export type OfflineResult = {
  resultId: string;
  packageId: string;
  tenant: TenantRef;
  agentId: string;
  nodeId: string;
  taskCount: number;
  externalActionsAttempted: number;
  externalActionsExecuted: number;
  lineageComplete: boolean;
  producedAt: number;
};

export type MeetingParticipant = {
  participantId: string;
  kind: PrincipalKind;
  tenant: TenantRef;
  displayName: string;
};

export type MeetingMessage = {
  messageId: string;
  meetingId: string;
  participantId: string;
  content: string;
  evidenceHashes: readonly string[];
  at: number;
  signature: string;
};

export type MeetingApproval = {
  approvalId: string;
  meetingId: string;
  approverPrincipalId: string;
  approverKind: PrincipalKind;
  decision: 'approved' | 'rejected';
  at: number;
  signature: string;
};

export type FailureKind =
  | 'node_loss'
  | 'process_failure'
  | 'timeout'
  | 'network_interruption'
  | 'resource_budget_exhausted';

export type RecoveryOutcome = {
  scenarioId: string;
  workloadId: string;
  kind: FailureKind;
  detected: boolean;
  detectionMs: number;
  terminalState: WorkloadState;
  safeTerminal: boolean;
  recoveredOnNodeId: string | null;
  crossTenantRecovery: boolean;
  duplicateExternalActions: number;
  corruptedCheckpointAccepted: boolean;
  auditCovered: boolean;
};

export type Checkpoint = {
  checkpointId: string;
  workloadId: string;
  tenant: TenantRef;
  stateBlob: string;
  at: number;
  signature: string;
};

export type PlaneSnapshot = {
  snapshotId: string;
  takenAt: number;
  version: string;
  tables: Readonly<Record<string, unknown>>;
  recordCount: number;
  integrityHash: string;
};

export type ReleaseManifest = {
  version: string;
  runtimeContractVersion: string;
  activatedAt: number;
  configHash: string;
  destructiveMigration: boolean;
  previousVersion: string | null;
};
