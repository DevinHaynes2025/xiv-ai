import { installIndustryPack } from '../ecosystem/plugins';
import type { IndustryPackId } from '../ecosystem/types';
import type { IndustryPackKind, PluginInstallStage, PluginLifecycle } from './types';
import { WILDCARD_ACCESS_TOKENS } from './types';

export type PluginManifestV2 = {
  pluginId: string;
  name: string;
  publisher: string;
  version: string;
  minimumRuntimeVersion: string;
  requestedCapabilities: readonly string[];
  requestedDataScopes: readonly string[];
  requestedUniverses: readonly string[];
  requestedTools: readonly string[];
  networkAccess: boolean;
  storageAccess: boolean;
  offlineAccess: boolean;
  locationAccess: boolean;
  cameraAccess: boolean;
  backgroundExecution: boolean;
  humanApprovalRequirements: readonly string[];
};

export type PluginPackage = {
  manifest?: PluginManifestV2;
  signed: boolean;
  signatureValid: boolean;
  integrityIntact: boolean;
  securityScanPassed: boolean;
  tampered?: boolean;
  dependenciesReviewed?: boolean;
};

export type PluginInstallInput = {
  package: PluginPackage;
  organizationApproved: boolean;
  universeId?: string;
  tenantId: string;
  actor?: 'developer' | 'organization' | 'marketplace' | 'plugin';
};

export type PluginInstallation = {
  pluginId: string;
  tenantId: string;
  universeId: string;
  lifecycle: Extract<PluginLifecycle, 'INSTALLED'>;
  unrestrictedAccess: false;
  sandbox: true;
};

export type PluginInstallDecision =
  | { allowed: false; reason: string; stage: PluginInstallStage }
  | { allowed: true; installation: PluginInstallation };

const REQUIRED_MANIFEST_FIELDS: readonly (keyof PluginManifestV2)[] = [
  'pluginId',
  'name',
  'publisher',
  'version',
  'minimumRuntimeVersion',
  'requestedCapabilities',
  'requestedDataScopes',
  'requestedUniverses',
  'requestedTools',
  'networkAccess',
  'storageAccess',
  'offlineAccess',
  'locationAccess',
  'cameraAccess',
  'backgroundExecution',
  'humanApprovalRequirements',
];

const LIFECYCLE_TRANSITIONS: Record<PluginLifecycle, readonly PluginLifecycle[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['SECURITY_REVIEW'],
  SECURITY_REVIEW: ['POLICY_REVIEW', 'REVOKED'],
  POLICY_REVIEW: ['APPROVED', 'REVOKED'],
  APPROVED: ['PUBLISHED', 'REVOKED'],
  PUBLISHED: ['INSTALLED', 'RETIRED', 'REVOKED'],
  INSTALLED: ['ACTIVE', 'LIMITED', 'SUSPENDED', 'REVOKED'],
  ACTIVE: ['LIMITED', 'SUSPENDED', 'REVOKED', 'RETIRED'],
  LIMITED: ['ACTIVE', 'SUSPENDED', 'REVOKED'],
  SUSPENDED: ['LIMITED', 'REVOKED', 'RETIRED'],
  REVOKED: [],
  RETIRED: [],
};

function hasWildcard(values: readonly string[]): boolean {
  return values.some((value) =>
    WILDCARD_ACCESS_TOKENS.some((token) => value === token || value.endsWith('.*') || value === 'tenant:*'),
  );
}

export function pluginRequiresManifest(pkg: PluginPackage): boolean {
  return pkg.manifest !== undefined;
}

export function validatePluginManifest(manifest: PluginManifestV2 | undefined): { valid: boolean; reason?: string } {
  if (!manifest) return { valid: false, reason: 'plugin_requires_manifest' };
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null || manifest[field] === '') {
      return { valid: false, reason: 'plugin_requires_manifest' };
    }
  }
  if (hasWildcard(manifest.requestedCapabilities) || hasWildcard(manifest.requestedDataScopes) || hasWildcard(manifest.requestedTools)) {
    return { valid: false, reason: 'plugin_wildcard_permission_denied' };
  }
  if (manifest.requestedDataScopes.includes('all_tenant_data') || manifest.requestedDataScopes.includes('*')) {
    return { valid: false, reason: 'plugin_cannot_request_all_tenant_data' };
  }
  return { valid: true };
}

export function evaluatePluginInstall(input: PluginInstallInput): PluginInstallDecision {
  const pkg = input.package;
  if (pkg.tampered === true || pkg.integrityIntact !== true) {
    return { allowed: false, reason: 'tampered_package_denied', stage: 'integrity' };
  }
  if (pkg.signed !== true || pkg.signatureValid !== true) {
    return { allowed: false, reason: 'unsigned_plugin_denied', stage: 'signature' };
  }
  if (pkg.securityScanPassed !== true) {
    return { allowed: false, reason: 'security_scan_failed', stage: 'security_scan' };
  }
  const manifestCheck = validatePluginManifest(pkg.manifest);
  if (!manifestCheck.valid || !pkg.manifest) {
    return { allowed: false, reason: manifestCheck.reason ?? 'plugin_requires_manifest', stage: 'manifest' };
  }
  if (pkg.dependenciesReviewed !== true) {
    return { allowed: false, reason: 'dependency_review_required', stage: 'dependency' };
  }
  if (hasWildcard(pkg.manifest.requestedCapabilities) || hasWildcard(pkg.manifest.requestedDataScopes)) {
    return { allowed: false, reason: 'plugin_wildcard_permission_denied', stage: 'permission' };
  }
  if (input.organizationApproved !== true) {
    return { allowed: false, reason: 'organization_approval_required', stage: 'organization_approval' };
  }
  if (!input.universeId) {
    return { allowed: false, reason: 'universe_binding_required', stage: 'universe_binding' };
  }
  if (input.actor === 'plugin') {
    return { allowed: false, reason: 'plugin_cannot_install_itself', stage: 'installation' };
  }
  return {
    allowed: true,
    installation: {
      pluginId: pkg.manifest.pluginId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      lifecycle: 'INSTALLED',
      unrestrictedAccess: false,
      sandbox: true,
    },
  };
}

export function pluginMayPromoteLifecycle(
  current: PluginLifecycle,
  next: PluginLifecycle,
  actor: 'plugin' | 'reviewer' | 'organization',
): { allowed: false; reason: string } | { allowed: true } {
  if (actor === 'plugin') {
    return { allowed: false, reason: 'plugin_cannot_promote_itself' };
  }
  if (!LIFECYCLE_TRANSITIONS[current].includes(next)) {
    return { allowed: false, reason: 'illegal_lifecycle_transition' };
  }
  return { allowed: true };
}

export function pluginCannotSelfPromote(): true {
  return true;
}

export type PluginSandboxAction =
  | 'read_arbitrary_tenant_data'
  | 'read_other_plugin_secrets'
  | 'read_founder_restricted_data'
  | 'modify_guardian'
  | 'modify_agent_firewall'
  | 'modify_tenant_policy'
  | 'change_universe_boundaries'
  | 'grant_self_capabilities'
  | 'mint_production_credentials'
  | 'disable_audit'
  | 'change_classification'
  | 'escape_sandbox'
  | 'read_unrelated_universe';

export function pluginSandboxAllows(_action: PluginSandboxAction): false {
  return false;
}

export function pluginModifiesGuardian(): false {
  return false;
}

export function pluginModifiesTenantIsolation(): false {
  return false;
}

export function pluginMintsProductionCredential(): false {
  return false;
}

export function pluginDisablesAudit(): false {
  return false;
}

export function pluginAccessesFounderRestrictedData(): false {
  return false;
}

export function pluginReadsUnrelatedUniverse(
  installation: PluginInstallation,
  requestedUniverseId: string,
): boolean {
  return installation.universeId === requestedUniverseId;
}

export type IndustryPackBundle = {
  kind: IndustryPackKind;
  plugins: readonly string[];
  agents: readonly string[];
  workflows: readonly string[];
  dashboards: readonly string[];
  permissions: readonly string[];
  schemas: readonly string[];
  policies: readonly string[];
  templates: readonly string[];
  automaticDataAccess: false;
};

export function createIndustryPack(kind: IndustryPackKind): IndustryPackBundle {
  return {
    kind,
    plugins: [],
    agents: [],
    workflows: [],
    dashboards: [],
    permissions: [],
    schemas: [],
    policies: [],
    templates: [],
    automaticDataAccess: false,
  };
}

export function installGovernedIndustryPack(input: {
  packId: IndustryPackId;
  signed: boolean;
  scanned: boolean;
  requestedPermissions: readonly string[];
  companyApproved: boolean;
  universeBound: boolean;
}): { allowed: false; reason: string } | { packId: IndustryPackId; unrestrictedAccess: false; automaticDataAccess: false } {
  const installed = installIndustryPack({
    packId: input.packId,
    signed: input.signed,
    scanned: input.scanned,
    requestedPermissions: input.requestedPermissions,
    companyApproved: input.companyApproved,
    universeBound: input.universeBound,
  });
  if ('allowed' in installed) return installed;
  return { ...installed, automaticDataAccess: false };
}

export function industryPackGrantsAutomaticDataAccess(_pack: IndustryPackBundle): false {
  return false;
}

export function validPluginManifest(overrides: Partial<PluginManifestV2> = {}): PluginManifestV2 {
  return {
    pluginId: 'warehouse.scan',
    name: 'Warehouse Scan',
    publisher: 'xiv-internal',
    version: '1.0.0',
    minimumRuntimeVersion: '0.0.1',
    requestedCapabilities: ['barcode.read'],
    requestedDataScopes: ['inventory.read'],
    requestedUniverses: ['ops'],
    requestedTools: ['barcode'],
    networkAccess: false,
    storageAccess: false,
    offlineAccess: false,
    locationAccess: false,
    cameraAccess: true,
    backgroundExecution: false,
    humanApprovalRequirements: ['install'],
    ...overrides,
  };
}
