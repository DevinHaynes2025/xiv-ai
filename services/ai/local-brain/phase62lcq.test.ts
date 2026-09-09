import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  activateUniverseNamespace,
  bootstrapOfflineUniverseFabric,
  catalogLogicalUniverses,
  evaluatePhysicalUniverseCountClaim,
  offlineUniverseFabricHonesty,
  startOfflineAgentShift,
} from './offline-agent-universe-fabric';
import {
  acceleratorCloudHonesty,
  registerAcceleratorAdapter,
  registerCiscoCompatibleContract,
  registerCloudCollaboration,
  routeToCloudModel,
} from './accelerator-cloud-collaboration';
import {
  defensiveLeakSentinelHonesty,
  evaluateSourceIntake,
  probeOffensiveHarvestCapability,
  runDefensiveLeakScan,
} from './defensive-data-leak-sentinel';
import {
  evaluatePhysicalQubitClaim,
  proposeQuantumResearchPath,
  quantumResearchPathwaysHonesty,
} from './quantum-research-pathways';
import {
  probeSpacePhysicalControl,
  registerSpaceEarthKnowledgePack,
  spaceEarthKnowledgeHonesty,
} from './space-earth-knowledge-graph';
import {
  activateNeuralPathWalkers,
  branchDigitalGenome,
  createTrillionPathNeuralCatalog,
  digitalGenomeNeuralHonesty,
  registerApprovedGenomeTemplate,
} from './digital-genome-trillion-path-neural';
import {
  CQ_LOCKS,
  GENOME_STRIP_SECRETS_SEALED_AUTHORITY,
  HONESTY_BANNER,
  LEAKED_INTAKE_DENIED,
  MAX_ACTIVE_UNIVERSE_NAMESPACES,
  NEXT_PHASE_TITLE,
  OFFENSIVE_HARVEST_DENIED,
  OFFLINE_UNIVERSE_QUANTUM_GENOME_CYCLE,
  PHYSICAL_CLAIM_NOT_VERIFIED,
  QUANTUM_WITHOUT_BASELINE_REJECTED,
  SEALED_SILENT_CLOUD_MODEL_DENIED,
  SPACE_PHYSICAL_CONTROL_DENIED,
  TRILLION_SCALE_LOGICAL_ONLY,
  UNCONFIGURED_ADAPTER_UNAVAILABLE,
  predecessorMap,
  type CqActor,
} from './offline-universe-quantum-genome-types';
import {
  buildOfflineUniverseQuantumGenomeHealthReport,
  runOfflineUniverseQuantumGenomeCycle,
} from './offline-universe-quantum-genome-runtime';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62lcq-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: CqActor = {
  kind: 'offline_shift_curator',
  id: 'curator-cq-1',
  orgId: 'org-cq',
  tenantId: 'tenant-cq',
  universeId: 'univ-cq',
  role: 'curator',
  permissionLevel: 0,
  authorityLevel: 0,
};

try {
  check(
    'US-CQ1-cycle',
    OFFLINE_UNIVERSE_QUANTUM_GENOME_CYCLE.join(' → ') ===
      'honesty_locks → offline_agent_universe_fabric_bootstrap → trillion_scale_logical_catalog_bounded_activation → accelerator_adapter_configured_gate → cloud_collaboration_configured_gate → cisco_compatible_contract_gate → defensive_leak_sentinel_scan → leaked_stolen_restricted_intake_denied → offensive_harvest_capability_denied → quantum_classical_baseline_required → quantum_simulator_vs_qpu_evidence_gate → space_earth_knowledge_pack_only → space_pack_no_vehicle_atc_control → digital_genome_branch_strip_secrets → trillion_path_neural_sparse_logical → sealed_no_silent_aws_gcp_model → offline_shift_freshness_stale_waiting → evidence → learning',
    'Offline Universe Quantum Genome cycle recorded in order.',
  );

  check(
    'US-CQ-locks',
    CQ_LOCKS.L4_AUTONOMY_ENABLED === false &&
      CQ_LOCKS.TRILLION_SCALE_IS_LOGICAL_ADDRESS_SPACE &&
      CQ_LOCKS.PHYSICAL_TRILLION_PROCESSES_CLAIMED === false &&
      CQ_LOCKS.PHYSICAL_QUBIT_COUNT_WITHOUT_HARDWARE_EVIDENCE_VERIFIED === false &&
      CQ_LOCKS.ACTIVATION_BOUNDED &&
      CQ_LOCKS.UNCONFIGURED_ADAPTER_AVAILABLE === false &&
      CQ_LOCKS.DEFENSIVE_LEAK_SENTINEL_ONLY &&
      CQ_LOCKS.OFFENSIVE_HARVEST_ALLOWED === false &&
      CQ_LOCKS.LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED === false &&
      CQ_LOCKS.QUANTUM_CLASSICAL_BASELINE_REQUIRED &&
      CQ_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
      CQ_LOCKS.SPACE_PACK_VEHICLE_ATC_PHYSICAL_CONTROL === false &&
      CQ_LOCKS.GENOME_SILENT_COPY_SECRETS === false &&
      CQ_LOCKS.GENOME_SILENT_COPY_SEALED === false &&
      CQ_LOCKS.GENOME_SILENT_COPY_AUTHORITY === false &&
      CQ_LOCKS.SEALED_SILENT_AWS_GCP_MODEL_FALLBACK === false &&
      CQ_LOCKS.LIVE_SUPABASE_APPLY === false &&
      CQ_LOCKS.TIP_LAND === false,
    HONESTY_BANNER,
  );

  check(
    'US-CQ-honesty-surfaces',
    offlineUniverseFabricHonesty().trillionScaleIsLogical === true &&
      acceleratorCloudHonesty().unconfiguredAvailable === false &&
      defensiveLeakSentinelHonesty().offensiveHarvestAllowed === false &&
      quantumResearchPathwaysHonesty().classicalBaselineRequired === true &&
      spaceEarthKnowledgeHonesty().vehicleAtcPhysicalControl === false &&
      digitalGenomeNeuralHonesty().silentCopySecrets === false,
    'Subsystem honesty surfaces deny-by-default / logical-scale.',
  );

  check(
    'US-CQ-next-title',
    NEXT_PHASE_TITLE.startsWith('62L-CR —'),
    NEXT_PHASE_TITLE,
  );

  const preds = predecessorMap(repoRoot);
  check(
    'US-CQ-predecessor-CP',
    preds.CP.tipProbe === 'PRESENT' && preds.CP.report === 'PRESENT',
    `CP tip=${preds.CP.tipProbe} report=${preds.CP.report}`,
  );

  const fabric = await bootstrapOfflineUniverseFabric({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    logicalCatalogSize: 10_000_000_000_000,
    root,
    actor,
  });

  // Trillion-scale catalog without spawning trillion processes; activation bounded
  const catalog = await catalogLogicalUniverses({
    fabricId: fabric.id,
    count: 500,
    root,
    actor,
  });
  check(
    'US-CQ-trillion-catalog-no-spawn',
    catalog.processesSpawned === 0 &&
      catalog.physicalClaimStatus === 'NOT_VERIFIED' &&
      catalog.reason === TRILLION_SCALE_LOGICAL_ONLY &&
      fabric.physicalUniversesRunning === 0,
    `cataloged=${catalog.cataloged} spawned=${catalog.processesSpawned}`,
  );

  const activated = await activateUniverseNamespace({
    fabricId: fabric.id,
    label: 'bounded-1',
    root,
    actor,
  });
  check(
    'US-CQ-activation-bounded-ok',
    activated.accepted === true,
    activated.accepted ? activated.reason : 'FAIL',
  );

  // Fill activation to bound and prove denial beyond max
  for (let i = 1; i < MAX_ACTIVE_UNIVERSE_NAMESPACES; i++) {
    await activateUniverseNamespace({
      fabricId: fabric.id,
      label: `bounded-${i + 1}`,
      root,
      actor,
    });
  }
  const overBound = await activateUniverseNamespace({
    fabricId: fabric.id,
    label: 'over-bound',
    root,
    actor,
  });
  check(
    'US-CQ-activation-bounded-deny',
    overBound.accepted === false,
    overBound.accepted ? 'unexpected accept' : overBound.reason,
  );

  // Physical qubit/universe-count claim without hardware evidence not VERIFIED
  const univClaim = evaluatePhysicalUniverseCountClaim({
    claimedPhysicalCount: 10_000_000_000_000,
    hardwareEvidencePresent: false,
  });
  const qubitClaim = evaluatePhysicalQubitClaim({
    claimedPhysicalQubits: 1_000_000_000_000,
    hardwareEvidencePresent: false,
  });
  check(
    'US-CQ-physical-claim-not-verified',
    univClaim.status === 'NOT_VERIFIED' &&
      univClaim.verified === false &&
      qubitClaim.status === 'NOT_VERIFIED' &&
      qubitClaim.verified === false &&
      univClaim.reason === PHYSICAL_CLAIM_NOT_VERIFIED,
    'Physical extreme-scale claims remain NOT_VERIFIED.',
  );

  // Unconfigured AMD/NVIDIA/AWS/GCP/Cisco/QPU → UNAVAILABLE
  const amd = await registerAcceleratorAdapter({
    vendor: 'amd',
    configured: false,
    root,
    actor,
  });
  const nvidia = await registerAcceleratorAdapter({
    vendor: 'nvidia',
    configured: false,
    root,
    actor,
  });
  const aws = await registerCloudCollaboration({
    vendor: 'aws',
    kind: 'model',
    configured: false,
    root,
    actor,
  });
  const gcp = await registerCloudCollaboration({
    vendor: 'gcp',
    kind: 'storage',
    configured: false,
    root,
    actor,
  });
  const cisco = await registerCiscoCompatibleContract({
    configured: false,
    root,
    actor,
  });
  const qpu = await proposeQuantumResearchPath({
    objective: 'qpu unconfigured',
    algorithm: 'vqe',
    classicalBaselineRef: 'classical-v1',
    backend: 'quantum_qpu',
    backendConfigured: false,
    root,
    actor,
  });
  check(
    'US-CQ-unconfigured-unavailable',
    amd.status === 'UNAVAILABLE' &&
      nvidia.status === 'UNAVAILABLE' &&
      aws.status === 'UNAVAILABLE' &&
      gcp.status === 'UNAVAILABLE' &&
      cisco.status === 'UNAVAILABLE' &&
      qpu.status === 'UNAVAILABLE' &&
      amd.reason === UNCONFIGURED_ADAPTER_UNAVAILABLE,
    'Unconfigured adapters/QPU → UNAVAILABLE.',
  );

  // Leaked/stolen/restricted source intake DENIED
  const leaked = await evaluateSourceIntake({ sourceClass: 'leaked', root, actor });
  const stolen = await evaluateSourceIntake({ sourceClass: 'stolen', root, actor });
  const restricted = await evaluateSourceIntake({
    sourceClass: 'restricted',
    root,
    actor,
  });
  check(
    'US-CQ-leaked-stolen-restricted-denied',
    leaked.status === 'denied' &&
      stolen.status === 'denied' &&
      restricted.status === 'denied' &&
      leaked.reason === LEAKED_INTAKE_DENIED,
    'Leaked/stolen/restricted intake DENIED.',
  );

  // Sentinel is defensive (offensive harvest capability DENIED)
  const scan = await runDefensiveLeakScan({
    environmentScope: 'xiv_owned',
    root,
    actor,
  });
  const offensive = await probeOffensiveHarvestCapability({ root, actor });
  check(
    'US-CQ-sentinel-defensive-only',
    scan.defensiveOnly === true &&
      scan.offensiveHarvestCapable === false &&
      offensive.status === 'denied' &&
      offensive.reason === OFFENSIVE_HARVEST_DENIED,
    'Defensive sentinel only; offensive harvest DENIED.',
  );

  // Quantum path without classical baseline REJECTED
  const noBaseline = await proposeQuantumResearchPath({
    objective: 'anneal',
    algorithm: 'qaoa',
    classicalBaselineRef: null,
    backend: 'quantum_simulator',
    backendConfigured: true,
    backendAuthorized: true,
    backendVerified: true,
    root,
    actor,
  });
  check(
    'US-CQ-quantum-no-baseline-rejected',
    noBaseline.status === 'REJECTED' &&
      noBaseline.reason === QUANTUM_WITHOUT_BASELINE_REJECTED &&
      noBaseline.claimsQuantumAdvantage === false,
    'Quantum without classical baseline REJECTED.',
  );

  // Space pack does not enable vehicle/ATC physical control
  const pack = await registerSpaceEarthKnowledgePack({
    kind: 'gps_science',
    label: 'GPS science',
    authorizedScientific: true,
    root,
    actor,
  });
  const vehicle = await probeSpacePhysicalControl({
    packId: pack.id,
    controlKind: 'vehicle',
    root,
    actor,
  });
  const atc = await probeSpacePhysicalControl({
    packId: pack.id,
    controlKind: 'atc',
    root,
    actor,
  });
  const controlAttempt = await registerSpaceEarthKnowledgePack({
    kind: 'starlink_science',
    label: 'bad control attempt',
    attemptEnableVehicleControl: true,
    root,
    actor,
  });
  check(
    'US-CQ-space-no-physical-control',
    pack.knowledgeOnly &&
      pack.enablesVehicleControl === false &&
      pack.enablesAtcControl === false &&
      vehicle.status === 'denied' &&
      atc.status === 'denied' &&
      controlAttempt.status === 'denied' &&
      vehicle.reason === SPACE_PHYSICAL_CONTROL_DENIED,
    'Space/Earth packs are knowledge-only; no vehicle/ATC control.',
  );

  // Genome branch strips secrets/sealed/authority
  const template = await registerApprovedGenomeTemplate({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    name: 'cq-tpl',
    genes: [{ kind: 'workflow', label: 'shift', content: 'offline' }],
    secrets: ['sekrit'],
    sealedPayloads: ['sealed'],
    authorityLevel: 7,
    root,
    actor,
  });
  const branch = await branchDigitalGenome({
    sourceTemplateId: template.id,
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    name: 'cq-branch',
    attemptCopySecrets: true,
    attemptCopySealed: true,
    attemptCopyAuthority: true,
    root,
    actor,
  });
  check(
    'US-CQ-genome-strips-secrets-sealed-authority',
    branch.status === 'branched' &&
      branch.secrets.length === 0 &&
      branch.sealedPayloads.length === 0 &&
      branch.authorityLevel === 0 &&
      branch.reason === GENOME_STRIP_SECRETS_SEALED_AUTHORITY,
    'Genome branch strips secrets/sealed/authority.',
  );

  // Sealed content cannot silent-route to AWS/GCP model
  const sealedAws = await routeToCloudModel({
    vendor: 'aws',
    contentMode: 'sealed',
    silentFallbackRequested: true,
    root,
    actor,
  });
  const sealedGcp = await routeToCloudModel({
    vendor: 'gcp',
    contentMode: 'local_only',
    silentFallbackRequested: true,
    root,
    actor,
  });
  check(
    'US-CQ-sealed-no-silent-aws-gcp',
    sealedAws.status === 'denied' &&
      sealedGcp.status === 'denied' &&
      sealedAws.reason === SEALED_SILENT_CLOUD_MODEL_DENIED,
    'Sealed/local_only cannot silent-route to AWS/GCP model.',
  );

  // Offline shift freshness-sensitive → STALE/WAITING_DATA
  const stale = await startOfflineAgentShift({
    fabricId: fabric.id,
    universeId: actor.universeId,
    agentId: 'a-stale',
    freshnessSensitive: true,
    cacheAgeMs: 90_000,
    freshnessTtlMs: 10_000,
    root,
    actor,
  });
  const waiting = await startOfflineAgentShift({
    fabricId: fabric.id,
    universeId: actor.universeId,
    agentId: 'a-wait',
    freshnessSensitive: true,
    waitingOnUpstream: true,
    root,
    actor,
  });
  check(
    'US-CQ-offline-freshness-stale-waiting',
    stale.freshnessState === 'STALE' &&
      stale.status === 'stale' &&
      waiting.freshnessState === 'WAITING_DATA' &&
      waiting.status === 'waiting_data',
    'Offline freshness-sensitive shifts → STALE / WAITING_DATA.',
  );

  // Neural trillion-path sparse logical
  const neural = await createTrillionPathNeuralCatalog({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    logicalPathCount: 1_000_000_000_000,
    root,
    actor,
  });
  const walk = await activateNeuralPathWalkers({
    catalogId: neural.id,
    count: 4,
    root,
    actor,
  });
  check(
    'US-CQ-neural-sparse-logical',
    neural.sparseLogical &&
      neural.processesSpawned === 0 &&
      neural.physicalClaimVerified === false &&
      walk.accepted &&
      walk.processesSpawned === 0,
    `logicalPaths=${neural.logicalPathCount} walkers=${walk.accepted ? walk.activeWalkers : 0}`,
  );

  const cycle = await runOfflineUniverseQuantumGenomeCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
  });
  check(
    'US-CQ-cycle-ok',
    cycle.ok === true &&
      cycle.l4AutonomyEnabled === false &&
      cycle.hops.length === OFFLINE_UNIVERSE_QUANTUM_GENOME_CYCLE.length,
    `ok=${cycle.ok} hops=${cycle.hops.length}`,
  );

  const health = await buildOfflineUniverseQuantumGenomeHealthReport({ root: repoRoot });
  check(
    'US-CQ-health-report',
    health.phase === '62L-CQ' &&
      health.githubSotIssue === 107 &&
      health.gitlabCoordinationIssue === 41 &&
      health.l4AutonomyEnabled === false &&
      health.documentedEqImplemented === false &&
      health.implementedEqVerified === false &&
      health.verifiedEqProductionAuthorized === false,
    'Health report honesty + SoT citations.',
  );
} catch (err) {
  failures.push(`UNCAUGHT: ${(err as Error).message}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-CQ stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-CQ — all required stories passed');
