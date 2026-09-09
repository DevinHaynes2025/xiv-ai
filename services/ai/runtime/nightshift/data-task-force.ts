/**
 * Data Task Force agent roles as catalog.
 * All DB ops still through Guardian → Data Access Gateway. No raw credentials.
 */
import { agentReceivesRawDbCredential, dataAccessPath, routeAgentDataAccess } from '../osfund/gateway';
import type { DataTaskForceRole } from './types';
import { DATA_TASK_FORCE_ROLES } from './types';

export type DataTaskForceCatalog = {
  roles: readonly DataTaskForceRole[];
  dbPath: readonly string[];
  credentialsReturned: false;
  bypassesGuardian: false;
};

export function openDataTaskForceCatalog(): DataTaskForceCatalog {
  return {
    roles: DATA_TASK_FORCE_ROLES,
    dbPath: [...dataAccessPath()],
    credentialsReturned: false,
    bypassesGuardian: false,
  };
}

export function listDataTaskForceRoles(): readonly DataTaskForceRole[] {
  return DATA_TASK_FORCE_ROLES;
}

export function dataTaskForceDbAccess(input: {
  role: DataTaskForceRole;
  guardianApproved: boolean;
  purpose: string;
  classification: string;
  rawCredentialRequested?: boolean;
}) {
  void input.role;
  return routeAgentDataAccess({
    agentId: `data-tf:${input.role}`,
    guardianApproved: input.guardianApproved,
    purpose: input.purpose,
    classification: input.classification,
    provider: 'POSTGRES',
    rawCredentialRequested: input.rawCredentialRequested,
  });
}

export function dataTaskForceReceivesRawCredentials(): false {
  return agentReceivesRawDbCredential();
}

export function dataTaskForceBypassesGuardian(): false {
  return false;
}

export function dataTaskForceBypassesDataAccessGateway(): false {
  return false;
}
