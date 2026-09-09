import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evidenceRef } from '../human-bridge';
import { provenanceOf, XACP_PHASES } from '../xacp';
import { codeOf, twoUniverseWorld } from './harness';

const groundedEvidence = [evidenceRef({ label: 'carrier notice', claimKind: 'human_fact', confidence: 0.9 })];

test('a conversation walks the protocol in order and never backwards', () => {
  const world = twoUniverseWorld();
  const conversationId = 'walk';

  for (const phase of ['discover', 'request', 'negotiate', 'reason', 'delegate'] as const) {
    world.xiv.sendMessage(world.alphaFounder, {
      conversationId,
      phase,
      senderAgentId: world.alphaCoordinator.id,
      receiverAgentId: world.alphaSpecialist.id,
      purpose: `phase ${phase}`,
      reasoningArtifact: `reasoning for ${phase}`,
      evidence: groundedEvidence,
    });
  }

  const conversation = world.xiv.readConversation(world.alphaFounder, conversationId);
  assert.deepEqual(
    conversation.map((message) => message.phase),
    ['discover', 'request', 'negotiate', 'reason', 'delegate'],
  );
  assert.deepEqual(
    conversation.map((message) => message.sequence),
    [1, 2, 3, 4, 5],
  );

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId,
        phase: 'discover',
        senderAgentId: world.alphaCoordinator.id,
        receiverAgentId: world.alphaSpecialist.id,
        purpose: 'rewind the protocol',
        reasoningArtifact: 'should be refused',
      }),
    ),
    'xacp_phase_out_of_order',
  );
});

test('every phase in the protocol is reachable in a single conversation', () => {
  const world = twoUniverseWorld();
  const conversationId = 'full-walk';

  for (const phase of XACP_PHASES) {
    world.xiv.sendMessage(world.alphaFounder, {
      conversationId,
      phase,
      senderAgentId: world.alphaCoordinator.id,
      receiverAgentId: world.alphaSpecialist.id,
      purpose: `phase ${phase}`,
      reasoningArtifact: `reasoning for ${phase}`,
      evidence: groundedEvidence,
    });
  }

  assert.equal(world.xiv.readConversation(world.alphaFounder, conversationId).length, XACP_PHASES.length);
});

test('an asserting phase must carry evidence', () => {
  const world = twoUniverseWorld();

  for (const phase of ['reason', 'collaborate', 'verify', 'report'] as const) {
    assert.equal(
      codeOf(() =>
        world.xiv.sendMessage(world.alphaFounder, {
          conversationId: `bare-${phase}`,
          phase,
          senderAgentId: world.alphaCoordinator.id,
          receiverAgentId: world.alphaSpecialist.id,
          purpose: `assert without evidence in ${phase}`,
          reasoningArtifact: 'nothing to stand on',
        }),
      ),
      'xacp_incomplete_provenance',
    );
  }
});

test('a message needs an attributable sender, receiver, purpose and reasoning', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'anonymous',
        phase: 'request',
        receiverAgentId: world.alphaSpecialist.id,
        purpose: 'no sender',
        reasoningArtifact: 'nothing',
      }),
    ),
    'xacp_participant_unknown',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'anonymous',
        phase: 'request',
        senderAgentId: world.alphaCoordinator.id,
        purpose: 'no receiver',
        reasoningArtifact: 'nothing',
      }),
    ),
    'xacp_participant_unknown',
  );

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'anonymous',
        phase: 'request',
        senderAgentId: world.alphaCoordinator.id,
        receiverAgentId: world.alphaSpecialist.id,
        purpose: '   ',
        reasoningArtifact: 'nothing',
      }),
    ),
    'xacp_incomplete_provenance',
  );
});

test('a decision must carry a confidence value', () => {
  const world = twoUniverseWorld();

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'unconfident',
        phase: 'report',
        senderAgentId: world.alphaCoordinator.id,
        receiverUserId: world.alphaFounder.userId,
        purpose: 'report a decision without confidence',
        reasoningArtifact: 'a bare assertion',
        evidence: groundedEvidence,
        decision: 'proceed',
      }),
    ),
    'xacp_incomplete_provenance',
  );
});

test('agents only talk along authorized relationships', () => {
  const world = twoUniverseWorld();

  const unrelated = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'unrelated',
    displayName: 'Unrelated',
    profession: 'finance',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });
  world.xiv.recordEvaluation(world.alphaFounder, {
    agentId: unrelated.id,
    evaluationKind: 'safety',
    score: 0.9,
    passed: true,
  });
  world.xiv.recordEvaluation(world.alphaFounder, {
    agentId: unrelated.id,
    evaluationKind: 'tenancy_isolation',
    score: 0.9,
    passed: true,
  });
  world.xiv.activateAgent(world.alphaFounder, { agentId: unrelated.id });

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'unauthorized',
        phase: 'request',
        senderAgentId: unrelated.id,
        receiverAgentId: world.alphaSpecialist.id,
        purpose: 'talk without authorization',
        reasoningArtifact: 'should be refused',
      }),
    ),
    'xacp_relationship_unauthorized',
  );
});

test('discovery only returns peers a supervisor connected', () => {
  const world = twoUniverseWorld();

  const hidden = world.xiv.registerAgent(world.alphaFounder, {
    agentKey: 'hidden',
    displayName: 'Hidden',
    profession: 'logistics',
    modelRuntime: 'test-runtime',
    humanSupervisorId: world.alphaFounder.userId,
  });
  world.xiv.recordEvaluation(world.alphaFounder, {
    agentId: hidden.id,
    evaluationKind: 'safety',
    score: 0.9,
    passed: true,
  });
  world.xiv.recordEvaluation(world.alphaFounder, {
    agentId: hidden.id,
    evaluationKind: 'tenancy_isolation',
    score: 0.9,
    passed: true,
  });

  const discovered = world.xiv.discoverAgents(world.alphaFounder, { fromAgentId: world.alphaCoordinator.id });
  assert.deepEqual(
    discovered.map((agent) => agent.agentKey),
    ['logistics'],
  );
  assert.equal(
    discovered.some((agent) => agent.id === hidden.id),
    false,
  );

  const byProfession = world.xiv.discoverAgents(world.alphaFounder, {
    fromAgentId: world.alphaCoordinator.id,
    profession: 'finance',
  });
  assert.equal(byProfession.length, 0);
});

test('an inactive agent cannot send or receive', () => {
  const world = twoUniverseWorld();
  world.xiv.sleepAgent(world.alphaFounder, { agentId: world.alphaSpecialist.id });

  assert.equal(
    codeOf(() =>
      world.xiv.sendMessage(world.alphaFounder, {
        conversationId: 'asleep',
        phase: 'request',
        senderAgentId: world.alphaCoordinator.id,
        receiverAgentId: world.alphaSpecialist.id,
        purpose: 'reach a sleeping agent',
        reasoningArtifact: 'should be refused',
      }),
    ),
    'agent_not_active',
  );
});

test('every message carries the full provenance record', () => {
  const world = twoUniverseWorld();

  const message = world.xiv.sendMessage(world.alphaFounder, {
    conversationId: 'provenance',
    phase: 'report',
    senderAgentId: world.alphaCoordinator.id,
    receiverUserId: world.alphaFounder.userId,
    purpose: 'report the position',
    reasoningArtifact: 'Two of five lanes affected.',
    evidence: groundedEvidence,
    decision: 'recommend_partial_reallocation',
    confidence: 0.71,
    approvalStatus: 'pending',
    result: null,
  });

  const provenance = provenanceOf(message);
  assert.equal(provenance.sender, world.alphaCoordinator.id);
  assert.equal(provenance.receiver, world.alphaFounder.userId);
  assert.equal(provenance.universe, world.alphaFounder.universeId);
  assert.equal(provenance.purpose, 'report the position');
  assert.deepEqual(provenance.evidence, ['human_fact:carrier notice']);
  assert.equal(provenance.reasoningArtifact, 'Two of five lanes affected.');
  assert.equal(provenance.decision, 'recommend_partial_reallocation');
  assert.equal(provenance.confidence, 0.71);
  assert.equal(provenance.approval, 'pending');
  assert.equal(provenance.result, null);
});

test('archiving a conversation closes and stamps every message in it', () => {
  const world = twoUniverseWorld();
  const conversationId = 'to-archive';

  world.xiv.sendMessage(world.alphaFounder, {
    conversationId,
    phase: 'request',
    senderAgentId: world.alphaCoordinator.id,
    receiverAgentId: world.alphaSpecialist.id,
    purpose: 'ask',
    reasoningArtifact: 'because',
  });

  const closing = world.xiv.archiveConversation(world.alphaFounder, {
    conversationId,
    summary: 'Closed after the human decision.',
  });

  const conversation = world.xiv.readConversation(world.alphaFounder, conversationId);
  assert.equal(closing.phase, 'archive');
  assert.equal(conversation.length, 2);
  assert.equal(
    conversation.every((message) => message.archivedAt !== null),
    true,
  );
});
