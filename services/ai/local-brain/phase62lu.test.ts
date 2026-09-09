import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { addKnowledgeEdge, upsertKnowledgeNode } from './knowledge-graph';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import { loadMeetingRoom, openMeetingRoom, runMeetingRoomRound } from './meeting-rooms';
import { loadNightShiftCheckpoint, runNightShift } from './night-shift';
import {
  enqueueOfflineBrainJob,
  listOfflineBrainJobs,
  OFFLINE_BRAIN_TRANSITION,
  readHeartbeat,
  recoverInterruptedJobs,
  runOfflineBrainOnce,
} from './offline-brain-runtime';
import { buildFounderReport } from './founder-report';
import { requestAgentInstance, populationStats, reapExpiredAgents } from './agent-population';
import { planDemandAgents } from './demand-agent-planner';
import {
  runCodingTestingWorkcell,
  runDecisionCouncil,
  runQuantWorkcell,
  runQuantumResearchWorkcell,
} from './workcells';

const root = await mkdtemp(join(tmpdir(), 'xiv-62lu-'));
const tenantId = '62lu-tenant';
const universeId = '62lu-universe';
const failures: string[] = [];

function check(story: string, ok: boolean, detail: string) {
  if (!ok) failures.push(`${story}: ${detail}`);
  else console.log(`PASS ${story} — ${detail}`);
}

try {
  check(
    'US-U-transition',
    OFFLINE_BRAIN_TRANSITION.join(' → ') === 'defined → recruited → communicating → meeting → retrieving_knowledge → debating_decisions → coding_testing → recording_outcomes → xiv_learning',
    'Operational transition is recorded.',
  );

  // US-U3 knowledge retrieval
  await upsertKnowledgeNode({
    id: 'fact-local-1',
    type: 'claim',
    domain: 'business',
    label: 'Local inventory observed',
    summary: 'Sandbox warehouse count is 12.',
    claimState: 'VERIFIED_FACT',
    sourceRefs: ['synthetic:62lu'],
    confidence: 1,
    classification: 'internal',
  }, root);
  await upsertKnowledgeNode({
    id: 'fact-local-2',
    type: 'claim',
    domain: 'business',
    label: 'Conflicting inventory rumor',
    summary: 'Unverified rumor of 40 units.',
    claimState: 'DISPUTED',
    sourceRefs: ['synthetic:62lu'],
    confidence: 0.2,
    classification: 'internal',
  }, root);
  await addKnowledgeEdge({
    id: 'edge-local-1',
    from: 'fact-local-1',
    to: 'fact-local-2',
    type: 'CONTRADICTS',
    evidenceRefs: ['synthetic:62lu'],
  }, root);

  const localKnowledge = await retrieveOfflineKnowledge('inventory', { tenantId, universeId, root });
  check('US-U3', localKnowledge.state === 'AVAILABLE' && localKnowledge.nodes.length >= 1 && localKnowledge.inventedFacts === false, 'Local knowledge retrieved without invented facts.');
  const waiting = await retrieveOfflineKnowledge('today market price', {
    tenantId,
    universeId,
    root,
    needsExternalFreshness: true,
  });
  check('US-U3', waiting.state === 'WAITING_DATA' && waiting.nodes.length === 0, 'External freshness becomes WAITING_DATA.');

  // US-U2 meeting rooms persist and isolate tenants
  const room = await openMeetingRoom({
    tenantId,
    universeId,
    objective: 'Review local inventory evidence',
    roles: ['architect', 'skeptic'],
    maxRounds: 1,
    root,
  });
  const other = await loadMeetingRoom(room.id, 'other-tenant', universeId, root);
  check('US-U2', other === null, 'Meeting rooms are tenant/Universe scoped.');
  const reloaded = await loadMeetingRoom(room.id, tenantId, universeId, root);
  check('US-U2', reloaded?.id === room.id && reloaded?.productionAuthorized === false, 'Meeting room persisted to local state.');
  const afterRound = await runMeetingRoomRound({ roomId: room.id, tenantId, universeId, root });
  check('US-U2', afterRound.state === 'unavailable' || afterRound.state === 'completed', `Meeting round recorded state=${afterRound.state} without production authorization.`);

  // US-U1 persistent worker heartbeat + recover + dispatch
  const job = await enqueueOfflineBrainJob({
    kind: 'knowledge_retrieval',
    tenantId,
    universeId,
    objective: 'inventory',
    root,
  });
  const jobs = await listOfflineBrainJobs(root);
  const running = jobs.find((item) => item.id === job.id);
  if (running) {
    running.state = 'running';
    running.updatedAt = new Date().toISOString();
  }
  await writeJsonFileAtomic(xivLocalPath(root, 'offline-brain-jobs.json'), { jobs });
  const recovered = await recoverInterruptedJobs(root);
  const recoveredJobs = await listOfflineBrainJobs(root);
  check('US-U1', recovered >= 1 && recoveredJobs.some((item) => item.id === job.id && item.state === 'queued'), 'Interrupted running jobs are recovered to queued.');
  const worked = await runOfflineBrainOnce(root);
  const heartbeat = await readHeartbeat(root);
  const afterJobs = await listOfflineBrainJobs(root);
  check('US-U1', worked === true && heartbeat?.productionGitPushEnabled === false && heartbeat.l4AutonomyEnabled === false, 'Worker tick writes heartbeat with production locks false.');
  check('US-U1', afterJobs.some((item) => item.id === job.id && item.state === 'completed'), 'Knowledge retrieval job completed from persistent queue.');

  // US-U4 Decision Council
  const lowCouncil = await runDecisionCouncil({
    tenantId,
    universeId,
    action: 'Prepare a local inventory brief',
    consequence: 'LOW',
    approved: true,
    root,
  });
  check('US-U4', lowCouncil.recommendation === 'PREPARE_LOCALLY' && lowCouncil.consensusForced === false && lowCouncil.dissent.length >= 1, 'Low-consequence council prepares locally and records dissent.');
  const highCouncil = await runDecisionCouncil({
    tenantId,
    universeId,
    action: 'Deploy production and expand permissions',
    consequence: 'CRITICAL',
    production: true,
    permissionChange: true,
    approved: true,
    root,
  });
  check('US-U4', highCouncil.recommendation === 'HUMAN_APPROVAL_REQUIRED' && highCouncil.productionAuthorization === false, 'Critical council remains human-authorized.');

  // US-U5 Quant workcell
  const quant = await runQuantWorkcell({
    tenantId,
    universeId,
    signals: [
      { id: 's1', weight: 1, confidence: 0.8, direction: 1, evidenceRefs: ['node:fact-local-1'] },
      { id: 's2', weight: 1, confidence: 0.4, direction: -1, evidenceRefs: ['node:fact-local-2'] },
    ],
    approved: true,
    root,
  });
  check('US-U5', quant.productionAuthorization === false && quant.tradingAuthorized === false && quant.decision.model === 'classical_probabilistic', 'Quant workcell is classical decision support, not production trading.');
  const emptyQuant = await runQuantWorkcell({ tenantId, universeId, signals: [], approved: true, root });
  check('US-U5', emptyQuant.decision.recommendation === 'defer', 'Empty quant signals defer.');

  // US-U6 Quantum research workcell
  const quantum = await runQuantumResearchWorkcell({
    tenantId,
    universeId,
    experiment: {
      id: 'q-sim-1',
      objective: 'Bounded QAOA research against a classical baseline',
      algorithm: 'qaoa',
      backend: 'classical_simulator',
      qubitCount: 8,
    },
    problem: {
      id: 'p1',
      variables: 8,
      objective: 'minimize_cost',
      constraints: ['no production routing'],
      provenanceRefs: ['synthetic:62lu'],
    },
    approved: true,
    root,
  });
  check('US-U6', quantum.claimsQuantumAdvantage === false && quantum.experiment.classicalBaselineRequired === true && quantum.qpuExecutionAuthorized === false, 'Quantum workcell is bounded research with a classical baseline.');
  const qpu = await runQuantumResearchWorkcell({
    tenantId,
    universeId,
    experiment: {
      id: 'q-qpu-1',
      objective: 'Unverified QPU',
      algorithm: 'vqe',
      backend: 'quantum_qpu',
      qubitCount: 4,
      backendVerified: false,
    },
    approved: true,
    root,
  });
  check('US-U6', qpu.experiment.state === 'UNAVAILABLE', 'Unconfigured QPU remains UNAVAILABLE.');

  // US-U7 governed coding/testing
  const shellDenied = await runCodingTestingWorkcell({
    tenantId,
    universeId,
    proposal: {
      summary: 'try shell',
      files: [{ path: 'readme.txt', unifiedDiff: '--- a/readme.txt\n+++ b/readme.txt\n' }],
      testsExpected: [],
      requestedShell: ['rm -rf /'],
    },
    approved: true,
    root,
  });
  check('US-U7', shellDenied.accepted === false && shellDenied.reason.includes('NO_SHELL'), 'Arbitrary shell is denied.');
  const protectedBranch = await runCodingTestingWorkcell({
    tenantId,
    universeId,
    proposal: {
      summary: 'touch main',
      files: [{ path: 'readme.txt', unifiedDiff: '--- a/readme.txt\n+++ b/readme.txt\n' }],
      testsExpected: [],
    },
    currentBranch: 'main',
    approved: true,
    root,
  });
  check('US-U7', protectedBranch.accepted === false, 'Writes on main are refused.');
  const coding = await runCodingTestingWorkcell({
    tenantId,
    universeId,
    proposal: {
      summary: 'Allowlisted git status evidence',
      files: [{ path: 'services/ai/local-brain/workcells.ts', unifiedDiff: 'diff --git a/services/ai/local-brain/workcells.ts b/services/ai/local-brain/workcells.ts\n' }],
      testsExpected: ['git_status'],
    },
    currentBranch: 'cursor/62l-u-offline-brain-worker-b338',
    cwd: process.cwd(),
    runTests: true,
    approved: true,
    storyId: '62L-U',
    root,
  });
  check(
    'US-U7',
    coding.accepted === true && coding.productionGitPush === false && coding.shellCommands.length === 0 && coding.testResults[0]?.id === 'git_status',
    `Allowlisted git_status ran exit=${coding.accepted ? coding.testResults[0]?.exitCode : 'n/a'}.`,
  );

  // US-U9 demand-based recruitment
  const unapproved = planDemandAgents({
    tenantId,
    universeId,
    taskId: 'recruit-no',
    requestedRoles: ['coder', 'tester'],
    consequence: 'LOW',
    approved: false,
  });
  check('US-U9', unapproved.status === 'NOT_APPROVED' && unapproved.agents.length === 0, 'Unapproved recruitment does not spawn agents.');
  const criticalRecruit = planDemandAgents({
    tenantId,
    universeId,
    taskId: 'recruit-crit',
    requestedRoles: ['coder'],
    consequence: 'CRITICAL',
    approved: true,
  });
  check('US-U9', criticalRecruit.status === 'HUMAN_APPROVAL_REQUIRED', 'Critical recruitment requires a human.');
  const planned = planDemandAgents({
    tenantId,
    universeId,
    taskId: 'recruit-yes',
    requestedRoles: ['coder', 'tester', 'security'],
    consequence: 'LOW',
    approved: true,
  });
  check('US-U9', planned.status === 'PLANNED' && planned.productionAuthorization === false, 'Approved demand recruits a bounded task force.');
  const created = requestAgentInstance({
    role: 'coder',
    tenantId,
    universeId,
    taskId: 'ttl-check',
    ttlMinutes: 5,
  });
  check('US-U9', 'instance' in created && created.instance?.canCreateAgents === false && created.instance?.canExpandPermissions === false && created.instance?.productionAuthorized === false, 'Recruited agents cannot self-replicate or expand permissions.');
  reapExpiredAgents(Date.now() + 10 * 60_000);
  check('US-U9', populationStats().hardActiveLimit === 32, 'Population governor remains in force.');

  const recruitJob = await enqueueOfflineBrainJob({
    kind: 'recruitment',
    tenantId,
    universeId,
    objective: 'Recruit a workflow planner',
    payload: { roles: ['workflow_planner'], approved: true, consequence: 'LOW' },
    root,
  });
  await runOfflineBrainOnce(root);
  const recruitAfter = (await listOfflineBrainJobs(root)).find((item) => item.id === recruitJob.id);
  check('US-U9', recruitAfter?.state === 'completed', 'Worker recruitment job completed through the governor.');

  // US-U8 resumable Night Shift
  await writeJsonFileAtomic(xivLocalPath(root, 'night-shift.json'), {
    runId: 'night-test',
    startedAt: new Date().toISOString(),
    completedTaskIds: ['already-done'],
    blockedUnapprovedIds: [],
    results: [{ taskId: 'already-done', status: 'completed', summary: 'prior tick' }],
    state: 'running',
  });
  const night = await runNightShift([
    { id: 'already-done', objective: 'must not rerun', roles: ['coder'], approved: true, tenantId, universeId },
    { id: 'needs-approval', objective: 'not approved', roles: ['coder'], approved: false, tenantId, universeId },
  ], { root, resume: true });
  check('US-U8', night.resumed === true && night.productionDeployments === 0 && night.permissionExpansions === 0, 'Night Shift resume flag is true and production locks hold.');
  check('US-U8', night.results.filter((item) => item.taskId === 'already-done').length === 1, 'Completed Night Shift tasks are not rerun.');
  check('US-U8', night.results.some((item) => item.taskId === 'needs-approval' && item.status === 'blocked'), 'Unapproved Night Shift tasks stay blocked.');
  const nightCheckpoint = await loadNightShiftCheckpoint(root);
  check('US-U8', nightCheckpoint?.completedTaskIds.includes('already-done') === true, 'Night Shift checkpoint is durable.');

  // US-U10 Founder Morning Brain Report
  const morning = await buildFounderReport(root);
  check('US-U10', morning.safety.l4AutonomyEnabled === false && morning.safety.productionSelfDeploy === false, 'Morning report preserves authority locks.');
  check('US-U10', Array.isArray(morning.operational.transition) && morning.operational.jobs.total >= 1, 'Morning report includes operational worker/job state.');
  check('US-U10', morning.operational.meetings.productionAuthorized === false, 'Morning report does not claim production meeting authority.');
  check('US-U10', morning.operational.providers.every((slot) => slot.configured || slot.state === 'UNAVAILABLE'), 'Unconfigured providers remain UNAVAILABLE.');

  const quantumJob = await enqueueOfflineBrainJob({
    kind: 'quantum_research',
    tenantId,
    universeId,
    objective: 'QPU without proof',
    payload: { backend: 'quantum_qpu', qubitCount: 2, backendVerified: false },
    root,
  });
  await runOfflineBrainOnce(root);
  const quantumAfter = (await listOfflineBrainJobs(root)).find((item) => item.id === quantumJob.id);
  check('US-U6', quantumAfter?.state === 'unavailable', 'Worker records unconfigured QPU work as UNAVAILABLE.');

  if (failures.length) {
    console.error('62L-U tests FAIL');
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('62L-U safety tests PASS');
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
