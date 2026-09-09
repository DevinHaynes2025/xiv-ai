/**
 * 62L-EW7 — Compute request envelope.
 *
 * Agent Mission → Agent Mesh → Task Envelope → Chip Capability Graph → …
 */

import type {
  AmdDevice,
  DeviceTruthState,
  FallbackPolicy,
  PrivacyMode,
  TenantScope,
} from './ew7-types.ts';
import { EW7_LOCKS } from './ew7-types.ts';

export type ComputeRequestEnvelope = {
  requestId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  /** Optional org binding for Guardian/RLS scope checks. */
  orgId: string;
  modelId: string;
  workloadId: string;
  inputDataClass: string;
  preferredDevice: AmdDevice;
  minimumVerificationState: DeviceTruthState;
  privacyMode: PrivacyMode;
  maxMemoryMb: number;
  maxRuntimeMs: number;
  computeBudget: number;
  fallbackPolicy: FallbackPolicy;
  returnPath: string;
  expiresAt: string;
  /** When true, requires cloud connectivity. */
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
  /** Expected tenant/universe from Agent Mesh / mission scope. */
  expectedScope: TenantScope;
  /** Wall clock for expiry (ISO or epoch ms). Defaults to Date.now(). */
  nowMs?: number;
  /** Optional budget ceiling from Resource Governor soft-wire. */
  maxComputeBudget?: number;
};

export function createComputeEnvelope(
  partial: ComputeRequestEnvelope,
): ComputeRequestEnvelope {
  return { ...partial };
}

/**
 * Validate envelope against tenant/universe, expiry, budget, offline/cloud rules.
 * Does not expand child hardware/data authority.
 */
export function validateComputeEnvelope(
  envelope: ComputeRequestEnvelope,
  ctx: EnvelopeContext,
): EnvelopeValidation {
  if (EW7_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY !== false) {
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
    !Number.isFinite(envelope.maxMemoryMb) ||
    envelope.maxMemoryMb <= 0 ||
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
      EW7_LOCKS.CLAIM_WORK_WHILE_POWERED_OFF === false
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
  }

  if (envelope.cloudRequired && power === 'OFFLINE') {
    return {
      ok: false,
      denied: true,
      failureClass: 'CLOUD_REQUIRED_OFFLINE',
      reason: 'CLOUD_REQUIRED while offline → WAITING_DATA (not fabricated success).',
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
