/**
 * Phase 2I-LA-02 Cloud Worker Deployment + Scheduler.
 * Deterministic. No network. L4 disabled. DEFAULT PERMISSIONS = NONE.
 * Architecture ≠ 24/7 LIVE. CLOUD_DEPLOYMENT honesty required.
 */
import assert from 'node:assert/strict';

import {
  architectureExistsMeans247Live,
  cloudWorkforceL4Enabled,
  FOUNDER_BRIEF_EMAIL,
} from './cloudworkforce';
import {
  activeFollowTheSunRegions,
  applyWorkerCrashRecovery,
  assignScheduleToCapableWorker,
  buildWhileYouWereAwayReport,
  collectCloudWorkerEvidence,
  connectModelRouter,
  createCloudAgentMessage,
  createSchedule,
  createSecretReference,
  deliverCloudAgentMessage,
  deployMinimalCloudWorker,
  detectCloudDeployment,
  enqueueDurable,
  evaluateAutoRecovery,
  evaluateCost,
  failDurable,
  followTheSunMeans247,
  identityHasAllTools,
  listDeadLetters,
  listSpecialtyWorkers,
  matchWorkerCapabilities,
  modelRouterMayBypassCost,
  nightShiftAllowsSilentProd,
  openAgentScheduler,
  openAgentWorkforceManager,
  openCloudAgentRuntime,
  openCloudWorkerAuditLog,
  openCostGovernor,
  openDurableCloudQueue,
  openFounderMissionControl,
  openGuardianDbPath,
  openHeartbeatMonitor,
  openNightShiftV1Runtime,
  openPhase2ilbGrounding,
  openWorkerPool,
  poolAutoScaleIsLive,
  provisionSpecialtyWorker,
  registerRuntimeWorker,
  recordWorkerHeartbeat,
  registerSchedule,
  requestGuardianDbQuery,
  resolveSecretValue,
  runCrashRecoveryAgainstLa01,
  runOfflineFounderTest,
  scalePool,
  SCHEDULE_KINDS,
  secretReferenceHoldsValue,
  spawnSpecialtyWorker,
  startRuntimeWorker,
  transitionWorkerProcess,
  tryStartNightShiftMission,
  workerMayHoldRawDbUrl,
  workforceRuns247,
} from './cloudworker';
import { appendAudit } from './cloudworker/audit';
import { claimDurable, ackDurable } from './cloudworker/durable-queue';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('grounding: L4 off; defaults NONE; architecture ≠ 24/7; brief email', () => {
  const g = openPhase2ilbGrounding();
  assert.equal(g.phase, '2I-LA-02');
  assert.equal(g.l4Enabled, false);
  assert.equal(g.defaultPermissions, 'NONE');
  assert.equal(g.architectureExistsIsNotLive247, true);
  assert.equal(g.runs247Live, false);
  assert.equal(g.indefinite247Claimed, false);
  assert.equal(g.unconfiguredAdapters, 'NOT_CONFIGURED');
  assert.equal(g.founderBriefEmail, 'devinhaynes2025@gmail.com');
  assert.equal(g.founderBriefEmail, FOUNDER_BRIEF_EMAIL);
  assert.equal(cloudWorkforceL4Enabled(), false);
  assert.equal(architectureExistsMeans247Live(), false);
});

test('deployment honesty: unverified cloud BLOCKED; local READY; no false RUNNING', () => {
  const aws = detectCloudDeployment('AWS_ECS');
  assert.equal(aws.status, 'NOT_CONFIGURED');
  assert.equal(aws.cloudDeployment, 'BLOCKED');
  assert.ok(aws.blocker && aws.blocker.length > 0);
  assert.equal(aws.runs247Live, false);

  const local = detectCloudDeployment('LOCAL_PROCESS');
  assert.equal(local.status, 'CONFIGURED');
  assert.equal(local.cloudDeployment, 'READY');

  const minimal = deployMinimalCloudWorker({ preferredProvider: 'AWS_ECS' });
  assert.equal(minimal.deployed, false);
  assert.equal(minimal.cloudDeployment, 'BLOCKED');
  assert.equal(minimal.workerInstanceId, null);
});

test('CloudAgentRuntime + lifecycle + identity', () => {
  const rt = openCloudAgentRuntime({ runtimeId: 'rt1' });
  assert.equal(rt.l4Enabled, false);
  assert.equal(rt.runs247Live, false);
  const id = spawnSpecialtyWorker({
    role: 'ENGINEERING',
    workerId: 'w-eng',
    instanceId: 'i1',
    tenantId: 't1',
    universeId: 'u1',
  });
  assert.equal(identityHasAllTools(id), false);
  assert.equal(id.defaultPermissions, 'NONE');

registerRuntimeWorker(rt, {
    workerId: id.workerId,
    instanceId: id.instanceId,
    role: id.agentRole,
    tenantId: id.tenantId,
    universeId: id.universeId,
    capabilities: id.capabilities,
  });
  const started = startRuntimeWorker(rt, id.workerId);
  assert.equal(started.ok, true);
  if (started.ok) assert.equal(started.state, 'HEALTHY');

  const crash = transitionWorkerProcess('HEALTHY', 'CRASH');
  assert.equal(crash.ok, true);
  const recovered = applyWorkerCrashRecovery({ state: 'HEALTHY' });
  assert.equal(recovered.ok, true);
  if (recovered.ok) assert.equal(recovered.state, 'HEALTHY');
});

test('scheduler: schedule kinds + capability matching', () => {
  assert.ok(SCHEDULE_KINDS.includes('FOLLOW_THE_SUN'));
  assert.ok(SCHEDULE_KINDS.includes('NIGHT_SHIFT'));
  const scheduler = openAgentScheduler();
  const schedule = createSchedule({
    scheduleId: 's1',
    kind: 'ON_DEMAND',
    requiredCapabilities: ['research'],
    preferredRoles: ['RESEARCH'],
  });
  registerSchedule(scheduler, schedule);
  const research = spawnSpecialtyWorker({
    role: 'RESEARCH',
    workerId: 'w-r',
    instanceId: 'i',
    tenantId: 't1',
    universeId: 'u1',
  });
  const qa = spawnSpecialtyWorker({
    role: 'QA',
    workerId: 'w-q',
    instanceId: 'i',
    tenantId: 't1',
    universeId: 'u1',
  });
  const match = matchWorkerCapabilities(schedule, [research, qa]);
  assert.equal(match.ok, true);
  if (match.ok) assert.equal(match.workerId, 'w-r');
});

test('worker pools + follow-the-sun + specialty roster', () => {
  const pool = openWorkerPool({
    poolId: 'p1',
    roles: ['RESEARCH'],
    desiredSize: 2,
    maxSize: 4,
  });
  assert.equal(poolAutoScaleIsLive(pool), false);
  const scaled = scalePool(pool, 3);
  assert.equal(scaled.pool.desiredSize, 3);
  assert.equal(scaled.pool.autoScaleLive, false);

  const active = activeFollowTheSunRegions(14);
  assert.ok(active.some((r) => r.regionId === 'americas'));
  assert.equal(followTheSunMeans247(), false);

  assert.equal(listSpecialtyWorkers().length, 6);
});

test('Night Shift V1 safe limits', () => {
  const ns = openNightShiftV1Runtime();
  assert.equal(ns.limits.allowSilentProdDeploy, false);
  assert.equal(ns.limits.allowL4, false);
  assert.equal(nightShiftAllowsSilentProd(), false);
  const deny = tryStartNightShiftMission(ns, 'SILENT_PRODUCTION_DEPLOY');
  assert.equal(deny.ok, false);
  const ok = tryStartNightShiftMission(ns, 'RESEARCH_SUMMARY');
  assert.equal(ok.ok, true);
});

test('durable queue + DLQ', () => {
  const q = openDurableCloudQueue('IN_PROCESS_DURABLE');
  assert.equal(q.lifecycle, 'CONFIGURED');
  const cloud = openDurableCloudQueue('AWS_SQS');
  assert.equal(cloud.lifecycle, 'NOT_CONFIGURED');

  enqueueDurable(q, {
    messageId: 'm1',
    missionId: 'mission-1',
    payloadCursor: 'c0',
    nowIso: '2026-09-08T04:00:00.000Z',
    maxAttempts: 1,
  });
  const claimed = claimDurable(q, '2026-09-08T04:00:00.000Z');
  assert.ok(claimed);
  const dead = failDurable(q, {
    messageId: 'm1',
    reason: 'boom',
    nowIso: '2026-09-08T04:01:00.000Z',
  });
  assert.equal(dead.deadLettered, true);
  assert.equal(listDeadLetters(q).length, 1);
  assert.equal(listDeadLetters(q)[0]?.autoReplay, false);
});

test('crash recovery against LA-01 + heartbeat auto-recovery', () => {
  const crash = runCrashRecoveryAgainstLa01();
  assert.equal(crash.passed, true);
  assert.equal(crash.resumedFromCheckpoint, true);
  assert.equal(crash.progressCursor, 'la02-mid');

  const mon = openHeartbeatMonitor(2);
  recordWorkerHeartbeat(mon, { workerId: 'w1', at: 't1', healthy: false });
  const s2 = recordWorkerHeartbeat(mon, { workerId: 'w1', at: 't2', healthy: false });
  assert.equal(s2.missedBeats, 2);
  const action = evaluateAutoRecovery({
    workerId: 'w1',
    state: 'UNHEALTHY',
    missedBeats: 2,
    missThreshold: 2,
    missionId: 'm1',
  });
  assert.equal(action.kind, 'REQUEUE_MISSION');
});

test('Guardian DB path + SecretReference', () => {
  const db = openGuardianDbPath();
  assert.equal(workerMayHoldRawDbUrl(db), false);
  assert.equal(db.requiresGuardianBroker, true);
  const q = requestGuardianDbQuery(db, { workerId: 'w1', sqlFingerprint: 'select1' });
  assert.equal(q.ok, true);

  const secret = createSecretReference({ secretId: 's1', name: 'X', provider: 'CLOUD_SECRET_MANAGER' });
  assert.equal(secret.resolved, false);
  assert.equal(secret.lifecycle, 'NOT_CONFIGURED');
  assert.equal(secretReferenceHoldsValue(secret), false);
  assert.throws(() => resolveSecretValue(secret));
});

test('cost governor + model router connection', () => {
  const cost = openCostGovernor({ budgetRemaining: 10, computeLevel: 'NORMAL' });
  const ok = evaluateCost(cost, 3);
  assert.equal(ok.allowed, true);
  const deny = evaluateCost(cost, 50);
  assert.equal(deny.allowed, false);
  assert.equal(deny.selfExpandable, false);

  const router = connectModelRouter();
  assert.equal(router.connected, true);
  assert.equal(router.lifecycle, 'CONFIGURED');
  assert.equal(modelRouterMayBypassCost(router), false);
});

test('AgentWorkforceManager + communication + founder surfaces', () => {
  const mgr = openAgentWorkforceManager();
  assert.equal(workforceRuns247(mgr), false);
  assert.equal(mgr.l4Enabled, false);
  for (const role of ['RESEARCH', 'ENGINEERING', 'QA', 'SECURITY', 'DATABASE', 'KNOWLEDGE'] as const) {
    const p = provisionSpecialtyWorker(mgr, {
      role,
      workerId: `w-${role}`,
      instanceId: `i-${role}`,
      tenantId: 't1',
      universeId: 'u1',
    });
    assert.equal(p.ok, true);
  }
  const assign = assignScheduleToCapableWorker(mgr, 'fts-americas');
  assert.equal(assign.ok, true);

  const msg = createCloudAgentMessage({
    messageId: 'c1',
    fromWorkerId: 'w-RESEARCH',
    toWorkerId: 'w-QA',
    tenantId: 't1',
    universeId: 'u1',
    kind: 'STATUS',
    body: 'ok',
  });
  const delivered = deliverCloudAgentMessage(msg, {
    fromTenantId: 't1',
    fromUniverseId: 'u1',
    toTenantId: 't1',
    toUniverseId: 'u1',
  });
  assert.equal(delivered.ok, true);
  const cross = deliverCloudAgentMessage(msg, {
    fromTenantId: 't1',
    fromUniverseId: 'u1',
    toTenantId: 't2',
    toUniverseId: 'u1',
  });
  assert.equal(cross.ok, false);

  const mc = openFounderMissionControl(mgr, { cloudWorkerVerified: false });
  assert.equal(mc.title, 'Founder Mission Control');
  assert.equal(mc.runs247Live, false);
  assert.equal(mc.founderBriefEmail, 'devinhaynes2025@gmail.com');
  assert.equal(mc.workers.length, 6);

  const away = buildWhileYouWereAwayReport({
    completedMissionIds: ['m1'],
    recoveredCrashes: 1,
    cloudWorkerVerified: false,
  });
  assert.equal(away.productionDeployedOvernight, false);
  assert.equal(away.agentsRan24x7Live, false);
});

test('offline founder test + evidence honesty', () => {
  const offline = runOfflineFounderTest();
  assert.equal(offline.passed, true);
  assert.equal(offline.cloudWorkerVerified, true);
  assert.equal(offline.indefinite247, false);
  assert.equal(offline.runs247Live, false);
  assert.equal(offline.ideRequired, false);

  const evidence = collectCloudWorkerEvidence();
  assert.equal(evidence.phase, '2I-LA-02');
  assert.equal(evidence.cloudDeployment, 'BLOCKED');
  assert.ok(evidence.cloudDeploymentBlocker);
  assert.equal(evidence.providerStatus, 'NOT_CONFIGURED');
  assert.equal(evidence.cloudWorkerVerified, true);
  assert.equal(evidence.offlineFounderTestPassed, true);
  assert.equal(evidence.crashRecoveryTestPassed, true);
  assert.equal(evidence.runs247Live, false);
  assert.equal(evidence.indefinite247Claimed, false);
  assert.equal(evidence.l4Enabled, false);
  assert.equal(evidence.defaultPermissions, 'NONE');
  assert.equal(evidence.founderBriefEmail, 'devinhaynes2025@gmail.com');
  assert.ok(evidence.mappedLa01Agents.includes('night_research'));

  const audit = openCloudWorkerAuditLog();
  appendAudit(audit, {
    eventId: 'e1',
    at: 't',
    kind: 'DEPLOY_BLOCKED',
    detail: evidence.cloudDeploymentBlocker ?? 'blocked',
  });
  assert.equal(audit.events.length, 1);
});

console.log('phase2ilb: all tests passed');
