import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ManualClock } from '../src/clock';
import { generateSigningKeys } from '../src/crypto';
import { RuntimePlane } from '../src/plane';
import { createRuntimeHandlers, dispatch, RUNTIME_ROUTES } from '../src/server';
import type { Capability } from '../src/types';

const TENANT_A = { organizationId: 'org_a', universeId: 'uni_ops' };
const TENANT_B = { organizationId: 'org_b', universeId: 'uni_ops' };

const ALL: readonly Capability[] = [
  'node.register',
  'node.control',
  'workload.submit',
  'workload.submit.protected',
  'agent.register',
  'agent.activate',
  'model.invoke',
  'offline.package.issue',
  'offline.external_action',
  'meeting.host',
  'approval.grant',
];

function surface() {
  const plane = new RuntimePlane({ clock: new ManualClock(), keys: generateSigningKeys(), env: {} });
  plane.setTenantQuota({
    tenant: TENANT_A,
    cpuMillis: 1_000_000,
    gpuMillis: 1_000,
    modelCalls: 1_000,
    modelTokens: 1_000_000,
    costUsd: 1_000,
    concurrentWorkloads: 100,
  });
  const operator = plane.principals.enroll({
    kind: 'human',
    tenant: TENANT_A,
    capabilities: ALL,
    maxClassification: 'restricted',
  });
  const foreign = plane.principals.enroll({
    kind: 'human',
    tenant: TENANT_B,
    capabilities: ALL,
    maxClassification: 'restricted',
  });
  const limited = plane.principals.enroll({
    kind: 'service',
    tenant: TENANT_A,
    capabilities: ['workload.submit'],
    maxClassification: 'internal',
  });
  const handlers = createRuntimeHandlers(plane);
  const call = (request: Parameters<typeof dispatch>[2]) => dispatch(plane, handlers, request);
  return { plane, operator, foreign, limited, call };
}

test('every documented route has an implementation', () => {
  const { plane } = surface();
  const handlers = createRuntimeHandlers(plane);
  for (const route of RUNTIME_ROUTES) {
    assert.ok(handlers[`${route.method} ${route.path}`], `${route.method} ${route.path} has no handler`);
  }
  assert.equal(Object.keys(handlers).length, RUNTIME_ROUTES.length, 'handlers and the published contract must match');
});

test('authenticated routes refuse a missing or forged token', () => {
  const { call } = surface();
  for (const route of RUNTIME_ROUTES.filter((entry) => entry.authenticated)) {
    for (const token of [null, 'tok_forged.0123456789abcdef']) {
      const response = call({ method: route.method, path: route.path, token, body: {} });
      assert.equal(response.status, 401, `${route.method} ${route.path} with token ${token}`);
    }
  }
});

test('open routes stay open and carry the contract version', () => {
  const { call } = surface();
  const health = call({ method: 'GET', path: '/healthz' });
  assert.equal(health.status, 200);
  assert.equal(health.headers['x-xiv-contract-version'], '62d.1');

  const contract = call({ method: 'GET', path: '/v1/contract' });
  assert.equal(contract.status, 200);
  assert.equal((contract.body as { routes: unknown[] }).routes.length, RUNTIME_ROUTES.length);
});

test('a capability the principal lacks is refused with 403', () => {
  const { call, limited } = surface();
  const response = call({
    method: 'POST',
    path: '/v1/control/commands',
    token: limited.token,
    body: { kind: 'PAUSE_NODE', targetId: 'node_x', reason: 'test' },
  });
  assert.equal(response.status, 403);
  assert.equal((response.body as { error: string }).error, 'unauthorized');
});

test('a tenant claimed in the body must match the verified principal', () => {
  const { call, operator } = surface();
  const refused = call({
    method: 'POST',
    path: '/v1/agents',
    token: operator.token,
    body: { agentKey: 'a1', tenant: TENANT_B },
  });
  assert.equal(refused.status, 403);
  assert.equal((refused.body as { error: string }).error, 'isolation_violation');

  const accepted = call({
    method: 'POST',
    path: '/v1/agents',
    token: operator.token,
    body: { agentKey: 'a1', tenant: TENANT_A },
  });
  assert.equal(accepted.status, 201);
});

test('a workload spec cannot select a tenant the caller does not hold', () => {
  const { call, plane, operator } = surface();
  plane.onboardNode({ token: operator.token, tenant: TENANT_A, serial: 'srv-1' });
  const response = call({
    method: 'POST',
    path: '/v1/workloads',
    token: operator.token,
    body: {
      spec: {
        workloadId: 'wl_spoof',
        tenant: TENANT_B,
        classification: 'internal',
        requiredCapabilities: ['workload.submit'],
        hardware: { classIds: [plane.hostHardware.classId] },
        budget: {
          cpuMillis: 1_000,
          gpuMillis: 0,
          ramMb: 64,
          storageMb: 8,
          networkKb: 64,
          modelCalls: 1,
          modelTokens: 100,
          maxDurationMs: 5_000,
          maxAgents: 1,
          maxTasks: 1,
          maxCostUsd: 1,
          hardTerminationMs: 10_000,
        },
        consequential: false,
        requiresApproval: false,
      },
    },
  });

  assert.equal(response.status, 202);
  assert.equal(plane.workloadStore.get(TENANT_B, 'wl_spoof'), undefined);
  assert.ok(plane.workloadStore.get(TENANT_A, 'wl_spoof'));
});

test('a foreign workload id is not runnable', () => {
  const { call, plane, operator, foreign } = surface();
  plane.setTenantQuota({
    tenant: TENANT_B,
    cpuMillis: 1_000_000,
    gpuMillis: 1_000,
    modelCalls: 1_000,
    modelTokens: 1_000_000,
    costUsd: 1_000,
    concurrentWorkloads: 100,
  });
  plane.onboardNode({ token: foreign.token, tenant: TENANT_B, serial: 'srv-b' });
  const submitted = call({
    method: 'POST',
    path: '/v1/workloads',
    token: foreign.token,
    body: {
      spec: {
        workloadId: 'wl_foreign',
        tenant: TENANT_B,
        classification: 'internal',
        requiredCapabilities: ['workload.submit'],
        hardware: { classIds: [plane.hostHardware.classId] },
        budget: {
          cpuMillis: 1_000,
          gpuMillis: 0,
          ramMb: 64,
          storageMb: 8,
          networkKb: 64,
          modelCalls: 1,
          modelTokens: 100,
          maxDurationMs: 5_000,
          maxAgents: 1,
          maxTasks: 1,
          maxCostUsd: 1,
          hardTerminationMs: 10_000,
        },
        consequential: false,
        requiresApproval: false,
      },
    },
  });
  assert.equal(submitted.status, 202);

  const stolen = call({
    method: 'POST',
    path: '/v1/workloads/run',
    token: operator.token,
    body: { workloadId: 'wl_foreign' },
  });
  assert.equal(stolen.status, 404);
});

test('unknown routes and wrong methods are distinguished', () => {
  const { call, operator } = surface();
  assert.equal(call({ method: 'GET', path: '/v1/nope', token: operator.token }).status, 404);
  assert.equal(call({ method: 'POST', path: '/healthz', token: operator.token, body: {} }).status, 405);
});

test('a missing required field is a typed 400', () => {
  const { call, operator } = surface();
  const response = call({ method: 'POST', path: '/v1/agents', token: operator.token, body: {} });
  assert.equal(response.status, 400);
  assert.equal((response.body as { error: string }).error, 'malformed');
});

test('a token supplied in the request body is discarded', () => {
  const { call, plane, operator, foreign } = surface();
  plane.onboardNode({ token: operator.token, tenant: TENANT_A, serial: 'srv-2' });
  const response = call({
    method: 'POST',
    path: '/v1/agents',
    token: operator.token,
    body: { agentKey: 'a_smuggled', __token: foreign.token },
  });
  assert.equal(response.status, 201);
  const agent = (response.body as { agent: { tenant: typeof TENANT_A } }).agent;
  assert.deepEqual(agent.tenant, TENANT_A);
});
