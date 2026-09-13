import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { enrollDevice } from './device-fleet-enrollment';
import { verifyCompatibility, TARGET_MATRIX } from './universal-device-compatibility';
import { issueWorkerObservationReceipt, effectiveCapability, withVerifiedCompatibility, DEVICE_RECEIPT_GUARDRAILS, DEVICE_RECEIPT_POLICY } from './device-worker-receipt';

const verifiedRecord = () => withVerifiedCompatibility(enrolled(), verifyCompatibility(TARGET_MATRIX.find(p => p.deviceFamily === 'PHONE' && p.osFamily === 'ANDROID' && p.cpuFamily === 'ARM64')!, ['lab:android']));

const tenantId = 'ladder-tenant', userId = 'user-a', deviceId = 'phone-a';
const now = 1_800_000_000_000;
const observation = () => ({
  tenantId, userId, deviceId, observedAtMs: now, workerRunRef: 'shift:device-run:1',
  outputHashes: ['a'.repeat(64)], health: {
    batteryPercent: 80, thermalState: 'NOMINAL' as const, networkAvailable: false, localModelAvailable: true,
  },
  attestationRefs: ['attest:operator:1', 'attest:telemetry:1'],
});
const enrolled = () => enrollDevice({
  tenantId, userId, deviceId, deviceFamily: 'PHONE' as const, osFamily: 'ANDROID' as const, cpuFamily: 'ARM64' as const,
  requestedSurfaces: ['REACT_NATIVE'] as const, purposes: ['LOCAL_ASSISTANCE'] as const, consentRefs: ['consent:user-a:1'],
  enrolledAtMs: now, expiresAtMs: now + 86_400_000, computeSharingOptIn: false, backgroundWorkOptIn: false,
});

test('an observation receipt is evidence-bound and starts no worker', () => {
  const r = issueWorkerObservationReceipt(observation());
  assert.equal(r.kind, 'DEVICE_WORKER_OBSERVATION_RECEIPT');
  assert.equal(r.capabilityAtObservation, 'OBSERVED_LOCAL_WORKER');
  assert.equal(r.expiresAtMs, now + DEVICE_RECEIPT_POLICY.maxObservedReceiptAgeMs);
  assert.equal(r.humanDecision, 'REQUIRED');
  assert.equal(r.learningPromoted, false);
  assert.equal(DEVICE_RECEIPT_GUARDRAILS.startsNoWorker, true);
  assert.equal(DEVICE_RECEIPT_GUARDRAILS.conflatesTargetedWithObserved, false);
});

test('observations without run evidence, hashes, attestations, or bounded health are rejected', () => {
  assert.throws(() => issueWorkerObservationReceipt({ ...observation(), workerRunRef: '' }), /run evidence/);
  assert.throws(() => issueWorkerObservationReceipt({ ...observation(), outputHashes: [] }), /output hashes/);
  assert.throws(() => issueWorkerObservationReceipt({ ...observation(), outputHashes: ['deadbeef'] }), /output hashes/);
  assert.throws(() => issueWorkerObservationReceipt({ ...observation(), attestationRefs: ['same', 'same'] }), /attestation/);
  assert.throws(() => issueWorkerObservationReceipt({ ...observation(), health: { ...observation().health, batteryPercent: 101 } }), /health/);
});

test('the ladder keeps targeted, enrolled, verified, and observed strictly distinct', () => {
  const unverified = enrolled();
  assert.deepEqual(effectiveCapability({ record: unverified, nowMs: now + 1 }), {
    level: 'TARGETED', reason: 'compatibility targeted but not verified',
  });
  const verified = verifiedRecord();
  assert.equal(verified.state, 'ENROLLED_NOT_ACTIVE');
  assert.equal(effectiveCapability({ record: verified, nowMs: now + 1 }).level, 'VERIFIED');
  const receipt = issueWorkerObservationReceipt(observation());
  const observed = effectiveCapability({ record: verified, observation: receipt, nowMs: now + 1 });
  assert.equal(observed.level, 'OBSERVED_LOCAL_WORKER');
  assert.equal(observed.reason.includes('shift:device-run:1'), true);
});

test('an expired observation degrades honestly to VERIFIED, never to TARGETED', () => {
  const verified = verifiedRecord();
  const receipt = issueWorkerObservationReceipt(observation());
  const result = effectiveCapability({ record: verified, observation: receipt, nowMs: receipt.expiresAtMs });
  assert.equal(result.level, 'VERIFIED');
  assert.equal(result.reason.includes('expired'), true);
});

test('a receipt bound to a different tenant, user, or device fails closed', () => {
  const verified = verifiedRecord();
  const receipt = issueWorkerObservationReceipt({ ...observation(), userId: 'user-b' });
  assert.throws(() => effectiveCapability({ record: verified, observation: receipt, nowMs: now + 1 }), /does not match/);
});

test('revoked or expired enrollment collapses the ladder to TARGETED even with a fresh receipt', () => {
  const target = TARGET_MATRIX.find(p => p.deviceFamily === 'PHONE' && p.osFamily === 'ANDROID' && p.cpuFamily === 'ARM64')!;
  const verified = { ...enrolled(), compatibility: verifyCompatibility(target, ['lab:android']) };
  const receipt = issueWorkerObservationReceipt(observation());
  assert.equal(effectiveCapability({ record: { ...verified, state: 'REVOKED' as const }, observation: receipt, nowMs: now + 1 }).level, 'TARGETED');
  assert.equal(effectiveCapability({ record: { ...verified, state: 'EXPIRED' as const }, observation: receipt, nowMs: now + 1 }).level, 'TARGETED');
});