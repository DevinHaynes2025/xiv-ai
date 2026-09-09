/**
 * Local model / compute abstraction.
 * CPU = safe baseline. AMD GPU/NPU remain NOT_TESTED until
 * load + execute + confirm device + valid result + benchmark.
 * Soft-wire HC1/HC4. Presence ≠ VERIFIED.
 */

import {
  COMPUTE_STATES,
  GOB_LOCKS,
  type ComputeState,
} from './types.ts';

export type ComputeAdapterId =
  | 'CPU'
  | 'AMD_GPU'
  | 'AMD_NPU'
  | 'NVIDIA'
  | 'INTEL'
  | 'ARM'
  | 'RISC_V';

export type ComputeAdapter = {
  id: ComputeAdapterId;
  state: ComputeState;
  note: string;
  verified: boolean;
  evidenceRefs: readonly string[];
};

export type RouteDecision = {
  selected: ComputeAdapterId;
  state: ComputeState;
  usedFallback: boolean;
  claimedAcceleratorVerified: false | true;
  reason: string;
};

export type ComputeAdapterRegistry = {
  get(id: ComputeAdapterId): ComputeAdapter;
  list(): readonly ComputeAdapter[];
  /**
   * Attempt to mark VERIFIED — only succeeds with full evidence chain.
   * Without evidence → remains NOT_TESTED / DENIED.
   */
  attemptVerify(input: {
    id: ComputeAdapterId;
    loaded: boolean;
    executed: boolean;
    deviceConfirmed: boolean;
    validResult: boolean;
    benchmarked: boolean;
    evidenceRefs: readonly string[];
  }):
    | { verified: true; adapter: ComputeAdapter }
    | { verified: false; denied: true; reason: string; adapter: ComputeAdapter };
  route(input: {
    prefer?: ComputeAdapterId;
    requireVerifiedAccelerator?: boolean;
  }): RouteDecision;
  /** CPU fallback never equals accelerator VERIFIED. */
  cpuFallback(): RouteDecision;
};

const RESEARCH_ADAPTERS: ComputeAdapterId[] = [
  'AMD_GPU',
  'AMD_NPU',
  'NVIDIA',
  'INTEL',
  'ARM',
  'RISC_V',
];

export function createComputeAdapterRegistry(): ComputeAdapterRegistry {
  const adapters = new Map<ComputeAdapterId, ComputeAdapter>();

  adapters.set('CPU', {
    id: 'CPU',
    state: 'SUPPORTED',
    note: 'CPU is the safe baseline for local-first orchestration (SUPPORTED; load/execute on this agent host may still be NOT_TESTED for model inference).',
    verified: false,
    evidenceRefs: ['cpu-baseline-policy'],
  });

  for (const id of RESEARCH_ADAPTERS) {
    adapters.set(id, {
      id,
      state: 'NOT_TESTED',
      note: `${id} adapter prepared for research — NOT_TESTED until load+execute+confirm device+valid result+benchmark. Presence≠VERIFIED.`,
      verified: false,
      evidenceRefs: [],
    });
  }

  return {
    get(id) {
      return adapters.get(id)!;
    },

    list() {
      return [...adapters.values()];
    },

    attemptVerify(input) {
      const adapter = adapters.get(input.id)!;
      if (GOB_LOCKS.FABRICATE_GPU_VERIFIED || GOB_LOCKS.FABRICATE_NPU_VERIFIED) {
        return {
          verified: false,
          denied: true,
          reason: 'LOCK_VIOLATION_FABRICATE_ACCELERATOR',
          adapter,
        };
      }
      if (input.id !== 'CPU') {
        const full =
          input.loaded &&
          input.executed &&
          input.deviceConfirmed &&
          input.validResult &&
          input.benchmarked &&
          input.evidenceRefs.length > 0;
        if (!full) {
          return {
            verified: false,
            denied: true,
            reason: 'INCOMPLETE_VERIFICATION_CHAIN',
            adapter,
          };
        }
      }
      // Even with chain, this environment has not produced real device evidence —
      // keep honest: only CPU can become SUPPORTED without device probe;
      // accelerators stay NOT_TESTED unless caller supplies real evidence
      // AND we are not fabricating. For unit tests, allow VERIFIED only when
      // full chain is true (simulated evidence path for contract tests).
      if (input.id === 'CPU') {
        adapter.state = 'SUPPORTED';
        adapter.verified = false;
        adapter.note =
          'CPU SUPPORTED as safe baseline; model inference VERIFIED only with separate load evidence.';
        adapter.evidenceRefs = input.evidenceRefs;
        return { verified: false, denied: true, reason: 'CPU_BASELINE_NOT_ACCELERATOR_VERIFIED', adapter };
      }
      // Simulated full chain for contract testing — still record honestly that
      // production hardware remains NOT_TESTED until real node evidence exists.
      // The registry will mark VERIFIED only when full chain is supplied (test path).
      adapter.state = 'VERIFIED';
      adapter.verified = true;
      adapter.evidenceRefs = input.evidenceRefs;
      adapter.note = `${input.id} marked VERIFIED only because full evidence chain was supplied to registry (contract path). Production nodes remain NOT_TESTED until real probe.`;
      return { verified: true, adapter };
    },

    route(input) {
      const prefer = input.prefer ?? 'CPU';
      const adapter = adapters.get(prefer)!;
      if (input.requireVerifiedAccelerator) {
        if (!adapter.verified || adapter.state !== 'VERIFIED') {
          return this.cpuFallback();
        }
      }
      if (prefer !== 'CPU' && adapter.state === 'NOT_TESTED') {
        return this.cpuFallback();
      }
      return {
        selected: prefer,
        state: adapter.state,
        usedFallback: false,
        claimedAcceleratorVerified: adapter.verified && prefer !== 'CPU',
        reason: `Routed to ${prefer} in state ${adapter.state}.`,
      };
    },

    cpuFallback() {
      if (GOB_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED) {
        return {
          selected: 'CPU' as const,
          state: 'SUPPORTED' as const,
          usedFallback: true,
          claimedAcceleratorVerified: true as const,
          reason: 'LOCK_VIOLATION',
        };
      }
      return {
        selected: 'CPU' as const,
        state: 'SUPPORTED' as const,
        usedFallback: true,
        claimedAcceleratorVerified: false as const,
        reason:
          'CPU fallback — does NOT equal GPU/NPU VERIFIED. Accelerators remain NOT_TESTED without evidence.',
      };
    },
  };
}

export function defaultHardwareTruth(): Record<
  ComputeAdapterId,
  ComputeState
> {
  return {
    CPU: 'SUPPORTED',
    AMD_GPU: 'NOT_TESTED',
    AMD_NPU: 'NOT_TESTED',
    NVIDIA: 'NOT_TESTED',
    INTEL: 'NOT_TESTED',
    ARM: 'NOT_TESTED',
    RISC_V: 'NOT_TESTED',
  };
}

export { COMPUTE_STATES };
