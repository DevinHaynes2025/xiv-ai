// 12D-86 — offline brain agent council contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved; the suite is now chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { canPromoteLearning, planOfflineBrainCouncil } from './offline-brain-agent-council';

test('12d-86 an ordinary mission seats a verified minimized external reviewer', () => {
  const ordinary = planOfflineBrainCouncil({
    mission: {
      missionId: 'mission-86-a',
      tenantId: 'tenant-1',
      objective: 'Improve offline brain retrieval quality',
      securityClass: 'ORDINARY',
      requestedRoles: ['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN', 'QA_REVIEWER', 'CLAUDE_REVIEWER'],
      evidenceRefs: ['receipt:mission-86-a'],
      humanApprovalRequired: true,
    },
    reviewerAdapters: [{
      adapterId: 'CLAUDE',
      status: 'VERIFIED',
      receiptRef: 'receipt:claude-review-adapter',
      networkRequired: true,
      privateDataAllowed: false,
      productionAuthority: false,
    }],
  });
  assert.equal(ordinary.localFirst, true);
  assert.equal(ordinary.productionMutationAllowed, false);
  assert.equal(ordinary.cloudExecutionVerified, false);
  assert.ok(ordinary.seats.find((seat) => seat.role === 'CLAUDE_REVIEWER')?.enabled,
    'verified minimized reviewer should be eligible');
});

test('12d-86 a TOP_SECRET mission keeps every external reviewer disabled', () => {
  const secret = planOfflineBrainCouncil({
    mission: {
      missionId: 'mission-86-b',
      tenantId: 'tenant-1',
      objective: 'Review top secret private memory',
      securityClass: 'TOP_SECRET',
      requestedRoles: ['SECURITY_GUARDIAN', 'ILM_REVIEWER', 'CLAUDE_REVIEWER'],
      evidenceRefs: ['receipt:mission-86-b'],
      humanApprovalRequired: true,
    },
    reviewerAdapters: [
      { adapterId: 'ILM', status: 'VERIFIED', receiptRef: 'receipt:ilm', networkRequired: true, privateDataAllowed: false, productionAuthority: false },
      { adapterId: 'CLAUDE', status: 'VERIFIED', receiptRef: 'receipt:claude', networkRequired: true, privateDataAllowed: false, productionAuthority: false },
    ],
  });
  assert.ok(!secret.seats.some((seat) => (seat.role === 'ILM_REVIEWER' || seat.role === 'CLAUDE_REVIEWER') && seat.enabled),
    'TOP_SECRET external review must stay disabled');
});

test('12d-86 learning promotion: approved ordinary promotes, TOP_SECRET and unapproved refuse', () => {
  assert.equal(canPromoteLearning({ candidateId: 'learn-1', tenantId: 'tenant-1', securityClass: 'ORDINARY', evaluationScore: .95, evidenceRefs: ['receipt:eval'], humanApproved: true }), true,
    'approved learning should promote');
  assert.equal(canPromoteLearning({ candidateId: 'learn-2', tenantId: 'tenant-1', securityClass: 'TOP_SECRET', evaluationScore: .99, evidenceRefs: ['receipt:eval'], humanApproved: true }), false,
    'TOP_SECRET must not promote to shared learning');
  assert.equal(canPromoteLearning({ candidateId: 'learn-3', tenantId: 'tenant-1', securityClass: 'ORDINARY', evaluationScore: .99, evidenceRefs: ['receipt:eval'], humanApproved: false }), false,
    'human approval required');
});