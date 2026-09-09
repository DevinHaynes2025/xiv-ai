import type { DeviceCapability, DeviceCapabilityGrantState } from "./types";
import type { XivDevice } from "./types";

export type CapabilityRequest = {
  device: XivDevice;
  capability: DeviceCapability;
  agentId: string;
  agentGranted: boolean;
  purpose: string;
};

export type CapabilityDecision = {
  grant: DeviceCapabilityGrantState;
  reason: string;
  audited: boolean;
};

export function deviceHasCapability(device: XivDevice, capability: DeviceCapability): boolean {
  return device.capabilities.includes(capability);
}

export function evaluateCapability(request: CapabilityRequest): CapabilityDecision {
  if (!deviceHasCapability(request.device, request.capability)) {
    return { grant: "DEVICE_LACKS", reason: "device_does_not_advertise_capability", audited: true };
  }
  if (!request.agentGranted) {
    return {
      grant: "AGENT_DENIED",
      reason: "device_capability_does_not_grant_agent_permission",
      audited: true,
    };
  }
  if (!request.purpose.trim()) {
    return { grant: "POLICY_DENIED", reason: "purpose_required", audited: true };
  }
  return { grant: "GRANTED", reason: "device_and_agent_and_purpose_aligned", audited: true };
}

export function capabilityAvailabilityForSurface(surface: "phone" | "tablet" | "desktop" | "web"): {
  location: DeviceCapabilityGrantState;
  camera: DeviceCapabilityGrantState;
  nativePackaging: DeviceCapabilityGrantState;
} {
  return {
    location: "UNKNOWN",
    camera: "UNKNOWN",
    nativePackaging: surface === "desktop" || surface === "web" ? "NOT_CONFIGURED" : "UNKNOWN",
  };
}
