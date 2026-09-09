/**
 * Location permission evaluation — purpose-bound, precision-capped.
 */

import {
  LOCATION_PERMISSION_PATH,
  LOCATION_PERMISSION_STATES,
  LOCATION_PURPOSES,
  PRECISION_RANK,
  type LocationPermissionHop,
  type LocationPermissionState,
  type LocationPolicy,
  type LocationPrecision,
  type LocationPurpose,
  type LocationRetention,
  type LocationScope,
} from './types';

export type LocationAccessRequest = {
  scope: LocationScope;
  purpose: LocationPurpose;
  requestedPrecision: LocationPrecision;
  requestedState: LocationPermissionState;
  policy: LocationPolicy;
  retention: LocationRetention;
  backgroundPolicyApproved?: boolean;
};

export function listLocationPermissionStates(): readonly LocationPermissionState[] {
  return LOCATION_PERMISSION_STATES;
}

export function listLocationPurposes(): readonly LocationPurpose[] {
  return LOCATION_PURPOSES;
}

export function listLocationPermissionPath(): readonly LocationPermissionHop[] {
  return LOCATION_PERMISSION_PATH;
}

export function openDefaultLocationPolicy(): LocationPolicy {
  return {
    covertTracking: false,
    gpsAutoAvailableToEveryAgent: false,
    backgroundRequiresPolicy: true,
    precisionCeiling: 'APPROXIMATE',
    allowedPurposes: LOCATION_PURPOSES,
  };
}

export function gpsAutoAvailableToEveryAgent(): false {
  return false;
}

export function covertTrackingAllowed(): false {
  return false;
}

export function evaluateLocationAccess(input: LocationAccessRequest) {
  const { scope, purpose, requestedPrecision, requestedState, policy, retention } = input;

  if (!scope.osGranted) {
    return { allowed: false as const, reason: 'os_permission_required' };
  }
  if (!scope.xivGranted) {
    return { allowed: false as const, reason: 'xiv_permission_required' };
  }
  if (!scope.userApproved || !scope.orgApproved) {
    return { allowed: false as const, reason: 'user_org_permission_required' };
  }
  if (!policy.allowedPurposes.includes(purpose)) {
    return { allowed: false as const, reason: 'purpose_not_allowed' };
  }
  if (requestedState === 'LOCATION_DISABLED') {
    return { allowed: false as const, reason: 'location_disabled' };
  }
  if (PRECISION_RANK[requestedPrecision] > PRECISION_RANK[policy.precisionCeiling]) {
    return { allowed: false as const, reason: 'precision_exceeds_permission' };
  }
  if (requestedState === 'BACKGROUND_AUTHORIZED') {
    if (policy.backgroundRequiresPolicy && input.backgroundPolicyApproved !== true) {
      return { allowed: false as const, reason: 'background_gps_denied_without_policy' };
    }
  }
  if (retention.indefinite) {
    return { allowed: false as const, reason: 'indefinite_retention_forbidden' };
  }
  if (policy.covertTracking) {
    return { allowed: false as const, reason: 'covert_tracking_forbidden' };
  }
  if (policy.gpsAutoAvailableToEveryAgent) {
    return { allowed: false as const, reason: 'gps_not_auto_available_to_every_agent' };
  }

  return {
    allowed: true as const,
    purpose,
    precision: requestedPrecision,
    state: requestedState,
    path: LOCATION_PERMISSION_PATH,
    auditRequired: true as const,
  };
}

export function locationAgentMayExceedPrecision(input: {
  requested: LocationPrecision;
  permitted: LocationPrecision;
}): boolean {
  return PRECISION_RANK[input.requested] > PRECISION_RANK[input.permitted];
}
