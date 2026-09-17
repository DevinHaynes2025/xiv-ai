// 12D-88 — local model collaboration bus contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved; the suite is now chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildCollaborationPlan, canPromoteReasoningPathway } from './local-model-collaboration-bus';

const nowMs = Date.parse('2026-09-11T23:00:00.000Z');
const bound = { tenantId: 'tenant-1', verifiedAt: new Date(nowMs).toISOString(), expiresAt: new Date(nowMs + 120_000).toISOString() };
const receipts = [
  { ...bound, collaboratorId: 'OLLAMA_LOCAL' as const, status: 'VERIFIED' as const, receiptRef: 'receipt:ollama-local',
    endpoint: 'http://127.0.0.1:11434', providerId: 'ollama', modelId: 'qwen2.5-coder:7b', deviceLocalCli: true,
    modelExecutionLocal: true, productionAuthority: false as const, rawPrivateDataAllowed: true },
  { ...bound, collaboratorId: 'CLAUDE_CODE_LOCAL' as const, status: 'VERIFIED' as const, receiptRef: 'receipt:claude-code-cli',
    providerId: 'fixture-provider', modelId: 'fixture-review-model', deviceLocalCli: true,
    modelExecutionLocal: false, productionAuthority: false as const, rawPrivateDataAllowed: false },
];

test('12d-88 an ordinary task enables both local collaborators with guardrails held', () => {
  const ordinary = buildCollaborationPlan({ nowMs, networkAvailable: true,
    task: { taskId: 'task-88-a', tenantId: 'tenant-1', objective: 'Review and improve agent pathway orchestration',
      kind: 'ARCHITECTURE', securityClass: 'ORDINARY', evidenceRefs: ['receipt:task-88-a'], humanApprovalRequired: true, externalReviewApproved: true },
    collaboratorReceipts: receipts });
  assert.ok(ordinary.assignments.find(a => a.collaboratorId === 'OLLAMA_LOCAL')?.enabled, 'ollama should be enabled');
  assert.ok(ordinary.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled,
    'claude should be enabled for ordinary minimized review');
  assert.equal(ordinary.productionMutationAllowed, false);
  assert.equal(ordinary.autonomousDeployAllowed, false);
  assert.equal(ordinary.modelWeightMutationAllowed, false);
});

test('12d-88 a CONFIDENTIAL task disables the Claude review by default', () => {
  const confidential = buildCollaborationPlan({ nowMs,
    task: { taskId: 'task-88-b', tenantId: 'tenant-1', objective: 'Review private company-brain routing', kind: 'REVIEW',
      securityClass: 'CONFIDENTIAL', evidenceRefs: ['receipt:task-88-b'], humanApprovalRequired: true }, collaboratorReceipts: receipts });
  assert.ok(!confidential.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled,
    'confidential Claude review must be disabled by default');
});

test('12d-88 a TOP_SECRET task disables the Claude review outright', () => {
  const secret = buildCollaborationPlan({ nowMs,
    task: { taskId: 'task-88-c', tenantId: 'tenant-1', objective: 'Reason over top secret memory locally', kind: 'REASON',
      securityClass: 'TOP_SECRET', evidenceRefs: ['receipt:task-88-c'], humanApprovalRequired: true }, collaboratorReceipts: receipts });
  assert.ok(!secret.assignments.find(a => a.collaboratorId === 'CLAUDE_CODE_LOCAL')?.enabled,
    'TOP_SECRET Claude review must be disabled');
});

test('12d-88 pathway promotion: two independent reviews, ordinary class, human approved', () => {
  assert.equal(canPromoteReasoningPathway({ pathwayId: 'path-1', tenantId: 'tenant-1', evaluationScore: .96, evidenceRefs: ['e1'], independentReviewRefs: ['r1','r2'], securityClass: 'ORDINARY', humanApproved: true }), true,
    'high quality reviewed pathway should promote');
  assert.equal(canPromoteReasoningPathway({ pathwayId: 'path-2', tenantId: 'tenant-1', evaluationScore: .99, evidenceRefs: ['e1'], independentReviewRefs: ['r1'], securityClass: 'ORDINARY', humanApproved: true }), false,
    'two independent reviews required');
  assert.equal(canPromoteReasoningPathway({ pathwayId: 'path-3', tenantId: 'tenant-1', evaluationScore: .99, evidenceRefs: ['e1'], independentReviewRefs: ['r1','r2'], securityClass: 'TOP_SECRET', humanApproved: true }), false,
    'TOP_SECRET must not promote to shared pathway');
});