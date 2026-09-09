import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { resetAgentPopulation } from './agent-population';
import { readApprovedContext } from './context-vault';
import { OFFLINE_OPERATING_CYCLE, SimulatedCrash, buildOfflineWorkcellHealth, enqueueApprovedStory, forceDeadLetter, listDeadLetters, recoverDeadLetter, recoverInterruptedWorkcells, runOfflineOperatingCycle, tickOfflineAgentRuntime } from './offline-agent-runtime';
import { proposeStructuredPatch } from './coding-agent';
import { runProtectedCodingWorkcell, runQuantWorkcell, runInfrastructureWorkcell, runResearchWorkcell, runTestFixRetestLoop, runBoundedImprovementAfterEvidence } from './offline-workcells';
import { openPersistentMeeting, pausePersistentMeeting, resumePersistentMeeting, runPersistentMeetingRound, loadPersistentMeeting } from './persistent-meetings';
import { admitWorkcell, releaseWorkcell, resetResourceBudget, resourceBudgetFor, routeLocalModel, scheduleWorkcellCompute } from './resource-governor';
import { queueOfflineOnlineReconciliation, reconcileWhenConnectivityReturns } from './offline-reconciliation';
import { recallStrategyTactics, recordStrategyTactic } from './strategy-memory';
import { runAllowedLocalCommand } from './local-command-runner';
import type { AllowedLocalCommand } from './local-command-runner';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lac-'));
const tenantId = '62lac-tenant';
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
await writeFile(join(root, 'docs', 'approved-story.md'), 'Approved sandbox story context for 62L-AC.\n', 'utf8');

let failThenPass = 0;
const flakyRunner = async (input: { id: AllowedLocalCommand }) => {
  failThenPass += 1;
  return {
    exitCode: failThenPass === 1 ? 1 : 0,
    stdout: input.id,
    stderr: failThenPass === 1 ? 'fail once' : '',
    timedOut: false,
    productionEffect: false as const,
  };
};

const alwaysPassRunner = async (input: { id: AllowedLocalCommand }) => ({
  exitCode: 0,
  stdout: input.id,
  stderr: '',
  timedOut: false,
  productionEffect: false as const,
});

try {
  check(
    'US-AC-architecture',
    OFFLINE_OPERATING_CYCLE.join(' → ') === 'approved_story → offline_supervisor → context_vault → knowledge_retrieval → agent_workcell → plan → agents_collaborate → local_tools → code_research_simulation → test → critique → evidence → decision_gate → checkpoint → learning_ledger → strategy_memory → next_task',
    'Operating cycle hops are recorded in order.',
  );

  check('US-AC-git-init', git.status === 0, `git init in test root exit=${git.status}`);

  const context = await readApprovedContext(root, 'docs/approved-story.md');
  check('US-AC21', context.path === 'docs/approved-story.md' && context.source === 'local_repo', 'Context Vault reads approved local files.');
  let denied = false;
  try {
    await readApprovedContext(root, '.env');
  } catch {
    denied = true;
  }
  check('US-AC21', denied, 'Context Vault denies credential paths.');

  const model = await routeLocalModel();
  check('US-AC8', model.cloudFallback === false && (model.state === 'UNAVAILABLE' || model.state === 'AVAILABLE'), `Local-model route state=${model.state}; cloudFallback=false.`);

  const schedule = await scheduleWorkcellCompute();
  check('US-AC9', schedule.physicalDeviceControl === false && (schedule.selected === 'cpu' || schedule.state === 'AVAILABLE' || schedule.state === 'UNAVAILABLE'), `Hardware schedule selected=${schedule.selected}; physicalDeviceControl=false.`);

  resetResourceBudget(tenantId, universeId);
  const first = admitWorkcell(tenantId, universeId);
  const second = admitWorkcell(tenantId, universeId);
  const third = admitWorkcell(tenantId, universeId);
  check('US-AC10', first.admitted && second.admitted && !third.admitted && third.permissionExpansion === false, 'Resource governor enforces concurrent workcell budget.');
  releaseWorkcell(tenantId, universeId);
  releaseWorkcell(tenantId, universeId);
  check('US-AC10', resourceBudgetFor(tenantId, universeId).maxConcurrentWorkcells === 2, 'Budget does not self-expand.');

  const tactic = await recordStrategyTactic({
    tenantId,
    universeId,
    subject: 'offline coding',
    tactic: 'Retrieve evidence before planning a patch.',
    outcome: 'succeeded',
    evidenceRefs: ['synthetic:62lac'],
    root,
  });
  const recalled = await recallStrategyTactics({ tenantId, universeId, query: 'coding', root });
  const other = await recallStrategyTactics({ tenantId: 'other', universeId, query: 'coding', root });
  check('US-AC11', recalled.tactics.some((item) => item.id === tactic.id) && other.tactics.length === 0 && tactic.inventedFacts === false, 'Strategy memory is tenant scoped and does not invent facts.');

  const improvement = await runBoundedImprovementAfterEvidence({
    tenantId,
    universeId,
    objective: 'Rank retrieval of prior coding tactics higher',
    observed: 'Sandbox tactic succeeded.',
    successful: true,
    evidenceRefs: ['synthetic:62lac'],
    root,
  });
  const blockedImprove = await runBoundedImprovementAfterEvidence({
    tenantId,
    universeId,
    objective: 'Expand production permissions',
    observed: 'Must not expand permissions.',
    successful: false,
    evidenceRefs: ['synthetic:62lac'],
    consequence: 'CRITICAL',
    permissionChange: true,
    root,
  });
  check('US-AC12', improvement.canChangePermissions === false && improvement.canExpandAutonomy === false && improvement.claimsConsciousness === false, 'Bounded self-improvement cannot expand autonomy or permissions.');
  check('US-AC12', blockedImprove.status === 'HUMAN_APPROVAL_REQUIRED', 'CRITICAL/permission change self-improvement requires a human.');

  const meeting = await openPersistentMeeting({
    tenantId,
    universeId,
    objective: 'Review sandbox patch plan',
    roles: ['researcher', 'skeptic', 'evidence_verifier'],
    maxRounds: 2,
    root,
  });
  await runPersistentMeetingRound({ id: meeting.id, tenantId, universeId, root });
  const paused = await pausePersistentMeeting(meeting.id, tenantId, universeId, root);
  const meetingResumed = await resumePersistentMeeting(meeting.id, tenantId, universeId, root);
  const loaded = await loadPersistentMeeting(meeting.id, tenantId, universeId, root);
  check('US-AC6', meeting.retrievalBeforeReasoning && meeting.founderImpersonation === false && paused.state === 'paused' && meetingResumed.state === 'open' && loaded?.id === meeting.id, 'Persistent meetings retrieve before reasoning, pause, and resume.');

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
  check('US-AC4', shellDenied.proposal.accepted === false && /NO_SHELL/.test(shellDenied.proposal.reason), 'Protected coding agent refuses shell.');
  check('US-AC4', secretDenied.accepted === false, 'Protected coding agent refuses credential paths.');

  const loop = await runTestFixRetestLoop({
    tenantId,
    universeId,
    cwd: root,
    commands: ['git_diff_check'],
    maxAttempts: 3,
    runner: flakyRunner,
  });
  check('US-AC5', loop.passed && loop.attempts.length === 2 && loop.attempts[0].passed === false && loop.productionAuthorization === false, 'Test→fix→retest loop retries a failing allowlisted command then passes.');

  const quant = await runQuantWorkcell({
    tenantId,
    universeId,
    signals: [{ id: 'q1', weight: 1, confidence: 0.7, direction: 1, evidenceRefs: ['synthetic:62lac'] }],
    includeQuantumResearch: true,
    root,
  });
  check('US-AC14', quant.classical.model === 'classical_probabilistic' && quant.tradingAuthorized === false && quant.claimsQuantumAdvantage === false && quant.bridge?.quantumState === 'UNAVAILABLE', 'Quant workcell uses a classical baseline; unverified QPU is UNAVAILABLE.');

  const infra = await runInfrastructureWorkcell({
    tenantId,
    universeId,
    nodes: [{
      id: 'node-a',
      kind: 'data_center',
      label: 'Sandbox DC',
      classification: 'internal',
      provenanceRefs: ['synthetic:62lac'],
      state: 'KNOWN',
    }],
    root,
  });
  check('US-AC15', infra.physicalDeviceControl === false && infra.chipHonesty.darkMatterChipFamily === false, 'Infrastructure workcell does not control physical devices.');

  const research = await runResearchWorkcell({
    tenantId,
    universeId,
    question: 'What local evidence supports a sandbox inventory count?',
    hypothesis: 'Local traces can be recalled without inventing facts.',
    root,
  });
  check('US-AC13', research.isReality === false && research.speculativeOnly === true && research.loop.honesty.inventedFacts === false, 'Research workcell is speculative/simulation only.');

  const waiting = await queueOfflineOnlineReconciliation({
    tenantId,
    universeId,
    workcellId: 'wc-wait',
    objective: 'Need a fresh external price',
    needsExternalFreshness: true,
    connectivity: 'offline',
    root,
  });
  const stillOffline = await reconcileWhenConnectivityReturns({
    id: waiting.id,
    tenantId,
    universeId,
    onlineObserved: false,
    root,
  });
  const online = await reconcileWhenConnectivityReturns({
    id: waiting.id,
    tenantId,
    universeId,
    onlineObserved: true,
    root,
  });
  check('US-AC17', waiting.state === 'WAITING_DATA' && stillOffline.state === 'WAITING_DATA' && online.state === 'RECONCILED_LOCAL' && online.autoAppliedOnline === false, 'Offline→online reconciliation waits, then queues local review without auto-applying online effects.');

  const worker = await enqueueApprovedStory({
    id: 'story-worker',
    tenantId,
    universeId,
    title: 'Persistent worker',
    objective: 'Prove persistent worker enqueue',
    approved: true,
    workcellKind: 'coding',
  }, root);
  const tick = await tickOfflineAgentRuntime(root);
  check('US-AC1', worker.state === 'queued' && tick.queued >= 1 && worker.l4AutonomyEnabled === false, 'Persistent worker stores queued workcells.');

  const crashStory = {
    id: 'story-crash',
    tenantId,
    universeId,
    title: 'Crash restart',
    objective: 'Prove restart-safe workcells',
    approved: true,
    workcellKind: 'coding' as const,
    repoRoot: root,
    contextPaths: ['docs/approved-story.md'],
    testRunner: alwaysPassRunner,
    testCommands: ['git_diff_check'] as AllowedLocalCommand[],
    crashAfterHop: 'plan' as const,
  };
  let crashed = false;
  try {
    await runOfflineOperatingCycle(crashStory, root);
  } catch (error) {
    crashed = error instanceof SimulatedCrash && error.hop === 'plan';
  }
  check('US-AC19', crashed, 'Simulated crash after plan hop.');
  const recovered = await recoverInterruptedWorkcells(root);
  check('US-AC2', recovered.workcells >= 1, `Recovered ${recovered.workcells} running workcell(s) to queued.`);
  const resumed = await runOfflineOperatingCycle({ ...crashStory, crashAfterHop: undefined }, root);
  const hopNames = resumed.workcell.completedHops.map((item) => item.hop);
  const retrievalIndex = hopNames.indexOf('knowledge_retrieval');
  const planIndex = hopNames.indexOf('plan');
  check('US-AC2', resumed.workcell.state === 'completed' && hopNames.includes('plan') && hopNames.includes('next_task'), 'Restart-safe workcell resumes and completes after crash.');
  check('US-AC7', resumed.workcell.retrievalBeforeReasoning && retrievalIndex >= 0 && retrievalIndex < planIndex, 'Retrieval runs before planning/reasoning.');
  check('US-AC16', hopNames.includes('checkpoint') && hopNames.includes('learning_ledger'), 'Long-running checkpoint mode writes checkpoint and learning hops.');
  check('US-AC20', OFFLINE_OPERATING_CYCLE.every((hop) => hopNames.includes(hop)), 'Full operating cycle executed.');
  check('US-AC3', hopNames.includes('plan') && hopNames.includes('offline_supervisor'), 'Offline planning hop ran after supervisor.');
  check('US-AC22', hopNames.includes('decision_gate') && hopNames.includes('evidence'), 'Decision gate and evidence hops ran.');
  check('US-AC23', hopNames.includes('learning_ledger') && hopNames.includes('strategy_memory'), 'Learning ledger and strategy memory hops ran.');

  const deniedStory = await runOfflineOperatingCycle({
    id: 'story-denied',
    tenantId,
    universeId,
    title: 'Unapproved',
    objective: 'Must not run',
    approved: false,
    workcellKind: 'coding',
  }, root);
  check('US-AC3', deniedStory.workcell.state === 'denied', 'Unapproved stories are denied before workcell execution.');

  const fresh = await enqueueApprovedStory({
    id: 'story-dlq',
    tenantId,
    universeId,
    title: 'Dead letter',
    objective: 'Force dead letter then recover',
    approved: true,
    workcellKind: 'coding',
  }, root);
  const letter = await forceDeadLetter({
    workcellId: fresh.id,
    tenantId,
    universeId,
    reason: 'Exceeded retry budget in sandbox.',
    root,
  });
  const recoveredLetter = await recoverDeadLetter({
    id: letter.id,
    tenantId,
    universeId,
    humanRecover: true,
    root,
  });
  check('US-AC18', letter.productionAuthorization === false && recoveredLetter.workcell.state === 'queued' && recoveredLetter.letter.recovered, 'Dead-letter recovery requeues after explicit human recover.');
  check('US-AC18', (await listDeadLetters(root)).some((item) => item.id === letter.id), 'Dead letters persist locally.');

  const realGit = await runAllowedLocalCommand({ id: 'git_status', cwd: root, timeoutMs: 8_000 });
  check('US-AC5-real-git', realGit.exitCode === 0 && realGit.productionEffect === false, `Real git_status exit=${realGit.exitCode}.`);

  const health = await buildOfflineWorkcellHealth(root);
  check('US-AC24', health.completedCycles >= 1 && health.inventedPass === false && health.locks.l4AutonomyEnabled === false && health.locks.tipLand === false, `Runtime metrics: completedCycles=${health.completedCycles}; recoveredCrashes=${health.recoveredCrashes}.`);
  check('US-AC1', health.workcells >= 3, 'Persistent worker health sees stored workcells.');

  const highGate = await runOfflineOperatingCycle({
    id: 'story-high',
    tenantId,
    universeId,
    title: 'High consequence',
    objective: 'Would deploy production',
    approved: true,
    workcellKind: 'coding',
    repoRoot: root,
    contextPaths: ['docs/approved-story.md'],
    testRunner: alwaysPassRunner,
    production: true,
    consequence: 'HIGH',
  }, root);
  check('US-AC22', highGate.workcell.state === 'denied' || highGate.hops.some((hop) => hop.hop === 'decision_gate' && hop.state === 'DENIED'), 'HIGH/production work stays recommendation-only at the decision gate.');
} catch (error) {
  failures.push(`UNCAUGHT: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  console.error('62L-AC safety tests FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('62L-AC safety tests PASS');
