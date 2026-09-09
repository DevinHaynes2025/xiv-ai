import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rememberCortexTrace } from './memory-cortex';
import { upsertPartitionedKnowledge } from './world-knowledge-graph';
import {
  RESEARCH_FEEDBACK_LOOP,
  createResearchCivilization,
  runOfflineResearchCivilization,
} from './research-civilization';
import { learnAcrossIndustries } from './historical-industry-learning';
import { knowledgePackStats, listKnowledgePacks, registerKnowledgePack } from './knowledge-packs';
import {
  getSignalPathway,
  registerSignalAdapter,
  satelliteOrbitalGateway,
  signalInfrastructureHonesty,
  simulateSignalPathway,
} from './signal-infrastructure';
import { connectChipCompute, registerChipComputeNode, snapshotChipComputeGraph } from './chip-compute-graph';
import { runBoundedQuantumLab, runQuantumLabWithClassicalBridge } from './quantum-research-lab';
import { FUNDAMENTAL_PHYSICS_DOMAINS, PHYSICS_HONESTY, assertPhysicsNotInfrastructure } from './physics-domains';
import { runPlanetaryGalacticSimulator } from './planetary-galactic-sim';
import { conveneReflectionCouncil, loadReflectionCouncil } from './reflection-council';
import {
  completeResearchJob,
  enqueueResearchJob,
  listResearchJobs,
  markResearchJobRunning,
  recoverInterruptedResearchJobs,
} from './offline-resilience';
import { buildResearchHighwayHealthMap, RESEARCH_HIGHWAYS } from './research-highway-health';
import { runBoundedSelfImprovement } from './self-improvement-harness';

const root = await mkdtemp(join(tmpdir(), 'xiv-62ly-'));
const tenantId = '62ly-tenant';
const universeId = '62ly-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-Y2',
    RESEARCH_FEEDBACK_LOOP.join(' → ') === 'question → hypothesis → historical_evidence → specialist_agents → debate → simulation_experiment → result → critique → human_correction → learning_ledger → revised_hypothesis → stronger_pathway',
    'Research feedback loop is recorded in order.',
  );
  check(
    'US-Y14',
    RESEARCH_HIGHWAYS.join(' → ') === RESEARCH_FEEDBACK_LOOP.join(' → '),
    'Research highway map follows the same loop.',
  );

  const sourced = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'world',
    kind: 'fact',
    claimState: 'HISTORICAL_ACCOUNT',
    label: 'Steel process lesson',
    summary: 'Historical steel quality control reduced defect rates when evidence was checked twice.',
    evidenceRefs: ['synthetic:62ly-history'],
    sourceRefs: ['synthetic:62ly-history'],
    retentionClass: 'durable',
    root,
  });
  await upsertPartitionedKnowledge({
    id: 'hist-steel-1',
    tenantId,
    universeId,
    partition: 'world',
    type: 'claim',
    domain: 'history',
    label: 'Steel process lesson',
    summary: 'Historical steel quality control reduced defect rates when evidence was checked twice.',
    claimState: 'HISTORICAL_ACCOUNT',
    sourceRefs: ['synthetic:62ly-history'],
    classification: 'internal',
    root,
  });
  await upsertPartitionedKnowledge({
    id: 'biz-chip-1',
    tenantId,
    universeId,
    partition: 'business',
    type: 'claim',
    domain: 'technology',
    label: 'Chip yield claim',
    summary: 'Sandbox fab yield is 92 percent in a local synthetic pack.',
    claimState: 'VERIFIED_FACT',
    sourceRefs: ['synthetic:62ly-chip'],
    classification: 'confidential',
    root,
  });

  // US-Y1 controller
  const controller = await createResearchCivilization({ tenantId, universeId, root });
  check('US-Y1', controller.preferOffline === true && controller.claimsConsciousness === false && controller.l4AutonomyEnabled === false && controller.productionAuthorization === false, 'Offline Research Civilization Controller prefers offline execution and does not claim consciousness.');
  check('US-Y1', controller.loop.length === 12, 'Controller encodes the 12-step research loop.');

  // US-Y4 knowledge packs
  const pack = await registerKnowledgePack({
    tenantId,
    universeId,
    partition: 'world',
    domain: 'history',
    title: 'Historical manufacturing quality pack',
    scale: 'object_packages',
    claims: [{
      id: 'pack-claim-1',
      label: 'Double-check inspection',
      summary: 'A sourced historical account: inspection loops reduced defects.',
      claimState: 'HISTORICAL_ACCOUNT',
      sourceRefs: ['synthetic:62ly-pack'],
    }],
    root,
  });
  const packs = await listKnowledgePacks({ tenantId, universeId, root });
  const packStats = await knowledgePackStats(root);
  check('US-Y4', pack.manufacturingTrillionRows === false && pack.productionAuthorization === false && packs.some((item) => item.id === pack.id), 'Knowledge packs are provenance-rich object packages, not trillion-row manufacturing.');
  check('US-Y4', packStats.manufacturingTrillionRows === false && pack.scale === 'object_packages', 'Scale strategy is graph/object/index packages.');

  // US-Y3 cross-industry historical learning
  const historical = await learnAcrossIndustries({
    tenantId,
    universeId,
    question: 'steel quality control',
    root,
  });
  const waitingHistory = await learnAcrossIndustries({
    tenantId,
    universeId,
    question: 'today live commodity price',
    needsExternalFreshness: true,
    root,
  });
  check('US-Y3', historical.inventedFacts === false && historical.domainsConsulted.includes('history') && historical.domainsConsulted.includes('technology') && historical.state === 'AVAILABLE', 'Cross-industry historical learning consults multiple domains without inventing facts.');
  check('US-Y3', waitingHistory.state === 'WAITING_DATA' && waitingHistory.inventedFacts === false, 'Fresh external historical research becomes WAITING_DATA.');

  // US-Y5 / Y6 / Y7 signal infrastructure
  const darkMatter = getSignalPathway('dark_matter_research');
  const darkEnergy = getSignalPathway('dark_energy_research');
  const galactic = getSignalPathway('galactic_research');
  const radioSim = simulateSignalPathway({ kind: 'radio', from: 'lab-a', to: 'lab-b', distanceKm: 10 });
  const opticalSim = simulateSignalPathway({ kind: 'optical_laser', from: 'lab-a', to: 'lab-b', distanceKm: 1 });
  const acousticSim = simulateSignalPathway({ kind: 'acoustic', from: 'lab-a', to: 'lab-b', distanceKm: 0.2 });
  const satellite = satelliteOrbitalGateway();
  const honesty = signalInfrastructureHonesty();
  const stillUnavailable = registerSignalAdapter({
    kind: 'satellite_orbital',
    adapterConfigured: false,
    adapterAuthorized: false,
    evidenceRefs: [],
  });
  check('US-Y5', darkMatter?.mode === 'research_domain_only' && darkEnergy?.mode === 'research_domain_only' && darkMatter?.usableAsCompute === false && honesty.darkMatterAsInfrastructure === false, 'Dark matter / dark energy are research domains, not infrastructure.');
  check('US-Y5', galactic?.mode === 'research_domain_only' && honesty.galacticInfrastructureReal === false, 'Galactic infrastructure is research-domain only in the registry.');
  check('US-Y6', satellite.controlPhysicalSatellites === false && satellite.hardwareAdapter === 'UNAVAILABLE' && satellite.starlinkIsCompute === false && stillUnavailable.controlsPhysicalDevices === false, 'Satellite/orbital gateway does not control physical satellites; unconfigured adapters stay UNAVAILABLE.');
  check('US-Y7', radioSim.isHardwareControl === false && opticalSim.isReality === false && acousticSim.state === 'SIMULATION_ONLY', 'Radio / optical / acoustic paths are simulators, not live emitters.');

  // US-Y8 chip/compute graph
  registerChipComputeNode({
    id: 'chip-cpu-62ly',
    family: 'cpu_x86_64',
    state: 'AVAILABLE',
    configured: true,
    authorized: true,
    locality: 'device',
    capabilities: ['local_research'],
    maxConcurrentTasks: 2,
    productionAuthorized: false,
    tenantId,
    universeId,
    label: 'Local CPU research node',
    provenanceRefs: ['synthetic:62ly-chip'],
  });
  registerChipComputeNode({
    id: 'chip-qpu-62ly',
    family: 'quantum_hardware',
    state: 'AVAILABLE',
    configured: false,
    authorized: false,
    locality: 'research',
    capabilities: ['qpu'],
    maxConcurrentTasks: 1,
    productionAuthorized: false,
    tenantId,
    universeId,
    label: 'Unverified QPU slot',
    provenanceRefs: ['synthetic:62ly-qpu'],
  });
  connectChipCompute({
    tenantId,
    universeId,
    from: 'chip-cpu-62ly',
    to: 'chip-qpu-62ly',
    provenanceRefs: ['synthetic:62ly-chip'],
  });
  const chipGraph = snapshotChipComputeGraph({
    tenantId,
    universeId,
    requiredCapability: 'local_research',
    allowedFamilies: ['cpu_x86_64'],
  });
  check('US-Y8', chipGraph.selected?.id === 'chip-cpu-62ly' && chipGraph.honesty.darkMatterChipFamily === false && chipGraph.honesty.productionAuthorization === false, 'Global chip/compute graph reuses compute fabric; dark matter is not a chip family.');
  check('US-Y8', chipGraph.nodes.some((node) => node.id === 'chip-qpu-62ly' && node.state === 'UNAVAILABLE'), 'Unconfigured quantum hardware remains UNAVAILABLE.');

  // US-Y9 quantum research lab
  const lab = runBoundedQuantumLab({
    id: 'q-lab-y',
    objective: 'Bounded QAOA against a classical baseline',
    algorithm: 'qaoa',
    backend: 'classical_simulator',
    qubitCount: 6,
  });
  const qpuLab = runBoundedQuantumLab({
    id: 'q-lab-qpu',
    objective: 'Unverified QPU',
    algorithm: 'vqe',
    backend: 'quantum_qpu',
    qubitCount: 4,
    backendVerified: false,
  });
  const bridged = await runQuantumLabWithClassicalBridge({
    tenantId,
    universeId,
    signals: [{ id: 's1', weight: 1, confidence: 0.7, direction: 1, evidenceRefs: ['node:biz-chip-1'] }],
    quantum: {
      id: 'q-bridge-y',
      objective: 'Classical first, then bounded quantum research',
      algorithm: 'qaoa',
      backend: 'classical_simulator',
      qubitCount: 4,
    },
    root,
  });
  check('US-Y9', lab.lab === 'bounded_research' && lab.claimsQuantumAdvantage === false && lab.productionMagic === false && lab.classicalBaselineRequired === true, 'Quantum research lab is bounded research, not production magic.');
  check('US-Y9', qpuLab.experiment.state === 'UNAVAILABLE' && bridged.bridge.claimsQuantumAdvantage === false, 'Unverified QPU stays UNAVAILABLE; classical bridge claims no quantum advantage.');

  // US-Y10 fundamental physics domains
  const dm = assertPhysicsNotInfrastructure('dark_matter_research');
  const de = assertPhysicsNotInfrastructure('dark_energy_research');
  check('US-Y10', FUNDAMENTAL_PHYSICS_DOMAINS.some((domain) => domain.id === 'fundamental_physics') && FUNDAMENTAL_PHYSICS_DOMAINS.every((domain) => domain.usableAsCompute === false), 'Fundamental-physics knowledge domains are registered as research, not infrastructure.');
  check('US-Y10', dm.usableAsCompute === false && de.usableAsNetwork === false && PHYSICS_HONESTY.galacticInfrastructureReal === false, 'Dark matter / dark energy cannot be used as compute or network.');

  // US-Y11 planetary/galactic simulator
  const planetary = await runPlanetaryGalacticSimulator({
    tenantId,
    universeId,
    scale: 'planetary',
    hypothesis: 'Local climate analog stays internally consistent.',
    root,
  });
  const galacticSim = await runPlanetaryGalacticSimulator({
    tenantId,
    universeId,
    scale: 'galactic',
    hypothesis: 'Galactic routing metaphor for research only.',
    consequence: 'HIGH',
    root,
  });
  check('US-Y11', planetary.isReality === false && planetary.controlsPhysicalSystems === false && planetary.galacticInfrastructure === 'simulation_research_only', 'Planetary simulator is not reality and does not control physical systems.');
  check('US-Y11', galacticSim.simulation.status === 'HUMAN_APPROVAL_REQUIRED' && galacticSim.darkMatterAsInfrastructure === false, 'Galactic simulator is research-only; consequential runs stay human-authorized.');

  // US-Y12 reflection council
  const council = await conveneReflectionCouncil({
    tenantId,
    universeId,
    question: 'Should a local yield hypothesis be promoted?',
    root,
  });
  const foreign = await loadReflectionCouncil(council.id, 'other-tenant', universeId, root);
  check('US-Y12', council.consensusForced === false && council.claimsConsciousness === false && council.independentPositions.length === 4 && council.productionAuthorized === false, 'Reflection council writes independent positions, does not force consensus, and does not claim consciousness.');
  check('US-Y12', foreign === null && (council.runtimeState === 'UNAVAILABLE' || council.runtimeState === 'COMPLETED'), `Council is tenant-scoped and records runtimeState=${council.runtimeState}.`);

  // US-Y13 offline resilience
  const localJob = await enqueueResearchJob({
    tenantId,
    universeId,
    objective: 'Local evidence review',
    root,
  });
  await markResearchJobRunning(localJob.id, root);
  const recovered = await recoverInterruptedResearchJobs(root);
  const waitingJob = await enqueueResearchJob({
    tenantId,
    universeId,
    objective: 'Need live weather',
    requirement: { needsExternalFreshness: true },
    root,
  });
  const deniedJob = await enqueueResearchJob({
    tenantId,
    universeId,
    objective: 'Write production DB',
    requirement: { needsProductionWrite: true },
    root,
  });
  const completed = await completeResearchJob(localJob.id, tenantId, universeId, root);
  const jobs = await listResearchJobs(root);
  check('US-Y13', recovered >= 1 && completed.state === 'completed' && localJob.preferOffline === true, 'Interrupted research jobs recover to queued; offline execution is preferred.');
  check('US-Y13', waitingJob.state === 'waiting_data' && deniedJob.state === 'denied' && jobs.every((job) => job.productionAuthorization === false), 'Resilience layer uses WAITING_DATA / DENIED and never authorizes production.');

  // US-Y15 bounded self-improvement
  const improve = await runBoundedSelfImprovement({
    tenantId,
    universeId,
    objective: 'Strengthen retrieval of the steel inspection lesson',
    observed: 'Local ranking may prefer sourced historical inspection lessons.',
    successful: true,
    memoryIds: [sourced.id],
    evidenceRefs: ['synthetic:62ly-history'],
    root,
  });
  const blockedImprove = await runBoundedSelfImprovement({
    tenantId,
    universeId,
    objective: 'Expand permissions and deploy production',
    observed: 'Should not run.',
    successful: false,
    permissionChange: true,
    production: true,
    consequence: 'CRITICAL',
    root,
  });
  check('US-Y15', improve.status === 'COMPLETED' && improve.mayChangeRetrievalRanking === true && improve.canChangePermissions === false && improve.canDeployProduction === false && improve.canWeakenGuardian === false, 'Self-improvement may change retrieval ranking only; it cannot expand permissions or deploy.');
  check('US-Y15', blockedImprove.status === 'HUMAN_APPROVAL_REQUIRED' && blockedImprove.claimsConsciousness === false && blockedImprove.canExpandAutonomy === false, 'Consequential self-improvement remains human-authorized and does not claim consciousness.');

  // US-Y2 / Y1 end-to-end civilization
  const run = await runOfflineResearchCivilization({
    tenantId,
    universeId,
    question: 'How should local chip-yield research learn from historical steel inspection?',
    hypothesis: 'A second evidence check will reduce local yield contradictions.',
    simulatorScale: 'planetary',
    includeQuantumLab: true,
    humanCorrection: 'Keep the second check local-only; do not contact the fab network.',
    memoryIds: [sourced.id],
    root,
  });
  check('US-Y1', run.controller.claimsConsciousness === false && run.architectureGoal.includes('more capable') && run.productionAuthorization === false, 'Civilization run is capability-focused, not a size race, and is not production.');
  check('US-Y2', run.loop.steps.join(' → ') === RESEARCH_FEEDBACK_LOOP.join(' → ') && run.loop.revisedHypothesis.includes('human correction') && run.loop.strongerPathway.memoryId.length > 0, 'Feedback loop records human correction and a stronger pathway.');
  check('US-Y2', run.loop.honesty.inventedFacts === false && run.loop.simulation.isReality === false && run.loop.quantum?.claimsQuantumAdvantage === false, 'Loop preserves honesty: no invented facts, simulation is not reality, no quantum advantage claim.');

  // US-Y14 health map
  const health = await buildResearchHighwayHealthMap({ tenantId, universeId, root });
  check('US-Y14', health.honesty.productionAuthorization === false && health.honesty.inventedPass === false && health.honesty.l4AutonomyEnabled === false, 'Research highway health preserves production and L4 locks.');
  check('US-Y14', health.providers.every((slot) => slot.configured || slot.state === 'UNAVAILABLE') && health.satellite.controlPhysicalSatellites === false, 'Health map keeps unconfigured providers UNAVAILABLE and satellite control false.');
  check('US-Y14', health.honesty.darkMatterAsInfrastructure === false && health.resilienceJobs.preferOffline === true, 'Health map records dark-matter honesty and offline preference.');

  if (failures.length) {
    console.error('62L-Y tests FAIL');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('62L-Y safety tests PASS');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
