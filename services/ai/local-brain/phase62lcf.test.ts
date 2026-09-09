import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  distributePack,
  intakeRawAndRefine,
  refineryHonesty,
} from './global-data-refinery-civilization';
import {
  archiveShiftHonesty,
  runArchiveResearchShift,
} from './autonomous-archive-research-shifts';
import {
  attemptCompressionProductionAuthorize,
  compressionHonesty,
  createCompressionCandidate,
  preferSecurityOverCompressionGain,
} from './neural-knowledge-compression-engine';
import {
  recordProviderFailure,
  registerIntelligenceProvider,
  routeIntelligence,
  routerHonesty,
} from './multi-provider-intelligence-router';
import {
  attemptLabProductionAuthorize,
  deviceLabHonesty,
  runPlacementExperiment,
  runQuantizationExperiment,
} from './semiconductor-device-optimization-lab';
import {
  registerReplicationPack,
  replicateOrImportPack,
  replicationHonesty,
  revokeReplicationPack,
} from './distributed-offline-knowledge-replication-fabric';
import {
  CF_LOCKS,
  CHECKSUM_MISMATCH_REJECTED,
  COMPRESSION_NOT_PRODUCTION,
  DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROVIDER_CIRCUIT_OPEN,
  QUANTIZATION_LAB_SANDBOX,
  REVOKED_PACK_REJECTED,
  SEALED_CLOUD_ROUTE_DENIED,
  UNAUTHORIZED_RAW_INTAKE_DENIED,
  UNAPPROVED_DISTRIBUTION_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  ARCHIVE_SHIFT_BOUNDS,
  predecessorMap,
  type CfActor,
} from './data-refinery-compression-replication-types';
import {
  buildDataRefineryCompressionReplicationHealthReport,
  runDataRefineryCompressionReplicationCycle,
} from './data-refinery-compression-replication-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcf-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CfActor = {
  kind: 'refinery_agent',
  id: 'refinery-cf-1',
  orgId: 'org-cf',
  tenantId: 'tenant-cf',
  universeId: 'univ-cf',
  role: 'refinery',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CF1-cycle',
    DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE.join(' → ') ===
      'honesty_locks → raw_intake_authorize → unauthorized_raw_intake_denied → normalize_quality_dedupe_classify → compress_into_knowledge_pack → council_evaluate_local_first → distribute_approved_only → unapproved_universe_device_denied → archive_shift_bounded → archive_authorization_bounds → compression_candidate_not_production → provider_route_local_first → provider_circuit_breaker → unconfigured_provider_unavailable → sealed_never_cloud_route → device_lab_placement_sandbox → quantization_lab_sandbox → offline_replicate_checksum → revoked_pack_rejected → checksum_mismatch_conflict → evidence → learning',
    'Data refinery / compression / replication cycle recorded in order.',
  );

  check(
    'US-CF-locks',
    CF_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CF_LOCKS.AUTHORIZED_SOURCES_ONLY === true &&
      CF_LOCKS.ARBITRARY_DB_WEB_SCRAPE === false &&
      CF_LOCKS.SEALED_SILENT_CLOUD_FALLBACK === false &&
      CF_LOCKS.COMPRESSION_AUTO_PRODUCTION === false &&
      CF_LOCKS.AUTO_TRUST_UNVERIFIED_PACKS === false &&
      CF_LOCKS.REVOKED_PACK_IMPORT_ALLOWED === false &&
      CF_LOCKS.CHECKSUM_MISMATCH_SILENT_ACCEPT === false &&
      CF_LOCKS.ARCHIVE_SHIFTS_BOUNDED === true &&
      CF_LOCKS.RARE_KNOWLEDGE_BYPASSES_AUTHORIZATION === false &&
      CF_LOCKS.LEARNING_IS_PERMISSION === false &&
      CF_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CF_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CF_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, authorized sources, no sealed→cloud fallback.',
  );

  check(
    'US-CF-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CG — XIV Deep Knowledge Refinery OS'),
    'Next queue title is 62L-CG only (title).',
  );

  check(
    'US-CF-honesty-modules',
    refineryHonesty().l4AutonomyEnabled === false &&
      archiveShiftHonesty().archiveShiftsBounded === true &&
      compressionHonesty().compressionAutoProduction === false &&
      routerHonesty().sealedSilentCloudFallback === false &&
      deviceLabHonesty().deviceLabSandboxOnly === true &&
      replicationHonesty().autoTrustUnverified === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Unauthorized raw intake DENIED ---
  const denied = await intakeRawAndRefine({
    sourceId: 'raw-bad',
    authorization: 'unauthorized',
    payload: 'leak-claim',
    root,
    actor,
  });
  check(
    'US-CF-unauthorized-raw-intake',
    denied.accepted === false &&
      denied.reason === UNAUTHORIZED_RAW_INTAKE_DENIED &&
      denied.pack?.rejected === true,
    'Unauthorized raw intake DENIED.',
  );

  const okPack = await intakeRawAndRefine({
    sourceId: 'raw-ok',
    authorization: 'licensed',
    payload: 'licensed research corpus paragraph',
    approvedUniverses: ['univ-cf'],
    approvedDevices: ['dev-cf'],
    root,
    actor,
  });
  check(
    'US-CF-authorized-intake',
    okPack.accepted === true && okPack.pack?.rejected === false,
    'Authorized raw intake refined into pack candidate.',
  );

  // --- Refinery pack not distributed to unapproved Universe/device ---
  const badUniv = await distributePack({
    packId: okPack.pack!.id,
    targetUniverseId: 'univ-other',
    root,
    actor,
  });
  const badDev = await distributePack({
    packId: okPack.pack!.id,
    targetDeviceId: 'dev-other',
    root,
    actor,
  });
  const goodUniv = await distributePack({
    packId: okPack.pack!.id,
    targetUniverseId: 'univ-cf',
    root,
    actor,
  });
  check(
    'US-CF-unapproved-distribution',
    badUniv.accepted === false &&
      badDev.accepted === false &&
      badUniv.reason === UNAPPROVED_DISTRIBUTION_DENIED &&
      goodUniv.accepted === true,
    'Unapproved Universe/device distribution DENIED; approved allowed.',
  );

  // --- Provider down/unconfigured → circuit open / UNAVAILABLE ---
  const bare = await registerIntelligenceProvider({
    name: 'bare-cloud',
    kind: 'cloud',
    configured: false,
    authorized: false,
    root,
  });
  const bareRoute = await routeIntelligence({
    providerId: bare.id,
    contentClass: 'open',
    root,
    actor,
  });
  check(
    'US-CF-unconfigured-provider',
    bareRoute.accepted === false &&
      bare.status === 'unavailable' &&
      bareRoute.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE,
    'Unconfigured provider → UNAVAILABLE (not fake success).',
  );

  const flaky = await registerIntelligenceProvider({
    name: 'flaky-cloud',
    kind: 'cloud',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  await recordProviderFailure({ providerId: flaky.id, root });
  await recordProviderFailure({ providerId: flaky.id, root });
  const opened = await recordProviderFailure({ providerId: flaky.id, root });
  const openRoute = await routeIntelligence({
    providerId: flaky.id,
    contentClass: 'open',
    root,
    actor,
  });
  check(
    'US-CF-provider-circuit-open',
    opened?.status === 'circuit_open' &&
      openRoute.accepted === false &&
      openRoute.reason === PROVIDER_CIRCUIT_OPEN,
    'Provider failures open circuit → not fake success.',
  );

  // --- Sealed content cannot route to cloud provider ---
  const cloud = await registerIntelligenceProvider({
    name: 'cloud-ready',
    kind: 'cloud',
    configured: true,
    authorized: true,
    verified: true,
    root,
  });
  const sealed = await routeIntelligence({
    providerId: cloud.id,
    contentClass: 'sealed',
    root,
    actor,
  });
  const localOnly = await routeIntelligence({
    providerId: cloud.id,
    contentClass: 'local_only',
    root,
    actor,
  });
  check(
    'US-CF-sealed-no-cloud',
    sealed.accepted === false &&
      localOnly.accepted === false &&
      sealed.reason === SEALED_CLOUD_ROUTE_DENIED &&
      sealed.silentCloudFallback === false,
    'Sealed/local-only cannot route to cloud; no silent fallback.',
  );

  // --- Compression candidate not auto production-authorized ---
  const comp = await createCompressionCandidate({
    sourcePackId: okPack.pack!.id,
    content: 'licensed research corpus paragraph',
    root,
    actor,
  });
  const compAuth = await attemptCompressionProductionAuthorize({
    candidateId: comp.candidate.id,
    root,
    actor,
  });
  const preferSafe = preferSecurityOverCompressionGain({
    sizeGainPct: 80,
    energyGainPct: 50,
    securityRisk: true,
    correctnessRisk: false,
  });
  check(
    'US-CF-compression-not-production',
    comp.candidate.productionAuthorized === false &&
      comp.candidate.status === 'sandbox_candidate' &&
      compAuth.denied === true &&
      compAuth.reason === COMPRESSION_NOT_PRODUCTION &&
      preferSafe.preferCompression === false,
    'Compression candidate not auto production-authorized; security beats size.',
  );

  // --- Revoked pack rejected on replicate/import ---
  const rpack = await registerReplicationPack({
    label: 'pack-a',
    payload: 'offline bytes a',
    verified: true,
    root,
    actor,
  });
  await revokeReplicationPack({ packId: rpack.id, root, actor });
  const revoked = await replicateOrImportPack({
    packId: rpack.id,
    operation: 'import',
    root,
    actor,
  });
  check(
    'US-CF-revoked-pack',
    revoked.accepted === false && revoked.reason === REVOKED_PACK_REJECTED,
    'Revoked pack rejected on replicate/import.',
  );

  // --- Checksum mismatch → conflict/reject ---
  const rpack2 = await registerReplicationPack({
    label: 'pack-b',
    payload: 'offline bytes b',
    verified: true,
    root,
    actor,
  });
  const mismatch = await replicateOrImportPack({
    packId: rpack2.id,
    expectedChecksum: '00'.repeat(32),
    providedPayload: 'tampered-payload',
    operation: 'replicate',
    root,
    actor,
  });
  check(
    'US-CF-checksum-mismatch',
    mismatch.accepted === false &&
      mismatch.conflict === true &&
      mismatch.reason === CHECKSUM_MISMATCH_REJECTED,
    'Checksum mismatch → conflict/reject (not silent accept).',
  );

  const unverified = await registerReplicationPack({
    label: 'pack-u',
    payload: 'unverified bytes',
    verified: false,
    root,
    actor,
  });
  const noTrust = await replicateOrImportPack({
    packId: unverified.id,
    root,
    actor,
  });
  check(
    'US-CF-no-auto-trust',
    noTrust.accepted === false &&
      noTrust.reason === 'UNVERIFIED_PACK_NOT_AUTO_TRUSTED',
    'Unverified packs are not auto-trusted.',
  );

  // --- Quantization/placement lab output remains sandbox ---
  const place = await runPlacementExperiment({
    workloadId: 'wl-cf',
    target: 'gpu',
    forceProductionAuthorize: true,
    root,
    actor,
  });
  const quant = await runQuantizationExperiment({
    modelId: 'm-cf',
    bits: 4,
    root,
    actor,
  });
  const labAuth = await attemptLabProductionAuthorize({
    experimentId: quant.id,
    root,
    actor,
  });
  check(
    'US-CF-lab-sandbox',
    place.productionAuthorized === false &&
      place.status === 'denied' &&
      quant.status === 'sandbox' &&
      labAuth.denied === true &&
      labAuth.reason === QUANTIZATION_LAB_SANDBOX,
    'Quantization/placement lab output remains sandbox.',
  );

  // --- Archive shift respects authorization bounds ---
  const shiftOk = await runArchiveResearchShift({
    archiveId: 'a-ok',
    authorization: 'authorized',
    boundMaxHops: 2,
    hopsRequested: 2,
    root,
    actor,
  });
  const shiftRare = await runArchiveResearchShift({
    archiveId: 'a-rare',
    authorization: 'unauthorized',
    rareKnowledgeClaim: true,
    root,
    actor,
  });
  const shiftOver = await runArchiveResearchShift({
    archiveId: 'a-over',
    authorization: 'licensed',
    boundMaxHops: 2,
    hopsRequested: 9,
    root,
    actor,
  });
  const shiftSoul = await runArchiveResearchShift({
    archiveId: 'a-soul',
    authorization: 'public_domain',
    soulResurrectionClaim: true,
    root,
    actor,
  });
  check(
    'US-CF-archive-bounds',
    shiftOk.accepted === true &&
      shiftRare.accepted === false &&
      shiftOver.accepted === false &&
      shiftOver.reason === ARCHIVE_SHIFT_BOUNDS &&
      shiftSoul.accepted === false &&
      shiftSoul.soulResurrectionClaim === true,
    'Archive shift respects authorization bounds; rare ≠ bypass; no soul claims.',
  );

  const cycle = await runDataRefineryCompressionReplicationCycle({
    orgId: 'org-cf',
    tenantId: 'tenant-cf',
    universeId: 'univ-cf',
    actor,
    root,
  });
  check(
    'US-CF-cycle-run',
    cycle.hops.length === DATA_REFINERY_COMPRESSION_REPLICATION_CYCLE.length &&
      cycle.nextPhase === NEXT_PHASE_TITLE &&
      cycle.locks.L4_AUTONOMY_ENABLED === false,
    `Cycle ran ${cycle.hops.length} hops.`,
  );

  const health = await buildDataRefineryCompressionReplicationHealthReport({
    root: repoRoot,
  });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CF-health-report',
    health.phase === '62L-CF' &&
      health.githubSoT === 96 &&
      health.gitlabCoordination === 30 &&
      health.productionAuthorized === false &&
      preds.BZ.tipProbe === 'PRESENT',
    'Health report exposes SoT citations and honesty.',
  );
} catch (error) {
  failures.push(`EXCEPTION: ${(error as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} assertion(s):`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lcf — all required CF assertions passed');
