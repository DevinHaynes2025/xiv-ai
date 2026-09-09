/**
 * 62L-EX18 — Freshness evaluation.
 * FRESH / AGING / STALE / INVALID / REVOKED
 * STALE ≠ current VERIFIED.
 */

import {
  EX18_LOCKS,
  type FreshnessState,
  type HighwayState,
  type XivWormholeRoute,
} from './types.ts';

export type FreshnessEvalInput = {
  registeredFreshness: FreshnessState;
  ttlExpiryIso: string | null;
  nowIso: string;
  sourceRevoked?: boolean;
  integrityValid?: boolean;
  runtimeVersionMatch?: boolean;
  agingAfterMs?: number;
};

export type FreshnessEvalResult = {
  freshness: FreshnessState;
  eligibleForShortcutPreference: boolean;
  equalsVerified: false;
  reason: string;
};

function parseMs(iso: string): number {
  return Date.parse(iso);
}

/**
 * Evaluate freshness. STALE never equals VERIFIED (locked).
 */
export function evaluateFreshness(input: FreshnessEvalInput): FreshnessEvalResult {
  if (input.sourceRevoked) {
    return {
      freshness: 'REVOKED',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Source revoked → REVOKED; shortcut preference invalidated.',
    };
  }
  if (input.integrityValid === false) {
    return {
      freshness: 'INVALID',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Integrity invalid → INVALID.',
    };
  }
  if (input.registeredFreshness === 'REVOKED') {
    return {
      freshness: 'REVOKED',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Registered freshness REVOKED.',
    };
  }
  if (input.registeredFreshness === 'INVALID') {
    return {
      freshness: 'INVALID',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Registered freshness INVALID.',
    };
  }
  if (input.runtimeVersionMatch === false) {
    return {
      freshness: 'STALE',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Runtime version mismatch → STALE; STALE ≠ VERIFIED.',
    };
  }

  if (input.ttlExpiryIso) {
    const now = parseMs(input.nowIso);
    const exp = parseMs(input.ttlExpiryIso);
    if (!Number.isNaN(now) && !Number.isNaN(exp) && now > exp) {
      return {
        freshness: 'STALE',
        eligibleForShortcutPreference: false,
        equalsVerified: false,
        reason: 'TTL expired → STALE; STALE ≠ current VERIFIED.',
      };
    }
    const agingAfter = input.agingAfterMs ?? 60 * 60 * 1000;
    if (
      !Number.isNaN(now) &&
      !Number.isNaN(exp) &&
      exp - now < agingAfter &&
      input.registeredFreshness === 'FRESH'
    ) {
      return {
        freshness: 'AGING',
        eligibleForShortcutPreference: true,
        equalsVerified: false,
        reason: 'Approaching TTL → AGING (still eligible; not VERIFIED by freshness alone).',
      };
    }
  }

  if (input.registeredFreshness === 'STALE') {
    return {
      freshness: 'STALE',
      eligibleForShortcutPreference: false,
      equalsVerified: false,
      reason: 'Registered STALE; STALE ≠ VERIFIED (locked).',
    };
  }
  if (input.registeredFreshness === 'AGING') {
    return {
      freshness: 'AGING',
      eligibleForShortcutPreference: true,
      equalsVerified: false,
      reason: 'AGING — eligible with caution; not VERIFIED.',
    };
  }

  return {
    freshness: 'FRESH',
    eligibleForShortcutPreference: true,
    equalsVerified: false,
    reason: 'FRESH — eligible for shortcut preference after auth/policy.',
  };
}

export function staleEqualsVerified(): false {
  return EX18_LOCKS.STALE_EQ_VERIFIED;
}

export function highwayAfterFreshness(
  highway: HighwayState,
  freshness: FreshnessState,
): HighwayState {
  if (freshness === 'STALE' || freshness === 'INVALID' || freshness === 'REVOKED') {
    return freshness === 'STALE' ? 'STALE' : 'DEGRADED';
  }
  return highway;
}

export function routeFreshnessEligible(route: XivWormholeRoute, nowIso: string): boolean {
  const evalResult = evaluateFreshness({
    registeredFreshness: route.freshness,
    ttlExpiryIso: route.ttlExpiryIso,
    nowIso,
  });
  return evalResult.eligibleForShortcutPreference;
}
