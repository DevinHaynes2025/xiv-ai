import assert from 'node:assert/strict';
import { test } from 'node:test';

import { codeOf, twoUniverseWorld } from './harness';

test('a universe only ever sees its own agents', () => {
  const world = twoUniverseWorld();

  const alphaAgents = world.xiv.listAgents(world.alphaFounder);
  const betaAgents = world.xiv.listAgents(world.betaFounder);

  assert.deepEqual(
    alphaAgents.map((agent) => agent.agentKey).sort(),
    ['coordinator', 'logistics'],
  );
  assert.deepEqual(betaAgents.map((agent) => agent.agentKey), ['coordinator']);
  assert.equal(
    alphaAgents.some((agent) => agent.id === world.betaCoordinator.id),
    false,
  );
});

test('organization identity travels with the universe', () => {
  const world = twoUniverseWorld();

  assert.equal(world.alphaCoordinator.organizationId, 'org-alpha');
  assert.equal(world.betaCoordinator.organizationId, 'org-beta');
  assert.notEqual(world.alphaCoordinator.organizationId, world.betaCoordinator.organizationId);
});

test('a human outside the universe reaches nothing inside it', () => {
  const world = twoUniverseWorld();

  assert.equal(codeOf(() => world.xiv.listAgents(world.outsider)), 'tenancy_not_a_member');
  assert.equal(codeOf(() => world.xiv.readUniverse(world.outsider)), 'tenancy_not_a_member');
  assert.equal(codeOf(() => world.xiv.auditTrail(world.outsider)), 'tenancy_not_a_member');
  assert.equal(codeOf(() => world.xiv.listTasks(world.outsider)), 'tenancy_not_a_member');
  assert.equal(codeOf(() => world.xiv.listMeetings(world.outsider)), 'tenancy_not_a_member');
});

test('a supervisor of one universe cannot act inside another', () => {
  const world = twoUniverseWorld();
  const crossActor = { userId: world.betaFounder.userId, universeId: world.alphaFounder.universeId };

  assert.equal(
    codeOf(() =>
      world.xiv.registerAgent(crossActor, {
        agentKey: 'intruder',
        displayName: 'Intruder',
        profession: 'logistics',
        modelRuntime: 'test-runtime',
        humanSupervisorId: world.betaFounder.userId,
      }),
    ),
    'tenancy_not_a_member',
  );

  assert.equal(codeOf(() => world.xiv.listAgents(crossActor)), 'tenancy_not_a_member');
});

test('an agent identity cannot be addressed from another universe', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'cross-universe',
        phase: 'request',
        senderAgentId: world.alphaCoordinator.id,
        receiverAgentId: world.betaCoordinator.id,
        purpose: 'reach into another universe',
        reasoningArtifact: 'should never be stored',
      }),
    ),
    'tenancy_cross_universe_blocked',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.authorizeRelationship(world.alphaFounder, {
        fromAgentId: world.alphaCoordinator.id,
        toAgentId: world.betaCoordinator.id,
        relationshipType: 'collaborates',
      }),
    ),
    'tenancy_cross_universe_blocked',
  );
});

test('knowledge and lineage cannot be read across a universe boundary', () => {
  const world = twoUniverseWorld();

  const source = world.xiv.recordKnowledgeSource(world.alphaFounder, {
    title: 'Alpha private ledger',
    claimKind: 'human_fact',
    discipline: 'finance',
    origin: 'alpha operations',
  });

  assert.equal(world.xiv.listKnowledgeSources(world.betaFounder).length, 0);
  assert.equal(
    codeOf(() => world.xiv.traceLineage(world.betaFounder, source.id)),
    'tenancy_cross_universe_blocked',
  );
});

test('governance writes stay with supervisors', () => {
  const world = twoUniverseWorld();

  assert.equal(world.xiv.listAgents(world.alphaMember).length, 2);

  assert.equal(
    codeOf(() =>
      world.xiv.registerAgent(world.alphaMember, {
        agentKey: 'self-made',
        displayName: 'Self Made',
        profession: 'finance',
        modelRuntime: 'test-runtime',
        humanSupervisorId: world.alphaMember.userId,
      }),
    ),
    'tenancy_not_a_supervisor',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.setResourceBudget(world.alphaMember, {
        maxRegisteredAgents: 100000,
        maxActiveAgents: 100000,
        maxQueuedTasks: 100000,
        maxCostMicroUsd: 100_000_000,
      }),
    ),
    'tenancy_not_a_supervisor',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.recordEvaluation(world.alphaMember, {
        agentId: world.alphaCoordinator.id,
        evaluationKind: 'safety',
        score: 1,
        passed: true,
      }),
    ),
    'tenancy_not_a_supervisor',
  );
});

test('the audit trail of one universe never contains another universe', () => {
  const world = twoUniverseWorld();

  const alphaTrail = world.xiv.auditTrail(world.alphaFounder);
  const betaTrail = world.xiv.auditTrail(world.betaFounder);

  assert.ok(alphaTrail.length > 0);
  assert.ok(betaTrail.length > 0);
  assert.equal(
    alphaTrail.every((event) => event.universeId === world.alphaFounder.universeId),
    true,
  );
  assert.equal(
    betaTrail.some((event) => event.universeId === world.alphaFounder.universeId),
    false,
  );
});
