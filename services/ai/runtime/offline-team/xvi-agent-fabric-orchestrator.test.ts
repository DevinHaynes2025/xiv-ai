import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFabricPlan,
  XVI_AGENT_FABRIC_GUARDRAILS,
  type FabricMissionInput,
} from './xvi-agent-fabric-orchestrator';

function mission(): FabricMissionInput {
  return {
    missionId: 'mission-001',
    tenantId: 'tenant-a',
    objective: 'Analyze permitted evidence and prepare a report.',
    connectivity: 'ONLINE_ALLOWED',
    confidentiality: 'INTERNAL',
    risk: 'LOW',
    onlineAvailable: true,
    maxConcurrentWorkers: 4,
    evidenceRefs: ['evidence:1'],
  };
}

test('fabric v1 carries zero execution authority', () => {
  const plan = buildFabricPlan(mission());

  assert.equal(XVI_AGENT_FABRIC_GUARDRAILS.executesNothing, true);
  assert.equal(XVI_AGENT_FABRIC_GUARDRAILS.productionAuthority, false);
  assert.equal(plan.executesNothing, true);
  assert.equal(plan.productionAuthority, false);
  assert.equal(plan.providerCalls, 0);
  assert.equal(plan.processSpawns, 0);
});

test('offline-only missions never route online', () => {
  const input = mission();
  input.connectivity = 'OFFLINE_ONLY';
  input.onlineAvailable = true;

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'AUTO_CONTINUE');
  assert.equal(plan.route, 'OFFLINE');
});

test('online-allowed missions use online when available', () => {
  const plan = buildFabricPlan(mission());

  assert.equal(plan.disposition, 'AUTO_CONTINUE');
  assert.equal(plan.route, 'ONLINE');
});

test('online-allowed missions fall back offline', () => {
  const input = mission();
  input.onlineAvailable = false;

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'AUTO_CONTINUE');
  assert.equal(plan.route, 'OFFLINE');
});

test('online-required missions block when offline', () => {
  const input = mission();
  input.connectivity = 'ONLINE_REQUIRED';
  input.onlineAvailable = false;

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'BLOCKED_OFFLINE');
  assert.equal(plan.route, 'NONE');
});

test('top-secret online-required missions are refused', () => {
  const input = mission();
  input.confidentiality = 'TOP_SECRET';
  input.connectivity = 'ONLINE_REQUIRED';

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'REFUSED');
  assert.equal(plan.route, 'NONE');
});

test('consequential missions stop at review', () => {
  const input = mission();
  input.risk = 'CONSEQUENTIAL';

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'AWAITING_REVIEW');
  assert.equal(plan.route, 'NONE');
});

test('prohibited missions are refused', () => {
  const input = mission();
  input.risk = 'PROHIBITED';

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'REFUSED');
  assert.equal(plan.route, 'NONE');
});

test('concurrency is bounded to eight workers', () => {
  const input = mission();
  input.maxConcurrentWorkers = 9;

  assert.throws(
    () => buildFabricPlan(input),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('unknown fields fail closed', () => {
  const input = mission() as FabricMissionInput & {
    productionOverride?: boolean;
  };

  input.productionOverride = true;

  assert.throws(
    () => buildFabricPlan(input),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('top-level accessors fail closed without invocation', () => {
  const input = mission();
  let invoked = 0;

  Object.defineProperty(input, 'risk', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'LOW';
    },
  });

  assert.throws(
    () => buildFabricPlan(input),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('symbol and hidden top-level fields fail closed', () => {
  const hidden = mission();

  Object.defineProperty(hidden, 'authority', {
    value: true,
    enumerable: false,
  });

  assert.throws(
    () => buildFabricPlan(hidden),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const symbolic = mission();

  Object.defineProperty(symbolic, Symbol('authority'), {
    value: true,
    enumerable: true,
  });

  assert.throws(
    () => buildFabricPlan(symbolic),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('non-plain mission prototypes fail closed', () => {
  const input = mission();

  Object.setPrototypeOf(input, {
    productionAuthority: true,
  });

  assert.throws(
    () => buildFabricPlan(input),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('evidence references are bounded', () => {
  const empty = mission();
  empty.evidenceRefs = [''];

  assert.throws(
    () => buildFabricPlan(empty),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const excessive = mission();
  excessive.evidenceRefs = Array.from(
    { length: 65 },
    (_, index) => `evidence:${index}`,
  );

  assert.throws(
    () => buildFabricPlan(excessive),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('returned plan is detached and deeply frozen', () => {
  const input = mission();
  const plan = buildFabricPlan(input);

  input.evidenceRefs[0] = 'evidence:mutated';
  input.maxConcurrentWorkers = 8;
  input.onlineAvailable = false;

  assert.deepEqual(plan.evidenceRefs, ['evidence:1']);
  assert.equal(plan.maxConcurrentWorkers, 4);
  assert.equal(plan.route, 'ONLINE');

  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.evidenceRefs), true);
  assert.equal(Object.isFrozen(plan.receipt), true);
});

test('identical missions produce identical receipts', () => {
  const a = buildFabricPlan(mission());
  const b = buildFabricPlan(mission());

  assert.equal(a.receipt.digest, b.receipt.digest);
  assert.match(a.receipt.digest, /^[0-9a-f]{64}$/);
  assert.equal(
    a.receipt.verification,
    'ORCHESTRATION_PLAN_INTEGRITY_ONLY',
  );
});

test('changing admitted evidence changes the receipt', () => {
  const a = buildFabricPlan(mission());

  const input = mission();
  input.evidenceRefs = ['evidence:2'];

  const b = buildFabricPlan(input);

  assert.notEqual(a.receipt.digest, b.receipt.digest);
});

test('top-secret online-allowed missions are forced offline', () => {
  const input = mission();

  input.confidentiality = 'TOP_SECRET';
  input.connectivity = 'ONLINE_ALLOWED';
  input.onlineAvailable = true;

  const plan = buildFabricPlan(input);

  assert.equal(plan.disposition, 'AUTO_CONTINUE');
  assert.equal(plan.route, 'OFFLINE');
});

test('checkpointed failure projects resume-from-checkpoint', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const plan = buildFabricRecoveryPlan({
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: true,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL',
    evidenceRefs: ['evidence:1'],
  });

  assert.equal(plan.decision, 'RESUME_FROM_CHECKPOINT');
  assert.equal(plan.recoveryMode, 'CHECKPOINT');
  assert.equal(plan.nextDisposition, 'AUTO_CONTINUE');
  assert.equal(plan.executesNothing, true);
  assert.equal(plan.productionAuthority, false);
});

test('uncheckpointed bounded failure projects sandbox retry', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const plan = buildFabricRecoveryPlan({
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: false,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL',
    evidenceRefs: ['evidence:1'],
  });

  assert.equal(plan.decision, 'RETRY_SANDBOX');
  assert.equal(plan.recoveryMode, 'SANDBOX_RETRY');
  assert.equal(plan.nextDisposition, 'AUTO_CONTINUE');
});

test('top-secret recovery without evidence pauses for review', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const plan = buildFabricRecoveryPlan({
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: true,
    attempts: 0,
    maxAttempts: 3,
    classification: 'TOP_SECRET',
    evidenceRefs: [],
  });

  assert.equal(plan.decision, 'PAUSE_FOR_REVIEW');
  assert.equal(plan.recoveryMode, 'REVIEW');
  assert.equal(plan.nextDisposition, 'AWAITING_REVIEW');
});

test('retry exhaustion projects abort', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const plan = buildFabricRecoveryPlan({
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: false,
    attempts: 3,
    maxAttempts: 3,
    classification: 'INTERNAL',
    evidenceRefs: ['evidence:1'],
  });

  assert.equal(plan.decision, 'ABORT');
  assert.equal(plan.recoveryMode, 'ABORT');
  assert.equal(plan.nextDisposition, 'REFUSED');
});

test('recovery projection carries deterministic integrity-only receipt', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const input = {
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: true,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL' as const,
    evidenceRefs: ['evidence:1'],
  };

  const a = buildFabricRecoveryPlan(input);
  const b = buildFabricRecoveryPlan(input);

  assert.equal(a.receipt.digest, b.receipt.digest);
  assert.match(a.receipt.digest, /^[0-9a-f]{64}$/);

  assert.equal(
    a.receipt.verification,
    'RECOVERY_PLAN_INTEGRITY_ONLY',
  );

  assert.equal(Object.isFrozen(a), true);
  assert.equal(Object.isFrozen(a.receipt), true);
});

test('recovery input accessors fail closed without invocation', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  let invoked = 0;

  const input = {
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: true,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL',
    evidenceRefs: ['evidence:1'],
  };

  Object.defineProperty(input, 'classification', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'INTERNAL';
    },
  });

  assert.throws(
    () => buildFabricRecoveryPlan(input as never),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  assert.equal(invoked, 0);
});

test('recovery undeclared hidden symbol and prototype fields fail closed', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const base = () => ({
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: false,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL' as const,
    evidenceRefs: ['evidence:1'],
  });

  const extra = { ...base(), productionOverride: true };
  assert.throws(
    () => buildFabricRecoveryPlan(extra as never),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const hidden = base();
  Object.defineProperty(hidden, 'authority', {
    value: true,
    enumerable: false,
  });

  assert.throws(
    () => buildFabricRecoveryPlan(hidden),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const symbolic = base();
  Object.defineProperty(symbolic, Symbol('authority'), {
    value: true,
    enumerable: true,
  });

  assert.throws(
    () => buildFabricRecoveryPlan(symbolic),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const inherited = base();
  Object.setPrototypeOf(inherited, { authority: true });

  assert.throws(
    () => buildFabricRecoveryPlan(inherited),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('recovery counters are coherent bounded safe integers', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const invalid = [
    { attempts: -1, maxAttempts: 3 },
    { attempts: 1.5, maxAttempts: 3 },
    { attempts: 1, maxAttempts: 0 },
    { attempts: 4, maxAttempts: 3 },
    { attempts: Number.NaN, maxAttempts: 3 },
    { attempts: 1, maxAttempts: Number.POSITIVE_INFINITY },
  ];

  for (const counters of invalid) {
    assert.throws(
      () =>
        buildFabricRecoveryPlan({
          tenantId: 'tenant-a',
          jobId: 'mission-001',
          checkpointAvailable: false,
          attempts: counters.attempts,
          maxAttempts: counters.maxAttempts,
          classification: 'INTERNAL',
          evidenceRefs: ['evidence:1'],
        }),
      /XVI_AGENT_FABRIC_REFUSED/,
    );
  }
});

test('recovery identity and classification fail closed', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  assert.throws(
    () =>
      buildFabricRecoveryPlan({
        tenantId: '',
        jobId: 'mission-001',
        checkpointAvailable: false,
        attempts: 1,
        maxAttempts: 3,
        classification: 'INTERNAL',
        evidenceRefs: ['evidence:1'],
      }),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  assert.throws(
    () =>
      buildFabricRecoveryPlan({
        tenantId: 'tenant-a',
        jobId: 'mission-001',
        checkpointAvailable: false,
        attempts: 1,
        maxAttempts: 3,
        classification: 'ROOT_SECRET' as never,
        evidenceRefs: ['evidence:1'],
      }),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('recovery evidence array is exact bounded data', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const sparse = new Array<string>(1);

  assert.throws(
    () =>
      buildFabricRecoveryPlan({
        tenantId: 'tenant-a',
        jobId: 'mission-001',
        checkpointAvailable: false,
        attempts: 1,
        maxAttempts: 3,
        classification: 'INTERNAL',
        evidenceRefs: sparse,
      }),
    /XVI_AGENT_FABRIC_REFUSED/,
  );

  const refs = ['evidence:1'];

  Object.defineProperty(refs, '0', {
    enumerable: true,
    get() {
      throw new Error('EVIDENCE_ACCESSOR_INVOKED');
    },
  });

  assert.throws(
    () =>
      buildFabricRecoveryPlan({
        tenantId: 'tenant-a',
        jobId: 'mission-001',
        checkpointAvailable: false,
        attempts: 1,
        maxAttempts: 3,
        classification: 'INTERNAL',
        evidenceRefs: refs,
      }),
    /XVI_AGENT_FABRIC_REFUSED/,
  );
});

test('recovery plan is detached from caller mutation', async () => {
  const { buildFabricRecoveryPlan } =
    await import('./xvi-agent-fabric-orchestrator');

  const input = {
    tenantId: 'tenant-a',
    jobId: 'mission-001',
    checkpointAvailable: true,
    attempts: 1,
    maxAttempts: 3,
    classification: 'INTERNAL' as const,
    evidenceRefs: ['evidence:1'],
  };

  const plan = buildFabricRecoveryPlan(input);

  input.tenantId = 'tenant-mutated';
  input.jobId = 'mission-mutated';
  input.attempts = 3;
  input.evidenceRefs[0] = 'evidence:mutated';

  assert.equal(plan.tenantId, 'tenant-a');
  assert.equal(plan.missionId, 'mission-001');
  assert.equal(plan.decision, 'RESUME_FROM_CHECKPOINT');
  assert.equal(plan.recoveryMode, 'CHECKPOINT');
  assert.equal(plan.nextDisposition, 'AUTO_CONTINUE');
});
