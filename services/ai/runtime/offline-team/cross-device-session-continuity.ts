export type DeviceClass = 'PHONE' | 'TABLET' | 'LAPTOP' | 'DESKTOP' | 'SMART_TV' | 'CAR' | 'WEARABLE' | 'XR' | 'OTHER';

export interface SessionContextShard {
  sessionId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  fromDevice: DeviceClass;
  toDevice: DeviceClass;
  approvedContextKeys: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  consentRef: string;
  createdAt: string;
}

export function canHandoffSession(shard: SessionContextShard): { allowed: boolean; reason: string } {
  if (!shard.consentRef) return { allowed: false, reason: 'consent required' };
  if (!shard.approvedContextKeys.length) return { allowed: false, reason: 'no approved context' };
  if (shard.classification === 'TOP_SECRET') return { allowed: false, reason: 'TOP_SECRET cross-device ordinary handoff denied' };
  return { allowed: true, reason: 'approved minimized context only' };
}

export const sessionContinuityPolicy = {
  fullDeviceCloneAllowed: false,
  rawPrivateHistoryHandoffAllowed: false,
  topSecretOrdinaryHandoffAllowed: false,
  contextMinimizationRequired: true,
  productionAuthorityInheritedAcrossDevices: false,
};
