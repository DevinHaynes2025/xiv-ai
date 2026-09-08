import { authorize, authorizePermissionExpansion, sameScope } from './authz';
import {
  addUsage,
  budgetKey,
  chargeForEstimate,
  defaultNodeBudget,
  overLimitDimensions,
  zeroUsage,
} from './budgets';
import { classifyWorkload } from './classify';
import { canonicalJson, digest, newId, newSecret, sign, verify } from './crypto';
import { estimateCost, estimateLatencyMs, rankCandidates, scoreFor, type RankedCandidate } from './economics';
import { evaluateCandidate } from './eligibility';
import { DEPLOYMENT_STATE, SECURITY_LOCK, TRANSPORT_TIERS, type TransportTier } from './flags';
import { runBoundedKernel, taskDigest } from './kernels';
import { mintModelBinding, selectModel, verifyModelBinding, type ModelCandidate } from './models';
import { auditOfflineResults, boundGrant, packageBody, signOfflinePackage, verifyOfflinePackage } from './offline';
import type {
  AgentRuntimeAssignment,
  AssignmentCheckpoint,
  AttestationRecord,
  AttestationState,
  BudgetOwner,
  BudgetRecord,
  CallerContext,
  CandidateEvaluation,
  CapabilityDescriptor,
  ComputeAssignment,
  ConsequentialLedgerEntry,
  CostEstimate,
  DeviceChannel,
  DeviceClass,
  HardwareLane,
  HealthSample,
  LineageReconstruction,
  LineageRecord,
  LineageStage,
  ModelEvaluationRecord,
  ModelRecord,
  NodeSecurityPolicy,
  OfflineGrant,
  OfflineTaskResult,
  OfflineWorkPackage,
  Result,
  ResourceBudget,
  ResourceUsage,
  RuntimeCapabilityRecord,
  RuntimeNodeRecord,
  RuntimeSecurityEvent,
  ScheduleDecision,
  SecurityClassification,
  SecurityEventKind,
  SyncEvent,
  TenantScope,
  TrustLevel,
  VendorSupportState,
  WorkloadClassification,
  WorkloadKind,
  WorkloadRecord,
  WorkloadRequest,
} from './types';
import { CLASSIFICATION_RANK, deny } from './types';
import {
  capabilitySatisfies,
  createHardwareSupportMatrix,
  laneIdFor,
  reconcileCapabilities,
  requiresAccelerator,
  sanitizeCapabilityReport,
} from './xhal';

/**
 * XCP — the XIV runtime control plane.
 *
 * This is the 62D architecture expressed as a runnable, in-memory model of the
 * service contracts in story section 28. It deliberately performs no I/O: no
 * device is enrolled, no compute is purchased, no workload leaves the process.
 * Its job is to make the governance invariants executable and testable while
 * `DEPLOYMENT_STATE` stays `QUEUED`.
 *
 * Two rules shape every method below:
 *   1. Authorization is resolved beneath the contract, never by the caller.
 *   2. The control plane's own state is authoritative. A node that stops
 *      cooperating cannot keep an assignment alive.
 */

export type ProofPurpose = 'attest' | 'heartbeat' | 'execute' | 'sync';

export type RuntimeProofClaim = {
  nodeId: string;
  nonce: string;
  purpose: ProofPurpose;
};

/** Node-side helper. The fabric never learns a node secret from the wire. */
export function signRuntimeProof(nodeSecret: string, claim: RuntimeProofClaim): string {
  return sign(nodeSecret, claim);
}

export type RegisterRuntimeInput = {
  deviceId: string;
  nodeType: DeviceClass;
  hardware: RuntimeCapabilityRecord & Record<string, unknown>;
  declaredCapabilities?: readonly CapabilityDescriptor[];
  allowedWorkloads?: readonly WorkloadKind[];
  securityPolicy?: Partial<NodeSecurityPolicy>;
  resourceBudget?: Partial<ResourceBudget>;
  transportTier?: TransportTier;
};

export type AttestationMeasurements = Record<string, string>;

export type HeartbeatDirective = 'continue' | 'pause' | 'drain' | 'quarantine' | 'revoke';

export type RuntimeFabricOptions = {
  fabricKey?: string;
  clock?: () => Date;
  approvedRuntimeImages?: readonly string[];
};

const DEFAULT_APPROVED_IMAGES = ['xur-runtime:0.1.0-queued'] as const;

const DEFAULT_NODE_POLICY: NodeSecurityPolicy = {
  maxClassification: 'internal',
  allowConsequentialActions: false,
  allowOfflinePackages: false,
  requiredAttestation: 'attested',
  tenancy: 'shared',
};

const OFFLINE_GRANT_CEILING: OfflineGrant = {
  capabilities: ['cpu.analysis.medium', 'cpu.inference.small', 'ui.approval.tiny'],
  allowedModels: [],
  allowedWorkloads: ['analysis', 'inference', 'agent_evaluation'],
  classificationCeiling: 'internal',
  maxTasks: 8,
  maxTokens: 50_000,
  maxDurationMs: 4 * 60 * 60 * 1000,
  allowConsequentialActions: false,
};

const TRANSPORT_BY_DEVICE_CLASS: Readonly<Record<DeviceClass, TransportTier>> = Object.freeze({
  mobile_phone: 'device',
  tablet: 'device',
  laptop: 'device',
  workstation: 'edge',
  edge_gateway: 'edge',
  industrial_controller: 'edge',
  vehicle: 'edge',
  cloud_cpu: 'cloud',
  cloud_gpu: 'cloud',
  data_center: 'data_center',
});

export class RuntimeFabric {
  readonly deploymentState = DEPLOYMENT_STATE;
  readonly securityLock = SECURITY_LOCK;

  private readonly fabricKey: string;
  private readonly clock: () => Date;
  private readonly approvedRuntimeImages: readonly string[];

  private readonly hardwareMatrix = createHardwareSupportMatrix();
  private readonly nodes = new Map<string, RuntimeNodeRecord>();
  private readonly nodeSecrets = new Map<string, string>();
  private readonly challenges = new Map<string, { nodeId: string; nonce: string; purpose: ProofPurpose }>();
  private readonly attestations: AttestationRecord[] = [];
  private readonly healthSamples: HealthSample[] = [];

  private readonly workloads = new Map<string, WorkloadRecord>();
  private readonly classifications = new Map<string, WorkloadClassification>();
  private readonly assignments = new Map<string, ComputeAssignment>();
  private readonly reservations = new Map<string, { key: string; charge: ResourceUsage }>();
  private readonly workloadCosts = new Map<string, CostEstimate>();

  private readonly budgets = new Map<string, BudgetRecord>();
  private readonly models = new Map<string, ModelRecord>();
  private readonly modelEvaluations: ModelEvaluationRecord[] = [];
  private readonly agentAssignments = new Map<string, AgentRuntimeAssignment>();

  private readonly offlinePackages = new Map<string, OfflineWorkPackage>();
  private readonly consumedPackages = new Set<string>();
  private readonly syncEvents: SyncEvent[] = [];
  private readonly agentStateVersions = new Map<string, number>();

  private readonly channels = new Map<string, DeviceChannel>();
  private readonly lineage: LineageRecord[] = [];
  private readonly securityEvents: RuntimeSecurityEvent[] = [];
  private readonly consequentialLedger = new Map<string, ConsequentialLedgerEntry>();

  private readonly stoppedAgents = new Set<string>();
  private readonly stoppedMeetings = new Set<string>();

  constructor(options: RuntimeFabricOptions = {}) {
    this.fabricKey = options.fabricKey ?? newSecret();
    this.clock = options.clock ?? (() => new Date());
    this.approvedRuntimeImages = options.approvedRuntimeImages ?? DEFAULT_APPROVED_IMAGES;
  }

  private now(): string {
    return this.clock().toISOString();
  }

  private record(
    scope: TenantScope,
    kind: SecurityEventKind,
    actorId: string,
    detail: string,
    extra: { nodeId?: string | null; workloadId?: string | null } = {},
  ): RuntimeSecurityEvent {
    const event: RuntimeSecurityEvent = {
      id: newId('rse'),
      at: this.now(),
      organizationId: scope.organizationId,
      universeId: scope.universeId,
      kind,
      actorId,
      nodeId: extra.nodeId ?? null,
      workloadId: extra.workloadId ?? null,
      detail,
    };
    this.securityEvents.push(event);
    return event;
  }

  private trace(input: {
    scope: TenantScope;
    workloadId: string;
    stage: LineageStage;
    nodeId?: string | null;
    agentId?: string | null;
    modelId?: string | null;
    meetingId?: string | null;
    inputDigest?: string | null;
    outputDigest?: string | null;
    authorizationReason: string;
    note: string;
  }): void {
    this.lineage.push({
      id: newId('lin'),
      at: this.now(),
      organizationId: input.scope.organizationId,
      universeId: input.scope.universeId,
      workloadId: input.workloadId,
      stage: input.stage,
      nodeId: input.nodeId ?? null,
      agentId: input.agentId ?? null,
      modelId: input.modelId ?? null,
      meetingId: input.meetingId ?? null,
      inputDigest: input.inputDigest ?? null,
      outputDigest: input.outputDigest ?? null,
      authorizationReason: input.authorizationReason,
      note: input.note,
    });
  }

  /** Row-level scoping. A row outside the caller's Universe is simply not there. */
  private scopedNode(caller: CallerContext, nodeId: string): RuntimeNodeRecord | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;
    if (!sameScope(caller.scope, { organizationId: node.organizationId, universeId: node.universeId })) {
      this.record(caller.scope, 'cross_tenant_read_blocked', caller.actorId, `node ${nodeId} is outside caller universe`, {
        nodeId,
      });
      return undefined;
    }
    return node;
  }

  private scopedWorkload(caller: CallerContext, workloadId: string): WorkloadRecord | undefined {
    const workload = this.workloads.get(workloadId);
    if (!workload) return undefined;
    if (!sameScope(caller.scope, { organizationId: workload.organizationId, universeId: workload.universeId })) {
      this.record(
        caller.scope,
        'cross_tenant_read_blocked',
        caller.actorId,
        `workload ${workloadId} is outside caller universe`,
        { workloadId },
      );
      return undefined;
    }
    return workload;
  }

  /* ---------------------------------------------------------------- */
  /* XHAL — hardware lane proof (section 2)                            */
  /* ---------------------------------------------------------------- */

  getHardwareSupportMatrix(caller: CallerContext): Result<{ lanes: HardwareLane[] }> {
    const denied = authorize(caller, 'runtime.read');
    if (denied) return denied;
    return { ok: true, lanes: [...this.hardwareMatrix.values()].map((lane) => ({ ...lane })) };
  }

  /**
   * Section 2: vendor support must be proven individually before being marked
   * available. Evidence is mandatory and the actor is recorded.
   */
  recordVendorValidation(
    caller: CallerContext,
    input: { laneId: string; support: Exclude<VendorSupportState, 'unproven'>; evidence: readonly string[] },
  ): Result<{ lane: HardwareLane }> {
    const denied = authorize(caller, 'hardware.validate');
    if (denied) return denied;

    const lane = this.hardwareMatrix.get(input.laneId);
    if (!lane) return deny('runtime_identity_unknown', `unknown hardware lane ${input.laneId}`);
    if (input.evidence.length === 0) {
      return deny('validation_evidence_missing', `lane ${input.laneId} cannot be marked ${input.support} without evidence`);
    }

    const updated: HardwareLane = {
      ...lane,
      support: input.support,
      evidence: [...lane.evidence, ...input.evidence],
      validatedAt: this.now(),
      validatedBy: caller.actorId,
    };
    this.hardwareMatrix.set(lane.id, updated);
    return { ok: true, lane: { ...updated } };
  }

  /* ---------------------------------------------------------------- */
  /* registerRuntime / attestRuntime / heartbeatRuntime                */
  /* ---------------------------------------------------------------- */

  registerRuntime(
    caller: CallerContext,
    input: RegisterRuntimeInput,
  ): Result<{ node: RuntimeNodeRecord; nodeSecret: string; droppedFields: string[] }> {
    const denied = authorize(caller, 'runtime.register', input.hardware.tenantScope);
    if (denied) return denied;

    const transportTier = input.transportTier ?? TRANSPORT_BY_DEVICE_CLASS[input.nodeType];
    if (TRANSPORT_TIERS[transportTier] === 'unconfigured') {
      this.record(
        caller.scope,
        'satellite_access_blocked',
        caller.actorId,
        `transport tier ${transportTier} is unconfigured and unproven`,
      );
      return deny('autonomy_locked', `transport tier ${transportTier} is unconfigured; AUTO_SATELLITE_ACCESS=false`);
    }

    const { hardware, dropped } = sanitizeCapabilityReport(input.hardware);
    const capabilities = reconcileCapabilities(hardware, input.declaredCapabilities ?? []);
    const nodeId = newId('node');
    const nodeSecret = newSecret();

    const node: RuntimeNodeRecord = {
      nodeId,
      organizationId: caller.scope.organizationId,
      universeId: caller.scope.universeId,
      deviceId: input.deviceId,
      nodeType: input.nodeType,
      // A node never self-asserts trust. Registration grants nothing.
      trustLevel: 'untrusted',
      capabilities,
      allowedWorkloads: input.allowedWorkloads ?? [],
      securityPolicy: { ...DEFAULT_NODE_POLICY, ...input.securityPolicy },
      runtimeVersion: hardware.runtimeVersion,
      attestationState: 'registered',
      healthState: 'unknown',
      resourceBudget: defaultNodeBudget(input.resourceBudget),
      lastSeen: this.now(),
      createdAt: this.now(),
      revokedAt: null,
      lifecycle: 'active',
      transportTier,
      region: hardware.region,
      hardware: { ...hardware, trustLevel: 'untrusted', lastAttestation: null },
    };

    this.nodes.set(nodeId, node);
    this.nodeSecrets.set(nodeId, nodeSecret);
    this.budgets.set(budgetKey(caller.scope, { kind: 'node', id: nodeId }), {
      scope: caller.scope,
      owner: { kind: 'node', id: nodeId },
      limit: node.resourceBudget,
      used: zeroUsage(),
    });

    return { ok: true, node: { ...node }, nodeSecret, droppedFields: dropped };
  }

  issueRuntimeChallenge(
    caller: CallerContext,
    input: { nodeId: string; purpose: ProofPurpose },
  ): Result<{ challengeId: string; nonce: string }> {
    const node = this.nodes.get(input.nodeId);
    if (!node) {
      this.record(caller.scope, 'runtime_identity_rejected', caller.actorId, `challenge requested for unknown node ${input.nodeId}`, {
        nodeId: input.nodeId,
      });
      return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered`);
    }
    if (!sameScope(caller.scope, { organizationId: node.organizationId, universeId: node.universeId })) {
      this.record(caller.scope, 'cross_tenant_read_blocked', caller.actorId, `challenge for node outside universe`, {
        nodeId: input.nodeId,
      });
      return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered`);
    }
    if (caller.actorType === 'runtime_node' && caller.nodeId !== input.nodeId) {
      return deny('caller_unauthorized', 'runtime callers may only act for their own node');
    }

    const challengeId = newId('chal');
    const nonce = newSecret();
    this.challenges.set(challengeId, { nodeId: input.nodeId, nonce, purpose: input.purpose });
    return { ok: true, challengeId, nonce };
  }

  /**
   * Single-use challenge/response over the secret issued at registration.
   * An unregistered node has no secret, and a stolen node id alone proves
   * nothing (section 29, runtime spoofing test).
   */
  private consumeProof(
    caller: CallerContext,
    input: { nodeId: string; challengeId: string; proof: string; purpose: ProofPurpose },
  ): { ok: true; node: RuntimeNodeRecord } | ReturnType<typeof deny> {
    const node = this.nodes.get(input.nodeId);
    const secret = this.nodeSecrets.get(input.nodeId);
    if (!node || !secret) {
      this.record(caller.scope, 'runtime_identity_rejected', caller.actorId, `proof from unregistered node ${input.nodeId}`, {
        nodeId: input.nodeId,
      });
      return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered`);
    }

    const challenge = this.challenges.get(input.challengeId);
    if (!challenge || challenge.nodeId !== input.nodeId || challenge.purpose !== input.purpose) {
      this.record(caller.scope, 'runtime_identity_rejected', caller.actorId, `unknown or mismatched challenge for ${input.nodeId}`, {
        nodeId: input.nodeId,
      });
      return deny('runtime_challenge_unknown', 'challenge is unknown, already used, or issued for another purpose');
    }
    this.challenges.delete(input.challengeId);

    const claim: RuntimeProofClaim = { nodeId: input.nodeId, nonce: challenge.nonce, purpose: input.purpose };
    if (!verify(secret, claim, input.proof)) {
      this.record(caller.scope, 'runtime_identity_rejected', caller.actorId, `invalid proof presented for ${input.nodeId}`, {
        nodeId: input.nodeId,
      });
      return deny('runtime_identity_rejected', `node ${input.nodeId} failed identity proof`);
    }

    return { ok: true, node };
  }

  attestRuntime(
    caller: CallerContext,
    input: { nodeId: string; challengeId: string; proof: string; measurements: AttestationMeasurements },
  ): Result<{ node: RuntimeNodeRecord; attestation: AttestationRecord }> {
    const denied = authorize(caller, 'runtime.attest');
    if (denied) return denied;
    if (caller.actorType === 'runtime_node' && caller.nodeId !== input.nodeId) {
      return deny('caller_unauthorized', 'runtime callers may only attest their own node');
    }

    const proof = this.consumeProof(caller, { ...input, purpose: 'attest' });
    if (!('node' in proof)) return proof;
    const node = proof.node;

    if (node.lifecycle === 'revoked') return deny('runtime_revoked', `node ${node.nodeId} is revoked`);
    if (node.lifecycle === 'quarantined') {
      // A quarantined node cannot attest its way back. Only an operator can.
      return deny('runtime_quarantined', `node ${node.nodeId} is quarantined and cannot self-restore`);
    }

    const imageApproved = this.approvedRuntimeImages.includes(input.measurements.runtime_image ?? '');
    const posture = node.hardware.securityState;
    const fullPosture =
      posture.secureBoot &&
      posture.diskEncryption &&
      (posture.keystore === 'hardware' || posture.keystore === 'secure_enclave') &&
      posture.osPatchState === 'current';

    const toState: AttestationState = !imageApproved ? 'degraded' : fullPosture ? 'attested' : 'verified';
    // Attestation earns `verified` at most. `trusted` and `protected` are
    // granted by a human operator, so a node cannot climb the trust ladder on
    // its own measurements alone.
    const trustLevel: TrustLevel = toState === 'attested' ? 'verified' : toState === 'verified' ? 'basic' : 'untrusted';

    const attestation: AttestationRecord = {
      id: newId('att'),
      nodeId: node.nodeId,
      at: this.now(),
      fromState: node.attestationState,
      toState,
      measurements: { ...input.measurements },
      actorId: caller.actorId,
      note: imageApproved ? 'runtime image approved' : 'runtime image not on the approved list',
    };
    this.attestations.push(attestation);

    const updated: RuntimeNodeRecord = {
      ...node,
      attestationState: toState,
      trustLevel,
      lastSeen: this.now(),
      hardware: { ...node.hardware, trustLevel, lastAttestation: attestation.at },
    };
    this.nodes.set(node.nodeId, updated);

    return { ok: true, node: { ...updated }, attestation };
  }

  /**
   * `protected` is the only trust level that unlocks restricted workloads, and
   * it is granted by a human operator against an attested node. Section 9: a
   * node does not inherit organization-wide access by registering.
   */
  grantTrustLevel(
    caller: CallerContext,
    input: { nodeId: string; trustLevel: TrustLevel; justification: string },
  ): Result<{ node: RuntimeNodeRecord }> {
    const denied = authorize(caller, 'runtime.lifecycle');
    if (denied) return denied;

    const node = this.scopedNode(caller, input.nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered`);
    if (node.attestationState !== 'attested') {
      return deny('runtime_not_attested', `node ${input.nodeId} must be attested before a trust grant`);
    }
    if (!input.justification.trim()) {
      return deny('validation_evidence_missing', 'a trust grant requires a recorded justification');
    }

    const updated: RuntimeNodeRecord = {
      ...node,
      trustLevel: input.trustLevel,
      hardware: { ...node.hardware, trustLevel: input.trustLevel },
    };
    this.nodes.set(node.nodeId, updated);
    return { ok: true, node: { ...updated } };
  }

  heartbeatRuntime(
    caller: CallerContext,
    input: {
      nodeId: string;
      challengeId: string;
      proof: string;
      sample: Omit<HealthSample, 'nodeId' | 'at'>;
    },
  ): Result<{ directive: HeartbeatDirective; node: RuntimeNodeRecord }> {
    const denied = authorize(caller, 'runtime.heartbeat');
    if (denied) return denied;
    if (caller.actorType === 'runtime_node' && caller.nodeId !== input.nodeId) {
      return deny('caller_unauthorized', 'runtime callers may only heartbeat their own node');
    }

    const proof = this.consumeProof(caller, { ...input, purpose: 'heartbeat' });
    if (!('node' in proof)) return proof;
    const node = proof.node;

    const sample: HealthSample = { ...input.sample, nodeId: node.nodeId, at: this.now() };
    this.healthSamples.push(sample);

    // Volatile telemetry updates. Trust, attestation and lifecycle never move
    // here: a node cannot lift its own quarantine by reporting good news.
    const updated: RuntimeNodeRecord = {
      ...node,
      lastSeen: sample.at,
      healthState: node.lifecycle === 'quarantined' ? node.healthState : sample.healthState,
      hardware: {
        ...node.hardware,
        thermalState: sample.thermalState,
        energyState: sample.energyState,
        networkState: sample.networkState,
        memoryAvailableMb: sample.memoryAvailableMb,
      },
    };
    this.nodes.set(node.nodeId, updated);

    const directive: HeartbeatDirective =
      updated.lifecycle === 'revoked'
        ? 'revoke'
        : updated.lifecycle === 'quarantined'
          ? 'quarantine'
          : updated.lifecycle === 'draining'
            ? 'drain'
            : updated.lifecycle === 'paused'
              ? 'pause'
              : 'continue';

    return { ok: true, directive, node: { ...updated } };
  }

  /* ---------------------------------------------------------------- */
  /* getRuntimeCapabilities (section 14)                               */
  /* ---------------------------------------------------------------- */

  getRuntimeCapabilities(
    caller: CallerContext,
    query: { capability?: CapabilityDescriptor } = {},
  ): Result<{
    view: 'capability' | 'inventory';
    capabilities: { capability: CapabilityDescriptor; eligibleCount: number }[];
    nodes?: Pick<
      RuntimeNodeRecord,
      'nodeId' | 'nodeType' | 'capabilities' | 'attestationState' | 'trustLevel' | 'healthState' | 'lifecycle' | 'region'
    >[];
  }> {
    const denied = authorize(caller, 'runtime.read');
    if (denied) return denied;

    const scoped = [...this.nodes.values()].filter((node) =>
      sameScope(caller.scope, { organizationId: node.organizationId, universeId: node.universeId }),
    );

    const counts = new Map<CapabilityDescriptor, number>();
    for (const node of scoped) {
      if (node.lifecycle !== 'active') continue;
      for (const capability of node.capabilities) {
        if (query.capability && !capabilitySatisfies(capability, query.capability)) continue;
        counts.set(capability, (counts.get(capability) ?? 0) + 1);
      }
    }
    const capabilities = [...counts.entries()]
      .map(([capability, eligibleCount]) => ({ capability, eligibleCount }))
      .sort((a, b) => (a.capability < b.capability ? -1 : 1));

    // Agents see capability availability. They never receive a machine
    // inventory to choose from (sections 1 and 14).
    if (caller.actorType === 'agent') return { ok: true, view: 'capability', capabilities };

    return {
      ok: true,
      view: 'inventory',
      capabilities,
      nodes: scoped.map((node) => ({
        nodeId: node.nodeId,
        nodeType: node.nodeType,
        capabilities: node.capabilities,
        attestationState: node.attestationState,
        trustLevel: node.trustLevel,
        healthState: node.healthState,
        lifecycle: node.lifecycle,
        region: node.region,
      })),
    };
  }

  /* ---------------------------------------------------------------- */
  /* Models (sections 20, 21)                                          */
  /* ---------------------------------------------------------------- */

  registerModel(
    caller: CallerContext,
    input: Omit<ModelRecord, 'evaluationState' | 'availability'> &
      Partial<Pick<ModelRecord, 'evaluationState' | 'availability'>>,
  ): Result<{ model: ModelRecord }> {
    const denied = authorize(caller, 'model.register', input.scope ?? caller.scope);
    if (denied) return denied;

    // Unproven models remain unavailable regardless of what the caller asks for.
    const model: ModelRecord = {
      ...input,
      evaluationState: 'unevaluated',
      availability: 'unavailable',
      scope: input.scope ?? caller.scope,
    };
    this.models.set(model.modelId, model);
    return { ok: true, model: { ...model } };
  }

  recordModelEvaluation(
    caller: CallerContext,
    input: { modelId: string; suite: string; passed: boolean; note: string },
  ): Result<{ model: ModelRecord; evaluation: ModelEvaluationRecord }> {
    const denied = authorize(caller, 'model.register');
    if (denied) return denied;

    const model = this.models.get(input.modelId);
    if (!model || (model.scope && !sameScope(caller.scope, model.scope))) {
      return deny('model_unknown', `model ${input.modelId} is not registered in this universe`);
    }

    const evaluation: ModelEvaluationRecord = {
      id: newId('mev'),
      modelId: model.modelId,
      at: this.now(),
      actorId: caller.actorId,
      suite: input.suite,
      passed: input.passed,
      note: input.note,
    };
    this.modelEvaluations.push(evaluation);

    const updated: ModelRecord = {
      ...model,
      evaluationState: input.passed ? 'evaluated' : 'failed',
      availability: input.passed ? 'available' : 'unavailable',
    };
    this.models.set(model.modelId, updated);
    return { ok: true, model: { ...updated }, evaluation };
  }

  revokeModel(caller: CallerContext, input: { modelId: string; reason: string }): Result<{ model: ModelRecord }> {
    const denied = authorize(caller, 'model.revoke');
    if (denied) return denied;

    const model = this.models.get(input.modelId);
    if (!model || (model.scope && !sameScope(caller.scope, model.scope))) {
      return deny('model_unknown', `model ${input.modelId} is not registered in this universe`);
    }

    const updated: ModelRecord = { ...model, availability: 'unavailable' };
    this.models.set(model.modelId, updated);

    for (const assignment of this.assignments.values()) {
      if (assignment.modelId === model.modelId && (assignment.status === 'assigned' || assignment.status === 'running')) {
        this.terminateAssignment(assignment.assignmentId, `model_revoked:${input.reason}`);
      }
    }
    return { ok: true, model: { ...updated } };
  }

  /* ---------------------------------------------------------------- */
  /* Budgets (section 17)                                              */
  /* ---------------------------------------------------------------- */

  setBudget(caller: CallerContext, input: { owner: BudgetOwner; limit: ResourceBudget }): Result<{ budget: BudgetRecord }> {
    const denied = authorize(caller, 'budget.write');
    if (denied) {
      if (caller.actorType === 'agent') {
        this.record(caller.scope, 'permission_expansion_blocked', caller.actorId, 'agent attempted to write a budget');
      }
      return denied;
    }

    const key = budgetKey(caller.scope, input.owner);
    const existing = this.budgets.get(key);
    const budget: BudgetRecord = {
      scope: caller.scope,
      owner: input.owner,
      limit: input.limit,
      used: existing?.used ?? zeroUsage(),
    };
    this.budgets.set(key, budget);
    return { ok: true, budget: { ...budget } };
  }

  /**
   * The only path an agent or a runtime has to ask for more resources. It is
   * closed: while `AUTO_SCALE_AUTHORITY` and `AUTO_PERMISSION_EXPANSION` are
   * false, the request is recorded for a human and nothing is granted.
   */
  requestResourceIncrease(
    caller: CallerContext,
    input: { owner: BudgetOwner; additional: Partial<ResourceBudget>; justification: string },
  ): Result<{ queuedForHumanReview: true }> {
    const expansion = authorizePermissionExpansion(caller);
    if (expansion) {
      this.record(
        caller.scope,
        'permission_expansion_blocked',
        caller.actorId,
        `${caller.actorType} requested more ${input.owner.kind} resources: ${input.justification}`,
      );
      return expansion;
    }
    if (!SECURITY_LOCK.AUTO_SCALE_AUTHORITY) {
      return deny('autonomy_locked', 'AUTO_SCALE_AUTHORITY=false; resource growth requires a human decision');
    }
    return { ok: true, queuedForHumanReview: true };
  }

  getBudget(caller: CallerContext, owner: BudgetOwner): Result<{ budget: BudgetRecord }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    const budget = this.budgets.get(budgetKey(caller.scope, owner));
    if (!budget) return deny('workload_unknown', `no budget recorded for ${owner.kind} ${owner.id}`);
    return { ok: true, budget: { ...budget } };
  }

  /* ---------------------------------------------------------------- */
  /* submitWorkload / classifyWorkload / scheduleWorkload              */
  /* ---------------------------------------------------------------- */

  submitWorkload(caller: CallerContext, request: WorkloadRequest): Result<{ workload: WorkloadRecord }> {
    const denied = authorize(caller, 'workload.submit');
    if (denied) return denied;

    if (request.preferredNodeId && caller.actorType === 'agent') {
      this.record(
        caller.scope,
        'agent_node_selection_blocked',
        caller.actorId,
        `agent named node ${request.preferredNodeId} on a workload request`,
        { nodeId: request.preferredNodeId },
      );
      return deny(
        'agent_node_selection_forbidden',
        'agents request capabilities; they do not select infrastructure',
      );
    }

    if (caller.actorType === 'agent' && caller.agentId && caller.agentId !== request.agentId) {
      return deny('caller_unauthorized', 'an agent cannot submit work under another agent identity');
    }
    if (this.stoppedAgents.has(request.agentId)) {
      return deny('workload_terminated', `agent ${request.agentId} is stopped by an operator`);
    }
    if (request.meetingId && this.stoppedMeetings.has(request.meetingId)) {
      return deny('workload_terminated', `meeting ${request.meetingId} is stopped by an operator`);
    }

    const workload: WorkloadRecord = {
      workloadId: newId('wl'),
      organizationId: caller.scope.organizationId,
      universeId: caller.scope.universeId,
      agentId: request.agentId,
      meetingId: request.meetingId ?? null,
      kind: request.kind,
      requestedCapability: request.requestedCapability,
      classification: request.classification,
      dataResidency: [...request.dataResidency],
      latencyBudgetMs: request.latencyBudgetMs,
      estimate: { ...request.estimate },
      consequential: request.consequential,
      modelRequirement: request.modelRequirement ?? null,
      task: { kernel: request.task.kernel, input: [...request.task.input] },
      status: 'submitted',
      createdAt: this.now(),
      sourceLabel: request.sourceLabel,
      attempts: 0,
    };

    this.workloads.set(workload.workloadId, workload);
    this.trace({
      scope: caller.scope,
      workloadId: workload.workloadId,
      stage: 'source',
      agentId: workload.agentId,
      meetingId: workload.meetingId,
      inputDigest: taskDigest(workload.task),
      authorizationReason: `submitted by ${caller.actorType} ${caller.actorId}`,
      note: workload.sourceLabel,
    });

    return { ok: true, workload: { ...workload } };
  }

  classifyWorkload(caller: CallerContext, workloadId: string): Result<{ classification: WorkloadClassification }> {
    const denied = authorize(caller, 'workload.submit');
    if (denied) return denied;

    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);

    const classification = classifyWorkload(workload);
    this.classifications.set(workloadId, classification);
    this.workloads.set(workloadId, { ...workload, status: 'classified' });

    this.trace({
      scope: caller.scope,
      workloadId,
      stage: 'classification',
      agentId: workload.agentId,
      authorizationReason: classification.ladder.join(' -> '),
      note: `preferred placement ${classification.preferredPlacement}`,
    });

    return { ok: true, classification };
  }

  scheduleWorkload(
    caller: CallerContext,
    workloadId: string,
    options: { excludeNodeIds?: readonly string[] } = {},
  ): Result<{ decision: ScheduleDecision }> {
    const denied = authorize(caller, 'workload.schedule');
    if (denied) return denied;

    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);
    if (workload.status === 'cancelled') return deny('workload_terminated', `workload ${workloadId} was cancelled`);

    const decision = this.planPlacement(caller.scope, workload, options.excludeNodeIds ?? []);
    if (decision.outcome === 'scheduled' && decision.nodeId && decision.placement) {
      const assignment = this.commitAssignment(caller.scope, workload, decision);
      decision.assignmentId = assignment.assignmentId;
      this.workloads.set(workloadId, { ...workload, status: 'scheduled', attempts: workload.attempts + 1 });
    } else {
      this.workloads.set(workloadId, {
        ...workload,
        status: decision.outcome === 'escalated' ? 'escalated' : 'queued',
      });
    }

    return { ok: true, decision };
  }

  private planPlacement(
    scope: TenantScope,
    workload: WorkloadRecord,
    excludeNodeIds: readonly string[],
  ): ScheduleDecision {
    const classification = this.classifications.get(workload.workloadId) ?? classifyWorkload(workload);
    this.classifications.set(workload.workloadId, classification);

    const evaluations: CandidateEvaluation[] = [];
    const ranked: RankedCandidate[] = [];

    // Only nodes inside the requesting Universe are even considered, so a
    // scheduling decision can never disclose another tenant's node ids. The
    // tenant check inside `evaluateCandidate` stays as defence in depth.
    for (const node of this.nodes.values()) {
      if (excludeNodeIds.includes(node.nodeId)) continue;
      if (!sameScope(scope, { organizationId: node.organizationId, universeId: node.universeId })) continue;

      const laneSupport: VendorSupportState =
        this.hardwareMatrix.get(laneIdFor(node.hardware))?.support ?? 'unproven';
      const budget = this.budgets.get(budgetKey(scope, { kind: 'node', id: node.nodeId }));
      const placementGuess = requiresAccelerator(workload.requestedCapability) ? 'gpu' : 'cpu';
      const charge = chargeForEstimate(workload.estimate, {
        usesGpu: placementGuess === 'gpu',
        monetaryUsd: estimateCost(workload, placementGuess, null).monetaryUsd,
        energyWh: estimateCost(workload, placementGuess, null).energyWh,
        modelCalls: workload.estimate.tokens > 0 ? 1 : 0,
      });

      const evaluation = evaluateCandidate({
        node,
        workload,
        classification,
        scope,
        laneSupport,
        budgetLimit: budget?.limit ?? node.resourceBudget,
        budgetUsed: budget?.used ?? zeroUsage(),
        charge,
      });
      evaluations.push(evaluation);

      if (evaluation.eligible && evaluation.placement) {
        ranked.push({
          evaluation,
          node,
          placement: evaluation.placement,
          latencyMs: estimateLatencyMs(node, evaluation.placement),
          cost: estimateCost(workload, evaluation.placement, null),
        });
      }
    }

    if (ranked.length === 0) {
      const escalate = evaluations.some((candidate) =>
        ['insufficient_trust', 'attestation_insufficient', 'dedicated_tenancy_required', 'classification_exceeds_node_policy'].includes(
          candidate.reason,
        ),
      );
      return {
        workloadId: workload.workloadId,
        outcome: escalate ? 'escalated' : 'queued',
        placement: null,
        nodeId: null,
        modelId: null,
        assignmentId: null,
        reason: escalate ? 'no_authorized_runtime_available' : 'no_eligible_runtime_available',
        candidates: evaluations,
        cost: null,
      };
    }

    const ordered = rankCandidates(ranked, classification.preferredPlacement);
    const chosen = ordered[0]!;
    for (const candidate of ordered) {
      candidate.evaluation.score = scoreFor(candidate, classification.preferredPlacement);
    }

    // Model routing runs after the node is known: hardware requirements are
    // part of model eligibility (section 21).
    const scopedModels = [...this.models.values()].filter((model) => !model.scope || sameScope(scope, model.scope));
    const needsModel = workload.estimate.tokens > 0 || workload.kind === 'inference' || workload.kind === 'embedding';
    const selection = needsModel
      ? selectModel(scopedModels, workload, chosen.node, scope)
      : { model: null, candidates: [] as ModelCandidate[] };

    if (needsModel && !selection.model) {
      return {
        workloadId: workload.workloadId,
        outcome: 'escalated',
        placement: null,
        nodeId: null,
        modelId: null,
        assignmentId: null,
        reason: `no_authorized_model:${selection.candidates.map((candidate) => `${candidate.modelId}=${candidate.reason}`).join(',') || 'none_registered'}`,
        candidates: evaluations,
        cost: null,
      };
    }

    return {
      workloadId: workload.workloadId,
      outcome: 'scheduled',
      placement: chosen.placement,
      nodeId: chosen.node.nodeId,
      modelId: selection.model?.modelId ?? null,
      assignmentId: null,
      reason: `security_then_correctness_then_availability_then_latency_then_cost;placement=${chosen.placement}`,
      candidates: evaluations,
      cost: estimateCost(workload, chosen.placement, selection.model),
    };
  }

  private commitAssignment(
    scope: TenantScope,
    workload: WorkloadRecord,
    decision: ScheduleDecision,
  ): ComputeAssignment {
    const nodeId = decision.nodeId!;
    const placement = decision.placement!;
    const model = decision.modelId ? this.models.get(decision.modelId) ?? null : null;
    const assignmentId = newId('asg');

    const assignment: ComputeAssignment = {
      assignmentId,
      workloadId: workload.workloadId,
      nodeId,
      organizationId: scope.organizationId,
      universeId: scope.universeId,
      agentId: workload.agentId,
      modelId: model?.modelId ?? null,
      modelBinding: model
        ? mintModelBinding(this.fabricKey, {
            assignmentId,
            modelId: model.modelId,
            fingerprint: model.fingerprint,
          })
        : null,
      placement,
      status: 'assigned',
      createdAt: this.now(),
      startedAt: null,
      finishedAt: null,
      checkpoint: null,
      terminationReason: null,
    };
    this.assignments.set(assignmentId, assignment);

    const cost = decision.cost ?? estimateCost(workload, placement, model);
    this.workloadCosts.set(workload.workloadId, cost);

    const charge = chargeForEstimate(workload.estimate, {
      usesGpu: placement === 'gpu',
      monetaryUsd: cost.monetaryUsd,
      energyWh: cost.energyWh,
      modelCalls: model ? 1 : 0,
    });
    const key = budgetKey(scope, { kind: 'node', id: nodeId });
    const budget = this.budgets.get(key);
    if (budget) {
      this.budgets.set(key, { ...budget, used: addUsage(budget.used, charge) });
      this.reservations.set(assignmentId, { key, charge });
    }

    this.trace({
      scope,
      workloadId: workload.workloadId,
      stage: 'node_ingress',
      nodeId,
      agentId: workload.agentId,
      modelId: model?.modelId ?? null,
      meetingId: workload.meetingId,
      inputDigest: taskDigest(workload.task),
      authorizationReason: decision.reason,
      note: `assignment ${assignmentId} on ${placement}`,
    });

    return assignment;
  }

  cancelWorkload(caller: CallerContext, workloadId: string, reason: string): Result<{ workload: WorkloadRecord }> {
    const denied = authorize(caller, 'workload.cancel');
    if (denied) return denied;

    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);

    for (const assignment of this.assignments.values()) {
      if (assignment.workloadId === workloadId) this.terminateAssignment(assignment.assignmentId, reason);
    }
    const updated: WorkloadRecord = { ...workload, status: 'cancelled' };
    this.workloads.set(workloadId, updated);
    return { ok: true, workload: updated };
  }

  /* ---------------------------------------------------------------- */
  /* Execution (simulated, bounded)                                    */
  /* ---------------------------------------------------------------- */

  startAssignment(
    caller: CallerContext,
    input: { assignmentId: string; challengeId: string; proof: string },
  ): Result<{ assignment: ComputeAssignment }> {
    const denied = authorize(caller, 'workload.execute');
    if (denied) return denied;

    const assignment = this.assignments.get(input.assignmentId);
    if (!assignment || !sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) {
      return deny('assignment_unknown', `assignment ${input.assignmentId} is not visible in this universe`);
    }
    if (assignment.status !== 'assigned') {
      return deny('assignment_terminated', `assignment ${input.assignmentId} is ${assignment.status}`);
    }

    const proof = this.consumeProof(caller, {
      nodeId: assignment.nodeId,
      challengeId: input.challengeId,
      proof: input.proof,
      purpose: 'execute',
    });
    if (!('node' in proof)) return proof;
    if (proof.node.lifecycle !== 'active') {
      return deny('assignment_terminated', `node ${assignment.nodeId} is ${proof.node.lifecycle}`);
    }

    const updated: ComputeAssignment = { ...assignment, status: 'running', startedAt: this.now() };
    this.assignments.set(assignment.assignmentId, updated);
    const workload = this.workloads.get(assignment.workloadId);
    if (workload) this.workloads.set(workload.workloadId, { ...workload, status: 'running' });
    return { ok: true, assignment: { ...updated } };
  }

  recordCheckpoint(
    caller: CallerContext,
    input: { assignmentId: string; progress: number; stateDigest: string },
  ): Result<{ checkpoint: AssignmentCheckpoint }> {
    const denied = authorize(caller, 'workload.execute');
    if (denied) return denied;

    const assignment = this.assignments.get(input.assignmentId);
    if (!assignment || !sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) {
      return deny('assignment_unknown', `assignment ${input.assignmentId} is not visible in this universe`);
    }
    if (assignment.status !== 'running') {
      return deny('assignment_terminated', `assignment ${input.assignmentId} is ${assignment.status}`);
    }

    const checkpoint: AssignmentCheckpoint = {
      at: this.now(),
      progress: Math.min(Math.max(input.progress, 0), 1),
      stateDigest: input.stateDigest,
    };
    this.assignments.set(assignment.assignmentId, { ...assignment, checkpoint });
    return { ok: true, checkpoint };
  }

  /**
   * Mid-flight metering. The governor can stop a running task the moment a
   * limit is reached rather than waiting for it to finish (section 17).
   */
  reportUsage(
    caller: CallerContext,
    input: { assignmentId: string; usage: Partial<ResourceUsage> },
  ): Result<{ directive: 'continue' | 'stop'; breaches: string[] }> {
    const denied = authorize(caller, 'workload.execute');
    if (denied) return denied;

    const assignment = this.assignments.get(input.assignmentId);
    if (!assignment || !sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) {
      return deny('assignment_unknown', `assignment ${input.assignmentId} is not visible in this universe`);
    }
    if (assignment.status !== 'running') {
      return deny('assignment_terminated', `assignment ${input.assignmentId} is ${assignment.status}`);
    }

    const key = budgetKey(caller.scope, { kind: 'node', id: assignment.nodeId });
    const budget = this.budgets.get(key);
    if (!budget) return { ok: true, directive: 'continue', breaches: [] };

    const charge = { ...zeroUsage(), ...input.usage };
    const breaches = overLimitDimensions(budget.limit, budget.used, charge);
    this.budgets.set(key, { ...budget, used: addUsage(budget.used, charge) });

    if (breaches.length > 0) {
      this.terminateAssignment(assignment.assignmentId, `budget_limit_reached:${breaches.join(',')}`);
      this.record(
        caller.scope,
        'budget_limit_reached',
        caller.actorId,
        `assignment ${assignment.assignmentId} stopped on ${breaches.join(',')}`,
        { nodeId: assignment.nodeId, workloadId: assignment.workloadId },
      );
      return { ok: true, directive: 'stop', breaches };
    }
    return { ok: true, directive: 'continue', breaches: [] };
  }

  completeAssignment(
    caller: CallerContext,
    input: {
      assignmentId: string;
      modelId: string | null;
      modelBinding: string | null;
      output: number;
      outputDigest: string;
      usage?: Partial<ResourceUsage>;
      consequentialActionKey?: string;
    },
  ): Result<{ assignment: ComputeAssignment; output: number; cost: CostEstimate | null }> {
    const denied = authorize(caller, 'workload.execute');
    if (denied) return denied;

    const assignment = this.assignments.get(input.assignmentId);
    if (!assignment || !sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) {
      return deny('assignment_unknown', `assignment ${input.assignmentId} is not visible in this universe`);
    }

    // The control plane does not depend on the workload agreeing that it was
    // stopped. A late result from a terminated assignment is refused.
    if (assignment.status !== 'running') {
      this.record(
        caller.scope,
        'post_termination_result_rejected',
        caller.actorId,
        `result arrived for ${assignment.status} assignment ${assignment.assignmentId}`,
        { nodeId: assignment.nodeId, workloadId: assignment.workloadId },
      );
      return deny('assignment_terminated', `assignment ${input.assignmentId} is ${assignment.status}`);
    }

    if (assignment.modelId) {
      const model = this.models.get(assignment.modelId);
      const claimMatches =
        input.modelId === assignment.modelId &&
        !!model &&
        !!input.modelBinding &&
        verifyModelBinding(this.fabricKey, {
          assignmentId: assignment.assignmentId,
          modelId: assignment.modelId,
          fingerprint: model.fingerprint,
        }, input.modelBinding);

      if (!claimMatches) {
        this.terminateAssignment(assignment.assignmentId, 'model_substitution_detected');
        this.quarantineNodeInternal(assignment.nodeId, 'model_substitution_detected');
        this.record(
          caller.scope,
          'model_substitution_detected',
          caller.actorId,
          `assignment ${assignment.assignmentId} approved ${assignment.modelId} but reported ${input.modelId ?? 'none'}`,
          { nodeId: assignment.nodeId, workloadId: assignment.workloadId },
        );
        return deny('model_substitution_detected', 'reported model does not match the approved binding');
      }
    }

    const workload = this.workloads.get(assignment.workloadId)!;
    const expected = runBoundedKernel(workload.task);
    if (expected.output !== input.output || expected.outputDigest !== input.outputDigest) {
      this.terminateAssignment(assignment.assignmentId, 'result_validation_failed');
      this.record(
        caller.scope,
        'result_validation_failed',
        caller.actorId,
        `assignment ${assignment.assignmentId} returned an unverifiable result`,
        { nodeId: assignment.nodeId, workloadId: assignment.workloadId },
      );
      return deny('result_validation_failed', 'reported result does not match the bounded kernel contract');
    }

    if (input.usage) {
      const metered = this.reportUsage(caller, { assignmentId: assignment.assignmentId, usage: input.usage });
      if (metered.ok && metered.directive === 'stop') {
        return deny('budget_limit_reached', `assignment stopped on ${metered.breaches.join(',')}`);
      }
    }

    if (workload.consequential) {
      const actionKey = input.consequentialActionKey ?? 'default';
      const ledgerKey = `${workload.workloadId}:${actionKey}`;
      const existing = this.consequentialLedger.get(ledgerKey);
      if (existing && existing.state === 'committed') {
        this.record(
          caller.scope,
          'consequential_replay_blocked',
          caller.actorId,
          `external action ${actionKey} for ${workload.workloadId} was already committed`,
          { nodeId: assignment.nodeId, workloadId: workload.workloadId },
        );
        return deny('consequential_replay_blocked', 'the external action for this workload has already been committed');
      }
      this.consequentialLedger.set(ledgerKey, {
        workloadId: workload.workloadId,
        actionKey,
        state: 'committed',
        assignmentId: assignment.assignmentId,
        at: this.now(),
      });
    }

    const finished: ComputeAssignment = { ...assignment, status: 'completed', finishedAt: this.now() };
    this.assignments.set(assignment.assignmentId, finished);
    this.reservations.delete(assignment.assignmentId);
    this.workloads.set(workload.workloadId, { ...workload, status: 'completed' });
    this.agentStateVersions.set(workload.agentId, (this.agentStateVersions.get(workload.agentId) ?? 0) + 1);

    this.trace({
      scope: caller.scope,
      workloadId: workload.workloadId,
      stage: 'transformation',
      nodeId: assignment.nodeId,
      agentId: workload.agentId,
      modelId: assignment.modelId,
      meetingId: workload.meetingId,
      inputDigest: taskDigest(workload.task),
      outputDigest: expected.outputDigest,
      authorizationReason: `assignment ${assignment.assignmentId} verified against the bounded kernel contract`,
      note: `kernel ${workload.task.kernel} on ${assignment.placement}`,
    });
    this.trace({
      scope: caller.scope,
      workloadId: workload.workloadId,
      stage: 'node_egress',
      nodeId: assignment.nodeId,
      agentId: workload.agentId,
      modelId: assignment.modelId,
      outputDigest: expected.outputDigest,
      authorizationReason: 'result released to the requesting agent identity only',
      note: 'egress',
    });

    return { ok: true, assignment: finished, output: expected.output, cost: this.workloadCosts.get(workload.workloadId) ?? null };
  }

  /* ---------------------------------------------------------------- */
  /* Kill switch (section 25)                                          */
  /* ---------------------------------------------------------------- */

  private terminateAssignment(assignmentId: string, reason: string): void {
    const assignment = this.assignments.get(assignmentId);
    if (!assignment) return;
    if (assignment.status === 'completed' || assignment.status === 'terminated') return;

    this.assignments.set(assignmentId, {
      ...assignment,
      status: 'terminated',
      finishedAt: this.now(),
      terminationReason: reason,
    });

    const reservation = this.reservations.get(assignmentId);
    if (reservation) {
      const budget = this.budgets.get(reservation.key);
      if (budget) {
        const released = { ...budget.used };
        for (const dimension of Object.keys(released) as (keyof ResourceUsage)[]) {
          released[dimension] = Math.max(0, released[dimension] - reservation.charge[dimension]);
        }
        this.budgets.set(reservation.key, { ...budget, used: released });
      }
      this.reservations.delete(assignmentId);
    }
  }

  private quarantineNodeInternal(nodeId: string, reason: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    this.nodes.set(nodeId, {
      ...node,
      lifecycle: 'quarantined',
      attestationState: 'quarantined',
      healthState: 'degraded',
    });
    for (const assignment of this.assignments.values()) {
      if (assignment.nodeId === nodeId) this.terminateAssignment(assignment.assignmentId, reason);
    }
  }

  private setLifecycle(
    caller: CallerContext,
    nodeId: string,
    lifecycle: RuntimeNodeRecord['lifecycle'],
    reason: string,
  ): Result<{ node: RuntimeNodeRecord; terminatedAssignments: string[] }> {
    const denied = authorize(caller, 'runtime.lifecycle');
    if (denied) return denied;

    const node = this.scopedNode(caller, nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${nodeId} is not registered in this universe`);

    const terminated: string[] = [];
    const drainOnly = lifecycle === 'paused' || lifecycle === 'draining';
    for (const assignment of this.assignments.values()) {
      if (assignment.nodeId !== nodeId) continue;
      if (assignment.status !== 'assigned' && assignment.status !== 'running') continue;
      if (drainOnly && assignment.status === 'running') continue;
      this.terminateAssignment(assignment.assignmentId, reason);
      terminated.push(assignment.assignmentId);
    }

    const updated: RuntimeNodeRecord = {
      ...node,
      lifecycle,
      attestationState:
        lifecycle === 'quarantined' ? 'quarantined' : lifecycle === 'revoked' ? 'revoked' : node.attestationState,
      revokedAt: lifecycle === 'revoked' ? this.now() : node.revokedAt,
      trustLevel: lifecycle === 'revoked' ? 'untrusted' : node.trustLevel,
    };
    this.nodes.set(nodeId, updated);

    if (lifecycle === 'quarantined') {
      this.record(caller.scope, 'runtime_quarantined', caller.actorId, reason, { nodeId });
    }
    if (lifecycle === 'revoked') {
      this.record(caller.scope, 'runtime_revoked', caller.actorId, reason, { nodeId });
      this.nodeSecrets.delete(nodeId);
    }

    return { ok: true, node: { ...updated }, terminatedAssignments: terminated };
  }

  pauseRuntime(caller: CallerContext, nodeId: string, reason: string) {
    return this.setLifecycle(caller, nodeId, 'paused', reason);
  }

  drainRuntime(caller: CallerContext, nodeId: string, reason: string) {
    return this.setLifecycle(caller, nodeId, 'draining', reason);
  }

  quarantineRuntime(caller: CallerContext, nodeId: string, reason: string) {
    return this.setLifecycle(caller, nodeId, 'quarantined', reason);
  }

  revokeRuntime(caller: CallerContext, nodeId: string, reason: string) {
    return this.setLifecycle(caller, nodeId, 'revoked', reason);
  }

  stopTask(caller: CallerContext, workloadId: string, reason: string): Result<{ terminated: string[] }> {
    const denied = authorize(caller, 'workload.cancel');
    if (denied) return denied;
    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);

    const terminated: string[] = [];
    for (const assignment of this.assignments.values()) {
      if (assignment.workloadId !== workloadId) continue;
      if (assignment.status !== 'assigned' && assignment.status !== 'running') continue;
      this.terminateAssignment(assignment.assignmentId, reason);
      terminated.push(assignment.assignmentId);
    }
    this.workloads.set(workloadId, { ...workload, status: 'cancelled' });
    return { ok: true, terminated };
  }

  stopAgent(caller: CallerContext, agentId: string, reason: string): Result<{ terminated: string[] }> {
    const denied = authorize(caller, 'workload.cancel');
    if (denied) return denied;
    this.stoppedAgents.add(agentId);

    const terminated: string[] = [];
    for (const assignment of this.assignments.values()) {
      if (assignment.agentId !== agentId) continue;
      if (!sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) continue;
      if (assignment.status !== 'assigned' && assignment.status !== 'running') continue;
      this.terminateAssignment(assignment.assignmentId, reason);
      terminated.push(assignment.assignmentId);
    }
    for (const [id, agentAssignment] of this.agentAssignments) {
      if (agentAssignment.agentId === agentId && !agentAssignment.releasedAt) {
        this.agentAssignments.set(id, { ...agentAssignment, releasedAt: this.now() });
      }
    }
    return { ok: true, terminated };
  }

  stopMeeting(caller: CallerContext, meetingId: string, reason: string): Result<{ terminated: string[] }> {
    const denied = authorize(caller, 'workload.cancel');
    if (denied) return denied;
    this.stoppedMeetings.add(meetingId);

    const terminated: string[] = [];
    for (const workload of this.workloads.values()) {
      if (workload.meetingId !== meetingId) continue;
      if (!sameScope(caller.scope, { organizationId: workload.organizationId, universeId: workload.universeId })) continue;
      const stopped = this.stopTask(caller, workload.workloadId, reason);
      if (stopped.ok) terminated.push(...stopped.terminated);
    }
    return { ok: true, terminated };
  }

  /* ---------------------------------------------------------------- */
  /* Agent mobility (section 15)                                       */
  /* ---------------------------------------------------------------- */

  private qualifyAgentDestination(
    caller: CallerContext,
    nodeId: string,
    capabilities: readonly CapabilityDescriptor[],
    ceiling: SecurityClassification,
  ): Result<{ node: RuntimeNodeRecord }> {
    const node = this.scopedNode(caller, nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${nodeId} is not registered in this universe`);
    if (node.lifecycle !== 'active') return deny('runtime_quarantined', `node ${nodeId} is ${node.lifecycle}`);
    if (node.attestationState !== 'attested' && node.attestationState !== 'verified') {
      return deny('runtime_not_attested', `node ${nodeId} is ${node.attestationState}`);
    }
    if (CLASSIFICATION_RANK[ceiling] > CLASSIFICATION_RANK[node.securityPolicy.maxClassification]) {
      return deny('caller_unauthorized', `node ${nodeId} may not hold ${ceiling} data`);
    }
    for (const capability of capabilities) {
      if (!node.capabilities.some((offered) => capabilitySatisfies(offered, capability))) {
        return deny('caller_unauthorized', `node ${nodeId} does not offer ${capability}`);
      }
    }
    return { ok: true, node };
  }

  assignAgentRuntime(
    caller: CallerContext,
    input: {
      agentId: string;
      nodeId: string;
      grantedCapabilities: readonly CapabilityDescriptor[];
      classificationCeiling: SecurityClassification;
    },
  ): Result<{ assignment: AgentRuntimeAssignment }> {
    const denied = authorize(caller, 'agent.assign');
    if (denied) {
      if (caller.actorType === 'agent') {
        this.record(caller.scope, 'permission_expansion_blocked', caller.actorId, 'agent attempted to place itself on a runtime');
      }
      return denied;
    }

    const qualified = this.qualifyAgentDestination(
      caller,
      input.nodeId,
      input.grantedCapabilities,
      input.classificationCeiling,
    );
    if (!qualified.ok) return qualified;

    const assignment: AgentRuntimeAssignment = {
      id: newId('ara'),
      agentId: input.agentId,
      organizationId: caller.scope.organizationId,
      universeId: caller.scope.universeId,
      nodeId: input.nodeId,
      grantedCapabilities: [...input.grantedCapabilities],
      classificationCeiling: input.classificationCeiling,
      createdAt: this.now(),
      releasedAt: null,
    };
    this.agentAssignments.set(assignment.id, assignment);
    return { ok: true, assignment: { ...assignment } };
  }

  /**
   * Moving execution does not move data. The destination re-qualifies from
   * scratch; nothing about the previous placement carries over except the
   * agent identity itself.
   */
  moveAgentRuntime(
    caller: CallerContext,
    input: { agentId: string; toNodeId: string },
  ): Result<{ assignment: AgentRuntimeAssignment; dataTransferred: false; previousNodeId: string | null }> {
    const denied = authorize(caller, 'agent.assign');
    if (denied) return denied;

    const current = [...this.agentAssignments.values()].find(
      (candidate) =>
        candidate.agentId === input.agentId &&
        !candidate.releasedAt &&
        sameScope(caller.scope, { organizationId: candidate.organizationId, universeId: candidate.universeId }),
    );

    const capabilities = current?.grantedCapabilities ?? [];
    const ceiling = current?.classificationCeiling ?? 'public';
    const qualified = this.qualifyAgentDestination(caller, input.toNodeId, capabilities, ceiling);
    if (!qualified.ok) return qualified;

    if (current) this.agentAssignments.set(current.id, { ...current, releasedAt: this.now() });

    const assignment: AgentRuntimeAssignment = {
      id: newId('ara'),
      agentId: input.agentId,
      organizationId: caller.scope.organizationId,
      universeId: caller.scope.universeId,
      nodeId: input.toNodeId,
      grantedCapabilities: [...capabilities],
      classificationCeiling: ceiling,
      createdAt: this.now(),
      releasedAt: null,
    };
    this.agentAssignments.set(assignment.id, assignment);

    return {
      ok: true,
      assignment: { ...assignment },
      dataTransferred: false,
      previousNodeId: current?.nodeId ?? null,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Offline (sections 11, 12)                                         */
  /* ---------------------------------------------------------------- */

  createOfflinePackage(
    caller: CallerContext,
    input: { nodeId: string; agentIds: readonly string[]; grant: Partial<OfflineGrant>; ttlMs: number },
  ): Result<{ package: OfflineWorkPackage }> {
    const denied = authorize(caller, 'offline.create');
    if (denied) return denied;

    const node = this.scopedNode(caller, input.nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered in this universe`);
    if (!node.securityPolicy.allowOfflinePackages) {
      return deny('caller_unauthorized', `node ${input.nodeId} is not permitted to hold offline packages`);
    }
    if (node.attestationState !== 'attested') {
      return deny('runtime_not_attested', `node ${input.nodeId} must be attested before an offline grant`);
    }

    const ceiling: OfflineGrant = {
      ...OFFLINE_GRANT_CEILING,
      allowedModels: [...this.models.values()]
        .filter((model) => model.availability === 'available' && model.runtimeType === 'on_device')
        .map((model) => model.modelId),
      classificationCeiling:
        CLASSIFICATION_RANK[node.securityPolicy.maxClassification] <
        CLASSIFICATION_RANK[OFFLINE_GRANT_CEILING.classificationCeiling]
          ? node.securityPolicy.maxClassification
          : OFFLINE_GRANT_CEILING.classificationCeiling,
    };

    const issuedAt = this.clock();
    const body = {
      packageId: newId('owp'),
      organizationId: caller.scope.organizationId,
      universeId: caller.scope.universeId,
      nodeId: input.nodeId,
      agentIds: [...input.agentIds],
      grant: boundGrant(input.grant, ceiling),
      baseStateVersion: input.agentIds.reduce((total, agentId) => total + (this.agentStateVersions.get(agentId) ?? 0), 0),
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + input.ttlMs).toISOString(),
      issuedBy: caller.actorId,
    };

    const pkg: OfflineWorkPackage = { ...body, signature: signOfflinePackage(this.fabricKey, body) };
    this.offlinePackages.set(pkg.packageId, pkg);
    return { ok: true, package: pkg };
  }

  validateOfflinePackage(caller: CallerContext, pkg: OfflineWorkPackage): Result<{ package: OfflineWorkPackage }> {
    const denied = authorize(caller, 'offline.sync');
    if (denied) return denied;

    if (!verifyOfflinePackage(this.fabricKey, pkg)) {
      this.record(caller.scope, 'offline_authority_exceeded', caller.actorId, `package ${pkg.packageId} failed signature verification`, {
        nodeId: pkg.nodeId,
      });
      return deny('offline_signature_invalid', 'offline package signature does not verify');
    }
    if (!sameScope(caller.scope, { organizationId: pkg.organizationId, universeId: pkg.universeId })) {
      return deny('offline_package_unknown', `package ${pkg.packageId} is not visible in this universe`);
    }
    const known = this.offlinePackages.get(pkg.packageId);
    if (!known || canonicalJson(packageBody(known)) !== canonicalJson(packageBody(pkg))) {
      return deny('offline_package_unknown', `package ${pkg.packageId} was not issued by this control plane`);
    }
    if (this.clock().getTime() > new Date(pkg.expiresAt).getTime()) {
      return deny('offline_package_expired', `package ${pkg.packageId} expired at ${pkg.expiresAt}`);
    }
    return { ok: true, package: pkg };
  }

  syncOfflineResults(
    caller: CallerContext,
    input: {
      package: OfflineWorkPackage;
      results: readonly OfflineTaskResult[];
      reauthentication: { challengeId: string; proof: string };
    },
  ): Result<{ event: SyncEvent }> {
    const denied = authorize(caller, 'offline.sync');
    if (denied) return denied;

    const validated = this.validateOfflinePackage(caller, input.package);
    if (!validated.ok) return validated;

    // Reconnecting is a fresh authentication, not a resumption of trust.
    const proof = this.consumeProof(caller, {
      nodeId: input.package.nodeId,
      challengeId: input.reauthentication.challengeId,
      proof: input.reauthentication.proof,
      purpose: 'sync',
    });
    if (!('node' in proof)) return proof;

    if (this.consumedPackages.has(input.package.packageId)) {
      return deny('offline_package_unknown', `package ${input.package.packageId} was already synchronized`);
    }

    const audit = auditOfflineResults(input.package, input.results);
    const currentVersion = input.package.agentIds.reduce(
      (total, agentId) => total + (this.agentStateVersions.get(agentId) ?? 0),
      0,
    );

    let status: SyncEvent['status'] = 'accepted';
    let reason = 'within_granted_authority';

    if (audit.violations.length > 0) {
      status = 'rejected';
      reason = audit.violations.join(';');
      this.record(caller.scope, 'offline_authority_exceeded', caller.actorId, reason, { nodeId: input.package.nodeId });
    } else if (currentVersion !== input.package.baseStateVersion) {
      status = 'conflict';
      reason = `state_version_moved:${input.package.baseStateVersion}->${currentVersion}`;
    }

    const event: SyncEvent = {
      id: newId('syn'),
      packageId: input.package.packageId,
      at: this.now(),
      status,
      reason,
      acceptedTaskIds: status === 'accepted' ? audit.acceptedTaskIds : [],
      rejectedTaskIds: status === 'accepted' ? [] : input.results.map((result) => result.taskId),
    };
    this.syncEvents.push(event);
    this.consumedPackages.add(input.package.packageId);

    if (status === 'accepted') {
      for (const agentId of input.package.agentIds) {
        this.agentStateVersions.set(agentId, (this.agentStateVersions.get(agentId) ?? 0) + 1);
      }
      for (const result of input.results) {
        this.lineage.push({
          id: newId('lin'),
          at: this.now(),
          organizationId: input.package.organizationId,
          universeId: input.package.universeId,
          workloadId: `${input.package.packageId}:${result.taskId}`,
          stage: 'offline_sync',
          nodeId: input.package.nodeId,
          agentId: input.package.agentIds[0] ?? null,
          modelId: result.modelId,
          meetingId: null,
          inputDigest: null,
          outputDigest: result.outputDigest,
          authorizationReason: `offline grant ${input.package.packageId} accepted after reauthentication`,
          note: result.transcript,
        });
      }
    }

    return { ok: true, event };
  }

  /* ---------------------------------------------------------------- */
  /* XDN — device to device (section 13)                               */
  /* ---------------------------------------------------------------- */

  openDeviceChannel(
    caller: CallerContext,
    input: { fromNodeId: string; toNodeId: string; proximity?: 'same_room' | 'same_network' | 'remote' },
  ): Result<{ channel: DeviceChannel }> {
    const denied = authorize(caller, 'runtime.read');
    if (denied) return denied;

    const from = this.nodes.get(input.fromNodeId);
    const to = this.nodes.get(input.toNodeId);
    if (!from || !to) return deny('runtime_identity_unknown', 'both peers must be registered runtime nodes');

    // Physical proximity establishes nothing. Only identity, attestation and a
    // shared Universe do.
    if (
      from.organizationId !== to.organizationId ||
      from.universeId !== to.universeId ||
      !sameScope(caller.scope, { organizationId: from.organizationId, universeId: from.universeId })
    ) {
      this.record(
        caller.scope,
        'proximity_trust_rejected',
        caller.actorId,
        `channel refused between universes (${input.proximity ?? 'unspecified'} proximity)`,
        { nodeId: input.toNodeId },
      );
      return deny('channel_tenant_mismatch', 'device channels never cross a Universe boundary');
    }

    for (const peer of [from, to]) {
      if (peer.lifecycle !== 'active' || (peer.attestationState !== 'attested' && peer.attestationState !== 'verified')) {
        this.record(
          caller.scope,
          'proximity_trust_rejected',
          caller.actorId,
          `peer ${peer.nodeId} is ${peer.lifecycle}/${peer.attestationState}`,
          { nodeId: peer.nodeId },
        );
        return deny('channel_peer_unauthorized', `peer ${peer.nodeId} is not authorized for a device channel`);
      }
    }

    const ceiling: SecurityClassification =
      CLASSIFICATION_RANK[from.securityPolicy.maxClassification] <=
      CLASSIFICATION_RANK[to.securityPolicy.maxClassification]
        ? from.securityPolicy.maxClassification
        : to.securityPolicy.maxClassification;

    const channel: DeviceChannel = {
      channelId: newId('xdn'),
      organizationId: from.organizationId,
      universeId: from.universeId,
      fromNodeId: from.nodeId,
      toNodeId: to.nodeId,
      classificationCeiling: ceiling,
      cipherSuite: 'authenticated-encryption/placeholder-queued',
      openedAt: this.now(),
    };
    this.channels.set(channel.channelId, channel);
    return { ok: true, channel };
  }

  /* ---------------------------------------------------------------- */
  /* Failure recovery (section 26)                                     */
  /* ---------------------------------------------------------------- */

  reportNodeFailure(
    caller: CallerContext,
    input: { nodeId: string; detail: string },
  ): Result<{
    rescheduled: { workloadId: string; assignmentId: string; nodeId: string; mode: 'resume' | 'restart' }[];
    heldForHumanReview: { workloadId: string; reason: string }[];
    queued: string[];
  }> {
    const denied = authorize(caller, 'runtime.lifecycle');
    if (denied) return denied;

    const node = this.scopedNode(caller, input.nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${input.nodeId} is not registered in this universe`);

    this.nodes.set(node.nodeId, { ...node, healthState: 'unreachable' });

    const rescheduled: { workloadId: string; assignmentId: string; nodeId: string; mode: 'resume' | 'restart' }[] = [];
    const heldForHumanReview: { workloadId: string; reason: string }[] = [];
    const queued: string[] = [];

    for (const assignment of [...this.assignments.values()]) {
      if (assignment.nodeId !== node.nodeId) continue;
      if (assignment.status !== 'assigned' && assignment.status !== 'running') continue;

      const checkpoint = assignment.checkpoint;
      this.terminateAssignment(assignment.assignmentId, `node_failure:${input.detail}`);
      this.assignments.set(assignment.assignmentId, {
        ...this.assignments.get(assignment.assignmentId)!,
        status: 'failed',
      });

      const workload = this.workloads.get(assignment.workloadId);
      if (!workload) continue;

      if (workload.consequential) {
        const ledger = [...this.consequentialLedger.values()].find((entry) => entry.workloadId === workload.workloadId);
        const reason = ledger?.state === 'committed' ? 'external_action_already_committed' : 'external_action_outcome_unknown';
        this.consequentialLedger.set(`${workload.workloadId}:recovery`, {
          workloadId: workload.workloadId,
          actionKey: 'recovery',
          state: 'held_for_human_review',
          assignmentId: assignment.assignmentId,
          at: this.now(),
        });
        this.workloads.set(workload.workloadId, { ...workload, status: 'held_for_human_review' });
        this.record(
          caller.scope,
          'consequential_replay_blocked',
          caller.actorId,
          `${workload.workloadId} will not be replayed automatically: ${reason}`,
          { nodeId: node.nodeId, workloadId: workload.workloadId },
        );
        heldForHumanReview.push({ workloadId: workload.workloadId, reason });
        continue;
      }

      const mode: 'resume' | 'restart' =
        checkpoint && checkpoint.progress > 0 && checkpoint.stateDigest.startsWith('sha256:') ? 'resume' : 'restart';

      const decision = this.planPlacement(caller.scope, workload, [node.nodeId]);
      if (decision.outcome === 'scheduled' && decision.nodeId) {
        const replacement = this.commitAssignment(caller.scope, workload, decision);
        this.assignments.set(replacement.assignmentId, {
          ...replacement,
          checkpoint: mode === 'resume' ? checkpoint : null,
        });
        this.workloads.set(workload.workloadId, {
          ...workload,
          status: 'scheduled',
          attempts: workload.attempts + 1,
        });
        rescheduled.push({
          workloadId: workload.workloadId,
          assignmentId: replacement.assignmentId,
          nodeId: decision.nodeId,
          mode,
        });
      } else {
        this.workloads.set(workload.workloadId, { ...workload, status: 'queued' });
        queued.push(workload.workloadId);
      }
    }

    return { ok: true, rescheduled, heldForHumanReview, queued };
  }

  /* ---------------------------------------------------------------- */
  /* Meetings, approvals and lineage (sections 22, 23, 30)             */
  /* ---------------------------------------------------------------- */

  recordAgentMeeting(
    caller: CallerContext,
    input: { workloadId: string; meetingId: string; participants: readonly string[]; transcript: string },
  ): Result<{ transcriptDigest: string }> {
    const denied = authorize(caller, 'workload.submit');
    if (denied) return denied;
    const workload = this.scopedWorkload(caller, input.workloadId);
    if (!workload) return deny('workload_unknown', `workload ${input.workloadId} is not visible in this universe`);
    if (this.stoppedMeetings.has(input.meetingId)) {
      return deny('workload_terminated', `meeting ${input.meetingId} is stopped by an operator`);
    }

    const transcriptDigest = digest({ meetingId: input.meetingId, transcript: input.transcript });
    this.trace({
      scope: caller.scope,
      workloadId: input.workloadId,
      stage: 'meeting',
      agentId: workload.agentId,
      meetingId: input.meetingId,
      outputDigest: transcriptDigest,
      authorizationReason: `participants ${input.participants.join(',')}`,
      note: 'agent meeting recorded against the workload result',
    });
    return { ok: true, transcriptDigest };
  }

  recordHumanDecision(
    caller: CallerContext,
    input: { workloadId: string; meetingId: string | null; decision: 'approved' | 'rejected'; note: string },
  ): Result<{ recorded: true }> {
    if (caller.actorType !== 'human_operator') {
      return deny('caller_unauthorized', 'only a human operator can record the approval decision');
    }
    const workload = this.scopedWorkload(caller, input.workloadId);
    if (!workload) return deny('workload_unknown', `workload ${input.workloadId} is not visible in this universe`);

    this.trace({
      scope: caller.scope,
      workloadId: input.workloadId,
      stage: 'decision',
      agentId: workload.agentId,
      meetingId: input.meetingId,
      authorizationReason: `human ${caller.actorId} ${input.decision}`,
      note: input.note,
    });
    return { ok: true, recorded: true };
  }

  getLineage(caller: CallerContext, workloadId: string): Result<{ lineage: LineageReconstruction }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;

    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);

    const chain = this.lineage.filter(
      (entry) =>
        entry.workloadId === workloadId &&
        sameScope(caller.scope, { organizationId: entry.organizationId, universeId: entry.universeId }),
    );

    const nodeIds = [...new Set(chain.map((entry) => entry.nodeId).filter((id): id is string => Boolean(id)))];
    const hardware = nodeIds
      .map((nodeId) => this.nodes.get(nodeId))
      .filter((node): node is RuntimeNodeRecord => Boolean(node))
      .map((node) => ({
        nodeId: node.nodeId,
        cpuVendor: node.hardware.cpuVendor,
        gpuVendor: node.hardware.gpuVendor,
        region: node.region,
      }));

    return {
      ok: true,
      lineage: {
        workloadId,
        chain,
        hardware,
        models: [...new Set(chain.map((entry) => entry.modelId).filter((id): id is string => Boolean(id)))],
        requestingAgentId: workload.agentId,
        authorizationReasons: chain.map((entry) => entry.authorizationReason),
        cost: this.workloadCosts.get(workloadId) ?? null,
      },
    };
  }

  listSecurityEvents(caller: CallerContext): Result<{ events: RuntimeSecurityEvent[] }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    return {
      ok: true,
      events: this.securityEvents.filter((event) =>
        sameScope(caller.scope, { organizationId: event.organizationId, universeId: event.universeId }),
      ),
    };
  }

  listSyncEvents(caller: CallerContext): Result<{ events: SyncEvent[] }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    const visible = new Set(
      [...this.offlinePackages.values()]
        .filter((pkg) => sameScope(caller.scope, { organizationId: pkg.organizationId, universeId: pkg.universeId }))
        .map((pkg) => pkg.packageId),
    );
    return { ok: true, events: this.syncEvents.filter((event) => visible.has(event.packageId)) };
  }

  listWorkloads(caller: CallerContext): Result<{ workloads: WorkloadRecord[] }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    return {
      ok: true,
      workloads: [...this.workloads.values()].filter((workload) =>
        sameScope(caller.scope, { organizationId: workload.organizationId, universeId: workload.universeId }),
      ),
    };
  }

  getAssignment(caller: CallerContext, assignmentId: string): Result<{ assignment: ComputeAssignment }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    const assignment = this.assignments.get(assignmentId);
    if (!assignment || !sameScope(caller.scope, { organizationId: assignment.organizationId, universeId: assignment.universeId })) {
      return deny('assignment_unknown', `assignment ${assignmentId} is not visible in this universe`);
    }
    return { ok: true, assignment: { ...assignment } };
  }

  getNode(caller: CallerContext, nodeId: string): Result<{ node: RuntimeNodeRecord }> {
    const denied = authorize(caller, 'runtime.read');
    if (denied) return denied;
    const node = this.scopedNode(caller, nodeId);
    if (!node) return deny('runtime_identity_unknown', `node ${nodeId} is not registered in this universe`);
    return { ok: true, node: { ...node } };
  }

  getWorkload(caller: CallerContext, workloadId: string): Result<{ workload: WorkloadRecord }> {
    const denied = authorize(caller, 'audit.read');
    if (denied) return denied;
    const workload = this.scopedWorkload(caller, workloadId);
    if (!workload) return deny('workload_unknown', `workload ${workloadId} is not visible in this universe`);
    return { ok: true, workload: { ...workload } };
  }
}

export function createRuntimeFabric(options?: RuntimeFabricOptions): RuntimeFabric {
  return new RuntimeFabric(options);
}
