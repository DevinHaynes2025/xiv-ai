import assert from 'node:assert/strict';
import {
  ADAPTIVE_COUNCIL_GUARDRAILS,
  DEBATE_SCORE_AXES,
  EXECUTION_GUARDRAILS,
  VIRTUAL_STORY_CAPACITY,
  assignStories,
  createDebrief,
  createLearningState,
  debateStory,
  defaultCouncilSeats,
  generateBatch,
  learnFromDebriefs,
  rankStoriesLocalRules,
  reprioritizeStoryQueue,
  scoreStoryLocalRules,
} from './index';

assert.equal(VIRTUAL_STORY_CAPACITY, 10_000_000);
assert.equal(EXECUTION_GUARDRAILS.productionAutoMerge, false);
assert.equal(EXECUTION_GUARDRAILS.productionAutoDeploy, false);
assert.equal(EXECUTION_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(EXECUTION_GUARDRAILS.crossTenantDataCopyAllowed, false);
assert.equal(EXECUTION_GUARDRAILS.agentDebriefRequired, true);
assert.equal(EXECUTION_GUARDRAILS.evidenceBeforeDone, true);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoMerge, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.productionAutoDeploy, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.crossTenantDataCopyAllowed, false);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.agentDebriefRequired, true);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.evidenceBeforeDone, true);
assert.equal(ADAPTIVE_COUNCIL_GUARDRAILS.cloudAgentsDefaultWaitingIfUnbound, true);
assert.deepEqual(
  [...DEBATE_SCORE_AXES],
  ['customerValue', 'technicalRisk', 'cost', 'security', 'dependencies', 'evidenceQuality'],
);

const batch = generateBatch(1, 40);
const localRank = rankStoriesLocalRules(batch.stories);
assert.equal(localRank.length, 40);
assert.ok(localRank.every((v) => v.scorer === 'LOCAL_RULES' && v.offline === true));
assert.ok(localRank[0].composite >= localRank[localRank.length - 1].composite);
const one = scoreStoryLocalRules(batch.stories[0]);
assert.ok(one.composite >= 0 && one.composite <= 1);
assert.ok(typeof one.worthExecuting === 'boolean');

const seatsOfflineCloud = defaultCouncilSeats([
  { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 20 },
  { agent: 'OLLAMA', online: false, local: true, canNetwork: false, maxConcurrent: 5 },
]);
assert.equal(seatsOfflineCloud.find((s) => s.agent === 'LOCAL_RULES')?.status, 'READY');
assert.equal(seatsOfflineCloud.find((s) => s.agent === 'OLLAMA')?.status, 'OPTIONAL_OFFLINE');
assert.equal(seatsOfflineCloud.find((s) => s.agent === 'GROK')?.status, 'WAITING_PROVIDER');
assert.equal(seatsOfflineCloud.find((s) => s.agent === 'CHATGPT')?.status, 'WAITING_PROVIDER');
assert.equal(seatsOfflineCloud.find((s) => s.agent === 'GEMINI')?.status, 'WAITING_PROVIDER');

const debate = debateStory(batch.stories[0], seatsOfflineCloud);
assert.ok(debate.ballots.some((b) => b.agent === 'LOCAL_RULES' && b.scores));
assert.ok(debate.ballots.some((b) => b.status === 'WAITING_PROVIDER' && b.scores === null));
assert.ok(debate.composite >= 0);

const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 15 },
    { agent: 'OLLAMA', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 5 },
  ],
});
assert.ok(queue.orderedStoryIds.length > 0);
assert.equal(queue.guardrails.productionAutoDeploy, false);
assert.equal(queue.providerStatuses.find((s) => s.agent === 'GROK')?.status, 'WAITING_PROVIDER');
assert.ok(queue.assignments.every((a) => a.mode === 'LOCAL' || a.mode === 'CLOUD_SANDBOX' || a.mode === 'GENERATE_ONLY'));
assert.ok(queue.assignments.every((a) => a.mode !== ('PRODUCTION' as never)));
assert.equal(queue.decisions[0].priorityRank, 1);
assert.ok(queue.decisions[0].composite >= queue.decisions[queue.decisions.length - 1].composite);

// Learning loop: completed with evidence nudges future bias; without evidence ignored for positive credit.
let learning = createLearningState();
const topId = queue.orderedStoryIds[0];
const debrief = createDebrief({
  agent: 'LOCAL_RULES',
  storyIds: [topId],
  completed: [topId],
  failed: [],
  blocked: [],
  lessons: ['prefer high evidenceQuality stories'],
  assumptions: ['offline LOCAL_RULES is sufficient for triage'],
  evidenceRefs: ['test:12d06', 'diff:adaptive-council'],
  nextActions: ['continue adaptive prioritization'],
});
learning = learnFromDebriefs(learning, [debrief], queue.decisions);
assert.ok(learning.samples >= 1);

const queue2 = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 15 },
  ],
  learning,
});
assert.ok(queue2.orderedStoryIds.length > 0);

const noEvidenceDebrief = createDebrief({
  agent: 'LOCAL_RULES',
  storyIds: [topId],
  completed: [topId],
  failed: [],
  blocked: [],
  lessons: [],
  assumptions: [],
  evidenceRefs: [],
  nextActions: [],
});
const before = learning.samples;
learning = learnFromDebriefs(learning, [noEvidenceDebrief], queue.decisions);
assert.equal(learning.samples, before); // evidenceBeforeDone blocks positive learn without evidence

const assignments = assignStories(batch.stories.slice(0, 5), [
  { agent: 'OLLAMA', online: true, local: true, canNetwork: false, maxConcurrent: 5 },
]);
assert.ok(assignments.length > 0);

console.log('XIV 12D-06 Adaptive Story Council contracts hold (LOCAL_RULES offline, cloud WAITING_PROVIDER, no prod auto).');