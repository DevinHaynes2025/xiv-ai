/**
 * 62L-EL5 — Capability truth progression (hard).
 *
 * Progression: UNKNOWN → DETECTED → SUPPORTED → VERIFIED
 * A detected Radeon/AMD GPU cannot skip directly to VERIFIED.
 * Side states (DEGRADED / UNAVAILABLE / NOT_TESTED) are not promotion steps.
 */

import type { CapabilityState } from './types';

/** Ordered promotion chain. Skipping any step is denied. */
export const CAPABILITY_TRUTH_PROGRESSION = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const satisfies readonly CapabilityState[];

export type CapabilityPromotionState = (typeof CAPABILITY_TRUTH_PROGRESSION)[number];

export type CapabilityAdvanceResult = {
  allowed: boolean;
  from: CapabilityState;
  to: CapabilityState;
  resultingState: CapabilityState;
  reason: string;
  skippedSteps: CapabilityPromotionState[];
};

function promotionIndex(state: CapabilityState): number {
  return (CAPABILITY_TRUTH_PROGRESSION as readonly string[]).indexOf(state);
}

/**
 * Returns steps that would be skipped when moving from → to on the promotion chain.
 * Empty when the move is adjacent, identical, or not a chain promotion.
 */
export function skippedPromotionSteps(
  from: CapabilityState,
  to: CapabilityState,
): CapabilityPromotionState[] {
  const fromIdx = promotionIndex(from);
  const toIdx = promotionIndex(to);
  if (fromIdx < 0 || toIdx < 0 || toIdx <= fromIdx + 1) return [];
  return CAPABILITY_TRUTH_PROGRESSION.slice(fromIdx + 1, toIdx) as CapabilityPromotionState[];
}

/**
 * Encode + enforce deny-skip. DETECTED → VERIFIED is always denied.
 * Identical states are allowed (no-op). Non-promotion side transitions are not
 * treated as VERIFIED promotions.
 */
export function advanceCapabilityState(
  from: CapabilityState,
  to: CapabilityState,
): CapabilityAdvanceResult {
  if (from === to) {
    return {
      allowed: true,
      from,
      to,
      resultingState: from,
      reason: 'NO_OP_SAME_STATE',
      skippedSteps: [],
    };
  }

  const fromIdx = promotionIndex(from);
  const toIdx = promotionIndex(to);

  // Side / non-chain states: never allow jumping onto VERIFIED without chain evidence.
  if (to === 'VERIFIED' && from !== 'SUPPORTED') {
    const skipped = skippedPromotionSteps(
      fromIdx >= 0 ? from : 'UNKNOWN',
      'VERIFIED',
    );
    return {
      allowed: false,
      from,
      to,
      resultingState: from,
      reason: 'DENY_SKIP_TO_VERIFIED_REQUIRES_SUPPORTED',
      skippedSteps: skipped.length ? skipped : (['SUPPORTED'] as CapabilityPromotionState[]),
    };
  }

  if (fromIdx < 0 || toIdx < 0) {
    return {
      allowed: false,
      from,
      to,
      resultingState: from,
      reason: 'NON_PROMOTION_SIDE_STATE_NOT_A_VERIFIED_CLAIM',
      skippedSteps: [],
    };
  }

  if (toIdx < fromIdx) {
    return {
      allowed: true,
      from,
      to,
      resultingState: to,
      reason: 'DOWNGRADE_OR_RECLASSIFY_ALLOWED',
      skippedSteps: [],
    };
  }

  const skipped = skippedPromotionSteps(from, to);
  if (skipped.length > 0) {
    return {
      allowed: false,
      from,
      to,
      resultingState: from,
      reason: 'DENY_SKIP_IN_TRUTH_PROGRESSION',
      skippedSteps: skipped,
    };
  }

  return {
    allowed: true,
    from,
    to,
    resultingState: to,
    reason: 'ADJACENT_PROMOTION_ALLOWED',
    skippedSteps: [],
  };
}

/** DETECTED is never equal to VERIFIED — classification honesty helper. */
export function isDetectedEqualVerified(): false {
  return false;
}

export function statesAreDistinct(a: CapabilityState, b: CapabilityState): boolean {
  return a !== b;
}
