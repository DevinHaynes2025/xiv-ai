/**
 * Phase 2B cases. Run with: npx tsx runtime/phase2b.test.ts
 */
import assert from 'node:assert/strict';

import { createApprovalService } from './approval';
import { createMemoryAuditStore } from './audit';
import { getPrototypeBusinessContext } from './context/prototype';
import { buildDiagnosticStory, storyHasPrototypeLabels } from './context/story';
import { evaluatePolicy } from './policy';
import { createAgentRuntime } from './runtime';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('read-only context tool allowed', () => {
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const result = runtime.request({
    agentId: 'operations',
    toolId: 'business_health_analyzer',
    intent: 'Read business health',
  });
  assert.equal(result.verdict, 'allowed');
  assert.equal(result.ok, true);
});

test('consequential tool returns requires_approval', () => {
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const result = runtime.request({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    intent: 'Propose a recovery window',
  });
  assert.equal(result.verdict, 'requires_approval');
  assert.equal(result.action.status, 'awaiting_approval');
  assert.equal(result.action.approvalStatus, 'pending');
});

test('approved action is re-evaluated and still cannot execute', () => {
  const store = createMemoryAuditStore();
  const runtime = createAgentRuntime({ store });
  const proposed = runtime.request({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    intent: 'Propose a recovery window',
  });
  const decided = runtime.approval.decide({
    actionId: proposed.action.actionId,
    decision: 'approved',
    reviewedBy: 'tester',
  });
  assert.equal(decided.action.approvalStatus, 'approved');
  const executed = runtime.approval.attemptExecution(proposed.action.actionId);
  assert.equal(executed.ok, false);
  assert.equal(executed.verdict, 'denied');
  assert.match(executed.action.reason, /does not override policy/i);
  assert.equal(executed.output?.policyReevaluated, true);
});

test('denied approval never runs', () => {
  const store = createMemoryAuditStore();
  const runtime = createAgentRuntime({ store, approval: createApprovalService(store) });
  const proposed = runtime.request({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    intent: 'Propose a recovery window',
  });
  runtime.approval.decide({
    actionId: proposed.action.actionId,
    decision: 'denied',
    reviewedBy: 'tester',
  });
  const executed = runtime.approval.attemptExecution(proposed.action.actionId);
  assert.equal(executed.ok, false);
  assert.match(executed.action.reason, /Denied actions cannot run/);
});

test('expired approval never runs', () => {
  const store = createMemoryAuditStore();
  const runtime = createAgentRuntime({ store });
  const proposed = runtime.request({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    intent: 'Propose a recovery window',
  });
  runtime.approval.expire(proposed.action.actionId);
  const executed = runtime.approval.attemptExecution(proposed.action.actionId);
  assert.equal(executed.ok, false);
  assert.match(executed.action.reason, /Expired approvals cannot run/);
});

test('unknown tool denied', () => {
  const decision = evaluatePolicy({
    agentId: 'operations',
    toolId: 'raw_model_shell',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /Unknown tool/);
});

test('production write denied', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /production/i);
});

test('future agent denied', () => {
  const decision = evaluatePolicy({
    agentId: 'innovation',
    toolId: 'diagnostic_story_builder',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /future/);
});

test('story output preserves source/prototype labels', () => {
  const story = buildDiagnosticStory(getPrototypeBusinessContext());
  assert.equal(storyHasPrototypeLabels(story), true);
  assert.equal(story.confidence, 'low');
  assert.ok(story.causalChain.length >= 5);
});

console.log('All Phase 2B cases passed.');
