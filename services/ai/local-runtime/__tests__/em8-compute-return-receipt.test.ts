/**
 * 62L-EM8 — Compute Return Receipt tests.
 *
 * These tests MUST execute. Do not mark PASS without running.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EM8_CORE_FLOW,
  EM8_HONESTY_BANNER,
  EM8_LOCKS,
  NEXT_PHASE_EM9,
  assertEm8LocksIntact,
  attemptMutateFinalizedReceipt,
  classifyReceiptOrUnverified,
  createReceiptDraft,
  deriveDeviceHonesty,
  em8HonestySnapshot,
  em8SoftWireSnapshot,
  finalizeAndSignReceipt,
  isEvidenceStale,
  isFinalizedReceiptSealed,
  verifySignedReceipt,
  type OriginatingComputeRequest,
  type SignedComputeReturnReceipt,
} from '../compute-return-receipt';
import { evaluateHomeBaseReceiptIngest } from '../em8-home-base-ingest';
import { ingestComputeOutcomeToNeuralPathway } from '../em8-neural-pathway';

const SECRET = 'em8-test-secret-not-for-prod';

function baseOrigin(
  overrides: Partial<OriginatingComputeRequest> = {},
): OriginatingComputeRequest {
  return {
    requestId: 'req-1',
    agentId: 'agent-1',
    taskId: 'task-1',
    homeUniverseId: 'universe-xiv',
    tenantId: 'tenant-a',
    requestedDevice: 'NPU',
    highConsequence: false,
    ...overrides,
  };
}

function draftNpuToCpu(
  overrides: Partial<Parameters<typeof createReceiptDraft>[0]> = {},
) {
  const completedMs = Date.now();
  const startedAt = new Date(completedMs - 40).toISOString();
  const completedAt = new Date(completedMs).toISOString();
  return createReceiptDraft({
    requestId: 'req-1',
    agentId: 'agent-1',
    taskId: 'task-1',
    homeUniverseId: 'universe-xiv',
    tenantId: 'tenant-a',
    requestedDevice: 'NPU',
    actualDevice: 'CPU',
    nodeId: 'node-local-1',
    runtimeProvider: 'onnxruntime-cpu',
    model: { modelId: 'tiny-local', modelVersionOrHash: 'sha256:abc' },
    startedAt,
    completedAt,
    resultState: 'PASS',
    evidenceRefs: ['el8:ledger:1'],
    evidenceObservedAt: completedAt,
    evidenceMaxAgeMs: 3_600_000,
    ...overrides,
  });
}

function finalizeOk(
  draft = draftNpuToCpu(),
): SignedComputeReturnReceipt {
  const result = finalizeAndSignReceipt(draft, SECRET);
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error(result.reasons.join('; '));
  return result.receipt;
}

test('EM8 honesty banner, locks, L4 off, next EM9 recorded', () => {
  assert.match(EM8_HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(assertEm8LocksIntact(), true);
  assert.equal(EM8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM8_LOCKS.CPU_FALLBACK_EQ_NPU_VERIFIED, false);
  assert.equal(EM8_LOCKS.FINALIZED_RECEIPT_MUTATION_ALLOWED, false);
  assert.equal(EM8_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EM8_LOCKS.TIP_LAND, false);
  assert.match(NEXT_PHASE_EM9, /EM9/);
  assert.deepEqual(
    [...EM8_CORE_FLOW],
    [
      'COMPUTE_REQUEST',
      'RUNTIME_EXECUTION',
      'STRUCTURED_RETURN_RECEIPT',
      'FINALIZE_SIGN',
      'HOME_BASE_INGEST_GATE',
      'NEURAL_PATHWAY_REF',
    ],
  );
  const snap = em8HonestySnapshot();
  assert.equal(snap.l4AutonomyEnabled, false);
});

test('soft-wire EM1/EL8/EM3 present; EM4/EM5/EM6/EM7 presence informational', () => {
  const wire = em8SoftWireSnapshot();
  assert.equal(wire.em1HomeBase, 'PRESENT');
  assert.equal(wire.el8ModelLoadEvidence, 'PRESENT');
  assert.equal(wire.el9ResourceGovernor, 'PRESENT');
  assert.equal(wire.em3Registry, 'PRESENT');
  assert.equal(typeof wire.em4Envelope, 'string');
  assert.equal(typeof wire.em5AmdWindowsMl, 'string');
  assert.equal(typeof wire.em6NvidiaCandidate, 'string');
  assert.equal(typeof wire.em7DeviceNeutralRouter, 'string');
  assert.equal(wire.l4AutonomyEnabled, false);
  assert.match(wire.note, /Presence soft-wire/);
});

test('HARD: NPU requested + CPU actual → fallbackUsed=true, does NOT verify NPU', () => {
  const honesty = deriveDeviceHonesty('NPU', 'CPU');
  assert.equal(honesty.fallbackUsed, true);
  assert.equal(honesty.requestedHardwareVerified, false);
  assert.equal(honesty.failureClassHint, 'SILENT_FALLBACK_TO_CPU');

  const receipt = finalizeOk();
  assert.equal(receipt.payload.requestedDevice, 'NPU');
  assert.equal(receipt.payload.actualDevice, 'CPU');
  assert.equal(receipt.payload.fallbackUsed, true);
  assert.equal(receipt.payload.requestedHardwareVerified, false);
  assert.equal(receipt.payload.resultState, 'PASS');
  // CPU PASS is valid but does not verify NPU.
  assert.ok(
    receipt.payload.failureClass === 'SILENT_FALLBACK_TO_CPU' ||
      receipt.payload.fallbackUsed === true,
  );
});

test('HARD: matching devices → fallbackUsed=false, requested hardware verified', () => {
  const honesty = deriveDeviceHonesty('CPU', 'CPU');
  assert.equal(honesty.fallbackUsed, false);
  assert.equal(honesty.requestedHardwareVerified, true);

  const receipt = finalizeOk(
    draftNpuToCpu({
      requestedDevice: 'CPU',
      actualDevice: 'CPU',
      fallbackUsed: false,
      failureClass: 'NONE',
      runtimeProvider: 'onnxruntime-cpu',
    }),
  );
  assert.equal(receipt.payload.fallbackUsed, false);
  assert.equal(receipt.payload.requestedHardwareVerified, true);
});

test('receipt fields include required EM8 schema', () => {
  const receipt = finalizeOk();
  const p = receipt.payload;
  for (const key of [
    'requestId',
    'agentId',
    'taskId',
    'homeUniverseId',
    'tenantId',
    'requestedDevice',
    'actualDevice',
    'nodeId',
    'runtimeProvider',
    'startedAt',
    'completedAt',
    'latencyMs',
    'resourceUsage',
    'fallbackUsed',
    'resultState',
    'failureClass',
    'evidenceRefs',
  ] as const) {
    assert.ok(key in p, `missing ${key}`);
  }
  assert.ok(p.model.modelId);
  assert.ok(p.model.modelVersionOrHash);
  assert.ok(receipt.receiptSignature);
  assert.equal(receipt.algorithm, 'HMAC-SHA256');
  assert.equal(p.latencyMs, 40);
});

test('finalized receipts are immutable audit artifacts', () => {
  const receipt = finalizeOk();
  assert.equal(isFinalizedReceiptSealed(receipt), true);
  assert.equal(receipt.payload.lifecycle, 'FINALIZED');

  const attempt = attemptMutateFinalizedReceipt(receipt, {
    actualDevice: 'NPU',
    fallbackUsed: false,
  });
  assert.equal(attempt.allowed, false);
  assert.match(attempt.reason, /immutable/);
  // Original unchanged
  assert.equal(receipt.payload.actualDevice, 'CPU');
  assert.equal(receipt.payload.fallbackUsed, true);
});

test('no hidden chain-of-thought stored on receipts', () => {
  const draft = draftNpuToCpu();
  assert.equal(draft.hiddenChainOfThought, null);
  const dirty = {
    ...draft,
    hiddenChainOfThought: 'secret reasoning',
  } as unknown as ReturnType<typeof draftNpuToCpu>;
  const result = finalizeAndSignReceipt(dirty, SECRET);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.reasons.some((r) => /hiddenChainOfThought|CoT/i.test(r)));
  }
});

test('tenant / universe IDs must match originating request', () => {
  const receipt = finalizeOk();
  const badTenant = verifySignedReceipt(receipt, SECRET, baseOrigin({ tenantId: 'other' }));
  assert.equal(badTenant.ok, false);
  assert.ok(badTenant.reasons.some((r) => /tenantId/.test(r)));

  const badUniverse = verifySignedReceipt(
    receipt,
    SECRET,
    baseOrigin({ homeUniverseId: 'other-universe' }),
  );
  assert.equal(badUniverse.ok, false);
  assert.ok(badUniverse.reasons.some((r) => /homeUniverseId/.test(r)));
});

test('missing receipt → results UNVERIFIED', () => {
  const classified = classifyReceiptOrUnverified(null, SECRET, baseOrigin());
  assert.equal(classified.verificationStatus, 'UNVERIFIED');
  assert.equal(classified.requestedHardwareVerified, false);
  assert.ok(classified.reasons.some((r) => /UNVERIFIED/.test(r)));

  const ingest = evaluateHomeBaseReceiptIngest({
    receipt: null,
    secret: SECRET,
    origin: baseOrigin(),
  });
  assert.equal(ingest.accepted, false);
  assert.equal(ingest.verificationStatus, 'UNVERIFIED');
  assert.ok(ingest.reasons.some((r) => /no accept without valid signed receipt/i.test(r)));
});

test('malformed receipt → results UNVERIFIED', () => {
  const receipt = finalizeOk();
  const tampered: SignedComputeReturnReceipt = {
    ...receipt,
    receiptSignature: '00'.repeat(32),
  };
  const classified = classifyReceiptOrUnverified(tampered, SECRET, baseOrigin());
  assert.equal(classified.verificationStatus, 'UNVERIFIED');
  assert.equal(classified.requestedHardwareVerified, false);

  const ingest = evaluateHomeBaseReceiptIngest({
    receipt: tampered,
    secret: SECRET,
    origin: baseOrigin(),
  });
  assert.equal(ingest.accepted, false);
  assert.equal(ingest.verificationStatus, 'UNVERIFIED');
});

test('stale runtime evidence cannot promote hardware capability', () => {
  const old = '2026-09-01T00:00:00.000Z';
  const draft = draftNpuToCpu({
    requestedDevice: 'CPU',
    actualDevice: 'CPU',
    fallbackUsed: false,
    failureClass: 'NONE',
    evidenceObservedAt: old,
    evidenceMaxAgeMs: 1_000,
    completedAt: old,
    startedAt: '2026-09-01T00:00:00.000Z',
  });
  assert.equal(isEvidenceStale(draft, new Date('2026-09-09T12:00:00.000Z')), true);
  const result = finalizeAndSignReceipt(draft, SECRET, {
    now: new Date('2026-09-09T12:00:00.000Z'),
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.reasons.some((r) => /Stale runtime evidence/i.test(r)));
  }
});

test('Home Base ingest accepts valid signed receipt (EM1 soft-wire gate)', () => {
  const receipt = finalizeOk(
    draftNpuToCpu({
      requestedDevice: 'CPU',
      actualDevice: 'CPU',
      fallbackUsed: false,
      failureClass: 'NONE',
    }),
  );
  const ingest = evaluateHomeBaseReceiptIngest({
    receipt,
    secret: SECRET,
    origin: baseOrigin({ requestedDevice: 'CPU' }),
  });
  assert.equal(ingest.accepted, true);
  assert.equal(ingest.verificationStatus, 'VERIFIED_RECEIPT');
  assert.equal(ingest.softWireEm1Gate, true);
  assert.ok(ingest.receiptRef);
  assert.equal(ingest.requestedHardwareVerified, true);
});

test('Home Base ingest records NPU→CPU fallback honesty without verifying NPU', () => {
  const receipt = finalizeOk();
  const ingest = evaluateHomeBaseReceiptIngest({
    receipt,
    secret: SECRET,
    origin: baseOrigin(),
  });
  assert.equal(ingest.accepted, true);
  assert.equal(ingest.requestedHardwareVerified, false);
  assert.ok(ingest.reasons.some((r) => /Fallback honest/i.test(r)));
});

test('high-consequence PASS still requires human approval', () => {
  const receipt = finalizeOk(
    draftNpuToCpu({
      requestedDevice: 'CPU',
      actualDevice: 'CPU',
      fallbackUsed: false,
      failureClass: 'NONE',
      highConsequence: true,
      humanAuthorized: false,
    }),
  );
  const denied = evaluateHomeBaseReceiptIngest({
    receipt,
    secret: SECRET,
    origin: baseOrigin({ requestedDevice: 'CPU', highConsequence: true }),
  });
  assert.equal(denied.accepted, false);
  assert.equal(denied.requiresHumanApproval, true);
  assert.ok(denied.reasons.some((r) => /human approval/i.test(r)));

  const authorized = finalizeOk(
    draftNpuToCpu({
      requestedDevice: 'CPU',
      actualDevice: 'CPU',
      fallbackUsed: false,
      failureClass: 'NONE',
      highConsequence: true,
      humanAuthorized: true,
    }),
  );
  const ok = evaluateHomeBaseReceiptIngest({
    receipt: authorized,
    secret: SECRET,
    origin: baseOrigin({ requestedDevice: 'CPU', highConsequence: true }),
  });
  assert.equal(ok.accepted, true);
});

test('neural pathway ingestion preserves receipt reference', () => {
  const receipt = finalizeOk(
    draftNpuToCpu({
      requestedDevice: 'CPU',
      actualDevice: 'CPU',
      fallbackUsed: false,
      failureClass: 'NONE',
    }),
  );
  const ingest = evaluateHomeBaseReceiptIngest({
    receipt,
    secret: SECRET,
    origin: baseOrigin({ requestedDevice: 'CPU' }),
  });
  assert.equal(ingest.accepted, true);

  const pathway = ingestComputeOutcomeToNeuralPathway({
    pathwayId: 'pathway-pricing-1',
    receipt,
    ingest,
  });
  assert.equal(pathway.ok, true);
  if (!pathway.ok) throw new Error(pathway.reasons.join('; '));
  assert.equal(pathway.record.receiptRef, ingest.receiptRef);
  assert.equal(pathway.record.requestId, receipt.payload.requestId);
  assert.equal(pathway.record.verificationStatus, 'VERIFIED_RECEIPT');
});

test('neural pathway refuses UNVERIFIED ingest without receiptRef', () => {
  const ingest = evaluateHomeBaseReceiptIngest({
    receipt: null,
    secret: SECRET,
    origin: baseOrigin(),
  });
  const pathway = ingestComputeOutcomeToNeuralPathway({
    pathwayId: 'pathway-x',
    receipt: null,
    ingest,
  });
  assert.equal(pathway.ok, false);
  if (!pathway.ok) {
    assert.ok(pathway.reasons.some((r) => /receiptRef|UNVERIFIED/i.test(r)));
  }
});

test('result states cover EM8 vocabulary', () => {
  const states = [
    'PASS',
    'FAIL',
    'PARTIAL',
    'DEGRADED',
    'TIMEOUT',
    'RESOURCE_LIMIT',
    'PROVIDER_UNAVAILABLE',
    'POLICY_DENIED',
  ] as const;
  for (const resultState of states) {
    const receipt = finalizeOk(
      draftNpuToCpu({
        requestedDevice: 'CPU',
        actualDevice: 'CPU',
        fallbackUsed: false,
        failureClass: 'NONE',
        resultState,
      }),
    );
    assert.equal(receipt.payload.resultState, resultState);
  }
});

test('draft with mismatched fallbackUsed flag is rejected at finalize', () => {
  const draft = draftNpuToCpu({ fallbackUsed: false });
  // createReceiptDraft auto-corrects from devices; force a bad draft:
  const bad = { ...draft, fallbackUsed: false, requestedDevice: 'NPU' as const, actualDevice: 'CPU' as const };
  const result = finalizeAndSignReceipt(bad, SECRET);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.reasons.some((r) => /fallbackUsed/.test(r)));
  }
});
