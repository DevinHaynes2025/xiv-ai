/**
 * Security Roots V4.
 * Connectivity is not an authority root. Audit root cannot be disabled.
 * Device cannot impersonate identity.
 */

import { SECURITY_ROOTS_V4, type SecurityRootV4 } from './types';

export type BoundRootsV4 = {
  identity: string;
  device: string;
  tenant: string;
  universe: string;
  data: string;
  purpose: string;
  classification: string;
  guardian: true;
  audit: true;
  connectivityGrantsAuthority: false;
};

export function listSecurityRootsV4(): readonly SecurityRootV4[] {
  return SECURITY_ROOTS_V4;
}

export function bindSecurityRootsV4(input: {
  identityId?: string;
  deviceId?: string;
  tenantId?: string;
  universeId?: string;
  dataId?: string;
  purpose?: string;
  classification?: string;
  deviceClaimsIdentity?: boolean;
  connectivityAlone?: boolean;
  auditDisabled?: boolean;
  approved: boolean;
}) {
  if (input.deviceClaimsIdentity === true) {
    return { allowed: false as const, reason: 'device_root_cannot_impersonate_identity_root' };
  }
  if (input.connectivityAlone === true) {
    return { allowed: false as const, reason: 'connectivity_is_not_authority' };
  }
  if (input.auditDisabled === true) {
    return { allowed: false as const, reason: 'audit_root_cannot_be_disabled' };
  }
  if (
    !input.identityId ||
    !input.deviceId ||
    !input.tenantId ||
    !input.universeId ||
    !input.dataId ||
    !input.purpose ||
    !input.classification
  ) {
    return { allowed: false as const, reason: 'security_roots_v4_incomplete' };
  }
  if (input.approved !== true) {
    return { allowed: false as const, reason: 'security_roots_v4_require_approval' };
  }
  return {
    allowed: true as const,
    roots: {
      identity: input.identityId,
      device: input.deviceId,
      tenant: input.tenantId,
      universe: input.universeId,
      data: input.dataId,
      purpose: input.purpose,
      classification: input.classification,
      guardian: true as const,
      audit: true as const,
      connectivityGrantsAuthority: false as const,
    } satisfies BoundRootsV4,
  };
}

export function connectivityIsAuthority(): false {
  return false;
}

export function auditRootCanBeDisabled(): false {
  return false;
}

export function deviceCannotImpersonateIdentity(): true {
  return true;
}

export function unknownSecurityRootIsTrusted(_root: SecurityRootV4, known?: boolean): boolean {
  return known === true;
}
