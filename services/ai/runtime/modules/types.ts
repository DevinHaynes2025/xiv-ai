import type { ModulePermission } from './permissions';

export type InstalledBusinessModule = {
  moduleId: string;
  organizationId: string;
  universeId: string | null;
  packageId: string;
  version: string;
  status: 'declared' | 'pending_review' | 'not_installed';
  permissions: readonly ModulePermission[];
  installedBy: string | null;
  installedAt: string | null;
  persisted: false;
};

export type ModuleManifest = {
  publisherId: string;
  packageId: string;
  version: string;
  checksum: string | null;
  signature: string | null;
  manifestVersion: string;
  permissions: readonly ModulePermission[];
  supportedRegions: readonly string[];
  supportedExperiences: readonly string[];
  signingVerification: 'planned';
};

export type CloudInstallStep =
  | 'developer_package'
  | 'signature_verification'
  | 'security_scan'
  | 'manifest_validation'
  | 'permission_review'
  | 'organization_approval'
  | 'universe_binding'
  | 'installation'
  | 'audit';

export const CLOUD_INSTALL_PATH: readonly CloudInstallStep[] = [
  'developer_package',
  'signature_verification',
  'security_scan',
  'manifest_validation',
  'permission_review',
  'organization_approval',
  'universe_binding',
  'installation',
  'audit',
];
