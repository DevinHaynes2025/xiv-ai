/**
 * 62L-EW9 — Intel-facing compute envelope (mirrors EW7/EW8 field contract; does not replace shared AMD envelope).
 *
 * Field contract matches EW7/EW8 + mission extras (parentTaskId, precisionRequirements,
 * memoryRequirementMb). Soft-wire EW7 compute-envelope when PRESENT — do not invent
 * a competing envelope schema.
 */

import type {
  DeviceTruthState,
  FallbackPolicy,
  IntelDevice,
  PrivacyMode,
  TenantScope,
} from './ew9-types.ts';
import { EW9_LOCKS } from './ew9-types.ts';

export type ComputeRequestEnvelope = {
  requestId: string;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  agentId: string;
  tenantId: string;
  universeId: string;
  /** Optional org binding for Guardian/RLS scope checks. */
  orgId: string;
  workloadId: string;
  modelId: string;
  inputDataClass: string;
  privacyMode: PrivacyMode;
  preferredDevice: IntelDevice;
  minimumVerificationState: DeviceTruthState;
  precisionRequirements: readonly string[];
  memoryRequirementMb: number;
  maxRuntimeMs: number;
  computeBudget: number;
  fallbackPolicy: FallbackPolicy;
  returnPath: string;
  expiresAt: string;
  /** When true, requires cloud/web connectivity. */
  cloudRequired?: boolean;
  /** Online / offline / sleep / shutdown node state. */
  nodePowerState?: 'ONLINE' | 'OFFLINE' | 'SLEEP' | 'SHUTDOWN';
  /** Prior node lifecycle for sleep/shutdown transitions. */
  priorExecutionState?: 'RUNNING_VERIFIED' | 'IDLE' | 'NONE';
};

export type EnvelopeValidation =
  | { ok: true; envelope: ComputeRequestEnvelope; scope: TenantScope }
  | {
      ok: false;
      denied: true;
      failureClass:
        | 'EXPIRED'
        | 'OVER_BUDGET'
        | 'TENANT_MISMATCH'
        | 'UNIVERSE_MISMATCH'
        | 'POLICY_DENIED'
        | 'CLOUD_REQUIRED_OFFLINE';
      reason: string;
      resultState: 'POLICY_DENIED' | 'WAITING_DATA' | 'OFFLINE_STOPPED';
    };

export type EnvelopeContext = {
  expectedScope: TenantScope;
  nowMs?: number;
  maxComputeBudget?: number;
};

export function createComputeEnvelope(
  partial: ComputeRequestEnvelope,
): ComputeRequestEnvelope {
  return { ...partial };
}

/**
 * Validate envelope against tenant/universe, expiry, budget, offline/cloud rules.
 */
export function validateComputeEnvelope(
  envelope: ComputeRequestEnvelope,
  ctx: EnvelopeContext,
): EnvelopeValidation {
  if (EW9_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY !== false) {
    return {
      ok: false,
      denied: true,
      failureClass: 'POLICY_DENIED',
      reason: 'LOCK_VIOLATION_CHILD_EXTRA_HARDWARE_AUTHORITY',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.tenantId !== ctx.expectedScope.tenantId) {
    return {
      ok: false,
      denied: true,
      failureClass: 'TENANT_MISMATCH',
      reason: 'TENANT_MISMATCH — Guardian/RLS isolation unchanged; denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.universeId !== ctx.expectedScope.universeId) {
    return {
      ok: false,
      denied: true,
      failureClass: 'UNIVERSE_MISMATCH',
      reason: 'UNIVERSE_MISMATCH — Guardian/RLS isolation unchanged; denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (
    envelope.orgId &&
    ctx.expectedScope.orgId &&
    envelope.orgId !== ctx.expectedScope.orgId
  ) {
    return {
      ok: false,
      denied: true,
      failureClass: 'TENANT_MISMATCH',
      reason: 'ORG_SCOPE_MISMATCH — denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  const now = ctx.nowMs ?? Date.now();
  const expiresMs = Date.parse(envelope.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= now) {
    return {
      ok: false,
      denied: true,
      failureClass: 'EXPIRED',
      reason: 'REQUEST_EXPIRED — denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  const budgetCeiling = ctx.maxComputeBudget ?? Number.POSITIVE_INFINITY;
  if (
    !Number.isFinite(envelope.computeBudget) ||
    envelope.computeBudget < 0 ||
    envelope.computeBudget > budgetCeiling
  ) {
    return {
      ok: false,
      denied: true,
      failureClass: 'OVER_BUDGET',
      reason: 'OVER_BUDGET — compute budget denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (
    !Number.isFinite(envelope.memoryRequirementMb) ||
    envelope.memoryRequirementMb <= 0 ||
    !Number.isFinite(envelope.maxRuntimeMs) ||
    envelope.maxRuntimeMs <= 0
  ) {
    return {
      ok: false,
      denied: true,
      failureClass: 'OVER_BUDGET',
      reason: 'INVALID_RESOURCE_CEILINGS — denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  const power = envelope.nodePowerState ?? 'ONLINE';
  if (power === 'SLEEP' || power === 'SHUTDOWN') {
    if (
      envelope.priorExecutionState === 'RUNNING_VERIFIED' &&
      EW9_LOCKS.CLAIM_WORK_WHILE_POWERED_OFF === false
    ) {
      return {
        ok: false,
        denied: true,
        failureClass: 'POLICY_DENIED',
        reason:
          'OFFLINE_STOPPED — RUNNING_VERIFIED → OFFLINE_STOPPED; never claim continued work while powered off.',
        resultState: 'OFFLINE_STOPPED',
      };
    }
    return {
      ok: false,
      denied: true,
      failureClass: 'POLICY_DENIED',
      reason: 'OFFLINE_STOPPED — hardware shutdown / sleep.',
      resultState: 'OFFLINE_STOPPED',
    };
  }

  if (envelope.cloudRequired && power === 'OFFLINE') {
    return {
      ok: false,
      denied: true,
      failureClass: 'CLOUD_REQUIRED_OFFLINE',
      reason:
        'CLOUD/WEB required while offline → WAITING_DATA (not fabricated success).',
      resultState: 'WAITING_DATA',
    };
  }

  const scope: TenantScope = {
    orgId: envelope.orgId || ctx.expectedScope.orgId,
    tenantId: envelope.tenantId,
    universeId: envelope.universeId,
  };

  return { ok: true, envelope, scope };
}
