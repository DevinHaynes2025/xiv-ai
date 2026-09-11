import type { OperationsClassification, RuntimeHealth } from './persistent-operations-views';

export type VendorIntegrationStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type DeviceIntegrationStatus = 'TARGET' | 'ADAPTER_BUILT' | 'TESTED' | 'VERIFIED';

export type VendorVerificationRecord = {
  vendorId: string;
  vendorName: string;
  status: VendorIntegrationStatus;
  evidenceRefs: string[];
  apiReceiptId?: string;
  partnerReceiptId?: string;
  verifiedAt?: string;
  expiresAt?: string;
};

export type DeviceVerificationRecord = {
  deviceId: string;
  platform: string;
  deviceFamily: string;
  status: DeviceIntegrationStatus;
  evidenceRefs: string[];
  adapterReceiptId?: string;
  testReceiptId?: string;
  verificationReceiptId?: string;
  verifiedAt?: string;
  expiresAt?: string;
};

export type PlatformCoverage = {
  platform: string;
  targetDevices: number;
  verifiedDevices: number;
  verifiedCoveragePct: number;
};

export type DeviceCoverageReport = {
  platforms: PlatformCoverage[];
  targetDevices: number;
  verifiedDevices: number;
  verifiedCoveragePct: number;
  universalSupportClaim: false;
  generatedAt: string;
};

function nonEmpty(value: string | undefined, label: string): string {
  if (!value?.trim()) throw new Error(`${label} is required`);
  return value.trim();
}

function requireEvidence(evidenceRefs: string[]): void {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) throw new Error('evidenceRefs are required');
  evidenceRefs.forEach((ref) => nonEmpty(ref, 'evidenceRef'));
}

function isNotExpired(expiresAt: string | undefined, now: Date): boolean {
  if (!expiresAt) return true;
  const parsed = Date.parse(expiresAt);
  return Number.isFinite(parsed) && parsed > now.getTime();
}

function validTimestamp(value: string | undefined, label: string): string {
  const text = nonEmpty(value, label);
  if (!Number.isFinite(Date.parse(text))) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return text;
}

export function validateVendorRecord(record: VendorVerificationRecord, now = new Date()): VendorVerificationRecord {
  nonEmpty(record.vendorId, 'vendorId');
  nonEmpty(record.vendorName, 'vendorName');
  if (record.status === 'TARGET') return record;
  requireEvidence(record.evidenceRefs);
  if (record.status === 'API_READY') nonEmpty(record.apiReceiptId, 'apiReceiptId');
  if (record.status === 'VERIFIED_PARTNER') {
    nonEmpty(record.apiReceiptId, 'apiReceiptId');
    nonEmpty(record.partnerReceiptId, 'partnerReceiptId');
    validTimestamp(record.verifiedAt, 'verifiedAt');
    if (!isNotExpired(record.expiresAt, now)) throw new Error('vendor verification receipt is expired');
  }
  return record;
}

export function validateDeviceRecord(record: DeviceVerificationRecord, now = new Date()): DeviceVerificationRecord {
  nonEmpty(record.deviceId, 'deviceId');
  nonEmpty(record.platform, 'platform');
  nonEmpty(record.deviceFamily, 'deviceFamily');
  if (record.status === 'TARGET') return record;
  requireEvidence(record.evidenceRefs);
  if (record.status === 'ADAPTER_BUILT') nonEmpty(record.adapterReceiptId, 'adapterReceiptId');
  if (record.status === 'TESTED') {
    nonEmpty(record.adapterReceiptId, 'adapterReceiptId');
    nonEmpty(record.testReceiptId, 'testReceiptId');
  }
  if (record.status === 'VERIFIED') {
    nonEmpty(record.adapterReceiptId, 'adapterReceiptId');
    nonEmpty(record.testReceiptId, 'testReceiptId');
    nonEmpty(record.verificationReceiptId, 'verificationReceiptId');
    validTimestamp(record.verifiedAt, 'verifiedAt');
    if (!isNotExpired(record.expiresAt, now)) throw new Error('device verification receipt is expired');
  }
  return record;
}

export function isVerifiedPartner(record: VendorVerificationRecord, now = new Date()): boolean {
  try {
    validateVendorRecord(record, now);
    return record.status === 'VERIFIED_PARTNER';
  } catch {
    return false;
  }
}

export function isVerifiedDevice(record: DeviceVerificationRecord, now = new Date()): boolean {
  try {
    validateDeviceRecord(record, now);
    return record.status === 'VERIFIED';
  } catch {
    return false;
  }
}

export function calculateVerifiedDeviceCoverage(
  records: DeviceVerificationRecord[],
  now = new Date(),
): DeviceCoverageReport {
  const byPlatform = new Map<string, { target: number; verified: number }>();
  for (const record of records) {
    validateDeviceRecord(record, now);
    const key = record.platform.trim().toLowerCase();
    const current = byPlatform.get(key) ?? { target: 0, verified: 0 };
    current.target += 1;
    if (isVerifiedDevice(record, now)) current.verified += 1;
    byPlatform.set(key, current);
  }
  const platforms = [...byPlatform.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([platform, counts]) => ({
      platform,
      targetDevices: counts.target,
      verifiedDevices: counts.verified,
      verifiedCoveragePct: counts.target === 0 ? 0 : Number(((counts.verified / counts.target) * 100).toFixed(2)),
    }));
  const targetDevices = platforms.reduce((sum, item) => sum + item.targetDevices, 0);
  const verifiedDevices = platforms.reduce((sum, item) => sum + item.verifiedDevices, 0);
  return {
    platforms,
    targetDevices,
    verifiedDevices,
    verifiedCoveragePct: targetDevices === 0 ? 0 : Number(((verifiedDevices / targetDevices) * 100).toFixed(2)),
    universalSupportClaim: false,
    generatedAt: now.toISOString(),
  };
}

export type ExternalReplicationDecision = {
  eligible: boolean;
  reason: string;
  vendorStatus: VendorIntegrationStatus;
  localHealth: RuntimeHealth;
};

export function decideExternalReplication(input: {
  classification: OperationsClassification;
  vendor: VendorVerificationRecord;
  localHealth: RuntimeHealth;
  now?: Date;
}): ExternalReplicationDecision {
  const now = input.now ?? new Date();
  if (input.classification === 'TOP_SECRET') {
    return { eligible: false, reason: 'TOP_SECRET is excluded from ordinary external replication', vendorStatus: input.vendor.status, localHealth: input.localHealth };
  }
  if (input.localHealth !== 'HEALTHY') {
    return { eligible: false, reason: `local runtime must be HEALTHY, received ${input.localHealth}`, vendorStatus: input.vendor.status, localHealth: input.localHealth };
  }
  if (!isVerifiedPartner(input.vendor, now)) {
    return { eligible: false, reason: 'vendor is not backed by a current VERIFIED_PARTNER receipt', vendorStatus: input.vendor.status, localHealth: input.localHealth };
  }
  return { eligible: true, reason: 'evidence-backed VERIFIED_PARTNER and healthy local runtime', vendorStatus: input.vendor.status, localHealth: input.localHealth };
}
