import { createHash } from 'node:crypto';
import {
  decideRecovery,
  type RecoveryContext,
  type RecoveryDecision,
} from './recovery-supervisor';

export type FabricConnectivity =
  | 'OFFLINE_ONLY'
  | 'ONLINE_ALLOWED'
  | 'ONLINE_REQUIRED';

export type FabricConfidentiality =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'TOP_SECRET';

export type FabricRisk =
  | 'LOW'
  | 'CONSEQUENTIAL'
  | 'PROHIBITED';

export type FabricDisposition =
  | 'AUTO_CONTINUE'
  | 'AWAITING_REVIEW'
  | 'BLOCKED_OFFLINE'
  | 'REFUSED';

export interface FabricMissionInput {
  missionId: string;
  tenantId: string;
  objective: string;
  connectivity: FabricConnectivity;
  confidentiality: FabricConfidentiality;
  risk: FabricRisk;
  onlineAvailable: boolean;
  maxConcurrentWorkers: number;
  evidenceRefs: readonly string[];
}

export interface FabricPlan {
  version: 'xvi-agent-fabric-v1';
  missionId: string;
  tenantId: string;
  connectivity: FabricConnectivity;
  confidentiality: FabricConfidentiality;
  risk: FabricRisk;
  disposition: FabricDisposition;
  route: 'OFFLINE' | 'ONLINE' | 'NONE';
  maxConcurrentWorkers: number;
  evidenceRefs: readonly string[];
  executesNothing: true;
  productionAuthority: false;
  providerCalls: 0;
  processSpawns: 0;
  receipt: Readonly<{
    algorithm: 'SHA-256';
    digest: string;
    verification: 'ORCHESTRATION_PLAN_INTEGRITY_ONLY';
  }>;
}

export const XVI_AGENT_FABRIC_GUARDRAILS = Object.freeze({
  humanDecision: 'REQUIRED' as const,
  executesNothing: true,
  productionAuthority: false,
  providerCalls: 0,
  processSpawns: 0,
  maximumConcurrentWorkers: 8,
  topSecretOnlineAllowed: false,
  prohibitedActionsExecutable: false,
});

const refuse = (): never => {
  throw new Error('XVI_AGENT_FABRIC_REFUSED');
};

function exactObject(
  value: unknown,
  keys: readonly string[],
): asserts value is Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);

  if (
    ownKeys.length !== keys.length ||
    ownKeys.some(
      key => typeof key !== 'string' || !keys.includes(key),
    ) ||
    keys.some(key => {
      const descriptor = descriptors[key];

      return (
        !descriptor ||
        !('value' in descriptor) ||
        descriptor.enumerable !== true
      );
    })
  ) {
    refuse();
  }
}

function boundedId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

function boundedText(value: unknown, max: number): string {
  if (
    typeof value !== 'string' ||
    value.trim().length < 1 ||
    value.length > max
  ) {
    refuse();
  }

  return value;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T {
  if (
    typeof value !== 'string' ||
    !allowed.includes(value as T)
  ) {
    refuse();
  }

  return value as T;
}

export function buildFabricPlan(
  input: FabricMissionInput,
): Readonly<FabricPlan> {
  exactObject(input, [
    'missionId',
    'tenantId',
    'objective',
    'connectivity',
    'confidentiality',
    'risk',
    'onlineAvailable',
    'maxConcurrentWorkers',
    'evidenceRefs',
  ]);

  const missionId = boundedId(input.missionId);
  const tenantId = boundedId(input.tenantId);

  boundedText(input.objective, 4_000);

  const connectivity = enumValue(
    input.connectivity,
    ['OFFLINE_ONLY', 'ONLINE_ALLOWED', 'ONLINE_REQUIRED'] as const,
  );

  const confidentiality = enumValue(
    input.confidentiality,
    ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'TOP_SECRET'] as const,
  );

  const risk = enumValue(
    input.risk,
    ['LOW', 'CONSEQUENTIAL', 'PROHIBITED'] as const,
  );

  if (typeof input.onlineAvailable !== 'boolean') {
    refuse();
  }

  if (
    !Number.isSafeInteger(input.maxConcurrentWorkers) ||
    input.maxConcurrentWorkers < 1 ||
    input.maxConcurrentWorkers >
      XVI_AGENT_FABRIC_GUARDRAILS.maximumConcurrentWorkers
  ) {
    refuse();
  }

  if (
    !Array.isArray(input.evidenceRefs) ||
    input.evidenceRefs.length > 64
  ) {
    refuse();
  }

  const evidenceRefs = Object.freeze(
    input.evidenceRefs.map(ref => boundedId(ref)),
  );

  let disposition: FabricDisposition;
  let route: FabricPlan['route'];

  if (risk === 'PROHIBITED') {
    disposition = 'REFUSED';
    route = 'NONE';
  } else if (risk === 'CONSEQUENTIAL') {
    disposition = 'AWAITING_REVIEW';
    route = 'NONE';
  } else if (
    confidentiality === 'TOP_SECRET' &&
    connectivity === 'ONLINE_REQUIRED'
  ) {
    disposition = 'REFUSED';
    route = 'NONE';
  } else if (
    confidentiality === 'TOP_SECRET' &&
    connectivity === 'ONLINE_ALLOWED'
  ) {
    disposition = 'AUTO_CONTINUE';
    route = 'OFFLINE';
  } else if (connectivity === 'OFFLINE_ONLY') {
    disposition = 'AUTO_CONTINUE';
    route = 'OFFLINE';
  } else if (
    connectivity === 'ONLINE_REQUIRED' &&
    !input.onlineAvailable
  ) {
    disposition = 'BLOCKED_OFFLINE';
    route = 'NONE';
  } else if (
    connectivity === 'ONLINE_ALLOWED' &&
    !input.onlineAvailable
  ) {
    disposition = 'AUTO_CONTINUE';
    route = 'OFFLINE';
  } else {
    disposition = 'AUTO_CONTINUE';
    route = 'ONLINE';
  }

  const payload = Object.freeze({
    version: 'xvi-agent-fabric-v1' as const,
    missionId,
    tenantId,
    connectivity,
    confidentiality,
    risk,
    disposition,
    route,
    maxConcurrentWorkers: input.maxConcurrentWorkers,
    evidenceRefs,
    executesNothing: true as const,
    productionAuthority: false as const,
    providerCalls: 0 as const,
    processSpawns: 0 as const,
  });

  const digest = createHash('sha256')
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');

  return Object.freeze({
    ...payload,
    receipt: Object.freeze({
      algorithm: 'SHA-256' as const,
      digest,
      verification:
        'ORCHESTRATION_PLAN_INTEGRITY_ONLY' as const,
    }),
  });
}

export interface FabricRecoveryPlan {
  version: 'xvi-agent-fabric-recovery-v1';
  missionId: string;
  tenantId: string;
  decision: RecoveryDecision;
  nextDisposition:
    | 'AUTO_CONTINUE'
    | 'AWAITING_REVIEW'
    | 'REFUSED';
  recoveryMode:
    | 'CHECKPOINT'
    | 'SANDBOX_RETRY'
    | 'REVIEW'
    | 'ABORT';
  executesNothing: true;
  productionAuthority: false;
  receipt: Readonly<{
    algorithm: 'SHA-256';
    digest: string;
    verification: 'RECOVERY_PLAN_INTEGRITY_ONLY';
  }>;
}

function exactRecoveryEvidenceArray(
  value: unknown,
): readonly string[] {
  if (
    !Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Array.prototype ||
    value.length > 64
  ) {
    refuse();
  }

  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);

  const expectedKeys = new Set<string>([
    ...Array.from({ length: value.length }, (_, index) => String(index)),
    'length',
  ]);

  if (
    keys.some(
      key =>
        typeof key !== 'string' ||
        !expectedKeys.has(key),
    )
  ) {
    refuse();
  }

  const lengthDescriptor = descriptors.length;

  if (
    !lengthDescriptor ||
    !('value' in lengthDescriptor) ||
    lengthDescriptor.value !== value.length
  ) {
    refuse();
  }

  const detached: string[] = [];

  for (let index = 0; index < value.length; index++) {
    const descriptor = descriptors[String(index)];

    if (
      !descriptor ||
      !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }

    detached.push(boundedId(descriptor.value));
  }

  return Object.freeze(detached);
}

function canonicalRecoveryContext(
  input: unknown,
): Readonly<RecoveryContext> {
  exactObject(input, [
    'tenantId',
    'jobId',
    'checkpointAvailable',
    'attempts',
    'maxAttempts',
    'classification',
    'evidenceRefs',
  ]);

  const descriptors = Object.getOwnPropertyDescriptors(input);

  const read = (key: string): unknown => {
    const descriptor = descriptors[key];

    if (!descriptor || !('value' in descriptor)) {
      refuse();
    }

    return descriptor.value;
  };

  const tenantId = boundedId(read('tenantId'));
  const jobId = boundedId(read('jobId'));

  const checkpointAvailable = read('checkpointAvailable');

  if (typeof checkpointAvailable !== 'boolean') {
    refuse();
  }

  const attempts = read('attempts');
  const maxAttempts = read('maxAttempts');

  if (
    typeof attempts !== 'number' ||
    !Number.isSafeInteger(attempts) ||
    attempts < 0 ||
    typeof maxAttempts !== 'number' ||
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    attempts > maxAttempts
  ) {
    refuse();
  }

  const classification = enumValue(
    read('classification'),
    ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'TOP_SECRET'] as const,
  );

  const evidenceRefs = exactRecoveryEvidenceArray(
    read('evidenceRefs'),
  );

  return Object.freeze({
    tenantId,
    jobId,
    checkpointAvailable,
    attempts,
    maxAttempts,
    classification,
    evidenceRefs,
  });
}

export function buildFabricRecoveryPlan(
  input: RecoveryContext,
): Readonly<FabricRecoveryPlan> {
  const canonical = canonicalRecoveryContext(input);
  const decision = decideRecovery(canonical);

  const projection =
    decision === 'RESUME_FROM_CHECKPOINT'
      ? {
          nextDisposition: 'AUTO_CONTINUE' as const,
          recoveryMode: 'CHECKPOINT' as const,
        }
      : decision === 'RETRY_SANDBOX'
        ? {
            nextDisposition: 'AUTO_CONTINUE' as const,
            recoveryMode: 'SANDBOX_RETRY' as const,
          }
        : decision === 'PAUSE_FOR_REVIEW'
          ? {
              nextDisposition: 'AWAITING_REVIEW' as const,
              recoveryMode: 'REVIEW' as const,
            }
          : {
              nextDisposition: 'REFUSED' as const,
              recoveryMode: 'ABORT' as const,
            };

  const payload = Object.freeze({
    version: 'xvi-agent-fabric-recovery-v1' as const,
    missionId: canonical.jobId,
    tenantId: canonical.tenantId,
    decision,
    ...projection,
    executesNothing: true as const,
    productionAuthority: false as const,
  });

  const digest = createHash('sha256')
    .update(JSON.stringify(payload), 'utf8')
    .digest('hex');

  return Object.freeze({
    ...payload,
    receipt: Object.freeze({
      algorithm: 'SHA-256' as const,
      digest,
      verification: 'RECOVERY_PLAN_INTEGRITY_ONLY' as const,
    }),
  });
}
