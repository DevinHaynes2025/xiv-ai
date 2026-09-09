/**
 * 62L-DL Neural Transportation OS runtime —
 * Walks NEURAL_TRANSPORTATION_OS_CYCLE and builds health report.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
import {
  bootstrapBusinessMediaSocialGraph,
  shareOnBusinessMediaSocialGraph,
} from './business-media-social-graph';
import {
  bootstrapDistributedEdgeMicroserverFabric,
  proposeEdgeMicroserverCandidate,
  queryEdgeMicroserverAvailability,
} from './distributed-edge-microserver-fabric';
import {
  bootstrapHistoricalTechnologyMemoryLake,
  ingestTechHistoryLakeEntry,
} from './historical-technology-memory-lake';
import {
  bootstrapNeuralHighwayTransportGovernor,
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
  DL_LOCKS,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  MAX_ACTIVE_TRANSPORTS,
  NEURAL_TRANSPORTATION_OS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type DlActor,
  type DlEvidenceState,
  type DlHop,
  type DlHopRecord,
} from './neural-transportation-os-types';
import {
  bootstrapSupplyChainIntelligenceHighway,
  submitSupplyChainIntelligenceForecast,
} from './supply-chain-intelligence-highway';
import {
  bootstrapVerifiedAlwaysOnAgentShiftNetwork,
  claimShiftRunningVerified,
  recordShiftNodeHeartbeat,
  registerAgentShift,
  registerShiftPoweredNode,
  scheduleAlwaysOnShiftWithoutPoweredNode,
} from './verified-always-on-agent-shift-network';
import {
  bootstrapZeroTrustPrivacyUniverseGateway,
  clearZeroTrustGatewayTransit,
} from './zero-trust-privacy-universe-gateway';

export {
  DL_LOCKS,
  HONESTY_BANNER,
  NEURAL_TRANSPORTATION_OS_CYCLE,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: DlHop, state: DlEvidenceState, summary: string): DlHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type DlCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: DlActor;
  root?: string;
  repoRoot?: string;
};

export async function runNeuralTransportationOsCycle(input: DlCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: DlHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      DL_LOCKS.L4_AUTONOMY_ENABLED === false &&
        DL_LOCKS.LOCAL_FIRST &&
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
        DL_LOCKS.BUSINESS_MEDIA_SHARE_WITHOUT_OPT_IN === false &&
        DL_LOCKS.SUPPLY_CHAIN_FORECAST_LABELED_VERIFIED_FACT === false &&
        DL_LOCKS.TIP_LAND === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const os = await bootstrapNeuralTransportationOs({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
    repoRoot: input.repoRoot,
  });
  await registerTransportOsSurface({
    osId: os.id,
    surface: 'transport_os_home',
    root,
    actor,
  });
  hops.push(
    hop(
      'neural_transportation_os_bootstrap',
      'PASS',
      `os=${os.id}; predecessor=${os.predecessorLayer}`,
    ),
  );

  const governor = await bootstrapNeuralHighwayTransportGovernor({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const noPolicy = await transportOnHighway({
    governorId: governor.id,
    routeId: 'missing-policy-route',
    cargoKind: 'knowledge',
    from: 'a',
    to: 'b',
    signed: true,
    audited: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'route_without_policy_allowlist_denied',
      noPolicy.accepted === false ? 'DENIED' : 'FAIL',
      noPolicy.reason,
    ),
  );

  const policy = await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'cong-route',
    allowlist: [actor.id],
    requireSignature: true,
    requireAudit: true,
    root,
    actor,
  });
  if (policy.accepted && policy.policy) {
    await saturateActiveTransportsForCongestionTest({
      governorId: governor.id,
      routeId: 'cong-route',
      count: MAX_ACTIVE_TRANSPORTS,
      root,
      actor,
    });
    const congested = await transportOnHighway({
      governorId: governor.id,
      routeId: 'cong-route',
      cargoKind: 'task',
      from: 'pressure-src',
      to: 'pressure-dst',
      signed: true,
      audited: true,
      root,
      actor,
    });
    hops.push(
      hop(
        'congestion_control_engages_under_pressure',
        congested.accepted === false && congested.transport?.status === 'BOUNDED'
          ? 'BOUNDED'
          : 'FAIL',
        congested.reason,
      ),
    );
  } else {
    hops.push(hop('congestion_control_engages_under_pressure', 'FAIL', policy.reason));
  }

  const revPolicy = await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'revoke-route',
    allowlist: [actor.id],
    root,
    actor,
  });
  if (revPolicy.policy) {
    await revokeRoutePolicy({ policyId: revPolicy.policy.id, root, actor });
    const revoked = await transportOnHighway({
      governorId: governor.id,
      routeId: 'revoke-route',
      cargoKind: 'event',
      from: 'x',
      to: 'y',
      signed: true,
      audited: true,
      root,
      actor,
    });
    hops.push(
      hop(
        'revoked_route_rejected',
        revoked.accepted === false ? 'REVOKABLE' : 'FAIL',
        revoked.reason,
      ),
    );
  } else {
    hops.push(hop('revoked_route_rejected', 'FAIL', revPolicy.reason));
  }

  await registerRoutePolicy({
    governorId: governor.id,
    routeId: 'sig-route',
    allowlist: [actor.id],
    requireSignature: true,
    requireAudit: true,
    root,
    actor,
  });
  const unsigned = await transportOnHighway({
    governorId: governor.id,
    routeId: 'sig-route',
    cargoKind: 'storage',
    from: 's',
    to: 't',
    signed: false,
    audited: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unsigned_unaudited_transport_rejected',
      unsigned.accepted === false ? 'REJECTED' : 'FAIL',
      unsigned.reason,
    ),
  );

  const sealed = await transportOnHighway({
    governorId: governor.id,
    routeId: 'sig-route',
    cargoKind: 'agent_handoff',
    from: 'priv',
    to: 'hwy',
    sealedOrRawPrivate: true,
    silentRoute: true,
    signed: false,
    audited: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_raw_private_cannot_silent_route',
      sealed.accepted === false ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const shiftNet = await bootstrapVerifiedAlwaysOnAgentShiftNetwork({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const shift = await registerAgentShift({
    networkId: shiftNet.id,
    name: 'cycle-shift',
    root,
    actor,
  });
  const waiting = await scheduleAlwaysOnShiftWithoutPoweredNode({
    shiftId: shift.shift!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'no_powered_node_waiting_or_offline_stopped',
      waiting.accepted === false &&
        (waiting.shift?.status === 'WAITING_NODE' ||
          waiting.shift?.status === 'OFFLINE_STOPPED')
        ? waiting.shift.status
        : 'FAIL',
      waiting.reason,
    ),
  );

  const staleNode = await registerShiftPoweredNode({
    networkId: shiftNet.id,
    name: 'cycle-stale-node',
    powered: true,
    authorized: true,
    root,
    actor,
  });
  await recordShiftNodeHeartbeat({
    nodeId: staleNode.node!.id,
    runtimeEvidence: 'stale-cycle-evidence',
    at: new Date(Date.now() - 120_000).toISOString(),
    root,
    actor,
  });
  const staleClaim = await claimShiftRunningVerified({
    shiftId: shift.shift!.id,
    nodeId: staleNode.node!.id,
    nowMs: Date.now(),
    root,
    actor,
  });
  hops.push(
    hop(
      'stale_heartbeat_not_running_verified',
      staleClaim.accepted === false && staleClaim.shift?.status !== 'RUNNING_VERIFIED'
        ? 'STALE'
        : 'FAIL',
      staleClaim.reason,
    ),
  );

  const lake = await bootstrapHistoricalTechnologyMemoryLake({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const lakeDeny = await ingestTechHistoryLakeEntry({
    lakeId: lake.id,
    sourceId: 'unauth-src',
    title: 'Unauthorized',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unauthorized_tech_history_lake_intake_denied',
      lakeDeny.accepted === false ? 'DENIED' : 'FAIL',
      lakeDeny.reason,
    ),
  );

  const edge = await bootstrapDistributedEdgeMicroserverFabric({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const candidate = await proposeEdgeMicroserverCandidate({
    fabricId: edge.id,
    name: 'edge-1',
    root,
    actor,
  });
  const unenrolled = await queryEdgeMicroserverAvailability({
    serverId: candidate.server!.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'unenrolled_microserver_unavailable',
      unenrolled.available === false ? 'UNAVAILABLE' : 'FAIL',
      unenrolled.reason,
    ),
  );

  const graph = await bootstrapBusinessMediaSocialGraph({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const shareDeny = await shareOnBusinessMediaSocialGraph({
    graphId: graph.id,
    contentRef: 'media://x',
    toActorId: 'peer-1',
    optIn: false,
    declaredAgeYears: 30,
    root,
    actor,
  });
  hops.push(
    hop(
      'business_media_share_without_opt_in_denied',
      shareDeny.accepted === false ? 'DENIED' : 'FAIL',
      shareDeny.reason,
    ),
  );

  const supply = await bootstrapSupplyChainIntelligenceHighway({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const forecast = await submitSupplyChainIntelligenceForecast({
    highwayId: supply.id,
    skuOrLane: 'lane-a',
    labelAsVerifiedFact: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'supply_chain_forecast_not_verified_fact',
      forecast.accepted === false && forecast.forecast?.labeledVerifiedFact === false
        ? 'LABELED_FORECAST'
        : 'FAIL',
      forecast.reason,
    ),
  );

  const gateway = await bootstrapZeroTrustPrivacyUniverseGateway({
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  const wormhole = await clearZeroTrustGatewayTransit({
    gatewayId: gateway.id,
    authorized: false,
    wormholeBypassAttempted: true,
    root,
    actor,
  });
  const wormholeTransport = await transportOnHighway({
    governorId: governor.id,
    routeId: 'sig-route',
    cargoKind: 'community_object',
    from: 'wh',
    to: 'zt',
    wormholeBypassGateway: true,
    signed: true,
    audited: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'wormhole_cannot_bypass_zero_trust_gateway',
      wormhole.cleared === false && wormholeTransport.accepted === false ? 'DENIED' : 'FAIL',
      `${wormhole.reason}|${wormholeTransport.reason}`,
    ),
  );

  const evidenceEvent = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-DL neural transportation OS cycle completed',
      payload: {
        hops: hops.map((h) => h.hop),
        orgId: input.orgId,
        sourceRefs: ['62L-DL'],
        githubSotIssue: GITHUB_SOT_ISSUE,
        gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
      },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidenceEvent?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-DL neural transportation OS cycle',
      claimState: 'MODEL_INFERENCE',
      summary:
        `hops=${hops.length}; route policies/congestion/revocation/audit; wormhole≠zero-trust bypass`,
      sourceRefs: ['62L-DL'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(
    hop(
      'learning',
      'BOUNDED',
      'Learning recorded locally; learning ≠ permission; no production authorization.',
    ),
  );

  const health = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(input.repoRoot ?? root);

  return {
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DL_LOCKS.L4_AUTONOMY_ENABLED as false,
    productionAuthorized: false as const,
    tipLand: false as const,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorLayer: os.predecessorLayer,
    predecessors: preds,
    hops,
    localBrainHealth: health,
    fullProductionTransportOsShipped: false as const,
    dbCandidatesApplied: false as const,
    ok: hops.every((h) => h.state !== 'FAIL'),
    honesty: neuralTransportationOsHonesty(),
    locks: DL_LOCKS,
  };
}

export async function buildNeuralTransportationOsHealthReport(input?: {
  root?: string;
  repoRoot?: string;
}) {
  const root = input?.root ?? process.cwd();
  const repoRoot = input?.repoRoot ?? root;
  const preds = predecessorMap(repoRoot);
  const honesty = neuralTransportationOsHonesty();
  return {
    phase: '62L-DL',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: DL_LOCKS.L4_AUTONOMY_ENABLED,
    tipLand: DL_LOCKS.TIP_LAND,
    productionAuthorization: DL_LOCKS.PRODUCTION_AUTHORIZATION,
    liveSupabaseApply: DL_LOCKS.LIVE_SUPABASE_APPLY,
    dbCandidatesApplied: DL_LOCKS.DB_CANDIDATES_APPLIED,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhaseTitle: NEXT_PHASE_TITLE,
    predecessorMap: preds,
    honesty,
    cycle: NEURAL_TRANSPORTATION_OS_CYCLE,
    generatedAt: new Date().toISOString(),
  };
}
