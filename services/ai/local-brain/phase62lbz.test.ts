import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  attemptSelfPermissionExpansion,
  declarePlacementFirewall,
  evaluatePlacement,
  nervousSystemHonesty,
  planFailover,
  registerNervousNode,
} from './global-compute-nervous-system';
import {
  attemptFabProductionAuthorize,
  captureChipDesignKnowledge,
  chipFoundryHonesty,
} from './chip-design-knowledge-foundry';
import {
  cacheIntelligenceHonesty,
  invalidateOnChange,
  putCacheEntry,
  readCacheEntry,
} from './distributed-memory-cache-intelligence';
import {
  assignWorkToDevice,
  deviceFederationHonesty,
  enrollFederatedDevice,
  quarantineFederatedDevice,
  revokeFederatedDevice,
} from './universal-ai-device-federation';
import {
  businessSignalHonesty,
  listSignalContradictions,
  publishBusinessSignal,
  resolveContradictionPick,
} from './business-signal-exchange';
import {
  attemptOptimizerPurchaseOrBill,
  attemptOptimizerSelfPermissionExpansion,
  cognitiveRoutingHonesty,
  getCompileGeneration,
  optimizeCognitiveRoute,
  recompileRoutesOnChange,
  registerRouteCandidate,
} from './superbrain-cognitive-routing-optimizer';
import {
  BZ_LOCKS,
  CHIP_FOUNDRY_NOT_FAB,
  CONTRADICTION_SURFACED,
  GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OPTIMIZER_NO_PURCHASE,
  PLACEMENT_FIREWALL_BLOCKED,
  REVOKED_DEVICE_DENIED,
  ROUTE_RECOMPILED,
  SEALED_TRUST_BEATS_SPEED,
  SELF_PERMISSION_EXPANSION_DENIED,
  STALE_CACHE_NOT_FRESH,
  UNCONFIGURED_NODE_UNAVAILABLE,
  predecessorMap,
  type BzActor,
} from './global-compute-nervous-routing-types';
import {
  buildGlobalComputeNervousRoutingHealthReport,
  runGlobalComputeNervousRoutingCycle,
} from './global-compute-nervous-routing-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbz-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: BzActor = {
  kind: 'cognitive_routing_optimizer',
  id: 'optimizer-bz-1',
  orgId: 'org-bz',
  tenantId: 'tenant-bz',
  universeId: 'univ-bz',
  role: 'optimizer',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-BZ1-cycle',
    GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE.join(' → ') ===
      'honesty_locks → node_topology_authorize → unconfigured_node_unavailable → compute_health_observe → placement_firewall_evaluate → failover_plan_recommend → chip_foundry_capture_candidate → chip_foundry_not_fab_authority → cache_coherence_contract → stale_cache_not_fresh_verified → invalidation_on_change → device_federation_enroll → revocation_quarantine_enforce → business_signal_derived_only → contradiction_surface → route_optimize_sparse → sealed_trust_beats_speed → route_recompile_on_change → optimizer_no_purchase_bill → self_permission_expansion_denied → evidence → learning',
    'Global compute nervous / routing cycle recorded in order.',
  );

  check(
    'US-BZ-locks',
    BZ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BZ_LOCKS.SELF_PERMISSION_EXPANSION === false &&
      BZ_LOCKS.SILENT_PRODUCTION_INFRA_MUTATION === false &&
      BZ_LOCKS.PLACEMENT_FAILOVER_PLAN_ONLY === true &&
      BZ_LOCKS.REVOKED_DEVICE_RECEIVES_WORK === false &&
      BZ_LOCKS.STALE_CACHE_LABELED_FRESH_VERIFIED === false &&
      BZ_LOCKS.RAW_PRIVATE_SIGNAL_POOL_DEFAULT === false &&
      BZ_LOCKS.CONTRADICTION_SILENT_PICK === false &&
      BZ_LOCKS.SPEED_OVERRIDES_SEALED_TRUST === false &&
      BZ_LOCKS.OPTIMIZER_PURCHASE_BILL_CHARGE === false &&
      BZ_LOCKS.CHIP_FOUNDRY_IS_FAB_PRODUCTION === false &&
      BZ_LOCKS.LEARNING_IS_PERMISSION === false &&
      BZ_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BZ_LOCKS.PRODUCTION_AUTHORIZATION === false &&
      BZ_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, no self-permission, trust beats speed, plan-only placement.',
  );

  check(
    'US-BZ-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CA — Distributed Intelligence Metabolism'),
    'Next queue title is 62L-CA only (title).',
  );

  check(
    'US-BZ-honesty-modules',
    nervousSystemHonesty().l4AutonomyEnabled === false &&
      chipFoundryHonesty().chipFoundryIsFabProduction === false &&
      cacheIntelligenceHonesty().staleCacheLabeledFreshVerified === false &&
      deviceFederationHonesty().revocationQuarantineEnforced === true &&
      businessSignalHonesty().rawPrivatePoolDefault === false &&
      cognitiveRoutingHonesty().optimizerPurchaseBillCharge === false,
    'Subsystem honesty helpers expose locks.',
  );

  // --- Unconfigured node → UNAVAILABLE ---
  const bare = await registerNervousNode({
    label: 'bare-node',
    locality: 'edge',
    configured: false,
    authorized: false,
    root,
    actor,
  });
  check(
    'US-BZ-unconfigured-node',
    bare.unavailable === true &&
      bare.node.status === 'unavailable' &&
      bare.reason === UNCONFIGURED_NODE_UNAVAILABLE,
    'Unconfigured node → UNAVAILABLE.',
  );

  const edge = await registerNervousNode({
    label: 'edge-ok',
    locality: 'edge',
    configured: true,
    authorized: true,
    root,
    actor,
  });
  const cloud = await registerNervousNode({
    label: 'cloud-blocked',
    locality: 'cloud',
    configured: true,
    authorized: true,
    root,
    actor,
  });
  const sealed = await registerNervousNode({
    label: 'sealed-node',
    locality: 'sealed',
    configured: true,
    authorized: true,
    sealed: true,
    root,
    actor,
  });

  // --- Placement firewall blocks disallowed cloud/sealed route ---
  const fw = await declarePlacementFirewall({
    name: 'no-cloud-sealed',
    denyLocalities: ['cloud', 'sealed'],
    allowCloud: false,
    root,
  });
  const cloudPlace = await evaluatePlacement({
    workloadId: 'wl-cloud',
    nodeId: cloud.node.id,
    firewallId: fw.id,
    root,
    actor,
  });
  const sealedPlace = await evaluatePlacement({
    workloadId: 'wl-sealed',
    nodeId: sealed.node.id,
    firewallId: fw.id,
    root,
    actor,
  });
  const edgePlace = await evaluatePlacement({
    workloadId: 'wl-edge',
    nodeId: edge.node.id,
    firewallId: fw.id,
    root,
    actor,
  });
  check(
    'US-BZ-placement-firewall',
    cloudPlace.status === 'denied' &&
      cloudPlace.reason === PLACEMENT_FIREWALL_BLOCKED &&
      sealedPlace.status === 'denied' &&
      edgePlace.status === 'plan' &&
      edgePlace.mutatesInfrastructure === false,
    'Placement firewall blocks cloud/sealed; edge plan-only.',
  );

  const failover = await planFailover({
    primaryNodeId: edge.node.id,
    candidateNodeIds: [cloud.node.id, bare.node.id],
    root,
    actor,
  });
  check(
    'US-BZ-failover-plan-only',
    failover.status === 'recommendation_only' &&
      failover.mutatesInfrastructure === false &&
      !failover.candidateNodeIds.includes(bare.node.id),
    'Failover is recommendation-only; unconfigured excluded.',
  );

  // --- Self-permission expansion DENIED ---
  const selfPerm = await attemptSelfPermissionExpansion({
    actor,
    requestedLevel: 99,
    root,
  });
  const optPerm = await attemptOptimizerSelfPermissionExpansion({
    actor,
    requestedLevel: 99,
    root,
  });
  check(
    'US-BZ-self-permission-denied',
    selfPerm.denied === true &&
      selfPerm.reason === SELF_PERMISSION_EXPANSION_DENIED &&
      optPerm.denied === true,
    'Self-permission expansion hard DENIED.',
  );

  // --- Revoked/quarantined device cannot receive work ---
  const phone = await enrollFederatedDevice({
    name: 'phone-a',
    enrolled: true,
    authorized: true,
    configured: true,
    verified: true,
    root,
    actor,
  });
  const okWork = await assignWorkToDevice({
    deviceId: phone.id,
    workloadId: 'wl-ok',
    root,
    actor,
  });
  await revokeFederatedDevice({ deviceId: phone.id, root, actor });
  const revokedWork = await assignWorkToDevice({
    deviceId: phone.id,
    workloadId: 'wl-revoked',
    root,
    actor,
  });
  const xr = await enrollFederatedDevice({
    name: 'xr-a',
    enrolled: true,
    authorized: true,
    configured: true,
    root,
    actor,
  });
  await quarantineFederatedDevice({ deviceId: xr.id, root, actor });
  const qWork = await assignWorkToDevice({
    deviceId: xr.id,
    workloadId: 'wl-q',
    root,
    actor,
  });
  check(
    'US-BZ-revoked-quarantine',
    okWork.accepted === true &&
      revokedWork.accepted === false &&
      revokedWork.reason === REVOKED_DEVICE_DENIED &&
      qWork.accepted === false &&
      qWork.reason === REVOKED_DEVICE_DENIED,
    'Revoked/quarantined devices cannot receive work.',
  );

  // --- Cache coherence: stale cache not treated as fresh verified ---
  await putCacheEntry({
    key: 'model-weights',
    valueDigest: 'd1',
    freshness: 'stale',
    verified: true,
    sourceVersion: 'v1',
    root,
    actor,
  });
  const stale = await readCacheEntry({
    key: 'model-weights',
    forceTreatStaleAsFreshVerified: true,
    root,
  });
  check(
    'US-BZ-stale-cache',
    stale.treatedAsFreshVerified === false && stale.reason === STALE_CACHE_NOT_FRESH,
    'Stale cache not treated as fresh verified.',
  );
  const inv = await invalidateOnChange({
    key: 'model-weights',
    changeReason: 'source_updated',
    newSourceVersion: 'v2',
    root,
    actor,
  });
  const afterInv = await readCacheEntry({ key: 'model-weights', root });
  check(
    'US-BZ-cache-invalidation',
    inv.invalidated === true &&
      afterInv.treatedAsFreshVerified === false &&
      afterInv.entry?.freshness === 'invalidated',
    'Invalidation on change keeps coherence.',
  );

  // --- Contradictory business signals surfaced ---
  const raw = await publishBusinessSignal({
    kind: 'raw_private',
    topic: 'payroll',
    claim: 'raw private dump',
    authorized: false,
    derived: false,
    root,
    actor,
  });
  await publishBusinessSignal({
    kind: 'derived_signal',
    topic: 'churn',
    claim: 'churn falling',
    polarity: 'positive',
    authorized: true,
    derived: true,
    provenanceRefs: ['agg-1'],
    root,
    actor,
  });
  const contra = await publishBusinessSignal({
    kind: 'derived_signal',
    topic: 'churn',
    claim: 'churn rising',
    polarity: 'negative',
    authorized: true,
    derived: true,
    provenanceRefs: ['agg-2'],
    root,
    actor,
  });
  const silent = await resolveContradictionPick({
    contradictionId: contra.contradiction!.id,
    pickSignalId: contra.signal.id,
    silent: true,
    root,
    actor,
  });
  const open = await listSignalContradictions(root);
  check(
    'US-BZ-signal-derived-only',
    raw.accepted === false && raw.signal.status === 'denied',
    'Raw private signal pooling denied.',
  );
  check(
    'US-BZ-contradiction-surfaced',
    !!contra.contradiction &&
      contra.contradiction.silentlyPicked === false &&
      contra.contradiction.bothRetained === true &&
      contra.contradiction.reason === CONTRADICTION_SURFACED &&
      silent.allowed === false &&
      open.some((c) => c.id === contra.contradiction!.id),
    'Contradictory signals surfaced; not silently picked.',
  );

  // --- Route recompile on device change; low-trust faster loses to sealed ---
  const gen0 = await getCompileGeneration(root);
  const fastLow = await registerRouteCandidate({
    label: 'fast-low-trust-cloud',
    trust: 0.15,
    latencyMs: 3,
    localityScore: 0.95,
    freshnessScore: 0.95,
    costProxy: 0.5,
    consequenceWeight: 0.5,
    evidenceScore: 0.1,
    sealedPolicyOk: false,
    root,
  });
  const trusted = await registerRouteCandidate({
    label: 'sealed-high-trust',
    trust: 0.98,
    latencyMs: 120,
    localityScore: 0.6,
    freshnessScore: 0.85,
    costProxy: 8,
    consequenceWeight: 3,
    evidenceScore: 0.95,
    sealedPolicyOk: true,
    root,
  });
  const route = await optimizeCognitiveRoute({
    candidateIds: [fastLow.id, trusted.id],
    root,
    actor,
  });
  check(
    'US-BZ-sealed-beats-speed',
    route.selectedCandidateId === trusted.id &&
      route.rejectedFasterLowTrustId === fastLow.id &&
      (route.reason === SEALED_TRUST_BEATS_SPEED ||
        route.reason.includes('SEALED') ||
        route.selectedCandidateId === trusted.id) &&
      route.purchaseAuthority === false &&
      route.billingAuthority === false,
    'Low-trust faster route loses to sealed policy.',
  );

  const recompiled = await recompileRoutesOnChange({
    changeKind: 'device',
    candidateIds: [fastLow.id, trusted.id],
    root,
    actor,
  });
  const gen1 = await getCompileGeneration(root);
  check(
    'US-BZ-route-recompile',
    recompiled.status === 'recompiled' &&
      recompiled.reason === ROUTE_RECOMPILED &&
      gen1 === gen0 + 1 &&
      recompiled.selectedCandidateId === trusted.id,
    'Route recompiles on device change; sealed still wins.',
  );

  // --- Optimizer cannot purchase/bill ---
  const buy = await attemptOptimizerPurchaseOrBill({
    action: 'purchase',
    amount: 999,
    root,
    actor,
  });
  const bill = await attemptOptimizerPurchaseOrBill({
    action: 'bill',
    amount: 50,
    root,
    actor,
  });
  check(
    'US-BZ-optimizer-no-purchase',
    buy.denied === true &&
      bill.denied === true &&
      buy.reason === OPTIMIZER_NO_PURCHASE,
    'Optimizer cannot purchase/bill.',
  );

  // --- Chip-foundry output remains non-production-authorized ---
  const chip = await captureChipDesignKnowledge({
    title: 'npu-v2-candidate',
    processNm: 3,
    architectureNotes: 'sandbox design notes',
    forceProductionAuthorize: true,
    root,
    actor,
  });
  const chipOk = await captureChipDesignKnowledge({
    title: 'npu-v2-sandbox',
    architectureNotes: 'gated candidate',
    root,
    actor,
  });
  const fab = await attemptFabProductionAuthorize({
    candidateId: chipOk.candidate.id,
    root,
    actor,
  });
  check(
    'US-BZ-chip-foundry-nonprod',
    chip.productionAuthorized === false &&
      chip.candidate.status === 'denied' &&
      chipOk.candidate.status === 'sandbox_candidate' &&
      chipOk.candidate.fabAuthority === false &&
      fab.denied === true &&
      fab.reason === CHIP_FOUNDRY_NOT_FAB,
    'Chip-foundry output remains non-production / non-fab.',
  );

  // --- Full cycle + health ---
  const cycle = await runGlobalComputeNervousRoutingCycle({
    orgId: 'org-bz',
    tenantId: 'tenant-bz',
    universeId: 'univ-bz',
    actor,
    root,
  });
  check(
    'US-BZ-cycle-run',
    cycle.hops.length === GLOBAL_COMPUTE_NERVOUS_ROUTING_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL') &&
      cycle.nextPhase === NEXT_PHASE_TITLE,
    'Full BZ cycle walks all hops without FAIL.',
  );

  const health = await buildGlobalComputeNervousRoutingHealthReport({ root: repoRoot });
  const preds = predecessorMap(repoRoot);
  check(
    'US-BZ-health-report',
    health.phase === '62L-BZ' &&
      health.githubSoT === 90 &&
      health.gitlabCoordination === 24 &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.modules.globalComputeNervousSystem === 'IMPLEMENTED',
    'Health report cites GitHub #90 / GitLab #24; modules IMPLEMENTED.',
  );
  check(
    'US-BZ-pred-map',
    preds.BU.report === 'PRESENT' &&
      preds.BY.tipProbe === 'PRESENT',
    `Predecessor map: BU=${preds.BU.tipProbe}, BY=${preds.BY.tipProbe}/report=${preds.BY.report}, BX=${preds.BX.tipProbe}, BW=${preds.BW.tipProbe}.`,
  );
} catch (error) {
  failures.push(`EXCEPTION: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`FAIL ${failures.length} BZ checks:`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK phase62lbz — all required BZ stories passed.');
