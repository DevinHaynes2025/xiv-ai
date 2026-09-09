/**
 * 62L-EW1–EW5 Offline Research Mission + Safe Web/TI + Branch/Return Mesh tests.
 * Deterministic. No network. Extends Agent Mesh — not a second framework.
 * L4 remains false. Do not report unrun tests as PASS.
 */
import assert from 'node:assert/strict';
import { createHandoff, openAgentRuntime } from './agentmesh';
import {
  acceptResearchChildReturn,
  advanceResearchMission,
  assertEwLocksIntact,
  auditEwSoftWires,
  completeResearchToHomeBase,
  conceptTranslations,
  createOfflineResearchMission,
  evaluateResearchHandoff,
  evaluateResearchSource,
  ewHiddenCotPersistenceAllowed,
  ewL4AutonomyEnabled,
  listApprovedOnlineSourceClasses,
  listDeniedResearchSourceClasses,
  listResearchRuntimeStates,
  probe61oHardening,
  probeGobOrchestration,
  spawnResearchChild,
  type OfflineResearchMission,
} from './agentmesh';

const NOW = '2026-09-09T22:00:00.000Z';
const FUTURE = '2026-12-31T00:00:00.000Z';
const PAST = '2026-01-01T00:00:00.000Z';

function baseMissionInput(overrides: Partial<Parameters<typeof createOfflineResearchMission>[0]> = {}) {
  return {
    missionId: 'm-ew-1',
    taskId: 't-parent-1',
    agentId: 'agent-research-1',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    approvedSourceClasses: ['PUBLIC_OPEN', 'OFFICIAL_SOURCE', 'LICENSED'] as const,
    allowedDataClasses: ['PUBLIC_REFERENCE', 'XIV_OWNED', 'EVIDENCE'] as const,
    computeBudget: 100,
    maxChildren: 2,
    expiry: FUTURE,
    evidenceRequirements: ['sourceRefs', 'evidenceClass', 'confidence'],
    returnPath: 'home-base://research/returns',
    now: NOW,
    ...overrides,
  };
}

function requireMission(result: ReturnType<typeof createOfflineResearchMission>): OfflineResearchMission {
  assert.equal(result.ok, true, result.ok === false ? result.reason : 'expected ok');
  assert.ok(result.mission);
  return result.mission;
}

// --- Required EW1–EW5 cases ---

{
  const result = createOfflineResearchMission(
    baseMissionInput({ requiresWebOrApi: true, verifiedConnection: false }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.state, 'WAITING_DATA');
  assert.equal(result.mission.state, 'WAITING_DATA');
  assert.match(result.ok === false ? result.reason : '', /WEB_OR_API_REQUIRED/);
  console.log('PASS: offline web-required task → WAITING_DATA (no fabricate)');
}

{
  const mission = requireMission(
    createOfflineResearchMission(
      baseMissionInput({ requiresWebOrApi: true, verifiedConnection: true }),
    ),
  );
  const allowed = evaluateResearchSource({
    sourceClass: 'PUBLIC_OPEN',
    missionApprovedClasses: mission.approvedSourceClasses,
  });
  assert.equal(allowed.disposition, 'ALLOWED');
  console.log('PASS: public authorized research source → allowed candidate');
}

{
  const mission = requireMission(createOfflineResearchMission(baseMissionInput()));
  const stolen = evaluateResearchSource({
    sourceClass: 'STOLEN_CREDENTIALS',
    missionApprovedClasses: mission.approvedSourceClasses,
  });
  assert.equal(stolen.disposition, 'QUARANTINED');
  const leaked = evaluateResearchSource({
    sourceClass: 'LEAKED_PRIVATE_DB',
    missionApprovedClasses: mission.approvedSourceClasses,
  });
  assert.equal(leaked.disposition, 'QUARANTINED');
  const illicit = evaluateResearchSource({
    sourceClass: 'ILLICIT_MARKETPLACE',
    missionApprovedClasses: mission.approvedSourceClasses,
  });
  assert.equal(illicit.disposition, 'QUARANTINED');
  console.log('PASS: restricted/stolen source → DENIED/QUARANTINED');
}

{
  const parent = requireMission(createOfflineResearchMission(baseMissionInput()));
  const expansion = spawnResearchChild(parent, {
    childTaskId: 't-child-expand',
    childAgentId: 'agent-child-1',
    parentTaskId: parent.taskId,
    tenantId: parent.tenantId,
    universeId: parent.universeId,
    approvedSourceClasses: ['PUBLIC_OPEN', 'OFFICIAL_SOURCE', 'LICENSED', 'PROVIDER_AUTHORIZED'],
    allowedDataClasses: parent.allowedDataClasses,
    computeBudget: 50,
    expiry: FUTURE,
    evidenceRequirements: ['sourceRefs'],
    returnPath: parent.returnPath,
  });
  assert.equal(expansion.allowed, false);
  if (expansion.allowed === false) {
    assert.match(expansion.reason, /PERMISSION_EXPANSION/);
  }
  const budgetExpand = spawnResearchChild(parent, {
    childTaskId: 't-child-budget',
    childAgentId: 'agent-child-2',
    parentTaskId: parent.taskId,
    tenantId: parent.tenantId,
    universeId: parent.universeId,
    approvedSourceClasses: ['PUBLIC_OPEN'],
    allowedDataClasses: parent.allowedDataClasses,
    computeBudget: 999,
    expiry: FUTURE,
    evidenceRequirements: ['sourceRefs'],
    returnPath: parent.returnPath,
  });
  assert.equal(budgetExpand.allowed, false);
  console.log('PASS: child permission expansion → DENIED');
}

{
  const handoff = evaluateResearchHandoff({
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-b',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-a',
  });
  assert.equal(handoff.allowed, false);
  if (handoff.allowed === false) {
    assert.equal(handoff.reason, 'CROSS_TENANT_HANDOFF_DENIED');
  }
  // Mesh handoff path remains deny-by-default for cross-tenant.
  const meshHandoff = createHandoff({
    handoffId: 'h1',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-b',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-a',
  });
  assert.equal(meshHandoff.allowed, false);
  console.log('PASS: cross-tenant handoff → DENIED');
}

{
  const handoff = evaluateResearchHandoff({
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-a',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-b',
  });
  assert.equal(handoff.allowed, false);
  if (handoff.allowed === false) {
    assert.equal(handoff.reason, 'CROSS_UNIVERSE_HANDOFF_DENIED');
  }
  const meshHandoff = createHandoff({
    handoffId: 'h2',
    fromAgentId: 'a1',
    toAgentId: 'a2',
    fromTenantId: 'tenant-a',
    toTenantId: 'tenant-a',
    fromUniverseId: 'universe-a',
    toUniverseId: 'universe-b',
  });
  assert.equal(meshHandoff.allowed, false);
  console.log('PASS: cross-Universe handoff → DENIED');
}

{
  const expired = createOfflineResearchMission(baseMissionInput({ expiry: PAST, now: NOW }));
  assert.equal(expired.ok, false);
  assert.equal(expired.state, 'BLOCKED');
  assert.match(expired.ok === false ? expired.reason : '', /EXPIRED/);

  const live = requireMission(createOfflineResearchMission(baseMissionInput()));
  const advanced = advanceResearchMission(live, { now: '2027-01-01T00:00:00.000Z' });
  assert.equal(advanced.ok, false);
  assert.equal(advanced.state, 'BLOCKED');
  console.log('PASS: expired research task → stopped');
}

{
  const mission = requireMission(
    createOfflineResearchMission(
      baseMissionInput({ requiresWebOrApi: false, verifiedConnection: false }),
    ),
  );
  assert.equal(mission.state, 'LOCAL_READY');
  const running = advanceResearchMission(mission, { markRunningVerified: true });
  assert.equal(running.ok, true);
  assert.equal(running.mission.state, 'RUNNING_VERIFIED');

  const done = completeResearchToHomeBase(running.mission, {
    finding: 'Local pack synthesis complete; no live web claims.',
    sourceRefs: ['offline-pack:XIV_CORE#ref-1'],
    evidenceClass: 'LOCAL_PACK',
    confidence: 0.72,
    contradictions: [],
    tests: ['ew_home_base_receipt_shape'],
    blockers: [],
    candidateLesson: 'Prefer offline packs when web unavailable.',
    nextExperiment: 'Re-run with verified connection for PUBLIC_OPEN refresh.',
    returnedAt: NOW,
  });
  assert.equal(done.allowed, true);
  if (done.allowed) {
    assert.equal(done.receipt.state, 'COMPLETED');
    assert.equal(done.mission.state, 'COMPLETED');
    assert.equal(done.receipt.returnPath, mission.returnPath);
    assert.equal(done.receipt.hiddenCotPersisted, false);
    assert.equal(done.receipt.l4Enabled, false);
    assert.equal(done.receipt.tenantId, 'tenant-a');
    assert.equal(done.receipt.universeId, 'universe-a');
    assert.ok(done.receipt.finding.length > 0);
    assert.ok(done.receipt.sourceRefs.length > 0);
  }

  const cotDenied = completeResearchToHomeBase(running.mission, {
    finding: 'x',
    sourceRefs: [],
    evidenceClass: 'LOCAL_PACK',
    confidence: 0.1,
    hiddenChainOfThought: 'secret reasoning must not persist',
  });
  assert.equal(cotDenied.allowed, false);

  const childOk = spawnResearchChild(mission, {
    childTaskId: 't-child-ok',
    childAgentId: 'agent-child-ok',
    parentTaskId: mission.taskId,
    tenantId: mission.tenantId,
    universeId: mission.universeId,
    approvedSourceClasses: ['PUBLIC_OPEN'],
    allowedDataClasses: ['PUBLIC_REFERENCE'],
    computeBudget: 10,
    expiry: FUTURE,
    evidenceRequirements: ['sourceRefs'],
    returnPath: mission.returnPath,
  });
  assert.equal(childOk.allowed, true);
  if (childOk.allowed) {
    assert.equal(childOk.child.parentTaskId, mission.taskId);
    const ret = acceptResearchChildReturn(mission, {
      parentTaskId: mission.taskId,
      tenantId: mission.tenantId,
      universeId: mission.universeId,
      finding: 'Narrower child finding',
      sourceRefs: ['public:cve-2024-example'],
      evidenceClass: 'PUBLIC_OPEN',
      confidence: 0.6,
      contradictions: ['vendor advisory disagrees on severity'],
      tests: ['child_return_shape'],
      blockers: [],
      candidateLesson: 'Record contradictions explicitly',
      nextExperiment: 'Compare official advisory text',
    });
    assert.equal(ret.allowed, true);
  }
  console.log('PASS: completed research → structured Home Base receipt');
}

{
  assert.equal(ewL4AutonomyEnabled(), false);
  assert.equal(ewHiddenCotPersistenceAllowed(), false);
  assert.equal(assertEwLocksIntact(), true);
  const runtime = openAgentRuntime({
    runtimeId: 'rt-ew',
    tenantId: 'tenant-a',
    universeId: 'universe-a',
    agentId: 'agent-research-1',
    mode: 'OFFLINE_LIMITED',
    syncPolicy: 'BATCHED',
  });
  assert.equal(runtime.l4Enabled, false);
  console.log('PASS: L4 remains false');
}

// --- Supporting honesty / soft-wire ---

{
  const states = listResearchRuntimeStates();
  for (const s of [
    'LOCAL_READY',
    'ONLINE_READY',
    'WAITING_DATA',
    'WAITING_NODE',
    'RUNNING_VERIFIED',
    'COMPLETED',
    'BLOCKED',
    'REVOKED',
  ] as const) {
    assert.ok(states.includes(s));
  }
  assert.ok(listApprovedOnlineSourceClasses().includes('PUBLIC_OPEN'));
  assert.ok(listDeniedResearchSourceClasses().includes('STOLEN_CREDENTIALS'));
  const concepts = conceptTranslations();
  assert.match(concepts.WORMHOLES_HIGHWAYS, /caches/);
  assert.match(concepts.CLONE_DNA, /XIV-owned/);
  assert.match(concepts.REBUILD_CHIPS, /software abstractions/);
  assert.match(concepts.TRILLIONS_OF_PATHWAYS, /measured/);
  assert.match(concepts.DARK_WEB, /lawful/);

  const wires = auditEwSoftWires();
  assert.equal(wires.agentMeshRuntime.present, true);
  assert.equal(wires.agentMeshRuntime.verified, false);
  assert.equal(wires.agentsRuntime.present, true);
  assert.equal(wires.agentMeetings.present, true);
  // Soft probes — presence recorded; never treated as VERIFIED tip-land.
  const h61 = probe61oHardening();
  const gob = probeGobOrchestration();
  assert.equal(h61.verified, false);
  assert.equal(gob.verified, false);
  console.log(
    `PASS: soft-wire audit (61O present=${h61.present}; GOB present=${gob.present}; presence≠VERIFIED)`,
  );
}

{
  // Waiting-data mission cannot falsely complete as live research.
  const waiting = createOfflineResearchMission(
    baseMissionInput({ requiresWebOrApi: true, verifiedConnection: false }),
  );
  assert.equal(waiting.state, 'WAITING_DATA');
  const bogus = completeResearchToHomeBase(waiting.mission, {
    finding: 'fabricated live CVE list',
    sourceRefs: ['https://example.invalid/live'],
    evidenceClass: 'PUBLIC_OPEN',
    confidence: 0.99,
  });
  assert.equal(bogus.allowed, false);
  console.log('PASS: WAITING_DATA cannot complete fabricated live research');
}

console.log('62L-EW1–EW5 offline research mesh tests: ALL PASS');
