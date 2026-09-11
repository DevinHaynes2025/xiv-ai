export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface PrivateDataRoomObject {
  objectId: string;
  tenantId: string;
  ownerUserId: string;
  classification: DataClassification;
  encrypted: boolean;
  contentHash: string;
  storageRef: string;
  accessPrincipals: string[];
  provenanceRefs: string[];
}

export function canAccessDataRoomObject(object: PrivateDataRoomObject, principalId: string): boolean {
  return object.encrypted && object.accessPrincipals.includes(principalId);
}

export const PRIVATE_DATA_ROOM_GUARDRAILS = {
  tenantIsolationRequired: true,
  encryptionRequired: true,
  provenanceRequired: true,
  topSecretExternalSyncAllowed: false,
  rawSecretsInSourceControlAllowed: false,
};
