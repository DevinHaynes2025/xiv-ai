import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  hardwareCortexHonesty,
  ingestHardwareKnowledge,
  useHardwareForRuntime,
} from './universal-hardware-knowledge-cortex';
import {
  attemptLabProductionAuthorize,
  runSemiconductorLabExperiment,
  semiconductorLabHonesty,
} from './semiconductor-innovation-laboratory';
import {
  createDeviceCheckpoint,
  enrollDeviceRuntime,
  handoffDeviceCheckpoint,
  multiDeviceRuntimeHonesty,
  queryOfflineIsland,
  useDeviceRuntime,
} from './multi-device-agent-runtime';
import {
  attemptSchedulerPurchaseOrCharge,
  economicSchedulerHonesty,
  placeEconomicCompute,
  type PlacementCandidate,
} from './economic-compute-scheduler';
import { biStreamHonesty, ingestBiStreamItem } from './verified-global-bi-stream';
import {
  compileSynapseRoute,
  registerSynapseRelationship,
  synapseCompilerHonesty,
} from './superbrain-synapse-compiler';
import {
  BY_LOCKS,
  HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE,
  HONESTY_BANNER,
  HANDOFF_NO_AUTHORITY,
  LAB_SANDBOXED_NOT_PRODUCTION,
  NEXT_PHASE_TITLE,
  OFFLINE_ISLAND_STALE,
  SCHEDULER_NO_PURCHASE,
  SEALED_TRUST_DENY_BEATS_COST,
  UNAPPROVED_SYNAPSE_DENIED,
  UNVERIFIED_BI_DENIED,
  UNVERIFIED_DEVICE_UNAVAILABLE,
  predecessorMap,
  type ByActor,
} from './hardware-cortex-synapse-compiler-types';
import {
  buildHardwareCortexSynapseCompilerHealthReport,
  runHardwareCortexSynapseCompilerCycle,
} from './hardware-cortex-synapse-compiler-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lby-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: ByActor = {
  kind: 'ordinary_agent',
  id: 'agent-by-1',
  orgId: 'org-by',
  tenantId: 'tenant-by',
  universeId: 'univ-by',
  role: 'operator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-BY1-cycle',
    HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE.join(' → ') ===
      'honesty_locks → hardware_knowledge_cortex_ingest → hardware_provenance_freshness_gate → unverified_hardware_unavailable → semiconductor_lab_sandbox_experiment → lab_output_not_production_authorized → multi_device_handoff_checkpoint → handoff_no_authority_transfer → offline_island_freshness_gate → economic_scheduler_place → scheduler_no_purchase_bill_charge → sealed_trust_beats_cheaper_faster → bi_stream_verified_provenance_gate → unverified_bi_denied → synapse_compile_approved_only → unapproved_relationship_denied → sparse_governed_routes → evidence → learning',
    'Hardware cortex / synapse compiler cycle recorded in order.',
  );

  check(
    'US-BY-locks',
    BY_LOCKS.L4_AUTONOMY_ENABLED === false &&
      BY_LOCKS.LAB_SANDBOX_ONLY === true &&
      BY_LOCKS.AGENT_PURCHASING_AUTHORITY === false &&
      BY_LOCKS.AGENT_BILLING_AUTHORITY === false &&
      BY_LOCKS.AGENT_CHARGE_AUTHORITY === false &&
      BY_LOCKS.COST_PROXY_IS_LIVE_INVOICE === false &&
      BY_LOCKS.CHEAPER_FASTER_BYPASSES_SEALED_TRUST === false &&
      BY_LOCKS.UNVERIFIED_BI_LABELED_VERIFIED === false &&
      BY_LOCKS.UNAPPROVED_SYNAPSE_COMPILE === false &&
      BY_LOCKS.HANDOFF_TRANSFERS_AUTHORITY === false &&
      BY_LOCKS.UNVERIFIED_DEVICE_RUNTIME_AVAILABLE === false &&
      BY_LOCKS.PRODUCTION_CHIP_DEPLOY_AUTHORITY === false &&
      BY_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT === true &&
      BY_LOCKS.MEGA_PR_BULK_INCLUDED === false &&
      HONESTY_BANNER.includes('DOCUMENTED ≠ IMPLEMENTED'),
    'Honesty locks: L4=false, lab sandbox, no purchase/bill, sealed beats cheap, BI/synapse gates.',
  );

  check(
    'US-BY-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-BZ — Global Compute Nervous System'),
    'Next queue title is 62L-BZ only (title).',
  );

  check(
    'US-BY-honesty-helpers',
    hardwareCortexHonesty().l4 === false &&
      semiconductorLabHonesty().labSandboxOnly === true &&
      multiDeviceRuntimeHonesty().handoffTransfersAuthority === false &&
      economicSchedulerHonesty().purchasing === false &&
      biStreamHonesty().verifiedProvenanceRequired === true &&
      synapseCompilerHonesty().approvedOnly === true,
    'Subsystem honesty helpers expose deny-by-default locks.',
  );

  // --- Lab output remains sandboxed (not production-authorized) ---
  const lab = await runSemiconductorLabExperiment({
    title: 'interconnect research',
    hypothesis: 'candidate topology',
    requestProductionAuthorize: false,
    actor,
    root,
  });
  const labProd = lab.experiment
    ? await attemptLabProductionAuthorize({ experimentId: lab.experiment.id, actor, root })
    : null;
  const labForce = await runSemiconductorLabExperiment({
    title: 'force prod',
    hypothesis: 'should deny',
    requestProductionAuthorize: true,
    requestChipDeploy: true,
    actor,
    root,
  });
  check(
    'US-BY-lab-sandboxed-not-production',
    lab.accepted === true &&
      lab.status === 'sandboxed' &&
      lab.productionAuthorized === false &&
      lab.chipDeployAuthority === false &&
      lab.reason === LAB_SANDBOXED_NOT_PRODUCTION &&
      labProd?.accepted === false &&
      labProd?.productionAuthorized === false &&
      labForce.accepted === false &&
      labForce.productionAuthorized === false,
    'Lab output sandboxed; production authorize / chip deploy DENIED.',
  );

  // --- Scheduler placement cannot purchase/bill/charge ---
  const candidates: PlacementCandidate[] = [
    {
      id: 'n1',
      nodeId: 'node-a',
      latencyMs: 10,
      costProxy: 1,
      trustScore: 0.9,
      localityScore: 0.8,
      residencyOk: true,
      businessPriority: 1,
      resourcePressure: 0.2,
      sealedDenied: false,
      trustDenied: false,
    },
  ];
  const place = await placeEconomicCompute({ candidates, actor, root });
  const purchase = await attemptSchedulerPurchaseOrCharge({ action: 'purchase', actor, root });
  const bill = await attemptSchedulerPurchaseOrCharge({ action: 'bill', actor, root });
  const charge = await attemptSchedulerPurchaseOrCharge({ action: 'charge', actor, root });
  const placePurchase = await placeEconomicCompute({
    candidates,
    attemptPurchase: true,
    attemptCharge: true,
    actor,
    root,
  });
  check(
    'US-BY-scheduler-no-purchase-bill-charge',
    place.accepted === true &&
      place.purchaseAuthority === false &&
      place.billingAuthority === false &&
      place.chargeAuthority === false &&
      place.costProxyIsLiveInvoice === false &&
      place.recommendationOnly === true &&
      place.charged === false &&
      place.purchased === false &&
      purchase.accepted === false &&
      purchase.reason === SCHEDULER_NO_PURCHASE &&
      bill.accepted === false &&
      charge.accepted === false &&
      placePurchase.accepted === false &&
      placePurchase.reason === SCHEDULER_NO_PURCHASE,
    'Scheduler recommends only; purchase/bill/charge DENIED.',
  );

  // --- Cheaper/faster route cannot bypass sealed/trust deny ---
  const sealedCandidates: PlacementCandidate[] = [
    {
      id: 'cheap',
      nodeId: 'sealed-cheap-fast',
      latencyMs: 1,
      costProxy: 0.01,
      trustScore: 0.99,
      localityScore: 1,
      residencyOk: true,
      businessPriority: 10,
      resourcePressure: 0,
      sealedDenied: true,
      trustDenied: false,
    },
    {
      id: 'trust',
      nodeId: 'trusted-slower',
      latencyMs: 80,
      costProxy: 5,
      trustScore: 0.9,
      localityScore: 0.7,
      residencyOk: true,
      businessPriority: 1,
      resourcePressure: 0.3,
      sealedDenied: false,
      trustDenied: false,
    },
  ];
  const sealedPlace = await placeEconomicCompute({
    candidates: sealedCandidates,
    attemptBypassSealedWithCheaper: true,
    actor,
    root,
  });
  check(
    'US-BY-sealed-trust-beats-cheaper-faster',
    sealedPlace.sealedBypassDenied === true &&
      sealedPlace.decision?.selectedNodeId === 'trusted-slower' &&
      sealedPlace.decision.selectedNodeId !== 'sealed-cheap-fast' &&
      sealedPlace.decision.ranked.some(
        (r) => r.nodeId === 'sealed-cheap-fast' && r.eliminatedReason === SEALED_TRUST_DENY_BEATS_COST,
      ),
    'Cheaper/faster sealed node eliminated; trust-eligible recommended.',
  );

  // --- Unverified BI stream item DENIED or not labeled verified ---
  const biBad = await ingestBiStreamItem({
    streamId: 's1',
    title: 'unverified rumor',
    summary: 'no provenance',
    forceVerified: true,
    actor,
    root,
  });
  const biPool = await ingestBiStreamItem({
    streamId: 's1',
    title: 'private pool',
    summary: 'raw private',
    provenanceRefs: ['x'],
    evidenceBacked: true,
    rawPrivatePooling: true,
    actor,
    root,
  });
  const biOk = await ingestBiStreamItem({
    streamId: 's1',
    title: 'verified aggregate',
    summary: 'ok',
    provenanceRefs: ['src:1'],
    evidenceBacked: true,
    actor,
    root,
  });
  check(
    'US-BY-unverified-bi-denied',
    biBad.accepted === false &&
      biBad.labeledVerified === false &&
      biBad.reason === UNVERIFIED_BI_DENIED &&
      biBad.item?.status === 'denied' &&
      biPool.accepted === false &&
      biOk.accepted === true &&
      biOk.labeledVerified === true,
    'Unverified BI DENIED / not VERIFIED; verified-with-provenance OK.',
  );

  // --- Synapse compile of unapproved relationship DENIED ---
  const relBad = await registerSynapseRelationship({
    kind: 'workflow',
    fromId: 'wf-a',
    toId: 'wf-b',
    approved: false,
    actor,
    root,
  });
  const compileBad = relBad.relationship
    ? await compileSynapseRoute({ relationshipId: relBad.relationship.id, actor, root })
    : null;
  const relOk = await registerSynapseRelationship({
    kind: 'agent',
    fromId: 'ag-a',
    toId: 'ag-b',
    approved: true,
    actor,
    root,
  });
  const compileOk = relOk.relationship
    ? await compileSynapseRoute({ relationshipId: relOk.relationship.id, actor, root })
    : null;
  const compilePriv = relOk.relationship
    ? await compileSynapseRoute({
        relationshipId: relOk.relationship.id,
        attemptPrivilegeExpansion: true,
        actor,
        root,
      })
    : null;
  check(
    'US-BY-synapse-unapproved-denied',
    compileBad?.accepted === false &&
      compileBad?.status === 'denied' &&
      compileBad?.reason === UNAPPROVED_SYNAPSE_DENIED &&
      compileOk?.accepted === true &&
      compileOk?.route?.sparse === true &&
      compileOk?.route?.governed === true &&
      compileOk?.privilegeExpanded === false &&
      compilePriv?.accepted === false &&
      compilePriv?.privilegeExpanded === false,
    'Unapproved synapse compile DENIED; approved → sparse governed; no privilege expansion.',
  );

  // --- Multi-device handoff preserves checkpoint; authority does not transfer ---
  await enrollDeviceRuntime({
    deviceId: 'phone-1',
    enrolled: true,
    verified: true,
    authorityLevel: 3,
    permissionLevel: 2,
    actor,
    root,
  });
  await enrollDeviceRuntime({
    deviceId: 'laptop-1',
    enrolled: true,
    verified: true,
    authorityLevel: 0,
    permissionLevel: 0,
    actor,
    root,
  });
  const ckpt = await createDeviceCheckpoint({
    deviceId: 'phone-1',
    taskId: 'job-9',
    payload: { cursor: 42 },
    actor,
    root,
  });
  const handoff = ckpt.checkpoint
    ? await handoffDeviceCheckpoint({
        fromDeviceId: 'phone-1',
        toDeviceId: 'laptop-1',
        checkpointId: ckpt.checkpoint.id,
        attemptAuthorityTransfer: true,
        attemptPermissionTransfer: true,
        actor,
        root,
      })
    : null;
  check(
    'US-BY-handoff-checkpoint-no-authority',
    ckpt.accepted === true &&
      handoff?.accepted === true &&
      handoff?.preservedCheckpoint === true &&
      handoff?.authorityTransferred === false &&
      handoff?.permissionTransferred === false &&
      handoff?.handoff.reason === HANDOFF_NO_AUTHORITY,
    'Handoff preserves checkpoint; authority/permission do not transfer.',
  );

  // --- Offline island freshness-sensitive → STALE/WAITING_DATA ---
  const islandWait = await queryOfflineIsland({
    deviceId: 'phone-1',
    freshnessSensitive: true,
    islandFreshness: 'waiting_data',
    actor,
    root,
  });
  const islandStale = await queryOfflineIsland({
    deviceId: 'laptop-1',
    freshnessSensitive: true,
    islandFreshness: 'stale',
    actor,
    root,
  });
  check(
    'US-BY-offline-island-freshness',
    islandWait.accepted === false &&
      islandWait.status === 'waiting_data' &&
      islandWait.reason === OFFLINE_ISLAND_STALE &&
      islandStale.accepted === false &&
      islandStale.status === 'stale',
    'Freshness-sensitive offline island → STALE/WAITING_DATA.',
  );

  // --- Unverified device runtime → UNAVAILABLE ---
  const unverifiedEnroll = await enrollDeviceRuntime({
    deviceId: 'mystery-device',
    enrolled: false,
    verified: false,
    actor,
    root,
  });
  const unverifiedUse = await useDeviceRuntime({
    deviceId: 'mystery-device',
    actor,
    root,
  });
  const missingUse = await useDeviceRuntime({
    deviceId: 'never-enrolled',
    actor,
    root,
  });
  check(
    'US-BY-unverified-device-unavailable',
    unverifiedEnroll.accepted === false &&
      unverifiedEnroll.status === 'unavailable' &&
      unverifiedUse.accepted === false &&
      unverifiedUse.status === 'unavailable' &&
      unverifiedUse.reason === UNVERIFIED_DEVICE_UNAVAILABLE &&
      missingUse.status === 'unavailable',
    'Unverified/unenrolled device runtime → UNAVAILABLE.',
  );

  // --- Hardware cortex unverified unavailable ---
  const hwForce = await ingestHardwareKnowledge({
    deviceFamily: 'unknown_fpga',
    vendor: 'x',
    model: 'y',
    forceVerified: true,
    actor,
    root,
  });
  const hwUse = await useHardwareForRuntime({ deviceFamily: 'unknown_fpga', actor, root });
  check(
    'US-BY-unverified-hardware-unavailable',
    hwForce.accepted === false &&
      hwForce.labeledVerified === false &&
      hwUse.status === 'unavailable',
    'Unverified hardware knowledge → UNAVAILABLE.',
  );

  // --- Full cycle + health ---
  const cycle = await runHardwareCortexSynapseCompilerCycle({
    orgId: 'org-by',
    tenantId: 'tenant-by',
    universeId: 'univ-by',
    actor,
    root,
  });
  check(
    'US-BY-cycle-run',
    cycle.hops.length === HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE.length &&
      cycle.l4AutonomyEnabled === false &&
      cycle.unverifiedDeviceStatus === 'unavailable' &&
      cycle.nextPhase.startsWith('62L-BZ'),
    'Full cycle walks all hops; L4=false; unverified device unavailable.',
  );

  const health = await buildHardwareCortexSynapseCompilerHealthReport({ root: repoRoot });
  const preds = predecessorMap(repoRoot);
  check(
    'US-BY-health-predecessors',
    health.githubSotIssue === 89 &&
      health.gitlabCoordinationIssue === 23 &&
      health.tipLand === false &&
      health.dbCandidatesApplied === false &&
      preds.BU.report === 'PRESENT' &&
      (preds.BX.tipProbe === 'WAITING_DATA' || preds.BX.tipProbe === 'PRESENT'),
    'Health report cites GH#89 / GL#23; BU present; BX may be WAITING_DATA.',
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('OK phase62lby');
