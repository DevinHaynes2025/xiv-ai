import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { rememberCortexTrace } from './memory-cortex';
import { resetAgentPopulation } from './agent-population';
import { resetAgentBus } from './agent-bus';
import {
  AUTONOMOUS_RD_CYCLE,
  EVIDENCE_STATES,
  RESEARCH_HONESTY,
  createResearchDirector,
  detectKnowledgeGap,
  mintResearchHypotheses,
  runAutonomousResearchCycle,
} from './research-director';
import { proposeExperimentCandidates, runOfflineExperiment, rankExperimentCandidates } from './offline-experiment-factory';
import { fingerprintExperiment, lookupDeadEnd, recordNegativeResult } from './negative-result-memory';
import { replicateIndependently } from './independent-replication';
import { challengeCausation, evaluateAb, measureDiscoveryQuality } from './discovery-intelligence';
import {
  runBoundedQuantumResearchCell,
  runHistoricalResearch,
  runInfrastructureRd,
  runMultiIndustryResearch,
  runOfflineNightResearch,
  runQuantResearch,
  runRegionalResearch,
} from './research-domain-cells';
import { denyConsequentialAction, gateResearchAction, predecessorMap, refuseSealedReplication, unconfiguredProviderStates } from './research-authority';
import { buildResearchDirectorHealth } from './research-director-health';

const execFileAsync = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), 'xiv-62lai-'));
const gitRoot = join(root, 'git-sandbox');
const tenantId = '62lai-tenant';
const universeId = '62lai-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  resetAgentPopulation();
  resetAgentBus();
  await mkdir(gitRoot, { recursive: true });
  await execFileAsync('git', ['init'], { cwd: gitRoot });

  check(
    'US-AI1',
    AUTONOMOUS_RD_CYCLE.join(' → ') === 'knowledge_gap → research_director → prior_evidence → competing_hypotheses → experiment_candidates → risk_value_ranking → offline_experiment → measurement → independent_replication → skeptic_review → evidence_promotion → world_model → learning → next_experiment',
    'Autonomous R&D cycle is recorded in order.',
  );
  const director = createResearchDirector({ tenantId, universeId });
  check(
    'US-AI1',
    director.l4AutonomyEnabled === false
      && director.canFabricateFounderApproval === false
      && director.claimsConsciousness === false
      && director.tradingAuthorized === false
      && director.boundedToOfflineExperiments === true,
    'Research Director exists with L4/founder/trading locks.',
  );
  check(
    'US-AI30',
    RESEARCH_HONESTY.l4AutonomyEnabled === false
      && RESEARCH_HONESTY.founderImpersonation === false
      && RESEARCH_HONESTY.inventedPass === false
      && RESEARCH_HONESTY.correlationEqualsCausation === false
      && RESEARCH_HONESTY.simulationIsVerifiedFact === false
      && RESEARCH_HONESTY.ceoSealedReplicatesByDefault === false,
    'Honesty locks are false.',
  );
  check('US-AI30', EVIDENCE_STATES.join('/') === 'PASS/FAIL/UNAVAILABLE/WAITING_DATA/UNKNOWN/NOT_TESTED', 'Exact evidence states are used.');

  const emptyGap = await detectKnowledgeGap({
    tenantId,
    universeId,
    question: 'Does a local inspection loop reduce unsourced yield contradictions?',
    root,
  });
  check('US-AI2', emptyGap.state === 'UNKNOWN' && emptyGap.inventedFacts === false && emptyGap.unknownCount === 1, 'Empty local store yields UNKNOWN knowledge gap, not an invented fact.');
  const waitingGap = await detectKnowledgeGap({
    tenantId,
    universeId,
    question: 'What is the live commodity price today?',
    needsExternalFreshness: true,
    root,
  });
  check('US-AI2', waitingGap.state === 'WAITING_DATA', 'External freshness knowledge gaps are WAITING_DATA.');

  const sourced = await rememberCortexTrace({
    tenantId,
    universeId,
    partition: 'business',
    kind: 'fact',
    claimState: 'VERIFIED_FACT',
    label: 'Sandbox git status observation',
    summary: 'A sourced synthetic pack: allowlisted git_status is an eligible local software experiment.',
    evidenceRefs: ['synthetic:62lai-git'],
    sourceRefs: ['synthetic:62lai-git'],
    retentionClass: 'durable',
    root,
  });
  check('US-AI3', sourced.id.length > 0, 'Prior evidence can be stored in Memory Cortex without inventing world facts.');

  const hyps = mintResearchHypotheses({
    tenantId,
    universeId,
    gap: { ...emptyGap, evidenceRefs: ['synthetic:62lai-git'] },
  });
  check('US-AI4', hyps.length === 3 && hyps.some((item) => item.role === 'null') && hyps.every((item) => item.inventedFacts === false) && hyps[0]?.competingWith.length === 2, 'Competing hypotheses include a null hypothesis and do not invent facts.');

  const candidates = await proposeExperimentCandidates({
    tenantId,
    universeId,
    gapId: emptyGap.id,
    hypotheses: hyps,
    softwareCwd: gitRoot,
    root,
  });
  const ranked = rankExperimentCandidates(candidates);
  check('US-AI5', ranked.length === 9 && ranked.some((item) => item.kind === 'software') && ranked.some((item) => item.kind === 'data') && ranked.some((item) => item.kind === 'simulation'), 'Experiment candidates cover software, data, and simulation.');
  check('US-AI6', ranked[0]?.eligible === true && ranked.every((item, index) => index === 0 || (ranked[0]!.valueScore - ranked[0]!.riskScore) >= (item.valueScore - item.riskScore) || !ranked[0]!.eligible), 'Risk/value ranking prefers eligible higher-value local experiments.');

  const cycle = await runAutonomousResearchCycle({
    tenantId,
    universeId,
    question: 'Can allowlisted git_status reproduce a local software inspection?',
    softwareCwd: gitRoot,
    root,
  });
  check('US-AI7', cycle.primary.kind === 'software' && cycle.primary.productionAuthorization === false && cycle.primary.isReality === false, 'Offline experiment factory ran a local software experiment.');
  check('US-AI8', cycle.primary.manifest.independentReplicaRequired === true && cycle.primary.manifest.digest.length === 64 && cycle.primary.manifest.isReality === false, 'Reproducibility manifest is hashed and requires independent replication.');
  check('US-AI9', cycle.primary.evidenceState === 'PASS' && cycle.primary.measurement.metric === 'allowlisted_exit_code_zero', 'Software experiment executed allowlisted git_status with exit 0.');
  check('US-AI10', cycle.primary.measurement.correlationClaimedAsCausation === false && cycle.primary.measurement.isReality === false, 'Measurement does not claim causation or reality.');
  check('US-AI11', cycle.replication.replicaLane === 'independent' && cycle.replication.sharedMutableState === false && cycle.replication.digestMatch === true && cycle.replication.measurementAgreed === true && cycle.replication.evidenceState === 'PASS', 'Independent replication re-ran the manifest and agreed without sharing mutable state.');
  check('US-AI13', cycle.skeptic.consensusForced === false && cycle.skeptic.productionAuthorization === false, 'Skeptic review does not force consensus.');
  check('US-AI14', cycle.promotion.verifiedFact === false && cycle.inventedDiscovery === false, 'Evidence promotion does not assign VERIFIED_FACT or invent a discovery.');
  check('US-AI15', cycle.worldModel.state === 'WAITING_DATA' && cycle.worldModel.digitalTwinVerified === false && cycle.predecessors['62L-AH'] === 'WAITING_DATA', 'World-model hop is WAITING_DATA; no digital twin was invented.');
  check('US-AI16', cycle.learning.id.startsWith('learn_') && cycle.nextExperiment.blockedByDeadEnd === false, 'Learning ledger wrote a lesson and queued a next eligible experiment.');
  check('US-AI17', cycle.ab.causalClaim === false && cycle.ab.correlationEqualsCausation === false && cycle.ab.inventedDiscovery === false, 'A/B evaluation does not claim causation or invent a discovery.');
  check('US-AI18', cycle.causal.allowedCausalClaim === false && cycle.causal.correlationEqualsCausation === false && cycle.causal.simulationIsVerifiedFact === false, 'Causal challenge refuses correlation-as-causation and sim-as-fact.');
  check('US-AI26', cycle.quality.inventedDiscovery === false && cycle.quality.isVerifiedFact === false && cycle.quality.replicated === true, 'Discovery intelligence scores process quality without inventing discoveries.');
  check('US-AI27', cycle.quality.score > 0 && cycle.quality.score <= 1 && cycle.quality.evidenceState === 'PASS', 'Discovery-quality measurement is bounded and uses executed evidence.');

  const failCwd = join(root, 'not-a-git-repo');
  await mkdir(failCwd, { recursive: true });
  const failCandidate = {
    ...ranked.find((item) => item.kind === 'software')!,
    title: 'software:dead-end-git-missing',
    conditions: { hypothesis: 'missing git repo', kind: 'software', seed: 'dead-end-1' },
    fingerprint: fingerprintExperiment({
      kind: 'software',
      experiment: 'software:dead-end-git-missing',
      conditions: { hypothesis: 'missing git repo', kind: 'software', seed: 'dead-end-1' },
    }),
    blockedByDeadEnd: false,
    eligible: true,
  };
  const failed = await runOfflineExperiment({
    tenantId,
    universeId,
    candidate: failCandidate,
    softwareCwd: failCwd,
    replicaLane: 'primary',
    root,
  });
  check('US-AI12', failed.evidenceState === 'FAIL' && Boolean(failed.negativeResultId), 'Failed software experiment records a negative result.');
  const dead = await lookupDeadEnd({
    tenantId,
    universeId,
    kind: 'software',
    experiment: 'software:dead-end-git-missing',
    conditions: failCandidate.conditions,
    root,
  });
  check('US-AI12', Boolean(dead) && dead?.evidenceState === 'FAIL' && dead?.rediscoveryBlocked === true, 'Negative-result memory retains experiment, conditions, evidence, and failure.');
  const blocked = await runOfflineExperiment({
    tenantId,
    universeId,
    candidate: failCandidate,
    softwareCwd: failCwd,
    replicaLane: 'primary',
    root,
  });
  check('US-AI12', blocked.skippedDeadEnd === true && blocked.evidenceState === 'FAIL' && blocked.negativeResultId === dead?.id, 'The same dead end is not rediscovered as a fresh experiment.');
  const replicaOfFail = await replicateIndependently({
    tenantId,
    universeId,
    original: failed,
    candidate: failCandidate,
    softwareCwd: failCwd,
    root,
  });
  check('US-AI11', replicaOfFail.replicaLane === 'independent' && replicaOfFail.measurementAgreed === true && replicaOfFail.evidenceState === 'FAIL', 'Independent replication of a failure confirms FAIL without inventing PASS.');

  const permission = denyConsequentialAction('grant_permission');
  const deploy = gateResearchAction({ action: 'deploy production', deploy: true });
  const spend = gateResearchAction({ action: 'buy GPUs', spendMoney: true });
  const contract = gateResearchAction({ action: 'sign vendor contract', makeContract: true });
  const trade = gateResearchAction({ action: 'execute equity trade', trading: true });
  const physical = gateResearchAction({ action: 'power-cycle rack', physicalControl: true });
  const founder = gateResearchAction({ action: 'approve as founder', impersonateFounder: true });
  const guardian = gateResearchAction({ action: 'disable RLS', weakenGuardian: true });
  check('US-AI28', permission.state === 'FAIL' && permission.allowed === false, 'Permission grants are denied.');
  check('US-AI28', deploy.allowed === false && deploy.state === 'FAIL' && deploy.denial?.action === 'deploy_production', 'Production deploy is denied.');
  check('US-AI28', spend.allowed === false && contract.allowed === false && trade.allowed === false, 'Spend, contracts, and trades are denied.');
  check('US-AI28', physical.allowed === false && founder.allowed === false && guardian.allowed === false, 'Physical control, founder impersonation, and Guardian weaken are denied.');

  const sealed = refuseSealedReplication({
    sealed: true,
    classification: 'sealed_founder_priority',
    ordinaryMemory: false,
    label: 'CEO-sealed founder priority note',
  });
  check('US-AI29', sealed.allowed === false && sealed.replicated === false && sealed.ceoSealedReplicatesByDefault === false, 'CEO-sealed records are non-replicating by default.');
  const sealedRun = await runOfflineExperiment({
    tenantId,
    universeId,
    candidate: failCandidate,
    softwareCwd: gitRoot,
    sealedPayload: { sealed: true, classification: 'sealed_founder_priority' },
    replicaLane: 'independent',
    root,
  });
  check('US-AI29', sealedRun.evidenceState === 'FAIL' && sealedRun.measurement.metric === 'sealed_replication', 'Sealed payloads cannot enter experiment memory.');

  const industry = await runMultiIndustryResearch({
    tenantId,
    universeId,
    question: 'inspection loops',
    root,
  });
  const liveIndustry = await runMultiIndustryResearch({
    tenantId,
    universeId,
    question: 'today live FX',
    needsExternalFreshness: true,
    root,
  });
  check('US-AI19', industry.inventedFacts === false && industry.analogyIsIdentity === false && industry.domainsConsulted.includes('history'), 'Multi-industry research reuses historical learning without inventing facts.');
  check('US-AI19', liveIndustry.state === 'WAITING_DATA', 'Live multi-industry freshness is WAITING_DATA.');

  const historical = await runHistoricalResearch({
    tenantId,
    universeId,
    question: 'inspection loops in historical manufacturing',
    root,
  });
  check('US-AI20', historical.cell === 'historical' && historical.inventedFacts === false, 'Historical research cell does not invent facts.');

  const regional = await runRegionalResearch({
    tenantId,
    universeId,
    region: 'offline-local',
    question: 'inspection loops',
    root,
  });
  const liveRegion = await runRegionalResearch({
    tenantId,
    universeId,
    region: 'live-exchange',
    question: 'today price',
    needsExternalFreshness: true,
    root,
  });
  check('US-AI21', regional.liveFieldStudy === false && regional.inventedFacts === false, 'Regional research is not a live field study.');
  check('US-AI21', liveRegion.state === 'WAITING_DATA', 'Live regional research is WAITING_DATA.');

  const quant = runQuantResearch({
    signals: [{ id: 's1', weight: 1, confidence: 0.8, direction: 1, evidenceRefs: ['synthetic:62lai-git'] }],
  });
  check('US-AI22', quant.tradingAuthorized === false && quant.tradeDenied === true && quant.classical.model === 'classical_probabilistic', 'Quant research is classical and cannot execute trades.');

  const quantum = runBoundedQuantumResearchCell({
    id: 'q-62lai',
    objective: 'Bounded local inspection scheduling research',
  });
  check('US-AI23', quantum.classicalBaselineRequired === true && quantum.claimsQuantumAdvantage === false && quantum.simulatorIsQpu === false && quantum.qpuState === 'UNAVAILABLE', 'Quantum research requires a classical baseline; unverified QPU is UNAVAILABLE.');

  const infra = runInfrastructureRd({ tenantId, universeId });
  check('US-AI24', infra.physicalDenied === true && infra.autoPurchase === false && infra.darkMatterChipFamily === false && infra.productionAuthorization === false, 'Infrastructure R&D cannot control physical systems or auto-purchase.');

  const nightBlocked = await runOfflineNightResearch({
    tenantId,
    universeId,
    objective: 'Night research without approval',
    approved: false,
  });
  const night = await runOfflineNightResearch({
    tenantId,
    universeId,
    objective: 'Approved offline night research on local inspection',
    approved: true,
  });
  check('US-AI25', nightBlocked.report.tasksBlocked >= 1 && nightBlocked.productionDeployments === 0, 'Unapproved night research is blocked.');
  check('US-AI25', night.report.permissionExpansions === 0 && night.productionDeployments === 0, 'Night research cannot deploy or expand permissions.');

  const providers = unconfiguredProviderStates();
  check('US-AI30', providers.slots.every((slot) => slot.state === 'UNAVAILABLE' || slot.configured), 'Unconfigured providers are UNAVAILABLE.');
  const preds = predecessorMap();
  check('US-AI15', preds['62L-AC'] === 'AVAILABLE' && preds['62L-AD'] === 'AVAILABLE' && preds['62L-AH'] === 'WAITING_DATA' && preds['62L-AE'] === 'WAITING_DATA', 'AC/AD reused; AH/AE recorded WAITING_DATA rather than invented.');

  const recorded = await recordNegativeResult({
    tenantId,
    universeId,
    experiment: 'software:dead-end-git-missing',
    kind: 'software',
    conditions: failCandidate.conditions,
    evidenceRefs: ['cmd:git_status:128'],
    failure: 'duplicate write should no-op',
    root,
  });
  check('US-AI12', recorded.id === dead?.id, 'Duplicate negative-result writes retain the original record.');

  const health = await buildResearchDirectorHealth({ tenantId, universeId, root });
  check('US-AI30', health.inventedPass === false && health.productionAuthorization === false && health.windowsNodeVerification === 'NOT_TESTED' && health.negativeResults >= 1, 'Health report does not invent PASS and records negative-result memory.');

  const ab = evaluateAb({
    tenantId,
    universeId,
    a: cycle.primary.measurement,
    b: { ...cycle.primary.measurement, id: 'b', value: cycle.primary.measurement.value + 1, evidenceState: 'PASS' },
  });
  check('US-AI17', ab.winner === 'b' && ab.causalClaim === false, 'A/B can rank measurements without a causal claim.');
  const causal = challengeCausation({
    tenantId,
    universeId,
    claim: 'git_status caused yield to improve',
    onlyCorrelation: true,
    fromSimulation: false,
  });
  check('US-AI18', causal.evidenceState === 'UNKNOWN' && causal.allowedCausalClaim === false, 'Causal overclaim stays UNKNOWN.');
  const quality = measureDiscoveryQuality({
    run: { ...cycle.primary, inventedDiscovery: false },
    replication: cycle.replication,
    skeptic: cycle.skeptic,
    causal,
  });
  check('US-AI27', quality.inventedDiscovery === false && quality.isVerifiedFact === false, 'Quality measurement refuses verified-fact inflation.');

  if (failures.length) {
    console.error(`62L-AI safety tests FAIL\n${failures.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('62L-AI safety tests PASS');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
