import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  approveExchangeEndpoint,
  attemptKnowledgeExchange,
  exchangeOsHonesty,
} from './global-knowledge-exchange-os';
import {
  attemptFabricPrivatePooling,
  enrollRegionalMicroCloud,
  microCloudFabricHonesty,
} from './regional-micro-cloud-fabric';
import {
  archiveDiscoveryHonesty,
  attemptArchiveDiscovery,
  registerArchiveDiscoverySource,
} from './international-archive-discovery-engine';
import {
  attemptTradeTechGraphPromotion,
  recordTradeTechNode,
  tradeTechGraphHonesty,
} from './historical-trade-technology-civilization-graph';
import {
  applyKnowledgePack,
  compressionHonesty,
  createSignedKnowledgePack,
  proposeCompressionCandidate,
  revokeKnowledgePack,
} from './cross-cloud-knowledge-compression';
import {
  attemptResearchAuthorityEscalation,
  openResearchWorkcell,
  recordResearchLearning,
  researchCoordinationHonesty,
} from './worldwide-research-coordination-grid';
import {
  ALL_WORLD_COVERAGE_NOT_VERIFIED,
  CO_LOCKS,
  COMPRESSION_NOT_PRODUCTION_AUTHORIZED,
  GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE,
  GRAPH_PROMOTE_REJECTED,
  HONESTY_BANNER,
  MISSING_META_DENIED_OR_UNKNOWN,
  NEXT_PHASE_TITLE,
  RESEARCH_AUTHORITY_DENIED,
  SEALED_CROSS_CLOUD_DENIED,
  UNAPPROVED_ENDPOINT_EXCHANGE_DENIED,
  UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED,
  UNKNOWN_GAP_PRESERVED,
  UNSIGNED_OR_REVOKED_PACK_REJECTED,
  predecessorMap,
  type CoActor,
} from './global-knowledge-exchange-os-types';
import {
  buildGlobalKnowledgeExchangeOsHealthReport,
  runGlobalKnowledgeExchangeOsCycle,
} from './global-knowledge-exchange-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lco-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CoActor = {
  kind: 'exchange_os',
  id: 'exchange-co-1',
  orgId: 'org-co',
  tenantId: 'tenant-co',
  universeId: 'univ-co',
  role: 'exchange',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CO1-cycle',
    GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE.join(' → ') ===
      'honesty_locks → exchange_approved_endpoint → exchange_unapproved_endpoint_denied → missing_residency_classification_provenance_denied_or_unknown → unknown_gap_preserved → micro_cloud_fabric_enroll → archive_discovery_authorized → unauthorized_archive_discovery_denied → compression_candidate_gated → compression_not_auto_production_authorized → sealed_no_silent_cross_cloud → unsigned_or_revoked_pack_rejected → research_workcell_bounded → research_permission_spend_escalation_denied → trade_tech_graph_provenance_typed → graph_reject_correlation_sim_to_verified_fact → all_world_coverage_without_evidence_not_verified → evidence → learning',
    'Global knowledge exchange OS cycle recorded in order.',
  );

  check(
    'US-CO-locks',
    CO_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CO_LOCKS.EXCHANGE_REQUIRES_APPROVED_ENDPOINT === true &&
      CO_LOCKS.UNAPPROVED_ENDPOINT_EXCHANGE === false &&
      CO_LOCKS.MISSING_META_SILENT_ALLOW === false &&
      CO_LOCKS.INVENT_COVERAGE_FOR_UNKNOWN_GAP === false &&
      CO_LOCKS.ARBITRARY_ARCHIVE_DISCOVERY === false &&
      CO_LOCKS.COMPRESSION_AUTO_PRODUCTION_AUTHORIZED === false &&
      CO_LOCKS.SEALED_SILENT_CROSS_CLOUD === false &&
      CO_LOCKS.UNSIGNED_PACK_ACCEPT === false &&
      CO_LOCKS.REVOKED_PACK_ACCEPT === false &&
      CO_LOCKS.RESEARCH_PERMISSION_ESCALATION === false &&
      CO_LOCKS.RESEARCH_AUTONOMOUS_SPEND === false &&
      CO_LOCKS.LEARNING_IS_PERMISSION === false &&
      CO_LOCKS.CORRELATION_PROMOTE_TO_VERIFIED_FACT === false &&
      CO_LOCKS.SIM_PROMOTE_TO_VERIFIED_FACT === false &&
      CO_LOCKS.ALL_WORLD_COVERAGE_WITHOUT_EVIDENCE === false &&
      CO_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      CO_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      CO_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, approved-only exchange, no sealed→cloud, no auto compression auth.',
  );

  check(
    'US-CO-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CP — XIV Global Knowledge Supply Chain'),
    'Next queue title is 62L-CP only (title).',
  );

  check(
    'US-CO-honesty-modules',
    exchangeOsHonesty().unapprovedEndpointExchange === false &&
      microCloudFabricHonesty().rawPrivatePoolingDefault === false &&
      archiveDiscoveryHonesty().preserveExplicitUnknownGaps === true &&
      tradeTechGraphHonesty().simPromoteToVerifiedFact === false &&
      compressionHonesty().compressionIsCandidateOnly === true &&
      researchCoordinationHonesty().learningIsPermission === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Exchange to unapproved endpoint DENIED ---
  const from = await approveExchangeEndpoint({
    kind: 'server',
    label: 'from-server',
    regionId: 'r1',
    root,
    actor,
  });
  const to = await approveExchangeEndpoint({
    kind: 'api',
    label: 'to-api',
    regionId: 'r2',
    root,
    actor,
  });
  const unapproved = await attemptKnowledgeExchange({
    fromEndpointId: from.id,
    toEndpointId: 'missing-ep',
    forceUnapproved: true,
    residency: 'r1',
    classification: 'internal',
    provenanceRef: 'p1',
    root,
    actor,
  });
  check(
    'US-CO-unapproved-endpoint-denied',
    unapproved.accepted === false &&
      unapproved.state === 'DENIED' &&
      unapproved.reason === UNAPPROVED_ENDPOINT_EXCHANGE_DENIED,
    'Exchange to unapproved endpoint DENIED.',
  );

  // --- Missing residency/classification/provenance → DENIED or UNKNOWN ---
  const missing = await attemptKnowledgeExchange({
    fromEndpointId: from.id,
    toEndpointId: to.id,
    residency: 'r1',
    classification: null,
    provenanceRef: null,
    root,
    actor,
  });
  check(
    'US-CO-missing-meta-denied-or-unknown',
    missing.accepted === false &&
      missing.state === 'UNKNOWN' &&
      missing.reason === MISSING_META_DENIED_OR_UNKNOWN,
    'Missing classification/provenance → UNKNOWN (not silent allow).',
  );

  const ok = await attemptKnowledgeExchange({
    fromEndpointId: from.id,
    toEndpointId: to.id,
    residency: 'r1',
    classification: 'internal',
    provenanceRef: 'p-ok',
    root,
    actor,
  });
  check(
    'US-CO-approved-exchange-ok',
    ok.accepted === true && ok.state === 'APPROVED',
    'Approved endpoint exchange with full meta accepted.',
  );

  // --- Explicit UNKNOWN gap preserved ---
  const gapSrc = await registerArchiveDiscoverySource({
    name: 'partial-coverage',
    authorized: true,
    unknownGaps: ['gap-sahara-mss', 'gap-andean-precolumbian'],
    inventCoverageForGaps: true,
    root,
    actor,
  });
  const gapDisc = await attemptArchiveDiscovery({
    sourceId: gapSrc.id,
    unknownGaps: gapSrc.unknownGaps,
    inventCoverageForGaps: true,
    root,
    actor,
  });
  check(
    'US-CO-unknown-gap-preserved',
    gapSrc.unknownGaps.length === 2 &&
      gapSrc.reason === UNKNOWN_GAP_PRESERVED &&
      gapDisc.accepted === false &&
      gapDisc.reason === UNKNOWN_GAP_PRESERVED &&
      gapDisc.unknownGaps.length === 2,
    'Explicit UNKNOWN gaps preserved; not filled with fabricated coverage.',
  );

  // --- Unauthorized archive discovery DENIED ---
  const badArch = await registerArchiveDiscoverySource({
    name: 'unauthorized-crawl',
    authorized: false,
    root,
    actor,
  });
  const badDisc = await attemptArchiveDiscovery({
    sourceId: badArch.id,
    authorized: false,
    root,
    actor,
  });
  check(
    'US-CO-unauthorized-archive-denied',
    badArch.coverageStatus === 'DENIED' &&
      badDisc.accepted === false &&
      badDisc.reason === UNAUTHORIZED_ARCHIVE_DISCOVERY_DENIED,
    'Unauthorized archive discovery DENIED.',
  );

  // --- Compression candidate not auto production-authorized ---
  const cmp = await proposeCompressionCandidate({
    label: 'pack-delta',
    attemptAutoProductionAuthorize: true,
    root,
    actor,
  });
  check(
    'US-CO-compression-not-prod-auth',
    cmp.status === 'CANDIDATE' &&
      cmp.productionAuthorized === false &&
      cmp.reason === COMPRESSION_NOT_PRODUCTION_AUTHORIZED,
    'Compression candidate not auto production-authorized.',
  );

  // --- Sealed content cannot silent-route cross-cloud ---
  const sealed = await attemptKnowledgeExchange({
    fromEndpointId: from.id,
    toEndpointId: to.id,
    residency: 'r1',
    classification: 'sealed',
    provenanceRef: 'p-sealed',
    sealed: true,
    attemptSilentCrossCloud: true,
    root,
    actor,
  });
  check(
    'US-CO-sealed-no-silent-cross-cloud',
    sealed.accepted === false && sealed.reason === SEALED_CROSS_CLOUD_DENIED,
    'Sealed content cannot silent-route cross-cloud.',
  );

  // --- Unsigned/revoked pack rejected ---
  const unsigned = await createSignedKnowledgePack({
    label: 'u-pack',
    signed: false,
    root,
    actor,
  });
  const signed = await createSignedKnowledgePack({
    label: 's-pack',
    signed: true,
    root,
    actor,
  });
  await revokeKnowledgePack({ packId: signed.id, root, actor });
  const uApply = await applyKnowledgePack({ packId: unsigned.id, root, actor });
  const rApply = await applyKnowledgePack({ packId: signed.id, root, actor });
  check(
    'US-CO-unsigned-revoked-rejected',
    uApply.accepted === false &&
      rApply.accepted === false &&
      uApply.reason === UNSIGNED_OR_REVOKED_PACK_REJECTED &&
      rApply.reason === UNSIGNED_OR_REVOKED_PACK_REJECTED,
    'Unsigned/revoked pack rejected.',
  );

  // --- Research workcell cannot escalate permissions or spend ---
  const wc = await openResearchWorkcell({
    regionId: 'r1',
    objective: 'bounded comparative trade study',
    root,
    actor,
  });
  const escOpen = await openResearchWorkcell({
    regionId: 'r1',
    objective: 'authority probe',
    attemptPermissionEscalation: true,
    attemptSpend: true,
    root,
    actor,
  });
  const esc = await attemptResearchAuthorityEscalation({
    workcellId: wc.id,
    attemptPermissionEscalation: true,
    attemptSpend: true,
    root,
    actor,
  });
  const learnEsc = await recordResearchLearning({
    workcellId: wc.id,
    lesson: 'patterns observed',
    claimPermissionFromLearning: true,
    root,
    actor,
  });
  check(
    'US-CO-research-no-escalate-spend',
    wc.accepted === true &&
      escOpen.accepted === false &&
      esc.accepted === false &&
      esc.reason === RESEARCH_AUTHORITY_DENIED &&
      learnEsc.accepted === false &&
      learnEsc.learningIsPermission === false,
    'Research workcell cannot escalate permissions or spend.',
  );

  // --- Graph rejects promoting correlation/sim to verified fact ---
  const corr = await recordTradeTechNode({
    label: 'spice-route-corr',
    kind: 'correlation',
    root,
    actor,
  });
  const sim = await recordTradeTechNode({
    label: 'tech-diffusion-sim',
    kind: 'simulation',
    root,
    actor,
  });
  const promoC = await attemptTradeTechGraphPromotion({
    nodeOrEdgeId: corr.id,
    fromKind: 'correlation',
    root,
    actor,
  });
  const promoS = await attemptTradeTechGraphPromotion({
    nodeOrEdgeId: sim.id,
    fromKind: 'simulation',
    root,
    actor,
  });
  check(
    'US-CO-graph-no-promote',
    promoC.accepted === false &&
      promoS.accepted === false &&
      promoC.reason === GRAPH_PROMOTE_REJECTED &&
      promoS.reason === GRAPH_PROMOTE_REJECTED,
    'Graph rejects promoting correlation/sim to verified fact.',
  );

  // --- All-world coverage without evidence not VERIFIED ---
  const allWorld = await registerArchiveDiscoverySource({
    name: 'planet-claim',
    authorized: true,
    coverageClaim: 'all_world',
    coverageEvidenceRefs: [],
    root,
    actor,
  });
  check(
    'US-CO-all-world-not-verified',
    allWorld.coverageStatus === 'NOT_VERIFIED' &&
      allWorld.reason === ALL_WORLD_COVERAGE_NOT_VERIFIED,
    'All-world coverage without evidence not VERIFIED.',
  );

  // Micro-cloud fabric raw private pooling denied
  const node = await enrollRegionalMicroCloud({
    regionId: 'r1',
    label: 'micro-1',
    root,
    actor,
  });
  const pool = await attemptFabricPrivatePooling({
    fromRegionId: 'r1',
    toRegionId: 'r2',
    mode: 'raw_private',
    root,
    actor,
  });
  check(
    'US-CO-fabric-no-raw-pool',
    node.enrolled === true && pool.accepted === false,
    'Regional micro-cloud fabric denies raw private pooling.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CO-predecessors',
    preds.CN.tipProbe === 'PRESENT' &&
      preds.CM.tipProbe === 'PRESENT' &&
      preds.CL.tipProbe === 'PRESENT' &&
      preds.CI.tipProbe === 'PRESENT',
    `Predecessor map: CN=${preds.CN.tipProbe}/${preds.CN.report}; CM=${preds.CM.tipProbe}/${preds.CM.report}; CL=${preds.CL.tipProbe}/${preds.CL.report}.`,
  );

  const health = await buildGlobalKnowledgeExchangeOsHealthReport({ root: repoRoot });
  check(
    'US-CO-health',
    health.phase === '62L-CO' &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.githubSotIssue === 105 &&
      health.gitlabCoordinationIssue === 39 &&
      health.nextPhase.startsWith('62L-CP'),
    'Health report exposes phase/locks/SoT/next title.',
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lco-cycle-'));
  try {
    const cycle = await runGlobalKnowledgeExchangeOsCycle({
      orgId: 'org-co',
      tenantId: 'tenant-co',
      universeId: 'univ-co',
      actor,
      root: cycleRoot,
    });
    check(
      'US-CO-cycle-run',
      cycle.ok === true &&
        cycle.hops.length === GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE.length &&
        cycle.hops.every((h, i) => h.hop === GLOBAL_KNOWLEDGE_EXCHANGE_OS_CYCLE[i]),
      `Cycle ok with ${cycle.hops.length} hops.`,
    );
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CO tests:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CO global knowledge exchange OS tests passed');
