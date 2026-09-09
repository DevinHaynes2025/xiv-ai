/**
 * XIV Architecture Queue — 62I / 62J / 62K upload into the brain.
 * Deterministic. No network. Queued architecture never becomes implemented or unlocked by this test.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import * as agentRouter from '../../agent-router';
import * as audit from '../../audit';
import * as auth from '../../auth';
import * as diagnostics from '../../diagnostics';
import * as executiveTurn from '../../executive-turn';
import * as modelRouter from '../../model-router';
import * as persistence from '../../persistence';
import * as policies from '../../policies';
import * as systems from '../../systems';
import * as tools from '../../tools';
import * as turnContext from '../../turn-context';
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
} from '../index';

test('Queue order is strictly linear: 62H -> 62I -> 62J -> 62K -> 62L', () => {
  assert.deepEqual(QUEUE_ORDER, ['2I-AI-62H', '2I-AI-62I', '2I-AI-62J', '2I-AI-62K', '2I-AI-62L']);
  assert.equal(nextQueueStory('2I-AI-62H'), '2I-AI-62I');
  assert.equal(nextQueueStory('2I-AI-62I'), '2I-AI-62J');
  assert.equal(nextQueueStory('2I-AI-62J'), '2I-AI-62K');
  assert.equal(nextQueueStory('2I-AI-62K'), '2I-AI-62L');
  assert.equal(nextQueueStory('2I-AI-62L'), undefined);

  assert.equal(previousQueueStory('2I-AI-62I'), '2I-AI-62H');
  assert.equal(previousQueueStory('2I-AI-62J'), '2I-AI-62I');
  assert.equal(previousQueueStory('2I-AI-62K'), '2I-AI-62J');
});

test('Linear queue advancement enforces immediate successor; denies skipping or reordering', () => {
  const stepValid = advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62J' });
  assert.equal(stepValid.allowed, true);

  const skipDenied = advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62K' });
  assert.equal(skipDenied.allowed, false);
  if (!skipDenied.allowed) {
    assert.match(skipDenied.reason, /linear_advancement_violation/);
  }

  const selfDenied = advanceQueue({ from: '2I-AI-62I', to: '2I-AI-62I' });
  assert.equal(selfDenied.allowed, false);
});

test('62I is CURRENT, 62J is NEXT, 62K is QUEUED', () => {
  const current = currentQueueStory();
  assert.equal(current.storyId, '2I-AI-62I');
  assert.equal(current.position, 'CURRENT');

  const story62J = getQueuedStory('2I-AI-62J');
  assert.ok(story62J);
  assert.equal(story62J.position, 'NEXT');

  const story62K = getQueuedStory('2I-AI-62K');
  assert.ok(story62K);
  assert.equal(story62K.position, 'QUEUED');

  const steps = queueAdvancement();
  assert.equal(steps.length, 5);
  assert.equal(steps.find((s) => s.storyId === '2I-AI-62I')?.position, 'CURRENT');
});

test('Every queued story has deploymentState=QUEUED and l4AutonomyEnabled=false', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    assert.equal(story.deploymentState, 'QUEUED', `${story.storyId} must be QUEUED`);
    assert.equal(story.l4AutonomyEnabled, false, `${story.storyId} must have L4 disabled`);
    assert.equal(securityLockEngaged(story.storyId), true, `${story.storyId} security lock must be engaged`);
  }
});

test('Security lock flags are all false and cannot be unlocked', () => {
  for (const flag of SECURITY_LOCK_FLAGS) {
    assert.equal(unlockSecurityFlag('2I-AI-62I', flag), false);
    assert.equal(unlockSecurityFlag('2I-AI-62J', flag), false);
    assert.equal(unlockSecurityFlag('2I-AI-62K', flag), false);
  }
});

test('Hard rule: LIMIT EXCEEDED -> DENY / ESCALATE, never INCREASE LIMIT', () => {
  const underLimit = evaluateQueueLimit(5, 10);
  assert.equal(underLimit.verdict, 'ALLOW');
  assert.equal(underLimit.limitIncreased, false);

  const atLimit = evaluateQueueLimit(10, 10);
  assert.equal(atLimit.verdict, 'DENY');
  assert.equal(atLimit.limitIncreased, false);
  if (atLimit.verdict === 'DENY') {
    assert.equal(atLimit.escalate, true);
    assert.equal(atLimit.reason, 'limit_exceeded');
  }

  const overLimit = evaluateQueueLimit(11, 10);
  assert.equal(overLimit.verdict, 'DENY');
  assert.equal(overLimit.limitIncreased, false);

  assert.equal(limitExceededIncreasesLimit(), false);
});

test('Preflight rule: unknown resource is UNAVAILABLE, never PASS', () => {
  assert.equal(preflightState(true), 'AVAILABLE');
  assert.equal(preflightState(false), 'UNAVAILABLE');
});

test('Uploading queue to brain connects neural pathways without granting authority', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    const upload = uploadQueueToBrain(story.storyId);
    assert.equal(upload.uploaded, true);
    assert.equal(upload.storyId, story.storyId);
    assert.ok(upload.pathwaysConnected > 0);
    assert.equal(upload.authorityGranted, false);
    assert.equal(upload.deploymentState, 'QUEUED');

    const pathways = connectNeuralPathways(story.storyId);
    assert.equal(pathways.length, upload.pathwaysConnected);
    for (const p of pathways) {
      assert.equal(p.grantsAuthority, false);
      assert.equal(neuralPathwayGrantsAuthority(p), false);
      assert.ok(p.pathwayId.length > 0);
      assert.ok(p.storySection.length > 0);
      assert.ok(p.targetModule.length > 0);
      assert.ok(p.symbol.length > 0);
      assert.ok(p.description.length > 0);
    }
  }
});

test('Neural pathways resolve to real exported symbols in existing services/ai modules', () => {
  const modules: Record<string, Record<string, unknown>> = {
    'services/ai/agent-router': agentRouter as Record<string, unknown>,
    'services/ai/turn-context': turnContext as Record<string, unknown>,
    'services/ai/policies': policies as Record<string, unknown>,
    'services/ai/model-router': modelRouter as Record<string, unknown>,
    'services/ai/systems': systems as Record<string, unknown>,
    'services/ai/auth': auth as Record<string, unknown>,
    'services/ai/persistence': persistence as Record<string, unknown>,
    'services/ai/executive-turn': executiveTurn as Record<string, unknown>,
    'services/ai/audit': audit as Record<string, unknown>,
    'services/ai/diagnostics': diagnostics as Record<string, unknown>,
    'services/ai/tools': tools as Record<string, unknown>,
  };

  for (const story of XIV_ARCHITECTURE_QUEUE) {
    for (const p of story.pathways) {
      const mod = modules[p.targetModule];
      assert.ok(mod, `Target module ${p.targetModule} must exist`);
      assert.ok(
        p.symbol in mod,
        `Symbol ${p.symbol} referenced in pathway ${p.pathwayId} must be exported by ${p.targetModule}`,
      );
    }
  }
});

test('Required negative security tests for 62I, 62J, 62K are fully registered with expected verdicts', () => {
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'agent self-replication without request'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'creation depth exceeds maximum'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'creation budget exhausted'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'unapproved private source ingestion'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'unknown GPU'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'GPU budget exhausted'), 'STOP');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'unconfigured connector'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62I', 'agent -> remove Guardian -> direct production write'), 'PIPELINE_INVALID');

  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'agent pushes directly to protected branch'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'agent deploys production'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'candidate improves latency by skipping authorization'), 'DISQUALIFIED');
  assert.equal(expectedSecurityVerdict('2I-AI-62J', 'engineering agent requests recursive team explosion 1->10->100->1000'), 'DENY');

  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'wrong tenant system access'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'write using read-only connector'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'fabricated executive approval'), 'DENY');
  assert.equal(expectedSecurityVerdict('2I-AI-62K', 'cross-enterprise data leak'), 'DENY');
});

test('Definition of Verified enforces 0 on all critical counters', () => {
  for (const story of XIV_ARCHITECTURE_QUEUE) {
    assert.ok(story.definitionOfVerified.length > 0);
    for (const counter of story.definitionOfVerified) {
      assert.equal(counter.required, 0, `${story.storyId} counter ${counter.metric} must require 0`);
    }

    // With any non-zero metric, verification must fail
    const failingCounters: Record<string, number> = {};
    for (const counter of story.definitionOfVerified) {
      failingCounters[counter.metric] = 0;
    }
    // inject a violation
    const firstMetric = story.definitionOfVerified[0].metric;
    failingCounters[firstMetric] = 1;

    const evaluation = evaluateQueueEvidence(story.storyId, {
      demonstratedCapabilities: story.definitionOfImplemented,
      measuredCounters: failingCounters,
      independentVerification: true,
    });
    assert.equal(evaluation.verified, false, 'Non-zero metric must fail verification');
    assert.ok(evaluation.failedMetrics.length > 0);
  }
});

test('Documentation and architecture do not alter state or authorize migrations', () => {
  assert.equal(documentationChangesQueueState(), false);
  assert.equal(queuedArchitectureAuthorizesMigration(), false);
});
