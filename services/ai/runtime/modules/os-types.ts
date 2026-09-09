/**
 * Phase 2I-A Business OS module contracts.
 * Manifests and policy only. No marketplace persistence, no JS execution.
 */
import type { ModulePermission } from './permissions';

export type BusinessModuleCategory =
  | 'crm'
  | 'wms'
  | 'sales'
  | 'insurance'
  | 'real_estate'
  | 'intelligence'
  | 'operations'
  | 'communications';

export type BusinessModuleCapability =
  | 'records.read'
  | 'records.draft'
  | 'workflow.recommend'
  | 'agent.consult'
  | 'live.view'
  | 'analytics.view';

export type BusinessModuleRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type BusinessModuleInstallationPolicy = 'first_party_review' | 'organization_approval' | 'blocked';

export type BusinessModuleRuntimeState =
  | 'declared'
  | 'pending_review'
  | 'authorized_config_only'
  | 'not_installed'
  | 'blocked';

export type BusinessModulePublisher = {
  publisherId: string;
  displayName: string;
  firstParty: boolean;
};

export type BusinessModuleVersion = {
  version: string;
  manifestVersion: string;
  releasedAt: string | null;
};

export type BusinessModulePermission = ModulePermission;

export type BusinessModuleEntitlement = {
  packageId: string;
  planId: string | null;
  enabled: boolean;
  source: 'declared' | 'unconfigured';
};

export type BusinessModuleAuditEvent = {
  eventId: string;
  packageId: string;
  actorUserId: string | null;
  action: 'register' | 'evaluate' | 'deny' | 'declare';
  reason: string;
  createdAt: string;
};

export type BusinessModuleSignatureMetadata = {
  status: 'unsigned_first_party_declaration' | 'planned';
  algorithm: null;
  verified: false;
};

export type BusinessModuleManifest = {
  packageId: string;
  publisherId: string;
  name: string;
  version: string;
  manifestVersion: string;
  description: string;
  category: BusinessModuleCategory;
  supportedIndustries: readonly string[];
  supportedRegions: readonly string[];
  requiredPermissions: readonly ModulePermission[];
  optionalPermissions: readonly ModulePermission[];
  requiredCapabilities: readonly BusinessModuleCapability[];
  entryExperience: string;
  agentBindings: readonly string[];
  dataScopes: readonly ('organization' | 'universe' | 'module')[];
  riskLevel: BusinessModuleRiskLevel;
  installationPolicy: BusinessModuleInstallationPolicy;
  signatureMetadata: BusinessModuleSignatureMetadata;
  checksum: string;
  createdAt: string;
};

export type BusinessModuleInstallation = {
  installationId: string;
  packageId: string;
  organizationId: string;
  universeId: string | null;
  version: string;
  state: BusinessModuleRuntimeState;
  permissions: readonly ModulePermission[];
  installedBy: string | null;
  installedAt: string | null;
  persisted: false;
  executesDownloadedJavascript: false;
};
