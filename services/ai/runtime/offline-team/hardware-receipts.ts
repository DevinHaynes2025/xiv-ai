export type HardwareVendor = 'AMD' | 'ARM' | 'QUALCOMM' | 'NVIDIA' | 'APPLE' | 'INTEL' | 'SAMSUNG' | 'GENERIC';
export type AcceleratorType = 'CPU' | 'GPU' | 'NPU';
export type HardwareStatus = 'UNVERIFIED' | 'DETECTED' | 'WAITING_DRIVER' | 'VERIFIED';

export interface HardwareReceipt {
  vendor: HardwareVendor;
  accelerator: AcceleratorType;
  deviceName: string;
  driver?: string;
  runtime?: string;
  status: HardwareStatus;
  evidenceRefs: readonly string[];
  measuredAt: string;
}

export const HARDWARE_RECEIPT_GUARDRAILS = {
  verifiedRequiresEvidence: true,
  allowSyntheticVerification: false,
  allowLiveDeviceControl: false,
  allowProductionAutoTune: false,
} as const;

export function validateHardwareReceipt(receipt: HardwareReceipt): HardwareReceipt {
  if (!receipt.deviceName.trim()) throw new Error('deviceName required');
  if (receipt.status === 'VERIFIED' && receipt.evidenceRefs.length === 0) {
    throw new Error('VERIFIED hardware requires evidence receipts');
  }
  return Object.freeze({ ...receipt, evidenceRefs: Object.freeze([...receipt.evidenceRefs]) });
}

export function summarizeHardware(receipts: readonly HardwareReceipt[]) {
  const valid = receipts.map(validateHardwareReceipt);
  return Object.freeze({
    total: valid.length,
    verified: valid.filter((r) => r.status === 'VERIFIED').length,
    detected: valid.filter((r) => r.status === 'DETECTED').length,
    waitingDriver: valid.filter((r) => r.status === 'WAITING_DRIVER').length,
    vendors: Object.freeze([...new Set(valid.map((r) => r.vendor))]),
  });
}
