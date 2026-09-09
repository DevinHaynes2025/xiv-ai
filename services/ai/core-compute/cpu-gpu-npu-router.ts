/**
 * 62L-ES-HC4 — CPU / GPU / NPU router with truth-ladder honesty.
 *
 * Fallback to CPU must not claim GPU/NPU VERIFIED.
 * Unverified AMD GPU path cannot be preferred as VERIFIED.
 */

import {
  HC4_LOCKS,
  amdAcceleratorVerificationStatus,
  canAdvanceTruthLadder,
  scopesMatch,
  type AcceleratorClass,
  type ChipVendor,
  type HardwareTruthState,
  type TenantScope,
} from './types.ts';

export type RouteCandidate = {
  routeId: string;
  vendor: ChipVendor;
  acceleratorClass: AcceleratorClass;
  truthState: HardwareTruthState;
  isFallback: boolean;
  scope: TenantScope;
};

export type RouteDecision =
  | {
      selected: true;
      route: RouteCandidate;
      claimedAcceleratorVerified: false | true;
      note: string;
    }
  | {
      selected: false;
      denied: true;
      state: 'DENIED' | 'NO_ELIGIBLE_ROUTE' | 'WAITING_DATA' | 'NOT_TESTED';
      reason: string;
      claimedAcceleratorVerified: false;
    };

export type CpuGpuNpuRouter = {
  register(candidate: RouteCandidate): RouteCandidate | { denied: true; reason: string };
  select(input: {
    scope: TenantScope;
    preferVendor?: ChipVendor;
    preferClass?: AcceleratorClass;
    allowFallbackToCpu?: boolean;
  }): RouteDecision;
  list(scope: TenantScope): readonly RouteCandidate[];
};

function denyRoute(
  reason: string,
  state: 'DENIED' | 'NO_ELIGIBLE_ROUTE' | 'WAITING_DATA' | 'NOT_TESTED' = 'DENIED',
): RouteDecision {
  return {
    selected: false,
    denied: true,
    state,
    reason,
    claimedAcceleratorVerified: false,
  };
}

export function createCpuGpuNpuRouter(): CpuGpuNpuRouter {
  const routes: RouteCandidate[] = [];

  return {
    register(candidate) {
      // Fabricated AMD GPU/NPU VERIFIED at register → demote to NOT_TESTED.
      if (
        candidate.vendor === 'AMD' &&
        (candidate.acceleratorClass === 'GPU' ||
          candidate.acceleratorClass === 'NPU') &&
        candidate.truthState === 'VERIFIED'
      ) {
        const status = amdAcceleratorVerificationStatus({
          class: candidate.acceleratorClass,
        });
        if (!status.verified) {
          const demoted: RouteCandidate = {
            ...candidate,
            truthState: 'NOT_TESTED',
          };
          routes.push(demoted);
          return demoted;
        }
      }
      routes.push(candidate);
      return candidate;
    },

    select(input) {
      if (HC4_LOCKS.CROSS_TENANT_POOLING) {
        return denyRoute('LOCK_VIOLATION_CROSS_TENANT_POOLING_MUST_BE_FALSE');
      }

      const scoped = routes.filter((r) => scopesMatch(r.scope, input.scope));
      if (scoped.length === 0) {
        return denyRoute('NO_ROUTES_IN_TENANT_SCOPE', 'NO_ELIGIBLE_ROUTE');
      }

      // Prefer verified non-fallback matching vendor/class.
      const preferred = scoped.filter((r) => {
        if (input.preferVendor && r.vendor !== input.preferVendor) return false;
        if (input.preferClass && r.acceleratorClass !== input.preferClass)
          return false;
        return true;
      });

      // Explicit deny: unverified AMD GPU preferred as VERIFIED.
      if (
        input.preferVendor === 'AMD' &&
        input.preferClass === 'GPU' &&
        !HC4_LOCKS.UNVERIFIED_AMD_PREFERRED_AS_VERIFIED
      ) {
        const amdGpu = preferred.find(
          (r) =>
            r.vendor === 'AMD' &&
            r.acceleratorClass === 'GPU' &&
            !r.isFallback,
        );
        if (amdGpu && amdGpu.truthState !== 'VERIFIED') {
          // Do not select as VERIFIED claim; may fall through to CPU fallback.
          if (!input.allowFallbackToCpu) {
            return denyRoute(
              'UNVERIFIED_AMD_GPU_CANNOT_BE_PREFERRED_AS_VERIFIED',
              amdGpu.truthState === 'NOT_TESTED' ? 'NOT_TESTED' : 'DENIED',
            );
          }
        } else if (
          amdGpu &&
          amdGpu.truthState === 'VERIFIED' &&
          !amdAcceleratorVerificationStatus({ class: 'GPU' }).verified
        ) {
          return denyRoute(
            'FABRICATED_AMD_GPU_VERIFIED_DENIED',
            'NOT_TESTED',
          );
        }
      }

      const verified = preferred.find(
        (r) => r.truthState === 'VERIFIED' && !r.isFallback,
      );
      if (verified) {
        // Double-check AMD honesty.
        if (
          verified.vendor === 'AMD' &&
          (verified.acceleratorClass === 'GPU' ||
            verified.acceleratorClass === 'NPU') &&
          !amdAcceleratorVerificationStatus({
            class: verified.acceleratorClass,
          }).verified
        ) {
          // fall through — treat as unverified
        } else {
          return {
            selected: true,
            route: verified,
            claimedAcceleratorVerified: true,
            note: `Selected VERIFIED ${verified.vendor} ${verified.acceleratorClass}.`,
          };
        }
      }

      if (input.allowFallbackToCpu !== false) {
        const cpu = scoped.find(
          (r) => r.acceleratorClass === 'CPU' || r.isFallback,
        );
        if (cpu) {
          return {
            selected: true,
            route: { ...cpu, isFallback: true },
            // Critical honesty: fallback ≠ GPU/NPU VERIFIED
            claimedAcceleratorVerified: HC4_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED
              ? true
              : false,
            note:
              'CPU fallback selected — fallback ≠ claimed GPU/NPU VERIFIED.',
          };
        }
      }

      return denyRoute('NO_ELIGIBLE_ROUTE', 'NO_ELIGIBLE_ROUTE');
    },

    list(scope) {
      return routes.filter((r) => scopesMatch(r.scope, scope));
    },
  };
}

/**
 * Attempt to advance a route's truth state — skip denied.
 */
export function advanceRouteTruth(input: {
  from: HardwareTruthState;
  to: HardwareTruthState;
}): { ok: true } | { ok: false; reason: string } {
  if (!canAdvanceTruthLadder(input.from, input.to)) {
    return {
      ok: false,
      reason: `TRUTH_LADDER_SKIP_DENIED:${input.from}->${input.to}`,
    };
  }
  return { ok: true };
}
