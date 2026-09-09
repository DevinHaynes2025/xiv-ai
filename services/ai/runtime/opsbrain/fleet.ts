export type FleetDeviceState = 'TRUSTED' | 'NEEDS_UPDATE' | 'AT_RISK' | 'REVOKED' | 'UNKNOWN';

export type FleetDevice = {
  deviceId: string;
  orgId: string;
  state: FleetDeviceState;
  personalSurveillance: false;
};

export type FleetSnapshot = {
  orgId: string;
  managed: number;
  trusted: number;
  needUpdates: number;
  atRisk: number;
  revoked: number;
  personalDeviceSurveillance: false;
};

export function snapshotDeviceFleet(devices: readonly FleetDevice[], orgId: string): FleetSnapshot {
  const scoped = devices.filter((device) => device.orgId === orgId);
  return {
    orgId,
    managed: scoped.length,
    trusted: scoped.filter((device) => device.state === 'TRUSTED').length,
    needUpdates: scoped.filter((device) => device.state === 'NEEDS_UPDATE').length,
    atRisk: scoped.filter((device) => device.state === 'AT_RISK').length,
    revoked: scoped.filter((device) => device.state === 'REVOKED').length,
    personalDeviceSurveillance: false,
  };
}

export function fleetEnablesPersonalSurveillance(): false {
  return false;
}

export function ipAddressIsPublicProfileData(): false {
  return false;
}
