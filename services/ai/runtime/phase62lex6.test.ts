/**
 * 62L-EX6 — Physical QPU Execution Receipt required honesty tests.
 * Script: npm run test:62lex6
 * Parent: 62L-EX / GitHub #170
 *
 * No unit/mock evidence equals real physical QPU. Unrun ≠ PASS.
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyReputationDelta,
  assertEx6LocksIntact,
  createComparisonReceipt,
  createPhysicalQpuReceipt,
  evaluateSyntheticContractReceipt,
  ex6L4AutonomyEnabled,
  ex6SoftWireSnapshot,
  guardianRlsUnchangedByEx6,
  linkBaselineToReceipt,
  reconcilePhysicalQpuReceipt,
  recordNeuralPathway,
  receiptContainsRawCredentials,
  returnReceiptToHomeBase,
  summarizeSoftWires,
  verifyPhysicalQpuReceipt,
  verifyReceiptHash,
  EX6_LOCKS,
  type PhysicalQpuExecutionReceipt,
} from './quantum/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '../../..');

function baseInput(over: Partial<Parameters<typeof createPhysicalQpuReceipt>[0]> = {}) {
  return {
    receiptId: 'rcpt-ex6-1',
    missionId: 'msn-1',
    taskId: 'tsk-1',
    parentTaskId: 'parent-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    agentId: 'agent-hw-1',
    providerId: 'prov-ibm-candidate',
    backendId: 'backend-ibm-q-fake',
    requestedExecutionClass: 'PHYSICAL_QPU' as const,
    backendClassification: 'PHYSICAL_QPU' as const,
    evidenceEnvironment: 'UNIT_TEST' as const,
    ...over,
  };
}

function nearlyCompletePhysical(
  over: Partial<Parameters<typeof createPhysicalQpuReceipt>[0]> = {},
) {
  return baseInput({
    evidenceEnvironment: 'PHYSICAL_PROVIDER',
    providerJobId: 'job-abc-123',
    submittedAt: '2026-09-09T10:00:00.000Z',
    acceptedAt: '2026-09-09T10:00:01.000Z',
    startedAt: '2026-09-09T10:01:00.000Z',
    completedAt: '2026-09-09T10:05:00.000Z',
    durationMs: 240000,
    resultHash: 'resulthash-sha256-deadbeef',
    auditEvidenceRef: 'audit://ex6/job-abc-123',
    evidenceRefs: ['ev://provider-result'],
    providerAuthorized: true,
    jobAccepted: true,
    jobCompleted: true,
    providerResultReturned: true,
    backendIdentityConfirmed: true,
    physicalQpuState: 'CONNECTED_UNVERIFIED',
    algorithmHash: 'alg-1',
    circuitHash: 'circ-1',
    problemHash: 'prob-1',
    shots: 1024,
    seed: 42,
    precision: 'FLOAT64',
    costState: 'REPORTED',
    costAmount: 1.25,
    costCurrency: 'USD',
    costEvidenceRef: 'cost://inv-1',
    ...over,
  });
}

// --- 1. simulator receipt cannot become PHYSICAL_QPU_VERIFIED ---
{
  const created = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      backendClassification: 'SIMULATOR',
      evidenceEnvironment: 'LOCAL_SIMULATION',
      backendId: 'local-statevector',
    }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  assert.equal(created.receipt.actualExecutionClass, 'SIMULATED_QUANTUM');
  const v = verifyPhysicalQpuReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.notEqual(v.verificationState, 'PHYSICAL_QPU_VERIFIED');
  assert.ok(v.reasons.some((r) => /SIMULATOR/i.test(r)));
  console.log('PASS: 1 simulator receipt cannot become PHYSICAL_QPU_VERIFIED');
}

// --- 2. mock provider cannot prove physical execution ---
{
  const created = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      mockProvider: true,
      receiptKind: 'MOCK',
      evidenceEnvironment: 'STAGING_PROVIDER',
    }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const v = verifyPhysicalQpuReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.ok(v.reasons.some((r) => /MOCK/i.test(r)));
  assert.ok(
    v.verificationState === 'COMPLETED_UNVERIFIED' ||
      v.verificationState === 'TEST_RECEIPT' ||
      v.verificationState === 'EVIDENCE_INCOMPLETE',
  );
  console.log('PASS: 2 mock provider cannot prove physical execution');
}

// --- 3. missing providerJobId → verification denied ---
{
  const created = createPhysicalQpuReceipt(
    nearlyCompletePhysical({ providerJobId: null }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const v = verifyPhysicalQpuReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.ok(v.reasons.includes('MISSING_PROVIDER_JOB_ID'));
  console.log('PASS: 3 missing providerJobId → verification denied');
}

// --- 4. missing backend identity → verification denied ---
{
  const created = createPhysicalQpuReceipt(
    nearlyCompletePhysical({ backendIdentityConfirmed: false }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const v = verifyPhysicalQpuReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.ok(v.reasons.includes('MISSING_BACKEND_IDENTITY'));
  console.log('PASS: 4 missing backend identity → verification denied');
}

// --- 5. missing result → verification denied ---
{
  const created = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      resultHash: null,
      providerResultReturned: false,
      measurements: null,
    }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const v = verifyPhysicalQpuReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.ok(
    v.reasons.includes('MISSING_RESULT_HASH') ||
      v.reasons.includes('MISSING_PROVIDER_RESULT'),
  );
  console.log('PASS: 5 missing result → verification denied');
}

// --- 6. invalid receipt hash → verification denied ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const tampered: PhysicalQpuExecutionReceipt = {
    ...created.receipt,
    receiptHash: '0'.repeat(64),
  };
  assert.equal(verifyReceiptHash(tampered), false);
  const v = verifyPhysicalQpuReceipt(tampered);
  assert.equal(v.physicalQpuVerified, false);
  assert.ok(v.reasons.includes('INVALID_RECEIPT_HASH'));
  console.log('PASS: 6 invalid receipt hash → verification denied');
}

// --- 7. valid synthetic contract logic → COMPLETED_UNVERIFIED only ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const v = evaluateSyntheticContractReceipt(created.receipt);
  assert.equal(v.physicalQpuVerified, false);
  assert.equal(v.verificationState, 'COMPLETED_UNVERIFIED');
  assert.equal(v.quantumAdvantageVerified, false);
  console.log('PASS: 7 valid synthetic contract logic → COMPLETED_UNVERIFIED only');
}

// --- 8. offline new physical request → WAITING_PROVIDER ---
{
  const created = createPhysicalQpuReceipt(
    baseInput({
      offlineDisconnected: true,
      physicalProviderAvailable: false,
      evidenceEnvironment: 'PHYSICAL_PROVIDER',
      backendClassification: 'PHYSICAL_QPU',
    }),
  );
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  assert.equal(created.receipt.verificationState, 'WAITING_PROVIDER');
  assert.equal(created.receipt.physicalQpuState, 'NOT_TESTED');
  assert.equal(created.receipt.physicalQpuVerified, false);
  const recon = reconcilePhysicalQpuReceipt({
    receipt: created.receipt,
    actor: { tenantId: 'tenant-a', universeId: 'universe-a' },
    nowIso: '2026-09-09T12:00:00.000Z',
    offlineDisconnected: true,
    physicalProviderAvailable: false,
  });
  assert.equal(recon.verificationState, 'WAITING_PROVIDER');
  console.log('PASS: 8 offline new physical request → WAITING_PROVIDER');
}

// --- 9. stale provider evidence → STALE ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const recon = reconcilePhysicalQpuReceipt({
    receipt: created.receipt,
    actor: { tenantId: 'tenant-a', universeId: 'universe-a' },
    nowIso: '2026-09-12T12:00:00.000Z',
    evidenceMaxAgeMs: 60_000,
    providerEvidenceObservedAt: '2026-09-09T10:05:00.000Z',
  });
  assert.equal(recon.verificationState, 'STALE');
  assert.equal(recon.receipt.physicalQpuVerified, false);
  console.log('PASS: 9 stale provider evidence → STALE');
}

// --- 10. failed physical job produces failure receipt ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const recon = reconcilePhysicalQpuReceipt({
    receipt: created.receipt,
    actor: { tenantId: 'tenant-a', universeId: 'universe-a' },
    nowIso: '2026-09-09T12:00:00.000Z',
    providerJobFailed: true,
    providerFailureReason: 'PROVIDER_BACKEND_ERROR',
  });
  assert.equal(recon.verificationState, 'FAILED');
  assert.equal(recon.receipt.receiptKind, 'FAILURE');
  assert.equal(recon.receipt.physicalQpuVerified, false);
  console.log('PASS: 10 failed physical job produces failure receipt');
}

// --- 11. cross-tenant receipt DENIED ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const recon = reconcilePhysicalQpuReceipt({
    receipt: created.receipt,
    actor: { tenantId: 'tenant-OTHER', universeId: 'universe-a' },
    nowIso: '2026-09-09T12:00:00.000Z',
  });
  assert.equal(recon.verificationState, 'DENIED');
  assert.ok(recon.reasons.includes('CROSS_TENANT_RECEIPT_DENIED'));
  const home = returnReceiptToHomeBase(created.receipt, {
    tenantId: 'tenant-OTHER',
    universeId: 'universe-a',
  });
  assert.equal(home.accepted, false);
  console.log('PASS: 11 cross-tenant receipt DENIED');
}

// --- 12. cross-Universe receipt DENIED ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const recon = reconcilePhysicalQpuReceipt({
    receipt: created.receipt,
    actor: { tenantId: 'tenant-a', universeId: 'universe-OTHER' },
    nowIso: '2026-09-09T12:00:00.000Z',
  });
  assert.equal(recon.verificationState, 'DENIED');
  assert.ok(recon.reasons.includes('CROSS_UNIVERSE_RECEIPT_DENIED'));
  console.log('PASS: 12 cross-Universe receipt DENIED');
}

// --- 13. physical verification ≠ quantum advantage ---
{
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  const linked = linkBaselineToReceipt(
    created.receipt,
    {
      baselineReceiptId: 'base-1',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      algorithm: 'classical-greedy',
      problemHash: 'prob-1',
      runtimeMs: 5000,
      costUsd: 0.01,
      qualityScore: 0.9,
    },
    { tenantId: 'tenant-a', universeId: 'universe-a' },
  );
  assert.equal(linked.ok, true);
  if (!linked.ok) throw new Error('expected link ok');
  const comparison = createComparisonReceipt({
    comparisonId: 'cmp-1',
    physicalReceipt: linked.receipt,
    baseline: {
      baselineReceiptId: 'base-1',
      tenantId: 'tenant-a',
      universeId: 'universe-a',
      algorithm: 'classical-greedy',
      problemHash: 'prob-1',
      runtimeMs: 5000,
      costUsd: 0.01,
      qualityScore: 0.9,
    },
    actorTenantId: 'tenant-a',
    actorUniverseId: 'universe-a',
    physicalRuntimeMs: 100,
    physicalCostUsd: 1.25,
    physicalQualityScore: 0.91,
  });
  assert.equal(comparison.quantumAdvantageVerified, false);
  assert.equal(comparison.physicalFaster, null);
  assert.equal(comparison.physicalCheaper, null);
  assert.equal(comparison.physicalSuperior, null);
  assert.ok(
    comparison.reasons.includes('PHYSICAL_VERIFICATION_NEQ_QUANTUM_ADVANTAGE'),
  );
  const pathway = recordNeuralPathway(linked.receipt);
  assert.equal(pathway.physicalVsSimSeparated, true);
  const simCreated = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      backendClassification: 'SIMULATOR',
      evidenceEnvironment: 'LOCAL_SIMULATION',
    }),
  );
  assert.equal(simCreated.ok, true);
  if (!simCreated.ok) throw new Error('expected ok');
  const simPath = recordNeuralPathway(simCreated.receipt);
  assert.equal(simPath.pathwayKind, 'SIMULATED_QUANTUM');
  assert.notEqual(pathway.pathwayKind, simPath.pathwayKind);
  const rep = applyReputationDelta(linked.receipt, 1);
  assert.equal(rep.reputationLiftsPermissions, false);
  assert.equal(EX6_LOCKS.REPUTATION_LIFTS_PERMISSIONS, false);
  console.log('PASS: 13 physical verification ≠ quantum advantage');
}

// --- 14. raw credentials never in receipt ---
{
  const denied = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      providerMetadata: {
        apiKey: 'sk-live-super-secret',
        rawCredentials: { token: 'abc' },
      },
    }),
  );
  assert.equal(denied.ok, false);
  if (denied.ok) throw new Error('expected deny');
  assert.match(denied.reason, /CREDENTIAL|SECRET/i);

  const ok = createPhysicalQpuReceipt(
    nearlyCompletePhysical({
      providerMetadata: {
        credentialRefId: 'vault://creds/qpu-ref-1',
        region: 'us-east-1',
      },
    }),
  );
  assert.equal(ok.ok, true);
  if (!ok.ok) throw new Error('expected ok');
  assert.equal(ok.receipt.providerMetadata.rawCredentialsPresent, false);
  assert.equal(receiptContainsRawCredentials(ok.receipt), false);
  assert.equal(EX6_LOCKS.STORE_CREDENTIALS_IN_RECEIPTS, false);
  console.log('PASS: 14 raw credentials never in receipt');
}

// --- 15. L4 false ---
{
  assert.equal(ex6L4AutonomyEnabled(), false);
  assert.equal(EX6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx6LocksIntact(), true);
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  assert.equal(created.receipt.l4Enabled, false);
  console.log('PASS: 15 L4 false');
}

// --- 16. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx6(), true);
  assert.equal(EX6_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const guardianPath = join(REPO_ROOT, 'services/ai/runtime/guardian/validate.ts');
  assert.equal(existsSync(guardianPath), true);
  const created = createPhysicalQpuReceipt(nearlyCompletePhysical());
  assert.equal(created.ok, true);
  if (!created.ok) throw new Error('expected ok');
  assert.equal(created.receipt.guardianRlsUnchanged, true);
  console.log('PASS: 16 Guardian/RLS unchanged');
}

// --- soft-wire audit (presence ≠ VERIFIED) ---
{
  const snap = ex6SoftWireSnapshot(REPO_ROOT);
  const summary = summarizeSoftWires(snap);
  assert.equal(summary.anyVerified, false);
  assert.equal(snap.ex5QpuProviderRegistry.verified, false);
  assert.ok(
    snap.ex5QpuProviderRegistry.disposition === 'WAITING_DATA' ||
      snap.ex5QpuProviderRegistry.disposition === 'PRESENT_UNVERIFIED',
  );
  // On clean xiv-v2 tip EX1–EX5 quantum modules are typically absent.
  assert.ok(
    snap.ex1MissionContract.disposition === 'WAITING_DATA' ||
      snap.ex1MissionContract.disposition === 'PRESENT_UNVERIFIED',
  );
  assert.equal(snap.agentMesh.verified, false);
  assert.equal(snap.guardian.verified, false);
  console.log(
    `PASS: soft-wire audit (waiting=${summary.waitingData.join(',') || 'none'}; present=${summary.presentUnverified.join(',') || 'none'})`,
  );
}

console.log('\n62L-EX6: all required tests PASS');
