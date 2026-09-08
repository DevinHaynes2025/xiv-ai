/**
 * Specialty workers: Research / Engineering / QA / Security / Database / Knowledge.
 * Maps onto LA-01 night_* agents where applicable — does not rebuild them.
 */

import type { CloudWorkforceAgentId } from '../cloudworkforce/types';
import type { SpecialtyWorkerRole, WorkerIdentity } from './types';
import { createWorkerIdentity } from './identity';

export type SpecialtyWorkerDef = {
  role: SpecialtyWorkerRole;
  displayName: string;
  capabilities: readonly string[];
  mapsToLa01: CloudWorkforceAgentId | null;
  defaultPermissions: 'NONE';
  allTools: false;
  l4Enabled: false;
};

export const SPECIALTY_WORKERS: readonly SpecialtyWorkerDef[] = [
  {
    role: 'RESEARCH',
    displayName: 'Research Worker',
    capabilities: ['research', 'summarize', 'follow_the_sun'],
    mapsToLa01: 'night_research',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
  {
    role: 'ENGINEERING',
    displayName: 'Engineering Worker',
    capabilities: ['sandbox_patch', 'code_review', 'follow_the_sun'],
    mapsToLa01: 'night_engineering',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
  {
    role: 'QA',
    displayName: 'QA Worker',
    capabilities: ['qa_triage', 'regression', 'follow_the_sun'],
    mapsToLa01: 'night_qa',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
  {
    role: 'SECURITY',
    displayName: 'Security Worker',
    capabilities: ['security_review', 'denial_audit'],
    mapsToLa01: 'night_security',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
  {
    role: 'DATABASE',
    displayName: 'Database Worker',
    capabilities: ['data_quality', 'schema_check', 'guardian_db'],
    mapsToLa01: 'night_data_quality',
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
  {
    role: 'KNOWLEDGE',
    displayName: 'Knowledge Worker',
    capabilities: ['knowledge_index', 'brief_fragment'],
    mapsToLa01: null,
    defaultPermissions: 'NONE',
    allTools: false,
    l4Enabled: false,
  },
];

export function listSpecialtyWorkers(): readonly SpecialtyWorkerDef[] {
  return SPECIALTY_WORKERS;
}

export function spawnSpecialtyWorker(input: {
  role: SpecialtyWorkerRole;
  workerId: string;
  instanceId: string;
  tenantId: string;
  universeId: string;
}): WorkerIdentity {
  const def = SPECIALTY_WORKERS.find((w) => w.role === input.role);
  if (!def) {
    throw new Error(`unknown_specialty_role:${input.role}`);
  }
  return createWorkerIdentity({
    workerId: input.workerId,
    instanceId: input.instanceId,
    role: def.role,
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilities: def.capabilities,
  });
}

export function mappedLa01AgentIds(): readonly CloudWorkforceAgentId[] {
  return SPECIALTY_WORKERS.map((w) => w.mapsToLa01).filter((x): x is CloudWorkforceAgentId => x != null);
}
