/**
 * 62L-EX5 — QPU job authorization gate.
 * Before submit: provider authorized, backend allowed, tenant/Universe validated,
 * data class/region/budget/cost policy, mission not expired, Guardian active.
 * External spend → HUMAN_APPROVAL_REQUIRED. No autonomous purchase.
 * Offline → WAITING_PROVIDER. Never fabricate freshness.
 */

import { evaluateCostGate } from './qpu-cost-policy.ts';
import { providerIsAuthorized } from './qpu-provider.ts';
import {
  backendSatisfiesVerified,
  classifyBackendHonesty,
  getBackend,
  getProvider,
  isBackendFresh,
  type QpuTruthRegistry,
} from './qpu-registry.ts';
import {
  EX5_LOCKS,
  type GateResult,
  type QpuJobRequest,
} from './qpu-types.ts';

function baseGate(partial: Partial<GateResult> & Pick<GateResult, 'decision' | 'reason'>): GateResult {
  return {
    executionClass: null,
    providerState: null,
    backendState: null,
    physicalOrSimulator: null,
    humanApprovalRequired: false,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    fabricated: false,
    l4Enabled: false,
    guardianRlsUnchanged: true,
    ...partial,
  };
}

export function evaluateTenantUniverseGate(input: {
  registryTenantId: string;
  registryUniverseId: string;
  requestTenantId: string;
  requestUniverseId: string;
  providerTenantId?: string;
  providerUniverseId?: string;
}): GateResult {
  if (input.requestTenantId !== input.registryTenantId) {
    return baseGate({ decision: 'DENIED', reason: 'CROSS_TENANT_DENIED' });
  }
  if (input.requestUniverseId !== input.registryUniverseId) {
    return baseGate({ decision: 'DENIED', reason: 'CROSS_UNIVERSE_DENIED' });
  }
  if (
    input.providerTenantId !== undefined &&
    input.providerTenantId !== input.requestTenantId
  ) {
    return baseGate({ decision: 'DENIED', reason: 'CROSS_TENANT_DENIED' });
  }
  if (
    input.providerUniverseId !== undefined &&
    input.providerUniverseId !== input.requestUniverseId
  ) {
    return baseGate({ decision: 'DENIED', reason: 'CROSS_UNIVERSE_DENIED' });
  }
  return baseGate({ decision: 'ALLOWED', reason: 'TENANT_UNIVERSE_OK' });
}

/**
 * Full pre-submit authorization + capability + privacy/cost gate.
 */
export function authorizeQpuJob(
  registry: QpuTruthRegistry,
  request: QpuJobRequest,
): GateResult {
  if (!assertEx5L4()) {
    return baseGate({ decision: 'DENIED', reason: 'L4_AUTONOMY_MUST_REMAIN_FALSE' });
  }

  const tenantGate = evaluateTenantUniverseGate({
    registryTenantId: registry.tenantId,
    registryUniverseId: registry.universeId,
    requestTenantId: request.tenantId,
    requestUniverseId: request.universeId,
  });
  if (tenantGate.decision === 'DENIED') return tenantGate;

  if (!request.guardianActive) {
    return baseGate({ decision: 'DENIED', reason: 'GUARDIAN_INACTIVE' });
  }

  if (
    request.missionStatus === 'EXPIRED' ||
    Date.parse(request.now) > Date.parse(request.missionExpiresAt)
  ) {
    return baseGate({ decision: 'DENIED', reason: 'MISSION_EXPIRED' });
  }

  if (request.missionStatus === 'REVOKED') {
    return baseGate({ decision: 'DENIED', reason: 'MISSION_REVOKED' });
  }

  // Offline / discovery unavailable → WAITING_PROVIDER (continue classical/inspired/sim locally).
  if (request.offlineDisconnected || !request.discoveryAvailable) {
    return baseGate({
      decision: 'WAITING_PROVIDER',
      reason: 'OFFLINE_OR_DISCOVERY_UNAVAILABLE',
      executionClass: 'CLASSICAL',
    });
  }

  const provider = getProvider(registry, request.providerId);
  if (!provider) {
    return baseGate({
      decision: 'DENIED',
      reason: 'PROVIDER_NOT_CONFIGURED',
      providerState: 'NOT_CONFIGURED',
    });
  }

  const tenantProv = evaluateTenantUniverseGate({
    registryTenantId: registry.tenantId,
    registryUniverseId: registry.universeId,
    requestTenantId: request.tenantId,
    requestUniverseId: request.universeId,
    providerTenantId: provider.tenantId,
    providerUniverseId: provider.universeId,
  });
  if (tenantProv.decision === 'DENIED') return tenantProv;

  if (provider.state === 'NOT_CONFIGURED') {
    return baseGate({
      decision: 'DENIED',
      reason: 'PROVIDER_NOT_CONFIGURED',
      providerState: 'NOT_CONFIGURED',
    });
  }

  if (provider.revoked || provider.state === 'REVOKED') {
    return baseGate({
      decision: 'DENIED',
      reason: 'PROVIDER_REVOKED',
      providerState: 'REVOKED',
    });
  }

  if (provider.state === 'AUTH_REQUIRED' || !providerIsAuthorized(provider)) {
    return baseGate({
      decision: 'DENIED',
      reason: 'UNAUTHORIZED_PHYSICAL_PROVIDER',
      providerState: provider.state,
      humanApprovalRequired: true,
    });
  }

  const backend = getBackend(registry, request.backendId);
  if (!backend) {
    return baseGate({
      decision: 'WAITING_DATA',
      reason: 'BACKEND_WAITING_DATA',
      providerState: provider.state,
    });
  }

  if (backend.providerId !== provider.providerId) {
    return baseGate({
      decision: 'DENIED',
      reason: 'BACKEND_PROVIDER_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
    });
  }

  // Region mismatch.
  if (
    request.regionRequired &&
    backend.region &&
    request.regionRequired !== backend.region
  ) {
    return baseGate({
      decision: 'DENIED',
      reason: 'REGION_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }
  if (request.regionRequired && provider.regions.length > 0) {
    if (!provider.regions.includes(request.regionRequired)) {
      return baseGate({
        decision: 'DENIED',
        reason: 'REGION_MISMATCH',
        providerState: provider.state,
        backendState: backend.state,
        physicalOrSimulator: backend.physicalOrSimulator,
      });
    }
  }

  // Privacy / data-class mismatch.
  if (!provider.allowedDataClasses.includes(request.inputDataClass)) {
    return baseGate({
      decision: 'DENIED',
      reason: 'DATA_CLASS_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }
  if (!provider.allowedPrivacyClasses.includes(request.privacyClass)) {
    return baseGate({
      decision: 'DENIED',
      reason: 'PRIVACY_CLASS_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }
  if (!backend.dataClasses.includes(request.inputDataClass)) {
    return baseGate({
      decision: 'DENIED',
      reason: 'DATA_CLASS_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }
  if (!backend.privacyClasses.includes(request.privacyClass)) {
    return baseGate({
      decision: 'DENIED',
      reason: 'PRIVACY_CLASS_MISMATCH',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }

  // Cost / payment gate.
  const cost = evaluateCostGate({
    estimatedCostUsd: request.estimatedCostUsd,
    budgetRemainingUsd: request.budgetRemainingUsd,
    paymentRequired: request.paymentRequired,
    humanApprovalGranted: request.humanApprovalGranted,
    costPolicy: provider.costPolicy,
    spendingLimits: provider.spendingLimits,
  });
  if (cost.decision !== 'ALLOWED') {
    return {
      ...cost,
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    };
  }

  const honesty = classifyBackendHonesty(backend);

  // Simulator hard gate.
  if (backend.physicalOrSimulator === 'SIMULATOR') {
    if (request.requireVerifiedPhysical) {
      return baseGate({
        decision: 'DENIED',
        reason: 'SIMULATOR_NEVER_PHYSICAL_QPU_VERIFIED',
        providerState: provider.state,
        backendState: backend.state,
        physicalOrSimulator: 'SIMULATOR',
        executionClass: 'SIMULATED_QUANTUM',
      });
    }
    return baseGate({
      decision: 'ALLOWED',
      reason: 'SIMULATOR_ROUTED_AS_SIMULATED_QUANTUM',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: 'SIMULATOR',
      executionClass: 'SIMULATED_QUANTUM',
      humanApprovalRequired: cost.humanApprovalRequired,
    });
  }

  // DOCUMENTED cannot satisfy VERIFIED.
  if (backend.state === 'DOCUMENTED' && request.requireVerifiedPhysical) {
    return baseGate({
      decision: 'DENIED',
      reason: 'DOCUMENTED_CANNOT_SATISFY_VERIFIED',
      providerState: provider.state,
      backendState: 'DOCUMENTED',
      physicalOrSimulator: backend.physicalOrSimulator,
      executionClass: honesty.executionClass,
    });
  }

  // Stale backend excluded from fresh VERIFIED route.
  if (backend.state === 'STALE' || !isBackendFresh(backend, request.now)) {
    if (request.requireVerifiedPhysical || backend.state === 'VERIFIED') {
      return baseGate({
        decision: 'DENIED',
        reason: 'STALE_BACKEND_EXCLUDED_FROM_FRESH_VERIFIED_ROUTE',
        providerState: provider.state,
        backendState: backend.state === 'STALE' ? 'STALE' : backend.state,
        physicalOrSimulator: backend.physicalOrSimulator,
      });
    }
  }

  if (request.requireVerifiedPhysical) {
    if (!backendSatisfiesVerified(backend, request.now)) {
      return baseGate({
        decision: 'DENIED',
        reason:
          backend.state === 'DOCUMENTED'
            ? 'DOCUMENTED_CANNOT_SATISFY_VERIFIED'
            : 'BACKEND_NOT_FRESH_VERIFIED_PHYSICAL',
        providerState: provider.state,
        backendState: backend.state,
        physicalOrSimulator: backend.physicalOrSimulator,
      });
    }
    // Registry VERIFIED ≠ job receipt; physicalQpuVerified stays false until EX6 receipt.
    return baseGate({
      decision: 'ALLOWED',
      reason: 'AUTHORIZED_VERIFIED_BACKEND_CANDIDATE_AWAITING_PHYSICAL_RECEIPT',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: 'PHYSICAL_QPU',
      executionClass: 'PHYSICAL_QPU_VERIFIED',
      physicalQpuVerified: false,
      humanApprovalRequired: cost.humanApprovalRequired || provider.humanApprovalRequired,
    });
  }

  // Unauthorized physical (authorized check already above) — if somehow DEGRADED:
  if (provider.state === 'DEGRADED' || provider.state === 'UNAVAILABLE') {
    return baseGate({
      decision: 'DENIED',
      reason: 'UNAUTHORIZED_PHYSICAL_PROVIDER',
      providerState: provider.state,
      backendState: backend.state,
      physicalOrSimulator: backend.physicalOrSimulator,
    });
  }

  return baseGate({
    decision: 'ALLOWED',
    reason: 'JOB_AUTHORIZATION_PASSED',
    providerState: provider.state,
    backendState: backend.state,
    physicalOrSimulator: backend.physicalOrSimulator,
    executionClass: honesty.executionClass,
    humanApprovalRequired: cost.humanApprovalRequired || provider.humanApprovalRequired,
    physicalQpuVerified: false,
  });
}

function assertEx5L4(): boolean {
  return EX5_LOCKS.L4_AUTONOMY_ENABLED === false && EX5_LOCKS.BUY_QPU_CLOUD_AUTONOMOUSLY === false;
}

/** Status refresh when offline — never fabricate freshness. */
export function refreshJobStatusOffline(input: {
  previouslyKnownBackendState: import('./qpu-types.ts').BackendState | null;
}): { status: 'STALE' | 'WAITING_PROVIDER'; fabricated: false } {
  if (input.previouslyKnownBackendState === 'VERIFIED') {
    return { status: 'STALE', fabricated: false };
  }
  return { status: 'WAITING_PROVIDER', fabricated: false };
}
