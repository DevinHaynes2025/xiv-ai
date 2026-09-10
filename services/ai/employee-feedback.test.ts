/**
 * US-EMP-01 anonymous employee feedback contract.
 * Run: npx tsx employee-feedback.test.ts
 */

import assert from 'node:assert/strict';

import {
  EMPLOYEE_FEEDBACK_POLICY,
  FORBIDDEN_FEEDBACK_IDENTITY_KEYS,
  anonymousEmployeeAlias,
  assertFeedbackPayloadAnonymous,
  bindEmployeeFeedbackPersistence,
  buildAnonymousFeedbackPayload,
  employeeFeedbackAllowsL4,
  feedbackPayloadHasIdentityLeak,
  isEmployeeFeedbackDurableBound,
  listEmployeeFeedbackChannel,
  resetEmployeeFeedbackSessionStore,
  submitEmployeeFeedback,
} from './employee-feedback';
import { bindAgentPersistence, isAgentPersistenceBound } from './persistence';

async function main() {
  assert.equal(EMPLOYEE_FEEDBACK_POLICY.l4Autonomy, false);
  assert.equal(EMPLOYEE_FEEDBACK_POLICY.storesDisplayName, false);
  assert.equal(EMPLOYEE_FEEDBACK_POLICY.storesLegalName, false);
  assert.equal(employeeFeedbackAllowsL4(), false);
  assert.ok(FORBIDDEN_FEEDBACK_IDENTITY_KEYS.includes('displayName'));
  assert.ok(FORBIDDEN_FEEDBACK_IDENTITY_KEYS.includes('legalName'));

  bindEmployeeFeedbackPersistence(null);
  bindAgentPersistence(null);
  resetEmployeeFeedbackSessionStore();
  assert.equal(isEmployeeFeedbackDurableBound(), false);
  assert.equal(isAgentPersistenceBound(), false);

  const empty = listEmployeeFeedbackChannel();
  assert.equal(empty.status, 'WAITING_DATA');
  assert.equal(empty.persistenceBound, false);
  assert.equal(empty.submissions.length, 0);
  assert.match(empty.note, /WAITING_DATA/);
  assert.equal(empty.l4Autonomy, false);
  assert.equal(empty.storesDisplayName, false);
  assert.equal(empty.storesLegalName, false);

  const alias = anonymousEmployeeAlias('us-emp-01-user');
  assert.match(alias, /^[A-Za-z]+-[A-Z]\d{2}$/);
  assert.equal(anonymousEmployeeAlias('us-emp-01-user'), alias);

  const payload = buildAnonymousFeedbackPayload({
    userId: 'us-emp-01-user',
    category: 'culture',
    body: 'Shift handoff notes would help the floor.',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
    displayName: 'Devin Haynes',
    legalName: 'Devin Xavier Haynes',
    fullName: 'Devin Xavier Haynes',
    email: 'devin@example.com',
  });
  assert.equal(payload.alias, alias);
  assert.equal(payload.category, 'culture');
  assert.equal(payload.universeId, 'universe-demo-1');
  assert.equal(payload.organizationId, 'org-demo-1');
  assert.equal((payload as Record<string, unknown>).displayName, undefined);
  assert.equal((payload as Record<string, unknown>).legalName, undefined);
  assert.equal((payload as Record<string, unknown>).fullName, undefined);
  assert.equal((payload as Record<string, unknown>).email, undefined);
  assert.equal(feedbackPayloadHasIdentityLeak(payload as unknown as Record<string, unknown>).length, 0);
  assertFeedbackPayloadAnonymous(payload as unknown as Record<string, unknown>);

  assert.throws(
    () =>
      assertFeedbackPayloadAnonymous({
        alias: 'Signal-A10',
        displayName: 'Nope',
        body: 'x',
        category: 'other',
        universeId: 'u',
        organizationId: 'o',
      }),
    /identity_leak/,
  );

  const submitted = await submitEmployeeFeedback({
    userId: 'us-emp-01-user',
    category: 'operations',
    body: 'Need clearer staging labels near dock 3.',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
    displayName: 'Should Not Persist',
    legalName: 'Should Not Persist Either',
  });
  assert.equal(submitted.persona, 'employee');
  assert.equal(submitted.source, 'session_memory');
  assert.equal(submitted.payload.alias, alias);
  assert.equal((submitted.payload as Record<string, unknown>).displayName, undefined);
  assert.equal((submitted.payload as Record<string, unknown>).legalName, undefined);

  const channel = listEmployeeFeedbackChannel({ universeId: 'universe-demo-1' });
  assert.equal(channel.status, 'READY');
  assert.equal(channel.submissions.length, 1);
  assert.equal(channel.submissions[0]?.payload.alias, alias);
  assert.match(channel.note, /WAITING_DATA for durable|in-memory/);

  const otherUniverse = listEmployeeFeedbackChannel({ universeId: 'universe-other' });
  assert.equal(otherUniverse.submissions.length, 0);
  assert.equal(otherUniverse.status, 'WAITING_DATA');

  let inserted: Record<string, unknown> | null = null;
  bindEmployeeFeedbackPersistence({
    async insert(row) {
      inserted = row;
      assertFeedbackPayloadAnonymous(row);
      return { error: null };
    },
  });
  assert.equal(isEmployeeFeedbackDurableBound(), true);

  const durable = await submitEmployeeFeedback({
    userId: 'us-emp-01-user',
    category: 'safety',
    body: 'PPE station near aisle B is empty on nights.',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
    displayName: 'Leak Attempt',
  });
  assert.equal(durable.source, 'persistence_bound');
  assert.ok(inserted !== null);
  const persisted = inserted as Record<string, unknown>;
  assert.equal(persisted.alias, alias);
  assert.equal(persisted.displayName, undefined);
  assert.equal(persisted.legalName, undefined);
  assert.equal(persisted.full_name, undefined);
  assert.equal(persisted.email, undefined);
  assert.equal(persisted.universe_id, 'universe-demo-1');
  assert.equal(persisted.organization_id, 'org-demo-1');

  const boundChannel = listEmployeeFeedbackChannel({ universeId: 'universe-demo-1' });
  assert.equal(boundChannel.persistenceBound, true);
  assert.equal(boundChannel.status, 'READY');
  assert.ok(boundChannel.submissions.length >= 2);
  for (const item of boundChannel.submissions) {
    assert.equal(feedbackPayloadHasIdentityLeak(item.payload as unknown as Record<string, unknown>).length, 0);
  }

  bindEmployeeFeedbackPersistence(null);
  bindAgentPersistence(null);
  resetEmployeeFeedbackSessionStore();

  console.log(
    'ok - US-EMP-01 anonymous feedback (alias only; no legal/display name; WAITING_DATA when unbound; L4 false)',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

