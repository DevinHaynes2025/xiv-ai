/**
 * US-CON-01 consumer innovate / early access contract.
 * Run: npx tsx consumer-innovate.test.ts
 */

import assert from 'node:assert/strict';

import {
  CONSUMER_INNOVATE_POLICY,
  bindConsumerInnovatePersistence,
  buildConsumerIdeaPayload,
  consumerHandleFromIdentity,
  consumerIdeaAllowsProductionMutation,
  consumerInnovateAllowsL4,
  isConsumerInnovateDurableBound,
  listConsumerInnovateChannel,
  resetConsumerInnovateSessionStore,
  submitConsumerIdea,
} from './consumer-innovate';
import { anonymousEmployeeAlias } from './employee-feedback';
import { bindAgentPersistence, isAgentPersistenceBound } from './persistence';

async function main() {
  assert.equal(CONSUMER_INNOVATE_POLICY.l4Autonomy, false);
  assert.equal(CONSUMER_INNOVATE_POLICY.productionMutation, false);
  assert.equal(CONSUMER_INNOVATE_POLICY.ideasAreProposals, true);
  assert.equal(CONSUMER_INNOVATE_POLICY.identityModel, 'named_consumer_handle');
  assert.equal(CONSUMER_INNOVATE_POLICY.distinctFromEmployeeAnonymous, true);
  assert.equal(consumerInnovateAllowsL4(), false);
  assert.equal(consumerIdeaAllowsProductionMutation(), false);

  bindConsumerInnovatePersistence(null);
  bindAgentPersistence(null);
  resetConsumerInnovateSessionStore();
  assert.equal(isConsumerInnovateDurableBound(), false);
  assert.equal(isAgentPersistenceBound(), false);

  const empty = listConsumerInnovateChannel();
  assert.equal(empty.status, 'WAITING_DATA');
  assert.equal(empty.persistenceBound, false);
  assert.equal(empty.ideas.length, 0);
  assert.equal(empty.acceptanceMetrics, 'WAITING_DATA');
  assert.match(empty.note, /WAITING_DATA/);
  assert.equal(empty.l4Autonomy, false);
  assert.equal(empty.ideasAreProposals, true);
  assert.equal(empty.productionMutation, false);
  assert.equal(empty.identityModel, 'named_consumer_handle');

  const derived = consumerHandleFromIdentity({ userId: 'us-con-01-user' });
  assert.match(derived, /^(Spark|Vista|Pulse|Orbit|Nova)-[A-Z]\d{2}$/);
  assert.equal(consumerHandleFromIdentity({ userId: 'us-con-01-user' }), derived);
  // Separate from employee anonymous alias algorithm/prefix set.
  const employeeAlias = anonymousEmployeeAlias('us-con-01-user');
  assert.notEqual(derived, employeeAlias);
  assert.match(employeeAlias, /^(Signal|Keel|North|Harbor|Atlas)-/);

  const named = consumerHandleFromIdentity({
    userId: 'us-con-01-user',
    preferredHandle: 'Devin Explorer',
  });
  assert.equal(named, 'Devin-Explorer');

  const payload = buildConsumerIdeaPayload({
    userId: 'us-con-01-user',
    preferredHandle: 'Devin Explorer',
    title: 'Early access: offline discovery packs',
    body: 'Let consumers preview community packs before publish.',
    category: 'early_access',
    stage: 'early_access_interest',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
  });
  assert.equal(payload.consumerHandle, 'Devin-Explorer');
  assert.equal(payload.proposalOnly, true);
  assert.equal(payload.category, 'early_access');
  assert.equal(payload.stage, 'early_access_interest');
  assert.equal(payload.universeId, 'universe-demo-1');
  assert.equal(payload.organizationId, 'org-demo-1');

  assert.throws(
    () =>
      buildConsumerIdeaPayload({
        userId: 'us-con-01-user',
        title: '',
        body: 'x',
        category: 'feature',
        universeId: 'u',
        organizationId: 'o',
      }),
    /title_required/,
  );

  const submitted = await submitConsumerIdea({
    userId: 'us-con-01-user',
    preferredHandle: 'Devin Explorer',
    title: 'Smoother hub join flow',
    body: 'Reduce steps for first-time community join.',
    category: 'experience',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
  });
  assert.equal(submitted.persona, 'consumer');
  assert.equal(submitted.source, 'session_memory');
  assert.equal(submitted.payload.proposalOnly, true);
  assert.equal(submitted.acceptanceMetrics, 'UNBOUND');
  assert.equal(submitted.payload.consumerHandle, 'Devin-Explorer');

  const channel = listConsumerInnovateChannel({ universeId: 'universe-demo-1' });
  assert.equal(channel.status, 'READY');
  assert.equal(channel.ideas.length, 1);
  assert.equal(channel.acceptanceMetrics, 'WAITING_DATA');
  assert.match(channel.note, /WAITING_DATA for durable|in-memory|Acceptance/);

  const otherUniverse = listConsumerInnovateChannel({ universeId: 'universe-other' });
  assert.equal(otherUniverse.ideas.length, 0);
  assert.equal(otherUniverse.status, 'WAITING_DATA');
  assert.equal(otherUniverse.acceptanceMetrics, 'WAITING_DATA');

  let inserted: Record<string, unknown> | null = null;
  bindConsumerInnovatePersistence({
    async insert(row) {
      inserted = row;
      assert.equal(row.proposal_only, true);
      assert.equal(row.production_mutation, false);
      assert.equal(row.persona, 'consumer');
      return { error: null };
    },
  });
  assert.equal(isConsumerInnovateDurableBound(), true);

  const durable = await submitConsumerIdea({
    userId: 'us-con-01-user',
    preferredHandle: 'Devin Explorer',
    title: 'Accessibility captions default on',
    body: 'Default captions for live consumer sessions.',
    category: 'accessibility',
    stage: 'proposal',
    universeId: 'universe-demo-1',
    organizationId: 'org-demo-1',
  });
  assert.equal(durable.source, 'persistence_bound');
  assert.equal(durable.acceptanceMetrics, 'WAITING_DATA');
  assert.ok(inserted !== null);
  const persisted = inserted as Record<string, unknown>;
  assert.equal(persisted.consumer_handle, 'Devin-Explorer');
  assert.equal(persisted.universe_id, 'universe-demo-1');
  assert.equal(persisted.organization_id, 'org-demo-1');
  assert.equal(persisted.proposal_only, true);
  assert.equal(persisted.production_mutation, false);

  const boundChannel = listConsumerInnovateChannel({ universeId: 'universe-demo-1' });
  assert.equal(boundChannel.persistenceBound, true);
  assert.equal(boundChannel.status, 'READY');
  assert.equal(boundChannel.acceptanceMetrics, 'WAITING_DATA');
  assert.ok(boundChannel.ideas.length >= 2);
  for (const item of boundChannel.ideas) {
    assert.equal(item.payload.proposalOnly, true);
    assert.equal(item.persona, 'consumer');
  }

  bindConsumerInnovatePersistence(null);
  bindAgentPersistence(null);
  resetConsumerInnovateSessionStore();

  console.log(
    'ok - US-CON-01 consumer innovate (named handle; proposals only; WAITING_DATA metrics; L4 false; identity ≠ employee alias)',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
