// 12D-87 — offline brain execution ledger contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved (a FRESH ledger per test; the original appended into ONE ledger
// sequentially, and refusal behavior is independent of that ordering);
// the suite is now chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { planOfflineBrainCouncil } from './offline-brain-agent-council';
import { OfflineBrainExecutionLedger, summarizeCouncilExecution } from './offline-brain-execution-ledger';

const mkPlan = () => planOfflineBrainCouncil({
  mission: {
    missionId: 'mission-87',
    tenantId: 'tenant-1',
    objective: 'Run bounded offline brain council',
    securityClass: 'ORDINARY',
    requestedRoles: ['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN'],
    evidenceRefs: ['receipt:mission-87'],
    humanApprovalRequired: true,
  },
});

const mkReceipts = () => (['LOCAL_ARCHITECT', 'OLLAMA_BUILDER', 'MEMORY_CURATOR', 'SECURITY_GUARDIAN'] as const).map((role, index) => ({
  receiptId: `receipt-${index + 1}`,
  missionId: 'mission-87',
  tenantId: 'tenant-1',
  role,
  securityClass: 'ORDINARY' as const,
  outputHash: `hash-${index + 1}`,
  evidenceRefs: [`evidence-${index + 1}`],
  localExecution: true,
  createdAt: new Date(1_700_000_000_000 + index).toISOString(),
}));

const mkLedger = () => {
  const ledger = new OfflineBrainExecutionLedger({ tenantId: 'tenant-1', missionId: 'mission-87' });
  for (const receipt of mkReceipts()) ledger.append(receipt);
  return ledger;
};

test('12d-87 the execution ledger hash chain verifies and the summary holds guardrails', () => {
  const ledger = mkLedger();
  assert.equal(ledger.verify(), true, 'execution ledger hash chain must verify');
  const summary = summarizeCouncilExecution(mkPlan(), mkReceipts());
  assert.equal(summary.complete, true);
  assert.equal(summary.rawOutputsPersisted, false);
  assert.equal(summary.productionMutationAllowed, false);
});

test('12d-87 a cross-tenant receipt is rejected', () => {
  const ledger = mkLedger();
  assert.throws(() => ledger.append({ ...mkReceipts()[0], receiptId: 'bad-tenant', tenantId: 'tenant-2' }),
    /tenant/i);
});

test('12d-87 a TOP_SECRET external reviewer receipt is rejected', () => {
  const ledger = mkLedger();
  assert.throws(() => ledger.append({ ...mkReceipts()[0], receiptId: 'bad-external', role: 'CLAUDE_REVIEWER', securityClass: 'TOP_SECRET', localExecution: false }),
    /TOP_SECRET|external|local/i);
});

test('12d-87 missing council seats are visible in an incomplete summary', () => {
  const incomplete = summarizeCouncilExecution(mkPlan(), mkReceipts().slice(0, 2));
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.missingRoles.length, 2);
});