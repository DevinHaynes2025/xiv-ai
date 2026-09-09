/**
 * Capability gateway + governance stack for Continuous Intelligence OS.
 * Stack: CAPABILITY_GATEWAY → IDENTITY+DEVICE TRUST → TENANT/UNIVERSE →
 * GUARDIAN → AGENT FIREWALL → TOOL PERMISSIONS → DATA ACCESS GATEWAY →
 * HUMAN AUTHORITY → AUDIT
 */

import { GOVERNANCE_STACK, type GovernanceStackHop } from './types';

export type CapabilityGateway = {
  stack: readonly GovernanceStackHop[];
  skipGuardianAllowed: false;
  skipHumanAuthorityAllowed: false;
  skipAuditAllowed: false;
  productionLive: false;
};

export type GatewayRequest = {
  guardianApproved: boolean;
  humanAuthorized: boolean;
  tenantValidated: boolean;
  deviceTrusted: boolean;
  toolPermitted: boolean;
  dataAccessApproved: boolean;
  auditEnabled: boolean;
};

export function openCapabilityGateway(): CapabilityGateway {
  return {
    stack: GOVERNANCE_STACK,
    skipGuardianAllowed: false,
    skipHumanAuthorityAllowed: false,
    skipAuditAllowed: false,
    productionLive: false,
  };
}

export function listGovernanceStack(): readonly GovernanceStackHop[] {
  return GOVERNANCE_STACK;
}

export function routeThroughGovernanceStack(input: GatewayRequest) {
  if (!input.deviceTrusted) {
    return { allowed: false as const, reason: 'device_trust_required', hop: 'IDENTITY_DEVICE_TRUST' as const };
  }
  if (!input.tenantValidated) {
    return { allowed: false as const, reason: 'tenant_universe_required', hop: 'TENANT_UNIVERSE' as const };
  }
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'guardian_required', hop: 'GUARDIAN' as const };
  }
  if (!input.toolPermitted) {
    return { allowed: false as const, reason: 'tool_permissions_required', hop: 'TOOL_PERMISSIONS' as const };
  }
  if (!input.dataAccessApproved) {
    return { allowed: false as const, reason: 'data_access_gateway_required', hop: 'DATA_ACCESS_GATEWAY' as const };
  }
  if (!input.humanAuthorized) {
    return { allowed: false as const, reason: 'human_authority_required', hop: 'HUMAN_AUTHORITY' as const };
  }
  if (!input.auditEnabled) {
    return { allowed: false as const, reason: 'audit_required', hop: 'AUDIT' as const };
  }
  return { allowed: true as const, stack: GOVERNANCE_STACK };
}

export function gatewayBypassesGuardian(): false {
  return false;
}

export function gatewayWeakensTenantIsolation(): false {
  return false;
}
