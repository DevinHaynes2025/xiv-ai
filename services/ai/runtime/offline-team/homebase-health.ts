import { createHash } from 'node:crypto';

export type HomebaseHealthEvidence = Readonly<{
  capturedAtMs: number;

  supervisor: Readonly<{
    state: 'RUNNING' | 'STOPPED' | 'UNKNOWN';
    pid: number | null;
    startedAt: string | null;
  }>;

  worker: Readonly<{
    mode: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'UNKNOWN';
    pid: number | null;
    heartbeatMs: number | null;
  }>;

  inference: Readonly<{
    endpoint: '127.0.0.1:11435' | null;
    model: 'qwen2.5:3b' | null;
    inventoryObserved: boolean;
  }>;

  queue: Readonly<{
    ready: number | null;
    running: number | null;
    awaitingReview: number | null;
    failed: number | null;
  }>;

  governance: Readonly<{
    cloudDisabledRequested: boolean;
    automaticCodeApplication: false;
    modelWeightMutation: false;
    productionAuthority: false;
  }>;
}>;

const refused = (): never => {
  throw new Error('HOMEBASE_HEALTH_REFUSED');
};

function exactRecord(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) refused();

  const descriptors = Object.getOwnPropertyDescriptors(value);

  if (
    Reflect.ownKeys(value).length !== keys.length ||
    keys.some(
      key =>
        !descriptors[key] ||
        !('value' in descriptors[key]) ||
        descriptors[key].enumerable !== true,
    )
  ) refused();
}

function safeInteger(
  value: unknown,
  max = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > max
  ) refused();

  return value;
}

function nullableSafeInteger(
  value: unknown,
  max = Number.MAX_SAFE_INTEGER,
): number | null {
  return value === null ? null : safeInteger(value, max);
}

function exactString<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  if (
    typeof value !== 'string' ||
    !allowed.includes(value as T)
  ) refused();

  return value as T;
}

function nullableIsoTimestamp(value: unknown): string | null {
  if (value === null) return null;

  if (
    typeof value !== 'string' ||
    value.length > 40 ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,7})?Z$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) refused();

  return value;
}

export function buildHomebaseHealthSnapshot(
  evidence: unknown,
) {
  exactRecord(evidence, [
    'capturedAtMs',
    'supervisor',
    'worker',
    'inference',
    'queue',
    'governance',
  ]);

  exactRecord(evidence.supervisor, [
    'state',
    'pid',
    'startedAt',
  ]);

  exactRecord(evidence.worker, [
    'mode',
    'pid',
    'heartbeatMs',
  ]);

  exactRecord(evidence.inference, [
    'endpoint',
    'model',
    'inventoryObserved',
  ]);

  exactRecord(evidence.queue, [
    'ready',
    'running',
    'awaitingReview',
    'failed',
  ]);

  exactRecord(evidence.governance, [
    'cloudDisabledRequested',
    'automaticCodeApplication',
    'modelWeightMutation',
    'productionAuthority',
  ]);

  const capturedAtMs = safeInteger(evidence.capturedAtMs);

  const supervisor = Object.freeze({
    state: exactString(
      evidence.supervisor.state,
      ['RUNNING', 'STOPPED', 'UNKNOWN'] as const,
    ),
    pid: nullableSafeInteger(evidence.supervisor.pid, 4_194_304),
    startedAt: nullableIsoTimestamp(evidence.supervisor.startedAt),
  });

  const worker = Object.freeze({
    mode: exactString(
      evidence.worker.mode,
      ['RUNNING', 'PAUSED', 'STOPPED', 'UNKNOWN'] as const,
    ),
    pid: nullableSafeInteger(evidence.worker.pid, 4_194_304),
    heartbeatMs: nullableSafeInteger(evidence.worker.heartbeatMs),
  });

  const supervisorIsRunning =
    supervisor.state === 'RUNNING' &&
    supervisor.pid !== null &&
    supervisor.startedAt !== null;

  const supervisorIsStopped =
    supervisor.state === 'STOPPED' &&
    supervisor.pid === null;

  const supervisorIsUnknown =
    supervisor.state === 'UNKNOWN' &&
    supervisor.pid === null &&
    supervisor.startedAt === null;

  if (
    !supervisorIsRunning &&
    !supervisorIsStopped &&
    !supervisorIsUnknown
  ) {
    refused();
  }

  const workerIsRunning =
    worker.mode === 'RUNNING' &&
    worker.pid !== null &&
    worker.heartbeatMs !== null;

  const workerIsPaused =
    worker.mode === 'PAUSED' &&
    worker.pid !== null;

  const workerIsStopped =
    worker.mode === 'STOPPED' &&
    worker.pid === null;

  const workerIsUnknown =
    worker.mode === 'UNKNOWN' &&
    worker.pid === null &&
    worker.heartbeatMs === null;

  if (
    !workerIsRunning &&
    !workerIsPaused &&
    !workerIsStopped &&
    !workerIsUnknown
  ) {
    refused();
  }

  const endpoint =
    evidence.inference.endpoint === null
      ? null
      : exactString(
          evidence.inference.endpoint,
          ['127.0.0.1:11435'] as const,
        );

  const model =
    evidence.inference.model === null
      ? null
      : exactString(
          evidence.inference.model,
          ['qwen2.5:3b'] as const,
        );

  if (typeof evidence.inference.inventoryObserved !== 'boolean') {
    refused();
  }

  const inventoryObserved = evidence.inference.inventoryObserved;

  const inferenceIsObserved =
    inventoryObserved === true &&
    endpoint !== null &&
    model !== null;

  const inferenceIsUnknown =
    inventoryObserved === false &&
    endpoint === null &&
    model === null;

  if (!inferenceIsObserved && !inferenceIsUnknown) {
    refused();
  }

  const inference = Object.freeze({
    endpoint,
    model,
    inventoryObserved,
  });

  const queue = Object.freeze({
    ready: nullableSafeInteger(evidence.queue.ready, 2_000_000),
    running: nullableSafeInteger(evidence.queue.running, 2_000_000),
    awaitingReview: nullableSafeInteger(
      evidence.queue.awaitingReview,
      2_000_000,
    ),
    failed: nullableSafeInteger(evidence.queue.failed, 2_000_000),
  });

  if (
    typeof evidence.governance.cloudDisabledRequested !== 'boolean' ||
    evidence.governance.automaticCodeApplication !== false ||
    evidence.governance.modelWeightMutation !== false ||
    evidence.governance.productionAuthority !== false
  ) refused();

  const governance = Object.freeze({
    cloudDisabledRequested:
      evidence.governance.cloudDisabledRequested,
    automaticCodeApplication: false as const,
    modelWeightMutation: false as const,
    productionAuthority: false as const,
  });

  const payload = Object.freeze({
    version: 'homebase-health-v1' as const,
    capturedAtMs,
    supervisor,
    worker,
    inference,
    queue,
    governance,
  });

  const digest = createHash('sha256')
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');

  return Object.freeze({
    ...payload,
    receipt: Object.freeze({
      algorithm: 'SHA-256' as const,
      digest,
      verification: 'HEALTH_SNAPSHOT_INTEGRITY_ONLY' as const,
    }),
  });
}

export type HomebaseHealthSnapshot =
  ReturnType<typeof buildHomebaseHealthSnapshot>;
