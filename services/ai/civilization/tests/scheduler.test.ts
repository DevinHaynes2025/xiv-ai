import assert from 'node:assert/strict';
import { test } from 'node:test';

import { codeOf, twoUniverseWorld } from './harness';

test('a task that needs approval must state how it would be undone', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.queueTask(world.alphaFounder, {
        title: 'Reallocate suppliers',
        description: 'No rollback plan',
        requiresHumanApproval: true,
      }),
    ),
    'task_rollback_plan_missing',
  );
});

test('the scheduler holds an approval-gated task instead of running it', () => {
  const world = twoUniverseWorld();

  const task = world.xiv.queueTask(world.alphaFounder, {
    title: 'Reallocate suppliers',
    description: 'Move 15 percent of volume',
    assignedAgentId: world.alphaSpecialist.id,
    requiresHumanApproval: true,
    rollbackPlan: 'Restore the original allocation from the snapshot.',
    costEstimateMicroUsd: 100,
  });

  const result = world.xiv.runScheduler(world.alphaFounder);
  assert.equal(result.awaitingApproval.length, 1);
  assert.equal(result.scheduled.length, 0);
  assert.equal(result.awaitingApproval[0].id, task.id);
  assert.equal(result.awaitingApproval[0].status, 'awaiting_approval');

  assert.equal(codeOf(() => world.xiv.startTask(world.alphaFounder, { taskId: task.id })), 'task_not_approved');

  world.xiv.approveTask(world.alphaFounder, { taskId: task.id, note: 'approved' });
  const started = world.xiv.startTask(world.alphaFounder, { taskId: task.id });
  assert.equal(started.status, 'active');
  assert.equal(started.approvedBy, world.alphaFounder.userId);
});

test('the scheduler activates only what the governor allows and defers the rest', () => {
  const world = twoUniverseWorld();

  for (let index = 0; index < 5; index += 1) {
    world.xiv.queueTask(world.alphaFounder, {
      title: `task-${index}`,
      description: 'no approval needed',
      priority: index + 1,
      requiresHumanApproval: false,
      costEstimateMicroUsd: 10,
    });
  }

  const result = world.xiv.runScheduler(world.alphaFounder, { limit: 2 });
  assert.equal(result.scheduled.length, 2);
  assert.equal(result.deferred.length, 3);
  assert.deepEqual(
    result.scheduled.map((task) => task.title),
    ['task-0', 'task-1'],
  );
  assert.equal(result.maxActiveAgents, 3);
});

test('the queue itself is bounded', () => {
  const world = twoUniverseWorld();

  for (let index = 0; index < 10; index += 1) {
    world.xiv.queueTask(world.alphaFounder, {
      title: `task-${index}`,
      description: 'filler',
      requiresHumanApproval: false,
    });
  }

  assert.equal(
    codeOf(() =>
      world.xiv.queueTask(world.alphaFounder, {
        title: 'overflow',
        description: 'beyond the queue quota',
        requiresHumanApproval: false,
      }),
    ),
    'quota_task_queue_exceeded',
  );
});

test('cost is governed before work is queued and reported after it completes', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.queueTask(world.alphaFounder, {
        title: 'expensive',
        description: 'beyond the cost budget',
        requiresHumanApproval: false,
        costEstimateMicroUsd: 900_000,
      }),
    ),
    'quota_cost_exceeded',
  );

  const task = world.xiv.queueTask(world.alphaFounder, {
    title: 'affordable',
    description: 'inside the cost budget',
    assignedAgentId: world.alphaSpecialist.id,
    requiresHumanApproval: false,
    costEstimateMicroUsd: 120_000,
  });

  world.xiv.runScheduler(world.alphaFounder);
  world.xiv.startTask(world.alphaFounder, { taskId: task.id });
  world.xiv.completeTask(world.alphaFounder, {
    taskId: task.id,
    result: { reallocatedPercent: 15 },
    costActualMicroUsd: 118_400,
  });

  const telemetry = world.xiv.costTelemetry(world.alphaFounder);
  assert.equal(telemetry.consumedCostMicroUsd, 118_400);
  assert.equal(telemetry.maxCostMicroUsd, 500_000);
  assert.equal(telemetry.remainingMicroUsd, 381_600);
  assert.equal(telemetry.completedTasks, 1);
  assert.deepEqual(telemetry.byAgent, [
    { agentId: world.alphaSpecialist.id, agentKey: 'logistics', costMicroUsd: 118_400 },
  ]);

  const costEvent = world.xiv
    .auditTrail(world.alphaFounder)
    .find((event) => event.eventKind === 'task_completed');
  assert.equal(costEvent?.costMicroUsd, 118_400);
});

test('the governor blocks a still-queued task once real spend overtakes the budget', () => {
  const world = twoUniverseWorld();

  const first = world.xiv.queueTask(world.alphaFounder, {
    title: 'first',
    description: 'consumes most of the budget',
    priority: 1,
    requiresHumanApproval: false,
    costEstimateMicroUsd: 400_000,
  });
  const second = world.xiv.queueTask(world.alphaFounder, {
    title: 'second',
    description: 'affordable at the time it was queued',
    priority: 2,
    requiresHumanApproval: false,
    costEstimateMicroUsd: 60_000,
  });

  const firstPass = world.xiv.runScheduler(world.alphaFounder, { limit: 1 });
  assert.deepEqual(firstPass.scheduled.map((task) => task.id), [first.id]);
  assert.deepEqual(firstPass.deferred.map((task) => task.id), [second.id]);

  world.xiv.startTask(world.alphaFounder, { taskId: first.id });
  world.xiv.completeTask(world.alphaFounder, { taskId: first.id, result: {}, costActualMicroUsd: 460_000 });

  // The first task overran its estimate, so the second no longer fits.
  const secondPass = world.xiv.runScheduler(world.alphaFounder);
  assert.deepEqual(secondPass.scheduled, []);
  assert.deepEqual(secondPass.deferred.map((task) => task.id), [second.id]);
  assert.equal(world.xiv.listTasks(world.alphaFounder).find((task) => task.id === second.id)?.status, 'blocked');
});

test('rollback is a stated procedure recorded in the audit trail', () => {
  const world = twoUniverseWorld();

  const task = world.xiv.queueTask(world.alphaFounder, {
    title: 'Reallocate suppliers',
    description: 'Move 15 percent of volume',
    assignedAgentId: world.alphaSpecialist.id,
    requiresHumanApproval: true,
    rollbackPlan: 'Restore the original lane allocation and notify both carriers.',
    costEstimateMicroUsd: 100,
  });

  world.xiv.runScheduler(world.alphaFounder);
  world.xiv.approveTask(world.alphaFounder, { taskId: task.id });
  world.xiv.startTask(world.alphaFounder, { taskId: task.id });
  world.xiv.completeTask(world.alphaFounder, { taskId: task.id, result: { reallocatedPercent: 15 } });

  const rolledBack = world.xiv.rollbackTask(world.alphaFounder, {
    taskId: task.id,
    reason: 'The secondary carrier missed its first collection.',
  });

  assert.equal(rolledBack.status, 'rolled_back');
  assert.ok(rolledBack.rolledBackAt);

  const event = world.xiv.auditTrail(world.alphaFounder).find((item) => item.eventKind === 'task_rolled_back');
  assert.equal(event?.decision, 'rolled_back');
  assert.equal(event?.detail.rollbackPlan, 'Restore the original lane allocation and notify both carriers.');
});

test('a task force forms around a human and archives when it is done', () => {
  const world = twoUniverseWorld();

  const taskForce = world.xiv.formTaskForce(world.alphaFounder, {
    name: 'Supply Chain Crisis Task Force',
    purpose: 'Respond to a port closure',
    humanExecutiveId: world.alphaFounder.userId,
    memberAgentIds: [world.alphaCoordinator.id, world.alphaSpecialist.id],
  });

  assert.equal(taskForce.status, 'active');
  assert.equal(taskForce.memberAgentIds.length, 2);

  world.xiv.recordRecommendation(world.alphaFounder, {
    taskForceId: taskForce.id,
    recommendation: {
      situation: 'Two of five inbound lanes are closed.',
      evidence: ['carrier notice'],
      alternatives: ['reallocate', 'hold', 'expedite by air'],
      risk: 'Higher single-carrier dependency.',
      recommendation: 'Reallocate 15 percent of volume.',
      requiredApproval: 'Human executive approval.',
    },
  });

  const dissolved = world.xiv.dissolveTaskForce(world.alphaFounder, { taskForceId: taskForce.id });
  assert.equal(dissolved.status, 'archived');
  assert.ok(dissolved.dissolvedAt);
  assert.ok(dissolved.recommendation);
});

test('a task force cannot be formed from an agent in another universe', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.formTaskForce(world.alphaFounder, {
        name: 'Cross universe force',
        purpose: 'should be refused',
        humanExecutiveId: world.alphaFounder.userId,
        memberAgentIds: [world.alphaCoordinator.id, world.betaCoordinator.id],
      }),
    ),
    'tenancy_cross_universe_blocked',
  );
});
