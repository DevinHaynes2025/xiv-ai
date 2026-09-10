import type { DevicePilotCapability, DevicePilotEnrollment } from './device-pilot-enrollment';

export type DevicePilotActionRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'IRREVERSIBLE';

export interface DevicePilotAction {
  actionId: string;
  tenantId: string;
  deviceId: string;
  capability: DevicePilotCapability;
  risk: DevicePilotActionRisk;
  requiresNetwork: boolean;
  containsTopSecret: boolean;
}

export interface DevicePilotDecision {
  allowed: boolean;
  requiresHumanApproval: boolean;
  reason: string;
}

export function authorizeDevicePilotAction(enrollment: DevicePilotEnrollment, action: DevicePilotAction): DevicePilotDecision {
  if (enrollment.tenantId !== action.tenantId || enrollment.deviceId !== action.deviceId) {
    return { allowed: false, requiresHumanApproval: true, reason: 'tenant or device mismatch' };
  }
  if (!enrollment.capabilities.includes(action.capability)) {
    return { allowed: false, requiresHumanApproval: true, reason: 'capability not consented' };
  }
  if (action.containsTopSecret && action.requiresNetwork) {
    return { allowed: false, requiresHumanApproval: true, reason: 'TOP_SECRET cannot leave the governed local boundary' };
  }
  const gated = action.risk === 'HIGH' || action.risk === 'IRREVERSIBLE';
  return { allowed: true, requiresHumanApproval: gated, reason: gated ? 'high-impact action requires explicit approval' : 'within enrolled capability and policy' };
}
