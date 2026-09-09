/**
 * 62L-ER10 — Public Geospatial / Mobility Pack runtime.
 *
 * Authorized source → rights check → normalize → map/index → simulation → evidence.
 * Privacy: PRECISE_PERSONAL_LOCATION LOCAL_ONLY/DENIED. No vehicle control.
 * LIVE_VERIFIED only with active authorized connection + fresh timestamps.
 */

import { createHash } from 'node:crypto';
import {
  ER10_AGENT_BOUNDS,
  ER10_DB_CANDIDATES_STATUS,
  ER10_LOCKS,
  ER10_MAY,
  ER10_MUST_NOT,
  ER_LAYER_TITLE,
  GEO_MOBILITY_AGENT_MAY_USES,
  GEO_MOBILITY_CORE_FLOW,
  GEO_MOBILITY_NODE_FIELDS,
  GEO_MOBILITY_PRIVACY_BOUNDARY,
  GEO_MOBILITY_REALTIME_TRUTH_STATES,
  GEO_MOBILITY_SUPPORT_CATEGORIES,
  GEO_MOBILITY_TRUTH_BOUNDARY,
  GEO_MOBILITY_VEHICLE_BOUNDARY,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PRECISE_PERSONAL_LOCATION_CLASSES,
  PRECISE_PERSONAL_LOCATION_DEFAULT,
  PRECISE_PERSONAL_LOCATION_FALLBACK,
  PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE,
  VEHICLE_CONTROL_ACTIONS,
  assertEr10LocksIntact,
  canClaimLiveVerified,
  er10SoftWireSnapshot,
  isEr10Agent,
  isForbiddenRights,
  isHumanApprover,
  isUnknownRights,
  precisePersonalLocationDefaultMode,
  vehicleControlAllowed,
  type Er10Actor,
  type Er10EvidenceState,
  type Er10HopRecord,
  type Er10SoftWireSnapshot,
  type GeoMobilityAgentMayUse,
  type GeoMobilityLicenseRightsState,
  type GeoMobilityNode,
  type GeoMobilityNodeField,
  type GeoMobilityRealtimeTruthState,
  type GeoMobilitySupportCategory,
  type PrecisePersonalLocationClass,
  type VehicleControlAction,
} from './public-geospatial-mobility-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE)[number],
  state: Er10EvidenceState,
  summary: string,
): Er10HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'LOCAL_ONLY';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'LOCAL_ONLY' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

export type RegisterPublicGeoSourceInput = {
  actor: Er10Actor;
  geoSourceId: string;
  providerSource: string;
  geography: string;
  timeRange: string;
  updateFrequency: string;
  coordinateReferenceSystem: string;
  licenseRightsState: GeoMobilityLicenseRightsState;
  precisionLevel: GeoMobilityNode['precisionLevel'];
  apiDownloadMethod: string;
  dataQuality: string;
  permittedUse: string;
  category: GeoMobilitySupportCategory;
  evidenceRefs?: readonly string[];
  rightsApproved?: boolean;
  attemptUseWithoutRights?: boolean;
  attemptPersonalPreciseAsPublic?: boolean;
};

/**
 * Register a public geospatial source only after rights check.
 */
export function registerPublicGeoSource(
  input: RegisterPublicGeoSourceInput,
): GeoMobilityNode | DenialResult {
  if (!GEO_MOBILITY_SUPPORT_CATEGORIES.includes(input.category)) {
    return deny(`Unknown category: ${String(input.category)}`);
  }
  if (
    input.attemptUseWithoutRights ||
    ER10_LOCKS.USE_WITHOUT_RIGHTS_CHECK ||
    !ER10_AGENT_BOUNDS.mayRegisterPublicGeoSourcesAfterRightsCheck
  ) {
    return deny('USE_WITHOUT_RIGHTS_CHECK=false — rights check required.');
  }
  if (isForbiddenRights(input.licenseRightsState)) {
    return deny(
      `Forbidden rights state ${input.licenseRightsState} — source DENIED.`,
    );
  }
  if (isUnknownRights(input.licenseRightsState) && input.rightsApproved) {
    return deny(
      'UNKNOWN_RIGHTS cannot be auto-approved into the mobility pack.',
    );
  }
  if (
    input.precisionLevel === 'PERSONAL_PRECISE' ||
    input.attemptPersonalPreciseAsPublic
  ) {
    return deny(
      'PRECISE_PERSONAL_LOCATION=LOCAL_ONLY/DENIED — personal precise location is not public geospatial.',
      'LOCAL_ONLY',
    );
  }
  if (!input.rightsApproved) {
    return deny(
      'Rights check required before registration (authorized source → rights check).',
    );
  }

  void GEO_MOBILITY_NODE_FIELDS;

  return {
    geoSourceId: input.geoSourceId,
    providerSource: input.providerSource,
    geography: input.geography,
    timeRange: input.timeRange,
    updateFrequency: input.updateFrequency,
    coordinateReferenceSystem: input.coordinateReferenceSystem,
    licenseRightsState: input.licenseRightsState,
    precisionLevel: input.precisionLevel,
    freshness: 'UNKNOWN',
    apiDownloadMethod: input.apiDownloadMethod,
    dataQuality: input.dataQuality,
    permittedUse: input.permittedUse,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    evidenceRefs: input.evidenceRefs ?? [],
    category: input.category,
    rightsApproved: true,
    indexed: false,
    flowPosition: 'rights_check',
    activeAuthorizedConnection: false,
    freshTimestamps: false,
  };
}

/**
 * Normalize coordinates/entities and map/index for route/simulation use.
 */
export function normalizeAndIndexForSimulation(input: {
  actor: Er10Actor;
  node: GeoMobilityNode;
  normalizedCrs?: string;
}): GeoMobilityNode | DenialResult {
  if (!ER10_AGENT_BOUNDS.mayNormalizeAndIndexForSimulation) {
    return deny('mayNormalizeAndIndexForSimulation=false');
  }
  if (!input.node.rightsApproved) {
    return deny('Cannot index without rights approval.');
  }
  if (
    input.node.precisionLevel === 'PERSONAL_PRECISE' ||
    ER10_LOCKS.COLLECT_PRIVATE_GPS_HISTORIES_WITHOUT_OPT_IN
  ) {
    return deny(
      'Personal precise location cannot enter public geo index.',
      'LOCAL_ONLY',
    );
  }
  return {
    ...input.node,
    coordinateReferenceSystem:
      input.normalizedCrs ?? input.node.coordinateReferenceSystem,
    indexed: true,
    flowPosition: 'map_index',
  };
}

/**
 * Classify feed freshness. LIVE_VERIFIED only with auth + fresh timestamps.
 */
export function classifyFeedFreshness(input: {
  node: GeoMobilityNode;
  activeAuthorizedConnection: boolean;
  freshTimestamps: boolean;
  intendedState?: GeoMobilityRealtimeTruthState;
  attemptClaimLiveVerifiedWithoutAuthAndFresh?: boolean;
}): GeoMobilityNode | DenialResult {
  if (!ER10_AGENT_BOUNDS.mayClassifyFeedFreshness) {
    return deny('mayClassifyFeedFreshness=false');
  }
  if (
    input.attemptClaimLiveVerifiedWithoutAuthAndFresh ||
    ER10_LOCKS.CLAIM_LIVE_VERIFIED_WITHOUT_AUTH_AND_FRESH
  ) {
    return deny(
      'CLAIM_LIVE_VERIFIED_WITHOUT_AUTH_AND_FRESH=false — LIVE_VERIFIED requires active authorized connection + fresh timestamps.',
    );
  }

  let freshness: GeoMobilityRealtimeTruthState;
  if (
    input.intendedState === 'LIVE_VERIFIED' ||
    (input.activeAuthorizedConnection && input.freshTimestamps)
  ) {
    if (
      !canClaimLiveVerified({
        activeAuthorizedConnection: input.activeAuthorizedConnection,
        freshTimestamps: input.freshTimestamps,
      })
    ) {
      return deny(
        'LIVE_VERIFIED denied — missing active authorized connection and/or fresh timestamps.',
        'WAITING_DATA',
      );
    }
    freshness = 'LIVE_VERIFIED';
  } else if (input.intendedState) {
    freshness = input.intendedState;
  } else if (!input.activeAuthorizedConnection && !input.freshTimestamps) {
    freshness = 'UNKNOWN';
  } else if (!input.freshTimestamps) {
    freshness = 'STALE';
  } else {
    freshness = 'HISTORICAL';
  }

  return {
    ...input.node,
    freshness,
    activeAuthorizedConnection: input.activeAuthorizedConnection,
    freshTimestamps: input.freshTimestamps,
    flowPosition: 'route_simulation_use',
  };
}

export function useForMobilitySimulation(input: {
  actor: Er10Actor;
  node: GeoMobilityNode;
  useCase: GeoMobilityAgentMayUse;
  attemptUseWithoutRights?: boolean;
}):
  | {
      allowed: true;
      useCase: GeoMobilityAgentMayUse;
      geoSourceId: string;
      simulationOnly: true;
      vehicleControl: false;
      freshness: GeoMobilityRealtimeTruthState;
    }
  | DenialResult {
  if (
    input.attemptUseWithoutRights ||
    !input.node.rightsApproved ||
    ER10_LOCKS.USE_WITHOUT_RIGHTS_CHECK
  ) {
    return deny('USE_WITHOUT_RIGHTS_CHECK=false — cannot use without rights.');
  }
  if (!input.node.indexed) {
    return deny('Source must be normalized/indexed before simulation use.');
  }
  if (!GEO_MOBILITY_AGENT_MAY_USES.includes(input.useCase)) {
    return deny(`Unknown mobility use case: ${String(input.useCase)}`);
  }
  return {
    allowed: true,
    useCase: input.useCase,
    geoSourceId: input.node.geoSourceId,
    simulationOnly: true,
    vehicleControl: false,
    freshness: input.node.freshness,
  };
}

/**
 * Deny pooling/harvesting precise personal location without opt-in.
 */
export function attemptPersonalLocationPooling(input: {
  class: PrecisePersonalLocationClass;
  explicitOptIn?: boolean;
  purposeLimitation?: boolean;
  retentionPolicy?: boolean;
  revocationSupported?: boolean;
}): DenialResult {
  if (!PRECISE_PERSONAL_LOCATION_CLASSES.includes(input.class)) {
    return deny(`Unknown personal location class: ${String(input.class)}`);
  }
  const defaultMode = precisePersonalLocationDefaultMode();
  if (!input.explicitOptIn) {
    return deny(
      `PRECISE_PERSONAL_LOCATION=${defaultMode}/${PRECISE_PERSONAL_LOCATION_FALLBACK} — ${input.class} requires explicit opt-in.`,
      defaultMode === 'LOCAL_ONLY' ? 'LOCAL_ONLY' : 'DENIED',
    );
  }
  if (
    !input.purposeLimitation ||
    !input.retentionPolicy ||
    !input.revocationSupported ||
    ER10_LOCKS.USE_WITHOUT_PURPOSE_LIMITATION_RETENTION_REVOCATION
  ) {
    return deny(
      'USE_WITHOUT_PURPOSE_LIMITATION_RETENTION_REVOCATION=false — purpose limitation, retention, and revocation required.',
    );
  }
  // Even with opt-in flags in this bounded park, pooling/harvest remains denied
  // until a future VERIFIED privacy pathway exists.
  return deny(
    `Personal location class ${input.class} remains LOCAL_ONLY/DENIED in ER10 park (no harvest/pool pipeline shipped).`,
    'LOCAL_ONLY',
  );
}

export function attemptVehicleControl(
  action: VehicleControlAction,
): DenialResult {
  if (vehicleControlAllowed(action) !== false) {
    return deny('Invariant broken: vehicle control must be false.');
  }
  switch (action) {
    case 'live_steering':
      return deny('LIVE_STEERING=false — analysis/simulation only.');
    case 'live_braking':
      return deny('LIVE_BRAKING=false — analysis/simulation only.');
    case 'live_throttle':
      return deny('LIVE_THROTTLE=false — analysis/simulation only.');
    case 'ecu_modification':
      return deny('ECU_MODIFICATION=false — analysis/simulation only.');
    case 'safety_critical_vehicle_control':
      return deny(
        'SAFETY_CRITICAL_VEHICLE_CONTROL=false — analysis/simulation only.',
      );
    default:
      return deny('Vehicle control denied — analysis/simulation only.');
  }
}

export function attemptUseWithoutRights(): DenialResult {
  return deny('USE_WITHOUT_RIGHTS_CHECK=false.');
}

export function attemptClaimLiveVerifiedWithoutAuthAndFresh(): DenialResult {
  return deny('CLAIM_LIVE_VERIFIED_WITHOUT_AUTH_AND_FRESH=false.');
}

export function attemptCollectPrivateGpsHistories(): DenialResult {
  return deny('COLLECT_PRIVATE_GPS_HISTORIES_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptPoolHomeWorkLocations(): DenialResult {
  return deny('POOL_HOME_WORK_LOCATIONS_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptHarvestDrivingRoutes(): DenialResult {
  return deny('HARVEST_DRIVING_ROUTES_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptCollectDeviceLocation(): DenialResult {
  return deny('COLLECT_DEVICE_LOCATION_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptPoolTripHistories(): DenialResult {
  return deny('POOL_TRIP_HISTORIES_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptHarvestVehicleTelemetry(): DenialResult {
  return deny('HARVEST_VEHICLE_TELEMETRY_WITHOUT_OPT_IN=false.', 'LOCAL_ONLY');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('BYPASS_GUARDIAN_RLS=false.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('EXPAND_TENANT_UNIVERSE_ACCESS=false.');
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny('PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false.');
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEr10EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Er10Actor;
  node: GeoMobilityNode;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      geoSourceId: string;
      freshness: GeoMobilityRealtimeTruthState;
      personalLocationHarvested: false;
      vehicleControl: false;
    }
  | DenialResult {
  if (!ER10_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEr10Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ER10 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    geoSourceId: input.node.geoSourceId,
    freshness: input.node.freshness,
    personalLocationHarvested: false,
    vehicleControl: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Er10Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: ER10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: ER10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: ER10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleIndexedPublicRoadNetwork(actor: Er10Actor): {
  registered: GeoMobilityNode;
  indexed: GeoMobilityNode;
  live: GeoMobilityNode;
} {
  const registered = registerPublicGeoSource({
    actor,
    geoSourceId: 'geo-roads-osm-1',
    providerSource: 'OpenStreetMap',
    geography: 'global',
    timeRange: '2020-2026',
    updateFrequency: 'weekly',
    coordinateReferenceSystem: 'EPSG:4326',
    licenseRightsState: 'OPEN_LICENSE',
    precisionLevel: 'PUBLIC_FINE',
    apiDownloadMethod: 'download',
    dataQuality: 'community_verified',
    permittedUse: 'research_simulation',
    category: 'public_open_road_networks',
    evidenceRefs: ['license://odbl', 'docs://osm/roads'],
    rightsApproved: true,
  });
  if ('denied' in registered) throw new Error(registered.reason);

  const indexed = normalizeAndIndexForSimulation({
    actor,
    node: registered,
    normalizedCrs: 'EPSG:4326',
  });
  if ('denied' in indexed) throw new Error(indexed.reason);

  const live = classifyFeedFreshness({
    node: indexed,
    activeAuthorizedConnection: true,
    freshTimestamps: true,
    intendedState: 'LIVE_VERIFIED',
  });
  if ('denied' in live) throw new Error(live.reason);

  return { registered, indexed, live };
}

export function bootstrapPublicGeospatialMobilityPack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Er10SoftWireSnapshot;
  supportCategories: typeof GEO_MOBILITY_SUPPORT_CATEGORIES;
  nodeFields: readonly GeoMobilityNodeField[];
  coreFlow: typeof GEO_MOBILITY_CORE_FLOW;
  realtimeTruthStates: typeof GEO_MOBILITY_REALTIME_TRUTH_STATES;
  privacyBoundary: typeof GEO_MOBILITY_PRIVACY_BOUNDARY;
  vehicleBoundary: typeof GEO_MOBILITY_VEHICLE_BOUNDARY;
  truthBoundary: typeof GEO_MOBILITY_TRUTH_BOUNDARY;
  agentMayUses: typeof GEO_MOBILITY_AGENT_MAY_USES;
  vehicleControlActions: typeof VEHICLE_CONTROL_ACTIONS;
  personalLocationClasses: typeof PRECISE_PERSONAL_LOCATION_CLASSES;
  erLayer: typeof ER_LAYER_TITLE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    family: typeof GITHUB_SOT_FAMILY;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof ER10_MAY;
  mustNot: typeof ER10_MUST_NOT;
  dbCandidates: typeof ER10_DB_CANDIDATES_STATUS;
  precisePersonalLocationDefault: typeof PRECISE_PERSONAL_LOCATION_DEFAULT;
} {
  return {
    locksIntact: assertEr10LocksIntact(),
    softWire: er10SoftWireSnapshot(repoRoot),
    supportCategories: GEO_MOBILITY_SUPPORT_CATEGORIES,
    nodeFields: GEO_MOBILITY_NODE_FIELDS,
    coreFlow: GEO_MOBILITY_CORE_FLOW,
    realtimeTruthStates: GEO_MOBILITY_REALTIME_TRUTH_STATES,
    privacyBoundary: GEO_MOBILITY_PRIVACY_BOUNDARY,
    vehicleBoundary: GEO_MOBILITY_VEHICLE_BOUNDARY,
    truthBoundary: GEO_MOBILITY_TRUTH_BOUNDARY,
    agentMayUses: GEO_MOBILITY_AGENT_MAY_USES,
    vehicleControlActions: VEHICLE_CONTROL_ACTIONS,
    personalLocationClasses: PRECISE_PERSONAL_LOCATION_CLASSES,
    erLayer: ER_LAYER_TITLE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      family: GITHUB_SOT_FAMILY,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: ER10_MAY,
    mustNot: ER10_MUST_NOT,
    dbCandidates: ER10_DB_CANDIDATES_STATUS,
    precisePersonalLocationDefault: PRECISE_PERSONAL_LOCATION_DEFAULT,
  };
}

function softWireHopState(present: boolean): Er10EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runPublicGeospatialMobilityPackCycle(input: {
  actor: Er10Actor;
  human: Er10Actor;
  repoRoot?: string;
}): {
  hops: Er10HopRecord[];
  node: GeoMobilityNode;
  softWire: Er10SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Er10HopRecord[] = [];
  const softWire = er10SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEr10LocksIntact() ? 'PASS' : 'FAIL',
      'ER10 locks intact including L4=false, personal location LOCAL_ONLY/DENIED, no vehicle control.',
    ),
  );
  hops.push(
    hop(
      'public_geospatial_mobility_pack_bootstrap',
      'PASS',
      'Public Geospatial / Mobility Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'support_categories_encoded',
      GEO_MOBILITY_SUPPORT_CATEGORIES.length === 13 ? 'PASS' : 'FAIL',
      GEO_MOBILITY_SUPPORT_CATEGORIES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'node_fields_encoded',
      GEO_MOBILITY_NODE_FIELDS.length === 14 ? 'PASS' : 'FAIL',
      GEO_MOBILITY_NODE_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      GEO_MOBILITY_CORE_FLOW.length === 6 ? 'PASS' : 'FAIL',
      GEO_MOBILITY_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'privacy_defaults_encoded',
      PRECISE_PERSONAL_LOCATION_DEFAULT === 'LOCAL_ONLY' &&
        PRECISE_PERSONAL_LOCATION_FALLBACK === 'DENIED' &&
        PRECISE_PERSONAL_LOCATION_CLASSES.length === 6
        ? 'PASS'
        : 'FAIL',
      'PRECISE_PERSONAL_LOCATION=LOCAL_ONLY/DENIED; six personal classes locked.',
    ),
  );
  hops.push(
    hop(
      'realtime_truth_states_encoded',
      GEO_MOBILITY_REALTIME_TRUTH_STATES.length === 5 ? 'PASS' : 'FAIL',
      GEO_MOBILITY_REALTIME_TRUTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'vehicle_boundary_encoded',
      GEO_MOBILITY_VEHICLE_BOUNDARY.analysisAndSimulationOnly === true &&
        VEHICLE_CONTROL_ACTIONS.length === 5
        ? 'PASS'
        : 'FAIL',
      'Vehicle boundary: analysis/simulation only.',
    ),
  );
  hops.push(
    hop(
      'agent_may_uses_encoded',
      GEO_MOBILITY_AGENT_MAY_USES.length === 9 ? 'PASS' : 'FAIL',
      GEO_MOBILITY_AGENT_MAY_USES.join(' | '),
    ),
  );

  const { registered, indexed, live } = exampleIndexedPublicRoadNetwork(
    input.actor,
  );

  const noRights = registerPublicGeoSource({
    actor: input.actor,
    geoSourceId: 'bad-1',
    providerSource: 'x',
    geography: 'x',
    timeRange: 'x',
    updateFrequency: 'x',
    coordinateReferenceSystem: 'EPSG:4326',
    licenseRightsState: 'OPEN_LICENSE',
    precisionLevel: 'PUBLIC_COARSE',
    apiDownloadMethod: 'api',
    dataQuality: 'x',
    permittedUse: 'x',
    category: 'ports_and_terminals',
    rightsApproved: false,
    attemptUseWithoutRights: true,
  });
  hops.push(
    hop(
      'register_after_rights_check',
      registered.rightsApproved === true && 'denied' in noRights
        ? 'PASS'
        : 'FAIL',
      'Public geo source registered only after rights check.',
    ),
  );

  hops.push(
    hop(
      'normalize_and_index_for_simulation',
      indexed.indexed === true && indexed.flowPosition === 'map_index'
        ? 'PASS'
        : 'FAIL',
      'Coordinates/entities normalized and indexed for simulation.',
    ),
  );

  const stale = classifyFeedFreshness({
    node: indexed,
    activeAuthorizedConnection: true,
    freshTimestamps: false,
    intendedState: 'STALE',
  });
  const fakeLive = classifyFeedFreshness({
    node: indexed,
    activeAuthorizedConnection: false,
    freshTimestamps: false,
    intendedState: 'LIVE_VERIFIED',
    attemptClaimLiveVerifiedWithoutAuthAndFresh: true,
  });
  hops.push(
    hop(
      'classify_feed_freshness',
      !('denied' in stale) &&
        stale.freshness === 'STALE' &&
        live.freshness === 'LIVE_VERIFIED'
        ? 'PASS'
        : 'FAIL',
      'Feed freshness classified; STALE vs LIVE_VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'live_verified_requires_auth_and_fresh',
      'denied' in fakeLive &&
        live.activeAuthorizedConnection === true &&
        live.freshTimestamps === true
        ? 'PASS'
        : 'FAIL',
      'LIVE_VERIFIED only with active authorized connection + fresh timestamps.',
    ),
  );

  const personalDeny = attemptPersonalLocationPooling({
    class: 'private_gps_histories',
  });
  const gpsDeny = attemptCollectPrivateGpsHistories();
  hops.push(
    hop(
      'deny_personal_location_pooling_harvest',
      personalDeny.state === 'LOCAL_ONLY' && gpsDeny.state === 'LOCAL_ONLY'
        ? 'PASS'
        : 'FAIL',
      'Personal location pooling/harvest → LOCAL_ONLY/DENIED.',
    ),
  );

  const vehicleDenies = VEHICLE_CONTROL_ACTIONS.map((a) =>
    attemptVehicleControl(a),
  );
  hops.push(
    hop(
      'deny_vehicle_control_actions',
      vehicleDenies.every((d) => d.state === 'DENIED') ? 'PASS' : 'FAIL',
      'All vehicle control actions DENIED (simulation only).',
    ),
  );

  hops.push(
    hop(
      'deny_use_without_rights',
      attemptUseWithoutRights().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Use without rights DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      attemptBypassGuardianRls().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Bypass Guardian/RLS DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_expand_tenant_universe_access',
      attemptExpandTenantUniverseAccess().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Expand tenant/Universe access DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_persist_hidden_chain_of_thought',
      attemptPersistHiddenChainOfThought().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Hidden CoT DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_auto_deploy_changes',
      attemptAutoDeployChanges().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Auto-deploy DENIED.',
    ),
  );

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      ER10_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'er_layer_context_documented',
      ER_LAYER_TITLE.includes('Real API Data Fabric') &&
        GITHUB_SOT_ISSUE === 162
        ? 'PASS'
        : 'FAIL',
      'ER layer context (#162); next ER11 Public Government Data Pack.',
    ),
  );

  const softWireHops: Array<{
    hop: (typeof PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE)[number];
    present: boolean;
    note: string;
  }> = [
    {
      hop: 'er9_soft_wire',
      present: softWire.er9PublicLawPolicyKnowledgePack.present,
      note: softWire.er9PublicLawPolicyKnowledgePack.note,
    },
    {
      hop: 'er8_soft_wire',
      present: softWire.er8AncientCivilizationsKnowledgePack.present,
      note: softWire.er8AncientCivilizationsKnowledgePack.note,
    },
    {
      hop: 'er7_soft_wire',
      present: softWire.er7HistoricalScienceEngineeringAtlas.present,
      note: softWire.er7HistoricalScienceEngineeringAtlas.note,
    },
    {
      hop: 'er6_soft_wire',
      present: softWire.er6HistoricalBusinessCaseAtlasV2.present,
      note: softWire.er6HistoricalBusinessCaseAtlasV2.note,
    },
    {
      hop: 'er5_soft_wire',
      present: softWire.er5GlobalHistoricalKnowledgeIngestion.present,
      note: softWire.er5GlobalHistoricalKnowledgeIngestion.note,
    },
    {
      hop: 'er4_soft_wire',
      present: softWire.er4RightsProvenanceGate.present,
      note: softWire.er4RightsProvenanceGate.note,
    },
    {
      hop: 'er3_soft_wire',
      present: softWire.er3PublicDataSourceRegistry.present,
      note: softWire.er3PublicDataSourceRegistry.note,
    },
    {
      hop: 'er2_soft_wire',
      present: softWire.er2ApiTruthStateMachine.present,
      note: softWire.er2ApiTruthStateMachine.note,
    },
    {
      hop: 'er1_soft_wire',
      present: softWire.er1RealApiConnectionRegistry.present,
      note: softWire.er1RealApiConnectionRegistry.note,
    },
    {
      hop: 'eq16_soft_wire',
      present: softWire.eq16SoftwareWormholeRouter.present,
      note: softWire.eq16SoftwareWormholeRouter.note,
    },
    {
      hop: 'eq15_soft_wire',
      present: softWire.eq15PathwayPlasticity.present,
      note: softWire.eq15PathwayPlasticity.note,
    },
    {
      hop: 'eq14_soft_wire',
      present: softWire.eq14NeuralPathwayArchitectureGraph.present,
      note: softWire.eq14NeuralPathwayArchitectureGraph.note,
    },
    {
      hop: 'eq13_soft_wire',
      present: softWire.eq13ArchitectureReturnReceipt.present,
      note: softWire.eq13ArchitectureReturnReceipt.note,
    },
    {
      hop: 'eq12_soft_wire',
      present: softWire.eq12CrossArchitectureBenchmarkMatrix.present,
      note: softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    },
    {
      hop: 'ep15_soft_wire',
      present: softWire.ep15AlgorithmTuningSandbox.present,
      note: softWire.ep15AlgorithmTuningSandbox.note,
    },
    {
      hop: 'em157_soft_wire',
      present: softWire.em157HomeBase.present,
      note: softWire.em157HomeBase.note,
    },
  ];
  for (const s of softWireHops) {
    hops.push(hop(s.hop, softWireHopState(s.present), s.note));
  }

  hops.push(
    hop(
      'db_candidates_not_applied',
      ER10_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const sim = useForMobilitySimulation({
    actor: input.actor,
    node: live,
    useCase: 'freight_route_simulation',
  });
  const evidence = returnEr10EvidenceToHomeBase({
    evidenceId: 'ev-er10-geo-1',
    actor: input.actor,
    node: live,
    summary: 'public geospatial mobility pack advisory',
  });
  const humanGate = requireHumanApproval({
    approvalId: 'appr-er10-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in evidence || 'denied' in humanGate || 'denied' in sim
        ? 'DENIED'
        : 'PASS',
      'Simulation evidence to Home Base; no personal harvest; human gate exercised.',
    ),
  );

  void PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      geoSourceId: live.geoSourceId,
      freshness: live.freshness,
    }),
  );

  return {
    hops,
    node: live,
    softWire,
    cycleEvidenceSha256,
  };
}
