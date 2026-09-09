/**
 * Phase 2I-AB Global Connector Fabric barrel.
 * Federated authorized connectors + cloud/device/compute/plugin/personalization contracts.
 * NOT one gigantic world database. Unverified = NOT_CONFIGURED. L4 disabled.
 * NVIDIA ≠ authorization. Cisco never bypasses network controls. XIV ≠ host OS replacement.
 */

export type {
  AuthenticationMode,
  CloudAuthPathHop,
  CloudProviderKind,
  ComputeCapabilityKind,
  ConnectorHealthState,
  ConnectorKind,
  ConnectorRequiredFields,
  DataClassification,
  DeviceOsKind,
  DeviceTrustPathHop,
  EnterprisePluginTarget,
  ResidencyPolicy,
} from './types';
export {
  CLOUD_AUTH_PATH,
  CLOUD_PROVIDER_KINDS,
  COMPUTE_CAPABILITY_KINDS,
  CONNECTOR_HEALTH_STATES,
  CONNECTOR_KINDS,
  DEVICE_OS_KINDS,
  DEVICE_TRUST_PATH,
  ENTERPRISE_PLUGIN_TARGETS,
} from './types';

export {
  connectorFabricCopiesEveryDatabase,
  connectorMayGoLiveWithoutEvidence,
  connectorRequiredFieldKeys,
  connectorState,
  createConnector,
  evaluateConnectorAccess,
  listConnectorHealthStates,
  listConnectorKinds,
  openGlobalConnectorFabric,
  privateSupplierScrapingEnabled,
  xivConnectsToAllWorldDatabases,
} from './connectors';
export type { FabricConnector } from './connectors';

export {
  bindCloudAccount,
  ciscoMayBypassNetworkControls,
  evaluateCiscoCapability,
  evaluateCloudAction,
  listCloudAuthPath,
  listCloudProviders,
  listEnterprisePluginTargets,
  networkConnectorMayBypassControls,
  openCloudFabric,
  openEnterprisePlugins,
  pluginState,
} from './cloud';
export type { CloudAccountBinding, EnterprisePlugin } from './cloud';

export {
  createComputeJob,
  evaluateDeviceTrust,
  listComputeCapabilities,
  listDeviceOsKinds,
  listDeviceTrustPath,
  nvidiaIsAuthorizationLayer,
  openComputeFabric,
  openDeviceOsFabric,
  xivReplacesHostOperatingSystem,
} from './device';
export type {
  ComputeBudget,
  ComputeCapability,
  ComputeHealth,
  ComputeJob,
  ComputePolicy,
  ComputeProvider,
  ComputeRegion,
  DeviceProfile,
} from './device';

export {
  applyPersonalization,
  openPersonalizationEngine,
  personalizationWeakensSecurity,
  personalizationWeakensTenantIsolation,
} from './personalization';
export type {
  PersonalizationProfile,
  UserAccessibility,
  UserAgentPreferences,
  UserDashboard,
  UserDeviceProfile,
  UserIndustry,
  UserLanguage,
  UserNotificationPolicy,
  UserPreference,
  UserPrivacyPreference,
  UserRegion,
  UserRole,
  UserWorkflow,
} from './personalization';
