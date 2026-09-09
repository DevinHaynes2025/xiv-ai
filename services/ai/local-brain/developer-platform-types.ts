export const DEVELOPER_PLATFORM_CYCLE = [
  'verified_candidate',
  'package_manifest',
  'integrity_check',
  'permission_diff',
  'compatibility_resolution',
  'local_install_plan',
  'human_gate',
  'sandboxed_install',
  'health_test',
  'registry_activation',
  'usage_evidence',
  'update_rollback_quarantine',
] as const;

export type DeveloperPlatformHop = (typeof DEVELOPER_PLATFORM_CYCLE)[number];

export type PlatformEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED';

export type PackageKind =
  | 'app'
  | 'skill'
  | 'knowledge_pack'
  | 'model_adapter'
  | 'connector'
  | 'plugin_candidate';

export type PackagePermission =
  | 'local_sandbox_read'
  | 'local_sandbox_write'
  | 'restricted_data'
  | 'external_networking'
  | 'shell_access'
  | 'production_capabilities'
  | 'permission_expansion'
  | 'guardian_rls_weaken';

export const BASELINE_PERMISSIONS: readonly PackagePermission[] = [
  'local_sandbox_read',
  'local_sandbox_write',
];

export const AUTHORITY_PERMISSIONS: readonly PackagePermission[] = [
  'restricted_data',
  'external_networking',
  'shell_access',
  'production_capabilities',
  'permission_expansion',
  'guardian_rls_weaken',
];

export type PackageClassification =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'sealed_founder_priority';

export type PackageOsClass = 'linux' | 'windows' | 'macos' | 'android' | 'ios';
export type PackageHardwareClass = 'cpu' | 'nvidia_gpu' | 'amd_gpu' | 'apple_gpu' | 'samsung_arm';

export type PackageLifecycle =
  | 'verified_candidate'
  | 'manifested'
  | 'integrity_failed'
  | 'human_gate'
  | 'planned'
  | 'installed_sandbox'
  | 'health_failed'
  | 'activated_local'
  | 'rolled_back'
  | 'quarantined';

export const PLATFORM_HONESTY = Object.freeze({
  l4AutonomyEnabled: false as const,
  productionAuthorization: false as const,
  installationGrantsAuthority: false as const,
  verifiedCandidateEqualsDeployed: false as const,
  verifiedCandidateEqualsPublished: false as const,
  verifiedCandidateEqualsCustomerAuthorized: false as const,
  founderImpersonation: false as const,
  physicalDeviceControl: false as const,
  physicalSatelliteControl: false as const,
  tipLand: false as const,
  inventedPass: false as const,
  ceoSealedReplicating: false as const,
  permissionExpansion: false as const,
  guardianRlsWeakened: false as const,
});

export type PackageManifest = {
  id: string;
  tenantId: string;
  universeId: string;
  name: string;
  version: string;
  kind: PackageKind;
  payload: string;
  digest: string;
  dependencies: Array<{ name: string; version: string }>;
  requestedPermissions: PackagePermission[];
  classification: PackageClassification;
  os: PackageOsClass[];
  hardware: PackageHardwareClass[];
  files: Record<string, string>;
  verifiedCandidate: true;
  deployed: false;
  published: false;
  customerAuthorized: false;
  productionAuthorization: false;
  createdAt: string;
};

export type RegistryRecord = {
  manifest: PackageManifest;
  lifecycle: PackageLifecycle;
  grantedPermissions: PackagePermission[];
  authorityGranted: false;
  installedAsAuthorized: false;
  activatedLocal: boolean;
  quarantined: boolean;
  integrity: PlatformEvidenceState;
  lastReason: string;
  installedVersion?: string;
  previousVersion?: string;
};
