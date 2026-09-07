/**
 * Module policy: default deny, no wildcards, no cross-tenant scope,
 * no unrestricted DB/shell/deploy/cloud/billing/tenant/security authority.
 */
import { MODULE_PERMISSIONS, isModulePermission, type ModulePermission } from './permissions';

export const FORBIDDEN_MODULE_PERMISSIONS = [
  'unrestricted.database',
  'shell.execute',
  'deploy.production',
  'cloud.admin',
  'billing.authority',
  'tenant.administration',
  'security.policy.modify',
  'cross_tenant.access',
] as const;

export type ForbiddenModulePermission = (typeof FORBIDDEN_MODULE_PERMISSIONS)[number];

export type ModulePolicyInput = {
  actorOrganizationId?: string | null;
  requestedOrganizationId?: string | null;
  actorUniverseIds?: readonly string[];
  requestedUniverseId?: string | null;
  requestedPermissions: readonly string[];
  thirdParty?: boolean;
};

export type ModulePolicyDecision = {
  allowed: boolean;
  reason: string;
  permissions: readonly ModulePermission[];
};

function deny(reason: string): ModulePolicyDecision {
  return { allowed: false, reason, permissions: [] };
}

export function isForbiddenModulePermission(value: string): value is ForbiddenModulePermission {
  return (FORBIDDEN_MODULE_PERMISSIONS as readonly string[]).includes(value);
}

export function evaluateModulePolicy(input: ModulePolicyInput): ModulePolicyDecision {
  if (input.requestedPermissions.some((item) => item.includes('*') || item === '*')) {
    return deny('Wildcard module permission is rejected. Default deny.');
  }
  const forbidden = input.requestedPermissions.filter(isForbiddenModulePermission);
  if (forbidden.length > 0) {
    return deny(`Forbidden module authority denied: ${forbidden.join(', ')}`);
  }
  const unknown = input.requestedPermissions.filter((item) => !isModulePermission(item));
  if (unknown.length > 0) {
    return deny(`Unknown module permissions denied: ${unknown.join(', ')}`);
  }
  const actorOrg = input.actorOrganizationId?.trim() ?? '';
  const requestedOrg = input.requestedOrganizationId?.trim() ?? '';
  if (!actorOrg || !requestedOrg) {
    return deny('Module scope requires an authorized organization. Default deny.');
  }
  if (actorOrg !== requestedOrg) {
    return deny('Cross-tenant module scope cannot be requested.');
  }
  if (input.requestedUniverseId) {
    const allowedUniverses = input.actorUniverseIds ?? [];
    if (!allowedUniverses.includes(input.requestedUniverseId)) {
      return deny('Cross-tenant or unbound Universe module scope cannot be requested.');
    }
  }
  if (input.thirdParty) {
    const elevated = input.requestedPermissions.filter((item) =>
      item.endsWith('.write') || item === 'agent.request' || item === 'live.schedule',
    );
    if (elevated.length > 0) {
      return deny('Third-party modules cannot receive write, agent, or live-host authority in 2I-A.');
    }
  }
  return {
    allowed: true,
    reason: 'Explicit allow-listed permissions within the actor tenant.',
    permissions: input.requestedPermissions as readonly ModulePermission[],
  };
}

export function moduleExecutesDownloadedJavascript() {
  return false;
}

export function allowedModulePermissionCatalog() {
  return MODULE_PERMISSIONS;
}
