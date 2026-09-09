/**
 * 62L-EX18 — Quantum Research Wormhole Router tests.
 * Script: npm run test:62lex18
 * Deterministic. No network. No real QPU. Do not report unrun tests as PASS.
 * L4 remains false. Guardian/RLS unchanged.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  EX18_LOCKS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  WORMHOLE_TYPES,
  applyPlasticityFeedback,
  assertEx18LocksIntact,
  auditEx18SoftWires,
  cacheHitNeverBypassesAuthorization,
  clearWormholeRegistry,
  completeWithReceipt,
  computeInputHash,
  computeWorkloadFingerprint,
  createRouterState,
  ex18L4AutonomyEnabled,
  exportWormholeDna,
  guardianRlsUnchangedByEx18,
  lookupWormhole,
  physicalQpuVerificationFromHistorical,
  recordShortcutFailure,
  registerWormhole,
  scaleTelemetryMeasuredOnly,
  softWireAbsenceIsWaitingDataNotFail,
  verifyBenefit,
  type WormholeAuthContext,
  type WormholeLookupRequest,
  type XivWormholeRoute,
} from './wormholes/index.ts';

const NOW = '2026-09-09T23:10:00.000Z';
const LATER = '2026-09-09T23:20:00.000Z';
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

const GUARDIAN_HASH_BEFORE = existsSync(GUARDIAN_DIR)
  ? hashGuardianTree(GUARDIAN_DIR)
  : 'ABSENT';

const TENANT = 'tenant-a';
const UNIVERSE = 'universe-a';

function auth(overrides: Partial<WormholeAuthContext> = {}): WormholeAuthContext {
  return {
    userId: 'user-1',
    tenantId: TENANT,
    universeId: UNIVERSE,
    objectId: 'obj-1',
    purpose: 'research',
    dataClass: 'INTERNAL',
    action: 'lookup',
    authorized: true,
    guardianApproved: true,
    ...overrides,
  };
}

function baseReq(
  overrides: Partial<WormholeLookupRequest> & {
    workloadFingerprint: string;
    inputHash: string;
  },
): WormholeLookupRequest {
  return {
    auth: auth(),
    wormholeType: 'KNOWLEDGE_INDEX',
    nowIso: NOW,
    mode: 'LOCAL_FIRST',
    offline: false,
    hardwareAvailable: true,
    ...overrides,
  };
}

function registerFreshCompatible(inputPayload = 'payload-compatible'): XivWormholeRoute {
  return registerWormhole({
    wormholeId: 'wh-compatible-1',
    wormholeType: 'KNOWLEDGE_INDEX',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'src/index',
    destinationRef: 'dst/result',
    inputPayload,
    payloadDigest: createHash('sha256').update(inputPayload).digest('hex'),
    dataClass: 'INTERNAL',
    purpose: 'research',
    freshness: 'FRESH',
    ttlExpiryIso: '2026-09-12T00:00:00.000Z',
    evidenceRefs: ['ev-1'],
    highwayState: 'MEASURED',
    confidence: 0.7,
    compiledArtifactTrusted: true,
    nowIso: NOW,
  });
}

test('setup clears registry', () => {
  clearWormholeRegistry();
  assert.equal(WORMHOLE_TYPES.length, 17);
  assert.match(HONESTY_BANNER, /authorization/i);
});

test('1. exact compatible fresh cache → WORMHOLE_ELIGIBLE', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible();
  const state = createRouterState();
  const req = baseReq({
    workloadFingerprint: route.workloadFingerprint,
    inputHash: route.inputHash,
  });
  const out = lookupWormhole(state, req);
  assert.equal(out.disposition, 'WORMHOLE_ELIGIBLE');
  assert.equal(out.guardianBypassed, false);
  assert.equal(out.authChecksPerformed, true);
  assert.ok(out.route);
  assert.equal(out.route.freshness, 'FRESH');
});

test('2. different input hash → NORMAL_PATH_REQUIRED', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('payload-a');
  const state = createRouterState();
  const req = baseReq({
    workloadFingerprint: route.workloadFingerprint,
    inputHash: computeInputHash('payload-b-different'),
    wormholeType: route.wormholeType,
  });
  // Force lookup against registered id with mismatched hash
  const out = lookupWormhole(state, req, { wormholeId: route.wormholeId });
  assert.equal(out.disposition, 'NORMAL_PATH_REQUIRED');
  assert.equal(out.fallback, 'NORMAL_PATH');
});

test('3. stale runtime invalidates shortcut preference', () => {
  clearWormholeRegistry();
  const route = registerWormhole({
    wormholeId: 'wh-stale',
    wormholeType: 'RUNTIME_SESSION',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'rt',
    destinationRef: 'rt',
    inputPayload: 'rt-1',
    payloadDigest: 'd1',
    dataClass: 'INTERNAL',
    purpose: 'research',
    freshness: 'STALE',
    nowIso: NOW,
  });
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      wormholeType: 'RUNTIME_SESSION',
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
  );
  assert.equal(out.disposition, 'NORMAL_PATH_REQUIRED');
  assert.match(out.reason, /STALE/);
  assert.equal(EX18_LOCKS.STALE_EQ_VERIFIED, false);
});

test('4. revoked source invalidates shortcut', () => {
  clearWormholeRegistry();
  const route = registerWormhole({
    wormholeId: 'wh-revoked',
    wormholeType: 'KNOWLEDGE_INDEX',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'src',
    destinationRef: 'dst',
    inputPayload: 'rev',
    payloadDigest: 'd',
    dataClass: 'INTERNAL',
    purpose: 'research',
    freshness: 'REVOKED',
    nowIso: NOW,
  });
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
  );
  assert.equal(out.disposition, 'NORMAL_PATH_REQUIRED');
  assert.match(out.reason, /REVOKED|revoked/i);
});

test('5. invalid integrity hash → quarantine', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('integrity-payload');
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
    { wormholeId: route.wormholeId, providedIntegrityHash: 'deadbeef-bad-hash' },
  );
  assert.equal(out.disposition, 'QUARANTINED');
  assert.match(out.reason, /Integrity|quarantine/i);
});

test('6. cross-tenant DENIED', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('cross-t');
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      auth: auth({ tenantId: 'tenant-b' }),
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
      attemptCrossTenant: true,
    }),
    { wormholeId: route.wormholeId },
  );
  assert.equal(out.disposition, 'DENIED');
  assert.match(out.reason, /[Cc]ross-tenant/);
});

test('7. cross-Universe DENIED', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('cross-u');
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      auth: auth({ universeId: 'universe-b' }),
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
      attemptCrossUniverse: true,
    }),
    { wormholeId: route.wormholeId },
  );
  assert.equal(out.disposition, 'DENIED');
  assert.match(out.reason, /[Cc]ross-Universe|[Cc]ross-universe/);
});

test('8. simulator cache remains SIMULATED_QUANTUM', () => {
  clearWormholeRegistry();
  const route = registerWormhole({
    wormholeId: 'wh-sim',
    wormholeType: 'SIMULATION_RESULT_CACHE',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'sim',
    destinationRef: 'sim-out',
    inputPayload: 'sim-1',
    payloadDigest: 's',
    dataClass: 'INTERNAL',
    purpose: 'research',
    quantumTruthLabel: 'SIMULATED_QUANTUM',
    freshness: 'FRESH',
    nowIso: NOW,
  });
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      wormholeType: 'SIMULATION_RESULT_CACHE',
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
  );
  assert.equal(out.disposition, 'WORMHOLE_ELIGIBLE');
  assert.equal(out.quantumTruthLabel, 'SIMULATED_QUANTUM');
  assert.equal(EX18_LOCKS.SIMULATED_EQ_PHYSICAL_QPU, false);
});

test('9. previous QPU receipt cannot verify new QPU run', () => {
  clearWormholeRegistry();
  const route = registerWormhole({
    wormholeId: 'wh-qpu-hist',
    wormholeType: 'CHECKPOINT_RESUME',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'qpu',
    destinationRef: 'qpu',
    inputPayload: 'qpu-1',
    payloadDigest: 'q',
    dataClass: 'INTERNAL',
    purpose: 'research',
    quantumTruthLabel: 'PHYSICAL_QPU_HISTORICAL',
    historicalQpuOnly: true,
    freshness: 'FRESH',
    nowIso: NOW,
  });
  const v = physicalQpuVerificationFromHistorical(route);
  assert.equal(v.verified, false);
  assert.equal(v.label, 'PHYSICAL_QPU_HISTORICAL');
  assert.equal(v.needsNewEvidence, true);
  assert.equal(EX18_LOCKS.HISTORICAL_QPU_EQ_NEW_PHYSICAL_VERIFIED, false);
});

test('10. warm-model session rechecks authorization', () => {
  clearWormholeRegistry();
  const route = registerWormhole({
    wormholeId: 'wh-warm',
    wormholeType: 'WARM_MODEL_SESSION',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'model',
    destinationRef: 'session',
    inputPayload: 'warm-1',
    payloadDigest: 'w',
    dataClass: 'INTERNAL',
    purpose: 'research',
    freshness: 'FRESH',
    nowIso: NOW,
  });
  const state = createRouterState();
  const denied = lookupWormhole(
    state,
    baseReq({
      wormholeType: 'WARM_MODEL_SESSION',
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
      auth: auth({ authorized: false, guardianApproved: false }),
    }),
  );
  assert.equal(denied.disposition, 'DENIED');

  const ok = lookupWormhole(
    state,
    baseReq({
      wormholeType: 'WARM_MODEL_SESSION',
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
  );
  assert.equal(ok.disposition, 'WORMHOLE_ELIGIBLE');
  assert.equal(ok.route?.warmSessionAuthRecheckRequired, true);
  assert.equal(EX18_LOCKS.STALE_SESSION_PRIVILEGE_INHERITANCE, false);
});

test('11. hardware unavailable → fallback normally', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('hw');
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
      hardwareAvailable: false,
    }),
  );
  assert.equal(out.disposition, 'FALLBACK_NORMAL');
  assert.equal(out.fallback, 'NORMAL_PATH');
});

test('12. offline web → WAITING_DATA', () => {
  clearWormholeRegistry();
  const state = createRouterState();
  const fp = computeWorkloadFingerprint({
    tenantId: TENANT,
    universeId: UNIVERSE,
    wormholeType: 'KNOWLEDGE_INDEX',
    inputPayload: 'x',
  });
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: fp,
      inputHash: computeInputHash('x'),
      offline: true,
      requiresLiveWeb: true,
    }),
  );
  assert.equal(out.disposition, 'WAITING_DATA');
  assert.equal(out.waitingKind, 'WAITING_DATA');
});

test('13. offline provider → WAITING_PROVIDER', () => {
  clearWormholeRegistry();
  const state = createRouterState();
  const fp = computeWorkloadFingerprint({
    tenantId: TENANT,
    universeId: UNIVERSE,
    wormholeType: 'KNOWLEDGE_INDEX',
    inputPayload: 'y',
  });
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: fp,
      inputHash: computeInputHash('y'),
      offline: true,
      requiresProvider: true,
    }),
  );
  assert.equal(out.disposition, 'WAITING_PROVIDER');
  assert.equal(out.waitingKind, 'WAITING_PROVIDER');
});

test('14. failed shortcut creates evidence', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('fail-sc');
  const state = createRouterState();
  const receipt = recordShortcutFailure(state, route, LATER, 'timeout');
  assert.equal(receipt.failureEvidenceCreated, true);
  assert.ok(receipt.evidenceRefs.some((e) => e.includes('shortcut-failure')));
  assert.equal(receipt.disposition, 'AVOID_ROUTE_HINT');
  assert.equal(receipt.returnedToHomeBase, true);
});

test('15. shortcut regression lowers confidence', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('regr');
  const before = route.confidence;
  const state = createRouterState();
  const lookup = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
    }),
  );
  const { receipt } = completeWithReceipt(state, lookup, baseReq({
    workloadFingerprint: route.workloadFingerprint,
    inputHash: route.inputHash,
  }), {
    measured: true,
    baselineLatencyMs: 100,
    shortcutLatencyMs: 150,
    regressionDetected: true,
    comparable: true,
  });
  assert.equal(receipt.benefitState, 'REGRESSION');
  assert.ok(receipt.confidenceAfter < before);
});

test('16. cache hit never bypasses Guardian', () => {
  clearWormholeRegistry();
  const route = registerFreshCompatible('guard');
  const state = createRouterState();
  const out = lookupWormhole(
    state,
    baseReq({
      workloadFingerprint: route.workloadFingerprint,
      inputHash: route.inputHash,
      attemptBypassGuardian: true,
    }),
  );
  assert.equal(out.disposition, 'DENIED');
  assert.equal(out.guardianBypassed, false);
  assert.equal(cacheHitNeverBypassesAuthorization(), true);
  assert.equal(EX18_LOCKS.CACHE_HIT_BYPASSES_AUTHORIZATION, false);
});

test('17. measured benefit required for BENEFIT_VERIFIED', () => {
  assert.equal(
    verifyBenefit({
      measured: false,
      baselineLatencyMs: 100,
      shortcutLatencyMs: 50,
      regressionDetected: false,
      comparable: true,
    }),
    'NOT_TESTED',
  );
  assert.equal(
    verifyBenefit({
      measured: true,
      baselineLatencyMs: 100,
      shortcutLatencyMs: 50,
      regressionDetected: false,
      comparable: true,
    }),
    'BENEFIT_VERIFIED',
  );
  assert.equal(EX18_LOCKS.BENEFIT_VERIFIED_WITHOUT_MEASUREMENT, false);
});

test('18. learning cannot alter permissions', () => {
  clearWormholeRegistry();
  registerFreshCompatible('plast');
  const denied = applyPlasticityFeedback({
    wormholeId: 'wh-compatible-1',
    strengthen: true,
    atIso: NOW,
    attemptAlterPermissions: true,
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.permissionsAltered, false);
  const ok = applyPlasticityFeedback({
    wormholeId: 'wh-compatible-1',
    strengthen: true,
    atIso: NOW,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.permissionsAltered, false);
  assert.equal(EX18_LOCKS.PLASTICITY_ALTERS_PERMISSIONS, false);
  assert.equal(EX18_LOCKS.PLASTICITY_ALTERS_GUARDIAN, false);
  assert.equal(EX18_LOCKS.PLASTICITY_ALTERS_RLS, false);
});

test('19. L4_AUTONOMY_ENABLED=false', () => {
  assert.equal(ex18L4AutonomyEnabled(), false);
  assert.equal(EX18_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx18LocksIntact(), true);
  assert.equal(NEXT_PHASE_TITLE.includes('EX19'), true);
});

test('20. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx18(), true);
  assert.equal(EX18_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  const after = existsSync(GUARDIAN_DIR) ? hashGuardianTree(GUARDIAN_DIR) : 'ABSENT';
  assert.equal(after, GUARDIAN_HASH_BEFORE);

  const soft = auditEx18SoftWires();
  assert.equal(softWireAbsenceIsWaitingDataNotFail(soft), true);
  assert.equal(soft.guardian.verified, false);
  // Presence ≠ VERIFIED for all soft-wires
  for (const v of Object.values(soft)) {
    assert.equal(v.verified, false);
  }

  // DNA forbids private customer data
  clearWormholeRegistry();
  const privateRoute = registerWormhole({
    wormholeId: 'wh-private',
    wormholeType: 'PRECOMPUTED_EMBEDDING',
    tenantId: TENANT,
    universeId: UNIVERSE,
    sourceRef: 'emb',
    destinationRef: 'emb',
    inputPayload: 'private',
    payloadDigest: 'p',
    dataClass: 'PRIVATE_CUSTOMER',
    purpose: 'research',
    nowIso: NOW,
  });
  const dna = exportWormholeDna(privateRoute);
  assert.equal('denied' in dna && dna.denied, true);

  const state = createRouterState();
  assert.equal(scaleTelemetryMeasuredOnly(state), true);
  assert.equal(EX18_LOCKS.FAKE_SCALE_TELEMETRY, false);
  assert.equal(EX18_LOCKS.TIP_LAND, false);
  assert.equal(EX18_LOCKS.MANAGE_PULL_REQUEST, false);
});
