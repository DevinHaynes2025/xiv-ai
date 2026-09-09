/**
 * Phase 2G-A collaboration, foresight, live, and security cases.
 * Run with: npx tsx runtime/phase2ga.test.ts
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { createHandoff, directAgentCallDenied, evaluateLoopGuard, orchestrateConsultation, routeHandoff } from './collaboration';
import { createCollaborationSession } from './collaboration/router';
import { consumeBudget, createCollaborationBudget } from './collaboration/budget';
import { denyCrossUniverseHandoff } from './collaboration/conversation';
import { findAllowedEdge } from './collaboration/registry';
import { feedbackDoesNotRetrain, recordLesson, createOutcomeRecord } from './feedback';
import { hypothesizedRemainsHypothesized, projectScenario, stanceIsNotFact } from './foresight';
import {
  authorizeLiveAccess,
  createUnavailableDlpProvider,
  createUnavailableLiveStreamProvider,
  createUnavailableRecordingProvider,
  createUnavailableTranscriptProvider,
  publicLiveCannotExposeRestricted,
  recommendModeration,
} from './live';
import { evaluatePolicy } from './policy';
import { publishingWritesEnabled } from './publishing/policy';
import { scoreAuthorizedRecords } from './quality';
import { defaultDenyUnknownHandoff, evaluateAgentFirewall } from './security/firewall';
import { evaluateSecurityDecision } from './security/decision';
import { describeTenantPersistenceBlock, tenantPersistenceIsLive } from './tenant/collision';
import type { LiveRoom } from './live';

function test(name: string, run: () => void | Promise<void>) {
  return Promise.resolve()
    .then(run)
    .then(() => {
      console.log(`ok - ${name}`);
    });
}

function handoff(partial: Partial<Parameters<typeof createHandoff>[0]> = {}) {
  return createHandoff({
    sessionId: 'col_test',
    sourceAgent: 'executive',
    targetAgent: 'operations',
    type: 'consultation',
    purpose: 'Why are operations deteriorating?',
    requestedOutput: 'specialist_analysis',
    authorityLevel: 'L1',
    hopCount: 1,
    maxHopCount: 4,
    correlationId: 'cor_test',
    allowedTools: ['diagnostic_summarizer'],
    ...partial,
  });
}

await test('1 agent cannot directly call unapproved agent', () => {
  assert.equal(directAgentCallDenied().allowed, false);
  assert.equal(findAllowedEdge('operations', 'communications', 'consultation'), undefined);
});

await test('2 valid bounded handoff allowed', () => {
  const session = createCollaborationSession({ orchestratorId: 'executive' });
  const routed = routeHandoff({ session, handoff: handoff() });
  assert.equal(routed.allowed, true);
});

await test('3 unknown handoff denied', () => {
  const unknown = evaluateAgentFirewall({
    handoff: { ...handoff(), type: 'gossip' as never },
  });
  assert.equal(unknown.allowed, false);
  assert.equal(defaultDenyUnknownHandoff().allowed, false);
});

await test('4 hop limit enforced', () => {
  const loop = evaluateLoopGuard({
    path: ['executive'],
    nextAgent: 'operations',
    hopCount: 5,
    maxHopCount: 4,
  });
  assert.equal(loop?.code, 'budget_exceeded');
});

await test('5 cycle detected', () => {
  const loop = evaluateLoopGuard({
    path: ['executive', 'operations', 'supply_chain'],
    nextAgent: 'executive',
    hopCount: 3,
    maxHopCount: 4,
  });
  assert.equal(loop?.code, 'loop_detected');
});

await test('6 collaboration budget enforced', () => {
  const spent = consumeBudget(createCollaborationBudget({ maxHopCount: 1 }), { hops: 2 });
  assert.equal(spent.exceeded?.code, 'budget_exceeded');
});

await test('7 authority cannot transfer between agents', () => {
  const result = evaluateAgentFirewall({
    handoff: handoff({ transferAuthority: true, authorityLevel: 'L3' }),
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /authority/i);
});

await test('8 cross-Universe handoff denied', () => {
  const cross = denyCrossUniverseHandoff({
    sourceUniverseId: 'uni_a',
    targetUniverseId: 'uni_b',
    sourceOrganizationId: 'org_a',
    targetOrganizationId: 'org_a',
  });
  assert.equal(cross?.code, 'cross_universe');
});

await test('9 Guardian cannot join tenant agent mesh', () => {
  const result = evaluateAgentFirewall({
    handoff: handoff({ sourceAgent: 'guardian', targetAgent: 'executive', type: 'consultation' }),
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Guardian/i);
});

await test('10 Executive can orchestrate allowed consultation', () => {
  const result = orchestrateConsultation({
    purpose: 'Why are operations deteriorating?',
    specialists: ['operations', 'supply_chain', 'data_quality', 'risk'],
  });
  assert.equal(result.allowed, true);
  assert.equal(result.partial, false);
  assert.ok(result.contributions.every((item) => item.status === 'completed'));
});

await test('11 specialist failure returns partial result', () => {
  const result = orchestrateConsultation({
    purpose: 'Risk review',
    specialists: ['operations', 'risk'],
    unavailableSpecialists: ['risk'],
  });
  assert.equal(result.partial, true);
  assert.deepEqual(result.missingSpecialists, ['risk']);
  assert.match(result.contributions.find((item) => item.agentId === 'risk')?.output ?? '', /Missing specialist/i);
});

await test('12 Data Quality Agent does not invent operational facts', () => {
  const score = scoreAuthorizedRecords({
    recordCount: 2,
    scope: 'personal',
    domain: 'technology',
    provenanceComplete: true,
    freshness: 'fresh',
  });
  assert.equal(score.operationalInsight, false);
  assert.match(score.reason, /not converted into operational facts/i);
});

await test('13 Foresight projection remains projected', () => {
  const scenario = projectScenario({ question: 'If supplier lead time increases 18%, what areas may be affected?' });
  assert.equal(scenario.stance, 'projected');
  assert.equal(scenario.financialImpactInvented, false);
  assert.equal(stanceIsNotFact('projected'), true);
});

await test('14 hypothesis remains hypothesized', () => {
  assert.equal(hypothesizedRemainsHypothesized('hypothesized'), true);
  assert.equal(hypothesizedRemainsHypothesized('observed'), false);
});

await test('15 outcome feedback does not retrain code/model automatically', () => {
  const outcome = createOutcomeRecord({
    organizationId: null,
    universeId: null,
    problem: 'Late waves',
    recommendationId: 'rec_1',
    decision: 'approved',
    actionTaken: null,
    expectedOutcome: 'Recovery window',
    measurementWindow: null,
    confidenceBefore: 'low',
    evidence: [],
  });
  const lesson = recordLesson(outcome);
  assert.equal(lesson.retrainsModel, false);
  assert.equal(lesson.mutatesAgentCode, false);
  assert.equal(feedbackDoesNotRetrain().retrainsModel, false);
});

await test('16 livestream private Universe requires tenant authorization', () => {
  const room: LiveRoom = {
    streamId: 'live_private',
    hostUserId: 'user_a',
    organizationId: 'org_a',
    universeId: 'uni_a',
    title: 'Warehouse walkthrough',
    description: 'Private',
    category: 'operations_walkthrough',
    visibility: 'universe',
    status: 'scheduled',
    startedAt: null,
    scheduledAt: null,
    endedAt: null,
    viewerCount: null,
    moderationState: 'clear',
    recordingState: 'not_configured',
    dataClassification: 'internal',
    prototype: true,
  };
  const denied = authorizeLiveAccess({ room, actorUserId: 'user_a', persistenceStatus: 'schema_collision' });
  assert.equal(denied.allowed, false);
});

await test('17 public livestream cannot expose restricted data by policy', () => {
  const result = publicLiveCannotExposeRestricted({ visibility: 'public', dataClassification: 'restricted' });
  assert.equal(result.allowed, false);
});

await test('18 livestream provider status is not_configured', () => {
  assert.equal(createUnavailableLiveStreamProvider().status, 'not_configured');
});

await test('19 recording provider status is not_configured', () => {
  assert.equal(createUnavailableRecordingProvider().status, 'not_configured');
});

await test('20 transcript provider status is not_configured', () => {
  assert.equal(createUnavailableTranscriptProvider().status, 'not_configured');
});

await test('21 DLP provider status is not_configured', () => {
  assert.equal(createUnavailableDlpProvider().status, 'not_configured');
});

await test('22 moderation recommendation does not auto-ban host', () => {
  const result = recommendModeration('recommend_block');
  assert.equal(result.autoBan, false);
  assert.equal(result.autoTerminate, false);
});

await test('23 Agent Firewall default deny', () => {
  const result = evaluateAgentFirewall({
    handoff: handoff({ sourceAgent: 'operations', targetAgent: 'communications' }),
  });
  assert.equal(result.allowed, false);
});

await test('24 security decision supports deny / approval / step-up states', () => {
  assert.equal(evaluateSecurityDecision({}).verdict, 'deny');
  assert.equal(evaluateSecurityDecision({ identity: 'user_a', action: 'write' }).verdict, 'require_approval');
  assert.equal(
    evaluateSecurityDecision({ identity: 'user_a', deviceTrusted: false }).verdict,
    'require_step_up_auth',
  );
  assert.equal(evaluateSecurityDecision({ identity: 'user_a', action: 'read' }).verdict, 'allow');
});

await test('25 tenant schema collision remains visible', () => {
  const block = describeTenantPersistenceBlock();
  assert.equal(block.status, 'schema_collision');
  assert.equal(block.live, false);
  assert.equal(block.mayApplyMigration, false);
  assert.equal(tenantPersistenceIsLive(), false);
});

await test('26 L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

await test('27 production writes remain governed', () => {
  assert.equal(publishingWritesEnabled(), false);
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
});

console.log('All Phase 2G-A cases passed.');
