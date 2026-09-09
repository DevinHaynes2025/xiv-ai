/**
 * 62L-ER10 — Public Geospatial / Mobility Pack denial + honesty tests.
 *
 * Script: npm run test:62ler10
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
  er10SoftWireSnapshot,
  type Er10Actor,
} from './public-geospatial-mobility-pack-types.ts';

import {
  attemptAutoDeployChanges,
  attemptClaimLiveVerifiedWithoutAuthAndFresh,
  attemptCollectDeviceLocation,
  attemptCollectPrivateGpsHistories,
  attemptHarvestDrivingRoutes,
  attemptHarvestVehicleTelemetry,
  attemptPersonalLocationPooling,
  attemptPoolHomeWorkLocations,
  attemptPoolTripHistories,
  attemptRecommendAsAct,
  attemptUseWithoutRights,
  attemptVehicleControl,
  bootstrapPublicGeospatialMobilityPack,
  classifyFeedFreshness,
  exampleIndexedPublicRoadNetwork,
  normalizeAndIndexForSimulation,
  probeGuardianRlsTenantUniverseIsolation,
  registerPublicGeoSource,
  requireHumanApproval,
  returnEr10EvidenceToHomeBase,
  runPublicGeospatialMobilityPackCycle,
  useForMobilitySimulation,
} from './public-geospatial-mobility-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er10Actor = {
  kind: 'mobility_agent',
  id: 'mob-1',
  orgId: 'org-er10',
  tenantId: 'ten-er10',
  universeId: 'uni-er10',
  permissions: ['draft'],
};

const human: Er10Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er10',
  tenantId: 'ten-er10',
  universeId: 'uni-er10',
  permissions: ['approve_consequential'],
};

test('SoT label ER10 / #162; Public Geospatial Mobility Pack; next ER11', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER10');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Public Geospatial \/ Mobility Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER11/);
  assert.match(NEXT_PHASE_TITLE, /Public Government Data Pack/);
  assert.match(ER_LAYER_TITLE, /Real API Data Fabric/);
});

test('honesty locks: L4 false; personal location LOCAL_ONLY/DENIED; no vehicle control; DB NOT_APPLIED', () => {
  assert.equal(assertEr10LocksIntact(), true);
  assert.equal(ER10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER10_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(PRECISE_PERSONAL_LOCATION_DEFAULT, 'LOCAL_ONLY');
  assert.equal(PRECISE_PERSONAL_LOCATION_FALLBACK, 'DENIED');
  assert.equal(ER10_LOCKS.LIVE_STEERING, false);
  assert.equal(ER10_LOCKS.SAFETY_CRITICAL_VEHICLE_CONTROL, false);
  assert.equal(ER10_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    GEO_MOBILITY_PRIVACY_BOUNDARY.mayCollectPrivateGpsHistoriesWithoutOptIn,
    false,
  );
  assert.equal(GEO_MOBILITY_VEHICLE_BOUNDARY.analysisAndSimulationOnly, true);
  assert.equal(ER10_AGENT_BOUNDS.mayLiveSteerBrakeThrottle, false);
});

test('categories + node fields + core flow + truth states + may-uses encoded', () => {
  assert.equal(GEO_MOBILITY_SUPPORT_CATEGORIES.length, 13);
  assert.ok(
    GEO_MOBILITY_SUPPORT_CATEGORIES.includes('public_open_road_networks'),
  );
  assert.ok(GEO_MOBILITY_SUPPORT_CATEGORIES.includes('ev_charging_locations'));
  assert.equal(GEO_MOBILITY_NODE_FIELDS.length, 14);
  assert.ok(GEO_MOBILITY_NODE_FIELDS.includes('geoSourceId'));
  assert.ok(GEO_MOBILITY_NODE_FIELDS.includes('coordinateReferenceSystem'));
  assert.deepEqual([...GEO_MOBILITY_CORE_FLOW], [
    'authorized_source',
    'rights_check',
    'normalize_coordinates_entities',
    'map_index',
    'route_simulation_use',
    'evidence',
  ]);
  assert.deepEqual([...GEO_MOBILITY_REALTIME_TRUTH_STATES], [
    'LIVE_VERIFIED',
    'HISTORICAL',
    'STALE',
    'SIMULATED',
    'UNKNOWN',
  ]);
  assert.equal(PRECISE_PERSONAL_LOCATION_CLASSES.length, 6);
  assert.equal(GEO_MOBILITY_AGENT_MAY_USES.length, 9);
  assert.equal(VEHICLE_CONTROL_ACTIONS.length, 5);
  assert.ok(ER10_MAY.includes('freight_route_and_fleet_scenario_simulation'));
  assert.ok(
    ER10_MUST_NOT.includes(
      'live_steering_braking_throttle_ecu_or_safety_critical_vehicle_control',
    ),
  );
  assert.equal(
    GEO_MOBILITY_TRUTH_BOUNDARY.mayClaimLiveVerifiedWithoutAuthAndFresh,
    false,
  );
});

test('register after rights; normalize/index; LIVE_VERIFIED requires auth+fresh', () => {
  assert.equal(
    registerPublicGeoSource({
      actor: agent,
      geoSourceId: 'g0',
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
      category: 'rail_networks',
      rightsApproved: false,
    }).state,
    'DENIED',
  );
  assert.equal(attemptUseWithoutRights().state, 'DENIED');

  const { registered, indexed, live } = exampleIndexedPublicRoadNetwork(agent);
  assert.equal(registered.rightsApproved, true);
  assert.equal(indexed.indexed, true);
  assert.equal(live.freshness, 'LIVE_VERIFIED');

  const stale = classifyFeedFreshness({
    node: indexed,
    activeAuthorizedConnection: true,
    freshTimestamps: false,
    intendedState: 'STALE',
  });
  assert.ok(!('denied' in stale));
  assert.equal(stale.freshness, 'STALE');

  assert.equal(
    classifyFeedFreshness({
      node: indexed,
      activeAuthorizedConnection: false,
      freshTimestamps: false,
      intendedState: 'LIVE_VERIFIED',
      attemptClaimLiveVerifiedWithoutAuthAndFresh: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptClaimLiveVerifiedWithoutAuthAndFresh().state, 'DENIED');

  const sim = useForMobilitySimulation({
    actor: agent,
    node: live,
    useCase: 'ev_charging_planning',
  });
  assert.ok(!('denied' in sim));
  assert.equal(sim.simulationOnly, true);
  assert.equal(sim.vehicleControl, false);
});

test('privacy: personal location pooling/harvest → LOCAL_ONLY/DENIED', () => {
  assert.equal(attemptCollectPrivateGpsHistories().state, 'LOCAL_ONLY');
  assert.equal(attemptPoolHomeWorkLocations().state, 'LOCAL_ONLY');
  assert.equal(attemptHarvestDrivingRoutes().state, 'LOCAL_ONLY');
  assert.equal(attemptCollectDeviceLocation().state, 'LOCAL_ONLY');
  assert.equal(attemptPoolTripHistories().state, 'LOCAL_ONLY');
  assert.equal(attemptHarvestVehicleTelemetry().state, 'LOCAL_ONLY');

  for (const cls of PRECISE_PERSONAL_LOCATION_CLASSES) {
    const r = attemptPersonalLocationPooling({ class: cls });
    assert.equal(r.state, 'LOCAL_ONLY', cls);
  }

  const personalAsPublic = registerPublicGeoSource({
    actor: agent,
    geoSourceId: 'personal-1',
    providerSource: 'device',
    geography: 'user',
    timeRange: 'now',
    updateFrequency: 'realtime',
    coordinateReferenceSystem: 'EPSG:4326',
    licenseRightsState: 'OPEN_LICENSE',
    precisionLevel: 'PERSONAL_PRECISE',
    apiDownloadMethod: 'device',
    dataQuality: 'n/a',
    permittedUse: 'none',
    category: 'public_open_road_networks',
    rightsApproved: true,
  });
  assert.equal(personalAsPublic.state, 'LOCAL_ONLY');
});

test('vehicle control actions all DENIED; guardian isolation holds', () => {
  for (const action of VEHICLE_CONTROL_ACTIONS) {
    assert.equal(attemptVehicleControl(action).state, 'DENIED', action);
  }
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(attemptAutoDeployChanges().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('bootstrap + soft-wire + cycle; ER2/ER1 PRESENT; EQ14 WAITING_DATA ok', () => {
  const boot = bootstrapPublicGeospatialMobilityPack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.supportCategories.length, 13);
  assert.equal(boot.nodeFields.length, 14);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER11/);
  assert.equal(boot.precisePersonalLocationDefault, 'LOCAL_ONLY');

  const soft = er10SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  // ER9 may be PRESENT on disk from concurrent parks; presence ≠ VERIFIED.
  // EQ14 remains WAITING_DATA when absent (not FAIL).
  assert.equal(soft.eq14NeuralPathwayArchitectureGraph.present, false);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);

  const { live } = exampleIndexedPublicRoadNetwork(agent);
  const reIndex = normalizeAndIndexForSimulation({
    actor: agent,
    node: {
      ...live,
      indexed: false,
      flowPosition: 'rights_check',
    },
  });
  assert.ok(!('denied' in reIndex));

  const ev = returnEr10EvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    node: live,
    summary: 'geo mobility advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.personalLocationHarvested, false);
  assert.equal(ev.vehicleControl, false);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runPublicGeospatialMobilityPackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of PUBLIC_GEOSPATIAL_MOBILITY_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er9Hop = cycle.hops.find((h) => h.hop === 'er9_soft_wire');
  assert.ok(er9Hop);
  assert.ok(
    er9Hop.state === 'WAITING_DATA' || er9Hop.state === 'PASS',
    `er9_soft_wire must be WAITING_DATA or PASS, got ${er9Hop.state}`,
  );

  const eq14Hop = cycle.hops.find((h) => h.hop === 'eq14_soft_wire');
  assert.ok(eq14Hop);
  assert.equal(eq14Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const softWireHops = cycle.hops.filter((h) => h.hop.endsWith('_soft_wire'));
  for (const h of softWireHops) {
    assert.ok(
      h.state === 'PASS' || h.state === 'WAITING_DATA',
      `${h.hop} must not FAIL (got ${h.state})`,
    );
  }

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.node.freshness, 'LIVE_VERIFIED');
});
