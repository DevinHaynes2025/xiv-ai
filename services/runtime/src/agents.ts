import type { AttestationService } from './attestation';
import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { RuntimeError } from './errors';
import { logicalAgentSlot, type IdFactory } from './ids';
import { sameTenant } from './isolation';
import type {
  AgentAssignment,
  AuthenticatedPrincipal,
  LogicalAgentIdentity,
  RuntimeNode,
  TenantRef,
  WorkloadClassification,
} from './types';

const CLASSIFICATION_RANK: Record<WorkloadClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

export type AgentRegistryStats = {
  registered: number;
  active: number;
  slots: number;
  slotCollisions: number;
  crossTenantCollisions: number;
  integrityFailures: number;
};

/**
 * Logical agent registry (AC-09).
 *
 * A logical agent is a registry row, not a process. Registration allocates an
 * identity and nothing else: no runtime is reserved, no node is contacted, and
 * `active` stays false until an authorized activation. That is what lets the
 * contract hold 100,000 identities without 100,000 permanent processes.
 */
export class LogicalAgentRegistry {
  private readonly agents = new Map<string, LogicalAgentIdentity>();
  private readonly slots = new Map<string, string>();
  private readonly assignments = new Map<string, AgentAssignment>();
  private readonly assignmentsByAgent = new Map<string, string[]>();
  private slotCollisions = 0;
  private crossTenantCollisions = 0;
  private unauthorizedActivations = 0;
  private rejectedAssignments = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
    private readonly attestation: AttestationService,
  ) {}

  /**
   * Registers a dormant logical identity. Bulk registration is deliberately
   * cheap and audit-free per row; the caller audits the batch instead, because
   * 100,000 individual audit rows would say nothing extra about integrity.
   */
  register(input: {
    tenant: TenantRef;
    agentKey: string;
    classification: WorkloadClassification;
  }): LogicalAgentIdentity {
    const slot = logicalAgentSlot(input.tenant.organizationId, input.tenant.universeId, input.agentKey);
    const existingAgentId = this.slots.get(slot);
    if (existingAgentId) {
      const existing = this.agents.get(existingAgentId) as LogicalAgentIdentity;
      this.slotCollisions += 1;
      if (!sameTenant(existing.tenant, input.tenant)) this.crossTenantCollisions += 1;
      throw new RuntimeError('duplicate_identity', 'This logical agent key already exists in this universe.', {
        agentKey: input.agentKey,
      });
    }

    const identity: LogicalAgentIdentity = {
      agentId: this.ids.mint('agent'),
      tenant: input.tenant,
      agentKey: input.agentKey,
      classification: input.classification,
      registeredAt: this.clock.now(),
      active: false,
      activationCount: 0,
    };
    this.agents.set(identity.agentId, identity);
    this.slots.set(slot, identity.agentId);
    return identity;
  }

  registerBatch(
    tenant: TenantRef,
    keys: readonly string[],
    classification: WorkloadClassification,
  ): { registered: number; rejected: number } {
    let registered = 0;
    let rejected = 0;
    for (const agentKey of keys) {
      try {
        this.register({ tenant, agentKey, classification });
        registered += 1;
      } catch {
        rejected += 1;
      }
    }
    this.audit.append({
      tenant,
      category: 'agent',
      kind: 'logical_agents_registered',
      subjectId: `${tenant.organizationId}/${tenant.universeId}`,
      detail: { registered, rejected, classification },
    });
    return { registered, rejected };
  }

  get(scope: TenantRef, agentId: string): LogicalAgentIdentity | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;
    if (!sameTenant(agent.tenant, scope)) {
      this.audit.append({
        tenant: scope,
        category: 'isolation',
        kind: 'cross_tenant_agent_read_denied',
        subjectId: agentId,
        detail: {},
      });
      return undefined;
    }
    return agent;
  }

  require(scope: TenantRef, agentId: string): LogicalAgentIdentity {
    const agent = this.get(scope, agentId);
    if (!agent) {
      throw new RuntimeError('not_found', 'This logical agent is not visible in the caller scope.', { agentId });
    }
    return agent;
  }

  /**
   * Activation (AC-07/AC-09). Requires an authorized principal, a same-tenant
   * node, an eligible node state, attestation for protected classifications and
   * a classification the node is allowed to carry.
   */
  activate(input: {
    principal: AuthenticatedPrincipal;
    agentId: string;
    node: RuntimeNode;
    nodeMaxClassification: WorkloadClassification;
    reason: string;
  }): AgentAssignment {
    const reject = (reason: string): never => {
      this.rejectedAssignments += 1;
      this.audit.append({
        tenant: input.principal.tenant,
        category: 'security',
        kind: 'agent_assignment_denied',
        subjectId: input.agentId,
        principalId: input.principal.principalId,
        detail: { reason, nodeId: input.node.nodeId },
      });
      throw new RuntimeError('unauthorized', 'This agent may not run on that runtime node.', { reason });
    };

    if (!input.principal.capabilities.includes('agent.activate')) {
      this.unauthorizedActivations += 1;
      reject('capability_missing');
    }
    const agent = this.agents.get(input.agentId);
    if (!agent) reject('unknown_agent');
    const identity = agent as LogicalAgentIdentity;
    if (!sameTenant(identity.tenant, input.principal.tenant)) {
      this.unauthorizedActivations += 1;
      reject('agent_outside_principal_tenant');
    }
    if (!sameTenant(identity.tenant, input.node.tenant)) reject('node_outside_agent_tenant');
    if (input.node.state !== 'active') reject(`node_state_${input.node.state}`);
    if (CLASSIFICATION_RANK[identity.classification] > CLASSIFICATION_RANK[input.nodeMaxClassification]) {
      reject('classification_above_node_policy');
    }
    if (this.attestation.trustPolicy.protectedClassifications.includes(identity.classification)) {
      const state = this.attestation.evaluate(input.node.nodeId);
      if (state.status !== 'required_pass') reject(`attestation_${state.status}`);
    }

    const assignment: AgentAssignment = {
      assignmentId: this.ids.mint('asgn'),
      agentId: identity.agentId,
      nodeId: input.node.nodeId,
      tenant: identity.tenant,
      classification: identity.classification,
      assignedAt: this.clock.now(),
      reason: input.reason,
    };
    this.assignments.set(assignment.assignmentId, assignment);
    const history = this.assignmentsByAgent.get(identity.agentId) ?? [];
    history.push(assignment.assignmentId);
    this.assignmentsByAgent.set(identity.agentId, history);

    this.agents.set(identity.agentId, {
      ...identity,
      active: true,
      assignedNodeId: input.node.nodeId,
      activationCount: identity.activationCount + 1,
    });

    this.audit.append({
      tenant: identity.tenant,
      category: 'agent',
      kind: 'agent_assigned',
      subjectId: identity.agentId,
      principalId: input.principal.principalId,
      detail: {
        assignmentId: assignment.assignmentId,
        nodeId: input.node.nodeId,
        classification: identity.classification,
      },
    });
    return assignment;
  }

  /** Legitimate movement keeps the same agent identity and appends lineage. */
  move(input: {
    principal: AuthenticatedPrincipal;
    agentId: string;
    node: RuntimeNode;
    nodeMaxClassification: WorkloadClassification;
    reason: string;
  }): { assignment: AgentAssignment; identityRetained: boolean } {
    const before = this.require(input.principal.tenant, input.agentId);
    const previousAssignmentId = this.assignmentsByAgent.get(input.agentId)?.at(-1);
    if (previousAssignmentId) {
      const previous = this.assignments.get(previousAssignmentId);
      if (previous) this.assignments.set(previousAssignmentId, { ...previous, releasedAt: this.clock.now() });
    }
    const assignment = this.activate(input);
    const after = this.require(input.principal.tenant, input.agentId);
    return { assignment, identityRetained: before.agentId === after.agentId && before.agentKey === after.agentKey };
  }

  deactivate(scope: TenantRef, agentId: string, reason: string) {
    const agent = this.require(scope, agentId);
    this.agents.set(agentId, { ...agent, active: false, assignedNodeId: undefined });
    const last = this.assignmentsByAgent.get(agentId)?.at(-1);
    if (last) {
      const assignment = this.assignments.get(last);
      if (assignment) this.assignments.set(last, { ...assignment, releasedAt: this.clock.now() });
    }
    this.audit.append({
      tenant: agent.tenant,
      category: 'agent',
      kind: 'agent_deactivated',
      subjectId: agentId,
      detail: { reason },
    });
  }

  assignmentHistory(agentId: string): AgentAssignment[] {
    return (this.assignmentsByAgent.get(agentId) ?? [])
      .map((id) => this.assignments.get(id))
      .filter((value): value is AgentAssignment => Boolean(value));
  }

  activeOnNode(nodeId: string): LogicalAgentIdentity[] {
    const out: LogicalAgentIdentity[] = [];
    for (const agent of this.agents.values()) {
      if (agent.active && agent.assignedNodeId === nodeId) out.push(agent);
    }
    return out;
  }

  /**
   * Registry integrity check: every agent maps back to exactly one slot and
   * every slot maps back to a live agent in the same tenant.
   */
  stats(): AgentRegistryStats {
    let integrityFailures = 0;
    let active = 0;
    for (const [agentId, agent] of this.agents.entries()) {
      if (agent.active) active += 1;
      const slot = logicalAgentSlot(agent.tenant.organizationId, agent.tenant.universeId, agent.agentKey);
      if (this.slots.get(slot) !== agentId) integrityFailures += 1;
    }
    for (const [slot, agentId] of this.slots.entries()) {
      const agent = this.agents.get(agentId);
      if (!agent) {
        integrityFailures += 1;
        continue;
      }
      if (logicalAgentSlot(agent.tenant.organizationId, agent.tenant.universeId, agent.agentKey) !== slot) {
        integrityFailures += 1;
      }
    }
    return {
      registered: this.agents.size,
      active,
      slots: this.slots.size,
      slotCollisions: this.slotCollisions,
      crossTenantCollisions: this.crossTenantCollisions,
      integrityFailures,
    };
  }

  get unauthorizedActivationCount() {
    return this.unauthorizedActivations;
  }

  get rejectedAssignmentCount() {
    return this.rejectedAssignments;
  }

  countForTenant(tenant: TenantRef): number {
    let total = 0;
    for (const agent of this.agents.values()) if (sameTenant(agent.tenant, tenant)) total += 1;
    return total;
  }
}
