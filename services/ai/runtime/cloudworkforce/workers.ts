/**
 * First cloud team definitions.
 * NO all-tools. DEFAULT PERMISSIONS = NONE. Capability ≠ privilege. L4 disabled.
 */

import type { AgentShift, AgentWorker, CloudWorkforceAgentId } from './types';
import { CLOUD_WORKFORCE_AGENT_IDS } from './types';

export type CloudWorkforceAgentDefinition = {
  agentId: CloudWorkforceAgentId;
  displayName: string;
  role: string;
  defaultPermissions: 'NONE';
  allTools: false;
  l4Enabled: false;
  productionLive: false;
  capabilityEqualsPrivilege: false;
};

export const CLOUD_WORKFORCE_TEAM: readonly CloudWorkforceAgentDefinition[] = [
  {
    agentId: 'night_research',
    displayName: 'Night Research Agent',
    role: 'Overnight research missions under Night Shift template',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'night_engineering',
    displayName: 'Night Engineering Agent',
    role: 'Sandbox engineering / patch prep — never silent prod deploy',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'night_qa',
    displayName: 'Night QA Agent',
    role: 'Overnight QA and regression triage',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'night_security',
    displayName: 'Night Security Watch',
    role: 'Security review and denial auditing',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'night_data_quality',
    displayName: 'Night Data Quality Agent',
    role: 'Data quality and lineage checks',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'night_product',
    displayName: 'Night Product Agent',
    role: 'Product idea capture for Founder Brief — proposals only',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'founder_brief_aggregator',
    displayName: 'Founder Brief Aggregator',
    role: 'Compose FounderShiftBrief sections for morning delivery',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
  {
    agentId: 'mission_router',
    displayName: 'Mission Router',
    role: 'Guardian-aware mission routing and handoffs — not a tenant mesh peer with elevated tools',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    productionLive: false,
    capabilityEqualsPrivilege: false,
  },
] as const;

export function listCloudWorkforceAgents(): readonly CloudWorkforceAgentDefinition[] {
  return CLOUD_WORKFORCE_TEAM;
}

export function listCloudWorkforceAgentIds(): readonly CloudWorkforceAgentId[] {
  return CLOUD_WORKFORCE_AGENT_IDS;
}

export function registerCloudWorker(input: {
  workerId: string;
  agentId: CloudWorkforceAgentId;
  tenantId: string;
  universeId: string;
  shiftId?: string | null;
}): AgentWorker {
  const def = CLOUD_WORKFORCE_TEAM.find((a) => a.agentId === input.agentId);
  if (!def) {
    throw new Error('unknown_cloud_workforce_agent');
  }
  return {
    workerId: input.workerId,
    agentId: input.agentId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    shiftId: input.shiftId ?? null,
    status: 'IDLE',
    permissions: [],
    toolsGranted: [],
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    capabilityEqualsPrivilege: false,
    productionLive: false,
    forged: false,
  };
}

export function openAgentShift(input: {
  shiftId: string;
  kind: AgentShift['kind'];
  tenantId: string;
  universeId: string;
  startedAt: string;
  endsAt?: string | null;
}): AgentShift {
  return {
    shiftId: input.shiftId,
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    startedAt: input.startedAt,
    endsAt: input.endsAt ?? null,
    continuousAutonomy: false,
    productionLive: false,
  };
}

export function workerHasAllTools(_worker: AgentWorker): false {
  return false;
}

export function workerDefaultPermissions(_worker: AgentWorker): 'NONE' {
  return 'NONE';
}
