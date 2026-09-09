/**
 * 62L-EP13 — Runtime Return Receipt denial + honesty tests.
 *
 * Script: npm run test:62lep13
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  DEVICE_CLASSES,
  EP13_DB_CANDIDATES_STATUS,
  EP13_LOCKS,
  EP13_MAY,
  EP13_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RECEIPT_AGENT_BOUNDS,
  RECEIPT_FIELDS,
  RECEIPT_HOME_BASE_FLOW,
  RECEIPT_RESULT_STATES,
  RUNTIME_RETURN_RECEIPT_CYCLE,
  assertEp13LocksIntact,
  ep13SoftWireSnapshot,
  fallbackVerifiesAccelerator,
  isAcceleratorFallback,
  type Ep13Actor,
} from './runtime-return-receipt-types.ts';

import {
  attemptCrossTenantReuse,
  attemptIncludeHiddenCot,
  attemptIncludeSecrets,
  attemptMutateFinalizedReceipt,
  attemptRecommendAsAct,
  attemptRewritePolicyFailAsPass,
  attemptSilentAcceptMissingReceipt,
  attemptSkipHumanForHighConsequence,
  attemptVerifyAcceleratorViaFallback,
  bootstrapRuntimeReturnReceipt,
  emitComputeReceipt,
  exampleOrigin,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnReceiptEvidenceToHomeBase,
  runRuntimeReturnReceiptCycle,
  validateReceiptAtHomeBase,
} from './runtime-return-receipt-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep13Actor = {
  kind: 'runtime_receipt',
  id: 'rcpt-agent-1',
  orgId: 'org-ep13',
  tenantId: 'ten-ep13',
  universeId: 'uni-ep13',
  permissions: ['draft'],
};

const human: Ep13Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep13',
  tenantId: 'ten-ep13',
  universeId: 'uni-ep13',
  permissions: ['approve_consequential'],
};

test('SoT label EP13 / #160; GitLab mirror not invented; next EP14', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP13');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Runtime Return Receipt/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP14/);
  assert.match(NEXT_PHASE_TITLE, /Adaptive Benchmark Ledger/);
});

test('honesty locks: L4 false; fallback ≠ accelerator verify; DB NOT_APPLIED', () => {
  assert.equal(assertEp13LocksIntact(), true);
  assert.equal(EP13_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP13_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP13_LOCKS.FALLBACK_VERIFIES_ACCELERATOR, false);
  assert.equal(EP13_LOCKS.MISSING_RECEIPT_SILENT_ACCEPT, false);
  assert.equal(EP13_LOCKS.REQUESTED_EQ_ACTUAL_IMPLIED, false);
  assert.equal(EP13_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(RECEIPT_AGENT_BOUNDS.mayIncludeSecrets, false);
  assert.equal(RECEIPT_AGENT_BOUNDS.mayMutateFinalizedReceipt, false);
});

test('home base flow + receipt fields + result states encoded', () => {
  assert.deepEqual([...RECEIPT_HOME_BASE_FLOW], [
    'receipt',
    'validation',
    'audit',
    'benchmark_memory',
    'neural_compute_graph',
    'agent_result',
  ]);
  assert.ok(RECEIPT_FIELDS.includes('requestedDeviceClass'));
  assert.ok(RECEIPT_FIELDS.includes('actualDevice'));
  assert.ok(RECEIPT_FIELDS.includes('receiptSignatureHash'));
  assert.ok(RECEIPT_RESULT_STATES.includes('PASS'));
  assert.ok(RECEIPT_RESULT_STATES.includes('UNVERIFIED'));
  assert.ok(RECEIPT_RESULT_STATES.includes('POLICY_DENIED'));
  assert.ok(DEVICE_CLASSES.includes('npu'));
  assert.ok(EP13_MAY.includes('record_requested_and_actual_separately'));
  assert.ok(EP13_MUST_NOT.includes('verify_accelerator_via_cpu_fallback'));
});

test('requested vs actual separate; NPU→CPU fallback does not verify NPU', () => {
  const origin = exampleOrigin({ requestedDeviceClass: 'npu' });
  const receipt = emitComputeReceipt({
    actor: agent,
    receiptId: 'rcpt-fb-1',
    origin,
    actualDevice: 'cpu',
    vendor: 'ExampleVendor',
    runtimeProvider: 'onnx-cpu',
    modelVersionHash: 'mv-1',
    precision: 'fp32',
    startedAt: '2026-09-09T12:00:00.000Z',
    completedAt: '2026-09-09T12:00:01.000Z',
    latencyMs: 1000,
    memoryUsed: '512MB',
    resourceState: 'fallback',
    resultState: 'PASS',
    fallbackReason: 'npu_unavailable_cpu_fallback',
  });
  assert.ok(!('denied' in receipt));
  assert.equal(receipt.requestedDeviceClass, 'npu');
  assert.equal(receipt.actualDevice, 'cpu');
  assert.equal(receipt.fallbackUsed, true);
  assert.equal(receipt.acceleratorVerifiedByThisReceipt, false);
  assert.equal(
    isAcceleratorFallback({
      requestedDeviceClass: 'npu',
      actualDevice: 'cpu',
    }),
    true,
  );
  assert.equal(
    fallbackVerifiesAccelerator({
      requestedDeviceClass: 'npu',
      actualDevice: 'cpu',
      fallbackUsed: true,
    }),
    false,
  );
  assert.equal(attemptVerifyAcceleratorViaFallback().state, 'DENIED');
  assert.match(receipt.receiptSignatureHash, /^[a-f0-9]{32}$/);
});

test('missing / malformed / stale / inconsistent → UNVERIFIED (not silent accept)', () => {
  const origin = exampleOrigin();
  const missing = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-missing',
    origin,
    receipt: null,
  });
  assert.ok(!('denied' in missing));
  assert.equal(missing.classification, 'UNVERIFIED');

  const good = emitComputeReceipt({
    actor: agent,
    receiptId: 'rcpt-ok',
    origin,
    actualDevice: 'npu',
    vendor: 'v',
    runtimeProvider: 'r',
    modelVersionHash: 'h',
    precision: 'fp16',
    startedAt: '2026-09-09T12:00:00.000Z',
    completedAt: '2026-09-09T12:00:00.010Z',
    latencyMs: 10,
    memoryUsed: '256MB',
    resourceState: 'ok',
    resultState: 'PASS',
  });
  assert.ok(!('denied' in good));

  const malformed = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-mal',
    origin,
    receipt: good,
    malformed: true,
  });
  assert.ok(!('denied' in malformed));
  assert.equal(malformed.classification, 'UNVERIFIED');

  const stale = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-stale',
    origin,
    receipt: good,
    stale: true,
  });
  assert.ok(!('denied' in stale));
  assert.equal(stale.classification, 'UNVERIFIED');

  const inconsistent = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-inc',
    origin,
    receipt: { ...good, tenantId: 'other-tenant' },
  });
  assert.ok(!('denied' in inconsistent));
  assert.equal(inconsistent.classification, 'UNVERIFIED');

  assert.equal(attemptSilentAcceptMissingReceipt().state, 'DENIED');
  assert.equal(
    validateReceiptAtHomeBase({
      actor: agent,
      validationId: 'v-silent',
      origin,
      receipt: null,
      attemptSilentAcceptMissing: true,
    }).state,
    'DENIED',
  );
});

test('secrets, CoT, cross-tenant, policy rewrite, append-only denied', () => {
  const origin = exampleOrigin();
  assert.equal(
    emitComputeReceipt({
      actor: agent,
      receiptId: 'rcpt-sec',
      origin,
      actualDevice: 'cpu',
      vendor: 'v',
      runtimeProvider: 'r',
      modelVersionHash: 'h',
      precision: 'fp32',
      startedAt: '2026-09-09T12:00:00.000Z',
      completedAt: '2026-09-09T12:00:00.001Z',
      latencyMs: 1,
      memoryUsed: '1MB',
      resourceState: 'ok',
      resultState: 'PASS',
      attemptIncludeSecrets: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptIncludeSecrets().state, 'DENIED');
  assert.equal(attemptIncludeHiddenCot().state, 'DENIED');
  assert.equal(attemptCrossTenantReuse().state, 'DENIED');
  assert.equal(attemptMutateFinalizedReceipt().state, 'DENIED');
  assert.equal(attemptRewritePolicyFailAsPass().state, 'DENIED');
  assert.equal(
    emitComputeReceipt({
      actor: agent,
      receiptId: 'rcpt-pol',
      origin,
      actualDevice: 'cpu',
      vendor: 'v',
      runtimeProvider: 'r',
      modelVersionHash: 'h',
      precision: 'fp32',
      startedAt: '2026-09-09T12:00:00.000Z',
      completedAt: '2026-09-09T12:00:00.001Z',
      latencyMs: 1,
      memoryUsed: '1MB',
      resourceState: 'denied',
      resultState: 'POLICY_DENIED',
      attemptRewritePolicyFailAsPass: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    validateReceiptAtHomeBase({
      actor: agent,
      validationId: 'v-mut',
      origin,
      receipt: null,
      attemptMutateFinalized: true,
    }).state,
    'DENIED',
  );
});

test('high-consequence PASS still requires human authorization', () => {
  const origin = exampleOrigin({ highConsequence: true });
  const receipt = emitComputeReceipt({
    actor: agent,
    receiptId: 'rcpt-high',
    origin,
    actualDevice: 'npu',
    vendor: 'v',
    runtimeProvider: 'r',
    modelVersionHash: 'h',
    precision: 'fp16',
    startedAt: '2026-09-09T12:00:00.000Z',
    completedAt: '2026-09-09T12:00:00.010Z',
    latencyMs: 10,
    memoryUsed: '512MB',
    resourceState: 'ok',
    resultState: 'PASS',
  });
  assert.ok(!('denied' in receipt));

  assert.equal(attemptSkipHumanForHighConsequence().state, 'DENIED');
  assert.equal(
    validateReceiptAtHomeBase({
      actor: agent,
      validationId: 'v-skip',
      origin,
      receipt,
      attemptSkipHumanForHighConsequence: true,
    }).state,
    'DENIED',
  );

  const awaiting = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-await',
    origin,
    receipt,
    humanAuthorized: false,
  });
  assert.ok(!('denied' in awaiting));
  assert.equal(awaiting.classification, 'VALIDATED');
  assert.equal(awaiting.agentResultReleased, false);
  assert.equal(awaiting.humanAuthRequired, true);

  const released = validateReceiptAtHomeBase({
    actor: agent,
    validationId: 'v-auth',
    origin,
    receipt,
    humanAuthorized: true,
  });
  assert.ok(!('denied' in released));
  assert.equal(released.agentResultReleased, true);
});

test('bootstrap + soft-wire + cycle; home base evidence; guardian unchanged', () => {
  const boot = bootstrapRuntimeReturnReceipt(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, RECEIPT_FIELDS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 160);

  const soft = ep13SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep12Scheduler.present, true);
  assert.equal(soft.ep10OtherAcceleratorRegistry.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const ev = returnReceiptEvidenceToHomeBase({
    evidenceId: 'ev-ep13-1',
    actor: agent,
    summary: 'receipt advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runRuntimeReturnReceiptCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, RUNTIME_RETURN_RECEIPT_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of RUNTIME_RETURN_RECEIPT_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.fallbackReceipt));
  assert.equal(cycle.fallbackReceipt.fallbackUsed, true);
  assert.equal(cycle.fallbackReceipt.acceleratorVerifiedByThisReceipt, false);
});
