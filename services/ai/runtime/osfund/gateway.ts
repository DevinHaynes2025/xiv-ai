/**
 * Data access path: Agent → Guardian → Policy → Classification → Purpose → Adapter → Audit.
 * Agents never receive raw DB credentials.
 */

import { DATA_ACCESS_PATH, type DataAccessHop, type DatabaseProviderKind } from './types';

export type DataAccessRequest = {
  agentId: string;
  guardianApproved: boolean;
  purpose?: string;
  classification?: string;
  provider: DatabaseProviderKind;
  rawCredentialRequested?: boolean;
  hopSkipped?: DataAccessHop;
};

export type DataAccessDecision =
  | { allowed: true; path: readonly DataAccessHop[]; credentialsReturned: false }
  | { allowed: false; reason: string };

export function agentReceivesRawDbCredential(): false {
  return false;
}

export function dataAccessPath(): readonly DataAccessHop[] {
  return DATA_ACCESS_PATH;
}

export function routeAgentDataAccess(input: DataAccessRequest): DataAccessDecision {
  if (input.hopSkipped) {
    return { allowed: false, reason: `data_access_path_requires_${input.hopSkipped.toLowerCase()}` };
  }
  if (input.guardianApproved !== true) {
    return { allowed: false, reason: 'guardian_required' };
  }
  if (!input.purpose) {
    return { allowed: false, reason: 'purpose_required' };
  }
  if (!input.classification) {
    return { allowed: false, reason: 'classification_required' };
  }
  if (input.rawCredentialRequested === true) {
    return { allowed: false, reason: 'agent_cannot_receive_raw_db_credential' };
  }
  void input.provider;
  void input.agentId;
  return { allowed: true, path: DATA_ACCESS_PATH, credentialsReturned: false };
}

export function skipGuardianInDataPath(): false {
  return false;
}
