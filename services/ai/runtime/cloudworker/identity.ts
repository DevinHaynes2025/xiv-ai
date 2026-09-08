/**
 * Worker identity — DEFAULT PERMISSIONS = NONE. Capability ≠ privilege.
 */

import type { SpecialtyWorkerRole, WorkerIdentity } from './types';

export function createWorkerIdentity(input: {
  workerId: string;
  instanceId: string;
  role: SpecialtyWorkerRole;
  tenantId: string;
  universeId: string;
  capabilities: readonly string[];
}): WorkerIdentity {
  return {
    workerId: input.workerId,
    instanceId: input.instanceId,
    agentRole: input.role,
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilities: input.capabilities,
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
    forged: false,
    productionLive: false,
  };
}

export function identityHasAllTools(_id: WorkerIdentity): false {
  return false;
}

export function identityDefaultPermissions(id: WorkerIdentity): 'NONE' {
  return id.defaultPermissions;
}
