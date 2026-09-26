import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createXviHumanityContext,
} from './xvi-humanity-context';

function input() {
  return {
    conversationId:
      'conversation-001',

    language:
      'en-US',

    culturalContext:
      null,

    tone:
      'WARM' as const,

    emotionalCue:
      'JOY' as const,

    humorAppropriate:
      true,

    celebrationAppropriate:
      true,

    supportiveResponseAppropriate:
      true,

    confidence:
      0.85,

    observedAtMs:
      1_000_000,
  };
}

test('humanity context captures conversational cues', () => {
  const context =
    createXviHumanityContext(
      input(),
    );

  assert.equal(
    context.tone,
    'WARM',
  );

  assert.equal(
    context.emotionalCue,
    'JOY',
  );

  assert.match(
    context.contextDigest,
    /^[a-f0-9]{64}$/,
  );
});

test('identical context is deterministic', () => {
  const first =
    createXviHumanityContext(
      input(),
    );

  const second =
    createXviHumanityContext(
      input(),
    );

  assert.equal(
    first.contextDigest,
    second.contextDigest,
  );
});

test('changed emotional cue changes context identity', () => {
  const first =
    createXviHumanityContext(
      input(),
    );

  const second =
    createXviHumanityContext({
      ...input(),

      emotionalCue:
        'CURIOSITY',
    });

  assert.notEqual(
    first.contextDigest,
    second.contextDigest,
  );
});

test('grief context rejects celebratory behavior', () => {
  assert.throws(
    () =>
      createXviHumanityContext({
        ...input(),

        tone:
          'SUPPORTIVE',

        emotionalCue:
          'GRIEF',

        humorAppropriate:
          false,

        celebrationAppropriate:
          true,
      }),
    /XVI_HUMANITY_CONTEXT_REFUSED/,
  );
});

test('grief context can be supportive', () => {
  const context =
    createXviHumanityContext({
      ...input(),

      tone:
        'SUPPORTIVE',

      emotionalCue:
        'GRIEF',

      humorAppropriate:
        false,

      celebrationAppropriate:
        false,

      supportiveResponseAppropriate:
        true,
    });

  assert.equal(
    context.supportiveResponseAppropriate,
    true,
  );
});

test('confidence is bounded', () => {
  assert.throws(
    () =>
      createXviHumanityContext({
        ...input(),

        confidence:
          1.01,
      }),
    /XVI_HUMANITY_CONTEXT_REFUSED/,
  );
});

test('agents never claim inferred emotion is literal emotion', () => {
  const context =
    createXviHumanityContext(
      input(),
    );

  assert.equal(
    context.emotionIsInferred,
    true,
  );

  assert.equal(
    context.agentClaimsEmotion,
    false,
  );

  assert.equal(
    context.agentClaimsConsciousness,
    false,
  );
});

test('humanity layer carries no manipulation or impersonation authority', () => {
  const context =
    createXviHumanityContext(
      input(),
    );

  assert.equal(
    context.manipulativePersuasionAllowed,
    false,
  );

  assert.equal(
    context.impersonationAllowed,
    false,
  );

  assert.equal(
    context.externalActionAuthority,
    false,
  );

  assert.equal(
    context.productionAuthority,
    false,
  );
});

test('undeclared authority fails closed', () => {
  assert.throws(
    () =>
      createXviHumanityContext({
        ...input(),

        impersonationAllowed:
          true,
      } as never),
    /XVI_HUMANITY_CONTEXT_REFUSED/,
  );
});

test('humanity context is immutable', () => {
  const context =
    createXviHumanityContext(
      input(),
    );

  assert.equal(
    Object.isFrozen(context),
    true,
  );
});
