/**
 * Phase 2I-AB Supply Chain Intelligence Graph barrel.
 * Supplier network + supply graph + information logistics + universe fabric +
 * scale targets + location V3 + visual control-tower data contracts + grounding.
 */

export type {
  ContinuousImprovementStage,
  InformationLogisticsStage,
  LocationV3Purpose,
  ScalePartitionKind,
  SupplierCommerceAdapterKind,
  SupplierVerificationState,
  SupplyChainNodeKind,
  UniverseFabricKind,
  VisualGraphKind,
} from './types';
export {
  CONTINUOUS_IMPROVEMENT_STAGES,
  INFORMATION_LOGISTICS_STAGES,
  LOCATION_V3_PURPOSES,
  SCALE_PARTITION_KINDS,
  SUPPLIER_COMMERCE_ADAPTERS,
  SUPPLIER_VERIFICATION_STATES,
  SUPPLY_CHAIN_NODE_KINDS,
  UNIVERSE_FABRIC_KINDS,
  VISUAL_GRAPH_KINDS,
} from './types';

export {
  createSupplierEntity,
  evaluateSupplierProvenance,
  listSupplierCommerceAdapters,
  listSupplierEntityKinds,
  listSupplierVerificationStates,
  openSupplierCommerceNetwork,
  privateSupplierScrapingEnabled,
  supplierAdapterState,
  SUPPLIER_ENTITY_KINDS,
} from './suppliers';
export type { SupplierCommerceAdapter, SupplierEntity, SupplierEntityKind } from './suppliers';

export {
  advanceInformationLogistics,
  createLogisticsRecord,
  evaluateLineageAccess,
  linkSupplyChainNodes,
  listInformationLogisticsStages,
  listSupplyChainNodeKinds,
  openInformationLogisticsCenter,
  openSupplyChainGraph,
} from './chain';
export type {
  InformationLogisticsRecord,
  SupplyChainNode,
  SupplyChainRelationship,
} from './chain';

export {
  advanceImprovementLoop,
  agentsMaySilentlyExpandAuthority,
  claimBillionsOfUsers,
  claimTrillionsOfAgentsOrDatabases,
  evaluateLocationV3Access,
  extremeScaleIsProven,
  extraterrestrialDataClaimsEnabled,
  globalSurveillanceAllowed,
  hiddenTrackingAllowed,
  linkUniverseHierarchy,
  listContinuousImprovementStages,
  listLocationV3Purposes,
  listScalePartitionKinds,
  listUniverseFabricKinds,
  listVisualGraphKinds,
  openControlTowerContracts,
  openLocationIntelligenceV3,
  openScaleArchitecture,
  openUniverseFabric,
  parallelUniversesArePhysical,
  visualNodeExposesRequiredFields,
} from './fabric';
export type {
  LogicalUniverse,
  ScaleArchitectureTarget,
  UniverseHierarchyEdge,
  VisualGraphNode,
} from './fabric';

export {
  capabilityEqualsPrivilege,
  ciscoBypassesNetworkControls,
  extremeScaleProven,
  extremeScaleStatus,
  federatedFabricCopiesEveryDatabase,
  federatedFabricKnowsAuthorizedLocations,
  l4AutonomyEnabled,
  mayMarkLiveWithoutEvidence,
  nvidiaProvidesAuthorization,
  offlineCreatesNewAuthority,
  openPhase2iabGrounding,
  parallelUniversesMeanLogicalNamespaces,
  parallelUniversesMeanPhysicalAlternateRealities,
  productionCredentialsEnabledInPhase2iab,
  scrapesPrivateSupplierSystems,
  unverifiedProvidersStartAs,
  xivConnectsViaAuthorizedApisOnly,
  xivHasAutomaticWorldDatabaseAccess,
  xivReplacesAndroidIosWindowsLinuxMacosSamsung,
} from './grounding';
