import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getChipFamily,
  listVerifiedHalFamilies,
  neuralChipHalHonesty,
  registerChipFamily,
  resolveHalCapability,
} from './neural-chip-hal';
import {
  listTwinInventory,
  registerTwinAddressSpace,
  semiconductorTwinHonesty,
  upsertTwinInventory,
} from './semiconductor-digital-twin';
import {
  getQuantumBackend,
  planQuantumWorkload,
  quantumWorkloadHonesty,
  registerQuantumBackend,
} from './quantum-workload-compiler';
import {
  attemptSilentDeviceEnroll,
  getMarketplacePlugin,
  installMarketplacePlugin,
  marketplaceHonesty,
  registerMarketplacePlugin,
} from './device-intelligence-marketplace';
import {
  broadcastHonesty,
  broadcastKnowledge,
  listBroadcastPackets,
} from './business-knowledge-broadcast-network';
import {
  routingCortexHonesty,
  scoreRouteCandidate,
  selectSparseRoute,
  type RouteEndpoint,
} from './planetary-superbrain-routing-cortex';
import {
  BROADCAST_NO_PROVENANCE_DENIED,
  BX_LOCKS,
  EXTERNAL_PUBLISH_NEEDS_HUMAN_GATE,
  HONESTY_BANNER,
  INSTALL_NO_PRODUCTION_AUTHORITY,
  NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE,
  NEXT_PHASE_TITLE,
  NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
  QUANTUM_CLASSICAL_BASELINE_REQUIRED,
  SEALED_TRUST_BEATS_SPEED,
  TWIN_NOT_PHYSICAL_VERIFIED,
  TRILLION_LOGICAL_ONLY,
  UNAUTHORIZED_DEVICE_ENROLL_DENIED,
  UNCONFIGURED_QPU_UNAVAILABLE,
  UNVERIFIED_CHIP_FAMILY_UNAVAILABLE,
  UNVERIFIED_NOT_LABELED_VERIFIED,
  predecessorMap,
  probeBwFounderAvatarEthics,
  type BxActor,
} from './neural-chip-os-semiconductor-twin-types';
import {
  buildNeuralChipOsSemiconductorTwinHealthReport,
  runNeuralChipOsSemiconductorTwinCycle,
} from './neural-chip-os-semiconductor-twin-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lbx-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: BxActor = {
  kind: 'hal_agent',
  id: 'hal-bx-1',
  orgId: 'org-bx',
  tenantId: 'tenant-bx',
  universeId: 'univ-bx',
  role: 'hal_operator',
  permissionLevel: 0,
  authorityLevel: 0,
};

const human: BxActor = {
  kind: 'human_operator',
  id: 'human-bx-1',
  orgId: 'org-bx',
  tenantId: 'tenant-bx',
  universeId: 'univ-bx',
  role: 'operator',
  permissionLevel: 1,
  authorityLevel: 1,
};

try {
  check(
    'US-BX1-cycle',
    NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE.join(' → ') ===
      'honesty_locks → hal_verified_family_gate → unverified_chip_family_unavailable → semiconductor_twin_model → twin_inventory_honesty_label → classical_baseline_required → quantum_plan_compile → unconfigured_qpu_unavailable → marketplace_authorized_install → install_no_production_authority → knowledge_broadcast_provenance_gate → external_publish_human_gate → sparse_superbrain_route_score → sealed_trust_beats_speed → trillion_logical_addressing → founder_avatar_sealed_deny_probe → evidence → learning',
    'Neural chip OS / semiconductor twin cycle recorded in order.',
  );

  check(
    'US-BX-locks',
    BX_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BX_LOCKS.UNVERIFIED_CHIP_FAMILY_LABELED_VERIFIED === false &&
      BX_LOCKS.TWIN_INVENTORY_IS_PHYSICAL_VERIFIED_BY_DEFAULT === false &&
      BX_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
      BX_LOCKS.MARKETPLACE_INSTALL_GRANTS_AUTHORITY === false &&
      BX_LOCKS.UNVERIFIED_KNOWLEDGE_BROADCAST === false &&
      BX_LOCKS.EXTERNAL_PUBLISH_WITHOUT_HUMAN_GATE === false &&
      BX_LOCKS.SPEED_OVERRIDES_SEALED_TRUST === false &&
      BX_LOCKS.TRILLION_ADDRESSING_IS_PHYSICAL_CAPACITY === false &&
      BX_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BX_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, HAL/twin/quantum/marketplace/broadcast/routing gates.',
  );

  check(
    'US-BX-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BY — Universal Hardware Knowledge Cortex'),
    'Next queue title is 62L-BY only (title).',
  );

  // --- Unverified chip family → UNAVAILABLE (not claimed VERIFIED in HAL) ---
  const forceExotic = await registerChipFamily({
    familyKey: 'exotic_photon_asic',
    displayName: 'Exotic Photon ASIC',
    kind: 'accelerator',
    vendorProven: false,
    interfaceProven: false,
    forceVerified: true,
    root,
  });
  check(
    'US-BX-unverified-not-verified',
    forceExotic.accepted === false &&
      forceExotic.labeledVerified === false &&
      forceExotic.reason === UNVERIFIED_NOT_LABELED_VERIFIED,
    'Unverified chip family cannot be labeled VERIFIED in HAL.',
  );

  const docExotic = await registerChipFamily({
    familyKey: 'exotic_photon_asic',
    displayName: 'Exotic Photon ASIC',
    kind: 'accelerator',
    vendorProven: false,
    interfaceProven: false,
    root,
  });
  check(
    'US-BX-unverified-documented',
    docExotic.accepted === true &&
      docExotic.family.label !== 'VERIFIED' &&
      docExotic.labeledVerified === false,
    'Unverified family stays DOCUMENTED, not VERIFIED.',
  );

  const halMiss = await resolveHalCapability({
    familyKey: 'exotic_photon_asic',
    requireVerified: true,
    actor,
    root,
  });
  check(
    'US-BX-unverified-unavailable',
    halMiss.available === false &&
      halMiss.status === 'UNAVAILABLE' &&
      halMiss.labeledVerified === false &&
      halMiss.reason === UNVERIFIED_CHIP_FAMILY_UNAVAILABLE,
    'Unverified chip family → UNAVAILABLE (not VERIFIED in HAL).',
  );

  await registerChipFamily({
    familyKey: 'x86_64_cpu',
    displayName: 'x86-64 CPU',
    kind: 'cpu',
    vendorProven: true,
    interfaceProven: true,
    evidenceRefs: ['unit:phase62lbx'],
    root,
  });
  const cpu = await getChipFamily('x86_64_cpu', root);
  const verified = await listVerifiedHalFamilies(root);
  check(
    'US-BX-verified-hal',
    !!cpu && cpu.label === 'VERIFIED' && verified.some((f) => f.familyKey === 'x86_64_cpu'),
    'Verified CPU family present in HAL.',
  );

  // --- Twin inventory without evidence not labeled physical-verified ---
  const twinClaim = await upsertTwinInventory({
    sku: 'wafer-sim-1',
    familyKey: 'npu_generic',
    lifecycleStage: 'fab',
    quantityLogical: 42,
    claimPhysicalVerified: true,
    physicalEvidenceRefs: [],
    actor,
    root,
  });
  check(
    'US-BX-twin-not-physical',
    twinClaim.accepted === false &&
      twinClaim.labeledPhysicalVerified === false &&
      twinClaim.reason === TWIN_NOT_PHYSICAL_VERIFIED,
    'Twin inventory without evidence not labeled physical-verified.',
  );

  const twinModel = await upsertTwinInventory({
    sku: 'wafer-model-1',
    familyKey: 'npu_generic',
    lifecycleStage: 'simulated',
    quantityLogical: 100,
    actor,
    root,
  });
  const inventory = await listTwinInventory(root);
  check(
    'US-BX-twin-model-only',
    twinModel.accepted === true &&
      twinModel.node.honestyLabel !== 'PHYSICAL_VERIFIED' &&
      inventory.some((n) => n.sku === 'wafer-model-1' && n.honestyLabel === 'SIMULATED'),
    'Model/sim twin inventory honesty labeled correctly.',
  );

  // --- Quantum plan without classical baseline REJECTED ---
  const noBaseline = await planQuantumWorkload({
    objective: 'optimize fab schedule',
    classicalBaselineRef: null,
    quantumRequested: true,
    backendKey: 'any_qpu',
    actor,
    root,
  });
  check(
    'US-BX-quantum-no-baseline',
    noBaseline.accepted === false &&
      noBaseline.plan.status === 'REJECTED' &&
      noBaseline.reason === QUANTUM_CLASSICAL_BASELINE_REQUIRED,
    'Quantum plan without classical baseline REJECTED.',
  );

  const advantage = await planQuantumWorkload({
    objective: 'claim advantage',
    classicalBaselineRef: 'classical:v1',
    quantumRequested: true,
    claimQuantumAdvantage: true,
    actor,
    root,
  });
  check(
    'US-BX-no-advantage-claim',
    advantage.accepted === false &&
      advantage.reason === NO_QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE &&
      advantage.plan.claimsQuantumAdvantage === false,
    'No quantum advantage claim without evidence.',
  );

  // --- Unconfigured QPU → UNAVAILABLE ---
  await registerQuantumBackend({
    backendKey: 'missing_qpu',
    kind: 'quantum_qpu',
    configured: false,
    authorized: false,
    verified: false,
    root,
  });
  const qpu = await getQuantumBackend('missing_qpu', root);
  const unconf = await planQuantumWorkload({
    objective: 'anneal with baseline',
    classicalBaselineRef: 'classical:greedy-v1',
    quantumRequested: true,
    backendKey: 'missing_qpu',
    actor,
    root,
  });
  check(
    'US-BX-unconfigured-qpu',
    qpu?.label === 'UNAVAILABLE' &&
      unconf.accepted === false &&
      unconf.plan.status === 'UNAVAILABLE' &&
      unconf.reason === UNCONFIGURED_QPU_UNAVAILABLE,
    'Unconfigured QPU → UNAVAILABLE.',
  );

  const classicalOnly = await planQuantumWorkload({
    objective: 'classical planning only',
    classicalBaselineRef: 'classical:greedy-v1',
    quantumRequested: false,
    actor,
    root,
  });
  check(
    'US-BX-classical-plan-ok',
    classicalOnly.accepted === true && classicalOnly.plan.status === 'PLANNED',
    'Classical-only plan accepted.',
  );

  // --- Marketplace install does not grant production authority ---
  await registerMarketplacePlugin({
    pluginId: 'gpu_adapter_1',
    name: 'GPU Adapter',
    kind: 'device_adapter',
    authorized: true,
    configured: true,
    verified: true,
    root,
  });
  const installed = await installMarketplacePlugin({
    pluginId: 'gpu_adapter_1',
    actor,
    root,
  });
  const plugin = await getMarketplacePlugin('gpu_adapter_1', root);
  check(
    'US-BX-install-no-authority',
    installed.accepted === true &&
      installed.productionAuthority === false &&
      installed.reason === INSTALL_NO_PRODUCTION_AUTHORITY &&
      plugin?.productionAuthority === false &&
      plugin.label === 'INSTALLED',
    'Marketplace install does not grant production authority.',
  );

  const silent = await attemptSilentDeviceEnroll({
    pluginId: 'rogue_device',
    actor,
    root,
  });
  const unauth = await installMarketplacePlugin({
    pluginId: 'not_listed',
    actor,
    forceUnauthorized: true,
    root,
  });
  check(
    'US-BX-no-silent-enroll',
    silent.accepted === false &&
      silent.reason === UNAUTHORIZED_DEVICE_ENROLL_DENIED &&
      unauth.accepted === false,
    'Silent/unauthorized device enroll DENIED.',
  );

  // --- Broadcast of unverified/no-provenance knowledge DENIED ---
  const noProv = await broadcastKnowledge({
    title: 'rumor packet',
    summary: 'market rumor',
    provenance: [],
    verified: false,
    actor,
    root,
  });
  check(
    'US-BX-broadcast-no-provenance',
    noProv.accepted === false &&
      noProv.packet.status === 'DENIED' &&
      noProv.reason === BROADCAST_NO_PROVENANCE_DENIED,
    'Broadcast of unverified/no-provenance knowledge DENIED.',
  );

  // --- External publish DENIED without human gate ---
  const extDeny = await broadcastKnowledge({
    title: 'external aggregate',
    summary: 'authorized aggregate candidate',
    provenance: ['ledger:bx-1'],
    verified: true,
    scope: 'external',
    humanGateApproved: false,
    actor: human,
    root,
  });
  check(
    'US-BX-external-publish-denied',
    extDeny.accepted === false &&
      extDeny.reason === EXTERNAL_PUBLISH_NEEDS_HUMAN_GATE,
    'External publish DENIED without human gate.',
  );

  const extOk = await broadcastKnowledge({
    title: 'gated external',
    summary: 'human-gated external publish',
    provenance: ['ledger:bx-2'],
    verified: true,
    scope: 'external',
    humanGateApproved: true,
    actor: human,
    root,
  });
  const packets = await listBroadcastPackets(root);
  check(
    'US-BX-external-with-gate',
    extOk.accepted === true &&
      extOk.packet.status === 'BROADCAST_OK' &&
      packets.some((p) => p.id === extOk.packet.id),
    'External publish OK only with human gate.',
  );

  // --- Faster low-trust route loses to sealed/policy weight ---
  const sealed: RouteEndpoint = {
    id: 'ep-sealed-high',
    kind: 'universe',
    label: 'sealed-high-trust',
    trust: 0.95,
    latencyMs: 250,
    costUnits: 8,
    freshnessScore: 0.7,
    sealed: true,
    policyDeny: false,
  };
  const fastLow: RouteEndpoint = {
    id: 'ep-fast-low',
    kind: 'agent',
    label: 'fast-low-trust',
    trust: 0.15,
    latencyMs: 2,
    costUnits: 1,
    freshnessScore: 0.95,
    sealed: false,
    policyDeny: false,
  };
  const sealedScore = scoreRouteCandidate(sealed);
  const fastScore = scoreRouteCandidate(fastLow);
  const route = await selectSparseRoute({
    fromId: 'cortex-root',
    candidates: [sealed, fastLow],
    actor,
    root,
  });
  check(
    'US-BX-sealed-beats-speed',
    route.selected?.toId === 'ep-sealed-high' &&
      sealedScore.compositeScore > fastScore.compositeScore &&
      route.speedOverrideDenied === true &&
      route.scored.some(
        (s) =>
          s.toId === 'ep-fast-low' &&
          s.selected === false &&
          (s.rejectedReason === SEALED_TRUST_BEATS_SPEED || s.rejectedReason === null),
      ),
    'Faster low-trust route loses to sealed/policy weight.',
  );

  // --- Trillion addressing remains logical unless benchmark proves capacity ---
  const trillion = await registerTwinAddressSpace({
    addressCountLogical: 1_000_000_000_000,
    claimPhysicalCapacity: true,
    benchmarkEvidenceRefs: [],
    root,
  });
  check(
    'US-BX-trillion-logical',
    trillion.physicalCapacityProven === false &&
      trillion.space.honestyLabel === 'LOGICAL' &&
      trillion.space.scaleClaim === 'trillion_logical' &&
      trillion.reason === TRILLION_LOGICAL_ONLY,
    'Trillion addressing remains logical unless benchmark proves capacity.',
  );

  // --- BW founder-avatar / sealed deny probe ---
  const bw = probeBwFounderAvatarEthics(repoRoot);
  check(
    'US-BX-bw-sealed-deny-holds',
    bw.sealedDenyHolds === true && bw.learningIsPermission === false,
    `BW probe status=${bw.status}; sealed deny holds; learning ≠ permission.`,
  );

  // --- Cycle + health ---
  const cycle = await runNeuralChipOsSemiconductorTwinCycle({
    orgId: 'org-bx',
    tenantId: 'tenant-bx',
    universeId: 'univ-bx',
    actor,
    root,
  });
  check(
    'US-BX-cycle-run',
    cycle.ok === true &&
      cycle.hops.length === NEURAL_CHIP_OS_SEMICONDUCTOR_TWIN_CYCLE.length &&
      cycle.hops.every((h) => h.state !== 'FAIL'),
    `Cycle hops=${cycle.hops.length}; ok=${cycle.ok}.`,
  );

  const health = await buildNeuralChipOsSemiconductorTwinHealthReport({ root: repoRoot });
  check(
    'US-BX-health-report',
    health.phase === '62L-BX' &&
      health.l4AutonomyEnabled === false &&
      health.githubSotIssue === 88 &&
      health.gitlabCoordinationIssue === 22 &&
      health.megaPrBulkIncluded === false &&
      health.dbCandidatesApplied === false &&
      health.nextPhase.startsWith('62L-BY'),
    'Health report honesty + SoT + next title.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-BX-predecessor-map',
    preds.BU.tipProbe === 'PRESENT' &&
      preds.BW.tipProbe === 'PRESENT' &&
      (preds.BW.report === 'PRESENT' || preds.BW.report === 'MISSING'),
    `BU=${preds.BU.tipProbe}/${preds.BU.report}; BW=${preds.BW.tipProbe}/${preds.BW.report}.`,
  );

  // Live BW avatar deny still holds on this tree
  const { activateSparseFounderAvatar, attemptFounderAvatarAction } = await import(
    './founder-avatar-delegate-universe'
  );
  const { BW_LOCKS } = await import('./planetary-chip-founder-avatar-ethics-types');
  const bwActor = {
    kind: 'founder_avatar_delegate' as const,
    id: 'avatar-bx-test',
    orgId: 'org-bx',
    tenantId: 'tenant-bx',
    universeId: 'univ-bx',
    role: 'founder_avatar',
    permissionLevel: 0,
    authorityLevel: 0,
  };
  const avatar = await activateSparseFounderAvatar({
    pathwayKey: 'bx-test',
    actor: bwActor,
    root,
  });
  const denyPublish = avatar.delegate
    ? await attemptFounderAvatarAction({
        delegateId: avatar.delegate.id,
        action: 'external_publish',
        actor: bwActor,
        root,
      })
    : { accepted: true };
  check(
    'US-BX-bw-avatar-publish-denied',
    BW_LOCKS.AVATAR_EXTERNAL_PUBLISH === false &&
      BW_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      denyPublish.accepted === false,
    'BW founder-avatar external publish DENIED; sealed deny-by-default holds.',
  );

  check(
    'US-BX-honesty-helpers',
    neuralChipHalHonesty().coversVerifiedFamiliesOnly === true &&
      semiconductorTwinHonesty().twinInventoryPhysicalByDefault === false &&
      quantumWorkloadHonesty().classicalBaselineRequired === true &&
      marketplaceHonesty().installGrantsAuthority === false &&
      broadcastHonesty().provenanceRequired === true &&
      routingCortexHonesty().speedOverridesSealedTrust === false,
    'Subsystem honesty helpers consistent.',
  );
} catch (error) {
  failures.push(`UNCAUGHT: ${(error as Error).stack ?? String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-BX tests:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-BX phase62lbx tests passed');
