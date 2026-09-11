import type { DeviceSupportState } from './vendor-device-integration-registry';
import type { KnowledgeClassification } from './offline-rag-retrieval-index';

export type SyncPayloadKind = 'PROFILE' | 'TASK' | 'USAGE_METRICS' | 'APP_SETTINGS' | 'APPROVED_KNOWLEDGE' | 'LEARNING_RECEIPT';

export interface DeviceVerificationReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  deviceId: string;
  platform: 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'WEB' | 'ARM' | 'XR';
  state: DeviceSupportState;
  adapterVersion: string;
  allowedKinds: readonly SyncPayloadKind[];
  verifiedAt: string;
  expiresAt?: string;
  evidenceRefs: readonly string[];
}

export interface DeviceSyncItem {
  itemId: string;
  tenantId: string;
  userId: string;
  kind: SyncPayloadKind;
  classification: KnowledgeClassification;
  version: number;
  contentHash: string;
  payloadRef: string;
  evidenceRefs: readonly string[];
}

export interface DeviceSyncManifest {
  manifestId: string;
  tenantId: string;
  userId: string;
  deviceId: string;
  platform: DeviceVerificationReceipt['platform'];
  adapterVersion: string;
  generatedAt: string;
  items: readonly DeviceSyncItem[];
  rejected: readonly { itemId: string; reason: string }[];
  receiptRef: string;
}

export const DEVICE_SYNC_GUARDRAILS = {
  verifiedDeviceRequired: true,
  verificationEvidenceRequired: true,
  tenantAndUserIsolationRequired: true,
  topSecretClientSyncAllowed: false,
  payloadScopeRequired: true,
  productionMutationAllowed: false,
} as const;

export class DeviceSyncGateway {
  prepare(receipt: DeviceVerificationReceipt, items: readonly DeviceSyncItem[], generatedAt: string): DeviceSyncManifest {
    if (!receipt.receiptId || !receipt.tenantId || !receipt.userId || !receipt.deviceId || !receipt.adapterVersion || !receipt.verifiedAt) throw new Error('complete device verification receipt required');
    if (receipt.state !== 'VERIFIED') throw new Error('device sync requires VERIFIED device support');
    if (receipt.evidenceRefs.length === 0) throw new Error('device verification requires evidence');
    if (receipt.expiresAt && Date.parse(receipt.expiresAt) <= Date.parse(generatedAt)) throw new Error('device verification receipt expired');

    const allowedKinds = new Set(receipt.allowedKinds);
    const accepted: DeviceSyncItem[] = [];
    const rejected: { itemId: string; reason: string }[] = [];

    for (const item of items) {
      let reason = '';
      if (item.tenantId !== receipt.tenantId || item.userId !== receipt.userId) reason = 'tenant/user scope mismatch';
      else if (!allowedKinds.has(item.kind)) reason = 'payload kind not authorized by device receipt';
      else if (item.classification === 'TOP_SECRET') reason = 'TOP_SECRET excluded from ordinary client sync';
      else if (!item.itemId || !item.payloadRef || !item.contentHash || item.version < 1) reason = 'invalid sync item metadata';
      else if (item.evidenceRefs.length === 0) reason = 'sync item requires evidence';

      if (reason) rejected.push({ itemId: item.itemId, reason });
      else accepted.push({ ...item, evidenceRefs: [...item.evidenceRefs] });
    }

    return {
      manifestId: `sync:${receipt.deviceId}:${generatedAt}`,
      tenantId: receipt.tenantId,
      userId: receipt.userId,
      deviceId: receipt.deviceId,
      platform: receipt.platform,
      adapterVersion: receipt.adapterVersion,
      generatedAt,
      items: accepted,
      rejected,
      receiptRef: receipt.receiptId,
    };
  }
}
