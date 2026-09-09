/**
 * 62L-EX5 — QPU provider record helpers.
 * Default: NOT_CONFIGURED. Credentials by reference only.
 * Future adapters live under providers/ — no embedded credentials.
 */

import { defaultCostPolicy, defaultSpendingLimits } from './qpu-cost-policy.ts';
import {
  EX5_LOCKS,
  type AuthMode,
  type InputDataClass,
  type PrivacyClass,
  type ProviderState,
  type QpuProviderCandidate,
  type QpuProviderRecord,
} from './qpu-types.ts';

export function createDefaultProviderRecord(input: {
  providerId: string;
  candidate: QpuProviderCandidate;
  displayName: string;
  tenantId: string;
  universeId: string;
  state?: ProviderState;
  authMode?: AuthMode;
  regions?: readonly string[];
  allowedDataClasses?: readonly InputDataClass[];
  allowedPrivacyClasses?: readonly PrivacyClass[];
  humanApprovalRequired?: boolean;
  freshnessTtlMs?: number;
}): QpuProviderRecord {
  return {
    providerId: input.providerId,
    candidate: input.candidate,
    displayName: input.displayName,
    state: input.state ?? 'NOT_CONFIGURED',
    authMode: input.authMode ?? 'NONE',
    credentialRef: null,
    regions: [...(input.regions ?? [])],
    allowedDataClasses: [...(input.allowedDataClasses ?? ['SYNTHETIC', 'BENCHMARK_FIXTURE'])],
    allowedPrivacyClasses: [...(input.allowedPrivacyClasses ?? ['PUBLIC', 'TENANT_PRIVATE'])],
    costPolicy: defaultCostPolicy({ maxSpendUsd: 0, perJobMaxUsd: 0 }),
    spendingLimits: defaultSpendingLimits({ softLimitUsd: 0, hardLimitUsd: 0, spentUsd: 0 }),
    humanApprovalRequired: input.humanApprovalRequired !== false,
    discoveryStatus: 'NOT_ATTEMPTED',
    termsVersion: null,
    policyVersion: null,
    revoked: false,
    revocationReason: null,
    lastSeenAt: null,
    freshnessTtlMs: input.freshnessTtlMs ?? 3_600_000,
    tenantId: input.tenantId,
    universeId: input.universeId,
    rawCredentialsStored: false,
  };
}

/** Seed all candidates as NOT_CONFIGURED / unconnected until evidence. */
export function seedUnconfiguredProviderCatalog(input: {
  tenantId: string;
  universeId: string;
}): QpuProviderRecord[] {
  const specs: Array<{
    providerId: string;
    candidate: QpuProviderCandidate;
    displayName: string;
  }> = [
    {
      providerId: 'ibm-quantum-candidate',
      candidate: 'IBM_QUANTUM_CANDIDATE',
      displayName: 'IBM Quantum (candidate)',
    },
    {
      providerId: 'aws-braket-candidate',
      candidate: 'AWS_BRAKET_CANDIDATE',
      displayName: 'AWS Braket (candidate)',
    },
    {
      providerId: 'azure-quantum-candidate',
      candidate: 'AZURE_QUANTUM_CANDIDATE',
      displayName: 'Azure Quantum (candidate)',
    },
    {
      providerId: 'google-quantum-candidate',
      candidate: 'GOOGLE_QUANTUM_CANDIDATE',
      displayName: 'Google Quantum (candidate)',
    },
    {
      providerId: 'other-authorized-qpu-provider',
      candidate: 'OTHER_AUTHORIZED_QPU_PROVIDER',
      displayName: 'Other authorized QPU provider (candidate)',
    },
  ];

  return specs.map((s) =>
    createDefaultProviderRecord({
      ...s,
      tenantId: input.tenantId,
      universeId: input.universeId,
      state: 'NOT_CONFIGURED',
    }),
  );
}

export function attachCredentialReference(
  provider: QpuProviderRecord,
  credentialRefId: string,
  vaultPath: string,
): QpuProviderRecord | { ok: false; reason: string } {
  if (EX5_LOCKS.STORE_RAW_CREDENTIALS) {
    return { ok: false, reason: 'RAW_CREDENTIAL_STORAGE_FORBIDDEN' };
  }
  if (!credentialRefId || !vaultPath) {
    return { ok: false, reason: 'CREDENTIAL_REF_REQUIRED' };
  }
  if (vaultPath.includes('://secret/') === false && !vaultPath.startsWith('vault:')) {
    // Allow any non-secret-looking path as long as we never accept rawSecret.
  }
  return {
    ...provider,
    credentialRef: {
      credentialRefId,
      vaultPath,
      rawSecretPresent: false,
    },
    state: provider.state === 'NOT_CONFIGURED' ? 'AUTH_REQUIRED' : provider.state,
    rawCredentialsStored: false,
  };
}

export function markProviderAuthorized(
  provider: QpuProviderRecord,
  opts: { termsVersion: string; policyVersion: string; now: string },
): QpuProviderRecord | { ok: false; reason: string } {
  if (provider.revoked || provider.state === 'REVOKED') {
    return { ok: false, reason: 'PROVIDER_REVOKED' };
  }
  if (!provider.credentialRef) {
    return { ok: false, reason: 'AUTH_REQUIRED' };
  }
  return {
    ...provider,
    state: 'AUTHORIZED',
    termsVersion: opts.termsVersion,
    policyVersion: opts.policyVersion,
    lastSeenAt: opts.now,
    revoked: false,
    revocationReason: null,
  };
}

export function revokeProvider(
  provider: QpuProviderRecord,
  reason: string,
  now: string,
): QpuProviderRecord {
  return {
    ...provider,
    state: 'REVOKED',
    revoked: true,
    revocationReason: reason,
    lastSeenAt: now,
  };
}

export function providerIsAuthorized(provider: QpuProviderRecord): boolean {
  return (
    provider.state === 'AUTHORIZED' &&
    !provider.revoked &&
    provider.credentialRef !== null &&
    provider.rawCredentialsStored === false
  );
}

/** AUTHORIZED ≠ QPU VERIFIED — helper documents honesty. */
export function authorizedImpliesQpuVerified(_provider: QpuProviderRecord): false {
  return false;
}
