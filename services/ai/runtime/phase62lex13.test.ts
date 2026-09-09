/**
 * 62L-EX13 — Quantum Pathway Plasticity + Hybrid Application Feedback Loop.
 * Script: npm run test:62lex13
 * Deterministic. No network. No real QPU. No cloud purchase.
 * Do not report unrun tests as PASS. L4 remains false.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  EX13_LOCKS,
  HONESTY_BANNER,
  INFRA_METAPHORS,
  NEXT_PHASE_TITLE,
  agentHouseExecutionHome,
  applyNegativeLoop,
  applyPositiveLoop,
  assertEx13LocksIntact,
  attemptSyncBeforeValidate,
  auditEx13SoftWires,
  beginReconnect,
  beginRunning,
  claimRunningVerified,
  closeApplication,
  cloudSixTbTarget,
  consciousnessClaimedAsVerified,
  createFeedbackEvent,
  createHeartbeatGrid,
  createLifecycleRuntime,
  createPlasticPathway,
  defensiveCyberOnly,
  defaultOpenProbes,
  evaluateContinuousOps,
  ex13L4AutonomyEnabled,
  guardianRlsUnchangedByEx13,
  isSecondAgentSystem,
  isRunningVerified,
  markPoweredOff,
  matureCommunityHooksPrepared,
  onNetworkLoss,
  openApplication,
  platformTestMatrix,
  processFeedbackEvent,
  recordCpuFallbackEvidence,
  recordForcedCloseOrCrash,
  recoverOnNextLaunch,
  rejectedCannotStrengthen,
  softWireAbsenceIsWaitingDataNotFail,
  superintelligenceClaimedAsVerified,
  validateBeforeSync,
  xivVirtualChipFeedbackPrep,
  beat,
  type CheckpointRecord,
} from './lifecycle/index.ts';

const NOW = '2026-09-09T22:57:00.000Z';
const LATER = '2026-09-09T22:58:30.000Z'; // > 30s stale for default TTL
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

const GUARDIAN_HASH_BEFORE = existsSync(GUARDIAN_DIR) ? hashGuardianTree(GUARDIAN_DIR) : 'ABSENT';

const TENANT = 'tenant-a';
const UNIVERSE = 'universe-a';

function openOnlineRuntime() {
  let rt = createLifecycleRuntime({ tenantId: TENANT, universeId: UNIVERSE });
  rt = openApplication(rt, {
    probes: defaultOpenProbes({ networkAvailable: true, localCapable: true }),
    networkAvailable: true,
    localCapable: true,
    nowIso: NOW,
  });
  return rt;
}

test('1. online launch truthful state ONLINE_READY with evidence', () => {
  const rt = openOnlineRuntime();
  assert.equal(rt.state, 'ONLINE_READY');
  assert.ok(rt.evidenceIds.length > 0);
  assert.match(HONESTY_BANNER, /EVIDENCE/);
});

test('2. offline launch OFFLINE_READY where permitted', () => {
  let rt = createLifecycleRuntime({ tenantId: TENANT, universeId: UNIVERSE });
  rt = openApplication(rt, {
    probes: defaultOpenProbes({ networkAvailable: false, localCapable: true }),
    networkAvailable: false,
    localCapable: true,
    nowIso: NOW,
  });
  assert.equal(rt.state, 'OFFLINE_READY');
  assert.equal(rt.networkAvailable, false);
  assert.equal(rt.localCapable, true);
});

test('3. clean close checkpoint then stop OFFLINE_STOPPED', () => {
  let rt = openOnlineRuntime();
  rt = beginRunning(rt, 'LOCAL');
  const { runtime, receipt } = closeApplication(rt, NOW);
  assert.equal(runtime.state, 'OFFLINE_STOPPED');
  assert.ok(runtime.checkpoint);
  assert.equal(receipt.evidenceFlushed, true);
  assert.equal(receipt.agentsContinueAfterTerminate, false);
  assert.equal(receipt.toState, 'OFFLINE_STOPPED');
});

test('4. crash incomplete shutdown evidence', () => {
  let rt = openOnlineRuntime();
  const { runtime, failure } = recordForcedCloseOrCrash(rt, NOW, {
    checkpointFlushed: false,
    evidenceFlushed: false,
  });
  assert.equal(runtime.state, 'CRASHED');
  assert.equal(failure.incompleteShutdown, true);
  assert.equal(failure.checkpointFlushed, false);
  assert.equal(runtime.lastFailure?.failureId, failure.failureId);
});

test('5. restart checkpoint validation', () => {
  let rt = openOnlineRuntime();
  const { runtime: closed } = closeApplication(rt, NOW);
  const ckpt = closed.checkpoint as CheckpointRecord;
  let next = createLifecycleRuntime({ tenantId: TENANT, universeId: UNIVERSE });
  const recovered = recoverOnNextLaunch(next, ckpt, NOW);
  assert.equal(recovered.verdict, 'RECOVERED');
  assert.ok(['ONLINE_READY', 'OFFLINE_READY'].includes(recovered.runtime.state));

  // Incomplete crash without checkpoint → RESTART_REQUIRED / BLOCKED
  let crashed = openOnlineRuntime();
  const crash = recordForcedCloseOrCrash(crashed, NOW, {
    checkpointFlushed: false,
    evidenceFlushed: false,
  });
  const bad = recoverOnNextLaunch(crash.runtime, null, NOW);
  assert.ok(bad.verdict === 'BLOCKED' || bad.verdict === 'RESTART_REQUIRED');
});

test('6. network loss web tasks WAITING_DATA', () => {
  let rt = openOnlineRuntime();
  rt = beginRunning(rt, 'HYBRID');
  const lost = onNetworkLoss(rt, 'WEB_API');
  assert.equal(lost.taskDisposition, 'WAITING_DATA');
  assert.equal(lost.runtime.state, 'WAITING_DATA');
});

test('7. reconnect validation before sync', () => {
  let rt = openOnlineRuntime();
  rt = onNetworkLoss(rt, 'WEB_API').runtime;
  rt = beginReconnect(rt);
  assert.equal(rt.state, 'RECONNECTING');
  assert.equal(rt.syncAllowed, false);

  const early = attemptSyncBeforeValidate(rt);
  assert.equal(early.allowed, false);
  assert.equal(early.reason, 'SYNC_BEFORE_VALIDATE_DENIED');

  const deniedOrder = validateBeforeSync(rt, {
    reauthOk: true,
    deviceOk: true,
    tenantOk: true,
    universeOk: true,
    revocationsCheckedFirst: false,
    integrityOk: true,
    dedupeOk: true,
    contradictionsReviewed: true,
    freshnessOk: true,
    auditOk: true,
  });
  assert.equal(deniedOrder.syncCandidate, false);
  assert.match(deniedOrder.reason, /REVOCATIONS/);

  const ok = validateBeforeSync(rt, {
    reauthOk: true,
    deviceOk: true,
    tenantOk: true,
    universeOk: true,
    revocationsCheckedFirst: true,
    integrityOk: true,
    dedupeOk: true,
    contradictionsReviewed: true,
    freshnessOk: true,
    auditOk: true,
  });
  assert.equal(ok.syncCandidate, true);
  assert.equal(ok.runtime.state, 'ONLINE_READY');
  assert.equal(ok.runtime.syncAllowed, true);
});

test('8. stale heartbeat not RUNNING_VERIFIED', () => {
  let grid = createHeartbeatGrid();
  grid = beat(grid, 'APPLICATION', NOW, 30_000, 'ev-app');
  assert.equal(isRunningVerified(grid, 'APPLICATION', NOW), true);
  const staleClaim = claimRunningVerified(grid, 'APPLICATION', LATER);
  assert.equal(staleClaim.allowed, false);
  assert.equal(staleClaim.status, 'STALE');
  assert.match(staleClaim.reason, /STALE_HEARTBEAT/);
  assert.equal(isRunningVerified(grid, 'APPLICATION', LATER), false);
});

test('9. failed GPU route weakens only that route', () => {
  const gpu = createPlasticPathway({
    pathwayId: 'p-gpu',
    routeId: 'route-gpu',
    device: 'GPU',
    tenantId: TENANT,
    universeId: UNIVERSE,
    weight: 0.7,
  });
  const cpu = createPlasticPathway({
    pathwayId: 'p-cpu',
    routeId: 'route-cpu',
    device: 'CPU',
    tenantId: TENANT,
    universeId: UNIVERSE,
    weight: 0.6,
  });
  const event = createFeedbackEvent({
    eventId: 'fb-gpu-fail',
    source: 'ROUTE_OUTCOME',
    tenantId: TENANT,
    universeId: UNIVERSE,
    observedAt: NOW,
    requestedDevice: 'GPU',
    actualDevice: 'GPU',
    outcome: 'FAIL',
    evidenceIds: ['ev-gpu-fail'],
    evidenceAccepted: true,
    evidenceRejected: false,
    evidenceRevoked: false,
    structuredRationale: 'GPU route failed measured',
  });
  const weakened = applyNegativeLoop(gpu, event, 'GPU');
  assert.equal(weakened.allowed, true);
  assert.ok(weakened.pathway.weight < gpu.weight);
  assert.match(weakened.reason, /GPU/);

  const cpuUntouched = applyNegativeLoop(cpu, event, 'GPU');
  assert.equal(cpuUntouched.allowed, false);
  assert.equal(cpuUntouched.pathway.weight, cpu.weight);
  assert.match(cpuUntouched.reason, /SCOPED_TO_FAILED_DEVICE/);
});

test('10. CPU fallback updates CPU evidence', () => {
  const cpu = createPlasticPathway({
    pathwayId: 'p-cpu-fb',
    routeId: 'route-cpu-fb',
    device: 'CPU',
    tenantId: TENANT,
    universeId: UNIVERSE,
    weight: 0.5,
  });
  const npuPath = createPlasticPathway({
    pathwayId: 'p-npu',
    routeId: 'route-npu',
    device: 'NPU',
    tenantId: TENANT,
    universeId: UNIVERSE,
    weight: 0.5,
  });
  const event = createFeedbackEvent({
    eventId: 'fb-fallback',
    source: 'DEVICE_TELEMETRY',
    tenantId: TENANT,
    universeId: UNIVERSE,
    observedAt: NOW,
    requestedDevice: 'NPU',
    actualDevice: 'CPU',
    outcome: 'RECOVERED',
    evidenceIds: ['ev-cpu-fallback'],
    evidenceAccepted: true,
    evidenceRejected: false,
    evidenceRevoked: false,
    structuredRationale: 'Requested NPU; actual CPU fallback',
  });
  const cpuUp = recordCpuFallbackEvidence(cpu, event);
  assert.equal(cpuUp.allowed, true);
  assert.equal(cpuUp.actualDeviceEvidence, 'CPU');
  assert.ok(cpuUp.pathway.weight > cpu.weight);

  const npuNo = applyPositiveLoop(npuPath, event);
  assert.equal(npuNo.allowed, false);
  assert.match(npuNo.reason, /FALLBACK_HONESTY|REQUESTED_NPU/);
});

test('11. rejected evidence cannot strengthen pathway', () => {
  const path = createPlasticPathway({
    pathwayId: 'p-rej',
    routeId: 'r-rej',
    device: 'CPU',
    tenantId: TENANT,
    universeId: UNIVERSE,
  });
  const event = createFeedbackEvent({
    eventId: 'fb-rej',
    source: 'ROUTE_OUTCOME',
    tenantId: TENANT,
    universeId: UNIVERSE,
    observedAt: NOW,
    outcome: 'SUCCESS',
    evidenceIds: ['ev-rej'],
    evidenceAccepted: false,
    evidenceRejected: true,
    evidenceRevoked: false,
    structuredRationale: 'rejected evidence',
  });
  const result = rejectedCannotStrengthen(path, event);
  assert.equal(result.allowed, false);
  assert.match(result.reason, /REJECTED/);
});

test('12. lifecycle feedback cannot alter permissions', () => {
  const event = createFeedbackEvent({
    eventId: 'fb-perm',
    source: 'APPLICATION_LIFECYCLE',
    tenantId: TENANT,
    universeId: UNIVERSE,
    observedAt: NOW,
    outcome: 'SUCCESS',
    evidenceIds: ['ev-1'],
    evidenceAccepted: true,
    evidenceRejected: false,
    evidenceRevoked: false,
    mayAlterPermissions: true,
    structuredRationale: 'attempt permission change',
  });
  const result = processFeedbackEvent(event, { tenantId: TENANT, universeId: UNIVERSE });
  assert.equal(result.disposition, 'DENIED');
  assert.match(result.reason, /CANNOT_ALTER_PERMISSIONS/);
  assert.equal(result.permissionsChanged, false);
  assert.equal(result.guardianChanged, false);
  assert.equal(result.rlsChanged, false);
  assert.equal(EX13_LOCKS.LIFECYCLE_ALTERS_PERMISSIONS, false);
});

test('13. cross-tenant feedback DENIED', () => {
  const event = createFeedbackEvent({
    eventId: 'fb-xt',
    source: 'USER_EXPLICIT',
    tenantId: 'tenant-b',
    universeId: UNIVERSE,
    observedAt: NOW,
    outcome: 'USER_POSITIVE',
    evidenceIds: ['ev-1'],
    evidenceAccepted: true,
    evidenceRejected: false,
    evidenceRevoked: false,
    structuredRationale: 'cross tenant',
  });
  const result = processFeedbackEvent(event, { tenantId: TENANT, universeId: UNIVERSE });
  assert.equal(result.disposition, 'DENIED');
  assert.match(result.reason, /CROSS_TENANT/);
});

test('14. cross-Universe feedback DENIED', () => {
  const event = createFeedbackEvent({
    eventId: 'fb-xu',
    source: 'USER_EXPLICIT',
    tenantId: TENANT,
    universeId: 'universe-b',
    observedAt: NOW,
    outcome: 'USER_POSITIVE',
    evidenceIds: ['ev-1'],
    evidenceAccepted: true,
    evidenceRejected: false,
    evidenceRevoked: false,
    structuredRationale: 'cross universe',
  });
  const result = processFeedbackEvent(event, { tenantId: TENANT, universeId: UNIVERSE });
  assert.equal(result.disposition, 'DENIED');
  assert.match(result.reason, /CROSS_UNIVERSE/);
});

test('15. restricted data DENIED/QUARANTINED', () => {
  const restricted = processFeedbackEvent(
    createFeedbackEvent({
      eventId: 'fb-rest',
      source: 'AGENT_HEARTBEAT',
      tenantId: TENANT,
      universeId: UNIVERSE,
      observedAt: NOW,
      outcome: 'NEUTRAL',
      evidenceIds: ['ev-r'],
      evidenceAccepted: true,
      evidenceRejected: false,
      evidenceRevoked: false,
      dataClass: 'RESTRICTED',
      structuredRationale: 'restricted',
    }),
    { tenantId: TENANT, universeId: UNIVERSE },
  );
  assert.equal(restricted.disposition, 'DENIED');

  const quarantined = processFeedbackEvent(
    createFeedbackEvent({
      eventId: 'fb-q',
      source: 'AGENT_HEARTBEAT',
      tenantId: TENANT,
      universeId: UNIVERSE,
      observedAt: NOW,
      outcome: 'NEUTRAL',
      evidenceIds: ['ev-q'],
      evidenceAccepted: true,
      evidenceRejected: false,
      evidenceRevoked: false,
      dataClass: 'QUARANTINE',
      structuredRationale: 'quarantine',
    }),
    { tenantId: TENANT, universeId: UNIVERSE },
  );
  assert.equal(quarantined.disposition, 'QUARANTINED');
});

test('16. powered-off node OFFLINE_STOPPED', () => {
  let rt = openOnlineRuntime();
  rt = markPoweredOff(rt);
  assert.equal(rt.state, 'OFFLINE_STOPPED');
  assert.equal(rt.powered, false);

  let cold = createLifecycleRuntime({ tenantId: TENANT, universeId: UNIVERSE, powered: false });
  cold = openApplication(cold, {
    probes: defaultOpenProbes({ networkAvailable: true, localCapable: true }),
    networkAvailable: true,
    localCapable: true,
    nowIso: NOW,
  });
  assert.equal(cold.state, 'OFFLINE_STOPPED');
});

test('17. 6TB cloud target NOT_PROVISIONED without evidence', () => {
  const target = cloudSixTbTarget();
  assert.equal(target.status, 'CAPACITY_TARGET_NOT_PROVISIONED');
  assert.equal(target.purchased, false);
  assert.equal(target.allocated, false);
  assert.equal(target.evidenceOfProvision, null);
  assert.equal(EX13_LOCKS.BUY_CLOUD_STORAGE_AUTONOMOUSLY, false);
  assert.equal(EX13_LOCKS.PROVISION_6TB_WITHOUT_EVIDENCE, false);

  const no247 = evaluateContinuousOps({
    poweredRuntime: false,
    schedulerPresent: true,
    storagePresent: true,
    authorizedSource: true,
  });
  assert.equal(no247.allowed, false);
});

test('18. L4 remains false', () => {
  assert.equal(ex13L4AutonomyEnabled(), false);
  assert.equal(EX13_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(assertEx13LocksIntact(), true);
  assert.equal(consciousnessClaimedAsVerified(), false);
  assert.equal(superintelligenceClaimedAsVerified(), false);
  assert.equal(isSecondAgentSystem(), false);
  assert.match(NEXT_PHASE_TITLE, /EX14/);
});

test('19. Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx13(), true);
  assert.equal(EX13_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX13_LOCKS.BROADEN_PERMISSIONS, false);
  if (existsSync(GUARDIAN_DIR)) {
    const after = hashGuardianTree(GUARDIAN_DIR);
    assert.equal(after, GUARDIAN_HASH_BEFORE);
  }
  // Soft-wire honesty + infra metaphors never auto-trusted
  const snap = auditEx13SoftWires();
  assert.equal(softWireAbsenceIsWaitingDataNotFail(snap), true);
  assert.equal(snap.agentMesh.verified, false);
  for (const m of INFRA_METAPHORS) {
    assert.equal(m.autoTrusted, false);
  }
  assert.equal(xivVirtualChipFeedbackPrep().physicalRebuild, false);
  assert.equal(agentHouseExecutionHome('house-1').secondAgentSystem, false);
  assert.equal(defensiveCyberOnly().offensiveAllowed, false);
  assert.equal(matureCommunityHooksPrepared().minimumAge, 18);
  const matrix = platformTestMatrix({ isLinux: process.platform === 'linux' });
  const android = matrix.find((r) => r.platform === 'ANDROID')!;
  assert.equal(android.verifiedInThisEnv, false);
});
