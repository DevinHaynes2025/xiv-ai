import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditLedger } from '../src/audit';
import { ManualClock } from '../src/clock';
import { ExternalActionLedger } from '../src/external-actions';
import { IdFactory } from '../src/ids';
import type { TenantRef } from '../src/types';

const A: TenantRef = { organizationId: 'org_a', universeId: 'uni_ops' };
const B: TenantRef = { organizationId: 'org_b', universeId: 'uni_ops' };

function ledger() {
  const clock = new ManualClock();
  const audit = new AuditLedger(clock, new IdFactory());
  return { clock, audit, external: new ExternalActionLedger(clock, new IdFactory(), audit) };
}

const action = (tenant: TenantRef, actionKey: string) => ({
  tenant,
  workloadId: `wl_${actionKey}`,
  actionKey,
  description: 'notify the supplier',
  consequential: false,
});

test('a repeated action key is deduplicated rather than performed again', () => {
  const { external, audit } = ledger();
  const first = external.execute(action(A, 'notify-1'));
  const second = external.execute(action(A, 'notify-1'));

  assert.equal(first.executed, true);
  assert.equal(second.executed, false);
  assert.equal(second.deduplicated, true);
  assert.equal(second.record.attempts, 2);
  assert.equal(external.executionCount(A, 'notify-1'), 1);
  assert.equal(external.duplicateAttemptCount, 1);
  assert.equal(audit.has((event) => event.kind === 'external_action_deduplicated'), true);
});

/**
 * executionCount used to return `record ? 1 : 0`, and a second execution
 * overwrites the record rather than adding one. It could never exceed one, so
 * the AC-12 duplicate threshold reading it was incapable of failing. It now
 * counts the side effects performed, which is a quantity that can exceed one.
 * The case where deduplication is actually broken is covered by
 * `tools/mutation-check.ts`, since it cannot be reached through the API.
 */
test('executionCount counts side effects performed, not records held', () => {
  const { external } = ledger();
  assert.equal(external.executionCount(A, 'notify-1'), 0);

  external.execute(action(A, 'notify-1'));
  assert.equal(external.executionCount(A, 'notify-1'), 1);

  // Retries leave the count alone: they are attempts, not executions.
  external.execute(action(A, 'notify-1'));
  external.execute(action(A, 'notify-1'));
  assert.equal(external.executionCount(A, 'notify-1'), 1);
  assert.equal(external.attemptsFor(A, 'notify-1'), 3);
  assert.equal(external.duplicateAttemptCount, 2);

  external.execute(action(A, 'notify-2'));
  assert.equal(external.totalExecutions, 2);
  assert.equal(external.executedCount, 2);
});

test('the same action key in two tenants is two different actions', () => {
  const { external } = ledger();
  assert.equal(external.execute(action(A, 'notify-1')).executed, true);
  assert.equal(external.execute(action(B, 'notify-1')).executed, true);
  assert.equal(external.executionCount(A, 'notify-1'), 1);
  assert.equal(external.executionCount(B, 'notify-1'), 1);
});

test('a consequential action without an approval is refused and counted', () => {
  const { external, audit } = ledger();
  assert.throws(() => external.execute({ ...action(A, 'send-1'), consequential: true }));
  assert.equal(external.blockedUnapprovedCount, 1);
  assert.equal(external.executionCount(A, 'send-1'), 0);
  assert.equal(audit.has((event) => event.detail.reason === 'approval_missing'), true);

  const allowed = external.execute({ ...action(A, 'send-2'), consequential: true, approvalId: 'apr_1' });
  assert.equal(allowed.executed, true);
});

test('a restored record still deduplicates a retry after recovery', () => {
  const { external } = ledger();
  external.execute(action(A, 'notify-1'));
  const snapshot = external.export();

  const fresh = ledger().external;
  fresh.restore(snapshot);
  assert.equal(fresh.executionCount(A, 'notify-1'), 1);
  assert.equal(fresh.execute(action(A, 'notify-1')).executed, false);
  assert.equal(fresh.executionCount(A, 'notify-1'), 1);
});
