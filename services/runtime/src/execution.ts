import type { AttestationService } from './attestation';
import type { AuditLedger } from './audit';
import { type GuardianClearance, type PrincipalDirectory, type ApprovalRegistry, type WorkloadAuthorizer } from './authorization';
import type { Clock } from './clock';
import { sign, verifySignature, type SigningKeys } from './crypto';
import type { ControlPlane } from './control';
import type { CostLedger } from './cost';
import { RuntimeError, errorCodeOf, isRuntimeError } from './errors';
import type { ExternalActionLedger } from './external-actions';
import type { ResourceGovernor, BudgetLease } from './governor';
import type { HardwareRegistry } from './hardware';
import type { IdFactory } from './ids';
import { sameTenant, type TenantStore } from './isolation';
import type { LineageStore } from './lineage';
import type { ModelRegistry } from './models';
import type { NodeRegistry } from './nodes';
import type { ComputeRouter, NodeLoad } from './router';
import type { TelemetryHub } from './telemetry';
import type {
  AttestationState,
  Checkpoint,
  FailureKind,
  RecoveryOutcome,
  RoutingDecision,
  RuntimeNode,
  WorkloadRecord,
  WorkloadSpec,
  WorkloadUsage,
} from './types';

export type FailureInjection = {
  kind: FailureKind;
  stage: 'before_start' | 'mid_execution';
  /** When set, the engine attempts an authorized recovery after detection. */
  recoverable: boolean;
  corruptCheckpoint?: boolean;
  /** A node id belonging to another tenant that recovery is asked to use. */
  crossTenantRecoveryTarget?: { nodeId: string };
};

export type SubmitOptions = {
  token: string;
  spec: WorkloadSpec;
  allowDegraded?: boolean;
};

export type SubmitOutcome = {
  record: WorkloadRecord;
  routing: RoutingDecision | null;
  clearance: GuardianClearance | null;
  rejection: { code: string; reason: string } | null;
};

export type RunOptions = {
  workloadId: string;
  iterations?: number;
  modelUsage?: { tokensIn: number; tokensOut: number };
  externalActionKey?: string;
  failure?: FailureInjection;
  transformation?: string;
  meetingOrTaskRef?: string;
  recommendation?: string;
};

export type RunOutcome = {
  record: WorkloadRecord;
  usage: WorkloadUsage | null;
  recovery: RecoveryOutcome | null;
  error: { code: string; message: string } | null;
};

type ActiveExecution = {
  lease: BudgetLease;
  clearance: GuardianClearance;
  attestation: AttestationState | null;
  nodeId: string;
  startedMicros: number;
};

/**
 * Workload execution engine.
 *
 * Submission and execution are separated on purpose. `submit` performs identity,
 * authorization, routing, guardian clearance and budget admission, then leaves
 * the workload in `running` without doing any work. That lets the acceptance
 * suite hold a large number of workloads concurrently admitted and measure
 * scheduler latency (AC-20) separately from execution behaviour.
 */
export class WorkloadEngine {
  private readonly active = new Map<string, ActiveExecution>();
  private readonly load = new Map<string, NodeLoad>();
  private readonly checkpoints = new Map<string, Checkpoint>();
  private readonly recoveries: RecoveryOutcome[] = [];
  private unauthorizedExecutions = 0;
  private protectedExecutionsOnUntrustedNodes = 0;

  constructor(
    private readonly deps: {
      clock: Clock;
      ids: IdFactory;
      keys: SigningKeys;
      audit: AuditLedger;
      telemetry: TelemetryHub;
      lineage: LineageStore;
      principals: PrincipalDirectory;
      approvals: ApprovalRegistry;
      authorizer: WorkloadAuthorizer;
      nodes: NodeRegistry;
      attestation: AttestationService;
      hardware: HardwareRegistry;
      models: ModelRegistry;
      governor: ResourceGovernor;
      router: ComputeRouter;
      control: ControlPlane;
      external: ExternalActionLedger;
      cost: CostLedger;
      workloads: TenantStore<WorkloadRecord>;
    },
  ) {}

  loadFor(nodeId: string): NodeLoad {
    return (
      this.load.get(nodeId) ?? { activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 }
    );
  }

  private commit(node: RuntimeNode, spec: WorkloadSpec, direction: 1 | -1) {
    const current = this.loadFor(node.nodeId);
    this.load.set(node.nodeId, {
      activeWorkloads: Math.max(0, current.activeWorkloads + direction),
      cpuMillisCommitted: Math.max(0, current.cpuMillisCommitted + direction * spec.budget.cpuMillis),
      gpuMillisCommitted: Math.max(0, current.gpuMillisCommitted + direction * spec.budget.gpuMillis),
      ramMbCommitted: Math.max(0, current.ramMbCommitted + direction * spec.budget.ramMb),
    });
  }

  private persist(record: WorkloadRecord): WorkloadRecord {
    this.deps.workloads.put(record.tenant, record.workloadId, record);
    this.deps.telemetry.record({
      signal: 'workload_state',
      tenant: record.tenant,
      workloadId: record.workloadId,
      nodeId: record.nodeId,
      severity: record.state === 'failed' || record.state === 'rejected' ? 'error' : 'info',
      detail: { state: record.state },
    });
    return record;
  }

  private recordEarlyLineage(spec: WorkloadSpec) {
    this.deps.lineage.record({
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      stage: 'source',
      reference: spec.sourceId ?? `submission:${spec.workloadId}`,
      detail: 'workload submission source',
    });
    this.deps.lineage.record({
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      stage: 'classification',
      reference: spec.classification,
      detail: 'declared workload classification',
    });
    this.deps.lineage.record({
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      stage: 'organization_universe',
      reference: `${spec.tenant.organizationId}/${spec.tenant.universeId}`,
      detail: 'organization and universe binding',
    });
    this.deps.lineage.record({
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      stage: 'agent',
      reference: spec.agentId ?? 'no_agent',
      detail: spec.agentId ? 'logical agent identity' : 'workload submitted without an agent',
    });
  }

  submit(options: SubmitOptions): SubmitOutcome {
    const { spec } = options;
    const submittedAt = this.deps.clock.now();
    const startMicros = this.deps.clock.micros();

    const base: WorkloadRecord = {
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      spec,
      state: 'submitted',
      nodeId: null,
      grantId: null,
      attestationId: null,
      submittedAt,
      acceptedAt: null,
      startedAt: null,
      endedAt: null,
      acceptanceMs: null,
      schedulingMs: null,
      startLatencyMs: null,
      failureReason: null,
      rejectionReason: null,
      externalActionIds: [],
    };

    const reject = (code: string, reason: string, routing: RoutingDecision | null): SubmitOutcome => {
      const record = this.persist({
        ...base,
        state: 'rejected',
        rejectionReason: reason,
        acceptanceMs: (this.deps.clock.micros() - startMicros) / 1000,
        schedulingMs: routing ? routing.decisionMicros / 1000 : null,
      });
      this.deps.telemetry.record({
        signal: 'error',
        tenant: spec.tenant,
        workloadId: spec.workloadId,
        severity: 'warn',
        detail: { code, reason },
      });
      this.deps.audit.append({
        tenant: spec.tenant,
        category: 'workload',
        kind: 'workload_rejected',
        subjectId: spec.workloadId,
        detail: { code, reason },
      });
      return { record, routing, clearance: null, rejection: { code, reason } };
    };

    let principal;
    try {
      principal = this.deps.principals.verify(options.token);
    } catch (error) {
      return reject(errorCodeOf(error), 'unauthenticated_requester', null);
    }

    this.recordEarlyLineage(spec);
    this.deps.telemetry.record({
      signal: 'audit_lineage',
      tenant: spec.tenant,
      workloadId: spec.workloadId,
      detail: { stages: this.deps.lineage.chainFor(spec.workloadId).length },
    });

    const authorization = this.deps.authorizer.authorize(principal, spec);
    if (!authorization.allowed) {
      return reject('unauthorized', authorization.reason, null);
    }
    const grant = authorization.grant;

    const budgetValidation = this.deps.governor.validateBudget(spec.budget);
    if (!budgetValidation.ok) {
      return reject('quota_exceeded', budgetValidation.reason, null);
    }

    // A named model that cannot be invoked is refused before a node is chosen.
    // Deferring this to execution admits the workload, commits capacity against
    // the node and only then fails, which reserves a runtime for work that was
    // never allowed to run.
    if (spec.modelId) {
      try {
        this.deps.models.authorize({
          modelId: spec.modelId,
          tenant: spec.tenant,
          classification: spec.classification,
          workloadId: spec.workloadId,
        });
      } catch (error) {
        return reject(errorCodeOf(error), 'model_not_invocable', null);
      }
    }

    const quota = this.deps.governor.quotaFor(spec.tenant);
    const routing = this.deps.router.route({
      spec,
      candidates: this.deps.nodes.list(spec.tenant),
      load: (nodeId) => this.loadFor(nodeId),
      tenantBudgetAvailable: Boolean(quota),
      allowDegraded: options.allowDegraded,
    });
    if (routing.outcome === 'rejected') {
      return reject('node_unavailable', routing.reason, routing);
    }

    let node: RuntimeNode;
    try {
      node = this.deps.nodes.require(spec.tenant, routing.nodeId);
    } catch (error) {
      return reject(errorCodeOf(error), 'routed_node_not_visible', routing);
    }

    if (this.deps.control.isBlocked(node.nodeId)) {
      return reject('node_unavailable', `control_${this.deps.control.blockReason(node.nodeId)}`, routing);
    }

    const protectedExecution = this.deps.attestation.trustPolicy.protectedClassifications.includes(spec.classification);
    let attestation: AttestationState | null = null;
    try {
      attestation = protectedExecution
        ? this.deps.attestation.assertEligible(node, spec.classification)
        : this.deps.attestation.evaluate(node.nodeId);
    } catch (error) {
      return reject(errorCodeOf(error), 'attestation_not_satisfied', routing);
    }

    let clearance: GuardianClearance;
    try {
      clearance = this.deps.authorizer.clear({ grant, node, attestation, protectedExecution });
    } catch (error) {
      return reject(errorCodeOf(error), isRuntimeError(error) ? String(error.detail.reason ?? 'guardian') : 'guardian', routing);
    }

    let lease: BudgetLease;
    try {
      lease = this.deps.governor.admit({ workloadId: spec.workloadId, tenant: spec.tenant, budget: spec.budget });
    } catch (error) {
      return reject(errorCodeOf(error), 'budget_not_admissible', routing);
    }

    const acceptedAt = this.deps.clock.now();
    const acceptanceMs = (this.deps.clock.micros() - startMicros) / 1000;
    this.commit(node, spec, 1);
    this.deps.governor.start(lease);

    const record = this.persist({
      ...base,
      state: 'running',
      nodeId: node.nodeId,
      grantId: grant.grantId,
      attestationId: attestation?.attestationId ?? null,
      acceptedAt,
      startedAt: this.deps.clock.now(),
      acceptanceMs,
      schedulingMs: routing.decisionMicros / 1000,
      startLatencyMs: (this.deps.clock.micros() - startMicros) / 1000,
    });

    this.active.set(spec.workloadId, {
      lease,
      clearance,
      attestation,
      nodeId: node.nodeId,
      startedMicros: this.deps.clock.micros(),
    });

    this.deps.lineage.record({
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      stage: 'runtime',
      reference: node.nodeId,
      detail: `${node.hardware.classId} runtime node`,
    });
    this.deps.telemetry.record({
      signal: 'runtime',
      tenant: spec.tenant,
      workloadId: spec.workloadId,
      nodeId: node.nodeId,
      detail: { hardwareClass: node.hardware.classId, attestation: attestation?.status ?? 'not_required' },
    });
    this.deps.telemetry.record({
      signal: 'health',
      tenant: spec.tenant,
      workloadId: spec.workloadId,
      nodeId: node.nodeId,
      detail: { nodeState: node.state, degraded: node.degraded },
    });
    this.deps.telemetry.record({
      signal: 'agent',
      tenant: spec.tenant,
      workloadId: spec.workloadId,
      nodeId: node.nodeId,
      detail: { agentId: spec.agentId ?? null },
    });
    this.deps.telemetry.record({
      signal: 'security_event',
      tenant: spec.tenant,
      workloadId: spec.workloadId,
      nodeId: node.nodeId,
      detail: { guardian: 'cleared', grantId: grant.grantId, protectedExecution },
    });
    this.deps.audit.append({
      tenant: spec.tenant,
      category: 'workload',
      kind: 'workload_started',
      subjectId: spec.workloadId,
      principalId: principal.principalId,
      detail: { nodeId: node.nodeId, grantId: grant.grantId, classification: spec.classification },
    });

    if (protectedExecution && (!attestation || attestation.status !== 'required_pass' || node.state !== 'active')) {
      this.protectedExecutionsOnUntrustedNodes += 1;
    }

    return { record, routing, clearance, rejection: null };
  }

  checkpoint(workloadId: string, stateBlob: string): Checkpoint {
    const record = this.requireRecord(workloadId);
    const body = {
      checkpointId: this.deps.ids.mint('ckpt'),
      workloadId,
      tenant: record.tenant,
      stateBlob,
      at: this.deps.clock.now(),
    };
    const checkpoint: Checkpoint = { ...body, signature: sign(this.deps.keys.checkpoint, body) };
    this.checkpoints.set(workloadId, checkpoint);
    return checkpoint;
  }

  /** A checkpoint whose signature does not verify is refused, never resumed. */
  restoreCheckpoint(workloadId: string): Checkpoint | null {
    const checkpoint = this.checkpoints.get(workloadId);
    if (!checkpoint) return null;
    const { signature, ...body } = checkpoint;
    if (!verifySignature(this.deps.keys.checkpoint, body, signature)) {
      this.deps.audit.append({
        tenant: checkpoint.tenant,
        category: 'recovery',
        kind: 'checkpoint_rejected',
        subjectId: workloadId,
        detail: { checkpointId: checkpoint.checkpointId, reason: 'signature_invalid' },
      });
      throw new RuntimeError('checkpoint_corrupt', 'This checkpoint failed integrity verification.', { workloadId });
    }
    return checkpoint;
  }

  corruptCheckpointForTest(workloadId: string) {
    const checkpoint = this.checkpoints.get(workloadId);
    if (!checkpoint) return;
    this.checkpoints.set(workloadId, { ...checkpoint, stateBlob: `${checkpoint.stateBlob}:tampered` });
  }

  private requireRecord(workloadId: string): WorkloadRecord {
    for (const record of Object.values(this.deps.workloads.exportAll())) {
      if (record.workloadId === workloadId) return record;
    }
    throw new RuntimeError('not_found', 'Unknown workload.', { workloadId });
  }

  private closeOut(
    record: WorkloadRecord,
    execution: ActiveExecution,
    state: WorkloadRecord['state'],
    failureReason: string | null,
  ): { record: WorkloadRecord; usage: WorkloadUsage } {
    const node = this.deps.nodes.get(record.tenant, execution.nodeId);
    if (node) this.commit(node, record.spec, -1);
    const invocations = this.deps.models.invocationsFor(record.workloadId);
    const usage = this.deps.governor.close(execution.lease, execution.nodeId, {
      costAttributed: invocations.every((entry) => entry.costAttributable),
    });
    this.deps.cost.recordUsage({ usage, invocations });
    this.deps.telemetry.record({
      signal: 'resource_usage',
      tenant: record.tenant,
      workloadId: record.workloadId,
      nodeId: execution.nodeId,
      detail: { consumed: usage.consumed, costUsd: usage.costUsd, terminatedByLimit: usage.terminatedByLimit },
    });
    this.active.delete(record.workloadId);
    const next = this.persist({
      ...record,
      state,
      endedAt: this.deps.clock.now(),
      failureReason,
    });
    this.deps.audit.append({
      tenant: record.tenant,
      category: 'workload',
      kind: `workload_${state}`,
      subjectId: record.workloadId,
      detail: { nodeId: execution.nodeId, failureReason, terminatedByLimit: usage.terminatedByLimit },
    });
    return { record: next, usage };
  }

  /** Bounded execution of an admitted workload. */
  run(options: RunOptions): RunOutcome {
    const record = this.requireRecord(options.workloadId);
    const execution = this.active.get(options.workloadId);
    if (!execution) {
      throw new RuntimeError('not_found', 'This workload is not admitted for execution.', {
        workloadId: options.workloadId,
      });
    }
    if (record.state !== 'running') {
      throw new RuntimeError('malformed', 'Only a running workload can execute.', { state: record.state });
    }
    // Structural invariant: `active` entries only exist with a guardian
    // clearance, so this counter proves the absence of an uncleared execution
    // path rather than asserting it.
    if (!execution.clearance) this.unauthorizedExecutions += 1;

    const spec = record.spec;
    const node = this.deps.nodes.require(record.tenant, execution.nodeId);
    const failure = options.failure;

    const detectFailure = (kind: FailureKind, message: string): RunOutcome => {
      const detectionMicros = this.deps.clock.micros();
      const detectionMs = Math.max(0, (detectionMicros - execution.startedMicros) / 1000);
      const externalActionsBefore = options.externalActionKey
        ? this.deps.external.attemptsFor(record.tenant, options.externalActionKey)
        : 0;

      this.deps.telemetry.record({
        signal: 'error',
        tenant: record.tenant,
        workloadId: record.workloadId,
        nodeId: execution.nodeId,
        severity: 'error',
        detail: { failureKind: kind, message },
      });
      this.deps.audit.append({
        tenant: record.tenant,
        category: 'recovery',
        kind: 'failure_detected',
        subjectId: record.workloadId,
        detail: { failureKind: kind, message, detectionMs },
      });

      const terminalState: WorkloadRecord['state'] =
        kind === 'resource_budget_exhausted' || kind === 'timeout' ? 'terminated' : 'failed';
      const closed = this.closeOut(record, execution, terminalState, `${kind}:${message}`);

      let recoveredOnNodeId: string | null = null;
      let crossTenantRecovery = false;
      let corruptedCheckpointAccepted = false;
      let recoveredState: WorkloadRecord['state'] = terminalState;

      if (failure?.crossTenantRecoveryTarget) {
        // Recovery resolves nodes through the workload's own tenant scope, so a
        // foreign node id is simply not visible here. If it ever were, that is a
        // real cross-tenant recovery and the scenario records it as a failure.
        const requestedNodeId = failure.crossTenantRecoveryTarget.nodeId;
        const visible = this.deps.nodes.get(record.tenant, requestedNodeId);
        crossTenantRecovery = Boolean(visible && !sameTenant(visible.tenant, record.tenant));
        this.deps.audit.append({
          tenant: record.tenant,
          category: 'security',
          kind: crossTenantRecovery ? 'cross_tenant_recovery_detected' : 'cross_tenant_recovery_refused',
          subjectId: record.workloadId,
          detail: { requestedNodeId },
        });
      }

      if (failure?.recoverable) {
        try {
          if (failure.corruptCheckpoint) this.corruptCheckpointForTest(record.workloadId);
          const checkpoint = this.restoreCheckpoint(record.workloadId);
          const replacement = this.deps.nodes
            .list(record.tenant)
            .filter((candidate) => candidate.nodeId !== execution.nodeId && candidate.state === 'active');
          if (replacement.length && checkpoint) {
            recoveredOnNodeId = (replacement[0] as RuntimeNode).nodeId;
            recoveredState = 'recovered';
            this.deps.lineage.record({
              workloadId: record.workloadId,
              tenant: record.tenant,
              stage: 'runtime',
              reference: recoveredOnNodeId,
              detail: 'authorized recovery runtime',
            });
            this.deps.audit.append({
              tenant: record.tenant,
              category: 'recovery',
              kind: 'workload_recovered',
              subjectId: record.workloadId,
              detail: { fromNodeId: execution.nodeId, toNodeId: recoveredOnNodeId, checkpointId: checkpoint.checkpointId },
            });
            if (options.externalActionKey) {
              const replay = this.deps.external.execute({
                tenant: record.tenant,
                workloadId: record.workloadId,
                actionKey: options.externalActionKey,
                description: 'recovery replay of external action',
                consequential: spec.consequential,
                approvalId: this.deps.approvals.find(record.workloadId)?.approvalId ?? null,
              });
              if (replay.executed && externalActionsBefore > 0) {
                this.deps.audit.append({
                  tenant: record.tenant,
                  category: 'security',
                  kind: 'duplicate_external_action_detected',
                  subjectId: record.workloadId,
                  detail: { actionKey: options.externalActionKey },
                });
              }
            }
          }
        } catch (error) {
          if (isRuntimeError(error) && error.code === 'checkpoint_corrupt') {
            corruptedCheckpointAccepted = false;
          } else {
            throw error;
          }
        }
      }

      const auditCovered = this.deps.audit.has(
        (event) => event.subjectId === record.workloadId && event.kind === 'failure_detected',
      );
      const duplicateExternalActions = options.externalActionKey
        ? Math.max(0, this.deps.external.executionCount(record.tenant, options.externalActionKey) - 1)
        : 0;

      const outcome: RecoveryOutcome = {
        scenarioId: this.deps.ids.mint('scn'),
        workloadId: record.workloadId,
        kind,
        detected: true,
        detectionMs,
        terminalState: recoveredState,
        safeTerminal:
          recoveredState === 'recovered' ||
          recoveredState === 'failed' ||
          recoveredState === 'terminated' ||
          recoveredState === 'completed',
        recoveredOnNodeId,
        crossTenantRecovery,
        duplicateExternalActions,
        corruptedCheckpointAccepted,
        auditCovered,
      };
      this.recoveries.push(outcome);

      const finalRecord = recoveredOnNodeId
        ? this.persist({ ...closed.record, state: 'recovered' })
        : closed.record;

      return {
        record: finalRecord,
        usage: closed.usage,
        recovery: outcome,
        error: { code: kind, message },
      };
    };

    if (failure?.stage === 'before_start') {
      if (failure.kind === 'node_loss') this.deps.nodes.setState(record.tenant, node.nodeId, 'paused', 'injected_node_loss');
      return detectFailure(failure.kind, 'failure injected before execution start');
    }

    try {
      const adapter = this.deps.hardware.adapterFor(node.hardware.classId);
      const iterations = options.iterations ?? 20_000;
      const measured = adapter.measure({ seed: 11, iterations });
      this.deps.governor.charge(execution.lease, 'cpuMillis', Math.max(0.001, measured.cpuMillis));
      this.deps.governor.charge(execution.lease, 'ramMb', Math.min(spec.budget.ramMb, measured.ramMb));
      this.deps.governor.noteTask(execution.lease);

      if (spec.modelId) {
        const entry = this.deps.models.authorize({
          modelId: spec.modelId,
          tenant: spec.tenant,
          classification: spec.classification,
          workloadId: spec.workloadId,
        });
        this.deps.models.bindToRuntime(entry, adapter);
        const usage = options.modelUsage ?? { tokensIn: 256, tokensOut: 256 };
        const tokens = usage.tokensIn + usage.tokensOut;
        const invocation = this.deps.models.recordInvocation({
          workloadId: spec.workloadId,
          entry,
          tenant: spec.tenant,
          nodeId: node.nodeId,
          usage,
        });
        this.deps.governor.noteModelCall(execution.lease, tokens, invocation.costUsd ?? 0);
        this.deps.lineage.record({
          workloadId: spec.workloadId,
          tenant: spec.tenant,
          stage: 'model',
          reference: entry.modelId,
          detail: `${entry.provider} invocation ${invocation.invocationId}`,
        });
        this.deps.telemetry.record({
          signal: 'model',
          tenant: spec.tenant,
          workloadId: spec.workloadId,
          nodeId: node.nodeId,
          detail: { modelId: entry.modelId, tokens, costUsd: invocation.costUsd },
        });
      } else {
        this.deps.lineage.record({
          workloadId: spec.workloadId,
          tenant: spec.tenant,
          stage: 'model',
          reference: 'no_model_invoked',
          detail: 'deterministic workload with no model call',
        });
        this.deps.telemetry.record({
          signal: 'model',
          tenant: spec.tenant,
          workloadId: spec.workloadId,
          nodeId: node.nodeId,
          detail: { modelId: null },
        });
      }

      this.deps.lineage.record({
        workloadId: spec.workloadId,
        tenant: spec.tenant,
        stage: 'transformation',
        reference: options.transformation ?? 'bounded_reference_workload',
        detail: `${iterations} bounded iterations on ${node.hardware.classId}`,
      });
      this.deps.lineage.record({
        workloadId: spec.workloadId,
        tenant: spec.tenant,
        stage: 'meeting_task',
        reference: options.meetingOrTaskRef ?? `task:${spec.workloadId}`,
        detail: 'task context for this execution',
      });
      this.deps.lineage.record({
        workloadId: spec.workloadId,
        tenant: spec.tenant,
        stage: 'recommendation',
        reference: options.recommendation ?? 'bounded_reference_result',
        detail: 'result recommendation produced by the workload',
      });

      const approval = this.deps.approvals.find(spec.workloadId);
      if (approval) {
        this.deps.lineage.record({
          workloadId: spec.workloadId,
          tenant: spec.tenant,
          stage: 'approval',
          reference: approval.approvalId,
          detail: `approved by ${approval.approverPrincipalId}`,
        });
      }

      if (options.externalActionKey) {
        const result = this.deps.external.execute({
          tenant: spec.tenant,
          workloadId: spec.workloadId,
          actionKey: options.externalActionKey,
          description: 'bounded external action',
          consequential: spec.consequential,
          approvalId: approval?.approvalId ?? null,
        });
        record.externalActionIds.push(result.record.actionId);
      }

      // Injected after the external action so a recovery replay has to prove it
      // deduplicates rather than acting twice.
      if (failure?.stage === 'mid_execution') {
        if (failure.kind === 'node_loss') {
          this.deps.nodes.setState(record.tenant, node.nodeId, 'paused', 'injected_node_loss');
        }
        if (failure.kind === 'resource_budget_exhausted') {
          try {
            this.deps.governor.charge(execution.lease, 'modelTokens', spec.budget.modelTokens + 1);
          } catch {
            return detectFailure(failure.kind, 'resource budget exhausted mid execution');
          }
        }
        return detectFailure(failure.kind, 'failure injected mid execution');
      }

      this.deps.lineage.record({
        workloadId: spec.workloadId,
        tenant: spec.tenant,
        stage: 'result',
        reference: `result:${spec.workloadId}`,
        detail: 'bounded result committed',
      });
      this.deps.telemetry.record({
        signal: 'audit_lineage',
        tenant: spec.tenant,
        workloadId: spec.workloadId,
        detail: { stages: this.deps.lineage.chainFor(spec.workloadId).length },
      });

      const closed = this.closeOut(record, execution, 'completed', null);
      return { record: closed.record, usage: closed.usage, recovery: null, error: null };
    } catch (error) {
      const code = errorCodeOf(error);
      if (code === 'budget_exceeded' || code === 'hard_termination') {
        return detectFailure('resource_budget_exhausted', code);
      }
      const closed = this.closeOut(record, execution, 'failed', code);
      this.deps.telemetry.record({
        signal: 'error',
        tenant: record.tenant,
        workloadId: record.workloadId,
        severity: 'error',
        detail: { code },
      });
      return {
        record: closed.record,
        usage: closed.usage,
        recovery: null,
        error: { code, message: error instanceof Error ? error.message : 'unknown' },
      };
    }
  }

  execute(submit: SubmitOptions, run?: Omit<RunOptions, 'workloadId'>): SubmitOutcome & Partial<RunOutcome> {
    const submitted = this.submit(submit);
    if (submitted.rejection) return submitted;
    const outcome = this.run({ workloadId: submit.spec.workloadId, ...(run ?? {}) });
    return { ...submitted, ...outcome };
  }

  /** Kill-switch target: stops one running task and closes its budget. */
  stopTask(tenant: { organizationId: string; universeId: string }, workloadId: string, reason: string): boolean {
    const record = this.deps.workloads.get(tenant, workloadId);
    if (!record) return false;
    const execution = this.active.get(workloadId);
    if (!execution) {
      if (record.state === 'running') {
        this.persist({ ...record, state: 'terminated', failureReason: reason, endedAt: this.deps.clock.now() });
        return true;
      }
      return false;
    }
    this.closeOut(record, execution, 'terminated', reason);
    return true;
  }

  runningWorkloadsOnNode(nodeId: string): WorkloadRecord[] {
    const out: WorkloadRecord[] = [];
    for (const [workloadId, execution] of this.active.entries()) {
      if (execution.nodeId !== nodeId) continue;
      const record = this.requireRecord(workloadId);
      out.push(record);
    }
    return out;
  }

  runningWorkloadsForAgent(agentId: string): WorkloadRecord[] {
    const out: WorkloadRecord[] = [];
    for (const workloadId of this.active.keys()) {
      const record = this.requireRecord(workloadId);
      if (record.spec.agentId === agentId) out.push(record);
    }
    return out;
  }

  get activeCount() {
    return this.active.size;
  }

  get recoveryOutcomes(): readonly RecoveryOutcome[] {
    return this.recoveries;
  }

  get unauthorizedExecutionCount() {
    return this.unauthorizedExecutions;
  }

  get protectedExecutionsOnUntrustedNodeCount() {
    return this.protectedExecutionsOnUntrustedNodes;
  }

  exportCheckpoints(): Record<string, Checkpoint> {
    return Object.fromEntries(this.checkpoints.entries());
  }

  restoreCheckpoints(rows: Record<string, Checkpoint>) {
    this.checkpoints.clear();
    for (const [key, value] of Object.entries(rows)) this.checkpoints.set(key, value);
  }
}
