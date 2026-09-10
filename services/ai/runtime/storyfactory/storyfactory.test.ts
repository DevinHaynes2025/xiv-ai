import assert from 'node:assert/strict';
import { EXECUTION_GUARDRAILS, VIRTUAL_STORY_CAPACITY, assignStories, generateBatch } from './index';

const batch = generateBatch(1, 25);
assert.equal(batch.stories.length, 25);
assert.equal(batch.stories[0].id, 'XIV-US-00000001');
assert.equal(VIRTUAL_STORY_CAPACITY, 10_000_000);
assert.equal(EXECUTION_GUARDRAILS.productionAutoDeploy, false);
assert.equal(EXECUTION_GUARDRAILS.agentDebriefRequired, true);

const assignments = assignStories(batch.stories, [
  { agent: 'OLLAMA', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
  { agent: 'GROK', online: true, local: false, canNetwork: true, maxConcurrent: 10 },
  { agent: 'CHATGPT', online: true, local: false, canNetwork: true, maxConcurrent: 10 },
]);
assert.ok(assignments.length > 0);
assert.ok(assignments.some((a) => a.mode === 'LOCAL'));
assert.ok(assignments.every((a) => a.mode !== ('PRODUCTION' as never)));
console.log('XIV virtual story factory and agent debrief guardrails hold.');
