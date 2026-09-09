import assert from 'node:assert/strict';
import { test } from 'node:test';

import { claimKindForCategory, HUMAN_KNOWLEDGE_CATEGORIES, isElevatable } from '../human-knowledge';
import { codeOf } from './harness';
import { boardroomWorld, loadEvidence, openSupplierRoom } from './meeting-harness';

test('human input is filed as the kind of thing it actually is', () => {
  assert.equal(HUMAN_KNOWLEDGE_CATEGORIES.length, 6);

  // What someone saw can ground a decision. What someone thinks cannot.
  assert.equal(claimKindForCategory('HUMAN_OBSERVATION'), 'human_fact');
  assert.equal(claimKindForCategory('HUMAN_EXPERIENCE'), 'human_fact');
  assert.equal(claimKindForCategory('HUMAN_OPINION'), 'human_opinion');

  assert.equal(isElevatable('HUMAN_OBSERVATION'), true);
  assert.equal(isElevatable('HUMAN_CORRECTION'), true);
  assert.equal(isElevatable('HUMAN_OPINION'), false);
  assert.equal(isElevatable('HUMAN_APPROVAL'), false);
});

test('an opinion stays an opinion no matter who repeats it', () => {
  const world = boardroomWorld();

  const opinion = world.xiv.recordHumanKnowledge(world.founder, {
    category: 'HUMAN_OPINION',
    statement: 'Supplier B has always felt like the safer partner.',
  });

  assert.equal(opinion.elevatesToFact, false);
  assert.equal(claimKindForCategory(opinion.category), 'human_opinion');
  assert.equal(
    codeOf(() =>
      world.xiv.elevateToFact(world.founder, { recordId: opinion.id, justification: 'Everyone agrees.' }),
    ),
    'human_opinion_cannot_become_fact',
  );
});

test('an observation can be promoted, but only deliberately and by a supervisor', () => {
  const world = boardroomWorld();

  const observation = world.xiv.recordHumanKnowledge(world.analyst, {
    category: 'HUMAN_OBSERVATION',
    statement: 'Line two was down for six hours on 3 September.',
    context: 'Witnessed on the floor.',
  });
  assert.equal(observation.elevatesToFact, false);

  assert.equal(
    codeOf(() =>
      world.xiv.elevateToFact(world.analyst, {
        recordId: observation.id,
        justification: 'I saw it myself.',
      }),
    ),
    'tenancy_not_a_supervisor',
  );

  // Even a supervisor has to say why.
  assert.equal(
    codeOf(() => world.xiv.elevateToFact(world.founder, { recordId: observation.id, justification: '  ' })),
    'human_knowledge_requires_target',
  );

  const promoted = world.xiv.elevateToFact(world.founder, {
    recordId: observation.id,
    justification: 'Confirmed against the line telemetry.',
  });
  assert.equal(promoted.elevatesToFact, true);
  assert.equal(promoted.elevatedBy, world.founder.userId);

  const trail = world.xiv.auditTrail(world.founder).filter((e) => e.eventKind === 'human_knowledge_elevated');
  assert.equal(trail.length, 1);
});

test('a correction must name the evidence it corrects', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);
  const evidence = loadEvidence(world, meeting);

  assert.equal(
    codeOf(() =>
      world.xiv.recordHumanKnowledge(world.founder, {
        category: 'HUMAN_CORRECTION',
        statement: 'That figure is wrong.',
      }),
    ),
    'human_knowledge_requires_target',
  );

  const correction = world.xiv.recordHumanKnowledge(world.founder, {
    meetingId: meeting.id,
    category: 'HUMAN_CORRECTION',
    statement: 'The eighteen percent excludes the freight we already pay the incumbent.',
    correctsEvidenceId: evidence.cost.id,
  });
  assert.equal(correction.correctsEvidenceId, evidence.cost.id);

  // The original evidence is not rewritten. The correction sits beside it, so
  // the record still shows what the room believed at the time.
  const stored = world.xiv.reconstructMeeting(world.founder, meeting.id).evidence
    .find((item) => item.id === evidence.cost.id);
  assert.match(stored?.claim ?? '', /eighteen percent/);
});

test('a human can contribute context to a meeting they sit in, and only as themselves', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  const contribution = world.xiv.speak(world.founder, {
    meetingId: meeting.id,
    userId: world.founder.userId,
    messageKind: 'human_context',
    originalText: 'The plant manager has a standing relationship with the incumbent that the ledger does not show.',
  });
  assert.equal(contribution.speakerKind, 'human');
  assert.equal(contribution.speakerUserId, world.founder.userId);

  // A member who is not in the room cannot contribute to it.
  assert.equal(
    codeOf(() =>
      world.xiv.speak(world.analyst, {
        meetingId: meeting.id,
        userId: world.analyst.userId,
        originalText: 'Adding my thoughts.',
      }),
    ),
    'meeting_participant_unknown',
  );
});

test('a multilingual message keeps the original, the translation and the culture apart', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  const message = world.xiv.speak(world.founder, {
    meetingId: meeting.id,
    agentId: world.investigator.id,
    xarpRole: 'investigator',
    originalLanguage: 'ja',
    originalText: '第二ラインは六時間停止しました。',
    translatedText: 'The second line was down for six hours.',
    translationLanguage: 'en',
    interpretation: 'Reported through the plant manager rather than the supplier portal.',
    translationProvenance: { engine: 'xlin-v1', reviewed: false },
    culturalContext:
      'Reporting through a manager rather than the portal is routine at this plant and is not a signal of concealment.',
    factualClaim: 'Line two was down for six hours on 3 September.',
  });

  // Four separate fields, because collapsing them is how a translation becomes
  // a claim and a cultural note becomes a fact about a person.
  assert.equal(message.originalLanguage, 'ja');
  assert.equal(message.originalText, '第二ラインは六時間停止しました。');
  assert.equal(message.translationLanguage, 'en');
  assert.notEqual(message.interpretation, message.translatedText);
  assert.notEqual(message.culturalContext, message.factualClaim);

  // The original survives in the transcript rather than being replaced by the
  // English the executive happened to read.
  const stored = world.xiv.transcript(world.founder, meeting.id).find((item) => item.id === message.id);
  assert.equal(stored?.originalText, '第二ラインは六時間停止しました。');

  // A translation that does not say what it translated into is refused.
  assert.equal(
    codeOf(() =>
      world.xiv.speak(world.founder, {
        meetingId: meeting.id,
        agentId: world.investigator.id,
        xarpRole: 'investigator',
        originalText: '在庫は十分です。',
        translatedText: 'Inventory is sufficient.',
      }),
    ),
    'evidence_contract_incomplete',
  );
});

test('a meeting records the operating time it was held in, not only a timestamp', () => {
  const world = boardroomWorld();
  const meeting = openSupplierRoom(world);

  const context = world.xiv.reconstructMeeting(world.founder, meeting.id).temporalContext;
  assert.equal(context?.location, 'Osaka');
  assert.equal(context?.timeZone, 'Asia/Tokyo');
  // 20:00 UTC is 05:00 the following morning in Osaka, which is what stops an
  // agent recommending that somebody call the plant right now.
  assert.equal(context?.localTime, '05:00');
  assert.equal(context?.dayOfWeek, 'Wednesday');
  assert.equal(context?.organizationLifecycle, 'operational');
  assert.equal(context?.businessCycle, 'peak inbound season');
});
