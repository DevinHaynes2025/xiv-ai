import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AuditLedger } from '../src/audit';
import { ManualClock } from '../src/clock';
import { MANDATORY_HARD_TERMINATION_MS, MAX_AGENT_SPAWN_DEPTH, ResourceGovernor } from '../src/governor';
import { IdFactory } from '../src/ids';
import type { ResourceBudget } from '../src/types';

const TENANT = { organizationId: 'org_a', universeId: 'uni_a' };

function budget(overrides: Partial<ResourceBudget> = {}): ResourceBudget {
  return {
    cpuMillis: 1_000,
    gpuMillis: 0,
    ramMb: 128,
    storageMb: 16,
    networkKb: 256,
    modelCalls: 2,
    modelTokens: 1_000,
    maxDurationMs: 10_000,
    maxAgents: 2,
    maxTasks: 4,
    maxCostUsd: 1,
    hardTerminationMs: 20_000,
    ...overrides,
  };
}

function setup(quotaOverrides: Partial<Parameters<ResourceGovernor['setQuota']>[0]> = {}) {
  const clock = new ManualClock();
  const governor = new ResourceGovernor(clock, new IdFactory(), new AuditLedger(clock, new IdFactory()));
  governor.setQuota({
    tenant: TENANT,
    cpuMillis: 1_000_000,
    gpuMillis: 1_000,
    modelCalls: 1_000,
    modelTokens: 1_000_000,
    costUsd: 1_000,
    concurrentWorkloads: 10,
    ...quotaOverrides,
  });
  return { clock, governor };
}

test('an unenforceable budget is never admitted', () => {
  const { governor } = setup();
  const cases: Partial<ResourceBudget>[] = [
    { cpuMillis: Number.POSITIVE_INFINITY },
    { cpuMillis: Number.NaN },
    { cpuMillis: -1 },
    { hardTerminationMs: 0 },
    { hardTerminationMs: MANDATORY_HARD_TERMINATION_MS + 1 },
    { maxDurationMs: 30_000, hardTerminationMs: 20_000 },
    { maxAgents: 0 },
    { maxTasks: 0 },
  ];
  for (const override of cases) {
    const validation = governor.validateBudget(budget(override));
    assert.equal(validation.ok, false, `expected ${JSON.stringify(override)} to be rejected`);
    assert.throws(
      () => governor.admit({ workloadId: 'wl_bad', tenant: TENANT, budget: budget(override) }),
      (error: { code?: string }) => error.code === 'quota_exceeded',
    );
  }
});

test('a tenant with no quota cannot admit work', () => {
  const clock = new ManualClock();
  const governor = new ResourceGovernor(clock, new IdFactory(), new AuditLedger(clock, new IdFactory()));
  assert.throws(
    () => governor.admit({ workloadId: 'wl_1', tenant: TENANT, budget: budget() }),
    (error: { code?: string }) => error.code === 'quota_exceeded',
  );
});

test('every chargeable dimension is enforced at its limit', () => {
  for (const dimension of ['cpuMillis', 'ramMb', 'storageMb', 'networkKb', 'modelTokens'] as const) {
    const { governor } = setup();
    const lease = governor.admit({ workloadId: `wl_${dimension}`, tenant: TENANT, budget: budget({ [dimension]: 10 }) });
    governor.start(lease);
    governor.charge(lease, dimension, 10);
    assert.throws(
      () => governor.charge(lease, dimension, 0.5),
      (error: { code?: string }) => error.code === 'budget_exceeded',
      `${dimension} was not enforced`,
    );
    assert.equal(lease.terminatedByLimit, dimension);
  }
});

test('duration and the hard termination ceiling both terminate a lease', () => {
  const { clock, governor } = setup();
  const lease = governor.admit({
    workloadId: 'wl_duration',
    tenant: TENANT,
    budget: budget({ maxDurationMs: 1_000, hardTerminationMs: 2_000 }),
  });
  governor.start(lease);
  clock.advance(1_500);
  assert.throws(
    () => governor.enforceDuration(lease),
    (error: { code?: string }) => error.code === 'budget_exceeded',
  );
  clock.advance(1_000);
  assert.throws(
    () => governor.enforceDuration(lease),
    (error: { code?: string }) => error.code === 'hard_termination',
  );
});

test('recursive agent creation is capped by depth, not by budget', () => {
  const { governor } = setup();
  const lease = governor.admit({
    workloadId: 'wl_recursive',
    tenant: TENANT,
    budget: budget({ maxAgents: 1_000 }),
  });
  governor.start(lease);
  for (let depth = 1; depth <= MAX_AGENT_SPAWN_DEPTH; depth += 1) governor.noteAgentSpawn(lease, depth);
  assert.throws(
    () => governor.noteAgentSpawn(lease, MAX_AGENT_SPAWN_DEPTH + 1),
    (error: { code?: string }) => error.code === 'recursion_limit',
  );
});

test('a model-call loop terminates on the budget', () => {
  const { governor } = setup();
  const lease = governor.admit({
    workloadId: 'wl_loop',
    tenant: TENANT,
    budget: budget({ modelCalls: 3, modelTokens: 10_000 }),
  });
  governor.start(lease);
  let calls = 0;
  assert.throws(() => {
    for (let index = 0; index < 1_000; index += 1) {
      governor.noteModelCall(lease, 10, 0);
      calls += 1;
    }
  });
  assert.equal(calls, 3);
});

test('tenant quotas bound the fleet even when each budget is valid', () => {
  const { governor } = setup({ concurrentWorkloads: 2, cpuMillis: 2_500 });
  governor.admit({ workloadId: 'wl_1', tenant: TENANT, budget: budget({ cpuMillis: 1_000 }) });
  governor.admit({ workloadId: 'wl_2', tenant: TENANT, budget: budget({ cpuMillis: 1_000 }) });
  assert.throws(
    () => governor.admit({ workloadId: 'wl_3', tenant: TENANT, budget: budget({ cpuMillis: 1_000 }) }),
    (error: { code?: string }) => error.code === 'quota_exceeded',
  );
  assert.ok(governor.deniedQuotaAttempts >= 1);
});

test('closing a lease writes exactly one usage record and frees concurrency', () => {
  const { clock, governor } = setup({ concurrentWorkloads: 1 });
  const lease = governor.admit({ workloadId: 'wl_close', tenant: TENANT, budget: budget() });
  governor.start(lease);
  governor.charge(lease, 'cpuMillis', 5);
  clock.advance(250);
  const usage = governor.close(lease, 'node_1', { costAttributed: true });

  assert.equal(usage.workloadId, 'wl_close');
  assert.equal(usage.durationMs, 250);
  assert.equal(governor.allUsage().length, 1);
  assert.throws(
    () => governor.charge(lease, 'cpuMillis', 1),
    (error: { code?: string }) => error.code === 'budget_exceeded',
  );
  governor.admit({ workloadId: 'wl_after_close', tenant: TENANT, budget: budget() });
});
