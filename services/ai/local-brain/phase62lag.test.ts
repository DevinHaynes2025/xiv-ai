import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { resetAgentPopulation } from './agent-population';
import {
  markSocietyAgentState,
  recoverSocietyRegistry,
  registerDepartmentAgents,
  societyRegistryStats,
} from './persistent-agent-registry';
import { conveneDepartmentCouncil, HARD_MAX_DEBATE_ROUNDS, multiModelCouncilSlots } from './department-councils';
import {
  compareAgainstBaseline,
  computeEvaluationMetrics,
  evolveSkillsFromEvaluation,
  recordEvaluation,
  recordStrategyOutcome,
  strategyReputation,
} from './evaluation-harness';
import {
  gateStoryAgainstCeoPriorities,
  grantSealedAccess,
  readFounderPriority,
  rewriteFounderPriority,
  SEALED_REDACTION,
  sealFounderPriority,
} from './privacy-compartments';
import {
  buildAgentSocietyReport,
  INTELLIGENCE_CYCLE,
  probeUniverseKernel,
  recoverInterruptedSocietyCycles,
  runIntelligenceCycle,
  runSafeParallelWorkcells,
  SocietySimulatedCrash,
} from './agent-society-runtime';
import { proposeStructuredPatch } from './coding-agent';
import { runProtectedCodingWorkcell, runTestFixRetestLoop } from './offline-workcells';
import { resetResourceBudget } from './resource-governor';
import type { AllowedLocalCommand } from './local-command-runner';
import { listSocietyAgents } from './persistent-agent-registry';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lag-'));
const tenantId = '62lag-tenant';
const universeId = '62lac-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

resetAgentPopulation();
resetResourceBudget(tenantId, universeId);

const git = spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });
await mkdir(join(root, 'docs'), { recursive: true });
await writeFile(join(root, 'docs', 'approved-story.md'), 'Approved sandbox story context for 62L-AG.\n', 'utf8');

const alwaysPassRunner = async (input: { id: AllowedLocalCommand }) => ({
  exitCode: 0,
  stdout: input.id,
  stderr: '',
  timedOut: false,
  productionEffect: false as const,
});

const failThenPassRunner = (() => {
  let n = 0;
  return async (input: { id: AllowedLocalCommand }) => {
    n += 1;
    return {
      exitCode: n === 1 ? 1 : 0,
      stdout: input.id,
      stderr: n === 1 ? 'fail once' : '',
      timedOut: false,
      productionEffect: false as const,
    };
  };
})();

try {
  check(
    'US-AG-architecture',
    INTELLIGENCE_CYCLE.join(' → ') === 'approved_story → universe_kernel → agent_council → local_knowledge → debate → plan → work → test_simulation → skeptic_review → evidence → decision_gate → outcome → evaluation → skill_strategy_update → memory → debrief → next_story',
    'Intelligence cycle hops are recorded in order.',
  );
  check('US-AG-git-init', git.status === 0, `git init in test root exit=${git.status}`);

  const kernel = await probeUniverseKernel();
  check('US-AG-AF-gate', kernel.state === 'WAITING_DATA' && kernel.modulePresent === false, `Universe kernel ${kernel.state}: ${kernel.reason}`);

  const codingReg = await registerDepartmentAgents({ tenantId, universeId, department: 'coding', root });
  const businessReg = await registerDepartmentAgents({ tenantId, universeId, department: 'business', root });
  const infraReg = await registerDepartmentAgents({ tenantId, universeId, department: 'infrastructure', root });
  const stats = await societyRegistryStats(tenantId, universeId, root);
  check(
    'US-AG1',
    codingReg.status === 'REGISTERED' && businessReg.agents.length >= 1 && infraReg.agents.length >= 1 && stats.smarterBecauseMoreAgents === false && stats.l4AutonomyEnabled === false,
    `Persistent registry registered coding=${codingReg.agents.length} business=${businessReg.agents.length} infra=${infraReg.agents.length}; more-agents≠smarter.`,
  );

  const ceo = { id: 'ceo-1', kind: 'ceo_principal' as const };
  const sealed = await sealFounderPriority({
    tenantId,
    universeId,
    label: 'Sandbox continuity',
    payload: 'SEALED_FOUNDER_SECRET_PRIORITY',
    authorizedStoryTags: ['sandbox-continuity'],
    actor: ceo,
    root,
  });
  check('US-AG18', sealed.accepted && sealed.record?.sealedPayload === SEALED_REDACTION, 'CEO principal can seal a founder priority; payload is redacted in the return value.');

  const simulated = await rewriteFounderPriority({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    payload: 'rewrite-attempt',
    actor: { id: 'sim-founder', kind: 'simulated_founder' },
    root,
  });
  check('US-AG18', simulated.accepted === false && simulated.reason === 'SIMULATED_FOUNDER_CANNOT_REWRITE_PRIORITIES', 'Simulated founder agents cannot rewrite actual founder priorities.');

  const deniedTag = await gateStoryAgainstCeoPriorities({
    tenantId,
    universeId,
    storyTag: 'hostile-rewrite',
    approved: true,
    consequence: 'MEDIUM',
    actor: { id: 'agent-1', kind: 'ordinary_agent' },
    root,
  });
  check('US-AG18', deniedTag.allowed === false && deniedTag.state === 'DENIED', 'Unauthorized story tags are denied by CEO-priority gating.');

  const allowedTag = await gateStoryAgainstCeoPriorities({
    tenantId,
    universeId,
    storyTag: 'sandbox-continuity',
    approved: true,
    actor: { id: 'agent-1', kind: 'ordinary_agent' },
    root,
  });
  check('US-AG18', allowedTag.allowed === true, 'Authorized story tags pass the CEO-priority gate.');

  const unauthorizedRead = await readFounderPriority({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { id: 'council-1', kind: 'council' },
    root,
  });
  check(
    'US-AG19',
    unauthorizedRead.allowed === false && unauthorizedRead.context?.sealedPayload === SEALED_REDACTION && unauthorizedRead.context?.minimumNecessary === true,
    'Councils receive redacted sealed payload without an explicit grant.',
  );

  const grant = await grantSealedAccess({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    granteeId: 'agent-granted',
    actor: ceo,
    ttlMs: 60 * 60_000,
    root,
  });
  const grantedRead = await readFounderPriority({
    recordId: sealed.record!.id,
    tenantId,
    universeId,
    actor: { id: 'agent-granted', kind: 'ordinary_agent' },
    root,
  });
  check(
    'US-AG19',
    grant.accepted && grantedRead.allowed && grantedRead.record?.sealedPayload === SEALED_REDACTION && grantedRead.context?.priorityLabel === 'Sandbox continuity',
    'Explicit grant yields minimum necessary context; sealed payload stays redacted.',
  );

  const codingCouncil = await conveneDepartmentCouncil({
    tenantId,
    universeId,
    kind: 'coding',
    topic: 'Review a sandbox patch plan',
    maxRounds: 2,
    actor: { id: 'council-1', kind: 'council' },
    root,
  });
  check(
    'US-AG2',
    codingCouncil.retrievalBeforeReasoning && codingCouncil.independentPositions.length >= 1 && codingCouncil.consensusForced === false && codingCouncil.founderImpersonation === false,
    `Department coding council ${codingCouncil.id} retrieved before reasoning; consensus not forced.`,
  );
  check('US-AG3', codingCouncil.debateRounds <= HARD_MAX_DEBATE_ROUNDS && codingCouncil.debateRounds >= 1, `Bounded debate rounds=${codingCouncil.debateRounds} (hard max ${HARD_MAX_DEBATE_ROUNDS}).`);
  check('US-AG4', codingCouncil.retrievalBeforeReasoning && codingCouncil.sealedPayload === SEALED_REDACTION, 'Evidence-first council context redacts sealed founder payload.');

  const businessCouncil = await conveneDepartmentCouncil({ tenantId, universeId, kind: 'business', topic: 'Sandbox inventory pricing review', root });
  const infraCouncil = await conveneDepartmentCouncil({ tenantId, universeId, kind: 'infrastructure', topic: 'Sandbox node graph review', root });
  check('US-AG8', businessCouncil.kind === 'business' && infraCouncil.kind === 'infrastructure' && businessCouncil.productionAuthorized === false, 'Business and infrastructure councils convened without production authorization.');

  const historical = await conveneDepartmentCouncil({ tenantId, universeId, kind: 'historical_cultural', topic: 'Local sandbox cultural context', root });
  check('US-AG9', historical.kind === 'historical_cultural' && historical.consensusForced === false, 'Historical/cultural council reuses Cortex councils and does not force consensus.');

  const quantCouncil = await conveneDepartmentCouncil({
    tenantId,
    universeId,
    kind: 'quant_simulation',
    topic: 'Classical sandbox signal review',
    quantSignals: [{ id: 's1', weight: 1, confidence: 0.4, direction: 0, evidenceRefs: ['synthetic:62lag'] }],
    root,
  });
  check('US-AG10', quantCouncil.kind === 'quant_simulation' && quantCouncil.productionAuthorized === false, 'Quant/simulation council convened; not a trading authorization.');

  const researchCouncil = await conveneDepartmentCouncil({ tenantId, universeId, kind: 'research', topic: 'What local evidence supports a sandbox count?', root });
  const skepticCouncil = await conveneDepartmentCouncil({ tenantId, universeId, kind: 'skeptic', topic: 'Challenge the sandbox count hypothesis', root });
  check('US-AG7', researchCouncil.kind === 'research' && skepticCouncil.kind === 'skeptic' && skepticCouncil.consensusForced === false, 'Research and skeptic loops convened independently.');

  const parallel = await runSafeParallelWorkcells({ tenantId, universeId, count: 3 });
  check('US-AG5', parallel.admitted === 2 && parallel.refused === 1 && parallel.permissionExpansion === false, 'Safe parallel workcells admit two and refuse the third without expanding permissions.');

  const shellDenied = await runProtectedCodingWorkcell({
    tenantId,
    universeId,
    objective: 'Attempt shell',
    files: [{
      path: 'services/ai/local-brain/example.ts',
      action: 'modify',
      unifiedDiff: '--- a/services/ai/local-brain/example.ts\n+++ b/services/ai/local-brain/example.ts\n@@ -1,1 +1,2 @@\n export const x = 1;\n+export const y = 2;\n',
    }],
    cwd: root,
    requestedShell: ['rm -rf /'],
    root,
  });
  const secretDenied = proposeStructuredPatch({
    tenantId,
    universeId,
    summary: 'Touch secrets',
    files: [{ path: '.env', action: 'modify', unifiedDiff: '--- a/.env\n+++ b/.env\n@@ -1 +1 @@\n-x\n+y\n' }],
  });
  const loop = await runTestFixRetestLoop({
    tenantId,
    universeId,
    cwd: root,
    commands: ['git_diff_check'],
    maxAttempts: 3,
    runner: failThenPassRunner,
  });
  check('US-AG6', shellDenied.proposal.accepted === false && secretDenied.accepted === false && loop.passed && loop.attempts.length === 2, 'Coding/testing/security loop refuses shell and secrets; test→fix→retest passes on retry.');

  const models = await multiModelCouncilSlots();
  check(
    'US-AG20',
    models.unconfiguredStayUnavailable && models.local.cloudFallback === false && models.providers.every((slot) => !slot.configured ? slot.state === 'UNAVAILABLE' : true),
    `Multi-model slots: local=${models.local.state}; unconfigured providers UNAVAILABLE; cloudFallback=false.`,
  );

  const baselineMetrics = computeEvaluationMetrics({
    evidenceRefs: ['synthetic:62lag', 'evt-1', 'evt-2', 'evt-3'],
    inventedFacts: false,
    testPassed: true,
    testAttempts: 2,
    corrections: 1,
    predictedConfidence: 0.8,
    latencyMs: 40,
    tenantId,
    universeId,
    agentCount: 3,
  });
  const baseline = await recordEvaluation({
    tenantId,
    universeId,
    label: 'society-baseline',
    kind: 'baseline',
    metrics: baselineMetrics,
    predictedConfidence: 0.8,
    observedOutcome: 1,
    evidenceRefs: baselineMetrics.evidenceQuality > 0 ? ['synthetic:62lag'] : [],
    root,
  });
  check('US-AG11', baseline.kind === 'baseline' && baseline.smarterBecauseMoreAgents === false && baseline.metrics.testSuccess === 1, `Real evaluation harness stored baseline ${baseline.id}.`);
  check('US-AG13', baseline.calibrationError === Math.abs(0.8 - 1) && baseline.metrics.calibration > 0, `Calibration tracked: error=${baseline.calibrationError}.`);

  const moreAgentsMetrics = {
    ...baselineMetrics,
    agentCount: 24,
  };
  const moreAgents = await recordEvaluation({
    tenantId,
    universeId,
    label: 'more-agents-same-metrics',
    kind: 'candidate',
    metrics: moreAgentsMetrics,
    predictedConfidence: 0.8,
    observedOutcome: 1,
    evidenceRefs: ['synthetic:62lag'],
    root,
  });
  const moreAgentsCmp = await compareAgainstBaseline({
    tenantId,
    universeId,
    baselineId: baseline.id,
    candidateId: moreAgents.id,
    root,
  });
  check(
    'US-AG12',
    moreAgentsCmp.verdict === 'UNCHANGED' && moreAgentsCmp.smarterBecauseMoreAgents === false && moreAgentsCmp.intelligenceGainClaimed === false && moreAgentsCmp.deltas.agentCount > 0,
    `More agents with the same evidence/tests is UNCHANGED, not smarter (agentCount delta=${moreAgentsCmp.deltas.agentCount}).`,
  );

  const worseMetrics = computeEvaluationMetrics({
    evidenceRefs: [],
    inventedFacts: false,
    testPassed: false,
    testAttempts: 1,
    corrections: 0,
    predictedConfidence: 0.95,
    latencyMs: 80,
    tenantId,
    universeId,
    agentCount: 24,
  });
  const worse = await recordEvaluation({
    tenantId,
    universeId,
    label: 'worse-candidate',
    kind: 'candidate',
    metrics: worseMetrics,
    predictedConfidence: 0.95,
    observedOutcome: 0,
    evidenceRefs: [],
    root,
  });
  const regression = await compareAgainstBaseline({
    tenantId,
    universeId,
    baselineId: baseline.id,
    candidateId: worse.id,
    root,
  });
  check(
    'US-AG21',
    regression.qualityRegression && regression.verdict === 'REGRESSED' && regression.intelligenceGainClaimed === false,
    `Quality-regression detected versus baseline (verdict=${regression.verdict}; calibrationError=${worse.calibrationError}).`,
  );
  check('US-AG13', worse.calibrationError >= 0.9, 'Overconfident failed candidate records a large calibration error.');

  const betterMetrics = computeEvaluationMetrics({
    evidenceRefs: ['synthetic:62lag', 'evt-1', 'evt-2', 'evt-3', 'evt-4', 'evt-5'],
    inventedFacts: false,
    testPassed: true,
    testAttempts: 1,
    corrections: 0,
    predictedConfidence: 0.9,
    latencyMs: 30,
    tenantId,
    universeId,
    agentCount: 3,
  });
  const better = await recordEvaluation({
    tenantId,
    universeId,
    label: 'better-candidate',
    kind: 'candidate',
    metrics: betterMetrics,
    predictedConfidence: 0.9,
    observedOutcome: 1,
    evidenceRefs: ['synthetic:62lag', 'evt-1'],
    root,
  });
  const improved = await compareAgainstBaseline({
    tenantId,
    universeId,
    baselineId: baseline.id,
    candidateId: better.id,
    root,
  });
  check(
    'US-AG12',
    improved.verdict === 'IMPROVED' && improved.intelligenceGainClaimed === false && improved.smarterBecauseMoreAgents === false,
    `Candidate improved on stored baseline metrics without claiming XIV is smarter.`,
  );

  await recordStrategyOutcome({
    tenantId,
    universeId,
    subject: 'sandbox coding',
    tactic: 'Retrieve evidence before planning a patch.',
    outcome: 'succeeded',
    evidenceRefs: ['synthetic:62lag'],
    root,
  });
  const reputation = await strategyReputation({ tenantId, universeId, query: 'coding', root });
  check('US-AG14', reputation.samples >= 1 && reputation.inventedFacts === false && reputation.smarterBecauseMoreAgents === false, `Strategy reputation samples=${reputation.samples} reputation=${reputation.reputation}.`);

  const skill = await evolveSkillsFromEvaluation({
    tenantId,
    universeId,
    agentIds: codingReg.agents.map((agent) => agent.id),
    comparison: improved,
    evidenceRefs: ['synthetic:62lag'],
    root,
  });
  const afterSkill = await listSocietyAgents(tenantId, universeId, root);
  check(
    'US-AG15',
    skill.skillUsesAgentCount === false && skill.appliedDelta > 0 && afterSkill.some((agent) => agent.skillUpdates >= 1 && agent.skillScore !== 0.5),
    'Skill evolution updates from evaluation evidence, not from spawning more agents.',
  );

  const running = await markSocietyAgentState({
    agentId: codingReg.agents[0]!.id,
    tenantId,
    universeId,
    state: 'RUNNING',
    root,
  });
  const recoveredAgents = await recoverSocietyRegistry({ tenantId, universeId, root });
  check('US-AG17', running.updated && recoveredAgents.recovered >= 1, `Restart continuity recovered ${recoveredAgents.recovered} running registry agent(s) to READY.`);

  const crashStory = {
    id: 'story-crash',
    tenantId,
    universeId,
    title: 'Crash restart society',
    objective: 'Prove society cycle restart continuity',
    approved: true,
    workKind: 'coding' as const,
    storyTag: 'sandbox-continuity',
    repoRoot: root,
    testRunner: alwaysPassRunner,
    testCommands: ['git_diff_check'] as AllowedLocalCommand[],
    predictedConfidence: 0.6,
    crashAfterHop: 'plan' as const,
    actor: { id: 'agent-1', kind: 'ordinary_agent' as const },
  };
  let crashed = false;
  try {
    await runIntelligenceCycle(crashStory, root);
  } catch (error) {
    crashed = error instanceof SocietySimulatedCrash && error.hop === 'plan';
  }
  check('US-AG17', crashed, 'Simulated crash after plan hop.');
  const recoveredCycles = await recoverInterruptedSocietyCycles(root);
  check('US-AG17', recoveredCycles.cycles >= 1, `Recovered ${recoveredCycles.cycles} running society cycle(s) to queued.`);
  const resumed = await runIntelligenceCycle({ ...crashStory, crashAfterHop: undefined }, root);
  const hopNames = resumed.cycle.completedHops.map((item) => item.hop);
  const knowledgeIndex = hopNames.indexOf('local_knowledge');
  const debateIndex = hopNames.indexOf('debate');
  const planIndex = hopNames.indexOf('plan');
  check('US-AG17', resumed.cycle.state === 'completed' && hopNames.includes('next_story'), 'Society cycle resumes and completes after crash.');
  check('US-AG4', resumed.cycle.retrievalBeforeReasoning && knowledgeIndex >= 0 && knowledgeIndex < planIndex && knowledgeIndex < debateIndex, 'Local knowledge/retrieval runs before debate and plan.');
  check('US-AG-architecture', INTELLIGENCE_CYCLE.every((hop) => hopNames.includes(hop)), 'Full intelligence cycle executed.');
  check('US-AG16', hopNames.includes('debrief') && resumed.cycle.l4AutonomyEnabled === false, 'Self-improvement sandbox debrief ran without expanding autonomy.');

  const deniedStory = await runIntelligenceCycle({
    id: 'story-denied-tag',
    tenantId,
    universeId,
    title: 'Hostile tag',
    objective: 'Must not run',
    approved: true,
    workKind: 'coding',
    storyTag: 'hostile-rewrite',
    consequence: 'MEDIUM',
  }, root);
  check('US-AG18', deniedStory.cycle.state === 'denied', 'Unauthorized tagged story is denied before society work.');

  const highGate = await runIntelligenceCycle({
    id: 'story-high',
    tenantId,
    universeId,
    title: 'High consequence',
    objective: 'Would deploy production',
    approved: true,
    workKind: 'coding',
    storyTag: 'sandbox-continuity',
    repoRoot: root,
    testRunner: alwaysPassRunner,
    production: true,
    consequence: 'HIGH',
  }, root);
  check(
    'US-AG-decision',
    highGate.cycle.state === 'denied' || highGate.hops.some((hop) => hop.hop === 'decision_gate' && hop.state === 'DENIED'),
    'HIGH/production work stays recommendation-only at the decision gate.',
  );

  const report = await buildAgentSocietyReport(root);
  check(
    'US-AG22',
    report.locks.l4AutonomyEnabled === false &&
      report.locks.smarterBecauseMoreAgents === false &&
      report.locks.inventedPass === false &&
      report.locks.tipLand === false &&
      report.locks.founderImpersonation === false &&
      report.predecessors['62L-AF-universe-kernel'].state === 'WAITING_DATA' &&
      report.predecessors['62L-AE-ceo-sealed-vault'].state === 'WAITING_DATA' &&
      report.predecessors['62L-AD-distributed-mesh'].state === 'WAITING_DATA' &&
      report.productionAuthorization === false,
    `Founder-facing society report: cycles=${report.cycles} completed=${report.completedCycles}; AF/AE/AD WAITING_DATA; tipLand=NO.`,
  );
  check('US-AG1', report.registry.smarterBecauseMoreAgents === false, 'Society registry status refuses a smarter-because-more-agents claim.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AG safety tests FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('62L-AG safety tests PASS');
assert.equal(failures.length, 0);
