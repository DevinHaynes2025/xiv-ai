/**
 * 62L-ES-HC4 — AMD Software Acceleration Layer.
 *
 * Proprietary/software intelligence over **verified** hardware only:
 * scheduling, batching, caching, quantization, model-selection, fallback.
 * Acceleration ≠ silicon modification. AMD-first optimization candidates,
 * with identical honesty for NVIDIA/Intel/ARM/etc.
 */

import {
  ACCELERATION_TECHNIQUES,
  HC4_LOCKS,
  amdAcceleratorVerificationStatus,
  canAdvanceTruthLadder,
  type AccelerationTechnique,
  type ChipVendor,
  type HardwareTruthState,
  type TenantScope,
  type TruthLadderState,
} from './types.ts';

export type AccelerationPlan = {
  planId: string;
  vendor: ChipVendor;
  techniques: readonly AccelerationTechnique[];
  targetTruthState: HardwareTruthState;
  preferred: boolean;
  reason: string;
  scope: TenantScope;
};

export type AccelerationDecision =
  | {
      allowed: true;
      plan: AccelerationPlan;
      claimVerified: false | true;
      note: string;
    }
  | {
      allowed: false;
      denied: true;
      state: 'DENIED' | 'NOT_TESTED' | 'WAITING_DATA';
      reason: string;
      claimVerified: false;
    };

export type AccelerationRegistry = {
  propose(input: {
    planId: string;
    vendor: ChipVendor;
    techniques: readonly AccelerationTechnique[];
    hardwareTruthState: HardwareTruthState;
    preferAsVerified?: boolean;
    scope: TenantScope;
  }): AccelerationDecision;
  listForScope(scope: TenantScope): readonly AccelerationPlan[];
};

function deny(
  reason: string,
  state: 'DENIED' | 'NOT_TESTED' | 'WAITING_DATA' = 'DENIED',
): AccelerationDecision {
  return {
    allowed: false,
    denied: true,
    state,
    reason,
    claimVerified: false,
  };
}

/**
 * Reject silicon/BIOS/firmware/overclock/driver privilege escalation claims.
 */
export function denySiliconModificationClaim(claim: string): AccelerationDecision {
  const signals = [
    'silicon',
    'bios',
    'firmware',
    'overclock',
    'vbios',
    'voltage',
    'driver privilege',
    'privilege escalation',
    'microcode',
  ];
  const lower = claim.toLowerCase();
  if (
    HC4_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    signals.some((s) => lower.includes(s))
  ) {
    return deny(
      'ACCELERATION_NEQ_SILICON_MODIFY — BIOS/firmware/overclock/driver privilege escalation denied.',
    );
  }
  return deny('CLAIM_NOT_RECOGNIZED_AS_SOFTWARE_ACCELERATION');
}

/**
 * Build an AMD-first (or vendor-honest) acceleration plan.
 * Unverified AMD GPU/NPU cannot be preferred as VERIFIED.
 */
export function createAccelerationRegistry(): AccelerationRegistry {
  const plans: AccelerationPlan[] = [];

  return {
    propose(input) {
      for (const t of input.techniques) {
        if (
          !(ACCELERATION_TECHNIQUES as readonly string[]).includes(t)
        ) {
          return deny(`UNKNOWN_TECHNIQUE:${t}`);
        }
      }

      if (HC4_LOCKS.AUTO_CLOUD_PURCHASE) {
        return deny('LOCK_VIOLATION_AUTO_CLOUD_PURCHASE_MUST_BE_FALSE');
      }

      // Prefer-as-VERIFIED only when ladder is already VERIFIED with evidence.
      if (input.preferAsVerified) {
        if (input.hardwareTruthState !== 'VERIFIED') {
          if (
            input.vendor === 'AMD' &&
            !HC4_LOCKS.UNVERIFIED_AMD_PREFERRED_AS_VERIFIED
          ) {
            return deny(
              'UNVERIFIED_AMD_CANNOT_BE_PREFERRED_AS_VERIFIED',
              input.hardwareTruthState === 'NOT_TESTED'
                ? 'NOT_TESTED'
                : 'DENIED',
            );
          }
          return deny(
            'UNVERIFIED_HARDWARE_CANNOT_BE_PREFERRED_AS_VERIFIED',
            input.hardwareTruthState === 'NOT_TESTED'
              ? 'NOT_TESTED'
              : 'DENIED',
          );
        }
        // Even if labeled VERIFIED in input, AMD GPU/NPU needs real evidence.
        if (input.vendor === 'AMD') {
          const gpu = amdAcceleratorVerificationStatus({ class: 'GPU' });
          const npu = amdAcceleratorVerificationStatus({ class: 'NPU' });
          if (!gpu.verified && !npu.verified) {
            return deny(
              'AMD_GPU_NPU_NOT_TESTED_NO_FABRICATED_VERIFIED',
              'NOT_TESTED',
            );
          }
        }
      }

      // Ladder skip check if caller tries to jump target to VERIFIED from DOCUMENTED.
      if (
        input.hardwareTruthState === 'DOCUMENTED' &&
        input.preferAsVerified
      ) {
        if (!canAdvanceTruthLadder('DOCUMENTED', 'VERIFIED')) {
          return deny('TRUTH_LADDER_SKIP_DENIED_DOCUMENTED_TO_VERIFIED');
        }
      }

      const plan: AccelerationPlan = {
        planId: input.planId,
        vendor: input.vendor,
        techniques: input.techniques,
        targetTruthState: input.hardwareTruthState,
        preferred: Boolean(
          input.preferAsVerified && input.hardwareTruthState === 'VERIFIED',
        ),
        reason:
          input.vendor === 'AMD'
            ? 'AMD-first optimization candidate (software only; evidence-gated).'
            : `${input.vendor} optimization candidate with same honesty ladder.`,
        scope: input.scope,
      };
      plans.push(plan);
      return {
        allowed: true,
        plan,
        claimVerified: plan.preferred,
        note: plan.reason,
      };
    },

    listForScope(scope) {
      return plans.filter(
        (p) =>
          p.scope.orgId === scope.orgId &&
          p.scope.tenantId === scope.tenantId &&
          p.scope.universeId === scope.universeId,
      );
    },
  };
}

/**
 * Advance a technique eligibility one honest ladder step.
 */
export function advanceTechniqueEligibility(input: {
  from: TruthLadderState;
  to: TruthLadderState;
}): { ok: true } | { ok: false; reason: string } {
  if (!canAdvanceTruthLadder(input.from, input.to)) {
    return {
      ok: false,
      reason: `TRUTH_LADDER_SKIP_DENIED:${input.from}->${input.to}`,
    };
  }
  return { ok: true };
}
