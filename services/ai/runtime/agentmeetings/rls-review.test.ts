/**
 * 2I-AI-62B §22 Universe Boundary — database layer.
 *
 * The in-process meeting engine already enforces the Universe boundary. These
 * assertions cover the layer underneath it: that no agent table carrying
 * universe_id is left with a tenant-only RLS policy.
 */
import assert from 'node:assert/strict';

import {
  UNIVERSE_PREDICATE,
  denyAllTables,
  loadMigrationSql,
  reviewUniverseScopedRls,
  tablesWithRlsEnabled,
  tablesWithUniverseColumn,
  universeScopedTables,
} from './rls-review';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const sql = loadMigrationSql();

test('every RLS-enabled table carrying universe_id is Universe-scoped', () => {
  const review = reviewUniverseScopedRls(sql);
  assert.equal(
    review.ok,
    true,
    review.findings.map((f) => `${f.table}: ${f.reason}`).join('; '),
  );
});

test('the 62B meeting tables are all covered', () => {
  const scoped = new Set(universeScopedTables(sql));
  for (const t of [
    'xiv_agent_meetings',
    'xiv_agent_meeting_participants',
    'xiv_agent_meeting_messages',
    'xiv_agent_meeting_evidence',
    'xiv_agent_meeting_proposals',
    'xiv_agent_meeting_objections',
    'xiv_agent_meeting_votes',
    'xiv_agent_meeting_decisions',
    'xiv_agent_meeting_actions',
    'xiv_agent_meeting_outcomes',
  ]) {
    assert.ok(scoped.has(t), `${t} must be Universe-scoped`);
  }
});

test('the mission-control tables that leaked the pattern are also covered', () => {
  const scoped = new Set(universeScopedTables(sql));
  for (const t of [
    'agent_departments',
    'agent_shift_instances',
    'agent_shift_assignments',
    'agent_task_forces',
    'agent_task_force_members',
    'agent_mc_messages',
    'agent_meetings',
    'agent_performance',
  ]) {
    assert.ok(scoped.has(t), `${t} must be Universe-scoped`);
  }
});

test('deny-all tables are accepted as stricter than Universe scoping', () => {
  const denied = new Set(denyAllTables(sql));
  assert.ok(denied.has('agent_workers'), 'agent_workers is deny-all');
  assert.ok(denied.has('agent_missions'), 'agent_missions is deny-all');
});

test('the reviewer actually fails on a tenant-only table', () => {
  const bad = `
create table leaky_agent_table (
  id uuid primary key,
  tenant_id uuid not null,
  universe_id text not null
);
alter table leaky_agent_table enable row level security;
create policy leaky_agent_table_tenant_isolation on leaky_agent_table
  for all using (tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', ''));
`;
  const review = reviewUniverseScopedRls(bad);
  assert.equal(review.ok, false);
  assert.equal(review.findings.length, 1);
  assert.equal(review.findings[0]!.table, 'leaky_agent_table');
  assert.match(review.findings[0]!.reason, /tenant-only/);
});

test('the reviewer accepts the same table once Universe-scoped', () => {
  const good = `
create table fixed_agent_table (
  id uuid primary key,
  tenant_id uuid not null,
  universe_id text not null
);
alter table fixed_agent_table enable row level security;
create policy fixed_agent_table_tenant_universe_isolation on fixed_agent_table
  for all using (
    tenant_id::text = coalesce(auth.jwt() ->> 'tenant_id', '')
    and public.${UNIVERSE_PREDICATE}(universe_id)
  );
`;
  assert.equal(reviewUniverseScopedRls(good).ok, true);
});

test('a universe_id table with no RLS at all is reported', () => {
  const noRls = `
create table forgotten_table (
  id uuid primary key,
  tenant_id uuid not null,
  universe_id text not null
);
`;
  const review = reviewUniverseScopedRls(noRls);
  assert.equal(review.ok, false);
  assert.match(review.findings[0]!.reason, /RLS is not enabled/);
});

test('parsers see the real migration set', () => {
  assert.ok(tablesWithUniverseColumn(sql).length >= 18);
  assert.ok(tablesWithRlsEnabled(sql).length >= 18);
});

console.log('2I-AI-62B Universe-scoped RLS holds across the agent tables.');
