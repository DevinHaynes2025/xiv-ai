import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptArbitraryServerDiscovery,
  bootstrapKnowledgeServerConstellation,
  claimCoverage,
  constellationHonesty,
  enrollRegionalCloudServiceCell,
  requestRegionalCellService,
} from './global-knowledge-server-constellation';
import {
  archiveMiningHonesty,
  attemptArchiveIntake,
  enrollArchiveSource,
} from './international-archive-mining-network';
import {
  compileDataHighway,
  highwayCompilerHonesty,
  registerCloudEndpoint,
  routeContentOnHighway,
} from './multi-cloud-data-highway-compiler';
import {
  attemptCivilizationGraphPromotion,
  civilizationGraphHonesty,
  recordCivilizationGraphNode,
} from './historical-civilization-knowledge-graph';
import {
  attemptBureauPermissionEscalation,
  grantBureauSkill,
  openRegionalResearchBureau,
  researchBureausHonesty,
} from './regional-agent-research-bureaus';
import {
  applySyncPack,
  createSyncPack,
  revokeSyncPack,
  syncFabricHonesty,
} from './offline-cloud-superbrain-sync-fabric';
import {
  ALL_WORLD_COVERAGE_REJECTED,
  ARBITRARY_SERVER_DISCOVERY_DENIED,
  BUREAU_SKILL_NOT_PERMISSION,
  CHECKSUM_CONFLICT_NOT_SILENT,
  CL_LOCKS,
  GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SEALED_SILENT_CLOUD_HIGHWAY_DENIED,
  SIM_TO_VERIFIED_FACT_REJECTED,
  UNCONFIGURED_HIGHWAY_DENIED,
  UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
  UNENROLLED_REGIONAL_CELL_UNAVAILABLE,
  UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
  predecessorMap,
  type ClActor,
} from './global-knowledge-server-constellation-types';
import {
  buildGlobalKnowledgeServerConstellationHealthReport,
  runGlobalKnowledgeServerConstellationCycle,
} from './global-knowledge-server-constellation-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcl-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: ClActor = {
  kind: 'constellation_curator',
  id: 'curator-cl-1',
  orgId: 'org-cl',
  tenantId: 'tenant-cl',
  universeId: 'univ-cl',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CL1-cycle',
    GLOBAL_KNOWLEDGE_SERVER_CONSTELLATION_CYCLE.join(' → ') ===
      'honesty_locks → constellation_bootstrap → enroll_regional_cell → unenrolled_cell_unavailable → arbitrary_server_discovery_denied → all_world_coverage_rejected → archive_intake_authorized → unauthorized_archive_denied → highway_compile_authorized → unconfigured_highway_denied → sealed_no_silent_cloud_highway → civilization_graph_typed → reject_sim_to_verified_fact → bureau_open_bounded → bureau_skill_no_permission → sync_pack_signed → unsigned_or_revoked_pack_rejected → checksum_conflict_not_silent → evidence → learning',
    'Global Knowledge Server Constellation cycle recorded in order.',
  );

  check(
    'US-CL-locks',
    CL_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CL_LOCKS.ARBITRARY_SERVER_DISCOVERY === false &&
      CL_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE === false &&
      CL_LOCKS.UNENROLLED_CELL_ALLOWED === false &&
      CL_LOCKS.UNAUTHORIZED_ARCHIVE_INTAKE === false &&
      CL_LOCKS.SEALED_SILENT_CLOUD_HIGHWAY === false &&
      CL_LOCKS.AUTO_TRUST_UNVERIFIED_PACKS === false &&
      CL_LOCKS.SILENT_CHECKSUM_CONFLICT_ACCEPT === false &&
      CL_LOCKS.BUREAU_SKILL_IS_PERMISSION === false &&
      CL_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false &&
      CL_LOCKS.AUTONOMOUS_SPEND === false &&
      CL_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CL_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CL-honesty-surfaces',
    constellationHonesty().arbitraryServerDiscovery === false &&
      archiveMiningHonesty().unauthorizedIntakeAllowed === false &&
      highwayCompilerHonesty().sealedSilentCloudHighway === false &&
      civilizationGraphHonesty().simPromoteToVerifiedFact === false &&
      researchBureausHonesty().skillIsPermission === false &&
      syncFabricHonesty().autoTrustUnverified === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  const constellation = await bootstrapKnowledgeServerConstellation({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });

  // Arbitrary server discovery DENIED
  const discovery = await attemptArbitraryServerDiscovery({
    target: 'http://0.0.0.0/scan-all',
    root,
    actor,
  });
  check(
    'US-CL-arbitrary-discovery-denied',
    discovery.status === 'denied' &&
      discovery.reason === ARBITRARY_SERVER_DISCOVERY_DENIED,
    discovery.reason,
  );

  // All-world coverage without evidence → not VERIFIED / REJECTED
  const allWorld = await claimCoverage({ scope: 'all_world', root, actor });
  check(
    'US-CL-all-world-coverage-rejected',
    allWorld.status === 'rejected' &&
      allWorld.verified === false &&
      allWorld.reason === ALL_WORLD_COVERAGE_REJECTED,
    allWorld.reason,
  );

  // Unenrolled regional cell UNAVAILABLE
  const shadow = await enrollRegionalCloudServiceCell({
    constellationId: constellation.id,
    regionCode: 'xx-shadow',
    label: 'unenrolled',
    enroll: false,
    root,
    actor,
  });
  const shadowSvc = await requestRegionalCellService({
    cellId: shadow.id,
    action: 'serve',
    root,
    actor,
  });
  check(
    'US-CL-unenrolled-cell-unavailable',
    (shadowSvc.status === 'unavailable' || shadowSvc.status === 'denied') &&
      shadowSvc.reason === UNENROLLED_REGIONAL_CELL_UNAVAILABLE,
    shadowSvc.reason,
  );

  // Unauthorized archive intake DENIED
  const deniedIntake = await attemptArchiveIntake({
    regionCode: 'xx',
    language: 'und',
    title: 'scrape',
    authorized: false,
    provenanceRef: null,
    root,
    actor,
  });
  check(
    'US-CL-unauthorized-archive-denied',
    deniedIntake.status === 'denied' &&
      deniedIntake.reason === UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
    deniedIntake.reason,
  );

  const okSource = await enrollArchiveSource({
    regionCode: 'eu-west',
    language: 'de',
    label: 'authorized archive',
    authorized: true,
    provenanceRef: 'prov://eu/de/1',
    root,
    actor,
  });
  const okIntake = await attemptArchiveIntake({
    sourceId: okSource.id,
    regionCode: 'eu-west',
    language: 'de',
    title: 'ok',
    root,
    actor,
  });
  check(
    'US-CL-authorized-archive-accepted',
    okIntake.status === 'accepted',
    okIntake.reason,
  );

  // Highway to unconfigured cloud DENIED/UNAVAILABLE
  const bare = await registerCloudEndpoint({
    provider: 'ghost',
    label: 'unconfigured',
    configured: false,
    authorized: false,
    verified: false,
    root,
    actor,
  });
  const badHwy = await compileDataHighway({
    name: 'ghost-hwy',
    endpointIds: [bare.id],
    root,
    actor,
  });
  check(
    'US-CL-unconfigured-highway-denied',
    (badHwy.status === 'unavailable' || badHwy.status === 'denied') &&
      badHwy.reason === UNCONFIGURED_HIGHWAY_DENIED,
    badHwy.reason,
  );

  const ready = await registerCloudEndpoint({
    provider: 'cloud-a',
    label: 'ready',
    configured: true,
    authorized: true,
    verified: true,
    root,
    actor,
  });
  const hwy = await compileDataHighway({
    name: 'ok-hwy',
    endpointIds: [ready.id],
    mode: 'open',
    root,
    actor,
  });
  check('US-CL-authorized-highway-candidate', hwy.status === 'candidate', hwy.reason);

  // Sealed content cannot silent-route onto cloud highway
  const sealed = await routeContentOnHighway({
    highwayId: hwy.id,
    contentClass: 'sealed',
    root,
    actor,
  });
  check(
    'US-CL-sealed-no-silent-cloud-highway',
    sealed.status === 'denied' &&
      sealed.reason === SEALED_SILENT_CLOUD_HIGHWAY_DENIED &&
      sealed.silentCloudFallback === false,
    sealed.reason,
  );

  // Unsigned or revoked sync pack rejected
  const unsigned = await createSyncPack({
    label: 'u',
    payload: 'x',
    signature: null,
    root,
    actor,
  });
  check(
    'US-CL-unsigned-pack-rejected',
    unsigned.status === 'rejected' &&
      unsigned.reason === UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
    unsigned.reason,
  );

  const signed = await createSyncPack({
    label: 's',
    payload: 'sync-body',
    signature: 'sig-1',
    root,
    actor,
  });
  await revokeSyncPack({ packId: signed.id, root, actor });
  const revokedApply = await applySyncPack({
    packId: signed.id,
    expectedChecksum: signed.payloadDigest,
    observedPayload: 'sync-body',
    root,
    actor,
  });
  check(
    'US-CL-revoked-pack-rejected',
    revokedApply.status === 'rejected' &&
      revokedApply.reason === UNSIGNED_OR_REVOKED_SYNC_PACK_REJECTED,
    revokedApply.reason,
  );

  // Checksum/conflict mismatch not silently accepted
  const pack2 = await createSyncPack({
    label: 'c',
    payload: 'canonical',
    signature: 'sig-2',
    root,
    actor,
  });
  const conflict = await applySyncPack({
    packId: pack2.id,
    expectedChecksum: pack2.payloadDigest,
    observedPayload: 'tampered',
    root,
    actor,
  });
  check(
    'US-CL-checksum-conflict-not-silent',
    conflict.status === 'rejected' &&
      conflict.conflict === true &&
      conflict.reason === CHECKSUM_CONFLICT_NOT_SILENT,
    conflict.reason,
  );

  // Bureau skill grant does not escalate permissions
  const bureau = await openRegionalResearchBureau({
    regionCode: 'eu-west',
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
  });
  const grant = await grantBureauSkill({
    bureauId: bureau.id,
    agentId: 'agent-1',
    skillKey: 'eval',
    score: 0.8,
    actorPermissionLevel: actor.permissionLevel,
    actorAuthorityLevel: actor.authorityLevel,
    root,
    actor,
  });
  const esc = await attemptBureauPermissionEscalation({
    grantId: grant.id,
    requestedPermissionDelta: 9,
    requestedAuthorityDelta: 9,
    root,
    actor,
  });
  check(
    'US-CL-bureau-skill-no-permission-escalation',
    grant.skillIsPermissionGrant === false &&
      grant.permissionLevel === actor.permissionLevel &&
      grant.authorityLevel === actor.authorityLevel &&
      esc.rejected === true &&
      esc.reason === BUREAU_SKILL_NOT_PERMISSION,
    esc.reason,
  );

  // Graph rejects promoting simulation to verified fact
  const sim = await recordCivilizationGraphNode({
    kind: 'simulation',
    label: 'sim',
    statement: 'simulated trade collapse',
    root,
    actor,
  });
  const promo = await attemptCivilizationGraphPromotion({
    nodeId: sim.id,
    toKind: 'fact',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'US-CL-sim-to-verified-fact-rejected',
    promo.rejected === true &&
      promo.accepted === false &&
      promo.reason === SIM_TO_VERIFIED_FACT_REJECTED &&
      sim.trustState === 'labeled_simulation',
    promo.reason,
  );

  const cycle = await runGlobalKnowledgeServerConstellationCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check('US-CL-cycle-ok', cycle.ok === true, `hops=${cycle.hops.length}`);

  const health = await buildGlobalKnowledgeServerConstellationHealthReport({
    root: repoRoot,
  });
  check(
    'US-CL-health-report',
    health.honestyBanner === HONESTY_BANNER &&
      health.l4AutonomyEnabled === false &&
      health.nextPhase === NEXT_PHASE_TITLE &&
      health.githubSotIssue === 102 &&
      health.gitlabCoordinationIssue === 36,
    health.nextPhase,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CL-predecessor-map',
    typeof preds.CK === 'object' &&
      typeof preds.CI === 'object' &&
      typeof preds.CH === 'object' &&
      typeof preds.CG === 'object',
    `CK=${preds.CK.tipProbe}/${preds.CK.report}; CI=${preds.CI.tipProbe}/${preds.CI.report}`,
  );

  check(
    'US-CL-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CM —'),
    NEXT_PHASE_TITLE,
  );
} catch (err) {
  failures.push(`THROWN: ${err instanceof Error ? err.message : String(err)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CL');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CL global knowledge server constellation safety suite');
