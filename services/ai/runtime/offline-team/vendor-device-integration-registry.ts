export type IntegrationState = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type DeviceSupportState = 'TARGET' | 'ADAPTER_BUILT' | 'TESTED' | 'VERIFIED';

export interface VendorIntegration {
  vendorId: string;
  name: string;
  category: 'CLOUD' | 'CRM' | 'SOCIAL' | 'CHIP' | 'DEVICE' | 'CARRIER' | 'AI' | 'DATABASE' | 'COMMERCE';
  state: IntegrationState;
  evidenceRefs: string[];
}

export interface DeviceTarget {
  deviceId: string;
  family: 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'WEB' | 'ARM' | 'XR';
  architecture?: string;
  state: DeviceSupportState;
  receiptRef?: string;
}

export class VendorDeviceIntegrationRegistry {
  private vendors = new Map<string, VendorIntegration>();
  private devices = new Map<string, DeviceTarget>();

  registerVendor(vendor: VendorIntegration) {
    if (vendor.state === 'VERIFIED_PARTNER' && !vendor.evidenceRefs.length) throw new Error('verified partnership requires evidence');
    this.vendors.set(vendor.vendorId, vendor);
  }

  registerDevice(device: DeviceTarget) {
    if (device.state === 'VERIFIED' && !device.receiptRef) throw new Error('verified device support requires receipt');
    this.devices.set(device.deviceId, device);
  }

  getVendor(vendorId: string) { return this.vendors.get(vendorId); }
  getDevice(deviceId: string) { return this.devices.get(deviceId); }
}

export const INTEGRATION_GUARDRAILS = {
  namedVendorDoesNotImplyPartnership: true,
  universalDeviceSupportClaimAllowedWithoutReceipts: false,
  verifiedPartnerRequiresEvidence: true,
  verifiedDeviceRequiresReceipt: true,
};
