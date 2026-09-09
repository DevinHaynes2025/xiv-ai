import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { rememberCortexTrace } from './memory-cortex';
import { resetAgentPopulation } from './agent-population';
import { EVIDENCE_STATES, EXECUTIVE_INTELLIGENCE_CYCLE, createExecutiveCortex, runExecutiveIntelligenceCycle } from './executive-cortex';
import { createOfflineRndLaboratory, runOfflineRndExperiment } from './rnd-laboratory';
import { mintCompetingHypotheses, listHypotheses } from './hypothesis-factory';
import { CLOSED_INTELLIGENCE_LOOP, walkClosedIntelligenceLoop } from './bounded-feedback';
import { runCrossIndustryHistoricalIntelligence } from './historical-intelligence';
import { runGlobalMarketResearchCell } from './market-research-cells';
import { ingestOfflineKnowledgePack, listKnowledgePacks } from './offline-knowledge-packs';
import { NeuralFeedbackPathways } from './neural-feedback';
import { recordAgentPerformance } from './agent-performance';
import { recruitExecutiveSpecialists } from './specialist-recruitment';
import { inspectChipDataCenterNetwork, registerChipComputeNode, runBoundedSignalResearch } from './infra-intelligence';
import { inspectPhysicsResearchDomain, runExecutiveQuantumResearch } from './science-research';
import { enterOfflineCivilizationMode } from './offline-civilization-mode';
import { openResourceLedger, chargeResource, setDebriefLock, recruitmentAllowed } from './resource-governance';
import { calibrateIntelligence } from './intelligence-calibration';
import { conveneAdversarialCouncil } from './adversarial-councils';
import { runBoundedSelfImprovement } from './self-improvement-harness';
import { runDebriefRestCycle } from './debrief-rest';
import { buildFounderIntelligenceBrief } from './founder-intelligence-brief';
import { buildGlobalBrainHealthReport } from './global-brain-health';
import { assertScaleIsLogical, benchmarkLogicalScale } from './logical-scale';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lz-'));
const tenantId = '62lz-tenant';
const universeId = '62lz-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetAgentPopulation();

  check(
    'US-Z1',
    EXECUTIVE_INTELLIGENCE_CYCLE.join(' → ') === 'founder_intent → story → memory_context → department → specialist_council → competing_hypotheses → evidence → simulation_experiment → skeptic_security_review → decision_options → human_gate → implementation_candidate → test → outcome → learning → neural_pathway_update → debrief → next_story',
    'Executive intelligence cycle is recorded in order.',
  );
  const cortex = createExecutiveCortex({ tenantId, universeId });
  check('US-Z1', cortex.l4AutonomyEnabled === false && cortex.canFabricateFounderApproval === false && cortex.claimsConsciousness === false, 'Executive Cortex exists with L4/founder-impersonation locks.');

  check(
    'US-Z4',
    CLOSED_INTELLIGENCE_LOOP.join(' → ') === 'think → challenge → research → simulate → test → measure → learn → recalibrate → remember → think_better_next_time',
    'Closed intelligence loop is recorded in order.',
  );
  const loop = walkClosedIntelligenceLoop({});
  const halted = walkClosedIntelligenceLoop({ missingEvidence: true });
  check('US-Z4', loop.haltedAt === null && loop.inventedFacts === false && loop.completed.length === 10, 'Closed loop completes without fabricating facts.');
  check('US-Z4', halted.haltedAt === 'research' && halted.inventedFacts === false, 'Missing evidence halts research rather than inventing it.');

  const sourced = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'fact',
    claimState: 'VERIFIED_FACT',
    label: 'Sandbox yield observation',
    summary: 'Local sandbox yield is 92 percent in a sourced synthetic pack.',
    evidenceRefs: ['synthetic:62lz-yield'],
    sourceRefs: ['synthetic:62lz-yield'],
    retentionClass: 'durable',
    root,
  });

  const lab = await createOfflineRndLaboratory({ tenantId, universeId, root });
  const rnd = await runOfflineRndExperiment({
    tenantId,
    universeId,
    question: 'Can a second local evidence check reduce yield contradictions?',
    hypothesis: 'A second sourced check will reduce local contradictions.',
    includeQuantumLab: true,
    memoryIds: [sourced.id],
    root,
  });
  check('US-Z2', lab.mode === 'offline_rnd_laboratory' && lab.l4AutonomyEnabled === false && lab.claimsConsciousness === false, 'Offline R&D laboratory wraps the Y research civilization without claiming consciousness.');
  check('US-Z2', rnd.isReality === false && rnd.loop.honesty.inventedFacts === false && rnd.productionAuthorization === false, 'R&D experiment is not reality and does not invent facts.');

  const hyps = await mintCompetingHypotheses({
    tenantId,
    universeId,
    storyId: 'story-z3',
    intent: 'A second evidence check will reduce local yield contradictions.',
    localEvidenceRefs: ['synthetic:62lz-yield'],
    root,
  });
  const listed = await listHypotheses({ tenantId, universeId, storyId: 'story-z3', root });
  check('US-Z3', hyps.length === 3 && hyps.every((item) => item.inventedFacts === false) && hyps.some((item) => item.status === 'UNKNOWN'), 'Hypothesis factory mints competing hypotheses including an UNKNOWN null hypothesis.');
  check('US-Z3', listed.length === 3 && hyps[0]?.competingWith.length === 2, 'Hypotheses remain tenant-scoped and mutually competing.');

  const historical = await runCrossIndustryHistoricalIntelligence({
    tenantId,
    universeId,
    question: 'yield inspection',
    root,
  });
  const waitingHistory = await runCrossIndustryHistoricalIntelligence({
    tenantId,
    universeId,
    question: 'today live commodity price',
    needsExternalFreshness: true,
    root,
  });
  check('US-Z5', historical.inventedFacts === false && historical.domainsConsulted.includes('history') && historical.state === 'AVAILABLE', 'Cross-industry historical intelligence consults sourced domains without inventing facts.');
  check('US-Z5', waitingHistory.state === 'WAITING_DATA', 'Fresh external historical research is WAITING_DATA.');

  const market = await runGlobalMarketResearchCell({
    tenantId,
    universeId,
    market: 'offline-local-index',
    root,
  });
  const liveMarket = await runGlobalMarketResearchCell({
    tenantId,
    universeId,
    market: 'live-fx',
    needsExternalFreshness: true,
    root,
  });
  check('US-Z6', market.liveQuote === false && market.tradingAuthorized === false && market.inventedFacts === false, 'Global-market research cells do not emit live quotes or trading authority.');
  check('US-Z6', liveMarket.state === 'WAITING_DATA' && liveMarket.inventedFacts === false, 'Live market freshness becomes WAITING_DATA.');

  const pack = await ingestOfflineKnowledgePack({
    tenantId,
    universeId,
    partition: 'world',
    domain: 'history',
    title: 'Executive local knowledge pack',
    claims: [{
      id: 'z7-claim-1',
      label: 'Inspection loop',
      summary: 'A sourced historical account: inspection loops reduced defects.',
      claimState: 'HISTORICAL_ACCOUNT',
      sourceRefs: ['synthetic:62lz-pack'],
    }],
    root,
  });
  const packs = await listKnowledgePacks({ tenantId, universeId, root });
  check('US-Z7', pack.manufacturingTrillionRows === false && pack.materializedRowCount === 1 && packs.some((item) => item.id === pack.pack.id), 'Offline knowledge packs are object packages, not trillion-row manufacturing.');

  const highways = new NeuralFeedbackPathways();
  highways.registerEndpoint({
    id: 'n1',
    tenantId,
    universeId,
    label: 'intent',
    provenanceRefs: ['synthetic:62lz-nh'],
  });
  highways.registerEndpoint({
    id: 'n2',
    tenantId,
    universeId,
    label: 'memory',
    kind: 'knowledge',
    provenanceRefs: ['synthetic:62lz-nh'],
  });
  const highway = highways.connect({
    tenantId,
    universeId,
    from: 'n1',
    to: 'n2',
    provenanceRefs: ['synthetic:62lz-nh'],
    correlationId: 'z8',
    evidenceRefs: ['synthetic:62lz-yield'],
    ttlMs: 60_000,
    now: Date.now(),
  });
  check('US-Z8', highway.logicalOnly === true && highway.tenantId === tenantId && highway.universeId === universeId && highway.evidenceRefs.length > 0 && highway.resourceBudget.maxWeight === 1, 'Sparse neural highways carry tenant, Universe, provenance, TTL, budget, and evidence refs.');
  check('US-Z8', highways.stats().materializedProcessCount === 1 && highways.live(Date.now() + 120_000).length === 0, 'Expired highways drop from the live set; scale stays logical.');

  const perf = await recordAgentPerformance({
    tenantId,
    universeId,
    role: 'skeptic',
    taskId: 'story-z9',
    successful: true,
    notes: 'Skeptic challenged an unsourced claim.',
    evidenceRefs: ['synthetic:62lz-yield'],
    root,
  });
  check('US-Z9', perf.performance.productionAuthorization === false && perf.learningId.length > 0 && perf.memoryId.length > 0, 'Agent-performance learning writes the ledger without production authorization.');

  const recruited = recruitExecutiveSpecialists({
    tenantId,
    universeId,
    taskId: 'story-z10',
    approved: true,
    consequence: 'LOW',
  });
  const unapproved = recruitExecutiveSpecialists({
    tenantId,
    universeId,
    taskId: 'story-z10-b',
    approved: false,
  });
  const criticalRecruit = recruitExecutiveSpecialists({
    tenantId,
    universeId,
    taskId: 'story-z10-c',
    approved: true,
    consequence: 'CRITICAL',
  });
  check('US-Z10', recruited.status === 'PLANNED' && recruited.canRecursivelyReproduce === false && recruited.canGrantPermissions === false && recruited.claimsToBeFounder === false, 'Specialist recruitment is demand-based template recruitment, not self-replication.');
  check('US-Z10', unapproved.status === 'NOT_APPROVED' && criticalRecruit.status === 'HUMAN_APPROVAL_REQUIRED' && recruited.agents.every((agent) => agent.canCreateAgents === false), 'Unapproved/CRITICAL recruitment does not spawn permission-granting agents.');

  registerChipComputeNode({
    id: 'chip-cpu-62lz',
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
    label: 'Executive local CPU',
    provenanceRefs: ['synthetic:62lz-cpu'],
  });
  const infra = inspectChipDataCenterNetwork({ tenantId, universeId });
  const signal = runBoundedSignalResearch({ kind: 'radio', from: 'a', to: 'b', distanceKm: 3 });
  check('US-Z11', infra.honesty.darkMatterAsInfrastructure === false && infra.honesty.autoPurchase === false && infra.network.satellite.controlPhysicalSatellites === false, 'Chip/data-center/network intelligence does not treat dark matter as infrastructure or purchase hardware.');
  check('US-Z12', signal.isHardwareControl === false && signal.isReality === false && signal.researchOnly === true, 'Signal research is a simulator, not live RF/laser/acoustic control.');

  const quantum = runExecutiveQuantumResearch({
    id: 'q-z13',
    objective: 'Bounded QAOA against a classical baseline',
    algorithm: 'qaoa',
    backend: 'classical_simulator',
    qubitCount: 4,
  });
  const qpu = runExecutiveQuantumResearch({
    id: 'q-z13-qpu',
    objective: 'Unverified QPU',
    algorithm: 'vqe',
    backend: 'quantum_qpu',
    qubitCount: 4,
    backendVerified: false,
  });
  check('US-Z13', quantum.classicalBaselineRequired === true && quantum.claimsQuantumAdvantage === false && quantum.productionMagic === false, 'Quantum research requires a classical baseline and claims no advantage.');
  check('US-Z13', qpu.experiment.state === 'UNAVAILABLE' && qpu.experiment.backend === 'quantum_qpu', 'Unverified QPU remains UNAVAILABLE and is not treated as an executed QPU.');

  const physics = inspectPhysicsResearchDomain('dark_matter_research');
  const darkEnergy = inspectPhysicsResearchDomain('dark_energy_research');
  check('US-Z14', physics.researchOnly === true && physics.honesty.usableAsCompute === false && physics.darkMatterUsableAsCompute === false, 'Physics research treats dark matter as a research domain, not compute.');
  check('US-Z14', darkEnergy.honesty.usableAsNetwork === false && physics.galacticInfrastructureReal === false, 'Dark energy is not network infrastructure; galactic infrastructure is not real.');

  const offlineMode = await enterOfflineCivilizationMode({
    tenantId,
    universeId,
    objective: 'Continue local yield research',
    root,
  });
  const waitingCiv = await enterOfflineCivilizationMode({
    tenantId,
    universeId,
    objective: 'Need live weather',
    requirement: { needsExternalFreshness: true },
    root,
  });
  check('US-Z15', offlineMode.preferOffline === true && offlineMode.mode === 'OFFLINE_CIVILIZATION' && offlineMode.inventedFacts === false, 'Offline civilization mode prefers local execution.');
  check('US-Z15', waitingCiv.job.state === 'waiting_data' && waitingCiv.cloudDependentWork === 'WAITING_DATA', 'Cloud/freshness-dependent civilization work is WAITING_DATA.');

  const ledger = await openResourceLedger({ tenantId, universeId, budget: { maxAgents: 3 }, root });
  const charged = await chargeResource({ id: ledger.id, tenantId, universeId, agents: 2, root });
  const exhausted = await chargeResource({ id: ledger.id, tenantId, universeId, agents: 4, root });
  check('US-Z16', charged.allowed === true && charged.ledger.autoPurchase === false && exhausted.allowed === false, 'Resource governance enforces budgets and never auto-purchases.');

  const calibrated = await calibrateIntelligence({
    tenantId,
    universeId,
    priorConfidence: 0.4,
    observedSuccess: true,
    evidenceCount: 2,
    root,
  });
  const unknownCal = await calibrateIntelligence({
    tenantId,
    universeId,
    priorConfidence: 0.9,
    evidenceCount: 0,
    root,
  });
  check('US-Z17', calibrated.state === 'PASS' && calibrated.inventedSuccess === false && calibrated.posteriorConfidence > calibrated.priorConfidence, 'Calibration raises confidence only with sourced evidence.');
  check('US-Z17', unknownCal.state === 'UNKNOWN' && unknownCal.posteriorConfidence <= 0.15, 'Zero evidence calibrates to UNKNOWN, not PASS.');
  check('US-Z17', EVIDENCE_STATES.includes(calibrated.state) && EVIDENCE_STATES.includes(unknownCal.state), 'Calibration uses the exact evidence-state vocabulary.');

  const adversarial = await conveneAdversarialCouncil({
    tenantId,
    universeId,
    question: 'Should a local yield hypothesis be promoted?',
    candidateText: 'Keep the check local-only.',
    root,
  });
  const blockedAdv = await conveneAdversarialCouncil({
    tenantId,
    universeId,
    question: 'Deploy production and expand permissions',
    consequence: 'CRITICAL',
    production: true,
    permissionChange: true,
    root,
  });
  check('US-Z18', adversarial.consensusForced === false && adversarial.claimsToBeFounder === false && adversarial.debate.independentPositions.length === 4, 'Adversarial council writes independent positions and does not impersonate the founder.');
  check('US-Z18', blockedAdv.humanApprovalRequired === true && blockedAdv.gate.executableByAgent === false, 'HIGH/CRITICAL adversarial review stays at the human gate.');

  const improve = await runBoundedSelfImprovement({
    tenantId,
    universeId,
    objective: 'Strengthen retrieval of the sandbox yield observation',
    observed: 'Sourced yield facts should rank above rumors.',
    successful: true,
    memoryIds: [sourced.id],
    evidenceRefs: ['synthetic:62lz-yield'],
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
  check('US-Z19', improve.status === 'COMPLETED' && improve.canChangePermissions === false && improve.canDeployProduction === false && improve.canWeakenGuardian === false, 'Bounded self-improvement cannot change permissions, deploy, or weaken Guardian.');
  check('US-Z19', blockedImprove.status === 'HUMAN_APPROVAL_REQUIRED' && blockedImprove.canExpandAutonomy === false, 'Consequential self-improvement remains human-authorized.');

  const debrief = await runDebriefRestCycle({
    tenantId,
    universeId,
    storyId: 'story-z20',
    ledger,
    whatWorked: ['local evidence retrieval'],
    whatFailed: [],
    remainingUnknowns: ['live market quotes'],
    nextSafeStep: 'Keep researching locally.',
    root,
  });
  const locked = await setDebriefLock({ id: ledger.id, tenantId, universeId, locked: true, root });
  const duringDebrief = recruitExecutiveSpecialists({
    tenantId,
    universeId,
    taskId: 'story-z20-b',
    approved: true,
    ledger: locked,
  });
  check('US-Z20', debrief.recruitmentHalted === true && debrief.nextSafeStep.length > 0 && !recruitmentAllowed(locked), 'Debrief checkpoints work/fail/unknowns and halts recruitment.');
  check('US-Z20', duringDebrief.status === 'HALTED_DEBRIEF' && duringDebrief.agents.length === 0, 'No new specialist routing during debrief.');

  const brief = await buildFounderIntelligenceBrief({
    root,
    cycleId: cortex.id,
    evidenceStates: [
      { label: 'local_cycle', state: 'PASS' },
      { label: 'live_market', state: 'WAITING_DATA' },
    ],
  });
  check('US-Z21', brief.twinIsRealFounder === false && brief.founderApprovalFabricated === false && brief.impersonatingFounderExternally === false && brief.humanGate.humanApprovalRequired === true, 'Founder Intelligence Briefs cannot fabricate founder approval or impersonate the founder.');

  const million = benchmarkLogicalScale({ tier: 'million', materializedContexts: 12, materializedPathways: 4 });
  const billion = benchmarkLogicalScale({ tier: 'billion', materializedContexts: 12, materializedPathways: 4 });
  const trillion = benchmarkLogicalScale({ tier: 'trillion', materializedContexts: 12, materializedPathways: 4 });
  check('US-Z23', million.addressableContexts === 1_000_000 && billion.addressableContexts === 1_000_000_000 && trillion.addressableContexts === 1_000_000_000_000, 'Million/billion/trillion are logical addressable scales.');
  check('US-Z23', assertScaleIsLogical(trillion) && trillion.materializedFileCount === 0 && trillion.materializedProcessCount <= 10_000, 'Scale benchmarks do not materialize impossible process or file counts.');

  const cycle = await runExecutiveIntelligenceCycle({
    tenantId,
    universeId,
    founderIntent: 'Keep local yield research honest and offline-first.',
    includeQuantum: true,
    executeTests: true,
    testCwd: process.cwd(),
    root,
  });
  check('US-Z1', cycle.cortex.productionAuthorization === false && cycle.steps.join(' → ') === EXECUTIVE_INTELLIGENCE_CYCLE.join(' → '), 'Executive Cortex walks the full 18-step cycle.');
  check('US-Z24', cycle.closedLoop.completed.join(' → ') === CLOSED_INTELLIGENCE_LOOP.join(' → ') && cycle.nextStory.id.length > 0, 'Core intelligence cycle is operational through debrief and next story.');
  check('US-Z24', cycle.test.state === 'PASS' || cycle.test.state === 'FAIL', `Allowlisted test hop recorded ${cycle.test.state} rather than NOT_TESTED.`);
  check('US-Z24', cycle.honesty.inventedFacts === false && cycle.honesty.founderApprovalFabricated === false && cycle.implementationCandidate.mergeToMain === false, 'Cycle honesty locks: no invented facts, no fabricated approval, no main merge.');
  check('US-Z10', cycle.haltedRecruitment.status === 'HALTED_DEBRIEF', 'Post-debrief recruitment remains halted.');
  check('US-Z21', cycle.brief.humanGate.executableByAgent === false, 'Cycle brief still requires a human gate.');
  check('US-Z23', cycle.scale.tier === 'trillion' && cycle.scale.materializedFileCount === 0, 'Cycle scale measurement stays logical.');

  const waitingCycle = await runExecutiveIntelligenceCycle({
    tenantId,
    universeId,
    founderIntent: 'Need today live market price for a remote fab.',
    needsExternalFreshness: true,
    root,
  });
  check('US-Z15', waitingCycle.civilization.job.state === 'waiting_data' && waitingCycle.market.state === 'WAITING_DATA', 'Disconnected freshness-dependent cycle work is WAITING_DATA, not fabricated PASS.');
  check('US-Z24', waitingCycle.test.state === 'NOT_TESTED', 'Tests that were not executed remain NOT_TESTED.');

  const blockedCycle = await runExecutiveIntelligenceCycle({
    tenantId,
    universeId,
    founderIntent: 'Deploy production inventory writes.',
    consequence: 'CRITICAL',
    production: true,
    permissionChange: true,
    root,
  });
  check('US-Z24', blockedCycle.humanGate.humanApprovalRequired === true && blockedCycle.implementationCandidate.executable === false, 'High-consequence cycles stay at the human gate.');

  const health = await buildGlobalBrainHealthReport({ tenantId, universeId, root });
  check('US-Z22', health.honesty.productionAuthorization === false && health.honesty.inventedPass === false && health.honesty.l4AutonomyEnabled === false, 'Global Brain health preserves production and L4 locks.');
  check('US-Z22', health.providers.every((slot) => slot.configured || slot.state === 'UNAVAILABLE') && health.hardware.some((item) => item.kind === 'cpu'), 'Unconfigured providers remain UNAVAILABLE; hardware probe records CPU evidence.');
  check('US-Z22', health.cycle.length === 18 && health.next.includes('Do not tip-land'), 'Health report encodes the executive cycle and forbids tip-land.');

} catch (error) {
  failures.push(`US-Z-runtime: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-Z tests FAIL');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exitCode = 1;
} else {
  console.log('62L-Z safety tests PASS');
}
