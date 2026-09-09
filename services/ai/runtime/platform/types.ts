export type RuntimeEnvironmentType =
  | 'MOBILE'
  | 'TABLET'
  | 'WEB'
  | 'DESKTOP'
  | 'SMART_DISPLAY'
  | 'EDGE'
  | 'XR_FUTURE'
  | 'VEHICLE_FUTURE'
  | 'INDUSTRIAL_FUTURE';

export type RuntimeHealthState =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'LIMITED'
  | 'UNAVAILABLE'
  | 'QUARANTINED'
  | 'UNKNOWN';

export type PluginLifecycle =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SECURITY_REVIEW'
  | 'POLICY_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'INSTALLED'
  | 'ACTIVE'
  | 'LIMITED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'RETIRED';

export type MarketplaceCategory =
  | 'WAREHOUSE'
  | 'LOGISTICS'
  | 'PROCUREMENT'
  | 'SUPPLIER'
  | 'MANUFACTURING'
  | 'RETAIL'
  | 'ECOMMERCE'
  | 'INSURANCE'
  | 'REAL_ESTATE'
  | 'LEGAL_OPERATIONS'
  | 'FINANCE_OPERATIONS'
  | 'SALES'
  | 'CRM'
  | 'MARKETING'
  | 'CUSTOMER_EXPERIENCE'
  | 'HR'
  | 'LEARNING'
  | 'SECURITY'
  | 'ANALYTICS'
  | 'RESEARCH'
  | 'DOCUMENTS'
  | 'COMMUNICATION'
  | 'FIELD_OPERATIONS'
  | 'CONSTRUCTION'
  | 'HEALTHCARE_OPERATIONS'
  | 'GOVERNMENT_OPERATIONS'
  | 'DEVELOPER_TOOLS';

export type IndustryPackKind =
  | 'WarehousePack'
  | 'LogisticsPack'
  | 'InsurancePack'
  | 'RealEstatePack'
  | 'RetailPack'
  | 'ManufacturingPack'
  | 'ConstructionPack'
  | 'LegalOperationsPack'
  | 'FinanceOperationsPack'
  | 'StartupPack'
  | 'SupplierPack';

export type HardwareCapabilityId =
  | 'CAMERA'
  | 'GPS'
  | 'NFC'
  | 'BLUETOOTH'
  | 'BIOMETRIC'
  | 'SECURE_ELEMENT'
  | 'TRUSTED_EXECUTION'
  | 'GPU'
  | 'NPU'
  | 'BARCODE'
  | 'MICROPHONE'
  | 'SPEAKER'
  | 'DISPLAY'
  | 'STORAGE'
  | 'NETWORK'
  | 'SATELLITE_CONNECTIVITY_FUTURE';

export type ReferenceDeviceProfile =
  | 'XIV_MOBILE_REFERENCE'
  | 'XIV_TABLET_REFERENCE'
  | 'XIV_DESKTOP_REFERENCE'
  | 'XIV_WAREHOUSE_REFERENCE'
  | 'XIV_EXECUTIVE_REFERENCE'
  | 'XIV_DISPLAY_REFERENCE';

export type ExtensionApiName =
  | 'IdentityAPI'
  | 'UniverseAPI'
  | 'OrganizationAPI'
  | 'AgentAPI'
  | 'DataAPI'
  | 'SearchAPI'
  | 'DocumentAPI'
  | 'WorkflowAPI'
  | 'ApprovalAPI'
  | 'NotificationAPI'
  | 'LocationAPI'
  | 'DeviceAPI'
  | 'AuditAPI'
  | 'StorageAPI';

export type DataClassification = 'PUBLIC' | 'TENANT_PRIVATE' | 'FOUNDER_RESTRICTED';

export type RuntimeRequestStep =
  | 'DEVICE'
  | 'IDENTITY'
  | 'SESSION'
  | 'TENANT'
  | 'UNIVERSE'
  | 'CLASSIFICATION'
  | 'CAPABILITY'
  | 'AGENT_OR_EXTENSION'
  | 'PURPOSE'
  | 'AUTHORITY'
  | 'APPROVAL'
  | 'ACTION'
  | 'AUDIT';

export type PluginInstallStage =
  | 'signature'
  | 'integrity'
  | 'security_scan'
  | 'manifest'
  | 'dependency'
  | 'permission'
  | 'organization_approval'
  | 'universe_binding'
  | 'installation'
  | 'sandbox'
  | 'audit';

export type DesktopFoundationSurface =
  | 'DeveloperConsole'
  | 'PluginManager'
  | 'Marketplace'
  | 'RuntimeHealth'
  | 'DeviceManager'
  | 'EnterpriseCatalog'
  | 'SDKDocs'
  | 'IndustryPacks';

export type DeveloperDocContract =
  | 'GettingStarted'
  | 'SDKReference'
  | 'PluginGuide'
  | 'SecurityGuide'
  | 'PermissionGuide'
  | 'MarketplaceGuide'
  | 'IndustryPackGuide'
  | 'DeviceGuide'
  | 'OfflineGuide'
  | 'AuditGuide';

export type EnterprisePolicyPackKind =
  | 'EnterprisePolicyPack'
  | 'SecurityPolicyPack'
  | 'DataPolicyPack'
  | 'DevicePolicyPack'
  | 'AgentPolicyPack'
  | 'PluginPolicyPack'
  | 'IndustryPolicyPack';

export const WILDCARD_ACCESS_TOKENS = ['*', 'all', 'unrestricted', 'all_tenant_data', 'ANY'] as const;

export const MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
  'WAREHOUSE',
  'LOGISTICS',
  'PROCUREMENT',
  'SUPPLIER',
  'MANUFACTURING',
  'RETAIL',
  'ECOMMERCE',
  'INSURANCE',
  'REAL_ESTATE',
  'LEGAL_OPERATIONS',
  'FINANCE_OPERATIONS',
  'SALES',
  'CRM',
  'MARKETING',
  'CUSTOMER_EXPERIENCE',
  'HR',
  'LEARNING',
  'SECURITY',
  'ANALYTICS',
  'RESEARCH',
  'DOCUMENTS',
  'COMMUNICATION',
  'FIELD_OPERATIONS',
  'CONSTRUCTION',
  'HEALTHCARE_OPERATIONS',
  'GOVERNMENT_OPERATIONS',
  'DEVELOPER_TOOLS',
];

export const RUNTIME_ENVIRONMENTS: readonly RuntimeEnvironmentType[] = [
  'MOBILE',
  'TABLET',
  'WEB',
  'DESKTOP',
  'SMART_DISPLAY',
  'EDGE',
  'XR_FUTURE',
  'VEHICLE_FUTURE',
  'INDUSTRIAL_FUTURE',
];

export const PLUGIN_LIFECYCLE_STATES: readonly PluginLifecycle[] = [
  'DRAFT',
  'SUBMITTED',
  'SECURITY_REVIEW',
  'POLICY_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'INSTALLED',
  'ACTIVE',
  'LIMITED',
  'SUSPENDED',
  'REVOKED',
  'RETIRED',
];

export const REFERENCE_DEVICE_PROFILES: readonly ReferenceDeviceProfile[] = [
  'XIV_MOBILE_REFERENCE',
  'XIV_TABLET_REFERENCE',
  'XIV_DESKTOP_REFERENCE',
  'XIV_WAREHOUSE_REFERENCE',
  'XIV_EXECUTIVE_REFERENCE',
  'XIV_DISPLAY_REFERENCE',
];

export const HARDWARE_CAPABILITIES: readonly HardwareCapabilityId[] = [
  'CAMERA',
  'GPS',
  'NFC',
  'BLUETOOTH',
  'BIOMETRIC',
  'SECURE_ELEMENT',
  'TRUSTED_EXECUTION',
  'GPU',
  'NPU',
  'BARCODE',
  'MICROPHONE',
  'SPEAKER',
  'DISPLAY',
  'STORAGE',
  'NETWORK',
  'SATELLITE_CONNECTIVITY_FUTURE',
];

export const EXTENSION_APIS: readonly ExtensionApiName[] = [
  'IdentityAPI',
  'UniverseAPI',
  'OrganizationAPI',
  'AgentAPI',
  'DataAPI',
  'SearchAPI',
  'DocumentAPI',
  'WorkflowAPI',
  'ApprovalAPI',
  'NotificationAPI',
  'LocationAPI',
  'DeviceAPI',
  'AuditAPI',
  'StorageAPI',
];

export const DESKTOP_FOUNDATION_SURFACES: readonly DesktopFoundationSurface[] = [
  'DeveloperConsole',
  'PluginManager',
  'Marketplace',
  'RuntimeHealth',
  'DeviceManager',
  'EnterpriseCatalog',
  'SDKDocs',
  'IndustryPacks',
];

export const DEVELOPER_DOC_CONTRACTS: readonly DeveloperDocContract[] = [
  'GettingStarted',
  'SDKReference',
  'PluginGuide',
  'SecurityGuide',
  'PermissionGuide',
  'MarketplaceGuide',
  'IndustryPackGuide',
  'DeviceGuide',
  'OfflineGuide',
  'AuditGuide',
];
