import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CIVILIZATION_TABLES } from '../store';

function read(relative: string) {
  return readFileSync(new URL(`../../../../${relative}`, import.meta.url), 'utf8');
}

// Each slice is a migration plus the negative tests that prove it. Keeping them
// paired here means a new table cannot be added in one place and forgotten in
// the other.
const SLICES = [
  {
    name: '2I-AI-62A foundation',
    migration: read('supabase/migrations/20260908120000_agent_civilization_foundation.sql'),
    rlsTest: read('supabase/tests/agent_civilization_rls_test.sql'),
  },
  {
    name: '2I-AI-62B meetings',
    migration: read('supabase/migrations/20260908180000_agent_meetings_collective_reasoning.sql'),
    rlsTest: read('supabase/tests/agent_meetings_rls_test.sql'),
  },
] as const;

const allMigrations = SLICES.map((slice) => slice.migration).join('\n');
const allRlsTests = SLICES.map((slice) => slice.rlsTest).join('\n');

// The fifteen tables the story names as the first engineering slice.
const FOUNDATION_TABLES = [
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

// The tables 2I-AI-62B adds. The story names these xiv_agent_meeting_*; they
// land under the existing agent_ convention so the civilization has one set of
// meeting tables rather than two, and the migration header records the mapping.
const MEETING_TABLES = [
  'agent_meeting_messages',
  'agent_meeting_evidence',
  'agent_meeting_proposals',
  'agent_meeting_objections',
  'agent_meeting_votes',
  'agent_meeting_decisions',
  'agent_meeting_actions',
  'agent_meeting_outcomes',
  'agent_meeting_budgets',
  'agent_reputation',
  'agent_directory',
  'agent_control_actions',
  'human_knowledge_records',
  'guardian_observations',
] as const;

function createdTables(sql: string) {
  return [...sql.matchAll(/create table if not exists public\.(\w+)/g)].map((match) => match[1]);
}

const allCreatedTables = createdTables(allMigrations);

test('the migrations create every table named in the engineering slices', () => {
  for (const table of [...FOUNDATION_TABLES, ...MEETING_TABLES]) {
    assert.ok(allCreatedTables.includes(table), `${table} is missing from the migrations`);
  }
});

test('the in-memory tables and the migrations describe the same civilization', () => {
  assert.deepEqual([...allCreatedTables].sort(), [...CIVILIZATION_TABLES].sort());
});

// The story asks for xiv_-prefixed meeting tables. Nothing in this repository
// carries that prefix and 62A already owns agent_meetings, so a literal second
// set would leave two meeting tables with no rule about which is authoritative.
// This asserts the deviation is deliberate and documented rather than a slip.
test('the meetings migration records why it renamed the story tables', () => {
  const migration = SLICES[1].migration;
  assert.match(migration, /xiv_agent_meeting_messages\s+->\s+agent_meeting_messages/);
  assert.equal(/create table if not exists public\.xiv_/.test(allMigrations), false);
});

test('every tenant-bearing table enables and forces row level security', () => {
  for (const table of allCreatedTables) {
    assert.ok(
      allMigrations.includes(`alter table public.${table} enable row level security;`),
      `${table} does not enable RLS`,
    );
    assert.ok(
      allMigrations.includes(`alter table public.${table} force row level security;`),
      `${table} does not force RLS`,
    );
    assert.ok(
      allMigrations.includes(`revoke all on table public.${table} from public, anon;`),
      `${table} is still reachable by anon`,
    );
  }
});

test('every tenant-bearing table has a select policy and a write policy', () => {
  for (const table of allCreatedTables) {
    const policies = [
      ...allMigrations.matchAll(new RegExp(`create policy (\\w+)\\s+on public\\.${table}\\s+for (\\w+)`, 'g')),
    ];
    const commands = policies.map((match) => match[2]);
    assert.ok(commands.includes('select'), `${table} has no select policy`);
    assert.ok(commands.includes('insert') || commands.includes('update'), `${table} has no write policy`);
  }
});

test('no policy is granted to anon or to public', () => {
  const grants = [...allMigrations.matchAll(/for \w+\s+to (\w+)/g)].map((match) => match[1]);
  assert.ok(grants.length > 0);
  assert.deepEqual([...new Set(grants)], ['authenticated']);
  assert.equal(/to\s+anon\b/.test(allMigrations), false);
});

test('every table carries a universe scope except the universe registry itself', () => {
  for (const slice of SLICES) {
    for (const table of createdTables(slice.migration)) {
      if (table === 'universe_lifecycle') continue;
      const start = slice.migration.indexOf(`create table if not exists public.${table}`);
      const definition = slice.migration.slice(start, slice.migration.indexOf(';', start));
      assert.ok(
        definition.includes('universe_id uuid not null references public.universe_lifecycle (id)'),
        `${table} has no universe scope`,
      );
    }
  }
});

// Every table in the 62B slice also carries the organization, so a tenant
// boundary survives a universe being re-parented.
test('every meetings table carries the organization alongside the universe', () => {
  const migration = SLICES[1].migration;
  for (const table of MEETING_TABLES) {
    const start = migration.indexOf(`create table if not exists public.${table}`);
    const definition = migration.slice(start, migration.indexOf(';', start));
    assert.ok(definition.includes('organization_id uuid not null'), `${table} has no organization scope`);
    assert.ok(definition.includes('security_classification'), `${table} has no security classification`);
    assert.ok(definition.includes('retention_policy'), `${table} has no retention policy`);
  }
});

test('the negative test harnesses exercise every table they can see', () => {
  for (const table of allCreatedTables) {
    assert.ok(allRlsTests.includes(`public.${table}`), `${table} is never touched by the RLS negative tests`);
  }
});

test('the foundation harness proves isolation, quotas, gates and the kill switch', () => {
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
    assert.ok(SLICES[0].rlsTest.includes(expectation), `the foundation harness does not cover: ${expectation}`);
  }
});

// The ten checks 62B requires before staging, proved in SQL as well as in
// TypeScript. required-checks.test.ts is the service-layer half of this list.
test('the meetings harness proves all ten required checks in SQL', () => {
  const expectations = [
    'an organization B agent joining an organization A meeting',
    'universe B cannot see universe A meeting messages',
    // Fragments stop short of the apostrophes, which are doubled in SQL literals.
    'a member speaking in another operator',
    'a member recording a decision in another human',
    'an injected instruction did not move the meeting budget',
    'a meeting adding an agent beyond its participant budget',
    'approving a critical capability an injected instruction asked for',
    'deliberating past the meeting message budget',
    'the decision traces back through its proposal to both pieces of evidence',
    'a paused agent speaking in a meeting',
    'speaking in a meeting while the kill switch is engaged',
    'human opinion promoting itself to fact',
    'a supporting vote citing no evidence',
    'a self-declared reputation ceiling is recomputed from the measurements',
    'a high-stakes profession declining human approval',
  ];

  for (const expectation of expectations) {
    assert.ok(SLICES[1].rlsTest.includes(expectation), `the meetings harness does not cover: ${expectation}`);
  }
});

test('the harnesses roll back so they can be run against a live database repeatedly', () => {
  for (const slice of SLICES) {
    const statements = slice.rlsTest
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('--'));

    assert.equal(statements[0], 'begin;', `${slice.name} does not open a transaction`);
    assert.equal(statements[statements.length - 1], 'rollback;', `${slice.name} does not roll back`);
  }
});
