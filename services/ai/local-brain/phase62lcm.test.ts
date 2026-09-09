import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptCrossRegionPrivatePooling,
  enrollRegionalKnowledgeCloud,
  regionalCloudHonesty,
} from './sovereign-regional-knowledge-clouds';
import {
  archiveObservatoryHonesty,
  claimAllWorldCoverage,
  intakeArchiveObservation,
  registerArchiveSource,
} from './global-archive-observatory';
import {
  attemptRelabelForecastOrSimAsFact,
  emitIntelligenceOutput,
  intelligenceGridHonesty,
} from './international-intelligence-grid';
import {
  optimizeKnowledgeRoute,
  registerRouteNode,
  routeOptimizationHonesty,
} from './knowledge-route-optimization-engine';
import {
  embassyNetworkHonesty,
  openEmbassyWorkcell,
  probeEmbassyAuthority,
} from './agent-embassy-network';
import {
  enrollCacheDevice,
  installOfflineKnowledgeCache,
  offlineCacheFabricHonesty,
  publishOfflineKnowledgeCache,
  revokeOfflineKnowledgeCache,
} from './planetary-offline-knowledge-cache-fabric';
import {
  ALL_WORLD_COVERAGE_NOT_VERIFIED,
  CM_LOCKS,
  CROSS_REGION_POOLING_DENIED,
  EMBASSY_AUTHORITY_DENIED,
  FORECAST_SIM_NOT_FACT,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SEALED_REGIONAL_CLOUD_DENIED,
  SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE,
  TRUST_POLICY_ROUTE_WINS,
  UNAUTHORIZED_ARCHIVE_INTAKE_DENIED,
  UNAPPROVED_NODE_EXCLUDED,
  UNENROLLED_CACHE_INSTALL_DENIED,
  UNSIGNED_OR_REVOKED_CACHE_REJECTED,
  predecessorMap,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';
import {
  buildSovereignRegionalKnowledgeCloudsHealthReport,
  runSovereignRegionalKnowledgeCloudsCycle,
} from './sovereign-regional-knowledge-clouds-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcm-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CmActor = {
  kind: 'regional_cloud_agent',
  id: 'cm-agent-1',
  orgId: 'org-cm',
  tenantId: 'tenant-cm',
  universeId: 'univ-cm',
  role: 'regional',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CM1-cycle',
    SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE.join(' → ') ===
      'honesty_locks → region_cloud_enroll → cross_region_raw_private_pooling_denied → archive_authorized_intake → archive_unauthorized_intake_denied → archive_all_world_without_evidence_not_verified → intel_grid_emit_with_honesty_labels → intel_forecast_sim_not_verified_fact → route_exclude_unapproved_node → route_trust_policy_beats_speed → sealed_no_silent_regional_cloud → embassy_open_bounded_workcell → embassy_deal_spend_permission_denied → offline_cache_signed_enrolled_install → offline_cache_unsigned_or_revoked_rejected → offline_cache_unenrolled_device_denied → evidence → learning',
    'Sovereign regional knowledge clouds cycle recorded in order.',
  );

  check(
    'US-CM-locks',
    CM_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CM_LOCKS.CROSS_REGION_RAW_PRIVATE_POOLING === false &&
      CM_LOCKS.SOVEREIGN_ISOLATION_DEFAULT === true &&
      CM_LOCKS.ARBITRARY_ARCHIVE_DISCOVERY === false &&
      CM_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE === false &&
      CM_LOCKS.FORECAST_EQ_VERIFIED_FACT === false &&
      CM_LOCKS.SIMULATION_EQ_VERIFIED_FACT === false &&
      CM_LOCKS.UNAPPROVED_NODE_IN_ROUTE_OPTIMIZATION === false &&
      CM_LOCKS.TRUST_POLICY_BEATS_SPEED_COST === true &&
      CM_LOCKS.SEALED_SILENT_REGIONAL_CLOUD_FALLBACK === false &&
      CM_LOCKS.EMBASSY_DEAL_AUTHORITY === false &&
      CM_LOCKS.EMBASSY_SPEND_AUTHORITY === false &&
      CM_LOCKS.EMBASSY_PERMISSION_ESCALATION === false &&
      CM_LOCKS.UNSIGNED_CACHE_INSTALL === false &&
      CM_LOCKS.REVOKED_CACHE_INSTALL === false &&
      CM_LOCKS.UNENROLLED_DEVICE_CACHE_INSTALL === false &&
      CM_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CM_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CM_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, sovereign isolation, no sealed→cloud, no embassy authority.',
  );

  check(
    'US-CM-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CN — XIV World Knowledge Routing OS'),
    'Next queue title is 62L-CN only (title).',
  );

  check(
    'US-CM-honesty-modules',
    regionalCloudHonesty().crossRegionRawPrivatePooling === false &&
      archiveObservatoryHonesty().arbitraryArchiveDiscovery === false &&
      intelligenceGridHonesty().forecastEqVerifiedFact === false &&
      routeOptimizationHonesty().trustPolicyBeatsSpeedCost === true &&
      embassyNetworkHonesty().embassyDealAuthority === false &&
      offlineCacheFabricHonesty().offlineCacheRequiresSignature === true,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Cross-region raw private pooling DENIED by default ---
  await enrollRegionalKnowledgeCloud({
    regionId: 'r-eu',
    label: 'EU Cloud',
    root,
    actor,
  });
  await enrollRegionalKnowledgeCloud({
    regionId: 'r-us',
    label: 'US Cloud',
    root,
    actor,
  });
  const pool = await attemptCrossRegionPrivatePooling({
    fromRegionId: 'r-eu',
    toRegionId: 'r-us',
    mode: 'raw_private',
    root,
    actor,
  });
  check(
    'US-CM-cross-region-raw-private-pooling-denied',
    pool.accepted === false && pool.reason === CROSS_REGION_POOLING_DENIED,
    'Cross-region raw private pooling DENIED by default.',
  );

  // --- Unauthorized archive observatory intake DENIED ---
  const unauth = await intakeArchiveObservation({
    attemptUnauthorized: true,
    attemptArbitraryDiscovery: true,
    root,
    actor,
  });
  const authSrc = await registerArchiveSource({
    name: 'Authorized Regional Archive',
    authorized: true,
    coverageClaim: 'regional',
    coverageEvidenceRefs: ['ev://a1'],
    root,
    actor,
  });
  const authOk = await intakeArchiveObservation({
    sourceId: authSrc.id,
    root,
    actor,
  });
  check(
    'US-CM-unauthorized-archive-intake-denied',
    unauth.accepted === false &&
      unauth.reason === UNAUTHORIZED_ARCHIVE_INTAKE_DENIED &&
      authOk.accepted === true,
    'Unauthorized archive observatory intake DENIED; authorized accepted.',
  );

  // --- All-world coverage without evidence not VERIFIED ---
  const world = await registerArchiveSource({
    name: 'All-world claim without evidence',
    authorized: true,
    coverageClaim: 'all_world',
    coverageEvidenceRefs: [],
    root,
    actor,
  });
  const worldClaim = await claimAllWorldCoverage({
    sourceId: world.id,
    evidenceRefs: [],
    root,
    actor,
  });
  check(
    'US-CM-all-world-without-evidence-not-verified',
    worldClaim.coverageStatus === 'NOT_VERIFIED' &&
      worldClaim.reason === ALL_WORLD_COVERAGE_NOT_VERIFIED,
    'All-world coverage without evidence not VERIFIED.',
  );

  // --- Health/law/supply grid outputs carry honesty labels ---
  const health = await emitIntelligenceOutput({
    domain: 'health',
    summary: 'Forecast incidence',
    provenanceRefs: ['m://h'],
    intendedLabel: 'forecast',
    root,
    actor,
  });
  const law = await emitIntelligenceOutput({
    domain: 'law',
    summary: 'Simulated ruling path',
    provenanceRefs: ['sim://l'],
    intendedLabel: 'simulation',
    root,
    actor,
  });
  const supply = await emitIntelligenceOutput({
    domain: 'supply',
    summary: 'Authorized throughput fact',
    provenanceRefs: ['ledger://s'],
    intendedLabel: 'verified_fact',
    root,
    actor,
  });
  const relabel = await attemptRelabelForecastOrSimAsFact({
    outputId: health.id,
    root,
    actor,
  });
  check(
    'US-CM-intel-honesty-labels',
    health.honestyLabel === 'forecast' &&
      law.honestyLabel === 'simulation' &&
      supply.honestyLabel === 'verified_fact' &&
      relabel.accepted === false &&
      relabel.reason === FORECAST_SIM_NOT_FACT,
    'Health/law/supply honesty labels; forecast/sim ≠ verified fact.',
  );

  // --- Unapproved node excluded; faster low-trust loses to sealed/policy ---
  const trusted = await registerRouteNode({
    label: 'trusted-edge',
    kind: 'edge',
    approved: true,
    trustScore: 95,
    latencyMs: 50,
    policyTier: ['open', 'local_only', 'sealed'],
    root,
  });
  const fastLow = await registerRouteNode({
    label: 'fast-low-trust',
    kind: 'cloud',
    approved: true,
    trustScore: 10,
    latencyMs: 2,
    policyTier: ['open'],
    root,
  });
  const shadow = await registerRouteNode({
    label: 'unapproved',
    kind: 'server',
    approved: false,
    trustScore: 100,
    latencyMs: 1,
    root,
  });
  await registerRouteNode({
    label: 'regional-cloud',
    kind: 'regional_cloud',
    approved: true,
    trustScore: 60,
    latencyMs: 10,
    policyTier: ['open'],
    root,
  });

  const route = await optimizeKnowledgeRoute({
    contentClass: 'open',
    root,
    actor,
  });
  check(
    'US-CM-unapproved-node-excluded',
    route.excludedNodeIds.includes(shadow.id) &&
      !route.candidateNodeIds.includes(shadow.id) &&
      (route.reason === UNAPPROVED_NODE_EXCLUDED ||
        route.reason === TRUST_POLICY_ROUTE_WINS ||
        route.reason === 'ROUTE_OPTIMIZED_APPROVED_NODES_TRUST_POLICY_FIRST'),
    'Unapproved node excluded from route optimization.',
  );

  check(
    'US-CM-trust-policy-beats-speed',
    route.accepted === true &&
      route.selectedNodeId === trusted.id &&
      route.selectedNodeId !== fastLow.id &&
      route.reason === TRUST_POLICY_ROUTE_WINS,
    'Faster low-trust route loses to sealed/policy (trust first).',
  );

  // --- Sealed content cannot silent-route to regional cloud ---
  const sealed = await optimizeKnowledgeRoute({
    contentClass: 'sealed',
    attemptSilentRegionalCloudFallback: true,
    root,
    actor,
  });
  check(
    'US-CM-sealed-no-silent-regional-cloud',
    sealed.accepted === false &&
      sealed.silentRegionalCloudFallback === false &&
      sealed.reason === SEALED_REGIONAL_CLOUD_DENIED,
    'Sealed content cannot silent-route to regional cloud.',
  );

  // --- Embassy cannot approve deals/spend or escalate permissions ---
  const emb = await openEmbassyWorkcell({
    regionId: 'r-eu',
    languages: ['en', 'es'],
    objective: 'liaison',
    root,
    actor,
  });
  const embAuth = await openEmbassyWorkcell({
    regionId: 'r-eu',
    languages: ['en'],
    objective: 'deal probe',
    attemptDealAuthority: true,
    attemptSpendAuthority: true,
    attemptPermissionEscalation: true,
    root,
    actor,
  });
  const probe = await probeEmbassyAuthority({
    embassyId: emb.id,
    attemptDeal: true,
    attemptSpend: true,
    attemptPermissionEscalation: true,
    root,
    actor,
  });
  check(
    'US-CM-embassy-no-deal-spend-permission',
    emb.accepted === true &&
      emb.dealAuthority === false &&
      emb.spendAuthority === false &&
      embAuth.accepted === false &&
      embAuth.reason === EMBASSY_AUTHORITY_DENIED &&
      probe.accepted === false &&
      probe.reason === EMBASSY_AUTHORITY_DENIED,
    'Embassy cannot approve deals/spend or escalate permissions.',
  );

  // --- Signed cache on enrolled device OK; unsigned/revoked rejected; unenrolled DENIED ---
  const device = await enrollCacheDevice({ label: 'tablet', root, actor });
  const signed = await publishOfflineKnowledgeCache({
    label: 'pack-signed',
    signed: true,
    root,
    actor,
  });
  const okInstall = await installOfflineKnowledgeCache({
    cacheId: signed.id,
    deviceId: device.id,
    root,
    actor,
  });
  const unsigned = await publishOfflineKnowledgeCache({
    label: 'pack-unsigned',
    signed: false,
    root,
    actor,
  });
  const unsignedInstall = await installOfflineKnowledgeCache({
    cacheId: unsigned.id,
    deviceId: device.id,
    root,
    actor,
  });
  const toRevoke = await publishOfflineKnowledgeCache({
    label: 'pack-revoked',
    signed: true,
    root,
    actor,
  });
  await revokeOfflineKnowledgeCache({ cacheId: toRevoke.id, root, actor });
  const revokedInstall = await installOfflineKnowledgeCache({
    cacheId: toRevoke.id,
    deviceId: device.id,
    root,
    actor,
  });
  const unenrolledInstall = await installOfflineKnowledgeCache({
    cacheId: signed.id,
    deviceId: 'ghost-device',
    root,
    actor,
  });
  check(
    'US-CM-unsigned-revoked-cache-rejected',
    okInstall.accepted === true &&
      unsignedInstall.accepted === false &&
      unsignedInstall.reason === UNSIGNED_OR_REVOKED_CACHE_REJECTED &&
      revokedInstall.accepted === false &&
      revokedInstall.reason === UNSIGNED_OR_REVOKED_CACHE_REJECTED,
    'Unsigned/revoked offline cache rejected on enrolled device.',
  );
  check(
    'US-CM-unenrolled-device-cache-denied',
    unenrolledInstall.accepted === false &&
      unenrolledInstall.reason === UNENROLLED_CACHE_INSTALL_DENIED,
    'Unenrolled device cache install DENIED.',
  );

  // --- Cycle + health report ---
  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lcm-cycle-'));
  try {
    const cycle = await runSovereignRegionalKnowledgeCloudsCycle({
      orgId: 'org-cm',
      tenantId: 'tenant-cm',
      universeId: 'univ-cm',
      actor,
      root: cycleRoot,
    });
    check(
      'US-CM-cycle-run',
      cycle.hops.length === SOVEREIGN_REGIONAL_KNOWLEDGE_CLOUDS_CYCLE.length &&
        cycle.hops.every((h) => h.state !== 'FAIL') &&
        cycle.nextPhase === NEXT_PHASE_TITLE,
      `Cycle hops=${cycle.hops.length}; all non-FAIL.`,
    );
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }

  const healthReport = await buildSovereignRegionalKnowledgeCloudsHealthReport({
    root: repoRoot,
  });
  const preds = predecessorMap(repoRoot);
  check(
    'US-CM-health-report',
    healthReport.phase === '62L-CM' &&
      healthReport.l4AutonomyEnabled === false &&
      healthReport.githubSoT === 103 &&
      healthReport.gitlabCoordination === 37 &&
      healthReport.productionAuthorized === false &&
      preds.CL.tipProbe === 'PRESENT',
    'Health report cites GitHub #103 / GitLab #37; L4=false; CL PRESENT.',
  );

  check(
    'US-CM-waiting-gates-documented',
    (preds.CL.tipProbe === 'WAITING_DATA' || preds.CL.tipProbe === 'PRESENT') &&
      (preds.CK.tipProbe === 'WAITING_DATA' || preds.CK.tipProbe === 'PRESENT') &&
      (preds.CJ.tipProbe === 'WAITING_DATA' || preds.CJ.tipProbe === 'PRESENT'),
    `CL tipProbe=${preds.CL.tipProbe} report=${preds.CL.report}; CK tipProbe=${preds.CK.tipProbe}; CJ tipProbe=${preds.CJ.tipProbe}.`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CM stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CM sovereign regional knowledge clouds tests passed');
