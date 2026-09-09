import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ARCHITECTURE_SECURITY_LOCK,
  architectureQueueContext,
  getArchitectureStory,
  XIV_ARCHITECTURE_QUEUE,
} from './architecture-queue';

test('all architecture authority switches remain locked', () => {
  assert.ok(Object.values(ARCHITECTURE_SECURITY_LOCK).every((enabled) => enabled === false));
});

test('the queue has an explicit dependency chain through 62L', () => {
  assert.deepEqual(
    XIV_ARCHITECTURE_QUEUE.map((story) => story.id),
    ['2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L'],
  );
  assert.deepEqual(getArchitectureStory('2I-AI-62L')?.dependsOn, ['2I-AI-62K']);
  assert.ok(XIV_ARCHITECTURE_QUEUE.every((story) => story.status === 'queued'));
});

test('model context explicitly identifies queue entries as planning knowledge', () => {
  const context = architectureQueueContext();

  assert.match(context, /Planning knowledge only/);
  assert.match(context, /Never represent a queued capability as implemented or authorized/);
  assert.match(context, /AUTO_GUARDIAN_OVERRIDE/);
  assert.match(context, /2I-AI-62L/);
});
