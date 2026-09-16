// 12D-263 — Iris Unlock Gate (pure contract): the state machine that turns
// the 12D-261 requirements into an enforceable contract BEFORE any biometric
// capability exists. DECLARED NOT PROVEN: this module implements NO iris
// recognition, captures NO image, touches NO camera, and proves NO biometric
// capability. It enforces the requirements' SHAPE so that whatever capture
// engine is authorized in a future story cannot violate them silently:
//
//   * OPT-IN + ACTIVE GESTURE ONLY: the camera can only turn on after an
//     explicit operator unlock gesture (GESTURE event) — never on a timer,
//     never in the background. There is no transition that opens the camera
//     without one.
//   * CAMERA-OFF GUARANTEE: every terminal outcome (UNLOCKED, LOCKED) has
//     cameraActive false — asserted structurally: the phase carries the
//     camera state with it, and no terminal state ever has a camera on.
//   * FAIL CLOSED TO LOCKED: the verdict comes ONLY from an injected
//     evaluator (a future capture story's job — DECLARED NOT PROVEN); any
//     verdict that is not exactly MATCH — NO_MATCH, SPOOF_SUSPECT,
//     LOW_QUALITY, UNAVAILABLE, or ANY unknown/garbage verdict — locks the
//     gate. Ambiguity never unlocks.
//   * BOUNDED ATTEMPTS: a session allows a fixed number of capture attempts
//     (3); after the third failing verdict the gate refuses new gestures
//     until a fresh session is created — brute force has no runway.
//   * BIOMETRICS UNLOCK, CUSTODY DECIDES: UNLOCKED opens the operator's
//     local universe and grants NO authority anywhere in the custody stack.
//     There is no custody surface, receipt, or approval hidden in this
//     module.
//
// The gate is PURE: no fs, no network, no clock, no randomness. The capture
// WINDOW is the host's duty: the gate accepts a TIMEOUT event and locks, but
// it cannot measure time itself (disclosed residual). modelCalls: 0,
// remoteCalls: 0. humanDecision: 'REQUIRED' — enrollment and every
// consequential decision remain the operator's, in the custody stack.

export const IRIS_UNLOCK_GATE_POLICY = Object.freeze({
  policyVersion: '12d-263-v1',
  domain: 'XIV_OS_IRIS_UNLOCK_GATE',
  biometricCapability: 'DECLARED_NOT_PROVEN' as const,
  /** Fixed attempt budget per session — brute force has no runway. */
  maxAttemptsPerSession: 3,
});

export const IRIS_UNLOCK_GATE_GUARDRAILS = Object.freeze({
  optInEnrollmentRequired: true, // enrollment is a separate, revocable operator act (12D-261 R1)
  activeGestureOnly: true, // the camera never opens without an explicit gesture
  cameraOffAfterVerdict: true, // terminal outcomes always carry cameraActive false
  failClosedToLocked: true, // anything but an exact MATCH locks the gate
  biometricsUnlockCustodyDecides: true, // unlock grants no custody authority
  templatesLocalOnly: true, // biometric templates never leave the device (12D-261 R1)
  declaredNotProven: true, // no biometric capability is implemented or claimed
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type IrisVerdict = 'MATCH' | 'NO_MATCH' | 'SPOOF_SUSPECT' | 'LOW_QUALITY' | 'UNAVAILABLE';

export type IrisGateEvent =
  | Readonly<{ kind: 'GESTURE' }>
  | Readonly<{ kind: 'CAPTURE'; verdict: IrisVerdict }>
  | Readonly<{ kind: 'TIMEOUT' }>
  | Readonly<{ kind: 'ABORT' }>
  | Readonly<{ kind: 'LOCK' }>
  | Readonly<{ kind: 'RESET' }>;

export type IrisGateState = Readonly<{
  phase: 'IDLE' | 'CAPTURING' | 'UNLOCKED' | 'LOCKED';
  /** The camera-off guarantee is carried IN the state: terminal phases are
   * never camera-active, and every transition asserts this postcondition. */
  cameraActive: boolean;
  /** Failing captures consumed so far this session. */
  attemptsUsed: number;
  policyVersion: string;
  guardrails: typeof IRIS_UNLOCK_GATE_GUARDRAILS;
}>;

const VERDICTS: readonly IrisVerdict[] = ['MATCH', 'NO_MATCH', 'SPOOF_SUSPECT', 'LOW_QUALITY', 'UNAVAILABLE'];

const STATE_KEYS = ['phase', 'cameraActive', 'attemptsUsed', 'policyVersion', 'guardrails'] as const;

const baseState = (phase: IrisGateState['phase'], cameraActive: boolean, attemptsUsed: number): IrisGateState =>
  Object.freeze({
    phase,
    cameraActive,
    attemptsUsed,
    policyVersion: IRIS_UNLOCK_GATE_POLICY.policyVersion,
    guardrails: IRIS_UNLOCK_GATE_GUARDRAILS,
  });

/** A fresh gate session: IDLE, camera OFF, full attempt budget. */
export function createIrisUnlockGate(): IrisGateState {
  return baseState('IDLE', false, 0);
}

function isGateState(v: unknown): v is IrisGateState {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v as Record<string, unknown>);
  if (keys.length !== STATE_KEYS.length || !STATE_KEYS.every((k, i) => keys[i] === k)) return false;
  const s = v as IrisGateState;
  // The camera may be ON only while CAPTURING — an impossible state refuses
  // here, at the gate, before any transition logic runs.
  const cameraLegal = s.phase === 'CAPTURING' ? s.cameraActive === true : s.cameraActive === false;
  return (
    ['IDLE', 'CAPTURING', 'UNLOCKED', 'LOCKED'].includes(s.phase)
    && cameraLegal
    && typeof s.attemptsUsed === 'number'
    && Number.isSafeInteger(s.attemptsUsed)
    && s.attemptsUsed >= 0
    && s.attemptsUsed <= IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession
    && s.policyVersion === IRIS_UNLOCK_GATE_POLICY.policyVersion
  );
}

/**
 * Advance the gate by ONE event. Fail closed: an invalid state, an invalid
 * event, an illegal transition, or any non-MATCH verdict returns a LOCKED
 * (or unchanged) state — never an unlock. The returned state is always
 * frozen and always carries the honest policy pins.
 */
export function stepIrisGate(state: IrisGateState, event: IrisGateEvent): IrisGateState {
  if (!isGateState(state))
    throw new Error('a live 12D-263 gate state is required; fail closed');
  if (!event || typeof event !== 'object' || Array.isArray(event))
    throw new Error('an event object is required; fail closed');

  switch (event.kind) {
    case 'GESTURE': {
      // The camera opens ONLY here, ONLY from IDLE, ONLY with budget left.
      if (state.phase !== 'IDLE') return baseState('LOCKED', false, state.attemptsUsed);
      if (state.attemptsUsed >= IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession)
        return baseState('LOCKED', false, state.attemptsUsed);
      return baseState('CAPTURING', true, state.attemptsUsed);
    }
    case 'CAPTURE': {
      if (state.phase !== 'CAPTURING')
        return baseState('LOCKED', false, state.attemptsUsed);
      const verdict: unknown = (event as { verdict?: unknown }).verdict;
      if (verdict !== 'MATCH') {
        // NO_MATCH, SPOOF_SUSPECT, LOW_QUALITY, UNAVAILABLE, and ANY garbage
        // verdict all fail closed to LOCKED. The attempt is consumed.
        return baseState('LOCKED', false, state.attemptsUsed + 1);
      }
      return baseState('UNLOCKED', false, state.attemptsUsed);
    }
    case 'TIMEOUT': {
      // The window is the host's duty; the gate honors the event fail-closed.
      if (state.phase !== 'CAPTURING') return baseState('LOCKED', false, state.attemptsUsed);
      return baseState('LOCKED', false, state.attemptsUsed + 1);
    }
    case 'ABORT': {
      // The operator may abort a capture at any time; the camera goes off
      // and no attempt is consumed (nothing was evaluated).
      if (state.phase !== 'CAPTURING') return baseState('LOCKED', false, state.attemptsUsed);
      return baseState('IDLE', false, state.attemptsUsed);
    }
    case 'LOCK': {
      // Re-locking an unlocked session returns to IDLE with budget intact
      // minus used attempts.
      if (state.phase !== 'UNLOCKED') return baseState('LOCKED', false, state.attemptsUsed);
      return baseState('IDLE', false, state.attemptsUsed);
    }
    case 'RESET': {
      // A locked gate with budget left may be reset for another attempt;
      // an exhausted gate needs a fresh session (attemptsUsed is terminal).
      if (state.phase !== 'LOCKED') return baseState('LOCKED', false, state.attemptsUsed);
      if (state.attemptsUsed >= IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession)
        return baseState('LOCKED', false, state.attemptsUsed);
      return baseState('IDLE', false, state.attemptsUsed);
    }
    default:
      // Unknown event kinds fail closed.
      return baseState('LOCKED', false, state.attemptsUsed);
  }
}

/**
 * The camera-off postcondition, as a checkable invariant: a state that is
 * terminal (UNLOCKED or LOCKED) must have the camera OFF, and any CAPTURING
 * state must be the only one with the camera ON. Returns ok:false on any
 * violation (the host can assert this after every step).
 */
export function verifyIrisGateCameraOffInvariant(state: IrisGateState): Readonly<{ ok: boolean }> {
  if (!isGateState(state)) return Object.freeze({ ok: false });
  const terminalCameraOff = (state.phase === 'UNLOCKED' || state.phase === 'LOCKED') && !state.cameraActive;
  const capturingCameraOn = state.phase === 'CAPTURING' && state.cameraActive;
  const idleCameraOff = state.phase === 'IDLE' && !state.cameraActive;
  return Object.freeze({ ok: terminalCameraOff || capturingCameraOn || idleCameraOff });
}