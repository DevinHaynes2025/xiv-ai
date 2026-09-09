import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  activateSparseFounderAvatar,
  attemptFounderAvatarAction,
  founderAvatarHonesty,
} from './founder-avatar-delegate-universe';
import {
  evaluateLawEthicsGate,
  lawEthicsHonesty,
} from './law-ethics-governance';
import {
  chipFabricHonesty,
  optimizeWorkloadToChip,
  recordCapacityPartitionClaim,
  registerChipIntelligence,
  routeQuantumInformedResearch,
} from './planetary-chip-intelligence-fabric';
import {
  BW_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_CYCLE,
  AVATAR_DEAL_APPROVAL_DENIED,
  AVATAR_DEPLOY_DENIED,
  AVATAR_IMPERSONATION_DENIED,
  AVATAR_MONEY_MOVE_DENIED,
  AVATAR_PUBLISH_DENIED,
  ARTICLE_EXTERNAL_PUBLISH_DENIED,
  CAPACITY_UNVERIFIED,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  TRILLION_PROCESSES_DENIED,
  UNCONFIGURED_DEVICE_UNAVAILABLE,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  UNVERIFIED_WEB_SOURCE_DENIED,
  predecessorMap,
  type BwActor,
} from './planetary-chip-founder-avatar-ethics-types';
import {
  buildPlanetaryChipFounderAvatarEthicsHealthReport,
  runPlanetaryChipFounderAvatarEthicsCycle,
} from './planetary-chip-founder-avatar-ethics-runtime';
import {
  addressSparseCatalog,
  activateSparseRoute,
  attemptSpawnTrillionProcesses,
  claimRoutingCapacity,
  LOGICAL_CATALOG_ADDRESS_SPACE,
  MAX_ACTIVE_SPARSE_ROUTES,
  probeSparseCatalogStats,
  sparseRoutingHonesty,
} from './sparse-neural-routing-fabric';
import {
  activateDeviceAdapter,
  connectProvider,
  devicePluginMeshHonesty,
  registerDeviceAdapter,
  registerProviderConnector,
} from './universal-device-plugin-neural-mesh';
import {
  attemptExternalArticlePublish,
  generateXivArticleDraft,
  mineVerifiedWebKnowledge,
  registerWebSource,
  webKnowledgeHonesty,
} from './verified-web-knowledge-mining';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbw-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: BwActor = {
  kind: 'ordinary_agent',
  id: 'agent-bw-1',
  orgId: 'org-bw',
  tenantId: 'tenant-bw',
  universeId: 'univ-bw',
  role: 'operator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-BW1-cycle',
    PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_CYCLE.join(' → ') ===
      'honesty_locks → chip_fabric_map → workload_chip_optimize_verified_only → quantum_requires_classical_baseline → avatar_sparse_activate → avatar_hard_denies → law_ethics_unknown_deny → web_mining_verified_only → article_draft_no_external_publish → device_provider_unenrolled_unavailable → sparse_neural_route_bounded → trillion_catalog_no_trillion_processes → capacity_claim_needs_benchmark → evidence → learning',
    'Planetary chip / founder avatar / ethics cycle recorded in order.',
  );

  check(
    'US-BW-locks',
    BW_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BW_LOCKS.FOUNDER_IMPERSONATION === false &&
      BW_LOCKS.AVATAR_APPROVE_DEALS === false &&
      BW_LOCKS.AVATAR_MOVE_MONEY === false &&
      BW_LOCKS.AVATAR_DEPLOY_PRODUCTION === false &&
      BW_LOCKS.AVATAR_EXTERNAL_PUBLISH === false &&
      BW_LOCKS.UNKNOWN_CONSENT_SILENT_PASS === false &&
      BW_LOCKS.UNVERIFIED_WEB_SOURCE_MINING === false &&
      BW_LOCKS.TRILLION_LIVE_PROCESSES === false &&
      BW_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
      BW_LOCKS.SPARSE_LOGICAL_ONLY === true &&
      BW_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BW_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, avatar hard denies, sparse logical, no mega-PR.',
  );

  check(
    'US-BW-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BX — XIV Neural Chip OS Abstraction'),
    'Next queue title is 62L-BX only (title).',
  );

  // --- Avatar cannot impersonate / approve deal / move money / deploy / publish ---
  const avatar = await activateSparseFounderAvatar({
    pathwayKey: 'advisory/ops',
    actor,
    root,
  });
  const impersonate = await attemptFounderAvatarAction({
    delegateId: avatar.delegate!.id,
    action: 'impersonate_founder',
    actor,
    root,
  });
  const deal = await attemptFounderAvatarAction({
    delegateId: avatar.delegate!.id,
    action: 'approve_deal',
    actor,
    root,
  });
  const money = await attemptFounderAvatarAction({
    delegateId: avatar.delegate!.id,
    action: 'move_money',
    actor,
    root,
  });
  const deploy = await attemptFounderAvatarAction({
    delegateId: avatar.delegate!.id,
    action: 'deploy_production',
    actor,
    root,
  });
  const publish = await attemptFounderAvatarAction({
    delegateId: avatar.delegate!.id,
    action: 'external_publish',
    actor,
    root,
  });
  check(
    'US-BW-avatar-hard-denies',
    avatar.accepted === true &&
      avatar.delegate?.canImpersonateFounder === false &&
      impersonate.accepted === false &&
      impersonate.reason === AVATAR_IMPERSONATION_DENIED &&
      deal.accepted === false &&
      deal.reason === AVATAR_DEAL_APPROVAL_DENIED &&
      money.accepted === false &&
      money.reason === AVATAR_MONEY_MOVE_DENIED &&
      deploy.accepted === false &&
      deploy.reason === AVATAR_DEPLOY_DENIED &&
      publish.accepted === false &&
      publish.reason === AVATAR_PUBLISH_DENIED,
    'Avatar cannot impersonate founder / approve deal / move money / deploy / external publish.',
  );

  // --- Unknown consent/license/jurisdiction → DENIED or WAITING_DATA ---
  const consent = await evaluateLawEthicsGate({
    dimension: 'consent',
    knowledge: 'unknown',
    actor,
    root,
  });
  const license = await evaluateLawEthicsGate({
    dimension: 'licensing',
    knowledge: 'waiting_data',
    actor,
    root,
  });
  const jurisdiction = await evaluateLawEthicsGate({
    dimension: 'jurisdiction',
    knowledge: 'unknown',
    actor,
    root,
  });
  check(
    'US-BW-ethics-unknown-deny',
    consent.decision === 'DENIED' &&
      consent.silentPass === false &&
      license.decision === 'WAITING_DATA' &&
      license.silentPass === false &&
      jurisdiction.decision === 'DENIED' &&
      jurisdiction.silentPass === false,
    'Unknown consent/license/jurisdiction → DENIED or WAITING_DATA (not silent allow).',
  );

  // --- Unverified web source mining DENIED ---
  const forceSrc = await registerWebSource({
    url: 'https://arbitrary.example/page',
    forceVerifiedWithoutProof: true,
    actor,
    root,
  });
  const unverified = await registerWebSource({
    url: 'https://arbitrary.example/page',
    verified: false,
    actor,
    root,
  });
  const mineUnverified = await mineVerifiedWebKnowledge({
    sourceId: unverified.source!.id,
    actor,
    root,
  });
  check(
    'US-BW-unverified-web-denied',
    forceSrc.accepted === false &&
      mineUnverified.accepted === false &&
      mineUnverified.reason === UNVERIFIED_WEB_SOURCE_DENIED,
    'Unverified web source mining DENIED.',
  );

  // --- Unconfigured device/provider → UNAVAILABLE ---
  const prov = await registerProviderConnector({
    name: 'ghost-provider',
    configured: false,
    authorized: false,
    verified: false,
    actor,
    root,
  });
  const conn = await connectProvider({ providerId: prov.provider.id, actor, root });
  const device = await registerDeviceAdapter({
    deviceClass: 'wearable',
    enrolled: false,
    verified: false,
    hardwareSupported: false,
    actor,
    root,
  });
  const actDev = await activateDeviceAdapter({ deviceId: device.device.id, actor, root });
  check(
    'US-BW-unconfigured-unavailable',
    prov.status === 'unavailable' &&
      prov.reason === UNCONFIGURED_PROVIDER_UNAVAILABLE &&
      conn.status === 'unavailable' &&
      device.status === 'unavailable' &&
      device.reason === UNCONFIGURED_DEVICE_UNAVAILABLE &&
      actDev.status === 'unavailable',
    'Unconfigured device/provider → UNAVAILABLE.',
  );

  // --- Trillion-scale catalog addressable without spawning trillion processes ---
  const addr = addressSparseCatalog({
    addressIndex: LOGICAL_CATALOG_ADDRESS_SPACE - 1n,
    kind: 'agent',
  });
  const spawn = await attemptSpawnTrillionProcesses({
    requestedProcesses: 1_000_000_000_000n,
    actor,
    root,
  });
  const route = await activateSparseRoute({
    from: 'business:acme',
    to: 'evidence:ledger',
    fromKind: 'business',
    toKind: 'evidence',
    actor,
    root,
  });
  const stats = await probeSparseCatalogStats(root);
  check(
    'US-BW-trillion-sparse-no-processes',
    addr.accepted === true &&
      addr.processesSpawned === 0 &&
      addr.processSpawned === false &&
      spawn.accepted === false &&
      spawn.processesSpawned === 0 &&
      spawn.reason === TRILLION_PROCESSES_DENIED &&
      spawn.logicalCatalogAddressable === true &&
      route.accepted === true &&
      route.activeCount <= MAX_ACTIVE_SPARSE_ROUTES &&
      stats.processesSpawned === 0 &&
      stats.trillionLiveProcesses === false,
    'Trillion-scale catalog addressable without spawning trillion processes; activation bounded.',
  );

  // --- Capacity/partition claims require benchmark evidence else not VERIFIED ---
  const capNo = await recordCapacityPartitionClaim({
    claim: 'unlimited fabric',
    metric: 'ops',
    value: 1e15,
    unit: 'ops/s',
    forceVerifiedWithoutBenchmark: true,
    actor,
    root,
  });
  const capRouteNo = await claimRoutingCapacity({
    claim: 'infinite routes',
    forceVerifiedWithoutBenchmark: true,
    actor,
    root,
  });
  const capYes = await claimRoutingCapacity({
    claim: 'bounded activation p50',
    evidenceRefs: ['benchmark:sparse-p50'],
    actor,
    root,
  });
  check(
    'US-BW-capacity-needs-benchmark',
    capNo.labeledVerified === false &&
      capNo.reason === CAPACITY_UNVERIFIED &&
      capRouteNo.labeledVerified === false &&
      capYes.labeledVerified === true,
    'Capacity/partition claims require benchmark evidence else not VERIFIED.',
  );

  // --- Classical baseline required before quantum route comparison ---
  const qDeny = await routeQuantumInformedResearch({
    objective: 'qaoa demo',
    classicalBaselinePresent: false,
    claimQuantumAdvantage: true,
    actor,
    root,
  });
  const qOk = await routeQuantumInformedResearch({
    objective: 'qaoa demo',
    classicalBaselineId: 'classical-baseline-1',
    classicalBaselinePresent: true,
    quantumBackend: 'classical_simulator',
    actor,
    root,
  });
  const qpuUnavail = await routeQuantumInformedResearch({
    objective: 'qaoa demo',
    classicalBaselinePresent: true,
    classicalBaselineId: 'classical-baseline-1',
    quantumBackend: 'quantum_qpu',
    backendVerified: false,
    actor,
    root,
  });
  check(
    'US-BW-quantum-classical-baseline',
    qDeny.accepted === false &&
      qDeny.reason === QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      qOk.accepted === true &&
      qOk.claimsQuantumAdvantage === false &&
      qpuUnavail.status === 'unavailable',
    'Classical baseline required before quantum route comparison; unverified QPU UNAVAILABLE.',
  );

  // --- Article remains unpublished without human gate ---
  const article = await generateXivArticleDraft({
    title: 'XIV draft',
    body: 'candidate only',
    actor,
    root,
  });
  const pub = await attemptExternalArticlePublish({
    articleId: article.article!.id,
    actor,
    root,
  });
  check(
    'US-BW-article-unpublished',
    article.unpublished === true &&
      article.article?.status === 'draft_candidate' &&
      pub.published === false &&
      pub.externalPublishAuthorized === false &&
      pub.reason === ARTICLE_EXTERNAL_PUBLISH_DENIED,
    'Article remains unpublished without human gate.',
  );

  // Chip verified-only optimization
  const chip = await registerChipIntelligence({
    vendor: 'SemiCo',
    family: 'GPU-Z',
    chipClass: 'gpu',
    verifiedTarget: true,
    evidenceRefs: ['bench:gpu-z'],
    actor,
    root,
  });
  const chipCand = await registerChipIntelligence({
    vendor: 'NoProof',
    family: 'X',
    chipClass: 'asic',
    actor,
    root,
  });
  const opt = await optimizeWorkloadToChip({
    workloadId: 'ml-infer',
    chipId: chip.chip!.id,
    actor,
    root,
  });
  const optBad = await optimizeWorkloadToChip({
    workloadId: 'ml-infer',
    chipId: chipCand.chip!.id,
    claimVerifiedWithoutProof: true,
    actor,
    root,
  });
  check(
    'US-BW-chip-verified-targets',
    opt.labeledVerified === true && optBad.accepted === false,
    'Workload-to-chip optimization: verified targets only.',
  );

  // Honesty helpers
  check(
    'US-BW-honesty-helpers',
    chipFabricHonesty().l4AutonomyEnabled === false &&
      founderAvatarHonesty().founderImpersonation === false &&
      lawEthicsHonesty().unknownConsentSilentPass === false &&
      webKnowledgeHonesty().verifiedSourcesOnly === true &&
      devicePluginMeshHonesty().unconfiguredDeviceAvailable === false &&
      sparseRoutingHonesty().trillionLiveProcesses === false,
    'Subsystem honesty helpers report deny-by-default locks.',
  );

  // Full cycle + health
  const cycle = await runPlanetaryChipFounderAvatarEthicsCycle({
    orgId: 'org-bw',
    tenantId: 'tenant-bw',
    universeId: 'univ-bw',
    actor,
    root,
  });
  check(
    'US-BW-cycle-run',
    cycle.accepted === true &&
      cycle.hops.length === PLANETARY_CHIP_FOUNDER_AVATAR_ETHICS_CYCLE.length &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    'Full BW cycle walks all hops.',
  );

  const health = await buildPlanetaryChipFounderAvatarEthicsHealthReport({
    orgId: 'org-bw',
    tenantId: 'tenant-bw',
    universeId: 'univ-bw',
    root: repoRoot,
  });
  check(
    'US-BW-health-report',
    health.phase === '62L-BW' &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.githubSoT === 87 &&
      health.gitlabCoordination === 21 &&
      health.modules.planetaryChipIntelligenceFabric === 'IMPLEMENTED',
    'Health report encodes honesty + SoT issue numbers.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BW-predecessor-map',
    preds.BV.tipProbe === 'WAITING_DATA' &&
      preds.BU.tipProbe === 'PRESENT' &&
      preds.BU.report === 'PRESENT',
    `Predecessor probes (BV=${preds.BV.tipProbe}, BU=${preds.BU.tipProbe}).`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BW tests:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-BW phase62lbw tests passed');
