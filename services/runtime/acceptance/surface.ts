/**
 * AC-18 build and change integrity.
 * AC-19 runtime control surface contract.
 * AC-20 runtime performance and scale.
 *
 * The AC-18 and AC-19 titles are this suite's reading of those two criteria for
 * the runtime layer: change integrity for the gates that must hold before a
 * canary, and the control surface contract for the API the fleet is driven
 * through. If the intended criteria differ, the thresholds below need remapping
 * before the scorecard is trusted for those two rows.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { generateSigningKeys } from '../src/crypto';
import { LOCAL_REFERENCE_MODEL_ID, RUNTIME_CONTRACT_VERSION, RuntimePlane } from '../src/plane';
import { RUNTIME_ROUTES, createRuntimeServer } from '../src/server';
import { SHIPPING_RUNTIMES } from '../tools/sbom';
import { findLeakedValues } from '../tools/secret-scan';
import type { AcceptanceResult, Threshold } from './harness';
import {
  ALL_CAPABILITIES,
  TENANT_A,
  TENANT_B,
  atLeast,
  atMost,
  boolean as booleanThreshold,
  buildFixture,
  percent,
  percentileOf,
  standardBudget,
  standardQuota,
  summarize,
  workloadSpec,
  zero,
} from './harness';
import type { Capability } from '../src/types';

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(runtimeRoot, '../..');

/** Every acceptance criterion this suite is required to produce evidence for. */
export const REQUIRED_AC_IDS = Array.from({ length: 24 }, (_, index) => `AC-${String(index + 1).padStart(2, '0')}`);

type CommandResult = { ok: boolean; code: number; output: string };

function runCommand(command: string, args: string[], cwd: string, timeoutMs = 600_000): CommandResult {
  try {
    const output = execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, code: 0, output };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string; message?: string };
    return {
      ok: false,
      code: failure.status ?? 1,
      output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` || (failure.message ?? 'command failed'),
    };
  }
}

export function runAc18(): AcceptanceResult {
  const typecheck = runCommand('npx', ['tsc', '--noEmit'], runtimeRoot);
  const typecheckErrors = typecheck.output.split('\n').filter((line) => /error TS\d+:/.test(line)).length;

  const testFiles = readdirSync(join(runtimeRoot, 'test'))
    .filter((file) => file.endsWith('.test.ts'))
    .map((file) => join('test', file))
    .sort();
  const unit = runCommand('node', ['--import', 'tsx', '--test', ...testFiles], runtimeRoot);
  const readCount = (label: string) => {
    const match = new RegExp(`^# ${label} (\\d+)$`, 'm').exec(unit.output);
    return match ? Number(match[1]) : 0;
  };
  const tests = readCount('tests');
  const passed = readCount('pass');
  const failed = readCount('fail');
  const skipped = readCount('skipped') + readCount('todo');

  // Which acceptance criteria have a registered evidence producer. Read from the
  // runner source so a criterion cannot be silently dropped from the suite.
  const runnerSource = readFileSync(join(runtimeRoot, 'acceptance/run.ts'), 'utf8');
  const registered = REQUIRED_AC_IDS.filter((id) => runnerSource.includes(`'${id}'`));

  const manifest = JSON.parse(readFileSync(join(runtimeRoot, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const requiredScripts = ['typecheck', 'test', 'acceptance', 'scan:secrets', 'sbom', 'verify:rls'];
  const presentScripts = requiredScripts.filter((script) => Boolean(manifest.scripts?.[script]));

  const lockfiles = SHIPPING_RUNTIMES.filter((runtime) => existsSync(join(repoRoot, runtime, 'package-lock.json')));

  const thresholds: Threshold[] = [
    zero(
      'typecheck_errors',
      'Type errors in the runtime package',
      // A compiler that never started emits no `error TS` lines, so counting
      // only those would report a clean typecheck for a run that did not happen.
      typecheck.ok ? typecheckErrors : Math.max(1, typecheckErrors),
      {
        blocker: true,
        note: typecheck.ok
          ? 'tsc --noEmit exited 0 with no diagnostics'
          : `tsc --noEmit exited ${typecheck.code}: ${typecheck.output.split('\n').filter(Boolean).slice(-1)[0] ?? 'no output'}`,
      },
    ),
    atLeast('unit_pass_rate', 'Unit test pass rate', percent(passed, Math.max(1, tests)), 100, { blocker: true }),
    zero('unit_failures', 'Failing unit tests', failed, { blocker: true }),
    zero('skipped_tests', 'Skipped or pending tests', skipped, {
      blocker: true,
      note: 'a skipped test is not evidence, so the suite is required to run every case',
    }),
    atLeast(
      'ac_coverage',
      'Acceptance criteria with a registered evidence producer',
      percent(registered.length, REQUIRED_AC_IDS.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'verification_scripts',
      'Verification entry points wired into the package',
      percent(presentScripts.length, requiredScripts.length),
      100,
      { blocker: true },
    ),
    atLeast(
      'lockfile_coverage',
      'Shipping runtimes with a committed lockfile',
      percent(lockfiles.length, SHIPPING_RUNTIMES.length),
      100,
      { blocker: true },
    ),
  ];

  return summarize('AC-18', 'Build & Change Integrity', thresholds, {
    typecheckCommand: 'npx tsc --noEmit (services/runtime)',
    typecheckExitCode: typecheck.code,
    typecheckTail: typecheck.output.split('\n').filter(Boolean).slice(-5),
    unitCommand: `node --import tsx --test ${testFiles.join(' ')} (services/runtime)`,
    unitTests: tests,
    unitPassed: passed,
    unitFailed: failed,
    unitSkipped: skipped,
    unitTail: unit.output.split('\n').filter(Boolean).slice(-8),
    registeredAcIds: registered,
    missingAcIds: REQUIRED_AC_IDS.filter((id) => !registered.includes(id)),
    requiredScripts,
    note: 'This criterion is measured by running the type checker and the unit suite inside the acceptance run, so its evidence is the output of those commands rather than a claim about them.',
  });
}

type ApiCall = {
  name: string;
  status: number;
  expected: number | number[];
  ok: boolean;
  body: unknown;
  headerPresent: boolean;
};

export async function runAc19(): Promise<AcceptanceResult> {
  const { plane, operatorA, operatorB, limitedA } = buildFixture();
  const nodeA = plane.onboardNode({ token: operatorA.token, tenant: TENANT_A, serial: 'api-a' });
  const nodeB = plane.onboardNode({ token: operatorB.token, tenant: TENANT_B, serial: 'api-b' });
  const hardware = { classIds: [plane.hostHardware.classId] };
  const foreignWorkload = plane.engine.submit({
    token: operatorB.token,
    spec: workloadSpec({ tenant: TENANT_B, hardware }),
  });

  const server = createRuntimeServer(plane);
  await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', () => resolveListen()));
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  const calls: ApiCall[] = [];
  const responseBodies: string[] = [];

  const call = async (
    name: string,
    init: {
      method?: string;
      path: string;
      token?: string | null;
      body?: unknown;
      raw?: string;
      expected: number | number[];
    },
  ): Promise<ApiCall> => {
    const headers: Record<string, string> = {};
    if (init.token) headers.authorization = `Bearer ${init.token}`;
    if (init.body !== undefined || init.raw !== undefined) headers['content-type'] = 'application/json';
    let response: Response;
    let text: string;
    try {
      response = await fetch(`${base}${init.path}`, {
        method: init.method ?? (init.body !== undefined || init.raw !== undefined ? 'POST' : 'GET'),
        headers,
        body: init.raw ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
      });
      text = await response.text();
    } catch (error) {
      // A transport failure is a contract failure, recorded rather than thrown:
      // a suite that crashes here would report nothing at all.
      const failure: ApiCall = {
        name,
        status: 0,
        expected: init.expected,
        ok: false,
        body: { error: 'transport_failure', message: error instanceof Error ? error.message : 'unknown' },
        headerPresent: false,
      };
      calls.push(failure);
      return failure;
    }
    responseBodies.push(text);
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      /* non-JSON responses are recorded verbatim and fail the contract check */
    }
    const expected = Array.isArray(init.expected) ? init.expected : [init.expected];
    const result: ApiCall = {
      name,
      status: response.status,
      expected: init.expected,
      ok: expected.includes(response.status),
      body: parsed,
      headerPresent: response.headers.get('x-xiv-contract-version') === RUNTIME_CONTRACT_VERSION,
    };
    calls.push(result);
    return result;
  };

  try {
    // 1. Every documented route answers, driven from the declared inventory.
    const happyPath: Record<string, { body?: unknown; expected: number | number[]; token?: string }> = {
      'GET /healthz': { expected: 200 },
      'GET /v1/contract': { expected: 200 },
      'POST /v1/nodes/enroll': { body: { serial: 'api-enroll-1' }, expected: 201 },
      'POST /v1/nodes/register': { expected: [201, 200] },
      'GET /v1/nodes': { expected: 200 },
      'POST /v1/nodes/attest': {
        body: {
          nodeId: nodeA.nodeId,
          measurements: { boot_chain: 'measured', runtime_image: 'xiv-runtime-62d.1', policy_bundle: 'guardian-v1' },
        },
        expected: 201,
      },
      'POST /v1/workloads': { expected: 202 },
      'POST /v1/workloads/run': { expected: 200 },
      'GET /v1/workloads': { expected: 200 },
      'POST /v1/agents': { body: { agentKey: 'api-agent-1', classification: 'internal' }, expected: 201 },
      'GET /v1/agents': { expected: 200 },
      'POST /v1/control/commands': {
        body: { kind: 'PAUSE_NODE', targetId: nodeA.nodeId, reason: 'api_contract_test' },
        expected: 200,
      },
      'GET /v1/audit': { expected: 200 },
      'GET /v1/fleet/health': { expected: 200 },
    };

    // Enrollment and registration are chained so registration has a real ticket.
    const enrollment = await call('POST /v1/nodes/enroll', {
      path: '/v1/nodes/enroll',
      token: operatorA.token,
      body: happyPath['POST /v1/nodes/enroll']?.body,
      expected: 201,
    });
    const ticket = (enrollment.body as { ticket?: { fingerprint: string } }).ticket;
    await call('POST /v1/nodes/register', {
      path: '/v1/nodes/register',
      token: operatorA.token,
      body: { ticket, fingerprint: ticket?.fingerprint },
      expected: [200, 201],
    });

    const apiWorkload = workloadSpec({ tenant: TENANT_A, hardware, modelId: LOCAL_REFERENCE_MODEL_ID });
    await call('POST /v1/workloads', {
      path: '/v1/workloads',
      token: operatorA.token,
      body: { spec: apiWorkload },
      expected: 202,
    });
    await call('POST /v1/workloads/run', {
      path: '/v1/workloads/run',
      token: operatorA.token,
      body: { workloadId: apiWorkload.workloadId, iterations: 200 },
      expected: 200,
    });

    for (const [key, expectation] of Object.entries(happyPath)) {
      if (calls.some((entry) => entry.name === key)) continue;
      const [method, path] = key.split(' ') as [string, string];
      await call(key, {
        method,
        path,
        token: operatorA.token,
        body: expectation.body,
        expected: expectation.expected,
      });
    }

    // 2. Authentication is required on every authenticated route.
    const authRoutes = RUNTIME_ROUTES.filter((route) => route.authenticated);
    for (const route of authRoutes) {
      await call(`unauthenticated ${route.method} ${route.path}`, {
        method: route.method,
        path: route.path,
        token: null,
        body: route.method === 'POST' ? {} : undefined,
        expected: 401,
      });
      await call(`bad-token ${route.method} ${route.path}`, {
        method: route.method,
        path: route.path,
        token: 'tok_forged.deadbeef',
        body: route.method === 'POST' ? {} : undefined,
        expected: 401,
      });
    }

    // 3. Capability enforcement: a service principal holding only
    //    `workload.submit` cannot reach the control or enrollment routes.
    const capabilityRoutes = RUNTIME_ROUTES.filter(
      (route) => route.capability && !(['workload.submit'] as readonly string[]).includes(route.capability),
    );
    for (const route of capabilityRoutes) {
      await call(`capability ${route.method} ${route.path}`, {
        method: route.method,
        path: route.path,
        token: limitedA.token,
        body: route.method === 'POST' ? {} : undefined,
        expected: 403,
      });
    }

    // 4. Tenant isolation across the API boundary.
    const foreignList = await call('cross-tenant node list', {
      path: '/v1/nodes',
      token: operatorA.token,
      expected: 200,
    });
    const listedForeignNodes = JSON.stringify(foreignList.body).includes(nodeB.nodeId) ? 1 : 0;
    await call('cross-tenant workload run', {
      path: '/v1/workloads/run',
      token: operatorA.token,
      body: { workloadId: foreignWorkload.record.workloadId },
      expected: 404,
    });
    await call('cross-tenant attest', {
      path: '/v1/nodes/attest',
      token: operatorA.token,
      body: { nodeId: nodeB.nodeId, measurements: { boot_chain: 'measured' } },
      expected: 404,
    });
    await call('claimed foreign tenant in body', {
      path: '/v1/agents',
      token: operatorA.token,
      body: { agentKey: 'api-agent-foreign', tenant: TENANT_B },
      expected: 403,
    });
    await call('control command against foreign node', {
      path: '/v1/control/commands',
      token: operatorA.token,
      body: { kind: 'REVOKE_NODE', targetId: nodeB.nodeId, reason: 'negative_test' },
      expected: [200, 403, 404],
    });
    const foreignAudit = await call('tenant-scoped audit', {
      path: '/v1/audit?limit=200',
      token: operatorB.token,
      expected: 200,
    });
    const auditLeak = JSON.stringify(foreignAudit.body).includes(nodeA.nodeId) ? 1 : 0;

    // 5. Malformed and hostile inputs.
    await call('malformed json', {
      method: 'POST',
      path: '/v1/agents',
      token: operatorA.token,
      raw: '{"agentKey": ',
      expected: 400,
    });
    await call('json array body', {
      method: 'POST',
      path: '/v1/agents',
      token: operatorA.token,
      raw: '[1,2,3]',
      expected: 400,
    });
    await call('missing required field', {
      path: '/v1/agents',
      token: operatorA.token,
      body: {},
      expected: 400,
    });
    await call('oversized body', {
      method: 'POST',
      path: '/v1/agents',
      token: operatorA.token,
      raw: JSON.stringify({ agentKey: 'x'.repeat(200_000) }),
      expected: [400, 413],
    });
    await call('unknown route', { path: '/v1/does-not-exist', token: operatorA.token, expected: 404 });
    await call('method not allowed', {
      method: 'POST',
      path: '/healthz',
      token: operatorA.token,
      body: {},
      expected: 405,
    });
    await call('unauthenticated health', { path: '/healthz', token: null, expected: 200 });

    const contractRoutes = (
      (calls.find((entry) => entry.name === 'GET /v1/contract')?.body as { routes?: unknown[] } | undefined)?.routes ?? []
    ).length;

    const documentedAnswered = RUNTIME_ROUTES.filter((route) =>
      calls.some((entry) => entry.name === `${route.method} ${route.path}` && entry.ok),
    ).length;
    const notImplemented = calls.filter(
      (entry) => typeof entry.body === 'object' && entry.body !== null && 'error' in entry.body && (entry.body as { error?: string }).error === 'route_not_implemented',
    ).length;
    const unauthenticatedRefused = calls.filter((entry) => entry.name.startsWith('unauthenticated ') || entry.name.startsWith('bad-token '));
    const capabilityRefused = calls.filter((entry) => entry.name.startsWith('capability '));
    const malformedCalls = calls.filter((entry) =>
      ['malformed json', 'json array body', 'missing required field', 'oversized body', 'unknown route', 'method not allowed'].includes(
        entry.name,
      ),
    );
    const serverErrors = calls.filter((entry) => entry.status >= 500).length;
    const headerCoverage = calls.filter((entry) => entry.headerPresent).length;
    const errorBodiesTyped = calls
      .filter((entry) => entry.status >= 400)
      .filter((entry) => typeof (entry.body as { error?: unknown })?.error === 'string').length;
    const errorResponses = calls.filter((entry) => entry.status >= 400).length;

    const needles = [...Object.values(plane.keys), operatorA.token, operatorB.token, limitedA.token];
    const responseLeaks = findLeakedValues(responseBodies.join('\n'), needles).length;

    const thresholds: Threshold[] = [
      atLeast(
        'documented_routes_answered',
        'Documented routes implemented and answering',
        percent(documentedAnswered, RUNTIME_ROUTES.length),
        100,
        { blocker: true },
      ),
      zero('unimplemented_documented_routes', 'Documented routes without an implementation', notImplemented, {
        blocker: true,
      }),
      atLeast(
        'unauthenticated_refused',
        'Unauthenticated and forged-token requests refused',
        percent(unauthenticatedRefused.filter((entry) => entry.ok).length, unauthenticatedRefused.length),
        100,
        { blocker: true },
      ),
      atLeast(
        'capability_refused',
        'Requests without the required capability refused',
        percent(capabilityRefused.filter((entry) => entry.ok).length, capabilityRefused.length),
        100,
        { blocker: true },
      ),
      zero('cross_tenant_api_reads', 'Cross-tenant data returned through the API', listedForeignNodes + auditLeak, {
        blocker: true,
      }),
      atLeast(
        'malformed_handled',
        'Malformed and hostile inputs handled with a typed refusal',
        percent(malformedCalls.filter((entry) => entry.ok).length, malformedCalls.length),
        100,
        { blocker: true },
      ),
      zero('server_errors', 'Unhandled 5xx responses across the contract suite', serverErrors, { blocker: true }),
      atLeast('contract_header', 'Responses carrying the contract version', percent(headerCoverage, calls.length), 100, {
        blocker: false,
      }),
      atLeast('typed_errors', 'Error responses carrying a stable error code', percent(errorBodiesTyped, errorResponses), 100, {
        blocker: true,
      }),
      zero('response_secret_leaks', 'Signing material or tokens present in API responses', responseLeaks, {
        blocker: true,
      }),
      booleanThreshold(
        'contract_self_describing',
        'Route inventory published by the service matches the implementation',
        contractRoutes === RUNTIME_ROUTES.length,
      ),
    ];

    return summarize('AC-19', 'Runtime Control Surface Contract', thresholds, {
      transport: 'real HTTP over 127.0.0.1 on an ephemeral port',
      contractVersion: RUNTIME_CONTRACT_VERSION,
      documentedRoutes: RUNTIME_ROUTES.length,
      callsMade: calls.length,
      failedExpectations: calls.filter((entry) => !entry.ok).map((entry) => ({
        name: entry.name,
        status: entry.status,
        expected: entry.expected,
      })),
      statusDistribution: calls.reduce<Record<string, number>>((counts, entry) => {
        counts[String(entry.status)] = (counts[String(entry.status)] ?? 0) + 1;
        return counts;
      }, {}),
      note: 'Every call in this evidence was made over a socket against the same handler table the service exposes; there is no second in-process path.',
    });
  } finally {
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  }
}

export function runAc20(): AcceptanceResult {
  const CONCURRENT_TASKS = 1_000;
  // A real clock: the manual clock used elsewhere would make these latencies
  // synthetic, and a synthetic latency is not a measurement.
  const plane = new RuntimePlane({ keys: generateSigningKeys(), env: {}, version: '62d.1.0' });
  plane.setTenantQuota(standardQuota(TENANT_A, { concurrentWorkloads: 2_000, cpuMillis: 1_000_000_000 }));
  const { record, token } = plane.principals.enroll({
    kind: 'human',
    tenant: TENANT_A,
    capabilities: ALL_CAPABILITIES as readonly Capability[],
    maxClassification: 'restricted',
  });
  void record;

  const NODES = 8;
  for (let index = 0; index < NODES; index += 1) {
    plane.onboardNode({
      token,
      tenant: TENANT_A,
      serial: `perf-${index}`,
      capacity: { cpuMillis: 400_000, gpuMillis: 0, ramMb: 32_768, concurrentWorkloads: 200 },
    });
  }

  const hardware = { classIds: [plane.hostHardware.classId] };
  const budget = standardBudget({ cpuMillis: 1_000, ramMb: 64, modelCalls: 1, modelTokens: 1_000, maxTasks: 2 });

  const admissionMs: number[] = [];
  const admitted: string[] = [];
  const rejections: Record<string, number> = {};

  const suiteStart = performance.now();
  for (let index = 0; index < CONCURRENT_TASKS; index += 1) {
    const spec = workloadSpec({
      tenant: TENANT_A,
      hardware,
      budget,
      modelId: LOCAL_REFERENCE_MODEL_ID,
      workloadId: `perf_${index}`,
      sourceId: 'ac20_load',
    });
    const started = performance.now();
    const outcome = plane.engine.submit({ token, spec });
    admissionMs.push(performance.now() - started);
    if (outcome.rejection) {
      const code = outcome.rejection.code;
      rejections[code] = (rejections[code] ?? 0) + 1;
    } else {
      admitted.push(spec.workloadId);
    }
  }
  const concurrentlyAdmitted = plane.engine.activeCount;
  const admissionWallMs = performance.now() - suiteStart;

  // The admitted set is executed interleaved in rounds so the fleet is holding
  // every task concurrently rather than draining one at a time.
  const executionMs: number[] = [];
  const errors: Record<string, number> = {};
  let completed = 0;
  let terminated = 0;
  const executionStart = performance.now();
  const ROUNDS = 4;
  for (let round = 0; round < ROUNDS; round += 1) {
    for (let index = round; index < admitted.length; index += ROUNDS) {
      const workloadId = admitted[index] as string;
      const started = performance.now();
      const outcome = plane.engine.run({ workloadId, iterations: 400, modelUsage: { tokensIn: 32, tokensOut: 32 } });
      executionMs.push(performance.now() - started);
      if (outcome.error) errors[outcome.error.code] = (errors[outcome.error.code] ?? 0) + 1;
      if (outcome.record.state === 'completed') completed += 1;
      if (outcome.record.state === 'terminated') terminated += 1;
    }
  }
  const executionWallMs = performance.now() - executionStart;

  const startLatencies = admitted
    .map((workloadId) => plane.workloadStore.get(TENANT_A, workloadId)?.startLatencyMs ?? null)
    .filter((value): value is number => value !== null);
  const unbounded = plane.governor
    .allUsage()
    .filter((usage) => usage.durationMs > budget.hardTerminationMs && usage.terminatedByLimit === null).length;
  const leakedLeases = plane.engine.activeCount;

  const thresholds: Threshold[] = [
    atLeast(
      'concurrent_admission',
      'Bounded synthetic tasks concurrently admitted',
      percent(concurrentlyAdmitted, CONCURRENT_TASKS),
      100,
      { blocker: true },
    ),
    atLeast('completion_rate', 'Bounded synthetic tasks completed', percent(completed, CONCURRENT_TASKS), 99, {
      blocker: true,
    }),
    atMost(
      'error_rate',
      'Task error rate under load',
      percent(Object.values(errors).reduce((total, count) => total + count, 0), CONCURRENT_TASKS),
      1,
      '%',
      { blocker: true },
    ),
    atMost('p95_admission', 'p95 admission latency', percentileOf(admissionMs, 95), 50, 'ms', { blocker: false }),
    atMost('p99_admission', 'p99 admission latency', percentileOf(admissionMs, 99), 150, 'ms', { blocker: false }),
    atMost('p95_execution', 'p95 bounded execution latency', percentileOf(executionMs, 95), 50, 'ms', { blocker: false }),
    zero('unbounded_tasks', 'Tasks running past the hard termination limit', unbounded, { blocker: true }),
    zero('leaked_leases', 'Budget leases still open after the run', leakedLeases, { blocker: true }),
    zero(
      'unauthorized_executions',
      'Executions without a guardian clearance under load',
      plane.engine.unauthorizedExecutionCount,
      { blocker: true },
    ),
  ];

  return summarize('AC-20', 'Runtime Performance & Scale', thresholds, {
    concurrentTasks: CONCURRENT_TASKS,
    nodes: NODES,
    admitted: admitted.length,
    rejections,
    completed,
    terminated,
    errors,
    admissionWallMs: Math.round(admissionWallMs),
    executionWallMs: Math.round(executionWallMs),
    tasksPerSecond: Math.round(completed / (executionWallMs / 1000)),
    admissionLatencyMs: {
      p50: Number(percentileOf(admissionMs, 50).toFixed(3)),
      p95: Number(percentileOf(admissionMs, 95).toFixed(3)),
      p99: Number(percentileOf(admissionMs, 99).toFixed(3)),
      max: Number(Math.max(...admissionMs).toFixed(3)),
    },
    executionLatencyMs: {
      p50: Number(percentileOf(executionMs, 50).toFixed(3)),
      p95: Number(percentileOf(executionMs, 95).toFixed(3)),
      p99: Number(percentileOf(executionMs, 99).toFixed(3)),
      max: Number(Math.max(...executionMs).toFixed(3)),
    },
    startLatencyMs: {
      p95: Number(percentileOf(startLatencies, 95).toFixed(3)),
      samples: startLatencies.length,
    },
    heapUsedMb: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
    note: 'This is one process on one host holding 1,000 bounded tasks concurrently admitted. It is a control-plane scale measurement, not a claim about a distributed fleet under production traffic, and the latency ceilings are this suite\'s declared 62D baselines.',
  });
}

export async function runSurfaceAcceptance(): Promise<AcceptanceResult[]> {
  return [await runAc19(), runAc20()];
}

