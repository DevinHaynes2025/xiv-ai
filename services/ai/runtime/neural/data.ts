import type { ConnectorState, PolyglotStoreV3 } from './types';
import { ENTERPRISE_CONNECTORS, POLYGLOT_STORES_V3, type EnterpriseConnector } from './types';

export type DataProvider = { providerId: string; state: ConnectorState };
export type DataStore = { kind: PolyglotStoreV3; reasonRequired: true };
export type DataBinding = { bindingId: string };
export type DataRegion = { regionId: string };
export type DataClass = { classification: string };
export type DataRetention = { policyId: string };
export type DataResidency = { requiredRegion: string };
export type DataEncryptionPolicy = { atRest: true; inTransit: true };
export type DataLineage = { lineageId: string };
export type DataProvenance = { required: true };
export type DataHealth = { state: 'HEALTHY' | 'DEGRADED' | 'UNKNOWN' };
export type DataCost = { tracked: true };
export type DataBackupReference = { referenceId: string; guarantee: false };
export type DataAccessDecision = { allowed: boolean; reason?: string };

export type KnowledgeSource = {
  sourceId: string;
  provider: string;
  owner: string;
  license: string;
  jurisdiction: string;
  retrievedAt: string;
  freshness: string;
  rights: string;
  provenance: string;
  classification: string;
  confidence: string;
  allowedUse: string;
};

export function listPolyglotStores(): readonly PolyglotStoreV3[] {
  return POLYGLOT_STORES_V3;
}

export function agentReceivesRawDbCredential(): false {
  return false;
}

export function routeThroughDataAccessGateway(input: {
  guardianApproved: boolean;
  purpose: string;
  classification: string;
  store: PolyglotStoreV3;
}) {
  if (!input.guardianApproved) return { allowed: false as const, reason: 'guardian_required' };
  if (!input.purpose) return { allowed: false as const, reason: 'purpose_required' };
  if (!input.classification) return { allowed: false as const, reason: 'classification_required' };
  void input.store;
  return { allowed: true as const, credentialsReturned: false as const };
}

export function enterpriseConnectorState(_name: EnterpriseConnector): ConnectorState {
  void ENTERPRISE_CONNECTORS;
  return 'NOT_CONFIGURED';
}

export function mediaBinaryInRelationalStore(): false {
  return false;
}

export function registerKnowledgeSource(source: KnowledgeSource) {
  if (!source.provenance || !source.license || !source.rights) {
    return { allowed: false as const, reason: 'knowledge_source_requires_provenance_license_rights' };
  }
  return { allowed: true as const, source };
}

export function copiesEntireInternet(): false {
  return false;
}
