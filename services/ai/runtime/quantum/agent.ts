/**
 * 62L-EX2 — ClassicalBaselineAgent role (not a second agent framework).
 *
 * Lawful public/open/licensed knowledge only; no restricted proprietary IP copy.
 * No permission broadening. Integrates via Agent Mesh soft-wire.
 */

import { EX2_LOCKS, ex2SoftWireSnapshot, type Ex2SoftWireSnapshot } from './types.ts';
import {
  createClassicalBaseline,
  completeClassicalBaseline,
  type CreateBaselineInput,
  type CompleteBaselineInput,
} from './baseline.ts';
import { evaluateComparability, evaluateAdvantageClaim } from './comparison.ts';
import type {
  AdvantageClaimDecision,
  AdvantageClaimInput,
  ClassicalBaselineReceipt,
  ComparabilityReceipt,
} from './types.ts';
import type { CompareGateInput } from './comparison.ts';

export const CLASSICAL_BASELINE_AGENT_ROLE = {
  roleId: 'ClassicalBaselineAgent',
  family: '62L-EX2',
  framework: 'AgentMesh' as const,
  secondFramework: false as const,
  knowledgePolicy: 'LAWFUL_PUBLIC_OPEN_LICENSED_ONLY' as const,
  mayCopyRestrictedProprietaryIp: false as const,
  mayBroadenPermissions: false as const,
  description:
    'Selects/runs/indexes classical baselines and emits comparison receipts under Agent Mesh — not a parallel orchestrator.',
} as const;

export type ClassicalBaselineAgentSession = {
  role: typeof CLASSICAL_BASELINE_AGENT_ROLE;
  softWire: Ex2SoftWireSnapshot;
  offlineFirst: true;
  softwareWormholes: {
    caches: true;
    indexes: true;
    compiledArtifacts: true;
    sessionReuse: true;
    authStillRuns: true;
    note: string;
  };
  locks: typeof EX2_LOCKS;
};

export function openClassicalBaselineAgent(): ClassicalBaselineAgentSession {
  return {
    role: CLASSICAL_BASELINE_AGENT_ROLE,
    softWire: ex2SoftWireSnapshot(),
    offlineFirst: true,
    softwareWormholes: {
      caches: true,
      indexes: true,
      compiledArtifacts: true,
      sessionReuse: true,
      authStillRuns: true,
      note: 'Software shortcuts only — caches/indexes/compiled artifacts/session reuse; auth still runs.',
    },
    locks: EX2_LOCKS,
  };
}

export function agentCreateBaseline(input: CreateBaselineInput) {
  if (EX2_LOCKS.COPY_RESTRICTED_PROPRIETARY_IP) {
    return {
      denied: true as const,
      state: 'DENIED' as const,
      reason: 'PROPRIETARY_IP_COPY_FORBIDDEN',
    };
  }
  return createClassicalBaseline(input);
}

export function agentCompleteBaseline(input: CompleteBaselineInput) {
  return completeClassicalBaseline(input);
}

export function agentEvaluateComparability(
  input: CompareGateInput,
): ComparabilityReceipt {
  return evaluateComparability(input);
}

export function agentEvaluateAdvantageClaim(
  input: AdvantageClaimInput,
): AdvantageClaimDecision {
  return evaluateAdvantageClaim(input);
}

export function agentKnowledgeAllowed(source: {
  license: 'PUBLIC' | 'OPEN' | 'LICENSED' | 'RESTRICTED_PROPRIETARY' | 'UNKNOWN';
}): { allowed: boolean; reason: string } {
  if (source.license === 'RESTRICTED_PROPRIETARY') {
    return {
      allowed: false,
      reason: 'RESTRICTED_PROPRIETARY_IP_COPY_DENIED',
    };
  }
  if (source.license === 'UNKNOWN') {
    return {
      allowed: false,
      reason: 'UNKNOWN_LICENSE_WAITING_DATA',
    };
  }
  return {
    allowed: true,
    reason: 'LAWFUL_PUBLIC_OPEN_LICENSED_OK',
  };
}

/** Offline-first external data request. */
export function agentRequestExternalData(input: {
  networkOnline: boolean;
  providerConfigured: boolean;
}): {
  status: 'READY' | 'WAITING_DATA' | 'WAITING_PROVIDER';
  reason: string;
} {
  if (!input.providerConfigured) {
    return {
      status: 'WAITING_PROVIDER',
      reason: 'EXTERNAL_PROVIDER_NOT_CONFIGURED',
    };
  }
  if (!input.networkOnline) {
    return {
      status: 'WAITING_DATA',
      reason: 'OFFLINE_EXTERNAL_DATA',
    };
  }
  return {
    status: 'READY',
    reason: 'PROVIDER_REACHABLE',
  };
}

export type { ClassicalBaselineReceipt };
