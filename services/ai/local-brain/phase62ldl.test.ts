import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  bootstrapBusinessMediaSocialGraph,
  businessMediaSocialGraphHonesty,
  shareOnBusinessMediaSocialGraph,
} from './business-media-social-graph';
import {
  bootstrapDistributedEdgeMicroserverFabric,
  distributedEdgeMicroserverFabricHonesty,
  enrollEdgeMicroserver,
  proposeEdgeMicroserverCandidate,
  queryEdgeMicroserverAvailability,
} from './distributed-edge-microserver-fabric';
import {
  bootstrapHistoricalTechnologyMemoryLake,
  historicalTechnologyMemoryLakeHonesty,
  ingestTechHistoryLakeEntry,
} from './historical-technology-memory-lake';
import {
  bootstrapNeuralHighwayTransportGovernor,
  neuralHighwayTransportGovernorHonesty,
  registerRoutePolicy,
  revokeRoutePolicy,
  saturateActiveTransportsForCongestionTest,
  transportOnHighway,
} from './neural-highway-transport-governor';
import {
  bootstrapNeuralTransportationOs,
  neuralTransportationOsHonesty,
  registerTransportOsSurface,
} from './neural-transportation-os';
import {
  BUSINESS_MEDIA_OPT_IN_DENIED,
  CONGESTION_CONTROL_ENGAGED,
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_TRANSPORTS,
  NEURAL_TRANSPORTATION_OS_CYCLE,
  NEXT_PHASE_TITLE,
  NO_POWERED_NODE_WAITING_OR_STOPPED,
  REVOKED_ROUTE_REJECTED,
  ROUTE_WITHOUT_POLICY_DENIED,
  SEALED_SILENT_ROUTE_DENIED,
  STALE_HEARTBEAT_NOT_RUNNING_VERIFIED,
  SUPPLY_CHAIN_FORECAST_NOT_FACT,
  UNAUTHORIZED_TECH_LAKE_DENIED,
  UNENROLLED_MICROSERVER_UNAVAILABLE,
  UNSIGNED_UNAUDITED_REJECTED,
  WORMHOLE_ZERO_TRUST_BYPASS_DENIED,
  predecessorMap,
  type DlActor,
} from './neural-transportation-os-types';
import {
  buildNeuralTransportationOsHealthReport,
  runNeuralTransportationOsCycle,
} from './neural-transportation-os-runtime';
import {
  bootstrapSupplyChainIntelligenceHighway,
  submitSupplyChainIntelligenceForecast,
  supplyChainIntelligenceHighwayHonesty,
} from './supply-chain-intelligence-highway';
import {
  bootstrapVerifiedAlwaysOnAgentShiftNetwork,
  claimShiftRunningVerified,
  recordShiftNodeHeartbeat,
  registerAgentShift,
  registerShiftPoweredNode,
  scheduleAlwaysOnShiftWithoutPoweredNode,
  verifiedAlwaysOnAgentShiftNetworkHonesty,
} from './verified-always-on-agent-shift-network';
import {
  bootstrapZeroTrustPrivacyUniverseGateway,
  clearZeroTrustGatewayTransit,
  zeroTrustPrivacyUniverseGatewayHonesty,
} from './zero-trust-privacy-universe-gateway';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldl-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DlActor = {
  kind: 'transport_os_governor',
  id: 'governor-dl-1',
  orgId: 'org-dl',
  tenantId: 'tenant-dl',
  universeId: 'univ-dl',
  role: 'governor',
  permissionLevel: 1,
  authorityLevel: 0,
  declaredAgeYears: 30,
};

try {
  check(
    'US-DL1-cycle',
    NEURAL_TRANSPORTATION_OS_CYCLE.join(' → ') ===
      'honesty_locks → neural_transportation_os_bootstrap → route_without_policy_allowlist_denied → congestion_control_engages_under_pressure → revoked_route_rejected → unsigned_unaudited_transport_rejected → sealed_raw_private_cannot_silent_route → no_powered_node_waiting_or_offline_stopped → stale_heartbeat_not_running_verified → unauthorized_tech_history_lake_intake_denied → unenrolled_microserver_unavailable → business_media_share_without_opt_in_denied → supply_chain_forecast_not_verified_fact → wormhole_cannot_bypass_zero_trust_gateway → evidence → learning',
    'Neural Transportation OS cycle recorded in order.',
  );

  check(
    'US-DL-locks',
    DL_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DL_LOCKS.ROUTE_WITHOUT_POLICY_ALLOWLIST === false &&
      DL_LOCKS.UNBOUNDED_TRANSPORT_SPAWN === false &&
      DL_LOCKS.REVOKED_ROUTE_ACCEPTED === false &&
      DL_LOCKS.UNSIGNED_UNAUDITED_TRANSPORT_WHERE_REQUIRED === false &&
      DL_LOCKS.SEALED_RAW_PRIVATE_SILENT_ROUTE === false &&
      DL_LOCKS.WORMHOLE_BYPASS_ZERO_TRUST_GATEWAY === false &&
      DL_LOCKS.FAKE_247_RUNNING_WITHOUT_NODE === false &&
      DL_LOCKS.STALE_HEARTBEAT_EQ_RUNNING_VERIFIED === false &&
      DL_LOCKS.UNAUTHORIZED_TECH_HISTORY_LAKE_INTAKE === false &&
      DL_LOCKS.UNENROLLED_MICROSERVER_AVAILABLE === false &&
      DL_LOCKS.EDGE_MICROSERVER_STEALTH_INSTALL === false &&
      DL_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN === false &&
      DL_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT === false &&
      DL_LOCKS.LIVE_SUPABASE_APPLY === false &&
      DL_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-DL-honesty-surfaces',
    neuralTransportationOsHonesty().l4AutonomyEnabled === false &&
      neuralHighwayTransportGovernorHonesty().congestionControlRequired === true &&
      historicalTechnologyMemoryLakeHonesty().techHistoryLakeRequiresProvenance === true &&
      verifiedAlwaysOnAgentShiftNetworkHonesty().fake247RunningWithoutNode === false &&
      distributedEdgeMicroserverFabricHonesty().edgeMicroserverCandidatesNotApplied === true &&
      zeroTrustPrivacyUniverseGatewayHonesty().privacyGatewayDenyByDefault === true &&
      businessMediaSocialGraphHonesty().businessMediaOptInRequired === true &&
      supplyChainIntelligenceHighwayHonesty().supplyChainForecastNeqFact === true,
    'Subsystem honesty surfaces deny-by-default.',
  );

  check(
    'US-DL-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-DM —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-DL-predecessor-DK-or-better',
    preds.DK.tipProbe === 'PRESENT' ||
      preds.DJ.tipProbe === 'PRESENT' ||
      preds.DI.tipProbe === 'PRESENT' ||
      preds.DH.tipProbe === 'PRESENT' ||
      preds.DG.tipProbe === 'PRESENT' ||
      preds.DF.tipProbe === 'PRESENT',
    `DK=${preds.DK.tipProbe}/${preds.DK.report}; DJ=${preds.DJ.tipProbe}/${preds.DJ.report}; DI=${preds.DI.tipProbe}/${preds.DI.report}; DH=${preds.DH.tipProbe}/${preds.DH.report}; DG=${preds.DG.tipProbe}/${preds.DG.report}; DF=${preds.DF.tipProbe}/${preds.DF.report}`,
  );

  const os = await bootstrapNeuralTransportationOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'US-DL-bootstrap-predecessor-DK',
    os.predecessorLayer === 'DK' &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.productionAuthorized === false,
    `predecessor=${os.predecessorLayer}`,
  );
  await registerTransportOsSurface({
    osId: os.id,
    surface: 'highway_policy_board',
    root,
    actor,
  });

  const governor = await bootstrapNeuralHighwayTransportGovernor({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  const noPolicy = await transportOnHighway({
    governorId: governor.id,
    routeId: 'no-policy',
    cargoKind: 'knowledge',
    from: 'a',
    to: 'b',
    signed: true,
    audited: true,
    root,
    actor,
  });
  check(
    'US-DL-route-without-policy-allowlist-denied',
    noPolicy.accepted === false && noPolicy.reason === ROUTE_WITHOUT_POLICY_DENIED,
    noPolicy.reason,
  );

  const policy = await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'pressure-route',
    allowlist: [actor.id],
    requireSignature: true,
    requireAudit: true,
    root,
    actor,
  });
  check('US-DL-policy-registered', policy.accepted === true, policy.reason);

  const filled = await saturateActiveTransportsForCongestionTest({
    governorId: governor.id,
    routeId: 'pressure-route',
    count: MAX_ACTIVE_TRANSPORTS,
    root,
    actor,
  });
  const congested = await transportOnHighway({
    governorId: governor.id,
    routeId: 'pressure-route',
    cargoKind: 'task',
    from: 'p-src',
    to: 'p-dst',
    signed: true,
    audited: true,
    root,
    actor,
  });
  check(
    'US-DL-congestion-control-engages-under-pressure',
    filled === MAX_ACTIVE_TRANSPORTS &&
      congested.accepted === false &&
      congested.reason === CONGESTION_CONTROL_ENGAGED &&
      congested.transport?.status === 'BOUNDED',
    `filled=${filled}; ${congested.reason}`,
  );

  const revPol = await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'revocable',
    allowlist: [actor.id],
    root,
    actor,
  });
  await revokeRoutePolicy({ policyId: revPol.policy!.id, root, actor });
  const revoked = await transportOnHighway({
    governorId: governor.id,
    routeId: 'revocable',
    cargoKind: 'event',
    from: 'r1',
    to: 'r2',
    signed: true,
    audited: true,
    root,
    actor,
  });
  check(
    'US-DL-revoked-route-rejected',
    revoked.accepted === false && revoked.reason === REVOKED_ROUTE_REJECTED,
    revoked.reason,
  );

  await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'signed-route',
    allowlist: [actor.id],
    requireSignature: true,
    requireAudit: true,
    root,
    actor,
  });
  const unsigned = await transportOnHighway({
    governorId: governor.id,
    routeId: 'signed-route',
    cargoKind: 'storage',
    from: 's1',
    to: 's2',
    signed: false,
    audited: false,
    root,
    actor,
  });
  check(
    'US-DL-unsigned-unaudited-transport-rejected',
    unsigned.accepted === false && unsigned.reason === UNSIGNED_UNAUDITED_REJECTED,
    unsigned.reason,
  );

  const sealed = await transportOnHighway({
    governorId: governor.id,
    routeId: 'signed-route',
    cargoKind: 'agent_handoff',
    from: 'sealed',
    to: 'hwy',
    sealedOrRawPrivate: true,
    silentRoute: true,
    signed: false,
    audited: false,
    root,
    actor,
  });
  check(
    'US-DL-sealed-raw-private-cannot-silent-route',
    sealed.accepted === false && sealed.reason === SEALED_SILENT_ROUTE_DENIED,
    sealed.reason,
  );

  const shiftNet = await bootstrapVerifiedAlwaysOnAgentShiftNetwork({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const shift = await registerAgentShift({
    networkId: shiftNet.id,
    name: 'night-shift-1',
    root,
    actor,
  });
  const waiting = await scheduleAlwaysOnShiftWithoutPoweredNode({
    shiftId: shift.shift!.id,
    root,
    actor,
  });
  check(
    'US-DL-no-powered-node-waiting-or-offline-stopped',
    waiting.accepted === false &&
      waiting.reason === NO_POWERED_NODE_WAITING_OR_STOPPED &&
      (waiting.shift?.status === 'WAITING_NODE' ||
        waiting.shift?.status === 'OFFLINE_STOPPED') &&
      waiting.shift?.status !== 'RUNNING_VERIFIED',
    `${waiting.reason}; status=${waiting.shift?.status}`,
  );

  const powered = await registerShiftPoweredNode({
    networkId: shiftNet.id,
    name: 'node-stale',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  const staleAt = new Date(Date.now() - 120_000).toISOString();
  await recordShiftNodeHeartbeat({
    nodeId: powered.node!.id,
    runtimeEvidence: 'stale-evidence',
    at: staleAt,
    root,
    actor,
  });
  const staleClaim = await claimShiftRunningVerified({
    shiftId: shift.shift!.id,
    nodeId: powered.node!.id,
    nowMs: Date.now(),
    root,
    actor,
  });
  check(
    'US-DL-stale-heartbeat-not-running-verified',
    staleClaim.accepted === false &&
      staleClaim.reason === STALE_HEARTBEAT_NOT_RUNNING_VERIFIED &&
      staleClaim.shift?.status !== 'RUNNING_VERIFIED',
    `${staleClaim.reason}; status=${staleClaim.shift?.status}`,
  );

  const freshNode = await registerShiftPoweredNode({
    networkId: shiftNet.id,
    name: 'node-fresh',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordShiftNodeHeartbeat({
    nodeId: freshNode.node!.id,
    runtimeEvidence: 'fresh-runtime-proof',
    root,
    actor,
  });
  const freshClaim = await claimShiftRunningVerified({
    shiftId: shift.shift!.id,
    nodeId: freshNode.node!.id,
    root,
    actor,
  });
  check(
    'US-DL-fresh-heartbeat-running-verified-evidence-path',
    freshClaim.accepted === true && freshClaim.shift?.status === 'RUNNING_VERIFIED',
    freshClaim.reason,
  );

  const lake = await bootstrapHistoricalTechnologyMemoryLake({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const lakeDeny = await ingestTechHistoryLakeEntry({
    lakeId: lake.id,
    sourceId: 'bad-src',
    title: 'Unauthorized tech',
    authorized: false,
    root,
    actor,
  });
  check(
    'US-DL-unauthorized-tech-history-lake-intake-denied',
    lakeDeny.accepted === false && lakeDeny.reason === UNAUTHORIZED_TECH_LAKE_DENIED,
    lakeDeny.reason,
  );

  const edge = await bootstrapDistributedEdgeMicroserverFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const candidate = await proposeEdgeMicroserverCandidate({
    fabricId: edge.id,
    name: 'ms-1',
    root,
    actor,
  });
  const unenrolled = await queryEdgeMicroserverAvailability({
    serverId: candidate.server!.id,
    root,
    actor,
  });
  check(
    'US-DL-unenrolled-microserver-unavailable',
    unenrolled.available === false &&
      unenrolled.reason === UNENROLLED_MICROSERVER_UNAVAILABLE,
    unenrolled.reason,
  );
  await enrollEdgeMicroserver({ serverId: candidate.server!.id, root, actor });
  const enrolled = await queryEdgeMicroserverAvailability({
    serverId: candidate.server!.id,
    root,
    actor,
  });
  check(
    'US-DL-enrolled-microserver-available-candidate',
    enrolled.available === true && enrolled.server?.appliedToProduction === false,
    enrolled.reason,
  );
  const stealth = await proposeEdgeMicroserverCandidate({
    fabricId: edge.id,
    name: 'stealth',
    stealthInstall: true,
    root,
    actor,
  });
  check(
    'US-DL-edge-stealth-install-denied',
    stealth.accepted === false,
    stealth.reason,
  );

  const graph = await bootstrapBusinessMediaSocialGraph({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const shareDeny = await shareOnBusinessMediaSocialGraph({
    graphId: graph.id,
    contentRef: 'media://post-1',
    toActorId: 'peer-a',
    optIn: false,
    declaredAgeYears: 30,
    root,
    actor,
  });
  check(
    'US-DL-business-media-share-without-opt-in-denied',
    shareDeny.accepted === false && shareDeny.reason === BUSINESS_MEDIA_OPT_IN_DENIED,
    shareDeny.reason,
  );

  const supply = await bootstrapSupplyChainIntelligenceHighway({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const forecastDeny = await submitSupplyChainIntelligenceForecast({
    highwayId: supply.id,
    skuOrLane: 'SKU-1',
    labelAsVerifiedFact: true,
    root,
    actor,
  });
  check(
    'US-DL-supply-chain-forecast-not-verified-fact',
    forecastDeny.accepted === false &&
      forecastDeny.reason === SUPPLY_CHAIN_FORECAST_NOT_FACT &&
      forecastDeny.forecast?.labeledVerifiedFact === false,
    forecastDeny.reason,
  );
  const forecastOk = await submitSupplyChainIntelligenceForecast({
    highwayId: supply.id,
    skuOrLane: 'SKU-2',
    provenanceRef: 'prov://lane',
    labelAsVerifiedFact: false,
    root,
    actor,
  });
  check(
    'US-DL-supply-forecast-labeled-forecast-ok',
    forecastOk.accepted === true &&
      forecastOk.forecast?.label === 'LABELED_FORECAST' &&
      forecastOk.forecast.labeledVerifiedFact === false,
    forecastOk.reason,
  );

  const gateway = await bootstrapZeroTrustPrivacyUniverseGateway({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const wormholeGw = await clearZeroTrustGatewayTransit({
    gatewayId: gateway.id,
    authorized: false,
    wormholeBypassAttempted: true,
    root,
    actor,
  });
  const wormholeTx = await transportOnHighway({
    governorId: governor.id,
    routeId: 'signed-route',
    cargoKind: 'community_object',
    from: 'wh',
    to: 'zt',
    wormholeBypassGateway: true,
    signed: true,
    audited: true,
    root,
    actor,
  });
  check(
    'US-DL-wormhole-cannot-bypass-zero-trust-gateway',
    wormholeGw.cleared === false &&
      wormholeGw.reason === WORMHOLE_ZERO_TRUST_BYPASS_DENIED &&
      wormholeTx.accepted === false &&
      wormholeTx.reason === WORMHOLE_ZERO_TRUST_BYPASS_DENIED,
    `${wormholeGw.reason}|${wormholeTx.reason}`,
  );

  const cycleRoot = join(root, 'cycle-iso');
  const cycle = await runNeuralTransportationOsCycle({
    orgId: 'org-dl-cycle',
    tenantId: 'tenant-dl-cycle',
    universeId: 'univ-dl-cycle',
    actor: { ...actor, orgId: 'org-dl-cycle', tenantId: 'tenant-dl-cycle', universeId: 'univ-dl-cycle' },
    root: cycleRoot,
    repoRoot,
  });
  check(
    'US-DL-cycle-runtime',
    cycle.ok === true &&
      cycle.hops.length === NEURAL_TRANSPORTATION_OS_CYCLE.length &&
      cycle.githubSotIssue === 129 &&
      cycle.gitlabCoordinationIssue === 63,
    `hops=${cycle.hops.length}; ok=${cycle.ok}; fail=${cycle.hops
      .filter((h) => h.state === 'FAIL')
      .map((h) => h.hop)
      .join(',')}`,
  );

  const health = await buildNeuralTransportationOsHealthReport({ root: repoRoot });
  check(
    'US-DL-health-report',
    health.phase === '62L-DL' &&
      health.honestyBanner === HONESTY_BANNER &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false &&
      health.nextPhaseTitle.startsWith('62L-DM —'),
    health.phase,
  );
} catch (error) {
  failures.push(`US-DL-uncaught: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} stories`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('PASS 62L-DL Neural Transportation OS honesty + isolation stories');
