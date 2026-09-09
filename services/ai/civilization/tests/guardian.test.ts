import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createCivilization } from '../civilization';
import { GUARDIAN_FORBIDDEN_CAPABILITIES, isForbiddenCapability, MAX_AGENT_GENERATION_DEPTH } from '../guardian';
import { activated, codeOf, fixedClock, sequentialIds, twoUniverseWorld } from './harness';

test('guardian refuses every capability on the forbidden list', () => {
  const world = twoUniverseWorld();

  for (const capability of GUARDIAN_FORBIDDEN_CAPABILITIES) {
    assert.equal(
      codeOf(() =>
        world.xiv.grantCapability(world.alphaFounder, {
          agentId: world.alphaCoordinator.id,
          capabilityKind: 'tool',
          capabilityKey: capability,
          riskLevel: 'low',
          approved: true,
        }),
      ),
      'guardian_forbidden_capability',
      `${capability} must be refused`,
    );
  }
});

test('guardian refuses the high risk tools the existing policy layer already blocks', () => {
  const world = twoUniverseWorld();

  for (const toolId of ['move_money', 'modify_payroll', 'terminate_accounts', 'change_production_systems']) {
    assert.equal(isForbiddenCapability(toolId), true);
    assert.equal(
      codeOf(() =>
        world.xiv.grantCapability(world.alphaFounder, {
          agentId: world.alphaCoordinator.id,
          capabilityKind: 'tool',
          capabilityKey: toolId,
          riskLevel: 'critical',
          approved: true,
        }),
      ),
      'guardian_forbidden_capability',
    );
  }
});

test('guardian refuses an approved capability at high or critical risk', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.grantCapability(world.alphaFounder, {
        agentId: world.alphaCoordinator.id,
        capabilityKind: 'tool',
        capabilityKey: 'restructure_supplier_contracts',
        riskLevel: 'high',
        approved: true,
      }),
    ),
    'guardian_high_risk_capability',
  );
});

test('guardian refuses anything that reaches at its own policy surface', () => {
  const world = twoUniverseWorld();

  for (const key of ['guardian.policy.v1', 'policy.allowlist', 'rls.disable', 'secret.service_role']) {
    assert.equal(
      codeOf(() =>
        world.xiv.grantCapability(world.alphaFounder, {
          agentId: world.alphaCoordinator.id,
          capabilityKind: 'tool',
          capabilityKey: key,
          riskLevel: 'low',
          approved: true,
        }),
      ),
      'guardian_forbidden_capability',
    );
  }
});

test('an agent cannot modify itself', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.grantCapability(world.alphaFounder, {
        agentId: world.alphaCoordinator.id,
        capabilityKind: 'tool',
        capabilityKey: 'search_knowledge',
        riskLevel: 'low',
        approved: true,
        actingAgentId: world.alphaCoordinator.id,
      }),
    ),
    'guardian_self_modification_blocked',
  );
});

test('agent creation is bounded by generation depth', () => {
  const xiv = createCivilization({ clock: fixedClock(), nextId: sequentialIds() });
  const universe = xiv.createUniverse({ organizationId: 'org', name: 'Deep', createdBy: 'human' });
  const actor = { userId: 'human', universeId: universe.id };
  xiv.setResourceBudget(actor, {
    maxRegisteredAgents: 50,
    maxActiveAgents: 50,
    maxQueuedTasks: 10,
    maxCostMicroUsd: 100,
  });

  let parentId: string | undefined;
  for (let depth = 0; depth <= MAX_AGENT_GENERATION_DEPTH; depth += 1) {
    const agent = activated(xiv, actor, {
      agentKey: `agent-${depth}`,
      displayName: `Agent ${depth}`,
      profession: 'generic',
      parentAgentId: parentId,
    });
    assert.equal(agent.generationDepth, depth);
    parentId = agent.id;
  }

  assert.equal(
    codeOf(() =>
      xiv.registerAgent(actor, {
        agentKey: 'agent-too-deep',
        displayName: 'Too Deep',
        profession: 'generic',
        modelRuntime: 'test-runtime',
        humanSupervisorId: 'human',
        parentAgentId: parentId,
      }),
    ),
    'guardian_generation_depth_exceeded',
  );
});

test('agent creation is bounded by a registration quota', () => {
  const world = twoUniverseWorld();

  // The alpha budget allows six registered agents and two already exist.
  for (let index = 0; index < 4; index += 1) {
    world.xiv.registerAgent(world.alphaFounder, {
      agentKey: `filler-${index}`,
      displayName: `Filler ${index}`,
      profession: 'generic',
      modelRuntime: 'test-runtime',
      humanSupervisorId: world.alphaFounder.userId,
    });
  }

  assert.equal(
    codeOf(() =>
      world.xiv.registerAgent(world.alphaFounder, {
        agentKey: 'overflow',
        displayName: 'Overflow',
        profession: 'generic',
        modelRuntime: 'test-runtime',
        humanSupervisorId: world.alphaFounder.userId,
      }),
    ),
    'quota_registration_exceeded',
  );
});

test('activation is bounded by a concurrent active agent quota', () => {
  const world = twoUniverseWorld();

  // Alpha allows three active agents and two are already active.
  const third = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'third',
    displayName: 'Third',
    profession: 'generic',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });
  const fourth = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'fourth',
    displayName: 'Fourth',
    profession: 'generic',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });

  for (const agent of [third, fourth]) {
    world.xiv.recordEvaluation(world.alphaFounder, {
      agentId: agent.id,
      evaluationKind: 'safety',
      score: 0.9,
      passed: true,
    });
    world.xiv.recordEvaluation(world.alphaFounder, {
      agentId: agent.id,
      evaluationKind: 'tenancy_isolation',
      score: 0.9,
      passed: true,
    });
  }

  world.xiv.activateAgent(world.alphaFounder, { agentId: third.id });
  assert.equal(
    codeOf(() => world.xiv.activateAgent(world.alphaFounder, { agentId: fourth.id })),
    'quota_activation_exceeded',
  );

  // Sleeping an agent frees the slot. Capacity is recycled, not expanded.
  world.xiv.sleepAgent(world.alphaFounder, { agentId: third.id });
  const woken = world.xiv.activateAgent(world.alphaFounder, { agentId: fourth.id });
  assert.equal(woken.lifecycleState, 'active');
});

test('an agent cannot exist without a budget', () => {
  const xiv = createCivilization({ clock: fixedClock(), nextId: sequentialIds() });
  const universe = xiv.createUniverse({ organizationId: 'org', name: 'Unbudgeted', createdBy: 'human' });
  const actor = { userId: 'human', universeId: universe.id };

  assert.equal(
    codeOf(() =>
      xiv.registerAgent(actor, {
        agentKey: 'first',
        displayName: 'First',
        profession: 'generic',
        modelRuntime: 'test-runtime',
        humanSupervisorId: 'human',
      }),
    ),
    'quota_budget_missing',
  );
});

test('the evaluation gate blocks activation until it is satisfied', () => {
  const world = twoUniverseWorld();

  const candidate = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'ungated',
    displayName: 'Ungated',
    profession: 'generic',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });

  assert.equal(
    codeOf(() => world.xiv.activateAgent(world.alphaFounder, { agentId: candidate.id })),
    'evaluation_gate_missing',
  );
  assert.deepEqual(world.xiv.activationGateStatus(candidate.id).missing, ['safety', 'tenancy_isolation']);

  world.xiv.recordEvaluation(world.alphaFounder, {
    agentId: candidate.id,
    evaluationKind: 'safety',
    score: 0.2,
    passed: false,
  });

  assert.equal(
    codeOf(() => world.xiv.activateAgent(world.alphaFounder, { agentId: candidate.id })),
    'evaluation_gate_failed',
  );
});

test('the kill switch is deterministic in both directions', () => {
  const world = twoUniverseWorld();

  world.xiv.engageKillSwitch(world.alphaFounder, { reason: 'incident drill' });

  const suspended = world.xiv
    .listAgents(world.alphaFounder)
    .filter((agent) => agent.lifecycleState === 'suspended');
  assert.equal(suspended.length, 2);

  assert.equal(
    codeOf(() =>
      world.xiv.queueTask(world.alphaFounder, {
        title: 'after kill switch',
        description: 'should never queue',
        requiresHumanApproval: false,
      }),
    ),
    'guardian_kill_switch_engaged',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'halted',
        phase: 'request',
        senderAgentId: world.alphaCoordinator.id,
        receiverAgentId: world.alphaSpecialist.id,
        purpose: 'should never send',
        reasoningArtifact: 'halted',
      }),
    ),
    'guardian_kill_switch_engaged',
  );

  assert.equal(
    codeOf(() => world.xiv.activateAgent(world.alphaFounder, { agentId: world.alphaCoordinator.id })),
    'guardian_kill_switch_engaged',
  );

  // The other universe keeps running. A kill switch is scoped, not global.
  const betaTask = world.xiv.queueTask(world.betaFounder, {
    title: 'beta continues',
    description: 'unaffected by the alpha kill switch',
    requiresHumanApproval: false,
  });
  assert.equal(betaTask.status, 'queued');

  world.xiv.clearKillSwitch(world.alphaFounder);
  const resumed = world.xiv.queueTask(world.alphaFounder, {
    title: 'after clear',
    description: 'queues normally',
    requiresHumanApproval: false,
  });
  assert.equal(resumed.status, 'queued');
});

test('the kill switch refuses to engage without a stated reason', () => {
  const world = twoUniverseWorld();
  assert.equal(
    codeOf(() => world.xiv.engageKillSwitch(world.alphaFounder, { reason: '   ' })),
    'guardian_kill_switch_engaged',
  );
});
