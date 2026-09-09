/**
 * 62L-ER10 — Public Geospatial / Mobility Pack (park-and-implement).
 *
 * Layer: 62L-ER Real API Data Fabric + … (GitHub #162).
 *
 * Lawful geospatial and mobility knowledge layer so agents reason about roads,
 * transit, ports, infrastructure, logistics corridors, traffic patterns,
 * charging networks, and mobility systems without harvesting private location
 * data.
 *
 * Core flow:
 * Authorized source → rights check → normalize coordinates/entities →
 * map/index → route/simulation use → evidence
 *
 * Privacy default: PRECISE_PERSONAL_LOCATION = LOCAL_ONLY / DENIED unless the
 * user explicitly authorizes otherwise.
 *
 * Vehicle boundary: analysis and simulation only — no live steering, braking,
 * throttle, ECU modification, or safety-critical vehicle control.
 *
 * Soft-wire when PRESENT: ER9–ER1, EQ16, EQ15, EQ14 (WAITING_DATA ok), EQ13,
 * EQ12, EP15, EM (#157). Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: GitHub #162 / 62L-ER family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ER11 — Public Government Data Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 162 as const;
export const GITHUB_SOT_LABEL = '62L-ER10' as const;
export const GITHUB_SOT_FAMILY = '62L-ER' as const;
export const GITHUB_SOT_TITLE =
  '62L-ER10 Public Geospatial / Mobility Pack — public geo/mobility knowledge; PRECISE_PERSONAL_LOCATION LOCAL_ONLY/DENIED; analysis/simulation only (no vehicle control)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ER10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ER_LAYER_TITLE =
  '62L-ER Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution' as const;

export const NEXT_PHASE_TITLE =
  'ER11 — Public Government Data Pack — official procurement, economic, census, transportation, climate, agency, and public-program data into the Government Contracts and historical intelligence brain.' as const;

/**
 * Pack support categories (public/open geospatial & mobility).
 */
export const GEO_MOBILITY_SUPPORT_CATEGORIES = [
  'public_open_road_networks',
  'ports_and_terminals',
  'rail_networks',
  'airports',
  'public_transit',
  'freight_corridors',
  'infrastructure_assets',
  'ev_charging_locations',
  'weather_related_mobility_impacts',
  'public_traffic_incident_feeds_licensed',
  'logistics_zones',
  'census_geographic_boundaries',
  'public_transportation_statistics',
] as const;

export type GeoMobilitySupportCategory =
  (typeof GEO_MOBILITY_SUPPORT_CATEGORIES)[number];

/**
 * Dataset / node fields.
 */
export const GEO_MOBILITY_NODE_FIELDS = [
  'geoSourceId',
  'providerSource',
  'geography',
  'timeRange',
  'updateFrequency',
  'coordinateReferenceSystem',
  'licenseRightsState',
  'precisionLevel',
  'freshness',
  'apiDownloadMethod',
  'dataQuality',
  'permittedUse',
  'tenantUniverseScope',
  'evidenceRefs',
] as const;

export type GeoMobilityNodeField = (typeof GEO_MOBILITY_NODE_FIELDS)[number];

/**
 * Core flow hops.
 */
export const GEO_MOBILITY_CORE_FLOW = [
  'authorized_source',
  'rights_check',
  'normalize_coordinates_entities',
  'map_index',
  'route_simulation_use',
  'evidence',
] as const;

export type GeoMobilityCoreFlowHop = (typeof GEO_MOBILITY_CORE_FLOW)[number];

/**
 * Real-time truth states for mobility feeds.
 * LIVE_VERIFIED only if active authorized connection + fresh timestamps.
 */
export const GEO_MOBILITY_REALTIME_TRUTH_STATES = [
  'LIVE_VERIFIED',
  'HISTORICAL',
  'STALE',
  'SIMULATED',
  'UNKNOWN',
] as const;

export type GeoMobilityRealtimeTruthState =
  (typeof GEO_MOBILITY_REALTIME_TRUTH_STATES)[number];

/**
 * Privacy: precise personal location treated separately from public geospatial.
 */
export const PRECISE_PERSONAL_LOCATION_DEFAULT = 'LOCAL_ONLY' as const;
export const PRECISE_PERSONAL_LOCATION_FALLBACK = 'DENIED' as const;

export const PRECISE_PERSONAL_LOCATION_CLASSES = [
  'private_gps_histories',
  'home_work_locations',
  'driving_routes',
  'device_location',
  'trip_histories',
  'vehicle_telemetry',
] as const;

export type PrecisePersonalLocationClass =
  (typeof PRECISE_PERSONAL_LOCATION_CLASSES)[number];

/**
 * Mobility agent MAY use cases (analysis / simulation).
 */
export const GEO_MOBILITY_AGENT_MAY_USES = [
  'freight_route_simulation',
  'warehouse_location_analysis',
  'port_congestion_studies',
  'disaster_logistics',
  'ev_charging_planning',
  'public_transit_analysis',
  'supply_chain_risk_mapping',
  'fleet_scenario_simulations',
  'infrastructure_resilience',
] as const;

export type GeoMobilityAgentMayUse =
  (typeof GEO_MOBILITY_AGENT_MAY_USES)[number];

/**
 * Vehicle control actions — always denied (analysis/simulation only).
 */
export const VEHICLE_CONTROL_ACTIONS = [
  'live_steering',
  'live_braking',
  'live_throttle',
  'ecu_modification',
  'safety_critical_vehicle_control',
] as const;

export type VehicleControlAction = (typeof VEHICLE_CONTROL_ACTIONS)[number];

export const GEO_MOBILITY_PRIVACY_BOUNDARY = Object.freeze({
  precisePersonalLocationDefault: PRECISE_PERSONAL_LOCATION_DEFAULT,
  precisePersonalLocationFallback: PRECISE_PERSONAL_LOCATION_FALLBACK,
  mayCollectPrivateGpsHistoriesWithoutOptIn: false as const,
  mayPoolHomeWorkLocationsWithoutOptIn: false as const,
  mayHarvestDrivingRoutesWithoutOptIn: false as const,
  mayCollectDeviceLocationWithoutOptIn: false as const,
  mayPoolTripHistoriesWithoutOptIn: false as const,
  mayHarvestVehicleTelemetryWithoutOptIn: false as const,
  mayUseWithoutPurposeLimitationRetentionRevocation: false as const,
  publicGeospatialSeparateFromPersonalLocation: true as const,
});

export const GEO_MOBILITY_VEHICLE_BOUNDARY = Object.freeze({
  analysisAndSimulationOnly: true as const,
  mayLiveSteer: false as const,
  mayLiveBrake: false as const,
  mayLiveThrottle: false as const,
  mayModifyEcu: false as const,
  maySafetyCriticalVehicleControl: false as const,
});

export const GEO_MOBILITY_TRUTH_BOUNDARY = Object.freeze({
  liveVerifiedRequiresActiveAuthorizedConnection: true as const,
  liveVerifiedRequiresFreshTimestamps: true as const,
  mayClaimLiveVerifiedWithoutAuthAndFresh: false as const,
  mayUseWithoutRightsCheck: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
});

export type GeoMobilityLicenseRightsState =
  | 'PUBLIC_DOMAIN'
  | 'OPEN_LICENSE'
  | 'LICENSED'
  | 'GOVERNMENT_OPEN'
  | 'UNKNOWN_RIGHTS'
  | 'RESTRICTED'
  | 'DENIED';

export type GeoMobilityNode = {
  geoSourceId: string;
  providerSource: string;
  geography: string;
  timeRange: string;
  updateFrequency: string;
  coordinateReferenceSystem: string;
  licenseRightsState: GeoMobilityLicenseRightsState;
  precisionLevel: 'PUBLIC_COARSE' | 'PUBLIC_FINE' | 'PERSONAL_PRECISE';
  freshness: GeoMobilityRealtimeTruthState;
  apiDownloadMethod: string;
  dataQuality: string;
  permittedUse: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  evidenceRefs: readonly string[];
  category: GeoMobilitySupportCategory;
  rightsApproved: boolean;
  indexed: boolean;
  flowPosition: GeoMobilityCoreFlowHop;
  activeAuthorizedConnection: boolean;
  freshTimestamps: boolean;
};

export const PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE = [
  'honesty_locks',
  'public_geospatial_mobility_pack_bootstrap',
  // A — Structure
  'support_categories_encoded',
  'node_fields_encoded',
  'core_flow_encoded',
  'privacy_defaults_encoded',
  'realtime_truth_states_encoded',
  'vehicle_boundary_encoded',
  'agent_may_uses_encoded',
  // B — Truth / flow
  'register_after_rights_check',
  'normalize_and_index_for_simulation',
  'classify_feed_freshness',
  'live_verified_requires_auth_and_fresh',
  // C — Denies / privacy / vehicle
  'deny_personal_location_pooling_harvest',
  'deny_vehicle_control_actions',
  'deny_use_without_rights',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  'deny_persist_hidden_chain_of_thought',
  'deny_auto_deploy_changes',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'er_layer_context_documented',
  'er9_soft_wire',
  'er8_soft_wire',
  'er7_soft_wire',
  'er6_soft_wire',
  'er5_soft_wire',
  'er4_soft_wire',
  'er3_soft_wire',
  'er2_soft_wire',
  'er1_soft_wire',
  'eq16_soft_wire',
  'eq15_soft_wire',
  'eq14_soft_wire',
  'eq13_soft_wire',
  'eq12_soft_wire',
  'ep15_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Er10Hop = (typeof PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE)[number];

export type Er10EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'LIVE_VERIFIED'
  | 'HISTORICAL'
  | 'STALE'
  | 'SIMULATED'
  | 'UNKNOWN'
  | 'LOCAL_ONLY';

export type Er10HopRecord = {
  hop: Er10Hop;
  state: Er10EvidenceState;
  summary: string;
  at: string;
};

export type Er10ActorKind =
  | 'geospatial_mobility_pack'
  | 'mobility_agent'
  | 'logistics_analyst'
  | 'rights_reviewer'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Er10Actor = {
  kind: Er10ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ER10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_PUBLIC_GEOSPATIAL_MOBILITY_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Privacy
  COLLECT_PRIVATE_GPS_HISTORIES_WITHOUT_OPT_IN: false as const,
  POOL_HOME_WORK_LOCATIONS_WITHOUT_OPT_IN: false as const,
  HARVEST_DRIVING_ROUTES_WITHOUT_OPT_IN: false as const,
  COLLECT_DEVICE_LOCATION_WITHOUT_OPT_IN: false as const,
  POOL_TRIP_HISTORIES_WITHOUT_OPT_IN: false as const,
  HARVEST_VEHICLE_TELEMETRY_WITHOUT_OPT_IN: false as const,
  USE_WITHOUT_PURPOSE_LIMITATION_RETENTION_REVOCATION: false as const,
  PRECISE_PERSONAL_LOCATION_DEFAULT_LOCAL_ONLY_OR_DENIED: true as const,

  // Vehicle
  LIVE_STEERING: false as const,
  LIVE_BRAKING: false as const,
  LIVE_THROTTLE: false as const,
  ECU_MODIFICATION: false as const,
  SAFETY_CRITICAL_VEHICLE_CONTROL: false as const,

  // Rights / truth
  USE_WITHOUT_RIGHTS_CHECK: false as const,
  CLAIM_LIVE_VERIFIED_WITHOUT_AUTH_AND_FRESH: false as const,

  // Autonomy / isolation
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const ER10_AGENT_BOUNDS = Object.freeze({
  mayRegisterPublicGeoSourcesAfterRightsCheck: true as const,
  mayNormalizeAndIndexForSimulation: true as const,
  mayClassifyFeedFreshness: true as const,
  mayRunFreightRouteSimulation: true as const,
  mayAnalyzeWarehouseLocations: true as const,
  mayStudyPortCongestion: true as const,
  mayPlanEvCharging: true as const,
  mayAnalyzePublicTransit: true as const,
  mayMapSupplyChainRisk: true as const,
  mayRunFleetScenarioSimulations: true as const,
  mayAssessInfrastructureResilience: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayRecommendOnly: true as const,
  automaticAuthority: false as const,
  mayCollectPrivateGpsWithoutOptIn: false as const,
  mayPoolPersonalLocationWithoutOptIn: false as const,
  mayLiveSteerBrakeThrottle: false as const,
  mayModifyEcu: false as const,
  maySafetyCriticalVehicleControl: false as const,
  mayUseWithoutRightsCheck: false as const,
  mayClaimLiveVerifiedWithoutAuthAndFresh: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayAutoDeployChanges: false as const,
});

export const ER10_MAY = Object.freeze([
  'register_public_open_geo_sources_after_rights_check',
  'normalize_coordinates_and_entities_for_map_index',
  'classify_realtime_truth_live_verified_historical_stale_simulated_unknown',
  'freight_route_and_fleet_scenario_simulation',
  'warehouse_port_transit_ev_charging_disaster_logistics_analysis',
  'supply_chain_risk_and_infrastructure_resilience_mapping',
  'return_geospatial_mobility_evidence_to_home_base',
] as const);

export const ER10_MUST_NOT = Object.freeze([
  'collect_or_pool_private_gps_histories_without_explicit_opt_in',
  'collect_or_pool_home_work_locations_without_explicit_opt_in',
  'harvest_driving_routes_without_explicit_opt_in',
  'collect_device_location_without_explicit_opt_in',
  'pool_trip_histories_without_explicit_opt_in',
  'harvest_vehicle_telemetry_without_explicit_opt_in',
  'use_personal_location_without_purpose_limitation_retention_revocation',
  'live_steering_braking_throttle_ecu_or_safety_critical_vehicle_control',
  'claim_live_verified_without_active_authorized_connection_and_fresh_timestamps',
  'use_geo_source_without_rights_check',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'persist_hidden_chain_of_thought',
  'auto_deploy_changes',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Er10SoftWireSnapshot = {
  er9PublicLawPolicyKnowledgePack: SoftWirePresence;
  er9Report: SoftWirePresence;
  er8AncientCivilizationsKnowledgePack: SoftWirePresence;
  er8Report: SoftWirePresence;
  er7HistoricalScienceEngineeringAtlas: SoftWirePresence;
  er7Report: SoftWirePresence;
  er6HistoricalBusinessCaseAtlasV2: SoftWirePresence;
  er6Report: SoftWirePresence;
  er5GlobalHistoricalKnowledgeIngestion: SoftWirePresence;
  er5Report: SoftWirePresence;
  er4RightsProvenanceGate: SoftWirePresence;
  er4Report: SoftWirePresence;
  er3PublicDataSourceRegistry: SoftWirePresence;
  er3Report: SoftWirePresence;
  er2ApiTruthStateMachine: SoftWirePresence;
  er2Report: SoftWirePresence;
  er1RealApiConnectionRegistry: SoftWirePresence;
  er1Report: SoftWirePresence;
  eq16SoftwareWormholeRouter: SoftWirePresence;
  eq16Report: SoftWirePresence;
  eq15PathwayPlasticity: SoftWirePresence;
  eq15Report: SoftWirePresence;
  eq14NeuralPathwayArchitectureGraph: SoftWirePresence;
  eq14Report: SoftWirePresence;
  eq13ArchitectureReturnReceipt: SoftWirePresence;
  eq13Report: SoftWirePresence;
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEr10LocksIntact(): boolean {
  return (
    ER10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ER10_LOCKS.COLLECT_PRIVATE_GPS_HISTORIES_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.POOL_HOME_WORK_LOCATIONS_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.HARVEST_DRIVING_ROUTES_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.COLLECT_DEVICE_LOCATION_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.POOL_TRIP_HISTORIES_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.HARVEST_VEHICLE_TELEMETRY_WITHOUT_OPT_IN === false &&
    ER10_LOCKS.USE_WITHOUT_PURPOSE_LIMITATION_RETENTION_REVOCATION === false &&
    ER10_LOCKS.PRECISE_PERSONAL_LOCATION_DEFAULT_LOCAL_ONLY_OR_DENIED ===
      true &&
    ER10_LOCKS.LIVE_STEERING === false &&
    ER10_LOCKS.LIVE_BRAKING === false &&
    ER10_LOCKS.LIVE_THROTTLE === false &&
    ER10_LOCKS.ECU_MODIFICATION === false &&
    ER10_LOCKS.SAFETY_CRITICAL_VEHICLE_CONTROL === false &&
    ER10_LOCKS.USE_WITHOUT_RIGHTS_CHECK === false &&
    ER10_LOCKS.CLAIM_LIVE_VERIFIED_WITHOUT_AUTH_AND_FRESH === false &&
    ER10_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ER10_LOCKS.RECOMMEND_EQ_ACT === false &&
    ER10_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ER10_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ER10_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ER10_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ER10_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ER10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ER10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ER10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ER10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ER10_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ER10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ER10_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ER10_LOCKS.TIP_LAND === false &&
    ER10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ER10_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ER10_LOCKS.FULL_PRODUCTION_PUBLIC_GEOSPATIAL_MOBILITY_PACK_SHIPPED ===
      false &&
    ER10_LOCKS.MANAGE_PULL_REQUEST === false &&
    GEO_MOBILITY_PRIVACY_BOUNDARY.mayCollectPrivateGpsHistoriesWithoutOptIn ===
      false &&
    GEO_MOBILITY_VEHICLE_BOUNDARY.analysisAndSimulationOnly === true &&
    GEO_MOBILITY_VEHICLE_BOUNDARY.maySafetyCriticalVehicleControl === false &&
    GEO_MOBILITY_TRUTH_BOUNDARY.mayClaimLiveVerifiedWithoutAuthAndFresh ===
      false &&
    GEO_MOBILITY_TRUTH_BOUNDARY.mayUseWithoutRightsCheck === false &&
    ER10_AGENT_BOUNDS.automaticAuthority === false &&
    ER10_AGENT_BOUNDS.mayLiveSteerBrakeThrottle === false &&
    ER10_AGENT_BOUNDS.mayCollectPrivateGpsWithoutOptIn === false &&
    PRECISE_PERSONAL_LOCATION_DEFAULT === 'LOCAL_ONLY' &&
    PRECISE_PERSONAL_LOCATION_FALLBACK === 'DENIED'
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

export function er10SoftWireSnapshot(repoRoot?: string): Er10SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    er9PublicLawPolicyKnowledgePack: softWireFile(
      './public-law-policy-knowledge-pack-types.ts',
      'ER9 Public Law / Policy Knowledge Pack PRESENT (soft-wire).',
      'ER9 Public Law / Policy Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER9_PUBLIC_LAW_POLICY_KNOWLEDGE_PACK_REPORT.md',
      'ER9 report PRESENT.',
      'ER9 report absent — soft-wire WAITING_DATA.',
    ),
    er8AncientCivilizationsKnowledgePack: softWireFile(
      './ancient-civilizations-knowledge-pack-types.ts',
      'ER8 Ancient Civilizations Knowledge Pack PRESENT (soft-wire).',
      'ER8 Ancient Civilizations Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    er8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER8_ANCIENT_CIVILIZATIONS_KNOWLEDGE_PACK_REPORT.md',
      'ER8 report PRESENT.',
      'ER8 report absent — soft-wire WAITING_DATA.',
    ),
    er7HistoricalScienceEngineeringAtlas: softWireFile(
      './historical-science-engineering-atlas-types.ts',
      'ER7 Historical Science & Engineering Atlas PRESENT (soft-wire).',
      'ER7 Historical Science & Engineering Atlas absent — soft-wire WAITING_DATA.',
    ),
    er7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER7_HISTORICAL_SCIENCE_ENGINEERING_ATLAS_REPORT.md',
      'ER7 report PRESENT.',
      'ER7 report absent — soft-wire WAITING_DATA.',
    ),
    er6HistoricalBusinessCaseAtlasV2: softWireFile(
      './historical-business-case-atlas-v2-types.ts',
      'ER6 Historical Business Case Atlas v2 PRESENT (soft-wire).',
      'ER6 Historical Business Case Atlas v2 absent — soft-wire WAITING_DATA.',
    ),
    er6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER6_HISTORICAL_BUSINESS_CASE_ATLAS_V2_REPORT.md',
      'ER6 report PRESENT.',
      'ER6 report absent — soft-wire WAITING_DATA.',
    ),
    er5GlobalHistoricalKnowledgeIngestion: softWireFile(
      './global-historical-knowledge-ingestion-types.ts',
      'ER5 Global Historical Knowledge Ingestion PRESENT (soft-wire).',
      'ER5 Global Historical Knowledge Ingestion absent — soft-wire WAITING_DATA.',
    ),
    er5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER5_GLOBAL_HISTORICAL_KNOWLEDGE_INGESTION_REPORT.md',
      'ER5 report PRESENT.',
      'ER5 report absent — soft-wire WAITING_DATA.',
    ),
    er4RightsProvenanceGate: softWireFile(
      './rights-provenance-gate-types.ts',
      'ER4 Rights & Provenance Gate PRESENT (soft-wire).',
      'ER4 Rights & Provenance Gate absent — soft-wire WAITING_DATA.',
    ),
    er4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER4_RIGHTS_PROVENANCE_GATE_REPORT.md',
      'ER4 report PRESENT.',
      'ER4 report absent — soft-wire WAITING_DATA.',
    ),
    er3PublicDataSourceRegistry: softWireFile(
      './public-data-source-registry-types.ts',
      'ER3 Public Data Source Registry PRESENT (soft-wire).',
      'ER3 Public Data Source Registry absent — soft-wire WAITING_DATA.',
    ),
    er3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER3_PUBLIC_DATA_SOURCE_REGISTRY_REPORT.md',
      'ER3 report PRESENT.',
      'ER3 report absent — soft-wire WAITING_DATA.',
    ),
    er2ApiTruthStateMachine: softWireFile(
      './api-truth-state-machine-types.ts',
      'ER2 API Truth State Machine PRESENT (soft-wire).',
      'ER2 API Truth State Machine absent — soft-wire WAITING_DATA.',
    ),
    er2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER2_API_TRUTH_STATE_MACHINE_REPORT.md',
      'ER2 report PRESENT.',
      'ER2 report absent — soft-wire WAITING_DATA.',
    ),
    er1RealApiConnectionRegistry: softWireFile(
      './real-api-connection-registry-types.ts',
      'ER1 Real API Connection Registry PRESENT (soft-wire).',
      'ER1 Real API Connection Registry absent — soft-wire WAITING_DATA.',
    ),
    er1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER1_REAL_API_CONNECTION_REGISTRY_REPORT.md',
      'ER1 report PRESENT.',
      'ER1 report absent — soft-wire WAITING_DATA.',
    ),
    eq16SoftwareWormholeRouter: softWireFile(
      './software-wormhole-router-types.ts',
      'EQ16 Software Wormhole Router PRESENT (soft-wire).',
      'EQ16 Software Wormhole Router absent — soft-wire WAITING_DATA.',
    ),
    eq16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ16_SOFTWARE_WORMHOLE_ROUTER_REPORT.md',
      'EQ16 report PRESENT.',
      'EQ16 report absent — soft-wire WAITING_DATA.',
    ),
    eq15PathwayPlasticity: softWireFile(
      './pathway-plasticity-types.ts',
      'EQ15 Pathway Plasticity PRESENT (soft-wire).',
      'EQ15 Pathway Plasticity absent — soft-wire WAITING_DATA.',
    ),
    eq15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ15_PATHWAY_PLASTICITY_REPORT.md',
      'EQ15 report PRESENT.',
      'EQ15 report absent — soft-wire WAITING_DATA.',
    ),
    eq14NeuralPathwayArchitectureGraph: softWireFile(
      './neural-pathway-architecture-graph-types.ts',
      'EQ14 Neural Pathway Architecture Graph PRESENT (soft-wire).',
      'EQ14 Neural Pathway Architecture Graph absent — soft-wire WAITING_DATA.',
    ),
    eq14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ14_NEURAL_PATHWAY_ARCHITECTURE_GRAPH_REPORT.md',
      'EQ14 report PRESENT.',
      'EQ14 report absent — soft-wire WAITING_DATA.',
    ),
    eq13ArchitectureReturnReceipt: softWireFile(
      './architecture-return-receipt-types.ts',
      'EQ13 Architecture Return Receipt PRESENT (soft-wire).',
      'EQ13 Architecture Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    eq13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ13_ARCHITECTURE_RETURN_RECEIPT_REPORT.md',
      'EQ13 report PRESENT.',
      'EQ13 report absent — soft-wire WAITING_DATA.',
    ),
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    eq12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ12_CROSS_ARCHITECTURE_BENCHMARK_MATRIX_REPORT.md',
      'EQ12 report PRESENT.',
      'EQ12 report absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Er10Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEr10Agent(actor: Er10Actor): boolean {
  const agents: readonly Er10ActorKind[] = [
    'geospatial_mobility_pack',
    'mobility_agent',
    'logistics_analyst',
    'rights_reviewer',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function isForbiddenRights(
  state: GeoMobilityLicenseRightsState,
): boolean {
  return state === 'RESTRICTED' || state === 'DENIED';
}

export function isUnknownRights(
  state: GeoMobilityLicenseRightsState,
): boolean {
  return state === 'UNKNOWN_RIGHTS';
}

export function precisePersonalLocationDefaultMode():
  | typeof PRECISE_PERSONAL_LOCATION_DEFAULT
  | typeof PRECISE_PERSONAL_LOCATION_FALLBACK {
  return PRECISE_PERSONAL_LOCATION_DEFAULT;
}

export function vehicleControlAllowed(_action: VehicleControlAction): false {
  return false;
}

export function canClaimLiveVerified(input: {
  activeAuthorizedConnection: boolean;
  freshTimestamps: boolean;
}): boolean {
  return (
    input.activeAuthorizedConnection === true &&
    input.freshTimestamps === true &&
    GEO_MOBILITY_TRUTH_BOUNDARY.liveVerifiedRequiresActiveAuthorizedConnection &&
    GEO_MOBILITY_TRUTH_BOUNDARY.liveVerifiedRequiresFreshTimestamps
  );
}
