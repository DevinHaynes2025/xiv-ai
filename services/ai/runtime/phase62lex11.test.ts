/**
 * 62L-EX11 — Quantum Evidence Ledger required honesty tests.
 * Script: npm run test:62lex11
 * Deterministic. No network. No real QPU. No hidden CoT persistence.
 * Do not report unrun tests as PASS. L4 remains false.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX11_LOCKS,
  assertEx11LocksIntact,
  assertClassicalStaysClassical,
  assertQiStaysQi,
  assertSimulatorStaysSimulated,
  auditEx11SoftWires,
  createQuantumEvidenceLedger,
  ex11L4AutonomyEnabled,
  guardianRlsUnchangedByEx11,
  isActiveRoutingCandidate,
  simulatorCanBecomePhysicalVerified,
  summarizeSoftWires,
  type EvidenceAppendInput,
  type QuantumEvidenceItem,
} from './quantum/index.ts';

const NOW = '2026-09-09T22:43:00.000Z';
const HERE = dirname(fileURLToPath(import.meta.url));
const GUARDIAN_DIR = join(HERE, 'guardian');

function hashGuardianTree(dir: string): string {
  const hash = createHash('sha256');
  const walk = (p: string) => {
    for (const name of readdirSync(p).sort()) {
      const full = join(p, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else {
        hash.update(full);
        hash.update(readFileSync(full));
      }
    }
  };
  walk(dir);
  return hash.digest('hex');
}

const GUARDIAN_HASH_BEFORE = hashGuardianTree(GUARDIAN_DIR);

function baseInput(overrides: Partial<EvidenceAppendInput> = {}): EvidenceAppendInput {
  return {
    missionId: 'mission-1',
    taskId: 'task-1',
    parentEvidenceId: null,
    agentId: 'agent-ex11-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    evidenceType: 'CLASSICAL_BASELINE',
    classification: 'CLASSICAL',
    sourceType: 'LOCAL_EXPERIMENT',
    sourceRef: 'local://baseline/1',
    experimentId: 'exp-1',
    receiptId: null,
    benchmarkId: null,
    comparisonId: null,
    algorithmVersion: 'algo-1',
    runtimeVersion: 'runtime-1',
    requestedDevice: 'cpu-local',
    actualDevice: 'cpu-local',
    provider: null,
    backend: null,
    inputHash: 'in-hash-1',
    outputHash: 'out-hash-1',
    createdAt: NOW,
    measuredAt: NOW,
    confidence: 0.9,
    reproducibility: {
      state: 'NOT_CHECKED',
      recipeHash: 'recipe-1',
      seed: 'seed-1',
      repeatCount: 0,
      lastReproducedAt: null,
      notes: null,
    },
    rightsClass: 'TENANT_PRIVATE',
    dataClass: 'BENCHMARK_FIXTURE',
    replicationPolicy: 'TENANT_SCOPED',
    limitations: ['fixture'],
    supersedesEvidenceId: null,
    historicalOnly: false,
    scaleHonesty: 'MEASURED',
    now: NOW,
    ...overrides,
  };
}

const scope = { tenantId: 'tenant-a', universeId: 'universe-a' };

// --- 1. classical evidence stays CLASSICAL ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(baseInput());
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(res.item.classification, 'CLASSICAL');
  assert.equal(res.item.evidenceType, 'CLASSICAL_BASELINE');
  assert.equal(assertClassicalStaysClassical(res.item), true);
  const bad = ledger.append(
    baseInput({
      evidenceId: 'qev-classical-bad',
      evidenceType: 'CLASSICAL_BASELINE',
      classification: 'QUANTUM_INSPIRED',
    }),
  );
  assert.equal(bad.ok, false);
  if (bad.ok) throw new Error('unreachable');
  assert.match(bad.reason, /CLASSICAL_BASELINE_MUST_STAY_CLASSICAL/);
  console.log('PASS: 1 classical evidence stays CLASSICAL');
}

// --- 2. QI evidence stays QUANTUM_INSPIRED ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(
    baseInput({
      evidenceType: 'QUANTUM_INSPIRED_EXPERIMENT',
      classification: 'QUANTUM_INSPIRED',
      inputHash: 'in-qi',
      outputHash: 'out-qi',
    }),
  );
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(res.item.classification, 'QUANTUM_INSPIRED');
  assert.equal(assertQiStaysQi(res.item), true);
  const bad = ledger.append(
    baseInput({
      evidenceId: 'qev-qi-bad',
      evidenceType: 'QUANTUM_INSPIRED_EXPERIMENT',
      classification: 'PHYSICAL_QPU_VERIFIED',
      receiptId: 'r1',
    }),
  );
  assert.equal(bad.ok, false);
  console.log('PASS: 2 QI evidence stays QUANTUM_INSPIRED');
}

// --- 3. simulator stays SIMULATED_QUANTUM ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(
    baseInput({
      evidenceType: 'SIMULATED_QUANTUM_RUN',
      classification: 'SIMULATED_QUANTUM',
      actualDevice: 'local-statevector',
      inputHash: 'in-sim',
      outputHash: 'out-sim',
    }),
  );
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(res.item.classification, 'SIMULATED_QUANTUM');
  assert.equal(assertSimulatorStaysSimulated(res.item), true);
  console.log('PASS: 3 simulator stays SIMULATED_QUANTUM');
}

// --- 4. simulator cannot become PHYSICAL_QPU_VERIFIED ---
{
  const ledger = createQuantumEvidenceLedger();
  const bad = ledger.append(
    baseInput({
      evidenceType: 'SIMULATED_QUANTUM_RUN',
      classification: 'PHYSICAL_QPU_VERIFIED',
      receiptId: 'fake-receipt',
    }),
  );
  assert.equal(bad.ok, false);
  if (bad.ok) throw new Error('unreachable');
  assert.match(bad.reason, /SIMULATOR_CANNOT_BECOME_PHYSICAL_QPU_VERIFIED|SIMULATOR_MUST_STAY/);
  assert.equal(simulatorCanBecomePhysicalVerified(), false);
  console.log('PASS: 4 simulator cannot become PHYSICAL_QPU_VERIFIED');
}

// --- 5. invalid integrity hash → rejected/unverified ---
{
  const ledger = createQuantumEvidenceLedger();
  const bad = ledger.append(
    baseInput({
      evidenceId: 'qev-bad-hash',
      providedIntegrityHash: '0'.repeat(64),
    }),
  );
  assert.equal(bad.ok, false);
  if (bad.ok) throw new Error('unreachable');
  assert.equal(bad.reason, 'INVALID_INTEGRITY_HASH');
  assert.ok(bad.disposition === 'REJECTED' || bad.disposition === 'UNVERIFIED');
  assert.ok(bad.item);
  assert.equal(bad.item!.evidenceState, 'REJECTED');
  console.log('PASS: 5 invalid integrity hash → rejected/unverified');
}

// --- 6. stale runtime → STALE ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(
    baseInput({
      evidenceId: 'qev-stale',
      runtimeFreshUntil: '2026-01-01T00:00:00.000Z',
      now: NOW,
    }),
  );
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(res.item.freshnessState, 'STALE');
  assert.equal(res.item.evidenceState, 'STALE');
  console.log('PASS: 6 stale runtime → STALE');
}

// --- 7. contradictions create record ---
{
  const ledger = createQuantumEvidenceLedger();
  const a = ledger.append(baseInput({ evidenceId: 'qev-left', outputHash: 'out-a' }));
  const b = ledger.append(baseInput({ evidenceId: 'qev-right', outputHash: 'out-b' }));
  assert.equal(a.ok && b.ok, true);
  const ctr = ledger.recordContradiction({
    leftEvidenceId: 'qev-left',
    rightEvidenceId: 'qev-right',
    topic: 'output_divergence',
    summary: 'A and B disagree on output for same input recipe',
    scope,
    createdAt: NOW,
  });
  assert.equal(ctr.ok, true);
  if (!ctr.ok) throw new Error('unreachable');
  assert.ok(ctr.contradiction.contradictionId.startsWith('ctr-'));
  assert.equal(ctr.contradiction.resolved, false);
  const left = ledger.get('qev-left', scope);
  assert.equal(left.ok, true);
  if (!left.ok) throw new Error('unreachable');
  assert.equal(left.item.evidenceState, 'CONTRADICTED');
  assert.ok(left.item.contradictions.includes(ctr.contradiction.contradictionId));
  console.log('PASS: 7 contradictions create record');
}

// --- 8. rejected cannot strengthen neural pathway ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(
    baseInput({
      evidenceId: 'qev-rejected',
      evidenceState: 'REJECTED',
      reviewState: 'REJECTED',
    }),
  );
  assert.equal(res.ok, true);
  const lesson = ledger.applyLearningLesson({
    evidenceId: 'qev-rejected',
    scope,
    target: 'ROUTE_PRIORITY',
    priorityDelta: 1,
    now: NOW,
  });
  assert.equal(lesson.ok, false);
  if (lesson.ok) throw new Error('unreachable');
  assert.equal(lesson.reason, 'REJECTED_CANNOT_STRENGTHEN_NEURAL_PATHWAY');
  console.log('PASS: 8 rejected cannot strengthen neural pathway');
}

// --- 9. reproducible verified may become routing candidate ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(
    baseInput({
      evidenceId: 'qev-route',
      evidenceState: 'REPRODUCIBLE',
      reviewState: 'APPROVED',
      reproducibility: {
        state: 'REPRODUCED',
        recipeHash: 'recipe-r',
        seed: 'seed-r',
        repeatCount: 3,
        lastReproducedAt: NOW,
        notes: null,
      },
    }),
  );
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(isActiveRoutingCandidate(res.item), true);
  const lesson = ledger.applyLearningLesson({
    evidenceId: 'qev-route',
    scope,
    target: 'ROUTE_PRIORITY',
    priorityDelta: 2,
    now: NOW,
  });
  assert.equal(lesson.ok, true);
  if (!lesson.ok) throw new Error('unreachable');
  assert.equal(lesson.lesson.allowed, true);
  assert.equal(lesson.lesson.target, 'ROUTE_PRIORITY');
  console.log('PASS: 9 reproducible verified may become routing candidate');
}

// --- 10. offline local → LOCAL_PENDING_REVIEW ---
{
  const ledger = createQuantumEvidenceLedger();
  const res = ledger.append(baseInput({ evidenceId: 'qev-offline', offline: true }));
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error('unreachable');
  assert.equal(res.item.reviewState, 'LOCAL_PENDING_REVIEW');
  assert.equal(res.item.syncDisposition, 'LOCAL_PENDING_REVIEW');
  console.log('PASS: 10 offline local → LOCAL_PENDING_REVIEW');
}

// --- 11. offline does not auto-promote globally ---
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(baseInput({ evidenceId: 'qev-offline-2', offline: true }));
  const sync = ledger.syncOnReconnect(scope, NOW);
  assert.equal(sync.autoGlobalPromoted, false);
  assert.ok(sync.pendingReview >= 1);
  const got = ledger.get('qev-offline-2', scope);
  assert.equal(got.ok, true);
  if (!got.ok) throw new Error('unreachable');
  assert.equal(got.item.syncDisposition, 'LOCAL_PENDING_REVIEW');
  assert.equal(EX11_LOCKS.AUTO_GLOBAL_PROMOTE_OFFLINE, false);
  console.log('PASS: 11 offline does not auto-promote globally');
}

// --- 12. revoked excluded from active routing ---
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(
    baseInput({
      evidenceId: 'qev-rev',
      evidenceState: 'REPRODUCIBLE',
      reviewState: 'APPROVED',
      reproducibility: {
        state: 'REPRODUCED',
        recipeHash: 'r',
        seed: 's',
        repeatCount: 2,
        lastReproducedAt: NOW,
        notes: null,
      },
    }),
  );
  const rev = ledger.revoke('qev-rev', scope, 'test-revoke', NOW);
  assert.equal(rev.ok, true);
  if (!rev.ok) throw new Error('unreachable');
  assert.equal(rev.item.evidenceState, 'REVOKED');
  assert.equal(isActiveRoutingCandidate(rev.item), false);
  const q = ledger.query(scope, { activeRoutingOnly: true });
  assert.equal(q.ok, true);
  if (!q.ok) throw new Error('unreachable');
  assert.equal(q.items.some((i) => i.evidenceId === 'qev-rev'), false);
  const lesson = ledger.applyLearningLesson({
    evidenceId: 'qev-rev',
    scope,
    target: 'ROUTE_PRIORITY',
    priorityDelta: 1,
    now: NOW,
  });
  assert.equal(lesson.ok, false);
  if (lesson.ok) throw new Error('unreachable');
  assert.equal(lesson.reason, 'REVOKED_EXCLUDED_FROM_ACTIVE_ROUTING');
  console.log('PASS: 12 revoked excluded from active routing');
}

// --- 13. cross-tenant DENIED ---
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(baseInput({ evidenceId: 'qev-tenant' }));
  const got = ledger.get('qev-tenant', { tenantId: 'tenant-b', universeId: 'universe-a' });
  assert.equal(got.ok, false);
  if (got.ok) throw new Error('unreachable');
  assert.equal(got.reason, 'CROSS_TENANT_DENIED');
  console.log('PASS: 13 cross-tenant DENIED');
}

// --- 14. cross-Universe DENIED ---
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(baseInput({ evidenceId: 'qev-univ' }));
  const got = ledger.get('qev-univ', { tenantId: 'tenant-a', universeId: 'universe-b' });
  assert.equal(got.ok, false);
  if (got.ok) throw new Error('unreachable');
  assert.equal(got.reason, 'CROSS_UNIVERSE_DENIED');
  console.log('PASS: 14 cross-Universe DENIED');
}

// --- 15. restricted/stolen source → DENIED/QUARANTINED ---
{
  const ledger = createQuantumEvidenceLedger();
  for (const sourceType of ['STOLEN', 'LEAKED', 'UNKNOWN_RESTRICTED', 'PROPRIETARY_CONFIDENTIAL'] as const) {
    const bad = ledger.append(
      baseInput({
        evidenceId: `qev-${sourceType.toLowerCase()}`,
        sourceType,
      }),
    );
    assert.equal(bad.ok, false);
    if (bad.ok) throw new Error('unreachable');
    assert.match(bad.reason, /RESTRICTED_SOURCE_/);
    assert.equal(bad.disposition, 'QUARANTINED');
  }
  console.log('PASS: 15 restricted/stolen source → DENIED/QUARANTINED');
}

// --- 16. no hidden CoT persistence ---
{
  const ledger = createQuantumEvidenceLedger();
  const bad = ledger.append(
    baseInput({
      evidenceId: 'qev-cot',
      hiddenCot: 'secret chain of thought transcript',
    }),
  );
  assert.equal(bad.ok, false);
  if (bad.ok) throw new Error('unreachable');
  assert.equal(bad.reason, 'HIDDEN_COT_PERSISTENCE_FORBIDDEN');
  assert.equal(EX11_LOCKS.HIDDEN_COT_PERSISTENCE, false);

  const ok = ledger.append(baseInput({ evidenceId: 'qev-nocot' }));
  assert.equal(ok.ok, true);
  if (!ok.ok) throw new Error('unreachable');
  assert.equal(ok.item.hiddenCot, null);

  const reviewBad = ledger.review.submit({
    evidenceId: 'qev-nocot',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    reviewerId: 'reviewer-1',
    decision: 'APPROVED',
    rationaleSummary: 'looks fine',
    cotTranscript: 'hidden reasoning dump',
    createdAt: NOW,
  });
  assert.equal(reviewBad.ok, false);
  if (reviewBad.ok) throw new Error('unreachable');
  assert.equal(reviewBad.reason, 'HIDDEN_COT_PERSISTENCE_FORBIDDEN');
  console.log('PASS: 16 no hidden CoT persistence');
}

// --- 17. L4 false ---
{
  assert.equal(ex11L4AutonomyEnabled(), false);
  assert.equal(EX11_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx11LocksIntact(), true);
  console.log('PASS: 17 L4 false');
}

// --- 18. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx11(), true);
  assert.equal(EX11_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX11_LOCKS.LEARNING_WEAKENS_GUARDIAN_RLS, false);
  const after = hashGuardianTree(GUARDIAN_DIR);
  assert.equal(after, GUARDIAN_HASH_BEFORE);
  assert.ok(existsSync(join(GUARDIAN_DIR, 'validate.ts')));

  // Learning cannot target Guardian/RLS/permissions.
  const ledger = createQuantumEvidenceLedger();
  ledger.append(
    baseInput({
      evidenceId: 'qev-learn-guard',
      evidenceState: 'REPRODUCIBLE',
      reviewState: 'APPROVED',
      reproducibility: {
        state: 'REPRODUCED',
        recipeHash: 'r',
        seed: 's',
        repeatCount: 2,
        lastReproducedAt: NOW,
        notes: null,
      },
    }),
  );
  for (const target of ['PERMISSIONS', 'GUARDIAN', 'RLS', 'TENANT', 'UNIVERSE', 'BILLING', 'PRODUCTION'] as const) {
    const denied = ledger.applyLearningLesson({
      evidenceId: 'qev-learn-guard',
      scope,
      target,
      priorityDelta: 1,
      now: NOW,
    });
    assert.equal(denied.ok, false);
    if (denied.ok) throw new Error('unreachable');
    assert.match(denied.reason, /LEARNING_TARGET_FORBIDDEN_/);
  }
  console.log('PASS: 18 Guardian/RLS unchanged');
}

// Soft-wire smoke (presence ≠ VERIFIED)
{
  const snap = auditEx11SoftWires();
  const summary = summarizeSoftWires(snap);
  assert.equal(summary.anyVerified, false);
  assert.equal(snap.guardian.verified, false);
  // Soft-wire dispositions are only PRESENT_UNVERIFIED or WAITING_DATA
  for (const v of Object.values(snap)) {
    assert.ok(v.disposition === 'PRESENT_UNVERIFIED' || v.disposition === 'WAITING_DATA');
  }
  console.log(
    `PASS: soft-wire smoke present=${summary.presentUnverified.length} waiting=${summary.waitingData.length}`,
  );
}

// Scale honesty: no trillion claim without measurement
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(baseInput({ evidenceId: 'qev-scale' }));
  const counters = ledger.scaleCounters();
  assert.equal(counters.trillionClaimAllowed, false);
  assert.equal(counters.measuredEvidenceCount, 1);
  assert.equal(EX11_LOCKS.TRILLION_CLAIM_WITHOUT_MEASUREMENT, false);
  console.log('PASS: scale honesty — ENGINEERING_SCALE_TARGET only; no trillion without measurement');
}

// Physical claim gate requires EX6 receipt
{
  const ledger = createQuantumEvidenceLedger();
  const noReceipt = ledger.append(
    baseInput({
      evidenceId: 'qev-phys-bad',
      evidenceType: 'PHYSICAL_QPU_RECEIPT',
      classification: 'PHYSICAL_QPU_VERIFIED',
      receiptId: null,
    }),
  );
  assert.equal(noReceipt.ok, false);

  const ok = ledger.append(
    baseInput({
      evidenceId: 'qev-phys-ok',
      evidenceType: 'PHYSICAL_QPU_RECEIPT',
      classification: 'PHYSICAL_QPU_VERIFIED',
      receiptId: 'ex6-receipt-1',
      provider: 'ibm-quantum-candidate',
      backend: 'ibm-q-1',
      evidenceState: 'VERIFIED',
      reviewState: 'APPROVED',
      reproducibility: {
        state: 'REPRODUCED',
        recipeHash: 'r',
        seed: 's',
        repeatCount: 2,
        lastReproducedAt: NOW,
        notes: null,
      },
      benchmarkId: 'bench-1',
      comparisonId: 'cmp-ex10-1',
    }),
  );
  assert.equal(ok.ok, true);
  if (!ok.ok) throw new Error('unreachable');
  const gate = ledger.evaluateClaimGate('PHYSICAL_QPU_VERIFIED', 'qev-phys-ok', scope);
  assert.equal(gate.allowed, true);
  const adv = ledger.evaluateClaimGate('QUANTUM_ADVANTAGE_VERIFIED', 'qev-phys-ok', scope);
  assert.equal(adv.allowed, true);

  const hist = ledger.append(
    baseInput({
      evidenceId: 'qev-hist',
      evidenceType: 'HISTORICAL_RESEARCH',
      classification: 'NOT_TESTED',
      historicalOnly: true,
      sourceType: 'HISTORICAL_RESEARCH',
      rightsClass: 'HISTORICAL_PUBLIC',
    }),
  );
  assert.equal(hist.ok, true);
  if (!hist.ok) throw new Error('unreachable');
  assert.equal(hist.item.historicalOnly, true);
  const histGate = ledger.evaluateClaimGate('PHYSICAL_QPU_VERIFIED', 'qev-hist', scope);
  assert.equal(histGate.allowed, false);
  console.log('PASS: claim gates + historical ≠ physical verified');
}

// Compression preserves provenance
{
  const ledger = createQuantumEvidenceLedger();
  ledger.append(baseInput({ evidenceId: 'qev-c1', outputHash: 'c1' }));
  ledger.append(baseInput({ evidenceId: 'qev-c2', outputHash: 'c2' }));
  const bundle = ledger.compress(scope, ['qev-c1', 'qev-c2'], NOW);
  assert.equal(bundle.ok, true);
  if (!bundle.ok) throw new Error('unreachable');
  assert.equal(bundle.bundle.provenancePreserved, true);
  assert.deepEqual([...bundle.bundle.evidenceIds], ['qev-c1', 'qev-c2']);
  console.log('PASS: compression preserves provenance');
}

console.log('OK: 62L-EX11 Quantum Evidence Ledger — all required honesty tests passed');
