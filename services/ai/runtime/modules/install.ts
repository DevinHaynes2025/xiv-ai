import { consumerMayInstallTenantModule, requestModulePermissions } from './permissions';
import { CLOUD_INSTALL_PATH, type InstalledBusinessModule, type ModuleManifest } from './types';

export function declareInstalledModule(input: Omit<InstalledBusinessModule, 'persisted' | 'status'> & {
  status?: InstalledBusinessModule['status'];
}): InstalledBusinessModule | { allowed: false; reason: string } {
  const permissions = requestModulePermissions(input.permissions);
  if (!permissions.allowed) return permissions;
  return {
    ...input,
    permissions: permissions.permissions,
    status: input.status ?? 'declared',
    persisted: false,
  };
}

export function phoneReceivesExecutablePackage() {
  return false;
}

export function cloudInstallArchitecture() {
  return {
    path: CLOUD_INSTALL_PATH,
    phoneReceives: ['ui_bundle_or_config', 'authorized_api_access', 'module_metadata'] as const,
    heavyCodeLocation: 'governed_cloud_or_runtime' as const,
    marketplacePersisted: false,
  };
}

export function consumerInstallDenied() {
  return {
    allowed: consumerMayInstallTenantModule(),
    reason: 'Consumer cannot install a tenant module without authority.',
  };
}

export function signingVerificationStatus(manifest: ModuleManifest) {
  return {
    planned: true as const,
    implemented: false as const,
    signature: manifest.signature,
  };
}
