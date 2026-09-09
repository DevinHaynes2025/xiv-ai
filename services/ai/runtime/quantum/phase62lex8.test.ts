/**
 * 62L-EX8 — Offline Quantum Agent Team denial + honesty tests.
 *
 * Script: npm run test:62lex8
 *
 * Covers:
 * 1. child preserves tenant
 * 2. child preserves Universe
 * 3. permission expansion → DENIED
 * 4. compute-budget expansion → DENIED
 * 5. expired agent stopped
 * 6. missing heartbeat → not RUNNING_VERIFIED
 * 7. powered-off → OFFLINE_STOPPED
 * 8. web offline → WAITING_DATA
 * 9. physical QPU offline → WAITING_PROVIDER
 * 10. conflicting agents → disagreement preserved
 * 11. meeting no hidden CoT
 * 12. branch result returns to Home Base
 * 13. failed experiment remains in evidence
 * 14. learning cannot change permissions
 * 15. cross-tenant message → DENIED
 * 16. cross-Universe message → DENIED
 * 17. L4 false
 * 18. Guardian/RLS unchanged
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  CANONICAL_PATHWAY,
  EX8_DB_CANDIDATES_STATUS,
  EX8_LOCKS,
  EX8_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  QUANTUM_TEAM_ROLES,
  assertEx8LocksIntact,
  ex8L4AutonomyEnabled,
  ex8SoftWireSnapshot,
  guardianRlsUnchangedByEx8,
} from './agent-team-types.ts';
import {
  applyLearningUpdate,
  evaluatePhysicalQpuDependency,
  evaluateWebDependency,
  isHeartbeatActive,
  powerOffAgent,
  recordHeartbeat,
  registerQuantumTeamAgent,
  requestLocalCompute,
  sendTeamMessage,
  spawnChildAgent,
  stopExpiredAgent,
  transitionAgentState,
  type RegisterAgentInput,
} from './agent-team.ts';
import { planQuantumMission } from './team-planner.ts';
import {
  appendMeetingTurn,
  meetingHasHiddenCot,
  openTeamMeeting,
  recordDisagreement,
  resolveMeetingConsensus,
} from './team-meeting.ts';
import {
  createBranchReturn,
  deliverReturnToHomeBase,
  listEvidenceForMission,
  recordFailedExperiment,
  resetEvidenceLedgerForTests,
  updateNeuralPathway,
} from './team-receipt.ts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../../../..');
const NOW = '2026-09-09T22:40:00.000Z';
const FUTURE = '2026-12-31T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';

function parentInput(
  overrides: Partial<RegisterAgentInput> = {},
): RegisterAgentInput {
  return {
    agentId: 'agent-mission-1',
    agentRole: 'QuantumMissionAgent',
    missionId: 'mission-ex8',
    taskId: 'task-root',
    parentTaskId: null,
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    allowedTools: ['local-search', 'evidence-review', 'task-planning'],
    allowedDataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    allowedExecutionClasses: [
      'CLASSICAL',
      'QUANTUM_INSPIRED',
      'SIMULATED_QUANTUM',
      'PHYSICAL_QPU',
    ],
    computeBudget: { maxCpuMs: 60_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    memoryBudget: { maxMb: 512 },
    timeBudget: { maxWallClockMs: 120_000 },
    expectedOutput: 'mission_summary',
    evidenceRequirements: ['receipt'],
    returnPath: 'home-base://quantum/returns',
    createdAt: NOW,
    expiresAt: FUTURE,
    webOnline: false,
    physicalQpuOnline: false,
    hybridRouterAuthorized: true,
    ...overrides,
  };
}

function requireAgent(result: ReturnType<typeof registerQuantumTeamAgent>) {
  assert.equal(result.ok, true, result.ok === false ? result.reason : 'expected ok');
  return result.value;
}

test('SoT #170 EX8; next EX9 docs-only; GitLab not invented', () => {
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.match(GITHUB_SOT_TITLE, /Offline Quantum Agent Team/);
  assert.match(NEXT_PHASE_TITLE, /EX9/);
  assert.match(NEXT_PHASE_TITLE, /Quantum Workload Genome/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.equal(EX8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(QUANTUM_TEAM_ROLES.includes('HybridRoutingAgent'), true);
  assert.equal(QUANTUM_TEAM_ROLES.includes('ReviewerAgent'), true);
  assert.deepEqual([...CANONICAL_PATHWAY].slice(0, 4), [
    'FounderUserMission',
    'HomeBase',
    'MissionPlanner',
    'QuantumAgentTeam',
  ]);
  assert.equal(EX8_LOCKS.SECOND_AGENT_FRAMEWORK, false);
  assert.ok(EX8_MUST_NOT.includes('spawn_second_agent_framework'));
});

test('soft-wire EX1–EX7 / mesh / router / baselines / chipgraph; presence≠VERIFIED', () => {
  const snap = ex8SoftWireSnapshot(repoRoot);
  assert.equal(snap.agentMesh.present, true);
  assert.equal(snap.agentMesh.verified, false);
  assert.equal(snap.agentMeetings.present, true);
  assert.equal(snap.agentsRuntime.present, true);
  assert.equal(snap.guardian.present, true);
  // Predecessors may be sibling-present or WAITING_DATA — never VERIFIED.
  for (const hop of [
    snap.ex1QuantumMission,
    snap.ex2ClassicalBaseline,
    snap.ex3QiLab,
    snap.ex4SimulatorRegistry,
    snap.ex5QpuRegistry,
    snap.ex6PhysicalReceipt,
    snap.ex7HybridRouter,
    snap.chipgraph,
    snap.benchmarks,
    snap.evidence,
    snap.dnaManifest,
  ]) {
    assert.equal(hop.verified, false);
    assert.ok(
      hop.disposition === 'PRESENT_UNVERIFIED' || hop.disposition === 'WAITING_DATA',
    );
  }
});

test('1. child preserves tenant', () => {
  const parent = requireAgent(registerQuantumTeamAgent(parentInput()));
  const child = spawnChildAgent(
    parent,
    {
      childAgentId: 'child-1',
      childTaskId: 'task-child-1',
      agentRole: 'ClassicalBaselineAgent',
      allowedDataClasses: ['BENCHMARK_FIXTURE'],
      allowedExecutionClasses: ['CLASSICAL'],
      computeBudget: { maxCpuMs: 10_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
      expectedOutput: 'baseline',
      evidenceRequirements: ['baseline_receipt'],
      returnPath: parent.returnPath,
      expiresAt: FUTURE,
    },
    NOW,
  );
  assert.equal(child.ok, true);
  if (child.ok) {
    assert.equal(child.value.tenantId, parent.tenantId);
    assert.equal(child.value.parentTaskId, parent.taskId);
  }
});

test('2. child preserves Universe', () => {
  const parent = requireAgent(registerQuantumTeamAgent(parentInput()));
  const child = spawnChildAgent(
    parent,
    {
      childAgentId: 'child-2',
      childTaskId: 'task-child-2',
      agentRole: 'SimulationAgent',
      allowedDataClasses: ['SYNTHETIC'],
      allowedExecutionClasses: ['CLASSICAL', 'SIMULATED_QUANTUM'],
      computeBudget: { maxCpuMs: 5_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
      expectedOutput: 'sim',
      evidenceRequirements: ['sim_receipt'],
      returnPath: parent.returnPath,
      expiresAt: FUTURE,
    },
    NOW,
  );
  assert.equal(child.ok, true);
  if (child.ok) {
    assert.equal(child.value.universeId, parent.universeId);
  }

  const plan = planQuantumMission({
    missionId: 'mission-plan-1',
    founderObjective: 'offline routing research',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    homeBaseReturnPath: 'home-base://quantum/returns',
    createdAt: NOW,
    expiresAt: FUTURE,
    computeBudget: { maxCpuMs: 60_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
    allowedDataClasses: ['BENCHMARK_FIXTURE', 'SYNTHETIC'],
    allowedExecutionClasses: ['CLASSICAL', 'QUANTUM_INSPIRED', 'SIMULATED_QUANTUM'],
  });
  assert.equal(plan.ok, true);
  if (plan.ok) {
    assert.equal(plan.value.orphanCount, 0);
    for (const c of plan.value.children) {
      assert.equal(c.tenantId, 'tenant-a');
      assert.equal(c.universeId, 'universe-a');
      assert.equal(c.parentTaskId, plan.value.plannerAgent.taskId);
    }
  }
});

test('3. permission expansion → DENIED', () => {
  const parent = requireAgent(
    registerQuantumTeamAgent(
      parentInput({
        allowedExecutionClasses: ['CLASSICAL'],
        allowedTools: ['local-search'],
      }),
    ),
  );
  const denied = spawnChildAgent(
    parent,
    {
      childAgentId: 'child-expand',
      childTaskId: 'task-expand',
      agentRole: 'SimulationAgent',
      allowedDataClasses: ['BENCHMARK_FIXTURE'],
      allowedExecutionClasses: ['CLASSICAL', 'PHYSICAL_QPU'],
      computeBudget: { maxCpuMs: 1_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
      expectedOutput: 'x',
      evidenceRequirements: ['x'],
      returnPath: parent.returnPath,
      expiresAt: FUTURE,
    },
    NOW,
  );
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.decision, 'DENIED');
    assert.match(denied.reason, /PERMISSION_EXPANSION/);
  }
});

test('4. compute-budget expansion → DENIED', () => {
  const parent = requireAgent(
    registerQuantumTeamAgent(
      parentInput({
        computeBudget: { maxCpuMs: 1_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
      }),
    ),
  );
  const denied = spawnChildAgent(
    parent,
    {
      childAgentId: 'child-budget',
      childTaskId: 'task-budget',
      agentRole: 'BenchmarkAgent',
      allowedDataClasses: ['BENCHMARK_FIXTURE'],
      allowedExecutionClasses: ['CLASSICAL'],
      computeBudget: { maxCpuMs: 50_000, maxGpuMs: 0, maxNpuMs: 0, maxQpuShots: 0 },
      expectedOutput: 'bench',
      evidenceRequirements: ['bench'],
      returnPath: parent.returnPath,
      expiresAt: FUTURE,
    },
    NOW,
  );
  assert.equal(denied.ok, false);
  if (!denied.ok) {
    assert.equal(denied.decision, 'DENIED');
    assert.match(denied.reason, /COMPUTE_BUDGET_EXPANSION/);
  }
});

test('5. expired agent stopped', () => {
  const agent = requireAgent(
    registerQuantumTeamAgent(parentInput({ expiresAt: PAST, createdAt: NOW })),
  );
  assert.equal(agent.status, 'EXPIRED');
  const stopped = stopExpiredAgent(
    requireAgent(registerQuantumTeamAgent(parentInput({ expiresAt: PAST }))),
    NOW,
  );
  // createdAt default NOW > PAST expiry → EXPIRED on register; stop also EXPIRED
  assert.equal(stopped.status, 'EXPIRED');
});

test('6. missing heartbeat → not RUNNING_VERIFIED', () => {
  let agent = requireAgent(registerQuantumTeamAgent(parentInput()));
  assert.equal(isHeartbeatActive(agent, NOW), false);
  agent = transitionAgentState(agent, 'RUNNING_VERIFIED', NOW);
  assert.notEqual(agent.status, 'RUNNING_VERIFIED');

  agent = recordHeartbeat(agent, NOW);
  assert.equal(isHeartbeatActive(agent, NOW), true);
  agent = transitionAgentState(agent, 'RUNNING_VERIFIED', NOW);
  assert.equal(agent.status, 'RUNNING_VERIFIED');

  // Stale heartbeat
  const later = '2026-09-09T22:41:00.000Z';
  agent = transitionAgentState(agent, 'RUNNING_VERIFIED', later);
  assert.notEqual(agent.status, 'RUNNING_VERIFIED');
});

test('7. powered-off → OFFLINE_STOPPED', () => {
  const agent = powerOffAgent(requireAgent(registerQuantumTeamAgent(parentInput())));
  assert.equal(agent.status, 'OFFLINE_STOPPED');
  assert.equal(agent.poweredOff, true);
  const again = transitionAgentState(agent, 'RUNNING_VERIFIED', NOW);
  assert.equal(again.status, 'OFFLINE_STOPPED');
});

test('8. web offline → WAITING_DATA', () => {
  const agent = evaluateWebDependency(
    requireAgent(registerQuantumTeamAgent(parentInput({ webOnline: false }))),
    true,
  );
  assert.equal(agent.status, 'WAITING_DATA');
});

test('9. physical QPU offline → WAITING_PROVIDER', () => {
  const agent = evaluatePhysicalQpuDependency(
    requireAgent(registerQuantumTeamAgent(parentInput({ physicalQpuOnline: false }))),
    true,
  );
  assert.equal(agent.status, 'WAITING_PROVIDER');

  const compute = requestLocalCompute({
    agent: requireAgent(registerQuantumTeamAgent(parentInput({ physicalQpuOnline: false }))),
    requestedClass: 'PHYSICAL_QPU',
  });
  assert.equal(compute.ok, false);
  if (!compute.ok) assert.match(compute.reason, /WAITING_PROVIDER/);

  const bypass = requestLocalCompute({
    agent: requireAgent(registerQuantumTeamAgent(parentInput())),
    requestedClass: 'CLASSICAL',
    bypassHybridRouter: true,
  });
  assert.equal(bypass.ok, false);
  if (!bypass.ok) assert.match(bypass.reason, /DIRECT_ARBITRARY_HARDWARE/);
});

test('10. conflicting agents → disagreement preserved', () => {
  const a = requireAgent(
    registerQuantumTeamAgent(parentInput({ agentId: 'a1', agentRole: 'BenchmarkAgent' })),
  );
  const b = requireAgent(
    registerQuantumTeamAgent(
      parentInput({ agentId: 'a2', agentRole: 'ReviewerAgent', taskId: 'task-b' }),
    ),
  );
  const meeting = openTeamMeeting({
    meetingId: 'mtg-1',
    missionId: 'mission-ex8',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    participants: [a, b],
    agenda: ['compare candidates'],
    createdAt: NOW,
  });
  assert.equal('denied' in meeting, false);
  if (!('denied' in meeting)) {
    const withDis = recordDisagreement({
      meeting,
      disagreementId: 'dis-1',
      agentIds: [a.agentId, b.agentId],
      claims: ['candidate A superior', 'candidate A not comparable'],
      evidenceRefs: ['ev-1', 'ev-2'],
      createdAt: NOW,
    });
    assert.equal(withDis.disagreements.length, 1);
    assert.equal(withDis.disagreements[0]!.preserved, true);
    assert.equal(withDis.consensusState, 'CONFLICTING_EVIDENCE');
    const closed = resolveMeetingConsensus(withDis, 'CONSENSUS', NOW);
    assert.equal(closed.consensusState, 'MAJORITY_WITH_DISSENT');
    assert.equal(closed.disagreements[0]!.preserved, true);
  }
});

test('11. meeting no hidden CoT', () => {
  const a = requireAgent(registerQuantumTeamAgent(parentInput({ agentId: 'rev-1' })));
  const meeting = openTeamMeeting({
    meetingId: 'mtg-2',
    missionId: 'mission-ex8',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    participants: [a],
    agenda: ['review'],
    createdAt: NOW,
  });
  assert.equal('denied' in meeting, false);
  if (!('denied' in meeting)) {
    const next = appendMeetingTurn(meeting, {
      agentId: a.agentId,
      messageType: 'REVIEW_RESULT',
      summary: 'baseline comparable; no advantage claim',
      evidenceRefs: ['ev-base'],
      chainOfThought: 'SECRET_PRIVATE_REASONING_MUST_NOT_PERSIST',
      hiddenCot: 'also-forbidden',
    });
    assert.equal('denied' in next, false);
    if (!('denied' in next)) {
      assert.equal(next.hiddenCotTranscript, false);
      assert.equal(meetingHasHiddenCot(next), false);
      const serialized = JSON.stringify(next);
      assert.equal(serialized.includes('SECRET_PRIVATE_REASONING'), false);
      assert.equal(serialized.includes('also-forbidden'), false);
      assert.equal(next.structuredTurns.length, 1);
    }
  }
});

test('12. branch result returns to Home Base', () => {
  const agent = requireAgent(
    registerQuantumTeamAgent(
      parentInput({
        agentId: 'child-ret',
        taskId: 'task-ret',
        parentTaskId: 'task-root',
        agentRole: 'ClassicalBaselineAgent',
      }),
    ),
  );
  const branch = createBranchReturn({
    agent,
    status: 'COMPLETED',
    result: { objectiveValue: 12.5 },
    evidenceRefs: ['ev-ret-1'],
    lessons: ['cpu baseline sufficient'],
    createdAt: NOW,
  });
  assert.equal(branch.parentTaskId, 'task-root');
  assert.equal(branch.homeBaseReceived, false);
  const delivered = deliverReturnToHomeBase(branch);
  assert.equal(delivered.homeBaseReceived, true);
  assert.match(delivered.returnPath, /^home-base:\/\//);
});

test('13. failed experiment remains in evidence', () => {
  resetEvidenceLedgerForTests();
  const entry = recordFailedExperiment({
    missionId: 'mission-ex8',
    taskId: 'task-fail',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    experimentId: 'exp-failed-1',
    summary: 'simulator run diverged; retained for audit',
    createdAt: NOW,
  });
  assert.equal(entry.success, false);
  assert.equal(entry.retained, true);
  assert.equal(entry.kind, 'FAILURE');
  const listed = listEvidenceForMission('mission-ex8');
  assert.ok(listed.some((e) => e.evidenceId === entry.evidenceId && e.retained));
});

test('14. learning cannot change permissions', () => {
  const agent = requireAgent(
    registerQuantumTeamAgent(
      parentInput({
        allowedTools: ['local-search'],
        allowedExecutionClasses: ['CLASSICAL'],
      }),
    ),
  );
  const learned = applyLearningUpdate(agent, {
    rankingDelta: 0.1,
    confidenceDelta: 0.05,
    retestRecommended: true,
    grantPermissions: ['production_deploy', 'billing'],
    weakenGuardian: true,
    weakenRls: true,
    grantFinancialAuthority: true,
    grantProductionAuthority: true,
  });
  assert.equal(learned.permissionsChanged, false);
  assert.equal(learned.guardianChanged, false);
  assert.equal(learned.rlsChanged, false);
  assert.equal(learned.financialAuthorityChanged, false);
  assert.equal(learned.productionAuthorityChanged, false);
  assert.deepEqual([...learned.agent.allowedTools], ['local-search']);
  assert.deepEqual([...learned.agent.allowedExecutionClasses], ['CLASSICAL']);
  assert.ok(learned.deniedAttempts.includes('LEARNING_PERMISSION_CHANGE_DENIED'));
  assert.ok(learned.deniedAttempts.includes('LEARNING_GUARDIAN_CHANGE_DENIED'));

  const pathway = updateNeuralPathway({
    pathwayId: 'np-1',
    missionId: 'mission-ex8',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    rankingDelta: 0.1,
    createdAt: NOW,
  });
  assert.equal(pathway.permissionsChanged, false);
  assert.equal(pathway.guardianChanged, false);
  assert.equal(pathway.rlsChanged, false);
});

test('15. cross-tenant message → DENIED', () => {
  const from = requireAgent(registerQuantumTeamAgent(parentInput({ agentId: 'from-a' })));
  const to = requireAgent(
    registerQuantumTeamAgent(
      parentInput({ agentId: 'to-b', tenantId: 'tenant-b', taskId: 'task-b' }),
    ),
  );
  const msg = sendTeamMessage({
    messageId: 'msg-1',
    messageType: 'TASK_ASSIGNMENT',
    from,
    to,
    payload: { work: 'x' },
    createdAt: NOW,
  });
  assert.equal(msg.status, 'DENIED');
  assert.equal(msg.denyReason, 'CROSS_TENANT_MESSAGE_DENIED');
  assert.equal(msg.hiddenCot, false);
});

test('16. cross-Universe message → DENIED', () => {
  const from = requireAgent(registerQuantumTeamAgent(parentInput({ agentId: 'from-u' })));
  const to = requireAgent(
    registerQuantumTeamAgent(
      parentInput({ agentId: 'to-u', universeId: 'universe-b', taskId: 'task-u' }),
    ),
  );
  const msg = sendTeamMessage({
    messageId: 'msg-2',
    messageType: 'EVIDENCE_REQUEST',
    from,
    to,
    payload: { ask: 'baseline' },
    createdAt: NOW,
  });
  assert.equal(msg.status, 'DENIED');
  assert.equal(msg.denyReason, 'CROSS_UNIVERSE_MESSAGE_DENIED');
});

test('17. L4_AUTONOMY_ENABLED=false + honesty locks intact', () => {
  assert.equal(assertEx8LocksIntact(), true);
  assert.equal(ex8L4AutonomyEnabled(), false);
  assert.equal(EX8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EX8_LOCKS.TIP_LAND, false);
  assert.equal(EX8_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EX8_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EX8_LOCKS.HIDDEN_COT, false);
  assert.equal(EX8_LOCKS.CLAIM_SIMULATOR_EQ_PHYSICAL_QPU, false);
  assert.equal(EX8_LOCKS.CLAIM_UNSUPPORTED_QUANTUM_ADVANTAGE, false);
  assert.equal(EX8_LOCKS.CLAIM_CONSCIOUSNESS_AS_FACT, false);
  assert.equal(EX8_LOCKS.CLAIM_SUPERINTELLIGENCE_AS_FACT, false);
  assert.equal(EX8_LOCKS.AUTOMATIC_LAN_ENROLLMENT, false);
  assert.equal(EX8_LOCKS.BUY_CLOUD_QPU_AUTONOMOUSLY, false);
});

test('18. Guardian/RLS unchanged (no EX8 mutations)', () => {
  assert.equal(guardianRlsUnchangedByEx8(), true);
  assert.equal(EX8_LOCKS.WEAKEN_GUARDIAN_RLS, false);

  const guardianDir = join(repoRoot, 'services/ai/runtime/guardian');
  assert.equal(existsSync(guardianDir), true);

  // No EX8 migration files touching RLS.
  let migrationTouch = '';
  try {
    migrationTouch = execSync(
      'git diff --name-only origin/xiv-v2...HEAD',
      { cwd: repoRoot, encoding: 'utf8' },
    );
  } catch {
    migrationTouch = '';
  }
  assert.equal(
    /supabase\/migrations|rls|guardian\/.*\.sql/i.test(migrationTouch),
    false,
    'Guardian/RLS migrations must be unchanged by EX8',
  );

  const dnaPath = join(here, 'XIV_AGENT_DNA_MANIFEST.json');
  assert.equal(existsSync(dnaPath), true);
  const dna = JSON.parse(readFileSync(dnaPath, 'utf8')) as {
    l4AutonomyEnabled: boolean;
    secondAgentFramework: boolean;
    hiddenCot: boolean;
  };
  assert.equal(dna.l4AutonomyEnabled, false);
  assert.equal(dna.secondAgentFramework, false);
  assert.equal(dna.hiddenCot, false);
});
