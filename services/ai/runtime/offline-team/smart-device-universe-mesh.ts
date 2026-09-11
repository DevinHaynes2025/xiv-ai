export type DeviceKind = 'PHONE'|'TABLET'|'LAPTOP'|'DESKTOP'|'SMART_TV'|'CAR'|'WEARABLE'|'XR'|'OTHER';
export type DeviceState = 'TARGET'|'DETECTED'|'PAIRED'|'VERIFIED'|'OFFLINE'|'UNVERIFIED';

export interface DeviceNode {
  deviceId: string;
  userId: string;
  kind: DeviceKind;
  state: DeviceState;
  consentReceiptId?: string;
  localOnly: boolean;
  allowedCapabilities: string[];
  lastReceiptAt?: string;
}

export function mayOperate(node: DeviceNode): boolean {
  return node.state === 'VERIFIED' && !!node.consentReceiptId && node.allowedCapabilities.length > 0;
}

export const smartDeviceMeshPolicy = {
  autoplayLearningWithoutConsent: false,
  tvViewingCaptureRequiresExplicitConsent: true,
  deviceDoesNotContainEntireXivBrain: true,
  carriesAuthorizedLocalShardOnly: true,
  productionMutationAllowed: false,
};
