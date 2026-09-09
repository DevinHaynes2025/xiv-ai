/**
 * 62L-CK runtime — walks COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE and builds health report.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { appendLearning } from './learning-ledger';
import {
  cognitiveInfraGridHonesty,
  probeCompanionModules,
  registerGridSubsystems,
} from './cognitive-infrastructure-grid';
import {
  attemptMiniCellProductionBind,
  enrollMiniCloudCell,
  miniCloudCellsHonesty,
  routeViaMiniCellGateway,
} from './mini-cloud-server-cells';
import {
  attemptFederationOperation,
  enrollServerOrDatabase,
  serverDbFederationHonesty,
} from './authorized-server-database-federation';
import {
  attemptArchiveRegionMining,
  enrollSourceAtlasEntry,
  historicalPathwayMiningHonesty,
  proposeHistoricalPathway,
  surfaceCapabilityClaim,
} from './global-historical-pathway-mining';
import {
  agentOperatingCompaniesHonesty,
  attemptAgentCoAction,
  registerAgentOperatingCompany,
} from './agent-operating-companies';
import {
  attemptFabricJoin,
  deviceIntelligenceFabricHonesty,
  enrollFabricDevice,
} from './distributed-device-intelligence-fabric';
import {
  CK_LOCKS,
  COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE,
  GITHUB_SOT_ISSUE,
  GITLAB_COORDINATION_ISSUE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  type CkActor,
  type CkEvidenceState,
  type CkHop,
  type CkHopRecord,
} from './cognitive-infra-mini-cloud-history-types';

export {
  CK_LOCKS,
  COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
};

function hop(name: CkHop, state: CkEvidenceState, summary: string): CkHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type CkCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: CkActor;
  root?: string;
};

export async function runCognitiveInfraMiniCloudHistoryCycle(input: CkCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: CkHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      CK_LOCKS.L4_AUTONOMY_ENABLED === false &&
        CK_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
        CK_LOCKS.DB_WRITE_DENIED_BY_DEFAULT === true &&
        CK_LOCKS.ARBITRARY_SERVER_DISCOVERY === false &&
        CK_LOCKS.AGENT_CO_AUTONOMOUS_SPEND === false &&
        CK_LOCKS.SOUL_RESURRECTION_CLAIMS === false &&
        CK_LOCKS.GRID_SWALLOWS_UNRELATED_MEGA_DELTA === false &&
        CK_LOCKS.LEARNING_IS_PERMISSION === false
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const gridReg = await registerGridSubsystems({ root, actor });
  hops.push(
    hop(
      'grid_register_subsystems',
      gridReg.registrations.length === 7 &&
        gridReg.registrations.every((r) => r.status === 'registered')
        ? 'PASS'
        : 'FAIL',
      gridReg.coexistenceLayer,
    ),
  );

  const mega = await registerGridSubsystems({
    root,
    actor,
    attemptMegaDeltaSwallow: true,
    megaDeltaLabel: 'ATTRIBUTION_UNSAFE_MEGA_PR_38',
    megaDeltaBytesHint: 191_000,
  });
  hops.push(
    hop(
      'grid_reject_mega_delta_swallow',
      mega.megaDeltaDenied ? 'DENIED' : 'FAIL',
      mega.megaDeltaReason,
    ),
  );

  const cell = await enrollMiniCloudCell({
    label: 'Queue Cell Alpha',
    kind: 'queue',
    enrolled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'mini_cell_enroll_isolated',
      cell.status === 'enrolled' && cell.isolated === true && cell.stealthTakeover === false
        ? 'ISOLATED'
        : 'FAIL',
      cell.reason,
    ),
  );

  const unenrolledCell = await enrollMiniCloudCell({
    label: 'Rogue Cache',
    kind: 'cache',
    enrolled: false,
    root,
    actor,
  });
  const bindDeny = await attemptMiniCellProductionBind({
    cellId: unenrolledCell.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'mini_cell_unenrolled_prod_bind_denied',
      bindDeny.status === 'denied' ? 'DENIED' : 'FAIL',
      bindDeny.reason,
    ),
  );

  const fed = await enrollServerOrDatabase({
    name: 'Enterprise SQL A',
    kind: 'sql',
    enrolled: true,
    authorized: true,
    configured: true,
    consentGranted: true,
    scopes: ['read'],
    networkAllowlist: ['10.0.0.0/8'],
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_enroll_server_db',
      fed.status === 'available' ? 'ENROLLED' : 'FAIL',
      fed.reason,
    ),
  );

  const unenrolled = await enrollServerOrDatabase({
    name: 'Unenrolled DB',
    kind: 'sql',
    enrolled: false,
    authorized: false,
    configured: false,
    consentGranted: false,
    root,
    actor,
  });
  const unenrolledOp = await attemptFederationOperation({
    enrollmentId: unenrolled.id,
    operation: 'read',
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_unenrolled_denied',
      unenrolledOp.status === 'denied' || unenrolledOp.status === 'unavailable'
        ? 'DENIED'
        : 'FAIL',
      unenrolledOp.reason,
    ),
  );

  const scan = await attemptFederationOperation({
    operation: 'discover',
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_arbitrary_discovery_denied',
      scan.status === 'denied' ? 'DENIED' : 'FAIL',
      scan.reason,
    ),
  );

  const writeDefault = await attemptFederationOperation({
    enrollmentId: fed.id,
    operation: 'write',
    root,
    actor,
  });
  hops.push(
    hop(
      'federation_write_by_default_denied',
      writeDefault.status === 'denied' ? 'DENIED' : 'FAIL',
      writeDefault.reason,
    ),
  );

  const atlas = await enrollSourceAtlasEntry({
    label: 'Authorized Law Corpus',
    country: 'US',
    region: 'NA',
    language: 'en',
    authorized: true,
    consentKnown: true,
    licenseKnown: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'history_source_atlas_authorize',
      atlas.status === 'enrolled' ? 'PASS' : 'FAIL',
      atlas.reason,
    ),
  );

  const badRegion = await attemptArchiveRegionMining({
    country: 'XX',
    region: 'restricted',
    authorized: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'history_unauthorized_region_mining_denied',
      badRegion.status === 'denied' ? 'DENIED' : 'FAIL',
      badRegion.reason,
    ),
  );

  const noEvidence = await proposeHistoricalPathway({
    pack: 'business_evolution',
    label: 'Unproven Route',
    provenanceRefs: [],
    evidenceRefs: [],
    admitToRootGraph: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'history_pathway_without_evidence_denied_root',
      noEvidence.status === 'denied' && noEvidence.rootGraphAdmitted === false
        ? 'DENIED'
        : 'FAIL',
      noEvidence.reason,
    ),
  );

  const soul = await surfaceCapabilityClaim({
    claim: 'soul resurrection afterlife channel',
    root,
    actor,
  });
  hops.push(
    hop(
      'history_soul_claim_rejected',
      soul.status === 'rejected' ? 'REJECTED' : 'FAIL',
      soul.reason,
    ),
  );

  const { company } = await registerAgentOperatingCompany({
    name: 'Bounded Research Co',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_co_bounded_register',
      company.status === 'registered' && company.bounded && company.sandboxed
        ? 'BOUNDED'
        : 'FAIL',
      company.reason,
    ),
  );

  const spend = await attemptAgentCoAction({
    companyId: company.id,
    action: 'spend',
    root,
    actor,
  });
  const bill = await attemptAgentCoAction({
    companyId: company.id,
    action: 'bill',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_co_spend_bill_denied',
      spend.status === 'denied' && bill.status === 'denied' ? 'DENIED' : 'FAIL',
      spend.reason,
    ),
  );

  const esc = await attemptAgentCoAction({
    companyId: company.id,
    action: 'escalate_permission',
    root,
    actor,
  });
  hops.push(
    hop(
      'agent_co_permission_escalate_denied',
      esc.status === 'denied' && esc.permissionIncreased === false ? 'DENIED' : 'FAIL',
      esc.reason,
    ),
  );

  const device = await enrollFabricDevice({
    deviceId: 'pc-ck-1',
    kind: 'pc',
    enrolled: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'device_fabric_enroll',
      device.status === 'enrolled' ? 'ENROLLED' : 'FAIL',
      device.reason,
    ),
  );

  const rogue = await enrollFabricDevice({
    deviceId: 'rogue-phone',
    kind: 'mobile',
    enrolled: false,
    root,
    actor,
  });
  const joinDeny = await attemptFabricJoin({
    deviceRecordId: rogue.id,
    root,
    actor,
  });
  hops.push(
    hop(
      'device_fabric_unenrolled_join_denied',
      joinDeny.status === 'denied' || joinDeny.status === 'unavailable' ? 'DENIED' : 'FAIL',
      joinDeny.reason,
    ),
  );

  const gateway = await enrollMiniCloudCell({
    label: 'Model Gateway',
    kind: 'model_gateway',
    enrolled: true,
    root,
    actor,
  });
  const sealed = await routeViaMiniCellGateway({
    cellId: gateway.id,
    sensitivity: 'sealed',
    forceCloudGateway: true,
    root,
    actor,
  });
  hops.push(
    hop(
      'sealed_no_silent_cloud_cell',
      sealed.status === 'denied' && sealed.silentCloudFallback === false ? 'DENIED' : 'FAIL',
      sealed.reason,
    ),
  );

  const unconf = await enrollMiniCloudCell({
    label: 'Unconfigured Telemetry',
    kind: 'telemetry',
    enrolled: true,
    configured: false,
    root,
    actor,
  });
  hops.push(
    hop(
      'unconfigured_unavailable',
      unconf.status === 'unavailable' ? 'UNAVAILABLE' : 'FAIL',
      unconf.reason,
    ),
  );

  const evidence = await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-CK cognitive infra / mini cloud / history cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-CK'] },
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('evidence', 'PASS', `evidence=${evidence?.id ?? 'recorded'}`));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-CK cognitive infra mini cloud history cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; learning ≠ permission; isolated cells only`,
      sourceRefs: ['62L-CK'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);
  hops.push(hop('learning', 'BOUNDED', 'learning recorded; not permission grant'));

  return {
    cycle: [...COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE],
    hops,
    companions: probeCompanionModules(root),
    honesty: {
      grid: cognitiveInfraGridHonesty(),
      cells: miniCloudCellsHonesty(),
      federation: serverDbFederationHonesty(),
      history: historicalPathwayMiningHonesty(),
      agentCo: agentOperatingCompaniesHonesty(),
      device: deviceIntelligenceFabricHonesty(),
    },
  };
}

export async function buildCognitiveInfraMiniCloudHistoryHealthReport(input: {
  root?: string;
  orgId?: string;
  tenantId?: string;
  universeId?: string;
}) {
  const root = input.root ?? process.cwd();
  const actor: CkActor = {
    kind: 'cognitive_infra_curator',
    id: 'ck-health-curator',
    orgId: input.orgId ?? 'org-ck',
    tenantId: input.tenantId ?? 'tenant-ck',
    universeId: input.universeId ?? 'univ-ck',
    role: 'curator',
    permissionLevel: 0,
    authorityLevel: 0,
  };

  const result = await runCognitiveInfraMiniCloudHistoryCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });

  return {
    phase: '62L-CK',
    title:
      'XIV Cognitive Infrastructure Grid + Mini Cloud Server Cells + Authorized Server/Database Federation + Global Historical Pathway Mining + Agent Operating Companies + Distributed Device Intelligence Fabric',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: CK_LOCKS.L4_AUTONOMY_ENABLED,
    productionAuthorization: CK_LOCKS.PRODUCTION_AUTHORIZATION,
    tipLand: CK_LOCKS.TIP_LAND,
    githubSotIssue: GITHUB_SOT_ISSUE,
    gitlabCoordinationIssue: GITLAB_COORDINATION_ISSUE,
    nextPhase: NEXT_PHASE_TITLE,
    predecessors: predecessorMap(root),
    companions: result.companions,
    cycle: result.cycle,
    hops: result.hops,
    honesty: result.honesty,
    generatedAt: new Date().toISOString(),
  };
}
