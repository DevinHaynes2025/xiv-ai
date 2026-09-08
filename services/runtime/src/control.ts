import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import { sameTenant } from './isolation';
import type { AuthenticatedPrincipal, ControlCommand, ControlCommandKind, TenantRef } from './types';

export type ControlTargets = {
  stopTask: (tenant: TenantRef, workloadId: string, reason: string) => boolean;
  stopAgent: (tenant: TenantRef, agentId: string, reason: string) => boolean;
  stopMeeting: (tenant: TenantRef, meetingId: string, reason: string) => boolean;
  pauseNode: (tenant: TenantRef, nodeId: string, reason: string) => boolean;
  quarantineNode: (tenant: TenantRef, nodeId: string, reason: string) => boolean;
  revokeNode: (tenant: TenantRef, nodeId: string, reason: string) => boolean;
};

/**
 * Kill switch (AC-13).
 *
 * Effectiveness is enforced by admission, not by cooperation: `blocked` node
 * ids are consulted by the execution path before any workload starts, so a
 * workload cannot "ignore" a revocation by not listening for it. Acknowledgement
 * latency is measured on the real clock and reported as a p95.
 */
export class ControlPlane {
  private readonly commands: ControlCommand[] = [];
  private readonly blockedNodes = new Map<string, ControlCommandKind>();
  private targets: ControlTargets | null = null;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  bind(targets: ControlTargets) {
    this.targets = targets;
  }

  private requireTargets(): ControlTargets {
    if (!this.targets) throw new RuntimeError('malformed', 'The control plane is not bound to a runtime.', {});
    return this.targets;
  }

  issue(input: {
    principal: AuthenticatedPrincipal;
    kind: ControlCommandKind;
    targetId: string;
    tenant: TenantRef;
    reason: string;
  }): ControlCommand {
    const issuedAt = this.clock.now();
    const startMicros = this.clock.micros();
    const commandId = this.ids.mint('ctl');

    const record = (outcome: ControlCommand['outcome'], reason: string, effective: boolean): ControlCommand => {
      const ackLatencyMs = Math.max(0, (this.clock.micros() - startMicros) / 1000);
      const command: ControlCommand = {
        commandId,
        kind: input.kind,
        targetId: input.targetId,
        tenant: input.tenant,
        issuedByPrincipalId: input.principal.principalId,
        issuedAt,
        acknowledgedAt: this.clock.now(),
        effectiveAt: effective ? this.clock.now() : undefined,
        ackLatencyMs,
        outcome,
        reason,
      };
      this.commands.push(command);
      this.audit.append({
        tenant: input.tenant,
        category: 'control',
        kind: `control_${input.kind.toLowerCase()}_${outcome}`,
        subjectId: input.targetId,
        principalId: input.principal.principalId,
        detail: { commandId, reason, ackLatencyMs, effective },
      });
      return command;
    };

    if (!input.principal.capabilities.includes('node.control')) {
      return record('rejected', 'capability_missing', false);
    }
    if (!sameTenant(input.principal.tenant, input.tenant)) {
      return record('rejected', 'tenant_mismatch', false);
    }

    const targets = this.requireTargets();
    let applied = false;
    switch (input.kind) {
      case 'STOP_TASK':
        applied = targets.stopTask(input.tenant, input.targetId, input.reason);
        break;
      case 'STOP_AGENT':
        applied = targets.stopAgent(input.tenant, input.targetId, input.reason);
        break;
      case 'STOP_MEETING':
        applied = targets.stopMeeting(input.tenant, input.targetId, input.reason);
        break;
      case 'PAUSE_NODE':
        applied = targets.pauseNode(input.tenant, input.targetId, input.reason);
        if (applied) this.blockedNodes.set(input.targetId, 'PAUSE_NODE');
        break;
      case 'QUARANTINE_NODE':
        applied = targets.quarantineNode(input.tenant, input.targetId, input.reason);
        if (applied) this.blockedNodes.set(input.targetId, 'QUARANTINE_NODE');
        break;
      case 'REVOKE_NODE':
        applied = targets.revokeNode(input.tenant, input.targetId, input.reason);
        if (applied) this.blockedNodes.set(input.targetId, 'REVOKE_NODE');
        break;
    }

    return record('acknowledged', applied ? input.reason : 'target_not_found', applied);
  }

  /** Consulted by the execution path before every start. */
  blockReason(nodeId: string): ControlCommandKind | undefined {
    return this.blockedNodes.get(nodeId);
  }

  isBlocked(nodeId: string): boolean {
    return this.blockedNodes.has(nodeId);
  }

  clearBlock(nodeId: string) {
    const kind = this.blockedNodes.get(nodeId);
    if (kind === 'REVOKE_NODE') {
      throw new RuntimeError('node_revoked', 'A revocation cannot be cleared.', { nodeId });
    }
    this.blockedNodes.delete(nodeId);
  }

  list(): readonly ControlCommand[] {
    return this.commands;
  }

  ackLatencyPercentile(percentile: number): number {
    const latencies = this.commands
      .map((command) => command.ackLatencyMs ?? Number.NaN)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (!latencies.length) return 0;
    const index = Math.min(latencies.length - 1, Math.ceil((percentile / 100) * latencies.length) - 1);
    return latencies[Math.max(0, index)] as number;
  }

  get commandCount() {
    return this.commands.length;
  }
}
