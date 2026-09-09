import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CIVILIZATION_TABLES } from '../store';

const migration = readFileSync(
  new URL('../../../../supabase/migrations/20260908120000_agent_civilization_foundation.sql', import.meta.url),
  'utf8',
);
const rlsTest = readFileSync(
  new URL('../../../../supabase/tests/agent_civilization_rls_test.sql', import.meta.url),
  'utf8',
);

// The fifteen tables the story names as the first engineering slice.
const SLICE_TABLES = [
  'agent_registry',
  'agent_capabilities',
  'agent_relationships',
  'agent_messages',
  'agent_meetings',
  'agent_meeting_participants',
  'agent_tasks',
  'agent_task_forces',
  'agent_knowledge_sources',
  'knowledge_lineage',
  'agent_evaluations',
  'agent_resource_budgets',
  'universe_lifecycle',
  'runtime_nodes',
  'runtime_capabilities',
] as const;

function createdTables() {
  return [...migration.matchAll(/create table if not exists public\.(\w+)/g)].map((match) => match[1]);
}

test('the migration creates every table named in the engineering slice', () => {
  const created = createdTables();
  for (const table of SLICE_TABLES) {
    assert.ok(created.includes(table), `${table} is missing from the migration`);
  }
});

test('the in-memory tables and the migration describe the same civilization', () => {
  assert.deepEqual([...createdTables()].sort(), [...CIVILIZATION_TABLES].sort());
});

test('every tenant-bearing table enables and forces row level security', () => {
  for (const table of createdTables()) {
    assert.ok(
      migration.includes(`alter table public.${table} enable row level security;`),
      `${table} does not enable RLS`,
    );
    assert.ok(
      migration.includes(`alter table public.${table} force row level security;`),
      `${table} does not force RLS`,
    );
    assert.ok(
      migration.includes(`revoke all on table public.${table} from public, anon;`),
      `${table} is still reachable by anon`,
    );
  }
});

test('every tenant-bearing table has a select policy and a write policy', () => {
  for (const table of createdTables()) {
    const policies = [...migration.matchAll(new RegExp(`create policy (\\w+)\\s+on public\\.${table}\\s+for (\\w+)`, 'g'))];
    const commands = policies.map((match) => match[2]);
    assert.ok(commands.includes('select'), `${table} has no select policy`);
    assert.ok(
      commands.includes('insert') || commands.includes('update'),
      `${table} has no write policy`,
    );
  }
});

test('no policy is granted to anon or to public', () => {
  const grants = [...migration.matchAll(/for \w+\s+to (\w+)/g)].map((match) => match[1]);
  assert.ok(grants.length > 0);
  assert.deepEqual([...new Set(grants)], ['authenticated']);
  assert.equal(/to\s+anon\b/.test(migration), false);
});

test('every table carries a universe scope except the universe registry itself', () => {
  for (const table of createdTables()) {
    if (table === 'universe_lifecycle') continue;
    const definition = migration.slice(
      migration.indexOf(`create table if not exists public.${table}`),
      migration.indexOf(';', migration.indexOf(`create table if not exists public.${table}`)),
    );
    assert.ok(
      definition.includes('universe_id uuid not null references public.universe_lifecycle (id)'),
      `${table} has no universe scope`,
    );
  }
});

test('the negative test harness exercises every table it can see', () => {
  for (const table of createdTables()) {
    assert.ok(rlsTest.includes(`public.${table}`), `${table} is never touched by the RLS negative tests`);
  }
});

test('the negative test harness proves isolation, quotas, gates and the kill switch', () => {
  const expectations = [
    'universe B cannot see universe A agents',
    'universe B cannot see universe A messages',
    'outsider sees no universe',
    'universe B registering an agent inside universe A',
    'message addressed to an agent in another universe',
    'non-supervisor registering an agent',
    'non-supervisor raising its own quota',
    'agent registration beyond the universe quota',
    'activation without a complete evaluation gate',
    'activation beyond the concurrent active-agent quota',
    'approval-gated task without a rollback plan',
    'approval-gated task going active without an approver',
    'approving a critical capability',
    'bringing an orbital runtime node online',
    'queueing a task while the kill switch is engaged',
  ];

  for (const expectation of expectations) {
    assert.ok(rlsTest.includes(expectation), `the RLS harness does not cover: ${expectation}`);
  }
});

test('the harness rolls back so it can be run against a live database repeatedly', () => {
  const statements = rlsTest
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('--'));

  assert.equal(statements[0], 'begin;');
  assert.equal(statements[statements.length - 1], 'rollback;');
});
