/**
 * 62L-EX5 — QPU Provider Truth Registry required honesty tests.
 * Script: npm run test:62lex5
 * Deterministic. No network. No real QPU. No mocked test = physical evidence.
 * Do not report unrun tests as PASS. L4 remains false.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EX5_LOCKS,
  applyEx5NeuralPathwayLesson,
  assertAdapterBoundary,
  assertEx5LocksIntact,
  attachCredentialReference,
  auditEx5SoftWires,
  authorizeQpuJob,
  backendSatisfiesVerified,
  classifyBackendHonesty,
  createBackendRecord,
  createQpuExecutionReceipt,
  createQpuTruthRegistry,
  createStubProviderAdapter,
  evaluateAdvantageFromReceipt,
  evaluatePhysicalQpuVerified,
  ex5L4AutonomyEnabled,
  excludeStaleFromVerifiedRoute,
  getBackend,
  getProvider,
  guardianRlsUnchangedByEx5,
  listStubAdapters,
  markProviderAuthorized,
  mockedRegistryImpliesPhysicalVerification,
  recordFailureMemory,
  refreshJobStatusOffline,
  routeQpuJob,
  seedUnconfiguredProviderCatalog,
  simulatorCanBePhysicalQpuVerified,
  upsertBackend,
  upsertProvider,
  type QpuJobRequest,
  type QpuTruthRegistry,
} from './quantum/index.ts';

const NOW = '2026-09-09T22:30:00.000Z';
const FUTURE = '2026-12-31T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';
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

function baseRegistry(overrides: { mockedDiscovery?: boolean } = {}): QpuTruthRegistry {
  return createQpuTruthRegistry({
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    seedCandidates: true,
    mockedDiscovery: overrides.mockedDiscovery === true,
  });
}

function authorizeProvider(
  registry: QpuTruthRegistry,
  providerId: string,
  opts: {
    regions?: readonly string[];
    maxSpendUsd?: number;
    perJobMaxUsd?: number;
    hardLimitUsd?: number;
  } = {},
) {
  const provider = getProvider(registry, providerId);
  assert.ok(provider);
  let next = {
    ...provider,
    regions: [...(opts.regions ?? ['us-east-1'])],
    costPolicy: {
      ...provider.costPolicy,
      maxSpendUsd: opts.maxSpendUsd ?? 100,
      perJobMaxUsd: opts.perJobMaxUsd ?? 50,
    },
    spendingLimits: {
      softLimitUsd: opts.hardLimitUsd ?? 100,
      hardLimitUsd: opts.hardLimitUsd ?? 100,
      spentUsd: 0,
    },
  };
  const withCred = attachCredentialReference(next, 'cred-ref-1', 'vault:xiv/qpu/cred-ref-1');
  assert.ok(!('ok' in withCred));
  next = withCred;
  const auth = markProviderAuthorized(next, {
    termsVersion: 'terms-1',
    policyVersion: 'policy-1',
    now: NOW,
  });
  assert.ok(!('ok' in auth));
  upsertProvider(registry, auth);
  return auth;
}

function baseRequest(overrides: Partial<QpuJobRequest> = {}): QpuJobRequest {
  return {
    jobId: 'job-1',
    missionId: 'mission-1',
    taskId: 'task-1',
    agentId: 'agent-hw-evidence-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-sim-1',
    problemClass: 'OPTIMIZATION',
    shots: 100,
    estimatedCostUsd: 0,
    regionRequired: 'us-east-1',
    inputDataClass: 'BENCHMARK_FIXTURE',
    privacyClass: 'TENANT_PRIVATE',
    missionExpiresAt: FUTURE,
    missionStatus: 'ACTIVE',
    budgetRemainingUsd: 100,
    paymentRequired: false,
    guardianActive: true,
    offlineDisconnected: false,
    discoveryAvailable: true,
    requireVerifiedPhysical: false,
    humanApprovalGranted: false,
    now: NOW,
    ...overrides,
  };
}

// --- 1. unconfigured provider → NOT_CONFIGURED ---
{
  const registry = baseRegistry();
  const providers = seedUnconfiguredProviderCatalog({
    tenantId: 'tenant-a',
    universeId: 'universe-a',
  });
  assert.equal(providers.length, 5);
  assert.ok(providers.every((p) => p.state === 'NOT_CONFIGURED'));
  const gate = authorizeQpuJob(registry, baseRequest());
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'PROVIDER_NOT_CONFIGURED');
  assert.equal(gate.providerState, 'NOT_CONFIGURED');
  console.log('PASS: 1 unconfigured provider → NOT_CONFIGURED');
}

// --- 2. documented backend cannot satisfy VERIFIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-doc-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'Documented backend only',
      state: 'DOCUMENTED',
      physicalOrSimulator: 'PHYSICAL_QPU',
      qubitsReported: 127,
      qubitsVerified: null,
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  assert.equal(backendSatisfiesVerified(backend(registry, 'ibm-doc-1'), NOW), false);
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ backendId: 'ibm-doc-1', requireVerifiedPhysical: true }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'DOCUMENTED_CANNOT_SATISFY_VERIFIED');
  console.log('PASS: 2 documented backend cannot satisfy VERIFIED');
}

function backend(registry: QpuTruthRegistry, id: string) {
  const b = getBackend(registry, id);
  assert.ok(b, `missing backend ${id}`);
  return b;
}

// --- 3. simulator backend → SIMULATED_QUANTUM ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'Local/cloud simulator',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      qubitsReported: 32,
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const honesty = classifyBackendHonesty(backend(registry, 'ibm-sim-1'));
  assert.equal(honesty.executionClass, 'SIMULATED_QUANTUM');
  const gate = authorizeQpuJob(registry, baseRequest({ backendId: 'ibm-sim-1' }));
  assert.equal(gate.decision, 'ALLOWED');
  assert.equal(gate.executionClass, 'SIMULATED_QUANTUM');
  console.log('PASS: 3 simulator backend → SIMULATED_QUANTUM');
}

// --- 4. simulator never PHYSICAL_QPU_VERIFIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'aws-braket-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'braket-sim',
      providerId: 'aws-braket-candidate',
      displayName: 'Braket SV1 simulator',
      state: 'VERIFIED',
      physicalOrSimulator: 'SIMULATOR',
      qubitsReported: 34,
      qubitsVerified: 34,
      region: 'us-east-1',
      lastVerifiedAt: NOW,
      lastSeenAt: NOW,
    }),
  );
  assert.equal(simulatorCanBePhysicalQpuVerified(backend(registry, 'braket-sim')), false);
  const gate = authorizeQpuJob(
    registry,
    baseRequest({
      providerId: 'aws-braket-candidate',
      backendId: 'braket-sim',
      requireVerifiedPhysical: true,
    }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.match(gate.reason, /SIMULATOR_NEVER_PHYSICAL/);
  const receipt = createQpuExecutionReceipt({
    receiptId: 'r-sim',
    jobId: 'j',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'aws-braket-candidate',
    backendId: 'braket-sim',
    physicalOrSimulator: 'SIMULATOR',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: true,
    mocked: false,
    startedAt: NOW,
    completedAt: NOW,
    shots: 10,
    resultDigest: 'digest',
    claimPhysicalQpuVerified: true,
  });
  assert.equal(receipt.ok, false);
  console.log('PASS: 4 simulator never PHYSICAL_QPU_VERIFIED');
}

// --- 5. unauthorized physical provider → DENIED ---
{
  const registry = baseRegistry();
  // Leave provider DOCUMENTED / AUTH_REQUIRED without authorization
  const p = getProvider(registry, 'ibm-quantum-candidate')!;
  upsertProvider(registry, { ...p, state: 'DOCUMENTED' });
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-q-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'IBM physical candidate',
      state: 'AVAILABLE_REPORTED',
      physicalOrSimulator: 'PHYSICAL_QPU',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ backendId: 'ibm-q-1', requireVerifiedPhysical: true }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'UNAUTHORIZED_PHYSICAL_PROVIDER');
  console.log('PASS: 5 unauthorized physical provider → DENIED');
}

// --- 6. expired mission → DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ missionExpiresAt: PAST, missionStatus: 'EXPIRED' }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'MISSION_EXPIRED');
  console.log('PASS: 6 expired mission → DENIED');
}

// --- 7. budget exceeded → DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate', { perJobMaxUsd: 1, hardLimitUsd: 1 });
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ estimatedCostUsd: 50, budgetRemainingUsd: 10 }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'BUDGET_EXCEEDED');
  console.log('PASS: 7 budget exceeded → DENIED');
}

// --- 8. payment-required → HUMAN_APPROVAL_REQUIRED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate', {
    perJobMaxUsd: 100,
    hardLimitUsd: 100,
  });
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({
      estimatedCostUsd: 5,
      paymentRequired: true,
      humanApprovalGranted: false,
      budgetRemainingUsd: 100,
    }),
  );
  assert.equal(gate.decision, 'HUMAN_APPROVAL_REQUIRED');
  const route = routeQpuJob(
    registry,
    baseRequest({
      estimatedCostUsd: 5,
      paymentRequired: true,
      humanApprovalGranted: false,
      budgetRemainingUsd: 100,
    }),
  );
  assert.equal(route.decision, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(route.autoSubmitted, false);
  console.log('PASS: 8 payment-required → HUMAN_APPROVAL_REQUIRED');
}

// --- 9. region mismatch → DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate', { regions: ['eu-west-1'] });
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-eu',
      providerId: 'ibm-quantum-candidate',
      displayName: 'eu backend',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'eu-west-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ backendId: 'ibm-eu', regionRequired: 'us-east-1' }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'REGION_MISMATCH');
  console.log('PASS: 9 region mismatch → DENIED');
}

// --- 10. privacy/data-class mismatch → DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      dataClasses: ['SYNTHETIC'],
      privacyClasses: ['PUBLIC'],
      lastSeenAt: NOW,
    }),
  );
  const dataGate = authorizeQpuJob(
    registry,
    baseRequest({ inputDataClass: 'RESTRICTED', privacyClass: 'PUBLIC' }),
  );
  assert.equal(dataGate.decision, 'DENIED');
  assert.match(dataGate.reason, /DATA_CLASS_MISMATCH|PRIVACY_CLASS_MISMATCH/);

  const privGate = authorizeQpuJob(
    registry,
    baseRequest({ inputDataClass: 'SYNTHETIC', privacyClass: 'FOUNDER_SEALED' }),
  );
  assert.equal(privGate.decision, 'DENIED');
  assert.match(privGate.reason, /PRIVACY_CLASS_MISMATCH|DATA_CLASS_MISMATCH/);
  console.log('PASS: 10 privacy/data-class mismatch → DENIED');
}

// --- 11. offline QPU → WAITING_PROVIDER ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-q',
      providerId: 'ibm-quantum-candidate',
      displayName: 'physical',
      state: 'VERIFIED',
      physicalOrSimulator: 'PHYSICAL_QPU',
      qubitsVerified: 127,
      region: 'us-east-1',
      lastVerifiedAt: NOW,
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({
      backendId: 'ibm-q',
      offlineDisconnected: true,
      discoveryAvailable: false,
      requireVerifiedPhysical: true,
    }),
  );
  assert.equal(gate.decision, 'WAITING_PROVIDER');
  const refresh = refreshJobStatusOffline({ previouslyKnownBackendState: 'VERIFIED' });
  assert.equal(refresh.status, 'STALE');
  assert.equal(refresh.fabricated, false);
  console.log('PASS: 11 offline QPU → WAITING_PROVIDER');
}

// --- 12. stale backend excluded from fresh VERIFIED route ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  const staleAt = '2026-01-01T00:00:00.000Z';
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-stale',
      providerId: 'ibm-quantum-candidate',
      displayName: 'stale physical',
      state: 'VERIFIED',
      physicalOrSimulator: 'PHYSICAL_QPU',
      qubitsVerified: 127,
      region: 'us-east-1',
      lastVerifiedAt: staleAt,
      lastSeenAt: staleAt,
      freshnessTtlMs: 60_000,
    }),
  );
  const fresh = excludeStaleFromVerifiedRoute([backend(registry, 'ibm-stale')], NOW);
  assert.equal(fresh.length, 0);
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ backendId: 'ibm-stale', requireVerifiedPhysical: true }),
  );
  assert.equal(gate.decision, 'DENIED');
  assert.match(gate.reason, /STALE_BACKEND_EXCLUDED|BACKEND_NOT_FRESH/);
  console.log('PASS: 12 stale backend excluded from fresh VERIFIED route');
}

// --- 13. successful mocked registry flow ≠ physical verification ---
{
  const registry = baseRegistry({ mockedDiscovery: true });
  assert.equal(mockedRegistryImpliesPhysicalVerification(registry), false);
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-mock-phys',
      providerId: 'ibm-quantum-candidate',
      displayName: 'mocked discovered physical',
      state: 'VERIFIED',
      physicalOrSimulator: 'PHYSICAL_QPU',
      qubitsVerified: 127,
      region: 'us-east-1',
      lastVerifiedAt: NOW,
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(
    registry,
    baseRequest({ backendId: 'ibm-mock-phys', requireVerifiedPhysical: true }),
  );
  assert.equal(gate.decision, 'ALLOWED');
  assert.equal(gate.physicalQpuVerified, false);
  const receipt = createQpuExecutionReceipt({
    receiptId: 'r-mock',
    jobId: 'j',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-mock-phys',
    physicalOrSimulator: 'PHYSICAL_QPU',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: true,
    mocked: true,
    startedAt: NOW,
    completedAt: NOW,
    shots: 10,
    resultDigest: 'mock-digest',
    claimPhysicalQpuVerified: true,
  });
  assert.equal(receipt.ok, false);
  console.log('PASS: 13 successful mocked registry flow ≠ physical verification');
}

// --- 14. PHYSICAL_QPU_VERIFIED requires real job receipt ---
{
  const okReceipt = createQpuExecutionReceipt({
    receiptId: 'r-real',
    jobId: 'j-real',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-q',
    physicalOrSimulator: 'PHYSICAL_QPU',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: true,
    mocked: false,
    startedAt: NOW,
    completedAt: NOW,
    shots: 100,
    resultDigest: 'sha256:real-job-result',
    claimPhysicalQpuVerified: true,
  });
  assert.equal(okReceipt.ok, true);
  if (okReceipt.ok) {
    assert.equal(okReceipt.receipt.physicalQpuVerified, true);
    const evaled = evaluatePhysicalQpuVerified(okReceipt.receipt);
    assert.equal(evaled.physicalQpuVerified, true);
  }
  const missing = createQpuExecutionReceipt({
    receiptId: 'r-missing',
    jobId: 'j',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-q',
    physicalOrSimulator: 'PHYSICAL_QPU',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: false,
    mocked: false,
    startedAt: NOW,
    completedAt: NOW,
    shots: 100,
    resultDigest: '',
    claimPhysicalQpuVerified: true,
  });
  assert.equal(missing.ok, false);
  assert.match(missing.ok === false ? missing.reason : '', /REAL_JOB_RECEIPT/);
  console.log('PASS: 14 PHYSICAL_QPU_VERIFIED requires real job receipt');
}

// --- 15. physical execution alone cannot claim quantum advantage ---
{
  const receipt = createQpuExecutionReceipt({
    receiptId: 'r-adv',
    jobId: 'j',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-q',
    physicalOrSimulator: 'PHYSICAL_QPU',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: true,
    mocked: false,
    startedAt: NOW,
    completedAt: NOW,
    shots: 100,
    resultDigest: 'sha256:real',
    claimPhysicalQpuVerified: true,
    claimQuantumAdvantage: true,
    classicalBaselineCompared: false,
    reproducibleBenchmark: false,
    reviewGatePassed: false,
  });
  assert.equal(receipt.ok, false);
  assert.match(
    receipt.ok === false ? receipt.reason : '',
    /PHYSICAL_EXECUTION_ALONE_CANNOT_CLAIM_QUANTUM_ADVANTAGE/,
  );

  const physicalOnly = createQpuExecutionReceipt({
    receiptId: 'r-phys-only',
    jobId: 'j',
    missionId: 'm',
    taskId: 't',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    providerId: 'ibm-quantum-candidate',
    backendId: 'ibm-q',
    physicalOrSimulator: 'PHYSICAL_QPU',
    executionClass: 'PHYSICAL_QPU_VERIFIED',
    physicalJobCompleted: true,
    mocked: false,
    startedAt: NOW,
    completedAt: NOW,
    shots: 100,
    resultDigest: 'sha256:real',
    claimPhysicalQpuVerified: true,
  });
  assert.equal(physicalOnly.ok, true);
  if (physicalOnly.ok) {
    assert.equal(physicalOnly.receipt.quantumAdvantageVerified, false);
    const adv = evaluateAdvantageFromReceipt(physicalOnly.receipt);
    assert.equal(adv.quantumAdvantageVerified, false);
    assert.ok(adv.missing.includes('CLASSICAL_BASELINE'));
  }
  console.log('PASS: 15 physical execution alone cannot claim quantum advantage');
}

// --- 16. cross-tenant DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(registry, baseRequest({ tenantId: 'tenant-b' }));
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'CROSS_TENANT_DENIED');
  console.log('PASS: 16 cross-tenant DENIED');
}

// --- 17. cross-Universe DENIED ---
{
  const registry = baseRegistry();
  authorizeProvider(registry, 'ibm-quantum-candidate');
  upsertBackend(
    registry,
    createBackendRecord({
      backendId: 'ibm-sim-1',
      providerId: 'ibm-quantum-candidate',
      displayName: 'sim',
      state: 'SUPPORTED',
      physicalOrSimulator: 'SIMULATOR',
      region: 'us-east-1',
      lastSeenAt: NOW,
    }),
  );
  const gate = authorizeQpuJob(registry, baseRequest({ universeId: 'universe-b' }));
  assert.equal(gate.decision, 'DENIED');
  assert.equal(gate.reason, 'CROSS_UNIVERSE_DENIED');
  console.log('PASS: 17 cross-Universe DENIED');
}

// --- 18. L4 false ---
{
  assert.equal(ex5L4AutonomyEnabled(), false);
  assert.equal(EX5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx5LocksIntact(), true);
  console.log('PASS: 18 L4_AUTONOMY_ENABLED=false');
}

// --- 19. Guardian/RLS unchanged ---
{
  assert.equal(guardianRlsUnchangedByEx5(), true);
  assert.equal(EX5_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(existsSync(GUARDIAN_DIR), true);
  const guardianHashAfter = hashGuardianTree(GUARDIAN_DIR);
  assert.equal(guardianHashAfter, GUARDIAN_HASH_BEFORE);
  const lesson = applyEx5NeuralPathwayLesson({
    mayUpdateRoutingPriority: true,
    mayUpdateConfidence: true,
    mayUpdateRetest: true,
    mayChangeGuardian: true,
    mayChangeRls: false,
    mayChangeBilling: false,
    mayChangeCredentials: false,
    mayChangeTenant: false,
    mayChangeUniverse: false,
    mayChangeProductionAuthority: false,
  });
  assert.equal(lesson.allowed, false);
  console.log('PASS: 19 Guardian/RLS unchanged');
}

// Soft-wire honesty + adapter boundary + failure memory
{
  const wires = auditEx5SoftWires();
  assert.equal(wires.agentMesh.verified, false);
  assert.equal(wires.guardian.verified, false);
  assert.ok(
    wires.ex1Mission.disposition === 'PRESENT_UNVERIFIED' ||
      wires.ex1Mission.disposition === 'WAITING_DATA',
  );
  assert.ok(
    wires.ex4SimulatorRegistry.disposition === 'PRESENT_UNVERIFIED' ||
      wires.ex4SimulatorRegistry.disposition === 'WAITING_DATA',
  );
  const stubs = listStubAdapters();
  assert.equal(stubs.length, 5);
  assert.ok(stubs.every((s) => s.embedsCredentials === false));
  const ibm = createStubProviderAdapter('IBM_QUANTUM_CANDIDATE');
  assert.ok(ibm);
  assert.equal(assertAdapterBoundary(ibm), true);
  const fail = recordFailureMemory({
    failureId: 'fail-1',
    providerId: 'ibm-quantum-candidate',
    backendId: null,
    reason: 'OFFLINE',
    at: NOW,
  });
  assert.equal(fail.authority, false);
  assert.equal(fail.evidenceOnly, true);
  console.log('PASS: soft-wire + adapter boundary + failure memory (evidence only)');
}

console.log('\n62L-EX5: all required tests PASS');
