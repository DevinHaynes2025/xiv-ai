/**
 * 62L-EQ13 — Architecture Return Receipt denial + honesty tests.
 *
 * Script: npm run test:62leq13
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ARCHITECTURE_RECEIPT_FIELDS,
  ARCHITECTURE_RECEIPT_HOME_BASE_FLOW,
  ARCHITECTURE_RECEIPT_STATES,
  ARCHITECTURE_RETURN_RECEIPT_CYCLE,
  EQ13_AGENT_BOUNDS,
  EQ13_DB_CANDIDATES_STATUS,
  EQ13_LOCKS,
  EQ13_MAY,
  EQ13_MUST_NOT,
  FALLBACK_TRUTH_EXAMPLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RECEIPT_UNVERIFIED_REASONS,
  assertEq13LocksIntact,
  eq13SoftWireSnapshot,
  fallbackVerifiesRequestedRoute,
  requestedMustEqualActual,
  type Eq13Actor,
} from './architecture-return-receipt-types.ts';

import {
  attemptAcceptInconsistentEnvelope,
  attemptAcceptMalformedReceipt,
  attemptAcceptMissingReceiptAsVerified,
  attemptAcceptStaleReceipt,
  attemptRecommendAsAct,
  attemptRequireRequestedEqActual,
  attemptStoreHiddenChainOfThought,
  attemptVerifyRequestedRouteOnFallback,
  bootstrapArchitectureReturnReceipt,
  emitArchitectureReturnReceipt,
  exampleArmNpuFallbackReceipt,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq13EvidenceToHomeBase,
  routesVerifiedByReceipt,
  runArchitectureReturnReceiptCycle,
  validateReceiptAtHomeBase,
} from './architecture-return-receipt-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq13Actor = {
  kind: 'receipt_emitter',
  id: 're-1',
  orgId: 'org-eq13',
  tenantId: 'ten-eq13',
  universeId: 'uni-eq13',
  permissions: ['draft'],
};

const human: Eq13Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq13',
  tenantId: 'ten-eq13',
  universeId: 'uni-eq13',
  permissions: ['approve_consequential'],
};

test('SoT label EQ13 / #161; GitLab mirror not invented; next EQ14', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ13');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Architecture Return Receipt/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ14/);
  assert.match(NEXT_PHASE_TITLE, /Neural Pathway Architecture Graph/);
});

test('honesty locks: L4 false; requested≠actual allowed; no hidden CoT; DB NOT_APPLIED', () => {
  assert.equal(assertEq13LocksIntact(), true);
  assert.equal(EQ13_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ13_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ13_LOCKS.REQUIRE_REQUESTED_EQ_ACTUAL, false);
  assert.equal(EQ13_LOCKS.VERIFY_REQUESTED_ROUTE_ON_FALLBACK, false);
  assert.equal(EQ13_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT, false);
  assert.equal(EQ13_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ13_AGENT_BOUNDS.mayStoreHiddenChainOfThought, false);
  assert.equal(requestedMustEqualActual(), false);
  assert.equal(fallbackVerifiesRequestedRoute(), false);
});

test('receipt fields + states + home base flow + unverified reasons encoded', () => {
  assert.ok(ARCHITECTURE_RECEIPT_FIELDS.includes('receiptId'));
  assert.ok(ARCHITECTURE_RECEIPT_FIELDS.includes('requestedArchitecture'));
  assert.ok(ARCHITECTURE_RECEIPT_FIELDS.includes('actualArchitecture'));
  assert.ok(ARCHITECTURE_RECEIPT_FIELDS.includes('fallbackUsed'));
  assert.ok(ARCHITECTURE_RECEIPT_FIELDS.includes('receiptHashSignature'));
  assert.ok(ARCHITECTURE_RECEIPT_STATES.includes('PASS'));
  assert.ok(ARCHITECTURE_RECEIPT_STATES.includes('UNVERIFIED'));
  assert.ok(ARCHITECTURE_RECEIPT_STATES.includes('MODEL_LOAD_FAILED'));
  assert.deepEqual([...ARCHITECTURE_RECEIPT_HOME_BASE_FLOW], [
    'execution',
    'receipt',
    'validation',
    'audit',
    'benchmark_matrix',
    'architecture_capability_graph',
    'neural_pathway_update',
  ]);
  assert.deepEqual([...RECEIPT_UNVERIFIED_REASONS], [
    'missing',
    'stale',
    'malformed',
    'inconsistent_with_task_envelope',
  ]);
  assert.ok(EQ13_MAY.includes('allow_requested_architecture_to_differ_from_actual'));
  assert.ok(
    EQ13_MUST_NOT.includes('treat_fallback_receipt_as_verification_of_requested_route'),
  );
});

test('ARM_NPU→ARM_CPU fallback verifies CPU only, not NPU', () => {
  const { envelope, receipt } = exampleArmNpuFallbackReceipt(agent);
  assert.equal(
    receipt.requestedArchitecture,
    FALLBACK_TRUTH_EXAMPLE.requestedArchitecture,
  );
  assert.equal(
    receipt.actualArchitecture,
    FALLBACK_TRUTH_EXAMPLE.actualArchitecture,
  );
  assert.equal(receipt.fallbackUsed, true);
  assert.equal(receipt.hiddenChainOfThoughtPresent, false);

  const routes = routesVerifiedByReceipt(receipt);
  assert.equal(routes.requestedVerified, false);
  assert.equal(routes.actualVerified, true);
  assert.equal(FALLBACK_TRUTH_EXAMPLE.verifiesNpuRoute, false);
  assert.equal(FALLBACK_TRUTH_EXAMPLE.verifiesCpuRoute, true);

  assert.equal(attemptRequireRequestedEqActual().state, 'DENIED');
  assert.equal(attemptVerifyRequestedRouteOnFallback().state, 'DENIED');
  assert.equal(
    emitArchitectureReturnReceipt({
      actor: agent,
      receiptId: 'bad',
      envelope,
      selectedArchitecture: 'ARM_NPU',
      actualArchitecture: 'ARM_CPU',
      deviceId: 'd',
      vendor: 'arm',
      runtimeProvider: 'rt',
      modelId: 'm',
      modelVersionHash: 'h',
      precision: 'fp16',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      latencyMs: 1,
      throughput: 1,
      memoryUsed: 1,
      resourceState: 'ok',
      fallbackUsed: true,
      attemptRequireRequestedEqActual: true,
    }).state,
    'DENIED',
  );

  const ok = validateReceiptAtHomeBase({ receipt, envelope });
  assert.equal(ok.valid, true);
});

test('missing/stale/malformed/inconsistent → UNVERIFIED', () => {
  const { envelope, receipt } = exampleArmNpuFallbackReceipt(agent);

  assert.equal(attemptAcceptMissingReceiptAsVerified().state, 'DENIED');
  assert.equal(attemptAcceptMalformedReceipt().state, 'DENIED');
  assert.equal(attemptAcceptStaleReceipt().state, 'DENIED');
  assert.equal(attemptAcceptInconsistentEnvelope().state, 'DENIED');

  assert.equal(
    validateReceiptAtHomeBase({ receipt: null, envelope }).resultState,
    'UNVERIFIED',
  );
  assert.equal(
    validateReceiptAtHomeBase({
      receipt: { ...receipt, receiptHashSignature: '' },
      envelope,
    }).unverifiedReason,
    'malformed',
  );
  assert.equal(
    validateReceiptAtHomeBase({
      receipt: { ...receipt, taskId: 'other' },
      envelope,
    }).unverifiedReason,
    'inconsistent_with_task_envelope',
  );
  assert.equal(
    validateReceiptAtHomeBase({
      receipt: {
        ...receipt,
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      envelope,
      maxAgeMs: 1000,
    }).unverifiedReason,
    'stale',
  );
});

test('no hidden chain-of-thought; deny store CoT', () => {
  assert.equal(attemptStoreHiddenChainOfThought().state, 'DENIED');
  const { envelope } = exampleArmNpuFallbackReceipt(agent);
  assert.equal(
    emitArchitectureReturnReceipt({
      actor: agent,
      receiptId: 'cot-bad',
      envelope,
      selectedArchitecture: 'ARM_CPU',
      actualArchitecture: 'ARM_CPU',
      deviceId: 'd',
      vendor: 'arm',
      runtimeProvider: 'rt',
      modelId: 'm',
      modelVersionHash: 'h',
      precision: 'fp16',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      latencyMs: 1,
      throughput: 1,
      memoryUsed: 1,
      resourceState: 'ok',
      fallbackUsed: false,
      attemptIncludeHiddenCot: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapArchitectureReturnReceipt(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.receiptFields.length, ARCHITECTURE_RECEIPT_FIELDS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq13SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq12CrossArchitectureBenchmarkMatrix.present, true);
  assert.equal(soft.eq11DeviceNeutralWorkloadGenome.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq13EvidenceToHomeBase({
    evidenceId: 'ev-eq13-1',
    actor: agent,
    summary: 'architecture receipt advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(ev.hiddenChainOfThoughtPresent, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runArchitectureReturnReceiptCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ARCHITECTURE_RETURN_RECEIPT_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ARCHITECTURE_RETURN_RECEIPT_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.fallbackUsed, true);
  assert.equal(cycle.validation.valid, true);
});
