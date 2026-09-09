/**
 * 62L-EM4 — Signed CPU/GPU/NPU message envelope pipeline
 *
 * Agent → policy gate → compute registry → resource governor →
 * verified device → execution → signed return receipt → XIV Home Base
 *
 * Hard rule: GPU/NPU request that silently runs on CPU MUST set
 * fallbackUsed=true and actualExecutionDevice=CPU. CPU success does NOT
 * verify the requested accelerator (soft-wires EL8 silent-fallback rule).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  EM4_LOCKS,
  DATA_CLASS_RANK,
  VERIFICATION_STATE_RANK,
  type AgentComputeGrant,
  type ComputeDevice,
  type ComputeMessageRequest,
  type ComputeReturnReceipt,
  type Em4FailureClass,
  type EnvelopePipelineResult,
  type ExecutionAttempt,
  type PolicyGateDecision,
  type RegistryDeviceRecord,
  type ResourceEvidence,
  type SignedComputeMessageRequest,
  type SignedComputeReturnReceipt,
  type VerificationState,
} from './em4-message-envelope-types.ts';
import { em4SoftWireSnapshot } from './em4-soft-wire.ts';

export * from './em4-message-envelope-types.ts';
export { em4SoftWireSnapshot, assertEm4LocksIntact } from './em4-soft-wire.ts';

const DEFAULT_KEY_ID = 'xiv-em4-dev-hmac';

function canonicalJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort());
}

function hmacSign(payload: unknown, secret: string): string {
  return createHmac('sha256', secret).update(canonicalJson(payload)).digest('hex');
}

function hmacVerify(payload: unknown, signature: string, secret: string): boolean {
  const expected = hmacSign(payload, secret);
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function signComputeRequest(
  payload: ComputeMessageRequest,
  secret: string,
  keyId: string = DEFAULT_KEY_ID,
  signedAt: string = new Date().toISOString(),
): SignedComputeMessageRequest {
  return {
    payload,
    signature: hmacSign(payload, secret),
    algorithm: 'HMAC-SHA256',
    signedAt,
    keyId,
  };
}

export function verifyComputeRequest(
  signed: SignedComputeMessageRequest,
  secret: string,
): boolean {
  return hmacVerify(signed.payload, signed.signature, secret);
}

export function signReturnReceipt(
  payload: ComputeReturnReceipt,
  secret: string,
  keyId: string = DEFAULT_KEY_ID,
  signedAt: string = new Date().toISOString(),
): SignedComputeReturnReceipt {
  return {
    payload,
    signature: hmacSign(payload, secret),
    algorithm: 'HMAC-SHA256',
    signedAt,
    keyId,
  };
}

export function verifyReturnReceipt(
  signed: SignedComputeReturnReceipt,
  secret: string,
): boolean {
  return hmacVerify(signed.payload, signed.signature, secret);
}

export function assertEm4RequestSchema(payload: ComputeMessageRequest): string[] {
  const reasons: string[] = [];
  const requiredStrings: Array<keyof ComputeMessageRequest> = [
    'requestId',
    'agentId',
    'homeUniverseId',
    'tenantId',
    'purpose',
    'modelId',
    'inputDataClass',
    'requestedDevice',
    'minimumVerificationState',
    'privacyMode',
    'networkPolicy',
    'expiry',
    'returnPath',
  ];
  for (const key of requiredStrings) {
    const v = payload[key];
    if (typeof v !== 'string' || v.length === 0) {
      reasons.push(`Missing or empty required field: ${key}`);
    }
  }
  if (!['CPU', 'GPU', 'NPU'].includes(payload.requestedDevice)) {
    reasons.push('requestedDevice must be CPU|GPU|NPU');
  }
  for (const [name, n] of [
    ['maxRuntimeMs', payload.maxRuntimeMs],
    ['maxMemoryMb', payload.maxMemoryMb],
    ['maxConcurrency', payload.maxConcurrency],
  ] as const) {
    if (!Number.isFinite(n) || n <= 0) {
      reasons.push(`${name} must be a finite positive number`);
    }
  }
  if (Number.isNaN(Date.parse(payload.expiry))) {
    reasons.push('expiry must be a valid ISO timestamp');
  }
  return reasons;
}

function isAccelerator(device: ComputeDevice): boolean {
  return device === 'GPU' || device === 'NPU';
}

/** EL8 soft-wire: detect silent accelerator→CPU fallback. */
export function detectSilentDeviceFallback(
  requestedDevice: ComputeDevice,
  actualExecutionDevice: ComputeDevice,
): boolean {
  return isAccelerator(requestedDevice) && actualExecutionDevice === 'CPU';
}

/**
 * Hard honesty: receipt MUST declare fallback when GPU/NPU silently ran on CPU.
 * Accelerator is never verified by a CPU-fallback receipt.
 */
export function applySilentFallbackHonesty(args: {
  requestedDevice: ComputeDevice;
  actualExecutionDevice: ComputeDevice;
  executionSucceeded: boolean;
}): {
  fallbackUsed: boolean;
  acceleratorVerified: boolean;
  failureClass: Em4FailureClass;
  resultState: ComputeReturnReceipt['resultState'];
} {
  const fallbackUsed = detectSilentDeviceFallback(
    args.requestedDevice,
    args.actualExecutionDevice,
  );

  if (fallbackUsed) {
    return {
      fallbackUsed: true,
      acceleratorVerified: false,
      failureClass: 'SILENT_FALLBACK_TO_CPU',
      resultState: args.executionSucceeded ? 'FALLBACK_CPU' : 'FAILED',
    };
  }

  if (
    isAccelerator(args.requestedDevice) &&
    args.actualExecutionDevice === args.requestedDevice &&
    args.executionSucceeded
  ) {
    return {
      fallbackUsed: false,
      acceleratorVerified: true,
      failureClass: null,
      resultState: 'SUCCEEDED',
    };
  }

  if (args.requestedDevice === 'CPU' && args.actualExecutionDevice === 'CPU') {
    return {
      fallbackUsed: false,
      acceleratorVerified: false,
      failureClass: args.executionSucceeded ? null : 'EXECUTION_ERROR',
      resultState: args.executionSucceeded ? 'SUCCEEDED' : 'FAILED',
    };
  }

  return {
    fallbackUsed: args.actualExecutionDevice !== args.requestedDevice,
    acceleratorVerified: false,
    failureClass: args.executionSucceeded ? null : 'EXECUTION_ERROR',
    resultState: args.executionSucceeded ? 'SUCCEEDED' : 'FAILED',
  };
}

function grantAllowsDataClass(
  grant: AgentComputeGrant,
  dataClass: ComputeMessageRequest['inputDataClass'],
): boolean {
  return grant.allowedDataClasses.some(
    (allowed) => DATA_CLASS_RANK[dataClass] <= DATA_CLASS_RANK[allowed],
  );
}

function childWidensParent(child: AgentComputeGrant, parent: AgentComputeGrant): string[] {
  const reasons: string[] = [];
  for (const d of child.allowedDevices) {
    if (!parent.allowedDevices.includes(d)) {
      reasons.push(`Child widens device permission: ${d}`);
    }
  }
  for (const m of child.allowedModels) {
    if (!parent.allowedModels.includes(m)) {
      reasons.push(`Child widens model permission: ${m}`);
    }
  }
  for (const dc of child.allowedDataClasses) {
    const parentMax = Math.max(...parent.allowedDataClasses.map((x) => DATA_CLASS_RANK[x]));
    if (DATA_CLASS_RANK[dc] > parentMax) {
      reasons.push(`Child widens data class permission: ${dc}`);
    }
  }
  for (const np of child.allowedNetworkPolicies) {
    if (!parent.allowedNetworkPolicies.includes(np)) {
      reasons.push(`Child widens network permission: ${np}`);
    }
  }
  if (child.maxRuntimeMs > parent.maxRuntimeMs) {
    reasons.push('Child widens maxRuntimeMs beyond parent');
  }
  if (child.maxMemoryMb > parent.maxMemoryMb) {
    reasons.push('Child widens maxMemoryMb beyond parent');
  }
  if (child.maxConcurrency > parent.maxConcurrency) {
    reasons.push('Child widens maxConcurrency beyond parent');
  }
  if (child.allowCrossTenant && !parent.allowCrossTenant) {
    reasons.push('Child widens cross-tenant permission');
  }
  if (child.allowCrossUniverse && !parent.allowCrossUniverse) {
    reasons.push('Child widens cross-universe permission');
  }
  return reasons;
}

/**
 * Policy gate — budget, tenant/universe, expiry, child widen, high-consequence,
 * cloud purchase / hardware provisioning / driver-BIOS / L4 denies.
 */
export function evaluatePolicyGate(
  request: ComputeMessageRequest,
  grant: AgentComputeGrant,
  options: {
    now?: Date;
    requestCrossTenantTargetId?: string | null;
    requestCrossUniverseTargetId?: string | null;
    attemptsCloudPurchase?: boolean;
    attemptsHardwareProvisioning?: boolean;
    attemptsDriverBiosSecurityConfig?: boolean;
    l4AutonomyEnabled?: boolean;
  } = {},
): PolicyGateDecision {
  const reasons: string[] = [];
  const now = options.now ?? new Date();
  const highConsequenceRecommendationOnly = grant.highConsequence === true;

  if (EM4_LOCKS.L4_AUTONOMY_ENABLED !== false || options.l4AutonomyEnabled === true) {
    return {
      allowed: false,
      denialCode: 'L4_AUTONOMY_DENIED',
      reasons: ['L4_AUTONOMY_ENABLED must remain false'],
      highConsequenceRecommendationOnly,
    };
  }

  const schemaIssues = assertEm4RequestSchema(request);
  if (schemaIssues.length > 0) {
    return {
      allowed: false,
      denialCode: 'SCHEMA_INVALID',
      reasons: schemaIssues,
      highConsequenceRecommendationOnly,
    };
  }

  if (Date.parse(request.expiry) <= now.getTime()) {
    return {
      allowed: false,
      denialCode: 'EXPIRED',
      reasons: [`Request expired at ${request.expiry}`],
      highConsequenceRecommendationOnly,
    };
  }

  if (request.agentId !== grant.agentId) {
    return {
      allowed: false,
      denialCode: 'SCHEMA_INVALID',
      reasons: ['agentId does not match grant'],
      highConsequenceRecommendationOnly,
    };
  }

  if (request.tenantId !== grant.tenantId && !grant.allowCrossTenant) {
    return {
      allowed: false,
      denialCode: 'CROSS_TENANT_DENIED',
      reasons: ['Cross-tenant data movement denied without explicit policy'],
      highConsequenceRecommendationOnly,
    };
  }

  if (request.homeUniverseId !== grant.homeUniverseId && !grant.allowCrossUniverse) {
    return {
      allowed: false,
      denialCode: 'CROSS_UNIVERSE_DENIED',
      reasons: ['Cross-Universe data movement denied without explicit policy'],
      highConsequenceRecommendationOnly,
    };
  }

  if (
    options.requestCrossTenantTargetId &&
    options.requestCrossTenantTargetId !== grant.tenantId &&
    !grant.allowCrossTenant
  ) {
    return {
      allowed: false,
      denialCode: 'CROSS_TENANT_DENIED',
      reasons: ['Explicit cross-tenant target denied'],
      highConsequenceRecommendationOnly,
    };
  }

  if (
    options.requestCrossUniverseTargetId &&
    options.requestCrossUniverseTargetId !== grant.homeUniverseId &&
    !grant.allowCrossUniverse
  ) {
    return {
      allowed: false,
      denialCode: 'CROSS_UNIVERSE_DENIED',
      reasons: ['Explicit cross-universe target denied'],
      highConsequenceRecommendationOnly,
    };
  }

  if (grant.parentGrant) {
    const widen = childWidensParent(grant, grant.parentGrant);
    if (widen.length > 0) {
      return {
        allowed: false,
        denialCode: 'CHILD_PERMISSION_WIDEN_DENIED',
        reasons: widen,
        highConsequenceRecommendationOnly,
      };
    }
  }

  if (!grant.allowedDevices.includes(request.requestedDevice)) {
    reasons.push(`Device ${request.requestedDevice} not in agent grant`);
  }
  if (!grant.allowedModels.includes(request.modelId)) {
    reasons.push(`Model ${request.modelId} not in agent grant`);
  }
  if (!grantAllowsDataClass(grant, request.inputDataClass)) {
    reasons.push(`Data class ${request.inputDataClass} exceeds grant`);
  }
  if (!grant.allowedNetworkPolicies.includes(request.networkPolicy)) {
    return {
      allowed: false,
      denialCode: 'NETWORK_POLICY_DENIED',
      reasons: [`Network policy ${request.networkPolicy} not granted`],
      highConsequenceRecommendationOnly,
    };
  }

  if (request.maxRuntimeMs > grant.maxRuntimeMs) {
    reasons.push(`maxRuntimeMs ${request.maxRuntimeMs} exceeds grant ${grant.maxRuntimeMs}`);
  }
  if (request.maxMemoryMb > grant.maxMemoryMb) {
    reasons.push(`maxMemoryMb ${request.maxMemoryMb} exceeds grant ${grant.maxMemoryMb}`);
  }
  if (request.maxConcurrency > grant.maxConcurrency) {
    reasons.push(
      `maxConcurrency ${request.maxConcurrency} exceeds grant ${grant.maxConcurrency}`,
    );
  }

  if (reasons.length > 0) {
    return {
      allowed: false,
      denialCode: 'BUDGET_EXCEEDED',
      reasons,
      highConsequenceRecommendationOnly,
    };
  }

  if (options.attemptsCloudPurchase) {
    return {
      allowed: false,
      denialCode: 'CLOUD_PURCHASE_DENIED',
      reasons: ['Automatic cloud purchasing is forbidden'],
      highConsequenceRecommendationOnly,
    };
  }
  if (options.attemptsHardwareProvisioning) {
    return {
      allowed: false,
      denialCode: 'HARDWARE_PROVISIONING_DENIED',
      reasons: ['Hardware provisioning is forbidden in EM4'],
      highConsequenceRecommendationOnly,
    };
  }
  if (options.attemptsDriverBiosSecurityConfig) {
    return {
      allowed: false,
      denialCode: 'DRIVER_BIOS_CONFIG_DENIED',
      reasons: ['Driver/BIOS/security configuration changes are forbidden'],
      highConsequenceRecommendationOnly,
    };
  }

  if (
    grant.privacyMode === 'cloud_forbidden' &&
    request.privacyMode !== 'local_only' &&
    request.privacyMode !== 'cloud_forbidden'
  ) {
    return {
      allowed: false,
      denialCode: 'PRIVACY_MODE_DENIED',
      reasons: ['Grant requires cloud_forbidden / local_only privacy'],
      highConsequenceRecommendationOnly,
    };
  }

  if (highConsequenceRecommendationOnly) {
    return {
      allowed: true,
      reasons: ['High-consequence task — recommendation only; no automatic execute'],
      highConsequenceRecommendationOnly: true,
    };
  }

  return {
    allowed: true,
    reasons: ['Policy gate allow'],
    highConsequenceRecommendationOnly: false,
  };
}

export function meetsMinimumVerification(
  deviceState: VerificationState,
  minimum: VerificationState,
): boolean {
  return VERIFICATION_STATE_RANK[deviceState] >= VERIFICATION_STATE_RANK[minimum];
}

export function selectRegistryDevice(
  request: ComputeMessageRequest,
  registry: readonly RegistryDeviceRecord[],
): { device: RegistryDeviceRecord | null; denialCode: Em4FailureClass } {
  const matches = registry.filter(
    (d) => d.deviceKind === request.requestedDevice && d.present,
  );
  if (matches.length === 0) {
    return { device: null, denialCode: 'REGISTRY_MISS' };
  }
  const verifiedEnough = matches.find((d) =>
    meetsMinimumVerification(d.verificationState, request.minimumVerificationState),
  );
  if (!verifiedEnough) {
    return { device: null, denialCode: 'DEVICE_NOT_VERIFIED' };
  }
  return { device: verifiedEnough, denialCode: null };
}

/** Soft-wire EL9-shaped governor admit check (local ceilings). */
export function evaluateGovernorAdmit(
  request: ComputeMessageRequest,
  observation: {
    memoryMbAvailable: number;
    concurrencyInUse: number;
    deny?: boolean;
    governorState?: string;
  },
): { admitted: boolean; governorState: string; reasons: string[] } {
  const reasons: string[] = [];
  if (observation.deny) {
    return {
      admitted: false,
      governorState: observation.governorState ?? 'DENIED',
      reasons: ['Resource governor denied admit'],
    };
  }
  if (request.maxMemoryMb > observation.memoryMbAvailable) {
    reasons.push('Insufficient memory vs request maxMemoryMb');
  }
  if (observation.concurrencyInUse + 1 > request.maxConcurrency) {
    reasons.push(
      `Concurrency in use ${observation.concurrencyInUse} leaves no slot under maxConcurrency ${request.maxConcurrency}`,
    );
  }
  if (reasons.length > 0) {
    return { admitted: false, governorState: 'DENIED', reasons };
  }
  return {
    admitted: true,
    governorState: observation.governorState ?? 'NORMAL',
    reasons: ['Governor admit'],
  };
}

export function buildDeniedReceipt(args: {
  request: ComputeMessageRequest;
  denialCode: Em4FailureClass;
  reasons: string[];
  highConsequenceRecommendationOnly?: boolean;
  startedAt?: string;
  completedAt?: string;
}): ComputeReturnReceipt {
  const startedAt = args.startedAt ?? new Date().toISOString();
  const completedAt = args.completedAt ?? startedAt;
  return {
    requestId: args.request.requestId,
    deviceId: 'none',
    providerRuntime: 'none',
    actualExecutionDevice: 'CPU',
    modelVersionHash: 'none',
    startedAt,
    completedAt,
    latencyMs: 0,
    resourceEvidence: {
      cpuPercentObserved: null,
      memoryMbObserved: null,
      concurrencyObserved: null,
      governorState: null,
      notes: args.reasons,
    },
    resultState:
      args.denialCode === 'EXPIRED'
        ? 'EXPIRED'
        : args.highConsequenceRecommendationOnly
          ? 'RECOMMENDATION_ONLY'
          : 'DENIED',
    fallbackUsed: false,
    failureClass: args.denialCode,
    evidenceRefs: [],
    requestedDevice: args.request.requestedDevice,
    acceleratorVerified: false,
    homeUniverseId: args.request.homeUniverseId,
    tenantId: args.request.tenantId,
    agentId: args.request.agentId,
    returnPath: args.request.returnPath,
    highConsequenceRecommendationOnly: args.highConsequenceRecommendationOnly === true,
  };
}

export function buildExecutionReceipt(args: {
  request: ComputeMessageRequest;
  attempt: ExecutionAttempt;
  highConsequenceRecommendationOnly?: boolean;
}): ComputeReturnReceipt {
  if (args.highConsequenceRecommendationOnly) {
    return {
      requestId: args.request.requestId,
      deviceId: args.attempt.deviceId,
      providerRuntime: args.attempt.providerRuntime,
      actualExecutionDevice: args.attempt.actualExecutionDevice,
      modelVersionHash: args.attempt.modelVersionHash,
      startedAt: args.attempt.startedAt,
      completedAt: args.attempt.completedAt,
      latencyMs: args.attempt.latencyMs,
      resourceEvidence: {
        ...args.attempt.resourceEvidence,
        notes: [
          ...args.attempt.resourceEvidence.notes,
          'High-consequence: recommendation only — execution not authorized as action',
        ],
      },
      resultState: 'RECOMMENDATION_ONLY',
      fallbackUsed: false,
      failureClass: 'HIGH_CONSEQUENCE_RECOMMENDATION_ONLY',
      evidenceRefs: args.attempt.evidenceRefs,
      requestedDevice: args.request.requestedDevice,
      acceleratorVerified: false,
      homeUniverseId: args.request.homeUniverseId,
      tenantId: args.request.tenantId,
      agentId: args.request.agentId,
      returnPath: args.request.returnPath,
      highConsequenceRecommendationOnly: true,
    };
  }

  const honesty = applySilentFallbackHonesty({
    requestedDevice: args.request.requestedDevice,
    actualExecutionDevice: args.attempt.actualExecutionDevice,
    executionSucceeded: args.attempt.executionSucceeded,
  });

  if (
    detectSilentDeviceFallback(
      args.request.requestedDevice,
      args.attempt.actualExecutionDevice,
    ) &&
    !honesty.fallbackUsed
  ) {
    throw new Error('EM4 invariant violated: silent fallback must set fallbackUsed=true');
  }

  if (honesty.fallbackUsed && honesty.acceleratorVerified) {
    throw new Error(
      'EM4 invariant violated: CPU success cannot verify requested accelerator',
    );
  }

  return {
    requestId: args.request.requestId,
    deviceId: args.attempt.deviceId,
    providerRuntime: args.attempt.providerRuntime,
    actualExecutionDevice: args.attempt.actualExecutionDevice,
    modelVersionHash: args.attempt.modelVersionHash,
    startedAt: args.attempt.startedAt,
    completedAt: args.attempt.completedAt,
    latencyMs: args.attempt.latencyMs,
    resourceEvidence: args.attempt.resourceEvidence,
    resultState: honesty.resultState,
    fallbackUsed: honesty.fallbackUsed,
    failureClass:
      honesty.failureClass ?? (args.attempt.executionSucceeded ? null : 'EXECUTION_ERROR'),
    evidenceRefs: args.attempt.evidenceRefs,
    requestedDevice: args.request.requestedDevice,
    acceleratorVerified: honesty.acceleratorVerified,
    homeUniverseId: args.request.homeUniverseId,
    tenantId: args.request.tenantId,
    agentId: args.request.agentId,
    returnPath: args.request.returnPath,
    highConsequenceRecommendationOnly: false,
  };
}

export type RunEnvelopeOptions = {
  secret: string;
  grant: AgentComputeGrant;
  registry: readonly RegistryDeviceRecord[];
  governorObservation: {
    memoryMbAvailable: number;
    concurrencyInUse: number;
    deny?: boolean;
    governorState?: string;
  };
  execute?: (args: {
    request: ComputeMessageRequest;
    device: RegistryDeviceRecord;
  }) => ExecutionAttempt;
  now?: Date;
  attemptsCloudPurchase?: boolean;
  attemptsHardwareProvisioning?: boolean;
  attemptsDriverBiosSecurityConfig?: boolean;
  forceSilentCpuFallback?: boolean;
};

/** Full EM4 pipeline. Always returns a signed receipt on deny or execute. */
export function runComputeMessageEnvelope(
  signedRequest: SignedComputeMessageRequest,
  options: RunEnvelopeOptions,
): EnvelopePipelineResult {
  const softWire = em4SoftWireSnapshot();
  const nowIso = (options.now ?? new Date()).toISOString();

  if (!verifyComputeRequest(signedRequest, options.secret)) {
    const denied = buildDeniedReceipt({
      request: signedRequest.payload,
      denialCode: 'SIGNATURE_INVALID',
      reasons: ['Request signature invalid'],
      startedAt: nowIso,
      completedAt: nowIso,
    });
    return {
      request: signedRequest,
      policy: {
        allowed: false,
        denialCode: 'SIGNATURE_INVALID',
        reasons: ['Request signature invalid'],
        highConsequenceRecommendationOnly: false,
      },
      receipt: signReturnReceipt(denied, options.secret),
      softWire,
    };
  }

  const policy = evaluatePolicyGate(signedRequest.payload, options.grant, {
    now: options.now,
    attemptsCloudPurchase: options.attemptsCloudPurchase,
    attemptsHardwareProvisioning: options.attemptsHardwareProvisioning,
    attemptsDriverBiosSecurityConfig: options.attemptsDriverBiosSecurityConfig,
  });

  if (!policy.allowed) {
    const denied = buildDeniedReceipt({
      request: signedRequest.payload,
      denialCode: policy.denialCode,
      reasons: policy.reasons,
      highConsequenceRecommendationOnly: policy.highConsequenceRecommendationOnly,
      startedAt: nowIso,
      completedAt: nowIso,
    });
    return {
      request: signedRequest,
      policy,
      receipt: signReturnReceipt(denied, options.secret),
      softWire,
    };
  }

  if (policy.highConsequenceRecommendationOnly) {
    const rec = buildDeniedReceipt({
      request: signedRequest.payload,
      denialCode: 'HIGH_CONSEQUENCE_RECOMMENDATION_ONLY',
      reasons: policy.reasons,
      highConsequenceRecommendationOnly: true,
      startedAt: nowIso,
      completedAt: nowIso,
    });
    rec.resultState = 'RECOMMENDATION_ONLY';
    return {
      request: signedRequest,
      policy,
      receipt: signReturnReceipt(rec, options.secret),
      softWire,
    };
  }

  const selected = selectRegistryDevice(signedRequest.payload, options.registry);
  if (!selected.device) {
    const denied = buildDeniedReceipt({
      request: signedRequest.payload,
      denialCode: selected.denialCode,
      reasons: [`Compute registry: ${selected.denialCode}`],
      startedAt: nowIso,
      completedAt: nowIso,
    });
    return {
      request: signedRequest,
      policy,
      receipt: signReturnReceipt(denied, options.secret),
      softWire,
    };
  }

  const gov = evaluateGovernorAdmit(signedRequest.payload, options.governorObservation);
  if (!gov.admitted) {
    const denied = buildDeniedReceipt({
      request: signedRequest.payload,
      denialCode: 'GOVERNOR_DENIED',
      reasons: gov.reasons,
      startedAt: nowIso,
      completedAt: nowIso,
    });
    denied.resourceEvidence = {
      ...denied.resourceEvidence,
      governorState: gov.governorState,
      notes: gov.reasons,
    };
    return {
      request: signedRequest,
      policy,
      receipt: signReturnReceipt(denied, options.secret),
      softWire,
    };
  }

  const device = selected.device;
  let attempt: ExecutionAttempt;

  if (options.forceSilentCpuFallback && isAccelerator(signedRequest.payload.requestedDevice)) {
    const startedAt = nowIso;
    const completedAt = new Date(Date.parse(startedAt) + 12).toISOString();
    attempt = {
      actualExecutionDevice: 'CPU',
      deviceId: 'cpu-fallback-0',
      providerRuntime: 'cpu-ep',
      modelVersionHash: device.modelVersionHash,
      startedAt,
      completedAt,
      latencyMs: 12,
      resourceEvidence: {
        cpuPercentObserved: 22,
        memoryMbObserved: 256,
        concurrencyObserved: 1,
        governorState: gov.governorState,
        notes: ['Silent fallback GPU/NPU→CPU injected for honesty path'],
      },
      executionSucceeded: true,
      evidenceRefs: ['em4:silent-fallback'],
    };
  } else if (options.execute) {
    attempt = options.execute({
      request: signedRequest.payload,
      device,
    });
  } else {
    const startedAt = nowIso;
    const completedAt = new Date(Date.parse(startedAt) + 5).toISOString();
    attempt = {
      actualExecutionDevice: device.deviceKind,
      deviceId: device.deviceId,
      providerRuntime: device.providerRuntime,
      modelVersionHash: device.modelVersionHash,
      startedAt,
      completedAt,
      latencyMs: 5,
      resourceEvidence: {
        cpuPercentObserved: 10,
        memoryMbObserved: 128,
        concurrencyObserved: 1,
        governorState: gov.governorState,
        notes: ['Default in-process stub execution'],
      },
      executionSucceeded: true,
      evidenceRefs: [`em4:registry:${device.deviceId}`],
    };
  }

  const receiptPayload = buildExecutionReceipt({
    request: signedRequest.payload,
    attempt,
  });

  return {
    request: signedRequest,
    policy,
    receipt: signReturnReceipt(receiptPayload, options.secret),
    softWire,
  };
}

export function emptyResourceEvidence(notes: readonly string[] = []): ResourceEvidence {
  return {
    cpuPercentObserved: null,
    memoryMbObserved: null,
    concurrencyObserved: null,
    governorState: null,
    notes,
  };
}
