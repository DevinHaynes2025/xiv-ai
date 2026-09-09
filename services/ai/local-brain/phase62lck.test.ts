import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cognitiveInfraGridHonesty,
  listRegisteredGridSubsystems,
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
  AGENT_CO_PERMISSION_DENIED,
  AGENT_CO_SPEND_DENIED,
  ARBITRARY_DISCOVERY_DENIED,
  CK_LOCKS,
  COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE,
  HISTORY_ROOT_WITHOUT_EVIDENCE_DENIED,
  HONESTY_BANNER,
  MEGA_DELTA_SWALLOW_DENIED,
  MINI_CELL_PROD_BIND_DENIED,
  NEXT_PHASE_TITLE,
  SEALED_CLOUD_CELL_DENIED,
  SOUL_CLAIM_REJECTED,
  UNAUTHORIZED_REGION_MINING_DENIED,
  UNENROLLED_DEVICE_JOIN_DENIED,
  UNENROLLED_FEDERATION_DENIED,
  WRITE_BY_DEFAULT_DENIED,
  predecessorMap,
  type CkActor,
} from './cognitive-infra-mini-cloud-history-types';
import {
  buildCognitiveInfraMiniCloudHistoryHealthReport,
  runCognitiveInfraMiniCloudHistoryCycle,
} from './cognitive-infra-mini-cloud-history-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lck-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CkActor = {
  kind: 'cognitive_infra_curator',
  id: 'curator-ck-1',
  orgId: 'org-ck',
  tenantId: 'tenant-ck',
  universeId: 'univ-ck',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CK1-cycle',
    COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE.join(' → ') ===
      'honesty_locks → grid_register_subsystems → grid_reject_mega_delta_swallow → mini_cell_enroll_isolated → mini_cell_unenrolled_prod_bind_denied → federation_enroll_server_db → federation_unenrolled_denied → federation_arbitrary_discovery_denied → federation_write_by_default_denied → history_source_atlas_authorize → history_unauthorized_region_mining_denied → history_pathway_without_evidence_denied_root → history_soul_claim_rejected → agent_co_bounded_register → agent_co_spend_bill_denied → agent_co_permission_escalate_denied → device_fabric_enroll → device_fabric_unenrolled_join_denied → sealed_no_silent_cloud_cell → unconfigured_unavailable → evidence → learning',
    'Cognitive Infra / Mini Cloud / History cycle recorded in order.',
  );

  check(
    'US-CK-locks',
    CK_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CK_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CK_LOCKS.DB_WRITE_DENIED_BY_DEFAULT === true &&
      CK_LOCKS.ARBITRARY_SERVER_DISCOVERY === false &&
      CK_LOCKS.ARBITRARY_DB_SCAN === false &&
      CK_LOCKS.MINI_CELL_UNENROLLED_PROD_BIND === false &&
      CK_LOCKS.MINI_CELLS_ARE_ISOLATED_SERVICE_CELLS === true &&
      CK_LOCKS.HISTORY_WITHOUT_EVIDENCE_ENTERS_ROOT === false &&
      CK_LOCKS.SOUL_RESURRECTION_CLAIMS === false &&
      CK_LOCKS.AGENT_CO_AUTONOMOUS_SPEND === false &&
      CK_LOCKS.LEARNING_IS_PERMISSION === false &&
      CK_LOCKS.DEVICE_FABRIC_UNENROLLED_JOIN === false &&
      CK_LOCKS.GRID_SWALLOWS_UNRELATED_MEGA_DELTA === false &&
      CK_LOCKS.GRID_IS_COEXISTENCE_LAYER === true &&
      CK_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CK_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CK_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, isolated cells, deny-by-default federation.',
  );

  check(
    'US-CK-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CL — XIV Global Knowledge Server Constellation'),
    'Next queue title is 62L-CL only (title).',
  );

  check(
    'US-CK-honesty-modules',
    cognitiveInfraGridHonesty().swallowsUnrelatedMegaDelta === false &&
      miniCloudCellsHonesty().isolatedServiceCells === true &&
      serverDbFederationHonesty().writeDeniedByDefault === true &&
      historicalPathwayMiningHonesty().soulResurrectionClaims === false &&
      agentOperatingCompaniesHonesty().autonomousSpend === false &&
      deviceIntelligenceFabricHonesty().unenrolledJoin === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Unenrolled server/DB → DENIED/UNAVAILABLE ---
  const unenrolledDb = await enrollServerOrDatabase({
    name: 'Shadow DB',
    kind: 'sql',
    enrolled: false,
    authorized: false,
    configured: false,
    consentGranted: false,
    root,
    actor,
  });
  const unenrolledRead = await attemptFederationOperation({
    enrollmentId: unenrolledDb.id,
    operation: 'read',
    root,
    actor,
  });
  const noId = await attemptFederationOperation({
    operation: 'read',
    root,
    actor,
  });
  check(
    'US-CK-unenrolled-server-db-denied',
    (unenrolledDb.status === 'denied' || unenrolledDb.status === 'unavailable') &&
      (unenrolledRead.status === 'denied' || unenrolledRead.status === 'unavailable') &&
      unenrolledRead.reason === UNENROLLED_FEDERATION_DENIED &&
      noId.status === 'unavailable',
    'Unenrolled server/DB DENIED/UNAVAILABLE.',
  );

  // --- Arbitrary discovery/scan DENIED ---
  const discover = await attemptFederationOperation({
    operation: 'discover',
    root,
    actor,
  });
  const scan = await attemptFederationOperation({
    operation: 'scan',
    root,
    actor,
  });
  const connectAll = await attemptFederationOperation({
    operation: 'connect_all',
    root,
    actor,
  });
  check(
    'US-CK-arbitrary-discovery-scan-denied',
    discover.status === 'denied' &&
      discover.reason === ARBITRARY_DISCOVERY_DENIED &&
      scan.status === 'denied' &&
      connectAll.status === 'denied',
    'Arbitrary discovery/scan/connect_all DENIED.',
  );

  // --- Write-by-default DENIED ---
  const enrolled = await enrollServerOrDatabase({
    name: 'Prod SQL',
    kind: 'sql',
    enrolled: true,
    authorized: true,
    configured: true,
    consentGranted: true,
    scopes: ['read'],
    root,
    actor,
  });
  const writeDefault = await attemptFederationOperation({
    enrollmentId: enrolled.id,
    operation: 'write',
    root,
    actor,
  });
  const alter = await attemptFederationOperation({
    enrollmentId: enrolled.id,
    operation: 'alter',
    root,
    actor,
  });
  check(
    'US-CK-write-by-default-denied',
    enrolled.writeAllowed === false &&
      writeDefault.status === 'denied' &&
      writeDefault.reason === WRITE_BY_DEFAULT_DENIED &&
      alter.status === 'denied',
    'Write-by-default and alter DENIED.',
  );

  // --- Mini cell without enrollment cannot bind production network ---
  const rogueCell = await enrollMiniCloudCell({
    label: 'Rogue Vector Shard',
    kind: 'vector_shard',
    enrolled: false,
    root,
    actor,
  });
  const bind = await attemptMiniCellProductionBind({
    cellId: rogueCell.id,
    root,
    actor,
  });
  check(
    'US-CK-mini-cell-unenrolled-prod-bind-denied',
    rogueCell.productionNetworkBound === false &&
      bind.status === 'denied' &&
      bind.reason === MINI_CELL_PROD_BIND_DENIED,
    'Unenrolled mini cell cannot bind production network.',
  );

  // --- Historical pathway without provenance/evidence cannot enter root graph ---
  const noProv = await proposeHistoricalPathway({
    pack: 'supply_chains',
    label: 'Guess Route',
    provenanceRefs: [],
    evidenceRefs: [],
    admitToRootGraph: true,
    root,
    actor,
  });
  const half = await proposeHistoricalPathway({
    pack: 'cultural_context',
    label: 'Partial Route',
    provenanceRefs: ['atlas-1'],
    evidenceRefs: [],
    admitToRootGraph: true,
    root,
    actor,
  });
  check(
    'US-CK-history-without-evidence-denied-root',
    noProv.status === 'denied' &&
      noProv.rootGraphAdmitted === false &&
      noProv.reason === HISTORY_ROOT_WITHOUT_EVIDENCE_DENIED &&
      half.status === 'denied' &&
      half.rootGraphAdmitted === false,
    'Pathway without provenance/evidence cannot enter root graph.',
  );

  // --- Unauthorized archive region mining DENIED ---
  const region = await attemptArchiveRegionMining({
    country: 'ZZ',
    region: 'classified',
    language: 'xx',
    authorized: false,
    root,
    actor,
  });
  check(
    'US-CK-unauthorized-region-mining-denied',
    region.status === 'denied' && region.reason === UNAUTHORIZED_REGION_MINING_DENIED,
    'Unauthorized archive region mining DENIED.',
  );

  // --- Agent operating company cannot spend/bill or escalate permissions ---
  const { company } = await registerAgentOperatingCompany({
    name: 'Sandbox Co',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
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
  const esc = await attemptAgentCoAction({
    companyId: company.id,
    action: 'escalate_permission',
    root,
    actor,
  });
  const learn = await attemptAgentCoAction({
    companyId: company.id,
    action: 'learn_skill',
    root,
    actor,
  });
  check(
    'US-CK-agent-co-spend-permission-denied',
    company.spendAuthority === false &&
      company.billingAuthority === false &&
      spend.status === 'denied' &&
      spend.reason === AGENT_CO_SPEND_DENIED &&
      bill.status === 'denied' &&
      esc.status === 'denied' &&
      esc.reason === AGENT_CO_PERMISSION_DENIED &&
      esc.permissionIncreased === false &&
      learn.accepted === true &&
      learn.permissionIncreased === false,
    'Agent co cannot spend/bill or escalate; learning ≠ permission.',
  );

  // --- Unenrolled device fabric join DENIED ---
  const unenrolledDev = await enrollFabricDevice({
    deviceId: 'phone-x',
    kind: 'mobile',
    enrolled: false,
    root,
    actor,
  });
  const join = await attemptFabricJoin({
    deviceRecordId: unenrolledDev.id,
    root,
    actor,
  });
  check(
    'US-CK-unenrolled-device-join-denied',
    (join.status === 'denied' || join.status === 'unavailable') &&
      join.reason === UNENROLLED_DEVICE_JOIN_DENIED,
    'Unenrolled device fabric join DENIED.',
  );

  // --- Sealed content cannot silent-route to cloud cell/gateway ---
  const gateway = await enrollMiniCloudCell({
    label: 'Model Gateway Cell',
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
  const localOnly = await routeViaMiniCellGateway({
    cellId: gateway.id,
    sensitivity: 'local_only',
    forceCloudGateway: true,
    root,
    actor,
  });
  check(
    'US-CK-sealed-no-silent-cloud-cell',
    sealed.status === 'denied' &&
      sealed.silentCloudFallback === false &&
      sealed.reason === SEALED_CLOUD_CELL_DENIED &&
      localOnly.status === 'denied' &&
      localOnly.silentCloudFallback === false,
    'Sealed/local-only never silent-routes to cloud cell/gateway.',
  );

  // --- Soul/afterlife claim REJECTED ---
  const soul = await surfaceCapabilityClaim({
    claim: 'Enable soul resurrection afterlife capability',
    root,
    actor,
  });
  check(
    'US-CK-soul-claim-rejected',
    soul.status === 'rejected' && soul.reason === SOUL_CLAIM_REJECTED,
    'Soul/afterlife claim REJECTED.',
  );

  // --- Grid registers without mega-delta swallow ---
  const reg = await registerGridSubsystems({ root, actor });
  const mega = await registerGridSubsystems({
    root,
    actor,
    attemptMegaDeltaSwallow: true,
    megaDeltaLabel: 'ATTRIBUTION_UNSAFE_MEGA_PR_38',
    megaDeltaBytesHint: 200_000,
  });
  const listed = await listRegisteredGridSubsystems(root);
  const companions = probeCompanionModules(repoRoot);
  check(
    'US-CK-grid-no-mega-delta-swallow',
    reg.registrations.length === 7 &&
      listed.length === 7 &&
      mega.megaDeltaDenied === true &&
      mega.megaDeltaReason === MEGA_DELTA_SWALLOW_DENIED &&
      cognitiveInfraGridHonesty().gridIsCoexistenceLayer === true &&
      companions.cg === true &&
      companions.cd === true,
    'Grid registers 7 subsystems; mega-delta swallow DENIED; CG/CD PRESENT.',
  );

  // Full cycle + health report smoke
  const cycle = await runCognitiveInfraMiniCloudHistoryCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CK-cycle-run',
    cycle.hops.length === COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE.length &&
      cycle.hops.every((h, i) => h.hop === COGNITIVE_INFRA_MINI_CLOUD_HISTORY_CYCLE[i]),
    'Full CK cycle walks all hops in order.',
  );

  const health = await buildCognitiveInfraMiniCloudHistoryHealthReport({ root });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CK-health-predecessors',
    health.githubSotIssue === 101 &&
      health.gitlabCoordinationIssue === 35 &&
      health.l4AutonomyEnabled === false &&
      preds.CG.tipProbe === 'PRESENT' &&
      preds.CG.report === 'PRESENT' &&
      (preds.CJ.tipProbe === 'WAITING_DATA' || preds.CJ.tipProbe === 'PRESENT') &&
      (preds.CI.tipProbe === 'WAITING_DATA' || preds.CI.tipProbe === 'PRESENT') &&
      (preds.CH.tipProbe === 'WAITING_DATA' || preds.CH.tipProbe === 'PRESENT'),
    `Health SoT #101/#35; CG PRESENT; CJ=${preds.CJ.tipProbe} CI=${preds.CI.tipProbe} CH=${preds.CH.tipProbe}.`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\n62L-CK FAILURES (${failures.length}):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('\n62L-CK: all required tests PASS');
