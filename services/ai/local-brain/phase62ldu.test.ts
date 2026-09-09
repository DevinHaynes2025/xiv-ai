import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  accessAdultUniverse,
  moderateImagery,
  requireAdultAgeGate,
} from './adult-community-universes';
import {
  denySurveillanceOrProfiling,
  probeBiometricDefaults,
  startVoiceIdentitySession,
} from './consent-based-identity-voice-layer';
import {
  createParallelUniverseBranch,
  labelSimulation,
  probeDigitalTwinAuthority,
  probeOfflineRuntime,
  reconstructHistory,
  runQuantumInspired,
} from './cross-device-quantum-inspired-agent-runtime';
import { accessDataTower, registerDataTowerNode } from './data-control-tower';
import {
  recordDnaLearning,
  registerDigitalDnaPattern,
} from './digital-dna-knowledge-graph';
import {
  attemptFabRemoteControl,
  mapChipCapability,
} from './supply-chain-chip-knowledge-grid';
import {
  createIndustryPlan,
  gateHospitalLogistics,
  probeIndustryProvider,
} from './universal-industry-intelligence';
import {
  bootstrapUniversalIndustryIntelligenceOs,
  universalIndustryIntelligenceOsHonesty,
} from './universal-industry-intelligence-os';
import {
  ADULT_AGE_GATE_REQUIRED,
  ARCHITECTURE_TRANSLATIONS,
  BIOMETRIC_DEFAULTS_OFF,
  CHIP_NEQ_FAB_CONTROL,
  DATA_TOWER_DENIED,
  DIGITAL_DNA_NEQ_CLONING,
  DU_LOCKS,
  HOSPITAL_HUMAN_GATE_REQUIRED,
  HONESTY_BANNER,
  INDUSTRY_PLAN_NEQ_CONTROL,
  LABEL_NEQ_DATA_ACCESS,
  LEARNING_NEQ_PERMISSION,
  MINOR_ACCESS_DENIED,
  NEXT_PHASE_TITLE,
  NON_CONSENSUAL_DENIED,
  OFFLINE_WAITING_OR_STOPPED,
  PARALLEL_UNIVERSE_SIM,
  PRODUCT_PHILOSOPHY,
  QUANTUM_CLASSICAL_BASELINE,
  SIM_NEQ_FACT,
  SURVEILLANCE_PROFILING_DENIED,
  TIME_TRAVEL_RECONSTRUCTION,
  TWIN_NEQ_FOUNDER,
  UNAUTHORIZED_CHIP_SOURCE,
  UNCONFIGURED_INDUSTRY_PROVIDER,
  UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_CYCLE,
  VOICE_OPT_IN_REQUIRED,
  WEALTH_NEQ_TRADE_TRANSFER,
  WELLNESS_NEQ_DIAGNOSE,
  predecessorMap,
  type DuActor,
} from './universal-industry-intelligence-os-types';
import {
  buildUniversalIndustryIntelligenceOsHealthReport,
  runUniversalIndustryIntelligenceOsCycle,
} from './universal-industry-intelligence-os-runtime';
import { recommendWealth, recommendWellness } from './wellness-wealth-copilot';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = await mkdtemp(join(tmpdir(), 'xiv-62ldu-'));
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

const actor: DuActor = {
  kind: 'industry_os_curator',
  id: 'test-curator',
  orgId: 'org-du',
  tenantId: 'tenant-du',
  universeId: 'universe-du',
};
const twinActor: DuActor = { ...actor, kind: 'digital_twin', id: 'twin-1' };

try {
  check(
    'honesty_banner_and_locks',
    HONESTY_BANNER.includes('DOCUMENTED') &&
      DU_LOCKS.L4_AUTONOMY_ENABLED === false &&
      DU_LOCKS.TIP_LAND === false &&
      DU_LOCKS.BIOMETRIC_DEFAULT_ENABLED === false &&
      DU_LOCKS.MINORS_IN_ADULT_UNIVERSES === false &&
      DU_LOCKS.DIGITAL_DNA_EQ_CLONING === false &&
      DU_LOCKS.SIM_EQ_VERIFIED_FACT === false &&
      DU_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QUANTUM === false &&
      PRODUCT_PHILOSOPHY.biometricOptInLocalRevocable === true &&
      UNIVERSAL_INDUSTRY_INTELLIGENCE_OS_CYCLE.includes('biometric_defaults_off'),
    'locks + philosophy + cycle present',
  );

  const os = await bootstrapUniversalIndustryIntelligenceOs({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    root,
    actor,
    repoRoot,
  });
  check(
    'bootstrap_universal_industry_intelligence_os',
    Boolean(os.id) &&
      os.l4AutonomyEnabled === false &&
      os.tipLand === false &&
      os.predecessorLayer === 'DT' &&
      os.dtSoftWired === true,
    `os=${os.id}; predecessor=${os.predecessorLayer}`,
  );

  // A
  const plan = await createIndustryPlan({
    domain: 'tms',
    summary: 'route optimization',
    attemptPhysicalControl: true,
    root,
    actor,
  });
  check(
    'industry_plan_neq_physical_control',
    plan.physicalControlAuthorized === false &&
      plan.status === 'denied' &&
      plan.reason === INDUSTRY_PLAN_NEQ_CONTROL,
    plan.reason,
  );

  const hospPlan = await createIndustryPlan({
    domain: 'hospital_logistics',
    summary: 'pharmacy restock plan',
    root,
    actor,
  });
  const hosp = await gateHospitalLogistics({
    planId: hospPlan.id,
    humanGatePresent: false,
    root,
    actor,
  });
  check(
    'hospital_logistics_requires_human_gate',
    hosp.status === 'denied' &&
      hosp.physicalControl === false &&
      hosp.reason === HOSPITAL_HUMAN_GATE_REQUIRED,
    hosp.reason,
  );

  const provider = await probeIndustryProvider({
    providerId: 'tms-stub',
    configured: false,
    claimAvailable: true,
    root,
    actor,
  });
  check(
    'unconfigured_industry_provider_unavailable',
    provider.availability === 'UNAVAILABLE' &&
      provider.status === 'denied' &&
      provider.reason === UNCONFIGURED_INDUSTRY_PROVIDER,
    provider.reason,
  );

  // B
  const chip = await mapChipCapability({
    family: 'NVIDIA',
    workloadHighway: 'npu-edge',
    sourceAuthorized: false,
    root,
    actor,
  });
  check(
    'unauthorized_chip_source_denied',
    chip.status === 'denied' && chip.reason === UNAUTHORIZED_CHIP_SOURCE,
    chip.reason,
  );

  const mapped = await mapChipCapability({
    family: 'GPU',
    workloadHighway: 'training',
    sourceAuthorized: true,
    root,
    actor,
  });
  const fab = await attemptFabRemoteControl({
    mappingId: mapped.id,
    attemptRemoteControl: true,
    root,
    actor,
  });
  check(
    'chip_mapping_neq_fab_remote_control',
    fab.fabRemoteControl === false &&
      fab.status === 'denied' &&
      fab.reason === CHIP_NEQ_FAB_CONTROL,
    fab.reason,
  );

  // C
  const tower = await registerDataTowerNode({
    name: 'cloud-lake',
    location: 'cloud',
    sealed: true,
    root,
    actor,
  });
  const deniedTower = await accessDataTower({
    nodeId: tower.id,
    labelPresent: false,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'data_tower_deny_by_default',
    deniedTower.status === 'denied' && deniedTower.reason === DATA_TOWER_DENIED,
    deniedTower.reason,
  );

  const labelOnly = await accessDataTower({
    nodeId: tower.id,
    labelPresent: true,
    explicitGrant: false,
    root,
    actor,
  });
  check(
    'label_alone_neq_data_access',
    labelOnly.status === 'denied' && labelOnly.reason === LABEL_NEQ_DATA_ACCESS,
    labelOnly.reason,
  );

  // D
  const bio = await probeBiometricDefaults({
    modality: 'gaze',
    claimDefaultEnabled: true,
    root,
    actor,
  });
  check(
    'biometric_defaults_off',
    bio.enabledByDefault === false &&
      bio.status === 'disabled' &&
      bio.reason === BIOMETRIC_DEFAULTS_OFF,
    bio.reason,
  );

  const surv = await denySurveillanceOrProfiling({
    kind: 'public_surveillance',
    root,
    actor,
  });
  check(
    'surveillance_profiling_denied',
    surv.status === 'denied' && surv.reason === SURVEILLANCE_PROFILING_DENIED,
    surv.reason,
  );

  const voice = await startVoiceIdentitySession({
    optInPresent: false,
    root,
    actor,
  });
  check(
    'voice_identity_requires_opt_in',
    voice.status === 'denied' && voice.reason === VOICE_OPT_IN_REQUIRED,
    voice.reason,
  );

  // E
  const minor = await accessAdultUniverse({
    universeId: actor.universeId,
    claimedAge: 15,
    ageVerified: false,
    isMinor: true,
    root,
    actor,
  });
  check(
    'minor_universe_access_denied',
    minor.status === 'denied' && minor.reason === MINOR_ACCESS_DENIED,
    minor.reason,
  );

  const imagery = await moderateImagery({
    universeId: actor.universeId,
    consensual: false,
    subjectsAgeVerifiedAdult: true,
    root,
    actor,
  });
  check(
    'non_consensual_imagery_denied',
    imagery.status === 'denied' && imagery.reason === NON_CONSENSUAL_DENIED,
    imagery.reason,
  );

  const ageGate = await requireAdultAgeGate({
    universeId: actor.universeId,
    ageGatePresent: false,
    root,
    actor,
  });
  check(
    'adult_age_gate_required',
    ageGate.status === 'denied' && ageGate.reason === ADULT_AGE_GATE_REQUIRED,
    ageGate.reason,
  );

  // F
  const wellness = await recommendWellness({
    summary: 'hydration reminder',
    attemptDiagnose: true,
    root,
    actor,
  });
  check(
    'wellness_recommend_neq_diagnose',
    wellness.diagnoses === false &&
      wellness.status === 'denied' &&
      wellness.reason === WELLNESS_NEQ_DIAGNOSE,
    wellness.reason,
  );

  const wealth = await recommendWealth({
    summary: 'cashflow sketch',
    attemptTrade: true,
    attemptTransfer: true,
    root,
    actor,
  });
  check(
    'wealth_recommend_neq_trade_or_transfer',
    wealth.trades === false &&
      wealth.transfers === false &&
      wealth.status === 'denied' &&
      wealth.reason === WEALTH_NEQ_TRADE_TRANSFER,
    wealth.reason,
  );

  // G
  const dna = await registerDigitalDnaPattern({
    name: 'clone-attempt',
    licensed: false,
    attemptClonePeopleOrIp: true,
    root,
    actor,
  });
  check(
    'digital_dna_neq_cloning',
    dna.clonesPeopleOrIp === false &&
      dna.status === 'denied' &&
      dna.reason === DIGITAL_DNA_NEQ_CLONING,
    dna.reason,
  );

  const licensed = await registerDigitalDnaPattern({
    name: 'licensed-workflow',
    licensed: true,
    root,
    actor,
  });
  const learn = await recordDnaLearning({
    patternId: licensed.id,
    claimPermissionGrant: true,
    root,
    actor,
  });
  check(
    'learning_neq_permission_grant',
    learn.grantsPermission === false &&
      learn.status === 'denied' &&
      learn.reason === LEARNING_NEQ_PERMISSION,
    learn.reason,
  );

  // H
  const sim = await labelSimulation({
    kind: 'forecast',
    claimVerifiedFact: true,
    root,
    actor,
  });
  check(
    'sim_neq_verified_fact',
    sim.verifiedFact === false &&
      sim.status === 'denied' &&
      sim.reason === SIM_NEQ_FACT,
    sim.reason,
  );

  const qi = await runQuantumInspired({
    classicalBaselinePresent: false,
    claimPhysicalQuantum: true,
    claimSupremacy: true,
    root,
    actor,
  });
  check(
    'quantum_inspired_requires_classical_baseline',
    qi.physicalQuantum === false &&
      qi.supremacyClaimed === false &&
      qi.status === 'denied' &&
      qi.reason === QUANTUM_CLASSICAL_BASELINE,
    qi.reason,
  );

  const parallel = await createParallelUniverseBranch({
    name: 'counterfactual-branch',
    claimLiteralAlternateReality: true,
    root,
    actor,
  });
  check(
    'parallel_universe_is_isolated_sim_branch',
    parallel.isolatedWorkspace === true &&
      parallel.literalAlternateReality === false &&
      parallel.reason === PARALLEL_UNIVERSE_SIM,
    parallel.reason,
  );

  const time = await reconstructHistory({
    subject: 'chip-roadmap-2019',
    kind: 'historical_reconstruction',
    claimLiteralTimeTravel: true,
    root,
    actor,
  });
  check(
    'time_travel_is_reconstruction_not_literal',
    time.literalTimeTravel === false &&
      time.reason === TIME_TRAVEL_RECONSTRUCTION,
    time.reason,
  );

  const offline = await probeOfflineRuntime({
    poweredAuthorizedNode: false,
    preferWaiting: true,
    root,
    actor,
  });
  check(
    'offline_without_powered_node_waiting_or_stopped',
    offline.state === 'WAITING_NODE' && offline.reason === OFFLINE_WAITING_OR_STOPPED,
    offline.reason,
  );

  const twin = await probeDigitalTwinAuthority({
    actor: twinActor,
    claimFounderAuthority: true,
    root,
  });
  check(
    'digital_twin_neq_founder',
    twin.status === 'denied' && twin.reason === TWIN_NEQ_FOUNDER,
    twin.reason,
  );

  check(
    'architecture_translations_present',
    ARCHITECTURE_TRANSLATIONS.parallelUniverse.includes('Isolated') &&
      ARCHITECTURE_TRANSLATIONS.timeTravel.includes('Historical') &&
      ARCHITECTURE_TRANSLATIONS.digitalDna.includes('licensed') &&
      ARCHITECTURE_TRANSLATIONS.quantumInspired.includes('Classical'),
    'Universe/time-travel/Digital DNA/quantum-inspired translations locked',
  );

  const cycle = await runUniversalIndustryIntelligenceOsCycle({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  const failedHops = cycle.hops.filter((h) => h.state === 'FAIL');
  check(
    'runtime_cycle_all_required_stories',
    failedHops.length === 0 &&
      cycle.tipLand === false &&
      cycle.productionAuthorized === false &&
      cycle.githubSotIssue === 138 &&
      cycle.gitlabCoordinationIssue === 72,
    `hops=${cycle.hops.length}; failed=${failedHops.map((h) => h.hop).join(',') || 'none'}`,
  );

  const health = await buildUniversalIndustryIntelligenceOsHealthReport({
    orgId: actor.orgId,
    tenantId: actor.tenantId,
    universeId: actor.universeId,
    actor,
    root,
    repoRoot,
  });
  check(
    'health_report_healthy',
    health.status === 'HEALTHY' && health.nextPhaseTitle === NEXT_PHASE_TITLE,
    `status=${health.status}`,
  );

  const honesty = universalIndustryIntelligenceOsHonesty(repoRoot);
  const preds = predecessorMap(repoRoot);
  check(
    'honesty_and_predecessor_probe',
    honesty.banner === HONESTY_BANNER &&
      honesty.l4AutonomyEnabled === false &&
      honesty.biometricDefaultEnabled === false &&
      preds.DT.tipProbe === 'PRESENT' &&
      preds.DS.tipProbe === 'PRESENT' &&
      preds.DR.tipProbe === 'PRESENT',
    `predecessor=${honesty.predecessorLayer}; DT=${preds.DT.tipProbe}; DS=${preds.DS.tipProbe}; DR=${preds.DR.tipProbe}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('FAIL 62L-DU stories:');
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK 62L-DU Universal Industry Intelligence OS stories passed');
