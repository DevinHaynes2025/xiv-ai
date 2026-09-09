import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  activateUniverseNamespace,
  bootstrapHybridSupercomputeOs,
  buildScaleReport,
  hybridOsHonesty,
  scaleReportDistinguishesLogical,
} from './hybrid-supercompute-universe-os';
import {
  gpuQuantumHonesty,
  registerAccelerator,
  routeWorkload,
} from './gpu-quantum-workload-civilization';
import {
  intakeLeakSignal,
  placeStorage,
  registerStorageEndpoint,
  storageNervousHonesty,
} from './multi-cloud-storage-nervous-system';
import {
  attemptSpacePhysicalControl,
  registerSpaceKnowledgePack,
  spaceFabricHonesty,
} from './space-earth-signal-knowledge-fabric';
import {
  attemptGenomeGeneCopy,
  genomeEvolutionHonesty,
  rollbackGenomeExperiment,
  startGenomeExperiment,
} from './digital-genome-evolution-engine';
import {
  activateNeuralSim,
  attemptCausationPromotion,
  neuralDiscoveryHonesty,
  recordPathwayFinding,
} from './massive-neural-simulation-algorithm-discovery-grid';
import {
  CORRELATION_TO_CAUSATION_DENIED,
  CR_LOCKS,
  GENOME_SECRET_AUTHORITY_DENIED,
  HONESTY_BANNER,
  HYBRID_SUPERCOMPUTE_UNIVERSE_OS_CYCLE,
  LEAKED_INTAKE_DENIED,
  NEURAL_UNBOUNDED_SPAWN_DENIED,
  NEXT_PHASE_TITLE,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_DENIED,
  SPACE_PHYSICAL_CONTROL_DENIED,
  UNCONFIGURED_STORAGE_DENIED,
  UNVERIFIED_ACCELERATOR_UNAVAILABLE,
  predecessorMap,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';
import {
  buildHybridSupercomputeUniverseOsHealthReport,
  runHybridSupercomputeUniverseOsCycle,
} from './hybrid-supercompute-universe-os-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcr-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CrActor = {
  kind: 'hybrid_os_operator',
  id: 'op-cr-1',
  orgId: 'org-cr',
  tenantId: 'tenant-cr',
  universeId: 'univ-cr',
  role: 'operator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CR1-cycle',
    HYBRID_SUPERCOMPUTE_UNIVERSE_OS_CYCLE.join(' → ') ===
      'honesty_locks → hybrid_os_bootstrap → scale_report_logical_vs_materialized → gpu_accelerator_verified_only → quantum_classical_baseline_required → unverified_gpu_qpu_cloud_unavailable → storage_placement_configured_authorized → sealed_no_silent_aws_gcp → leak_monitor_defensive_only → leaked_stolen_restricted_denied → space_fabric_knowledge_only → space_no_physical_control → genome_experiment_reversible → genome_secret_authority_copy_denied → neural_sim_activation_bounded → pathway_miner_no_causation_promotion → evidence → learning',
    'Hybrid Supercompute Universe OS cycle recorded in order.',
  );

  check(
    'US-CR-locks',
    CR_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CR_LOCKS.TRUTHFUL_SCALE_REPORTING &&
      CR_LOCKS.LOGICAL_NE_MATERIALIZED &&
      CR_LOCKS.LOGICAL_NE_RUNNING &&
      CR_LOCKS.UNVERIFIED_ACCELERATOR_LIVE === false &&
      CR_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CR_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
      CR_LOCKS.SEALED_SILENT_AWS_GCP_FALLBACK === false &&
      CR_LOCKS.LEAK_MONITOR_DEFENSIVE_ONLY &&
      CR_LOCKS.LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED === false &&
      CR_LOCKS.SPACE_PHYSICAL_VEHICLE_ATC_CONTROL === false &&
      CR_LOCKS.GENOME_EXPERIMENTS_REVERSIBLE &&
      CR_LOCKS.GENOME_SILENT_COPY_SECRETS === false &&
      CR_LOCKS.NEURAL_SIM_ACTIVATION_BOUNDED &&
      CR_LOCKS.UNBOUNDED_PROCESS_SPAWN === false &&
      CR_LOCKS.PATHWAY_CORRELATION_EQ_CAUSATION === false &&
      CR_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CR_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CR-honesty-surfaces',
    hybridOsHonesty().truthfulScaleReporting === true &&
      gpuQuantumHonesty().classicalBaselineRequired === true &&
      storageNervousHonesty().sealedSilentAwsGcp === false &&
      spaceFabricHonesty().physicalControl === false &&
      genomeEvolutionHonesty().reversible === true &&
      neuralDiscoveryHonesty().correlationEqCausation === false,
    'Subsystem honesty surfaces deny-by-default.',
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CR-predecessors',
    preds.CQ.tipProbe === 'PRESENT' &&
      preds.CQ.report === 'PRESENT' &&
      preds.CP.tipProbe === 'PRESENT',
    `CQ=${preds.CQ.tipProbe}/${preds.CQ.report}; CP=${preds.CP.tipProbe}`,
  );

  // Scale report distinguishes logical vs materialized/running
  const scale = buildScaleReport({
    logicalUniverses: 10_000_000_000_000,
    materializedUniverses: 3,
    runningUniverses: 1,
    logicalQubits: 1_000_000_000_000,
    materializedQubits: 0,
    runningQubits: 0,
    logicalNeurons: 1_000_000_000_000_000,
    materializedNeurons: 16,
    runningNeurons: 8,
    logicalPathways: 1_000_000_000_000_000,
    materializedPathways: 8,
    runningPathways: 4,
  });
  check(
    'US-CR-scale-logical-vs-materialized',
    scaleReportDistinguishesLogical(scale) &&
      scale.logicalUniverses > scale.materializedUniverses &&
      scale.materializedUniverses > scale.runningUniverses &&
      scale.logicalQubits > scale.runningQubits &&
      scale.logicalNeurons > scale.materializedNeurons &&
      scale.logicalPathways > scale.runningPathways,
    scale.note,
  );

  const boot = await bootstrapHybridSupercomputeOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    scale,
  });
  check(
    'US-CR-hybrid-os-bootstrap',
    boot.coexistenceWithOfflineAgents === true &&
      boot.l4AutonomyEnabled === false &&
      boot.scale.logicalUniverses !== boot.scale.runningUniverses,
    boot.reason,
  );

  // Unverified GPU/QPU marked UNAVAILABLE (not live)
  const nvidia = await registerAccelerator({
    vendor: 'nvidia',
    kind: 'nvidia_cuda',
    configured: true,
    authorized: true,
    runtimeVerified: false,
    root,
    actor,
  });
  const amd = await registerAccelerator({
    vendor: 'amd',
    kind: 'amd_rocm',
    configured: false,
    authorized: false,
    runtimeVerified: false,
    root,
    actor,
  });
  const qpu = await registerAccelerator({
    vendor: 'quantum-provider',
    kind: 'quantum_qpu',
    configured: true,
    authorized: true,
    runtimeVerified: false,
    evidenceRefs: [],
    root,
    actor,
  });
  check(
    'US-CR-unverified-gpu-qpu-unavailable',
    nvidia.label === 'UNAVAILABLE' &&
      amd.label === 'UNAVAILABLE' &&
      qpu.label === 'UNAVAILABLE' &&
      nvidia.reason === UNVERIFIED_ACCELERATOR_UNAVAILABLE,
    nvidia.reason,
  );

  // Quantum without classical baseline REJECTED
  const noBaseline = await routeWorkload({
    objective: 'qaoa without baseline',
    classicalBaselinePresent: false,
    quantumRequested: true,
    acceleratorId: qpu.id,
    root,
    actor,
  });
  check(
    'US-CR-quantum-without-baseline-rejected',
    noBaseline.status === 'REJECTED' &&
      noBaseline.reason === QUANTUM_WITHOUT_BASELINE_REJECTED &&
      noBaseline.claimsQuantumAdvantage === false,
    noBaseline.reason,
  );

  // Storage placement to unconfigured cloud DENIED/UNAVAILABLE
  const awsPlace = await placeStorage({
    provider: 'aws',
    contentMode: 'open',
    root,
    actor,
  });
  const gcpPlace = await placeStorage({
    provider: 'gcp',
    contentMode: 'open',
    root,
    actor,
  });
  check(
    'US-CR-unconfigured-cloud-storage-denied',
    (awsPlace.status === 'unavailable' || awsPlace.status === 'denied') &&
      (gcpPlace.status === 'unavailable' || gcpPlace.status === 'denied') &&
      awsPlace.reason === UNCONFIGURED_STORAGE_DENIED,
    awsPlace.reason,
  );

  // Sealed data cannot silent-route to AWS/GCP
  await registerStorageEndpoint({
    provider: 'aws',
    configured: true,
    authorized: true,
    root,
    actor,
  });
  const sealedSilent = await placeStorage({
    provider: 'aws',
    contentMode: 'sealed',
    silentCloudFallbackRequested: true,
    root,
    actor,
  });
  check(
    'US-CR-sealed-no-silent-aws-gcp',
    sealedSilent.status === 'denied' &&
      sealedSilent.reason === SEALED_SILENT_CLOUD_DENIED,
    sealedSilent.reason,
  );

  // Leak intake of stolen/restricted DENIED; monitoring defensive-only
  const stolen = await intakeLeakSignal({
    sourceClass: 'stolen',
    root,
    actor,
  });
  const restricted = await intakeLeakSignal({
    sourceClass: 'restricted',
    root,
    actor,
  });
  const leaked = await intakeLeakSignal({
    sourceClass: 'leaked',
    root,
    actor,
  });
  const defensive = await intakeLeakSignal({
    sourceClass: 'authorized_monitor',
    root,
    actor,
  });
  const offensive = await intakeLeakSignal({
    sourceClass: 'authorized_monitor',
    offensiveHarvestRequested: true,
    root,
    actor,
  });
  check(
    'US-CR-leak-stolen-restricted-denied',
    stolen.status === 'denied' &&
      restricted.status === 'denied' &&
      leaked.status === 'denied' &&
      stolen.reason === LEAKED_INTAKE_DENIED &&
      defensive.status === 'accepted_defensive' &&
      offensive.status === 'denied',
    stolen.reason,
  );

  // Space fabric does not enable physical control
  const pack = await registerSpaceKnowledgePack({
    kind: 'starlink',
    label: 'starlink-ephemeris-knowledge',
    authorized: true,
    root,
    actor,
  });
  const vehicle = await attemptSpacePhysicalControl({
    target: 'vehicle',
    root,
    actor,
  });
  const atc = await attemptSpacePhysicalControl({
    target: 'atc',
    root,
    actor,
  });
  const craft = await attemptSpacePhysicalControl({
    target: 'spacecraft',
    root,
    actor,
  });
  check(
    'US-CR-space-no-physical-control',
    pack.knowledgeOnly === true &&
      pack.enablesPhysicalControl === false &&
      vehicle.status === 'denied' &&
      atc.status === 'denied' &&
      craft.status === 'denied' &&
      vehicle.reason === SPACE_PHYSICAL_CONTROL_DENIED,
    vehicle.reason,
  );

  // Genome experiment reversible; secret/authority copy DENIED
  const genome = await startGenomeExperiment({
    label: 'workflow-evolve',
    geneKinds: ['workflow', 'skill'],
    reversible: true,
    root,
    actor,
  });
  const rolled = await rollbackGenomeExperiment({
    experimentId: genome.id,
    root,
    actor,
  });
  const secretCopy = await attemptGenomeGeneCopy({
    geneKind: 'secret',
    root,
    actor,
  });
  const sealedCopy = await attemptGenomeGeneCopy({
    geneKind: 'sealed',
    root,
    actor,
  });
  const authorityCopy = await attemptGenomeGeneCopy({
    geneKind: 'authority',
    root,
    actor,
  });
  const secretExp = await startGenomeExperiment({
    label: 'secret-attempt',
    geneKinds: ['secret'],
    reversible: true,
    root,
    actor,
  });
  check(
    'US-CR-genome-reversible-secret-denied',
    genome.reversible === true &&
      genome.status === 'sandboxed' &&
      rolled?.status === 'rolled_back' &&
      secretCopy.status === 'denied' &&
      sealedCopy.status === 'denied' &&
      authorityCopy.status === 'denied' &&
      secretExp.status === 'denied' &&
      secretCopy.reason === GENOME_SECRET_AUTHORITY_DENIED,
    secretCopy.reason,
  );

  // Neural sim activation bounded (no unbounded process spawn)
  const unbounded = await activateNeuralSim({
    label: 'spawn-all',
    requestedWalkers: Number.MAX_SAFE_INTEGER,
    unboundedSpawnRequested: true,
    root,
    actor,
  });
  const bounded = await activateNeuralSim({
    label: 'sparse-walk',
    requestedWalkers: 8,
    root,
    actor,
  });
  check(
    'US-CR-neural-sim-bounded',
    unbounded.status === 'denied' &&
      unbounded.reason === NEURAL_UNBOUNDED_SPAWN_DENIED &&
      (bounded.status === 'activated' || bounded.status === 'bounded') &&
      bounded.activatedWalkers <= 128 &&
      bounded.scale.logicalNeurons > bounded.scale.materializedNeurons,
    unbounded.reason,
  );

  // Pathway miner does not promote correlation to verified causation without evidence
  const finding = await recordPathwayFinding({
    claim: 'signal X correlates with outcome Y',
    kind: 'correlation',
    evidenceRefs: [],
    root,
    actor,
  });
  const promo = await attemptCausationPromotion({
    findingId: finding.id,
    evidenceSufficient: false,
    root,
    actor,
  });
  check(
    'US-CR-pathway-no-causation-promotion',
    finding.verifiedCausation === false &&
      finding.kind === 'correlation' &&
      promo.status === 'denied' &&
      promo.reason === CORRELATION_TO_CAUSATION_DENIED,
    promo.reason,
  );

  const ns = await activateUniverseNamespace({
    label: 'hybrid-ns-1',
    mode: 'hybrid',
    root,
    actor,
  });
  check(
    'US-CR-namespace-activation',
    ns.status === 'activated' && ns.namespace?.running === true,
    ns.reason,
  );

  const cycleRoot = await mkdtemp(join(tmpdir(), 'xiv-62lcr-cycle-'));
  let cycle;
  try {
    cycle = await runHybridSupercomputeUniverseOsCycle({
      orgId: actor.orgId,
      tenantId: actor.tenantId,
      universeId: actor.universeId,
      actor,
      root: cycleRoot,
    });
  } finally {
    await rm(cycleRoot, { recursive: true, force: true });
  }
  const failedHops = cycle.hops.filter(
    (h) =>
      ![
        'PASS',
        'DENIED',
        'REJECTED',
        'UNAVAILABLE',
        'BOUNDED',
        'LOGICAL_ONLY',
        'DEFENSIVE_ONLY',
        'REVERSIBLE',
        'CORRELATION_ONLY',
        'WAITING_DATA',
      ].includes(h.state),
  );
  check(
    'US-CR-cycle-ok',
    cycle.ok === true &&
      cycle.hops.length === HYBRID_SUPERCOMPUTE_UNIVERSE_OS_CYCLE.length &&
      cycle.l4AutonomyEnabled === false &&
      cycle.scale.logicalUniverses > cycle.scale.runningUniverses &&
      failedHops.length === 0,
    `hops=${cycle.hops.length}; ok=${cycle.ok}; failed=${failedHops.map((h) => `${h.hop}:${h.state}`).join(',') || 'none'}`,
  );

  const health = await buildHybridSupercomputeUniverseOsHealthReport({
    root: repoRoot,
  });
  check(
    'US-CR-health-report',
    health.phase === '62L-CR' &&
      health.githubSotIssue === 108 &&
      health.gitlabCoordinationIssue === 42 &&
      health.l4AutonomyEnabled === false &&
      health.productionAuthorized === false &&
      health.tipLand === false &&
      health.documentedEqImplemented === false &&
      health.predecessors.CQ.tipProbe === 'PRESENT' &&
      health.nextPhase.startsWith('62L-CS —'),
    health.nextPhase,
  );

  check(
    'US-CR-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CS —'),
    NEXT_PHASE_TITLE,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CR stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('PASS 62L-CR — all required stories');
