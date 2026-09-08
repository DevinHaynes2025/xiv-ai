import { LogicalAgentRegistry } from './agents';
import { AttestationService, DEFAULT_TRUST_POLICY } from './attestation';
import { AuditLedger } from './audit';
import { ApprovalRegistry, PrincipalDirectory, WorkloadAuthorizer } from './authorization';
import { systemClock, type Clock } from './clock';
import { ControlPlane } from './control';
import { CostLedger } from './cost';
import { generateSigningKeys, type SigningKeys } from './crypto';
import { WorkloadEngine } from './execution';
import { ExternalActionLedger } from './external-actions';
import { ResourceGovernor, type TenantQuota } from './governor';
import { detectHostHardwareClass, HardwareRegistry } from './hardware';
import { IdFactory } from './ids';
import { BypassRegistry, TenantStore, type IsolationCounters } from './isolation';
import { LineageStore } from './lineage';
import { MeetingRegistry } from './meetings';
import { ModelRegistry, providerConfigured } from './models';
import { NodeRegistry } from './nodes';
import { OfflineAuthority } from './offline';
import { ReleaseLedger } from './release';
import { ComputeRouter } from './router';
import { SnapshotService } from './snapshot';
import { TelemetryHub } from './telemetry';
import type {
  AttestationRecord,
  HardwareProfile,
  ModelRegistryEntry,
  RuntimeNode,
  TenantRef,
  TrustPolicy,
  WorkloadClassification,
  WorkloadRecord,
} from './types';

export const RUNTIME_CONTRACT_VERSION = '62d.1';

/** The one model this repository can actually execute: a local deterministic runtime. */
export const LOCAL_REFERENCE_MODEL_ID = 'xiv-local-reference-1';

export type PlaneOptions = {
  clock?: Clock;
  keys?: SigningKeys;
  env?: NodeJS.ProcessEnv;
  trustPolicy?: TrustPolicy;
  version?: string;
};

/**
 * The XIV distributed runtime plane for 2I-AI-62D.
 *
 * This is the bounded staging control plane: node identity, attestation, tenant
 * isolation, workload authorization, compute routing, resource governance,
 * logical agent registry, offline authority, kill switch, provenance, telemetry,
 * cost, backup and rollback. It runs in one process against in-memory stores.
 * It is deliberately not a production deployment of those subsystems.
 */
export class RuntimePlane {
  readonly clock: Clock;
  readonly ids: IdFactory;
  readonly keys: SigningKeys;
  readonly audit: AuditLedger;
  readonly lineage: LineageStore;
  readonly telemetry: TelemetryHub;
  readonly isolationCounters: IsolationCounters = {
    deniedReads: 0,
    deniedWrites: 0,
    allowedReads: 0,
    allowedWrites: 0,
  };
  readonly bypass: BypassRegistry;
  readonly nodeStore: TenantStore<RuntimeNode>;
  readonly workloadStore: TenantStore<WorkloadRecord>;
  readonly principals: PrincipalDirectory;
  readonly approvals: ApprovalRegistry;
  readonly authorizer: WorkloadAuthorizer;
  readonly nodes: NodeRegistry;
  readonly attestation: AttestationService;
  readonly hardware: HardwareRegistry;
  readonly models: ModelRegistry;
  readonly governor: ResourceGovernor;
  readonly router: ComputeRouter;
  readonly control: ControlPlane;
  readonly external: ExternalActionLedger;
  readonly cost: CostLedger;
  readonly agents: LogicalAgentRegistry;
  readonly engine: WorkloadEngine;
  readonly offline: OfflineAuthority;
  readonly meetings: MeetingRegistry;
  readonly snapshots: SnapshotService;
  readonly releases: ReleaseLedger;
  readonly hostHardware: { classId: HardwareProfile['classId']; profile: HardwareProfile };
  readonly version: string;

  constructor(options: PlaneOptions = {}) {
    const env = options.env ?? process.env;
    this.clock = options.clock ?? systemClock;
    this.ids = new IdFactory();
    this.keys = options.keys ?? generateSigningKeys();
    this.version = options.version ?? '62d.1.0';
    this.audit = new AuditLedger(this.clock, this.ids);
    this.lineage = new LineageStore(this.clock, this.ids);
    this.telemetry = new TelemetryHub(this.clock, this.ids);
    this.bypass = new BypassRegistry();
    this.nodeStore = new TenantStore<RuntimeNode>('nodes', this.audit, this.isolationCounters);
    this.workloadStore = new TenantStore<WorkloadRecord>('workloads', this.audit, this.isolationCounters);
    this.principals = new PrincipalDirectory(this.clock, this.ids);
    this.approvals = new ApprovalRegistry(this.clock, this.ids, this.audit);
    this.authorizer = new WorkloadAuthorizer(
      this.clock,
      this.ids,
      this.keys,
      this.audit,
      this.principals,
      this.approvals,
    );
    this.nodes = new NodeRegistry(this.nodeStore, this.clock, this.ids, this.keys, this.audit);
    this.attestation = new AttestationService(
      this.clock,
      this.ids,
      this.keys,
      this.audit,
      options.trustPolicy ?? DEFAULT_TRUST_POLICY,
    );
    this.hardware = new HardwareRegistry([LOCAL_REFERENCE_MODEL_ID]);
    this.hostHardware = detectHostHardwareClass();
    this.hardware.registerLocalAdapter({
      classId: this.hostHardware.classId,
      accelerators: this.hostHardware.profile.accelerators,
    });
    this.models = new ModelRegistry(this.clock, this.ids, this.audit);
    this.governor = new ResourceGovernor(this.clock, this.ids, this.audit);
    this.router = new ComputeRouter(this.clock, this.ids, this.audit, this.hardware, this.attestation);
    this.control = new ControlPlane(this.clock, this.ids, this.audit);
    this.external = new ExternalActionLedger(this.clock, this.ids, this.audit);
    this.cost = new CostLedger(this.clock, this.ids, this.audit);
    this.agents = new LogicalAgentRegistry(this.clock, this.ids, this.audit, this.attestation);
    this.engine = new WorkloadEngine({
      clock: this.clock,
      ids: this.ids,
      keys: this.keys,
      audit: this.audit,
      telemetry: this.telemetry,
      lineage: this.lineage,
      principals: this.principals,
      approvals: this.approvals,
      authorizer: this.authorizer,
      nodes: this.nodes,
      attestation: this.attestation,
      hardware: this.hardware,
      models: this.models,
      governor: this.governor,
      router: this.router,
      control: this.control,
      external: this.external,
      cost: this.cost,
      workloads: this.workloadStore,
    });
    this.offline = new OfflineAuthority(
      this.clock,
      this.ids,
      this.keys,
      this.audit,
      this.lineage,
      this.external,
    );
    this.meetings = new MeetingRegistry(this.clock, this.ids, this.keys, this.audit);
    this.releases = new ReleaseLedger(this.clock, this.audit);
    this.snapshots = new SnapshotService(this.clock, this.ids, this.audit, {
      version: this.version,
      exportTables: () => this.exportTables(),
      restoreTables: (tables) => this.restoreTables(tables),
      countRecords: (tables) => RuntimePlane.countRecords(tables),
    });

    this.registerBaselineModels(env);
    this.bindControlPlane();
    this.registerBaselineTelemetry();
  }

  /**
   * Registers the release's model inventory. Provider availability is read from
   * the environment: with no provider key configured, the hosted entries stay
   * UNAVAILABLE and only the local deterministic runtime can be invoked.
   */
  private registerBaselineModels(env: NodeJS.ProcessEnv) {
    const localEntry: ModelRegistryEntry = {
      modelId: LOCAL_REFERENCE_MODEL_ID,
      provider: 'xiv_local',
      displayName: 'XIV local deterministic reference runtime',
      approved: true,
      providerConfigured: true,
      evaluationGate: {
        evaluationId: 'eval_local_reference_1',
        passed: true,
        evaluatedAt: this.clock.now(),
        evidenceUri: 'services/runtime/acceptance/ac06-hardware-portability.ts',
      },
      maxTokens: 4096,
      costPerKTokenUsd: 0,
      classifications: ['public', 'internal', 'confidential', 'restricted'],
    };
    this.models.register(localEntry);

    for (const provider of ['gemini', 'openai', 'anthropic'] as const) {
      this.models.register({
        modelId: `${provider}-hosted-unconfigured`,
        provider,
        displayName: `${provider} hosted model`,
        approved: false,
        providerConfigured: providerConfigured(provider, env),
        maxTokens: 0,
        costPerKTokenUsd: null,
        classifications: [],
      });
    }
  }

  private bindControlPlane() {
    this.control.bind({
      stopTask: (tenant, workloadId, reason) => this.engine.stopTask(tenant, workloadId, reason),
      stopAgent: (tenant, agentId, reason) => {
        const agent = this.agents.get(tenant, agentId);
        if (!agent) return false;
        for (const record of this.engine.runningWorkloadsForAgent(agentId)) {
          this.engine.stopTask(tenant, record.workloadId, reason);
        }
        this.agents.deactivate(tenant, agentId, reason);
        return true;
      },
      stopMeeting: (tenant, meetingId, reason) => {
        if (!this.meetings.isOpen(meetingId)) return false;
        this.meetings.close(tenant, meetingId, reason);
        return true;
      },
      pauseNode: (tenant, nodeId, reason) => this.applyNodeControl(tenant, nodeId, 'paused', reason),
      quarantineNode: (tenant, nodeId, reason) => this.applyNodeControl(tenant, nodeId, 'quarantined', reason),
      revokeNode: (tenant, nodeId, reason) => this.applyNodeControl(tenant, nodeId, 'revoked', reason),
    });
  }

  private applyNodeControl(
    tenant: TenantRef,
    nodeId: string,
    state: 'paused' | 'quarantined' | 'revoked',
    reason: string,
  ): boolean {
    const node = this.nodes.get(tenant, nodeId);
    if (!node) return false;
    this.nodes.setState(tenant, nodeId, state, reason);
    for (const record of this.engine.runningWorkloadsOnNode(nodeId)) {
      this.engine.stopTask(tenant, record.workloadId, `${state}:${reason}`);
    }
    for (const agent of this.agents.activeOnNode(nodeId)) {
      this.agents.deactivate(tenant, agent.agentId, `${state}:${reason}`);
    }
    if (state === 'revoked' || state === 'quarantined') this.attestation.revoke(nodeId);
    this.telemetry.record({
      signal: 'security_event',
      tenant,
      nodeId,
      severity: state === 'revoked' ? 'critical' : 'warn',
      detail: { control: state, reason },
    });
    return true;
  }

  private registerBaselineTelemetry() {
    for (const resource of ['cpuMillis', 'gpuMillis', 'modelTokens', 'storageMb', 'networkKb']) {
      this.cost.monitorResource(resource);
    }
    this.bypass.register({
      pathId: 'backup_restore',
      justification: 'Backup and restore must read every tenant row to produce a consistent snapshot.',
      approvedByPrincipalId: 'founder',
      reviewedAt: this.clock.now(),
    });
    this.bypass.register({
      pathId: 'fleet_health',
      justification: 'Fleet health reporting needs node states across tenants to detect unowned nodes.',
      approvedByPrincipalId: 'founder',
      reviewedAt: this.clock.now(),
    });
  }

  setTenantQuota(quota: TenantQuota) {
    this.governor.setQuota(quota);
  }

  /** Convenience for tests and acceptance: full node onboarding in one call. */
  onboardNode(input: {
    token: string;
    tenant: TenantRef;
    serial: string;
    hardware?: HardwareProfile;
    capacity?: RuntimeNode['capacity'];
    attest?: boolean;
    attestationValidForMs?: number;
    measurements?: Record<string, string>;
  }): RuntimeNode {
    const principal = this.principals.verify(input.token);
    const hardware = input.hardware ?? this.hostHardware.profile;
    const fingerprint = NodeRegistry.nodeFingerprint({
      serial: input.serial,
      platform: hardware.classId,
      publicKey: `pk_${input.serial}`,
    });
    const ticket = this.nodes.issueEnrollment({
      principal,
      tenant: input.tenant,
      fingerprint,
      hardware,
      capacity: input.capacity ?? { cpuMillis: 600_000, gpuMillis: 0, ramMb: 8_192, concurrentWorkloads: 32 },
    });
    const { node } = this.nodes.register(ticket, { fingerprint });
    this.telemetry.claimNodeOwner(node.nodeId, principal.principalId);
    if (input.attest !== false) {
      this.attestation.submit({
        node,
        measurements:
          input.measurements ?? {
            boot_chain: 'measured',
            runtime_image: `xiv-runtime-${RUNTIME_CONTRACT_VERSION}`,
            policy_bundle: 'guardian-v1',
          },
        validForMs: input.attestationValidForMs,
      });
    }
    return node;
  }

  exportTables(): Record<string, unknown> {
    return {
      nodes: this.nodeStore.exportAll(),
      workloads: this.workloadStore.exportAll(),
      attestations: this.attestation.export(),
      approvals: this.approvals.export(),
      agents: this.agents.stats(),
      lineage: this.lineage.export(),
      audit: this.audit.export(),
      usage: this.governor.export(),
      checkpoints: this.engine.exportCheckpoints(),
      externalActions: this.external.export(),
      releases: this.releases.export(),
      models: this.models.export(),
    };
  }

  restoreTables(tables: Record<string, unknown>) {
    this.nodeStore.restoreAll((tables.nodes ?? {}) as Record<string, RuntimeNode>);
    this.workloadStore.restoreAll((tables.workloads ?? {}) as Record<string, WorkloadRecord>);
    this.attestation.restore((tables.attestations ?? {}) as Record<string, AttestationRecord>);
    this.approvals.restore((tables.approvals ?? {}) as never);
    this.engine.restoreCheckpoints((tables.checkpoints ?? {}) as never);
    this.releases.restore(((tables.releases ?? []) as never[]).slice());
  }

  static countRecords(tables: Record<string, unknown>): number {
    let total = 0;
    for (const value of Object.values(tables)) {
      if (Array.isArray(value)) total += value.length;
      else if (value && typeof value === 'object') total += Object.keys(value as object).length;
    }
    return total;
  }

  /** Fleet health via the documented privileged bypass path. */
  fleetHealth(principalId: string) {
    const nodes = this.nodeStore.listPrivileged(this.bypass, 'fleet_health', principalId);
    return nodes.map((node) => ({
      nodeId: node.nodeId,
      tenant: node.tenant,
      state: node.state,
      hardwareClass: node.hardware.classId,
      owner: this.telemetry.ownerOf(node.nodeId) ?? null,
      attestation: this.attestation.evaluate(node.nodeId).status,
    }));
  }

  classificationCeilingForNode(node: RuntimeNode): WorkloadClassification {
    const state = this.attestation.evaluate(node.nodeId);
    if (node.state !== 'active') return 'public';
    return state.status === 'required_pass' ? 'restricted' : 'internal';
  }
}
