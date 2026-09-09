export const MODULE_PERMISSIONS = [
  'crm.read',
  'crm.write',
  'inventory.read',
  'inventory.write',
  'documents.read',
  'documents.write',
  'contacts.read',
  'business_health.read',
  'agent.request',
  'live.schedule',
  'analytics.read',
] as const;

export type ModulePermission = (typeof MODULE_PERMISSIONS)[number];

export function isModulePermission(value: string): value is ModulePermission {
  return (MODULE_PERMISSIONS as readonly string[]).includes(value);
}

export function requestModulePermissions(requested: readonly string[]) {
  if (requested.includes('*')) {
    return { allowed: false as const, reason: 'Wildcard module permission is rejected. Default deny.' };
  }
  const unknown = requested.filter((item) => !isModulePermission(item));
  if (unknown.length > 0) {
    return { allowed: false as const, reason: `Unknown module permissions denied: ${unknown.join(', ')}` };
  }
  return { allowed: true as const, permissions: requested as readonly ModulePermission[] };
}

export function modulePermissionDefault() {
  return { allow: false as const, wildcard: false as const };
}

export function consumerMayInstallTenantModule() {
  return false;
}
