import type { AttestationService } from './attestation';
import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import type { HardwareRegistry } from './hardware';
import type { IdFactory } from './ids';
import type {
  RoutingDecision,
  RoutingRejectionReason,
  RuntimeNode,
  WorkloadSpec,
} from './types';

export type NodeLoad = {
  activeWorkloads: number;
  cpuMillisCommitted: number;
  gpuMillisCommitted: number;
  ramMbCommitted: number;
};

export type RoutingInput = {
  spec: WorkloadSpec;
  candidates: readonly RuntimeNode[];
  load: (nodeId: string) => NodeLoad;
  /** Tenant budget headroom check, evaluated before any node is inspected. */
  tenantBudgetAvailable: boolean;
  allowDegraded?: boolean;
};

const EMPTY_LOAD: NodeLoad = { activeWorkloads: 0, cpuMillisCommitted: 0, gpuMillisCommitted: 0, ramMbCommitted: 0 };

/**
 * Compute router (AC-05).
 *
 * The router is a pure filter-then-rank function over candidate nodes. Every
 * exclusion is recorded with a reason code, so a routing decision can be
 * audited after the fact: "why did this workload land here, and why not there".
 *
 * Security filters run before preference scoring, and there is no fallback that
 * relaxes them. When nothing survives the filters the router rejects.
 */
export class ComputeRouter {
  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
    private readonly hardware: HardwareRegistry,
    private readonly attestation: AttestationService,
  ) {}

  private reject(
    spec: WorkloadSpec,
    reason: RoutingRejectionReason,
    rejectedNodes: Record<string, RoutingRejectionReason>,
    considered: number,
    startedMicros: number,
  ): RoutingDecision {
    const decision: RoutingDecision = {
      outcome: 'rejected',
      reason,
      decisionId: this.ids.mint('route'),
      decidedAt: this.clock.now(),
      decisionMicros: this.clock.micros() - startedMicros,
      candidatesConsidered: considered,
      rejectedNodes,
    };
    this.audit.append({
      tenant: spec.tenant,
      category: 'routing',
      kind: 'routing_rejected',
      subjectId: spec.workloadId,
      detail: { reason, decisionId: decision.decisionId, considered, rejectedNodes },
    });
    return decision;
  }

  route(input: RoutingInput): RoutingDecision {
    const startedMicros = this.clock.micros();
    const { spec } = input;
    const rejectedNodes: Record<string, RoutingRejectionReason> = {};

    if (!input.tenantBudgetAvailable) {
      return this.reject(spec, 'budget_exhausted', rejectedNodes, input.candidates.length, startedMicros);
    }

    const protectedExecution = this.attestation.trustPolicy.protectedClassifications.includes(spec.classification);
    const eligible: { node: RuntimeNode; score: number }[] = [];

    for (const node of input.candidates) {
      if (node.tenant.organizationId !== spec.tenant.organizationId) {
        rejectedNodes[node.nodeId] = 'tenant_mismatch';
        continue;
      }
      if (node.tenant.universeId !== spec.tenant.universeId) {
        rejectedNodes[node.nodeId] = 'universe_mismatch';
        continue;
      }
      if (node.state !== 'active') {
        rejectedNodes[node.nodeId] = 'node_unavailable';
        continue;
      }
      if (node.degraded && !input.allowDegraded) {
        rejectedNodes[node.nodeId] = 'node_unavailable';
        continue;
      }
      if (!this.hardware.isConfigured(node.hardware.classId)) {
        rejectedNodes[node.nodeId] = 'hardware_unconfigured';
        continue;
      }
      const hardwareMatch = this.hardware.satisfies(node.hardware, spec.hardware);
      if (!hardwareMatch.ok) {
        rejectedNodes[node.nodeId] = (hardwareMatch.reason as RoutingRejectionReason) ?? 'unsupported_hardware';
        continue;
      }
      if (protectedExecution) {
        const state = this.attestation.evaluate(node.nodeId);
        if (state.status !== 'required_pass') {
          rejectedNodes[node.nodeId] = 'attestation_required';
          continue;
        }
      }

      const load = input.load(node.nodeId) ?? EMPTY_LOAD;
      if (load.activeWorkloads + 1 > node.capacity.concurrentWorkloads) {
        rejectedNodes[node.nodeId] = 'capacity_exhausted';
        continue;
      }
      if (load.cpuMillisCommitted + spec.budget.cpuMillis > node.capacity.cpuMillis) {
        rejectedNodes[node.nodeId] = 'capacity_exhausted';
        continue;
      }
      if (spec.budget.gpuMillis > 0 && load.gpuMillisCommitted + spec.budget.gpuMillis > node.capacity.gpuMillis) {
        rejectedNodes[node.nodeId] = 'capacity_exhausted';
        continue;
      }
      if (load.ramMbCommitted + spec.budget.ramMb > node.capacity.ramMb) {
        rejectedNodes[node.nodeId] = 'capacity_exhausted';
        continue;
      }

      const cpuHeadroom = 1 - (load.cpuMillisCommitted + spec.budget.cpuMillis) / Math.max(1, node.capacity.cpuMillis);
      const slotHeadroom = 1 - (load.activeWorkloads + 1) / Math.max(1, node.capacity.concurrentWorkloads);
      eligible.push({ node, score: cpuHeadroom * 0.5 + slotHeadroom * 0.5 });
    }

    if (!eligible.length) {
      return this.reject(spec, 'no_eligible_runtime', rejectedNodes, input.candidates.length, startedMicros);
    }

    eligible.sort((a, b) => (b.score === a.score ? (a.node.nodeId < b.node.nodeId ? -1 : 1) : b.score - a.score));
    const chosen = (eligible[0] as { node: RuntimeNode }).node;

    const decision: RoutingDecision = {
      outcome: 'assigned',
      nodeId: chosen.nodeId,
      decisionId: this.ids.mint('route'),
      decidedAt: this.clock.now(),
      decisionMicros: this.clock.micros() - startedMicros,
      candidatesConsidered: input.candidates.length,
      rejectedNodes,
    };
    this.audit.append({
      tenant: spec.tenant,
      category: 'routing',
      kind: 'routing_assigned',
      subjectId: spec.workloadId,
      detail: {
        decisionId: decision.decisionId,
        nodeId: chosen.nodeId,
        hardwareClass: chosen.hardware.classId,
        protectedExecution,
        rejectedNodes,
      },
    });
    return decision;
  }
}
