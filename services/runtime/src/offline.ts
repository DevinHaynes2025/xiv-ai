import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { nonce, sign, verifySignature, type SigningKeys } from './crypto';
import { RuntimeError } from './errors';
import type { ExternalActionLedger } from './external-actions';
import type { IdFactory } from './ids';
import { sameTenant } from './isolation';
import type { LineageStore } from './lineage';
import type {
  AuthenticatedPrincipal,
  Capability,
  OfflinePackageGrant,
  OfflineResult,
  ResourceBudget,
  RuntimeNode,
  WorkloadClassification,
} from './types';

export type OfflineTaskRequest = {
  taskKey: string;
  requiredCapabilities: readonly Capability[];
  externalActionKey?: string;
  description: string;
};

export type OfflineTaskOutcome = {
  taskKey: string;
  executed: boolean;
  refusedReason: string | null;
  externalActionExecuted: boolean;
};

/**
 * Offline work packages (AC-10).
 *
 * A package is the complete authority an agent carries into a disconnected
 * session: capability list, classification ceiling, task count, budget and
 * expiry, all covered by one signature. The offline session cannot widen any of
 * them, because the session only ever reads the authority from the verified
 * package — there is no channel through which a disconnected agent can ask for
 * more.
 */
export class OfflineAuthority {
  private readonly issued = new Map<string, OfflinePackageGrant>();
  private readonly consumedResults = new Set<string>();
  private permissionExpansionAttempts = 0;
  private unauthorizedExternalAttempts = 0;
  private tamperedRejections = 0;
  private expiredRejections = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly keys: SigningKeys,
    private readonly audit: AuditLedger,
    private readonly lineage: LineageStore,
    private readonly external: ExternalActionLedger,
  ) {}

  issue(input: {
    principal: AuthenticatedPrincipal;
    agentId: string;
    node: RuntimeNode;
    capabilities: readonly Capability[];
    classification: WorkloadClassification;
    maxTasks: number;
    budget: ResourceBudget;
    validForMs: number;
  }): OfflinePackageGrant {
    if (!input.principal.capabilities.includes('offline.package.issue')) {
      throw new RuntimeError('unauthorized', 'This principal cannot issue offline work packages.', {
        principalId: input.principal.principalId,
      });
    }
    if (!sameTenant(input.principal.tenant, input.node.tenant)) {
      throw new RuntimeError('isolation_violation', 'Offline packages cannot cross tenant boundaries.', {});
    }
    const widened = input.capabilities.filter((capability) => !input.principal.capabilities.includes(capability));
    if (widened.length) {
      this.permissionExpansionAttempts += 1;
      this.audit.append({
        tenant: input.node.tenant,
        category: 'security',
        kind: 'offline_permission_expansion_blocked',
        subjectId: input.agentId,
        principalId: input.principal.principalId,
        detail: { widened },
      });
      throw new RuntimeError('permission_expansion', 'An offline package cannot exceed the issuer authority.', {
        widened,
      });
    }

    const issuedAt = this.clock.now();
    const body = {
      packageId: this.ids.mint('offpkg'),
      tenant: input.node.tenant,
      agentId: input.agentId,
      nodeId: input.node.nodeId,
      issuedByPrincipalId: input.principal.principalId,
      capabilities: [...input.capabilities],
      classification: input.classification,
      maxTasks: input.maxTasks,
      budget: input.budget,
      issuedAt,
      expiresAt: issuedAt + input.validForMs,
      nonce: nonce(16),
    };
    const grant: OfflinePackageGrant = { ...body, signature: sign(this.keys.offline, body) };
    this.issued.set(grant.packageId, grant);

    this.audit.append({
      tenant: grant.tenant,
      category: 'offline',
      kind: 'offline_package_issued',
      subjectId: grant.packageId,
      principalId: input.principal.principalId,
      detail: {
        agentId: input.agentId,
        nodeId: input.node.nodeId,
        capabilities: body.capabilities,
        expiresAt: grant.expiresAt,
      },
    });
    return grant;
  }

  validate(grant: OfflinePackageGrant): OfflinePackageGrant {
    const { signature, ...body } = grant;
    if (!verifySignature(this.keys.offline, body, signature)) {
      this.tamperedRejections += 1;
      this.audit.append({
        tenant: grant.tenant,
        category: 'security',
        kind: 'offline_package_rejected',
        subjectId: grant.packageId,
        detail: { reason: 'signature_invalid' },
      });
      throw new RuntimeError('package_invalid', 'This offline package failed signature verification.', {
        packageId: grant.packageId,
      });
    }
    if (this.clock.now() > grant.expiresAt) {
      this.expiredRejections += 1;
      this.audit.append({
        tenant: grant.tenant,
        category: 'security',
        kind: 'offline_package_rejected',
        subjectId: grant.packageId,
        detail: { reason: 'expired', expiresAt: grant.expiresAt },
      });
      throw new RuntimeError('package_expired', 'This offline package has expired.', { packageId: grant.packageId });
    }
    return grant;
  }

  /**
   * Runs a bounded offline session. Capability checks read only from the
   * verified package, so an offline agent asking for authority it was not given
   * is refused locally with no network round trip.
   */
  runOffline(input: {
    grant: OfflinePackageGrant;
    tasks: readonly OfflineTaskRequest[];
  }): { result: OfflineResult; outcomes: OfflineTaskOutcome[] } {
    const grant = this.validate(input.grant);
    const outcomes: OfflineTaskOutcome[] = [];
    let executed = 0;
    let externalAttempted = 0;
    let externalExecuted = 0;

    for (const task of input.tasks) {
      if (executed >= grant.maxTasks) {
        outcomes.push({ taskKey: task.taskKey, executed: false, refusedReason: 'task_budget_exhausted', externalActionExecuted: false });
        continue;
      }
      const widened = task.requiredCapabilities.filter((capability) => !grant.capabilities.includes(capability));
      if (widened.length) {
        this.permissionExpansionAttempts += 1;
        this.audit.append({
          tenant: grant.tenant,
          category: 'security',
          kind: 'offline_task_refused',
          subjectId: grant.packageId,
          detail: { taskKey: task.taskKey, reason: 'permission_expansion', widened },
        });
        outcomes.push({ taskKey: task.taskKey, executed: false, refusedReason: 'permission_expansion', externalActionExecuted: false });
        continue;
      }

      let externalActionExecuted = false;
      if (task.externalActionKey) {
        externalAttempted += 1;
        if (!grant.capabilities.includes('offline.external_action')) {
          this.unauthorizedExternalAttempts += 1;
          this.audit.append({
            tenant: grant.tenant,
            category: 'security',
            kind: 'offline_external_action_blocked',
            subjectId: grant.packageId,
            detail: { taskKey: task.taskKey },
          });
          outcomes.push({
            taskKey: task.taskKey,
            executed: false,
            refusedReason: 'external_action_not_granted',
            externalActionExecuted: false,
          });
          continue;
        }
        const result = this.external.execute({
          tenant: grant.tenant,
          workloadId: grant.packageId,
          actionKey: task.externalActionKey,
          description: `offline action: ${task.description}`,
          consequential: false,
        });
        externalActionExecuted = result.executed;
        if (result.executed) externalExecuted += 1;
      }

      executed += 1;
      this.lineage.record({
        workloadId: grant.packageId,
        tenant: grant.tenant,
        stage: 'transformation',
        reference: task.taskKey,
        detail: `offline task: ${task.description}`,
      });
      outcomes.push({ taskKey: task.taskKey, executed: true, refusedReason: null, externalActionExecuted });
    }

    const result: OfflineResult = {
      resultId: this.ids.mint('offres'),
      packageId: grant.packageId,
      tenant: grant.tenant,
      agentId: grant.agentId,
      nodeId: grant.nodeId,
      taskCount: executed,
      externalActionsAttempted: externalAttempted,
      externalActionsExecuted: externalExecuted,
      lineageComplete: false,
      producedAt: this.clock.now(),
    };

    for (const stage of ['source', 'classification', 'organization_universe', 'agent', 'model', 'runtime', 'meeting_task', 'recommendation', 'result'] as const) {
      this.lineage.record({
        workloadId: grant.packageId,
        tenant: grant.tenant,
        stage,
        reference:
          stage === 'source'
            ? `offline_package:${grant.packageId}`
            : stage === 'classification'
              ? grant.classification
              : stage === 'organization_universe'
                ? `${grant.tenant.organizationId}/${grant.tenant.universeId}`
                : stage === 'agent'
                  ? grant.agentId
                  : stage === 'model'
                    ? 'no_model_invoked'
                    : stage === 'runtime'
                      ? grant.nodeId
                      : stage === 'meeting_task'
                        ? `offline_session:${grant.packageId}`
                        : stage === 'recommendation'
                          ? 'offline_bounded_result'
                          : `result:${result.resultId}`,
        detail: `offline session stage ${stage}`,
      });
    }

    const reconstruction = this.lineage.reconstruct(grant.packageId, { approvalMandatory: false });
    const complete = { ...result, lineageComplete: reconstruction.complete && reconstruction.chainIntact };

    this.audit.append({
      tenant: grant.tenant,
      category: 'offline',
      kind: 'offline_session_completed',
      subjectId: grant.packageId,
      detail: {
        resultId: complete.resultId,
        taskCount: complete.taskCount,
        externalActionsExecuted: complete.externalActionsExecuted,
        lineageComplete: complete.lineageComplete,
      },
    });
    return { result: complete, outcomes };
  }

  /**
   * Synchronization back into XIV. Protected results require a freshly verified
   * principal: the offline token that authorized the disconnected session is not
   * sufficient to commit its results.
   */
  synchronize(input: {
    grant: OfflinePackageGrant;
    result: OfflineResult;
    reauthenticated: AuthenticatedPrincipal | null;
    protectedSync: boolean;
  }): { accepted: boolean; reason: string } {
    if (input.protectedSync && !input.reauthenticated) {
      this.audit.append({
        tenant: input.grant.tenant,
        category: 'security',
        kind: 'offline_sync_rejected',
        subjectId: input.grant.packageId,
        detail: { reason: 'reauthentication_required' },
      });
      throw new RuntimeError('reauthentication_required', 'Protected synchronization requires reauthentication.', {
        packageId: input.grant.packageId,
      });
    }
    if (input.reauthenticated && !sameTenant(input.reauthenticated.tenant, input.grant.tenant)) {
      throw new RuntimeError('isolation_violation', 'Synchronization crossed a tenant boundary.', {});
    }
    this.validate(input.grant);
    if (this.consumedResults.has(input.result.resultId)) {
      return { accepted: false, reason: 'result_already_synchronized' };
    }
    if (!input.result.lineageComplete) {
      this.audit.append({
        tenant: input.grant.tenant,
        category: 'security',
        kind: 'offline_sync_rejected',
        subjectId: input.grant.packageId,
        detail: { reason: 'incomplete_lineage' },
      });
      return { accepted: false, reason: 'incomplete_lineage' };
    }

    this.consumedResults.add(input.result.resultId);
    this.audit.append({
      tenant: input.grant.tenant,
      category: 'offline',
      kind: 'offline_result_synchronized',
      subjectId: input.grant.packageId,
      principalId: input.reauthenticated?.principalId ?? null,
      detail: { resultId: input.result.resultId, taskCount: input.result.taskCount },
    });
    return { accepted: true, reason: 'synchronized' };
  }

  /** Produces a tampered copy for negative testing. */
  static tamper(grant: OfflinePackageGrant): OfflinePackageGrant {
    return { ...grant, maxTasks: grant.maxTasks + 100, capabilities: [...grant.capabilities, 'offline.external_action'] };
  }

  get metrics() {
    return {
      issued: this.issued.size,
      permissionExpansionAttempts: this.permissionExpansionAttempts,
      unauthorizedExternalAttempts: this.unauthorizedExternalAttempts,
      tamperedRejections: this.tamperedRejections,
      expiredRejections: this.expiredRejections,
    };
  }
}
