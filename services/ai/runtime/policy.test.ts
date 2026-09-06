/**
 * Phase 2A policy cases. Run with: npx tsx runtime/policy.test.ts
 * Uses Node assert only — no extra test framework.
 */
import assert from 'node:assert/strict';

import { evaluatePolicy } from './policy';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('1. unauthorized agent + tool → denied', () => {
  const decision = evaluatePolicy({
    agentId: 'guardian',
    toolId: 'business_context_reader',
  });
  assert.equal(decision.verdict, 'denied');
});

test('2. read-only permitted tool + sufficient authority → allowed', () => {
  const decision = evaluatePolicy({
    agentId: 'operations',
    toolId: 'business_context_reader',
    environment: 'prototype',
  });
  assert.equal(decision.verdict, 'allowed');
});

test('3. consequential tool → requires approval', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
  });
  assert.equal(decision.verdict, 'requires_approval');
});

test('4. L5 human-only action → agent denied', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'human_only_production_change',
    authorityLevel: 'L5',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /human-only/i);
});

test('5. unknown tool → denied', () => {
  const decision = evaluatePolicy({
    agentId: 'operations',
    toolId: 'delete_production_database',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /Unknown tool/);
});

test('6. unknown agent → denied', () => {
  const decision = evaluatePolicy({
    agentId: 'rogue_agent',
    toolId: 'business_context_reader',
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /Unknown agent/);
});

test('future agent cannot invoke tools', () => {
  const decision = evaluatePolicy({
    agentId: 'innovation',
    toolId: 'recommendation_generator',
  });
  assert.equal(decision.verdict, 'denied');
});

test('L1 agent cannot propose executable changes', () => {
  const decision = evaluatePolicy({
    agentId: 'operations',
    toolId: 'propose_operational_change',
  });
  assert.equal(decision.verdict, 'denied');
});

test('production high-risk write is denied', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    environment: 'production',
  });
  assert.equal(decision.verdict, 'denied');
});

test('approval does not bypass consequential policy', () => {
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    approved: true,
  });
  assert.equal(decision.verdict, 'denied');
  assert.match(decision.reason, /does not override policy/i);
});

console.log('All Phase 2A policy cases passed.');
