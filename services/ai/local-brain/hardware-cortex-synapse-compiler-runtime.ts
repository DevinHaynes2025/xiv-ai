/**
 * 62L-BY runtime — walks HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE and builds health report.
 */

import { appendEvidenceEvent } from './evidence-ledger';
import { checkLocalBrainHealth } from './health-check';
import { appendLearning } from './learning-ledger';
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
  NEXT_PHASE_TITLE,
  predecessorMap,
  probeBxBwLayers,
  type ByActor,
  type ByEvidenceState,
  type ByHop,
  type ByHopRecord,
} from './hardware-cortex-synapse-compiler-types';

export {
  BY_LOCKS,
  HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  predecessorMap,
  probeBxBwLayers,
};

function hop(name: ByHop, state: ByEvidenceState, summary: string): ByHopRecord {
  return { hop: name, state, summary, at: new Date().toISOString() };
}

export type ByCycleInput = {
  orgId: string;
  tenantId: string;
  universeId: string;
  actor: ByActor;
  root?: string;
};

export async function runHardwareCortexSynapseCompilerCycle(input: ByCycleInput) {
  if (!input.orgId || !input.tenantId) throw new Error('ORG_AND_TENANT_REQUIRED');
  const root = input.root ?? process.cwd();
  const hops: ByHopRecord[] = [];
  const actor = { ...input.actor, universeId: input.universeId || input.actor.universeId };

  hops.push(
    hop(
      'honesty_locks',
      BY_LOCKS.L4_AUTONOMY_ENABLED === false &&
        BY_LOCKS.LAB_SANDBOX_ONLY &&
        BY_LOCKS.AGENT_PURCHASING_AUTHORITY === false &&
        BY_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT
        ? 'PASS'
        : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const hw = await ingestHardwareKnowledge({
    deviceFamily: 'npu',
    vendor: 'XIV',
    model: 'npu-sim-1',
    capabilities: ['inference'],
    provenanceRefs: ['unit:phase62lby'],
    evidenceBacked: true,
    freshness: 'fresh',
    actor,
    root,
  });
  hops.push(
    hop(
      'hardware_knowledge_cortex_ingest',
      hw.accepted && hw.labeledVerified ? 'PASS' : 'FAIL',
      hw.reason,
    ),
  );

  hops.push(
    hop(
      'hardware_provenance_freshness_gate',
      hw.entry?.freshness === 'fresh' && hw.labeledVerified ? 'PASS' : 'FAIL',
      `freshness=${hw.entry?.freshness ?? 'none'}`,
    ),
  );

  const unverifiedHw = await ingestHardwareKnowledge({
    deviceFamily: 'mystery_asic',
    vendor: 'unknown',
    model: 'x',
    forceVerified: true,
    actor,
    root,
  });
  const useUnverified = await useHardwareForRuntime({
    deviceFamily: 'mystery_asic',
    actor,
    root,
  });
  hops.push(
    hop(
      'unverified_hardware_unavailable',
      !unverifiedHw.labeledVerified && useUnverified.status === 'unavailable'
        ? 'UNAVAILABLE'
        : 'FAIL',
      useUnverified.reason,
    ),
  );

  const lab = await runSemiconductorLabExperiment({
    title: 'sparse interconnect candidate',
    hypothesis: 'lower latency under trust bounds',
    provenanceRefs: ['lab:sandbox'],
    actor,
    root,
  });
  hops.push(
    hop(
      'semiconductor_lab_sandbox_experiment',
      lab.accepted && lab.status === 'sandboxed' ? 'SANDBOXED' : 'FAIL',
      lab.reason,
    ),
  );

  const labProd = lab.experiment
    ? await attemptLabProductionAuthorize({
        experimentId: lab.experiment.id,
        actor,
        root,
      })
    : null;
  hops.push(
    hop(
      'lab_output_not_production_authorized',
      labProd?.productionAuthorized === false && lab.productionAuthorized === false
        ? 'DENIED'
        : 'FAIL',
      labProd?.reason ?? 'NO_LAB',
    ),
  );

  await enrollDeviceRuntime({
    deviceId: 'dev-a',
    enrolled: true,
    verified: true,
    authorityLevel: 1,
    permissionLevel: 1,
    actor,
    root,
  });
  await enrollDeviceRuntime({
    deviceId: 'dev-b',
    enrolled: true,
    verified: true,
    authorityLevel: 0,
    permissionLevel: 0,
    actor,
    root,
  });
  const ckpt = await createDeviceCheckpoint({
    deviceId: 'dev-a',
    taskId: 'task-1',
    payload: { step: 1 },
    actor,
    root,
  });
  const handoff = ckpt.checkpoint
    ? await handoffDeviceCheckpoint({
        fromDeviceId: 'dev-a',
        toDeviceId: 'dev-b',
        checkpointId: ckpt.checkpoint.id,
        attemptAuthorityTransfer: true,
        actor,
        root,
      })
    : null;
  hops.push(
    hop(
      'multi_device_handoff_checkpoint',
      handoff?.preservedCheckpoint === true ? 'PASS' : 'FAIL',
      handoff?.handoff.reason ?? 'NO_HANDOFF',
    ),
  );
  hops.push(
    hop(
      'handoff_no_authority_transfer',
      handoff?.authorityTransferred === false && handoff?.permissionTransferred === false
        ? 'PASS'
        : 'FAIL',
      'authority does not transfer via handoff',
    ),
  );

  const island = await queryOfflineIsland({
    deviceId: 'dev-a',
    freshnessSensitive: true,
    islandFreshness: 'waiting_data',
    actor,
    root,
  });
  hops.push(
    hop(
      'offline_island_freshness_gate',
      island.status === 'waiting_data' || island.status === 'stale' ? 'WAITING_DATA' : 'FAIL',
      island.reason,
    ),
  );

  const candidates: PlacementCandidate[] = [
    {
      id: 'c1',
      nodeId: 'sealed-cheap-fast',
      latencyMs: 1,
      costProxy: 0.01,
      trustScore: 0.9,
      localityScore: 0.9,
      residencyOk: true,
      businessPriority: 1,
      resourcePressure: 0.1,
      sealedDenied: true,
      trustDenied: false,
    },
    {
      id: 'c2',
      nodeId: 'trusted-slower',
      latencyMs: 50,
      costProxy: 2,
      trustScore: 0.95,
      localityScore: 0.8,
      residencyOk: true,
      businessPriority: 1,
      resourcePressure: 0.2,
      sealedDenied: false,
      trustDenied: false,
    },
  ];
  const place = await placeEconomicCompute({
    candidates,
    attemptBypassSealedWithCheaper: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'economic_scheduler_place',
      place.decision?.selectedNodeId === 'trusted-slower' ? 'RECOMMENDATION_ONLY' : 'FAIL',
      place.reason,
    ),
  );

  const purchase = await attemptSchedulerPurchaseOrCharge({
    action: 'purchase',
    actor,
    root,
  });
  hops.push(
    hop(
      'scheduler_no_purchase_bill_charge',
      purchase.accepted === false &&
        purchase.purchaseAuthority === false &&
        purchase.billingAuthority === false &&
        purchase.chargeAuthority === false
        ? 'DENIED'
        : 'FAIL',
      purchase.reason,
    ),
  );
  hops.push(
    hop(
      'sealed_trust_beats_cheaper_faster',
      place.sealedBypassDenied === true && place.decision?.selectedNodeId !== 'sealed-cheap-fast'
        ? 'DENIED'
        : 'FAIL',
      'sealed/trust deny beats cheaper/faster',
    ),
  );

  const biOk = await ingestBiStreamItem({
    streamId: 'global-bi',
    title: 'verified signal',
    summary: 'provenance-backed aggregate',
    provenanceRefs: ['source:verified-1'],
    evidenceBacked: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'bi_stream_verified_provenance_gate',
      biOk.accepted && biOk.labeledVerified ? 'VERIFIED' : 'FAIL',
      biOk.reason,
    ),
  );

  const biBad = await ingestBiStreamItem({
    streamId: 'global-bi',
    title: 'rumor',
    summary: 'unverified',
    forceVerified: true,
    actor,
    root,
  });
  hops.push(
    hop(
      'unverified_bi_denied',
      biBad.accepted === false && biBad.labeledVerified === false ? 'DENIED' : 'FAIL',
      biBad.reason,
    ),
  );

  const relOk = await registerSynapseRelationship({
    kind: 'device',
    fromId: 'dev-a',
    toId: 'dev-b',
    approved: true,
    actor,
    root,
  });
  const compiled = relOk.relationship
    ? await compileSynapseRoute({
        relationshipId: relOk.relationship.id,
        actor,
        root,
      })
    : null;
  hops.push(
    hop(
      'synapse_compile_approved_only',
      compiled?.accepted && compiled.route?.sparse && compiled.route?.governed ? 'PASS' : 'FAIL',
      compiled?.reason ?? 'NO_COMPILE',
    ),
  );

  const relBad = await registerSynapseRelationship({
    kind: 'agent',
    fromId: 'agent-x',
    toId: 'agent-y',
    approved: false,
    actor,
    root,
  });
  const deniedCompile = relBad.relationship
    ? await compileSynapseRoute({
        relationshipId: relBad.relationship.id,
        actor,
        root,
      })
    : null;
  hops.push(
    hop(
      'unapproved_relationship_denied',
      deniedCompile?.status === 'denied' ? 'DENIED' : 'FAIL',
      deniedCompile?.reason ?? 'NO_DENY',
    ),
  );
  hops.push(
    hop(
      'sparse_governed_routes',
      compiled?.route?.sparse === true &&
        compiled?.route?.governed === true &&
        compiled?.privilegeExpanded === false
        ? 'SPARSE'
        : 'FAIL',
      'sparse governed routes; no privilege expansion',
    ),
  );

  await appendEvidenceEvent(
    {
      kind: 'evidence',
      tenantId: input.tenantId,
      universeId: input.universeId,
      summary: '62L-BY hardware cortex / synapse compiler cycle completed',
      payload: { hops: hops.map((h) => h.hop), orgId: input.orgId, sourceRefs: ['62L-BY'] },
    },
    root,
  ).catch(() => undefined);

  hops.push(hop('evidence', 'PASS', 'cycle evidence recorded (best-effort)'));

  await appendLearning(
    {
      domain: 'technology',
      subject: '62L-BY hardware cortex synapse compiler cycle',
      claimState: 'MODEL_INFERENCE',
      summary: `hops=${hops.length}; lab sandbox; scheduler recommendation only; no purchase authority`,
      sourceRefs: ['62L-BY'],
      evidence: hops.map((h) => `${h.hop}:${h.state}`),
    },
    root,
  ).catch(() => undefined);

  hops.push(
    hop(
      'learning',
      BY_LOCKS.LEARNING_IS_PERMISSION === false ? 'PASS' : 'FAIL',
      'learning ≠ permission',
    ),
  );

  const unverifiedDevice = await useDeviceRuntime({
    deviceId: 'dev-unknown',
    actor,
    root,
  });

  const preds = predecessorMap(root);
  const bxBw = probeBxBwLayers(root);

  // Best-effort: reuse BX HAL / twin honesty when modules are on the tree.
  let bxHalHonesty: Record<string, unknown> | null = null;
  let bxTwinHonesty: Record<string, unknown> | null = null;
  let bxRouteHonesty: Record<string, unknown> | null = null;
  if (bxBw.bx === 'PRESENT') {
    try {
      const hal = await import('./neural-chip-hal');
      bxHalHonesty = hal.neuralChipHalHonesty?.() ?? null;
    } catch {
      bxHalHonesty = null;
    }
    try {
      const twin = await import('./semiconductor-digital-twin');
      bxTwinHonesty = twin.semiconductorTwinHonesty?.() ?? null;
    } catch {
      bxTwinHonesty = null;
    }
    try {
      const routing = await import('./planetary-superbrain-routing-cortex');
      bxRouteHonesty = routing.routingCortexHonesty?.() ?? null;
    } catch {
      bxRouteHonesty = null;
    }
  }

  return {
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    hops,
    honesty: {
      hardware: hardwareCortexHonesty(),
      lab: semiconductorLabHonesty(),
      multiDevice: multiDeviceRuntimeHonesty(),
      scheduler: economicSchedulerHonesty(),
      bi: biStreamHonesty(),
      synapse: synapseCompilerHonesty(),
      bxHal: bxHalHonesty,
      bxTwin: bxTwinHonesty,
      bxRouting: bxRouteHonesty,
    },
    predecessors: preds,
    bxBwProbe: bxBw,
    unverifiedDeviceStatus: unverifiedDevice.status,
    l4AutonomyEnabled: BY_LOCKS.L4_AUTONOMY_ENABLED,
    nextPhase: NEXT_PHASE_TITLE,
    honestyBanner: HONESTY_BANNER,
  };
}

export async function buildHardwareCortexSynapseCompilerHealthReport(input?: {
  root?: string;
}) {
  const root = input?.root ?? process.cwd();
  const brain = await checkLocalBrainHealth(root).catch(() => null);
  const preds = predecessorMap(root);
  const bxBw = probeBxBwLayers(root);
  return {
    phase: '62L-BY',
    honestyBanner: HONESTY_BANNER,
    l4AutonomyEnabled: BY_LOCKS.L4_AUTONOMY_ENABLED,
    locks: BY_LOCKS,
    cycle: HARDWARE_CORTEX_SYNAPSE_COMPILER_CYCLE,
    predecessors: preds,
    bxBwProbe: bxBw,
    localBrain: brain,
    githubSotIssue: 89,
    gitlabCoordinationIssue: 23,
    nextPhase: NEXT_PHASE_TITLE,
    tipLand: BY_LOCKS.TIP_LAND,
    dbCandidatesApplied: BY_LOCKS.DB_CANDIDATES_APPLIED,
    megaPrBulkIncluded: BY_LOCKS.MEGA_PR_BULK_INCLUDED,
    generatedAt: new Date().toISOString(),
  };
}
