import type { DatabaseRecoveryReceipt } from './multi-tenant-local-database-service';
import type { ReplicationAdapterRegistry, ReplicationClassification } from './replication-adapter-registry';

export interface OperationalReplicationRequest {
  tenantId: string;
  adapterId: string;
  classification: ReplicationClassification;
  recoveryReceipt: DatabaseRecoveryReceipt;
  evidenceRefs: string[];
}

export interface OperationalReplicationDecision {
  allowed: boolean;
  reason: string;
  tenantId: string;
  adapterId: string;
  classification: ReplicationClassification;
}

export function evaluateOperationalReplication(
  registry: ReplicationAdapterRegistry,
  request: OperationalReplicationRequest,
): OperationalReplicationDecision {
  if (!request.evidenceRefs.length) {
    return { allowed: false, reason: 'replication evidence required', tenantId: request.tenantId, adapterId: request.adapterId, classification: request.classification };
  }
  if (request.recoveryReceipt.tenantId !== request.tenantId || !request.recoveryReceipt.integrityVerified) {
    return { allowed: false, reason: 'verified tenant recovery receipt required', tenantId: request.tenantId, adapterId: request.adapterId, classification: request.classification };
  }
  if (request.classification === 'TOP_SECRET') {
    return { allowed: false, reason: 'TOP_SECRET ordinary external replication disabled', tenantId: request.tenantId, adapterId: request.adapterId, classification: request.classification };
  }
  if (!registry.canReplicate(request.adapterId, request.classification)) {
    return { allowed: false, reason: 'verified-partner replication adapter required', tenantId: request.tenantId, adapterId: request.adapterId, classification: request.classification };
  }
  return { allowed: true, reason: 'verified local recovery and verified-partner adapter', tenantId: request.tenantId, adapterId: request.adapterId, classification: request.classification };
}

export const OPERATIONAL_REPLICATION_GUARDRAILS = {
  replicationDisabledUntilVerifiedPartner: true,
  localRecoveryReceiptRequired: true,
  replicationEvidenceRequired: true,
  topSecretOrdinaryExternalReplicationAllowed: false,
};
