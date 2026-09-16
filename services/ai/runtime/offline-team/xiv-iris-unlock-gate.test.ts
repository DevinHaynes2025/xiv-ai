// 12D-263 — adversarial tests for the iris unlock gate. Central properties
// under attack:
//   1. The camera NEVER opens without an explicit gesture (background
//      surveillance is structurally impossible).
//   2. Every terminal outcome carries the camera OFF (12D-261 R3).
//   3. Anything but an exact MATCH locks the gate — including garbage
//      verdicts a hostile evaluator might emit.
//   4. The attempt budget is real: three failing captures exhaust the gate.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  IRIS_UNLOCK_GATE_GUARDRAILS,
  IRIS_UNLOCK_GATE_POLICY,
  createIrisUnlockGate,
  stepIrisGate,
  verifyIrisGateCameraOffInvariant,
  type IrisGateState,
} from './xiv-iris-unlock-gate';

const INVARIANT = (s: IrisGateState, label: string) => {
  const verdict = verifyIrisGateCameraOffInvariant(s);
  assert.equal(verdict.ok, true, `camera-off invariant violated after ${label}`);
};

test('12d-263: a fresh gate is IDLE with the camera off and a full attempt budget', () => {
  const gate = createIrisUnlockGate();
  assert.equal(gate.phase, 'IDLE');
  assert.equal(gate.cameraActive, false);
  assert.equal(gate.attemptsUsed, 0);
  assert.equal(gate.policyVersion, '12d-263-v1');
  assert.ok(Object.isFrozen(gate));
  INVARIANT(gate, 'create');
});

test('12d-263: the camera opens ONLY on an explicit gesture, and a MATCH unlocks with the camera OFF', () => {
  let gate = createIrisUnlockGate();
  // A capture attempt without a gesture refuses and never opens the camera.
  const noGesture = stepIrisGate(gate, { kind: 'CAPTURE', verdict: 'MATCH' });
  assert.equal(noGesture.phase, 'LOCKED');
  assert.equal(noGesture.cameraActive, false);
  INVARIANT(noGesture, 'capture-without-gesture');

  gate = stepIrisGate(gate, { kind: 'GESTURE' });
  assert.equal(gate.phase, 'CAPTURING');
  assert.equal(gate.cameraActive, true, 'only the gesture turns the camera on');

  gate = stepIrisGate(gate, { kind: 'CAPTURE', verdict: 'MATCH' });
  assert.equal(gate.phase, 'UNLOCKED');
  assert.equal(gate.cameraActive, false, 'a verdict ALWAYS turns the camera off');
  INVARIANT(gate, 'unlock');
});

test('12d-263: every non-MATCH verdict fails closed to LOCKED with the camera off', () => {
  for (const verdict of ['NO_MATCH', 'SPOOF_SUSPECT', 'LOW_QUALITY', 'UNAVAILABLE'] as const) {
    let gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
    gate = stepIrisGate(gate, { kind: 'CAPTURE', verdict });
    assert.equal(gate.phase, 'LOCKED', verdict);
    assert.equal(gate.cameraActive, false, verdict);
    assert.equal(gate.attemptsUsed, 1, verdict);
    INVARIANT(gate, verdict);
  }
});

test('12d-263: garbage verdicts from a hostile evaluator fail closed to LOCKED', () => {
  let gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
  for (const junk of [undefined, null, '', 'match', 'MATCH ', 1, true, { verdict: 'MATCH' }, () => 'MATCH']) {
    gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
    const hostile = stepIrisGate(gate, { kind: 'CAPTURE', verdict: junk as never });
    assert.equal(hostile.phase, 'LOCKED', `verdict ${String(junk)} must fail closed`);
    assert.equal(hostile.cameraActive, false);
  }
});

test('12d-263: the attempt budget is real — three failing captures exhaust the session', () => {
  let gate = createIrisUnlockGate();
  for (let i = 1; i <= IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession; i++) {
    gate = stepIrisGate(gate, { kind: 'GESTURE' });
    if (i === 1) assert.equal(gate.phase, 'CAPTURING');
    gate = stepIrisGate(gate, { kind: 'CAPTURE', verdict: 'NO_MATCH' });
    assert.equal(gate.phase, 'LOCKED');
    gate = stepIrisGate(gate, { kind: 'RESET' });
  }
  // The budget is spent: a new GESTURE refuses, and RESET no longer helps.
  gate = stepIrisGate(gate, { kind: 'GESTURE' });
  assert.equal(gate.phase, 'LOCKED');
  gate = stepIrisGate(gate, { kind: 'RESET' });
  assert.equal(gate.phase, 'LOCKED');
  assert.equal(gate.attemptsUsed, IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession);
  INVARIANT(gate, 'exhausted');
});

test('12d-263: a TIMEOUT locks the gate and consumes the attempt', () => {
  let gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
  gate = stepIrisGate(gate, { kind: 'TIMEOUT' });
  assert.equal(gate.phase, 'LOCKED');
  assert.equal(gate.cameraActive, false);
  assert.equal(gate.attemptsUsed, 1);
  INVARIANT(gate, 'timeout');
});

test('12d-263: an ABORT returns to IDLE without consuming an attempt', () => {
  let gate = stepIrisUnlockGateHelper();
  assert.equal(gate.phase, 'IDLE');
  assert.equal(gate.attemptsUsed, 0);
  INVARIANT(gate, 'abort');
});
function stepIrisUnlockGateHelper(): ReturnType<typeof createIrisUnlockGate> {
  let gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
  gate = stepIrisGate(gate, { kind: 'ABORT' });
  return gate;
}

test('12d-263: re-locking an unlocked session returns to IDLE; budget carries', () => {
  let gate = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
  gate = stepIrisGate(gate, { kind: 'CAPTURE', verdict: 'MATCH' });
  gate = stepIrisGate(gate, { kind: 'LOCK' });
  assert.equal(gate.phase, 'IDLE');
  assert.equal(gate.cameraActive, false);
  // A re-locked session still has its full budget (nothing failed).
  gate = stepIrisGate(gate, { kind: 'GESTURE' });
  assert.equal(gate.phase, 'CAPTURING');
  INVARIANT(gate, 'relock');
});

test('12d-263: illegal transitions fail closed — gestures mid-capture, captures while idle, resets while unlocked', () => {
  const capturing = stepIrisGate(createIrisUnlockGate(), { kind: 'GESTURE' });
  const gesturedTwice = stepIrisGate(capturing, { kind: 'GESTURE' });
  assert.equal(gesturedTwice.phase, 'LOCKED', 'a second gesture during capture locks');
  assert.equal(gesturedTwice.cameraActive, false);

  const idle = createIrisUnlockGate();
  assert.equal(stepIrisGate(idle, { kind: 'TIMEOUT' }).phase, 'LOCKED');
  assert.equal(stepIrisGate(idle, { kind: 'ABORT' }).phase, 'LOCKED');
  assert.equal(stepIrisGate(idle, { kind: 'RESET' }).phase, 'LOCKED');
  assert.equal(stepIrisGate(idle, { kind: 'LOCK' }).phase, 'LOCKED');

  const unlocked = stepIrisGate(stepIrisGate(idle, { kind: 'GESTURE' }), { kind: 'CAPTURE', verdict: 'MATCH' });
  assert.equal(stepIrisGate(unlocked, { kind: 'RESET' }).phase, 'LOCKED');
  assert.equal(stepIrisGate(unlocked, { kind: 'GESTURE' }).phase, 'LOCKED');
});

test('12d-263: a forged or stale gate state refuses (fail closed on the state itself)', () => {
  const legit = createIrisUnlockGate();
  for (const bad of [
    null, undefined, 42, 'IDLE', [], {},
    { ...legit, attemptsUsed: -1 },
    { ...legit, attemptsUsed: 99 },
    { ...legit, policyVersion: '12d-999-v1' },
    { ...legit, extra: 'smuggled' },
    // Camera-on while IDLE: the invariant-carrying state itself is impossible.
    { ...legit, cameraActive: true },
  ]) {
    assert.throws(
      () => stepIrisGate(bad as IrisGateState, { kind: 'GESTURE' }),
      /gate state is required/,
    );
  }
  assert.throws(() => stepIrisGate(legit, null as never), /event object is required/);
});

test('12d-263: unknown event kinds fail closed to LOCKED', () => {
  const gate = createIrisUnlockGate();
  const stepped = stepIrisGate(gate, { kind: 'WIPE_TEMPLATES' } as never);
  assert.equal(stepped.phase, 'LOCKED');
  assert.equal(stepped.cameraActive, false);
  INVARIANT(stepped, 'unknown-event');
});

test('12d-263: policy pins — declared not proven, and the guardrails stay honest', () => {
  assert.equal(IRIS_UNLOCK_GATE_POLICY.policyVersion, '12d-263-v1');
  assert.equal(IRIS_UNLOCK_GATE_POLICY.domain, 'XIV_OS_IRIS_UNLOCK_GATE');
  assert.equal(IRIS_UNLOCK_GATE_POLICY.biometricCapability, 'DECLARED_NOT_PROVEN');
  assert.equal(IRIS_UNLOCK_GATE_POLICY.maxAttemptsPerSession, 3);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.modelCalls, 0);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.remoteCalls, 0);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.activeGestureOnly, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.cameraOffAfterVerdict, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.failClosedToLocked, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.biometricsUnlockCustodyDecides, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.templatesLocalOnly, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.declaredNotProven, true);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.learningPromoted, false);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.billionUsersProven, false);
  assert.equal(IRIS_UNLOCK_GATE_GUARDRAILS.automaticRecovery, false);
});