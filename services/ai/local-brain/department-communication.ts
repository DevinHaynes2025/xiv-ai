import { publishPersistentAgentMessage } from './persistent-agent-bus';
import { FOUNDER_DELEGATE_DEPARTMENTS, type FounderDelegateDepartment } from './founder-delegates';
import { GlobalBrainHighways } from './global-brain-highways';
import { SparseRoutingTable } from './sparse-routing-tables';

export async function sendDepartmentMessage(input: {
  highways: GlobalBrainHighways;
  routes: SparseRoutingTable;
  tenantId: string;
  universeId: string;
  from: FounderDelegateDepartment;
  to: FounderDelegateDepartment;
  body: string;
  root?: string;
}) {
  if (!FOUNDER_DELEGATE_DEPARTMENTS.includes(input.from) || !FOUNDER_DELEGATE_DEPARTMENTS.includes(input.to)) {
    return { accepted: false as const, reason: 'UNKNOWN_DEPARTMENT' };
  }
  if (!input.tenantId || !input.universeId) {
    return { accepted: false as const, reason: 'DEPARTMENT_SCOPE_REQUIRED' };
  }

  input.routes.register({
    fromId: `dept:${input.from}`,
    toId: `dept:${input.to}`,
    nextHop: 'department',
    tenantId: input.tenantId,
    universeId: input.universeId,
    weight: 0.5,
  });

  const routed = input.highways.route({
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromLane: 'department',
    toLane: 'agent_team',
    topic: `${input.from}->${input.to}`,
    body: input.body,
  });
  if (!routed.accepted) return { accepted: false as const, reason: routed.reason };

  const message = await publishPersistentAgentMessage({
    fromRole: input.from,
    toRole: input.to,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'task',
    body: input.body.slice(0, 16_000),
    evidenceRefs: [routed.packet.id],
    requiresHumanApproval: false,
  }, input.root);

  return {
    accepted: true as const,
    message,
    packet: routed.packet,
    productionAuthorization: false as const,
  };
}
