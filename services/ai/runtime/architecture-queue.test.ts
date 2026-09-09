/**
 * XIV Architecture Queue — 62I / 62J / 62K upload into the brain.
 * Deterministic. No network. Queued architecture never becomes implemented or unlocked by this test.
 */
import assert from 'node:assert/strict';

import * as contextFreshness from './context/adapters/freshness';
import * as contextTypes from './context/adapters/types';
import * as ecosystemTaskforce from './ecosystem/taskforce';
import * as foundationsAlgorithms from './foundations/algorithms';
import * as foundationsCompute from './foundations/compute';
import * as foundationsSupplyChain from './foundations/supply-chain';
import * as foundryTypes from './foundry/types';
import * as knowledgeBoards from './knowledge/boards';
import * as knowledgeFoundry from './knowledge/foundry';
import * as knowledgeLoop from './knowledge/loop';
import * as learningEngine from './learning/engine';
import * as learningFeedback from './learning/feedback';
import * as learningOutcomes from './learning/outcomes';
import * as neuralAgents from './neural/agents';
import * as neuralCompute from './neural/compute';
import * as neuralData from './neural/data';
import * as neuralDeployment from './neural/deployment';
import * as neuralDeveloper from './neural/developer';
import * as neuralFabric from './neural/fabric';
import * as neuralFeedback from './neural/feedback';
import * as neuralMinds from './neural/minds';
import * as neuralPipelines from './neural/pipelines';
import * as neuralSimulation from './neural/simulation';
import * as opsbrainForceEngine from './opsbrain/force-engine';
import * as planetaryFoundry from './planetary/foundry';
import * as planetaryVaults from './planetary/vaults';
import * as sovereignNight from './sovereign/night';
import {
  QUEUE_ORDER,
  SECURITY_LOCK_FLAGS,
  XIV_ARCHITECTURE_QUEUE,
  advanceQueue,
  connectNeuralPathways,
  currentQueueStory,
  documentationChangesQueueState,
  evaluateQueueEvidence,
  evaluateQueueLimit,
  expectedSecurityVerdict,
  getQueuedStory,
  limitExceededIncreasesLimit,
  neuralPathwayGrantsAuthority,
  nextQueueStory,
  preflightState,
  previousQueueStory,
  queueAdvancement,
  queuedArchitectureAuthorizesMigration,
  securityLockEngaged,
  unlockSecurityFlag,
  uploadQueueToBrain,
} from './queue';
import { boundedAutonomyEnabled } from './authority';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const RUNTIME_MODULES: Record<string, Record<string, unknown>> = {
  'context/adapters/freshness': contextFreshness,
  'context/adapters/types': contextTypes,
  'ecosystem/taskforce': ecosystemTaskforce,
  'foundations/algorithms': foundationsAlgorithms,
  'foundations/compute': foundationsCompute,
  'foundations/supply-chain': foundationsSupplyChain,
  'foundry/types': foundryTypes,
  'knowledge/boards': knowledgeBoards,
  'knowledge/foundry': knowledgeFoundry,
  'knowledge/loop': knowledgeLoop,
  'learning/engine': learningEngine,
  'learning/feedback': learningFeedback,
  'learning/outcomes': learningOutcomes,
  'neural/agents': neuralAgents,
  'neural/compute': neuralCompute,
  'neural/data': neuralData,
  'neural/deployment': neuralDeployment,
  'neural/developer': neuralDeveloper,
  'neural/fabric': neuralFabric,
  'neural/feedback': neuralFeedback,
  'neural/minds': neuralMinds,
  'neural/pipelines': neuralPipelines,
  'neural/simulation': neuralSimulation,
  'opsbrain/force-engine': opsbrainForceEngine,
  'planetary/foundry': planetaryFoundry,
  'planetary/vaults': planetaryVaults,
  'sovereign/night': sovereignNight,
};

test('queue contains 62I, 62J, 62K and the 62L preview in linear order', () => {
  assert.deepEqual(QUEUE_ORDER, ['2I-AI-62H', '2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L']);
  assert.deepEqual(
    XIV_ARCHITECTURE_QUEUE.map((story) => story.storyId),
    ['2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L'],
  );
  assert.equal(currentQueueStory().storyId, '2I-AI-62I');
  assert.equal(getQueuedStory('2I-AI-62J')?.position, 'NEXT');
  assert.equal(getQueuedStory('2I-AI-62K')?.position, 'QUEUED');
  assert.equal(getQueuedStory('2I-AI-62L')?.position, 'PREVIEW');
  assert.equal(getQueuedStory('2I-AI-62H'), undefined);
  assert.deepEqual(
    queueAdvancement().map((step) => step.position),
    ['PREVIOUS', 'CURRENT', 'NEXT', 'QUEUED', 'PREVIEW'],
  );
});

test('every uploaded story is queued architecture with L4 autonomy disabled', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    assert.equal(story.deploymentState, 'QUEUED');
    assert.equal(story.l4AutonomyEnabled, false);
    assert.equal(story.securityLock.L4_AUTONOMY_ENABLED, false);
    assert.ok(story.document.startsWith('docs/queue/'));
  }
  assert.equal(boundedAutonomyEnabled(), false);
});

test('every security lock flag is engaged and cannot be unlocked by a queue operation', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    assert.equal(securityLockEngaged(story), true);
    for (const flag of Object.keys(story.securityLock)) {
      assert.ok((SECURITY_LOCK_FLAGS as readonly string[]).includes(flag), `unknown lock flag ${flag}`);
      assert.equal(unlockSecurityFlag(story, flag as (typeof SECURITY_LOCK_FLAGS)[number]).allowed, false);
    }
  }
  const foundry = getQueuedStory('2I-AI-62I')!;
  assert.equal(foundry.securityLock.AUTO_AGENT_REPLICATION, false);
  assert.equal(foundry.securityLock.AUTO_UNBOUNDED_AGENT_CREATION, false);
  assert.equal(foundry.securityLock.AUTO_QUANTUM_PROVIDER_ENABLE, false);
  const factory = getQueuedStory('2I-AI-62J')!;
  assert.equal(factory.securityLock.AUTO_MAIN_BRANCH_MERGE, false);
  assert.equal(factory.securityLock.AUTO_DATABASE_MIGRATION, false);
  const enterprise = getQueuedStory('2I-AI-62K')!;
  assert.equal(enterprise.securityLock.AUTO_ENTERPRISE_WRITE, false);
  assert.equal(enterprise.securityLock.AUTO_HIRING_DECISION, false);
  assert.equal(enterprise.securityLock.AUTO_TERMINATION_DECISION, false);
});

test('queue advances only to the immediate successor', () => {
  assert.equal(advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62J' }).allowed, true);
  assert.deepEqual(advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62K' }), { allowed: false, reason: 'queue_skip_denied' });
  assert.deepEqual(advanceQueue({ from: '2I-AI-62J', to: '2I-AI-62I' }), { allowed: false, reason: 'queue_regression_denied' });
  assert.deepEqual(advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62I' }), {
    allowed: false,
    reason: 'queue_advancement_requires_successor',
  });
  assert.equal(nextQueueStory('2I-AI-62K'), '2I-AI-62L');
  assert.equal(nextQueueStory('2I-AI-62L'), undefined);
  assert.equal(previousQueueStory('2I-AI-62I'), '2I-AI-62H');
  assert.equal(previousQueueStory('2I-AI-62H'), undefined);
});

test('documentation never changes deployment state; evidence must be complete and independently verified', () => {
  const story = getQueuedStory('2I-AI-62I')!;
  assert.equal(documentationChangesQueueState(), false);
  assert.equal(queuedArchitectureAuthorizesMigration(), false);

  const noEvidence = { demonstratedCapabilities: [], measuredCounters: {}, independentVerification: true };
  assert.equal(evaluateQueueEvidence(story, noEvidence), 'QUEUED');

  const partial = {
    demonstratedCapabilities: story.definitionOfImplemented.slice(0, -1),
    measuredCounters: {},
    independentVerification: true,
  };
  assert.equal(evaluateQueueEvidence(story, partial), 'QUEUED');

  const implementedOnly = {
    demonstratedCapabilities: [...story.definitionOfImplemented],
    measuredCounters: {},
    independentVerification: true,
  };
  assert.equal(evaluateQueueEvidence(story, implementedOnly), 'IMPLEMENTED');

  const allZero = Object.fromEntries(story.definitionOfVerified.map((counter) => [counter.metric, 0]));
  assert.equal(
    evaluateQueueEvidence(story, { ...implementedOnly, measuredCounters: allZero, independentVerification: false }),
    'IMPLEMENTED',
  );
  assert.equal(
    evaluateQueueEvidence(story, {
      ...implementedOnly,
      measuredCounters: { ...allZero, 'Guardian bypass': 1 },
      independentVerification: true,
    }),
    'IMPLEMENTED',
  );
  assert.equal(evaluateQueueEvidence(story, { ...implementedOnly, measuredCounters: allZero }), 'VERIFIED');

  const preview = getQueuedStory('2I-AI-62L')!;
  assert.equal(evaluateQueueEvidence(preview, { ...implementedOnly, measuredCounters: allZero }), 'QUEUED');
});

test('definition-of-verified counters all require zero', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    for (const counter of story.definitionOfVerified) assert.equal(counter.required, 0);
  }
  assert.ok(getQueuedStory('2I-AI-62I')!.definitionOfVerified.some((c) => c.metric === 'night-shift production mutation'));
  assert.ok(getQueuedStory('2I-AI-62J')!.definitionOfVerified.some((c) => c.metric === 'production autonomous deployments'));
  assert.ok(getQueuedStory('2I-AI-62K')!.definitionOfVerified.some((c) => c.metric === 'unknown data shown as healthy'));
});

test('required security tests are recorded with DENY / STOP / DISQUALIFIED verdicts', () => {
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'agent self-replication without request'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'GPU budget exhausted'), 'STOP');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'agent obtains raw credential'), 'DENY');
  assert.equal(
    expectedSecurityVerdict('2I-AI-62I', 'pipeline removes Guardian then writes production directly'),
    'PIPELINE_INVALID',
  );
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'agent pushes directly to protected branch'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'candidate improves latency by skipping authorization'), 'DISQUALIFIED');
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'engineering agent requests 1 -> 10 -> 100 -> 1,000 agents'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'write using read-only connector'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'agent changes HR decision'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'not a recorded attempt'), undefined);

  for (const story of XIV_ARCHITECTURE_QUEUE) {
    for (const check of story.securityTests) {
      assert.notEqual(check.expected, 'ALLOW' as unknown);
    }
  }
});

test('population governor: limit exceeded denies and escalates, never increases the limit', () => {
  assert.deepEqual(evaluateQueueLimit({ limit: 6, requested: 6 }), { verdict: 'ALLOW', limitIncreased: false });
  assert.deepEqual(evaluateQueueLimit({ limit: 6, requested: 1000 }), {
    verdict: 'DENY',
    reason: 'limit_exceeded',
    escalate: true,
    limitIncreased: false,
  });
  assert.equal(limitExceededIncreasesLimit(), false);
});

test('preflight treats unknown as UNAVAILABLE, not PASS', () => {
  assert.equal(preflightState(true), 'AVAILABLE');
  assert.equal(preflightState(false), 'UNAVAILABLE');
  assert.equal(preflightState(undefined), 'UNAVAILABLE');
});

test('uploading the queue to the brain connects pathways without changing state or granting authority', () => {
  const upload = uploadQueueToBrain();
  assert.equal(upload.uploadId, 'architecture-queue');
  assert.deepEqual(upload.stories, ['2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L']);
  assert.equal(upload.deploymentStatesChanged, false);
  assert.equal(upload.grantsAuthority, false);
  assert.equal(upload.locksReleased, 0);
  assert.ok(upload.pathways.length >= 40);
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    assert.equal(getQueuedStory(story.storyId)?.deploymentState, 'QUEUED');
  }
});

test('every neural pathway resolves to an existing exported runtime symbol', () => {
  const seen = new Set<string>();
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    const pathways = connectNeuralPathways(story);
    assert.ok(pathways.length > 0, `${story.storyId} has no pathways`);
    for (const pathway of pathways) {
      assert.equal(pathway.grantsAuthority, false);
      assert.equal(neuralPathwayGrantsAuthority(pathway), false);
      const module = RUNTIME_MODULES[pathway.runtimeModule];
      assert.ok(module, `${story.storyId}: unknown runtime module ${pathway.runtimeModule}`);
      assert.equal(
        typeof module[pathway.symbol],
        'function',
        `${story.storyId}: ${pathway.runtimeModule}#${pathway.symbol} is not an exported function`,
      );
      seen.add(`${story.storyId}:${pathway.pathwayId}`);
    }
  }
  assert.equal(seen.size, XIV_ARCHITECTURE_QUEUE.reduce((n, story) => n + story.pathways.length, 0));
});

test('pathway targets still hold the boundaries the queued stories depend on', () => {
  assert.equal(neuralAgents.temporaryAgentReceivesPermanentAuthority(), false);
  assert.equal(sovereignNight.nightShiftDeploysProductionAgents(), false);
  assert.equal(sovereignNight.nightShiftDeploysProductionPipelines(), false);
  assert.equal(sovereignNight.nightShiftChangesSecurityPolicy(), false);
  assert.equal(neuralData.agentReceivesRawDbCredential(), false);
  assert.equal(neuralDeployment.productionDeploymentAllowed(), false);
  assert.equal(neuralCompute.partnershipClaimedWithVendor(), false);
  assert.equal(foundationsCompute.moreComputeMeansMorePrivilege(), false);
  assert.equal(foundationsAlgorithms.algorithmCannotDeployItself(), true);
  assert.equal(neuralSimulation.simulationCreatesAuthority(), false);
  assert.equal(neuralFeedback.feedbackRewritesSecurityPolicy(), false);
  assert.equal(neuralDeveloper.developerSandboxAccessesProduction(), false);
  assert.equal(knowledgeLoop.learningMayRewriteSecurityOrProductionPolicy(), false);
  assert.equal(neuralMinds.unknownMindHealthIsHealthy('UNKNOWN'), false);
});

console.log('architecture-queue tests passed');
