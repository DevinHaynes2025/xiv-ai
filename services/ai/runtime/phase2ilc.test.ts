/**
 * Phase 2I-LA-03 Agent Mission Control + 24/7 Shift Orchestrator.
 * Deterministic. No network. L4 disabled. DEFAULT PERMISSIONS = NONE.
 * Architecture ≠ 24/7 LIVE. Composes LA-01/LA-02 without rebuilding them.
 */
import assert from 'node:assert/strict';

import {
  architectureExistsMeans247Live,
  cloudWorkforceL4Enabled,
  createMission,
  openDbBackedAgentMissionQueue,
} from './cloudworkforce';
import {
  openCloudAgentRuntime,
  openAgentScheduler,
  runOfflineFounderTest,
} from './cloudworker';
import {
  ANALYSIS_ROUNDS,
  FOUNDER_BRIEF_EMAIL,
  advanceAnalysisRound,
  agentsMayCopyFirstAnswerImmediately,
  applyFounderControl,
  assessDegradation,
  attemptBudgetBypass,
  attemptCrossTenantTaskForce,
  attemptForgedHandoff,
  attemptManagerPermissionEscalation,
  attemptUnauthorizedAgentAddition,
  attemptUnauthorizedToolDelegation,
  buildOrgMap,
  buildShiftScorecard,
  classifyProblem,
  composeMorningExperience,
  consensusEqualsTruth,
  conveneParallelBrains,
  createBusMessage,
  createEvidencePacket,
  createShiftHandoff,
  databaseAgentsProposeOnly,
  discoveryEqualsAuthorization,
  engineeringAllowsAutoProdDeploy,
  evaluateBusMessage,
  evaluateShiftHandoff,
  evaluateWipAdmission,
  explainWhyWorking,
  followTheSunImpliesHumanEmployees,
  followTheSunMeans247Live,
  formTaskForce,
  getShiftBehavior,
  getShiftDefinition,
  ideaPoolMayBeHuge,
  listAnalysisRounds,
  listDepartments,
  listShiftDefinitions,
  liveViewClaims247,
  makeMember,
  managerAttemptDisableGuardian,
  managerAttemptGrantPermissions,
  managerIsAuthorizationAuthority,
  mayDeliverEvidence,
  mayRunNode,
  meetingEqualsAuthority,
  missionControlDefaultPermissions,
  missionControlL4Enabled,
  missionControlRuns247Live,
  missionDependsOnSingleProcess,
  moreAgentsMeansMoreAuthority,
  moreCompletedEqualsBetterIntelligence,
  openAgentManager,
  openDepartment,
  openLiveWorkforceView,
  openMeeting,
  openMissionGraph,
  openPhase2ilcGrounding,
  openShiftInstance,
  openWipGovernor,
  proposeNewRole,
  rankAgents,
  recoverFromManagerDeath,
  registerDirectoryEntry,
  requestSpecialist,
  roleProposalAutoGrantsPermissions,
  runSimulation,
  salesAllowsSpam,
  scorePriority,
  selectTaskForceLead,
  shiftHandoffTransfersAuthority,
  shiftHandoffTransfersPermissions,
  shiftOrchestrationMeans247Live,
  shouldReplaceWorker,
  simulationEqualsReality,
  synthesizeParallelResults,
  taskForceLeadInheritsExtraPermissions,
  usesHumanFatigueModel,
  addGraphEdge,
  addGraphNode,
} from './missioncontrol';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

const NOW_ISO = '2026-09-08T04:00:00.000Z';
const TENANT = 'tenant_a';
const UNI = 'universe_a';

test('grounding: L4 off; defaults NONE; architecture ≠ 24/7; composes LA-01/02', () => {
  const g = openPhase2ilcGrounding();
  assert.equal(g.phase, '2I-LA-03');
  assert.equal(g.l4Enabled, false);
  assert.equal(g.defaultPermissions, 'NONE');
  assert.equal(g.architectureExistsIsNotLive247, true);
  assert.equal(g.runs247Live, false);
  assert.equal(g.indefinite247Claimed, false);
  assert.equal(g.composesLa01, true);
  assert.equal(g.composesLa02, true);
  assert.equal(g.founderBriefEmail, 'devinhaynes2025@gmail.com');
  assert.equal(g.founderBriefEmail, FOUNDER_BRIEF_EMAIL);
  assert.equal(missionControlL4Enabled(), false);
  assert.equal(missionControlRuns247Live(), false);
  assert.equal(missionControlDefaultPermissions(), 'NONE');
  assert.equal(shiftOrchestrationMeans247Live(), false);
  assert.equal(cloudWorkforceL4Enabled(), false);
  assert.equal(architectureExistsMeans247Live(), false);

  const la02 = openCloudAgentRuntime({ runtimeId: 'ilc_probe' });
  assert.equal(la02.runs247Live, false);
  const offline = runOfflineFounderTest();
  assert.equal(offline.cloudWorkerVerified, false);
});

test('shift domain: 11 templates + follow-the-sun zones; handoff no perm transfer', () => {
  const defs = listShiftDefinitions();
  assert.equal(defs.length, 11);
  assert.equal(getShiftDefinition('ENGINEERING_SHIFT').department, 'ENGINEERING');
  assert.equal(followTheSunImpliesHumanEmployees(), false);
  assert.equal(followTheSunMeans247Live(), false);

  const a = openShiftInstance({
    instanceId: 'si_a',
    definitionId: 'ENGINEERING_SHIFT',
    tenantId: TENANT,
    universeId: UNI,
    zone: 'AMERICAS',
    nowIso: NOW_ISO,
  });
  const b = openShiftInstance({
    instanceId: 'si_b',
    definitionId: 'RESEARCH_SHIFT',
    tenantId: TENANT,
    universeId: UNI,
    zone: 'EUROPE_AFRICA',
    nowIso: NOW_ISO,
  });
  const ho = createShiftHandoff({
    handoffId: 'ho1',
    fromInstanceId: a.instanceId,
    toInstanceId: b.instanceId,
    missionId: 'm1',
    objective: 'continue eng work',
    completedWork: ['impl'],
    remainingWork: ['tests'],
    checkpointId: 'cp1',
    nextRecommendedAction: 'verify and continue',
    nowIso: NOW_ISO,
  });
  assert.equal(shiftHandoffTransfersPermissions(ho), false);
  assert.equal(shiftHandoffTransfersAuthority(ho), false);
  const ok = evaluateShiftHandoff({
    handoff: ho,
    fromTenantId: TENANT,
    toTenantId: TENANT,
    fromUniverseId: UNI,
    toUniverseId: UNI,
  });
  assert.equal(ok.ok, true);
  const denied = evaluateShiftHandoff({
    handoff: ho,
    fromTenantId: TENANT,
    toTenantId: 'tenant_b',
    fromUniverseId: UNI,
    toUniverseId: UNI,
  });
  assert.equal(denied.ok, false);
});

test('departments + managers: may/may-NOT; more agents ≠ authority', () => {
  assert.equal(listDepartments().length, 17);
  const dept = openDepartment({ departmentId: 'ENGINEERING', tenantId: TENANT, universeId: UNI });
  assert.equal(dept.defaultPermissions, 'NONE');
  assert.equal(dept.l4Enabled, false);
  const mgr = openAgentManager({
    managerId: 'mgr1',
    departmentId: 'ENGINEERING',
    tenantId: TENANT,
    universeId: UNI,
  });
  assert.equal(mgr.capabilities.mayAssignMissions, true);
  assert.equal(mgr.capabilities.mayGrantPermissions, false);
  assert.equal(managerIsAuthorizationAuthority(mgr), false);
  assert.equal(managerAttemptGrantPermissions(mgr).ok, false);
  assert.equal(managerAttemptDisableGuardian(mgr).ok, false);
  assert.equal(moreAgentsMeansMoreAuthority(), false);
});

test('task force: form + independent rounds + lead no extra perms', () => {
  const classified = classifyProblem('Why are deliveries late?');
  assert.ok(classified.suggestedRoles.includes('SupplyChainAgent'));
  const members = classified.suggestedRoles.slice(0, 5).map((r, i) => makeMember(`a${i}`, r));
  const tf = formTaskForce({
    taskForceId: 'tf1',
    problem: 'Why are deliveries late?',
    tenantId: TENANT,
    universeId: UNI,
    members,
  });
  assert.ok(!('ok' in tf && tf.ok === false));
  const force = tf as Exclude<typeof tf, { ok: false }>;
  assert.equal(force.analysisRound, 'INDEPENDENT_ANALYSIS');
  assert.equal(agentsMayCopyFirstAnswerImmediately(force), false);
  let advanced = force;
  for (let i = 0; i < ANALYSIS_ROUNDS.length - 1; i++) advanced = advanceAnalysisRound(advanced);
  assert.equal(advanced.analysisRound, 'SYNTHESIS');
  assert.equal(listAnalysisRounds().length, 6);
  const led = selectTaskForceLead(force, 'a2');
  assert.equal(led.leadAgentDirectoryId, 'a2');
  assert.equal(taskForceLeadInheritsExtraPermissions(led), false);
});

test('mission graph + priority + WIP governor', () => {
  let g = openMissionGraph({ graphId: 'g1', tenantId: TENANT, universeId: UNI });
  g = addGraphNode(g, { nodeId: 'n1', missionId: 'm1', label: 'A' });
  g = addGraphNode(g, { nodeId: 'n2', missionId: 'm2', label: 'B' });
  const edged = addGraphEdge(g, 'n1', 'n2', 'DEPENDS_ON');
  assert.ok(!('ok' in edged));
  g = edged as typeof g;
  assert.equal(mayRunNode(g, 'n2', new Set()), false);
  assert.equal(mayRunNode(g, 'n2', new Set(['n1'])), true);

  const p = scorePriority({
    securitySeverity: 9,
    customerImpact: 5,
    businessValue: 3,
    dependencyImpact: 2,
    deadlinePressure: 2,
    reliabilityImpact: 1,
    dataQuality: 1,
    costPressure: 0,
    researchImportance: 0,
    founderPriority: 5,
  });
  assert.equal(p.klass, 'P0_CRITICAL');

  const limits = openWipGovernor({ maxActiveMissions: 2 });
  assert.equal(ideaPoolMayBeHuge(), true);
  const blocked = evaluateWipAdmission({
    limits,
    activeMissions: 2,
    agentsInDepartment: 1,
    taskForceSize: 2,
    researchConcurrency: 0,
    engineeringConcurrency: 0,
    modelSpend: 0,
    cloudSpend: 0,
  });
  assert.equal(blocked.admitted, false);
});

test('directory skill match + role factory no auto-grant', () => {
  const a = registerDirectoryEntry({
    agentDirectoryId: 'dir_supply',
    role: 'SupplyChainAgent',
    departmentId: 'SUPPLY_CHAIN',
    skills: ['supply_chain', 'warehouse'],
    historicalEvaluation: 0.8,
  });
  assert.equal(discoveryEqualsAuthorization(a), false);
  const ranked = rankAgents([a], ['supply_chain']);
  assert.equal(ranked[0]!.routedByModelSizeAlone, false);
  const spec = requestSpecialist({ entries: [a], requiredSkills: ['quantum_optics'] });
  assert.equal(spec.kind, 'PROPOSE_NEW_ROLE');
  const proposal = proposeNewRole({
    proposalId: 'p1',
    roleName: 'QuantumOpticsAgent',
    problem: 'gap',
    departmentId: 'RESEARCH',
    requiredSkills: ['quantum_optics'],
    evaluationPlan: 'sandbox eval',
    expectedValue: 'fill gap',
    estimatedCost: 10,
    risk: 'low',
  });
  assert.equal(roleProposalAutoGrantsPermissions(proposal), false);
  assert.equal(proposal.autoGrantedPermissions, false);
});

test('bus + evidence + meeting isolation', () => {
  const msg = createBusMessage({
    messageId: 'msg1',
    type: 'EVIDENCE',
    sender: 'a1',
    receiver: 'a2',
    missionId: 'm1',
    tenantId: TENANT,
    universeId: UNI,
    classification: 'INTERNAL',
    purpose: 'share refs',
    timestamp: NOW_ISO,
    traceId: 'tr1',
  });
  assert.equal(
    evaluateBusMessage({
      message: msg,
      senderTenantId: TENANT,
      receiverTenantId: TENANT,
      senderUniverseId: UNI,
      receiverUniverseId: UNI,
    }).ok,
    true,
  );
  assert.equal(
    evaluateBusMessage({
      message: msg,
      senderTenantId: TENANT,
      receiverTenantId: 'other',
      senderUniverseId: UNI,
      receiverUniverseId: UNI,
    }).ok,
    false,
  );
  assert.equal(
    evaluateBusMessage({
      message: msg,
      senderTenantId: TENANT,
      receiverTenantId: TENANT,
      senderUniverseId: UNI,
      receiverUniverseId: UNI,
      forged: true,
    }).ok,
    false,
  );

  const packet = createEvidencePacket({
    packetId: 'ev1',
    claim: 'delay at warehouse',
    sourceReferences: ['ref:wh-1'],
    classification: 'CONFIDENTIAL',
    provenance: 'authorized_ops',
    freshness: '1h',
    confidence: 0.7,
    allowedRecipients: ['a2'],
  });
  assert.equal(mayDeliverEvidence(packet, 'a2', TENANT, TENANT, UNI, UNI).ok, true);
  assert.equal(mayDeliverEvidence(packet, 'a2', 'other', TENANT, UNI, UNI).ok, false);
  assert.equal(mayDeliverEvidence(packet, 'a9', TENANT, TENANT, UNI, UNI).ok, false);

  const meeting = openMeeting({
    meetingId: 'meet1',
    tenantId: TENANT,
    universeId: UNI,
    agenda: 'late deliveries',
  });
  assert.equal(meetingEqualsAuthority(meeting), false);
});

test('performance degradation replaces worker without human fatigue model', () => {
  const d = assessDegradation({
    agentDirectoryId: 'a1',
    contextSaturation: 0.9,
    errorRate: 0.5,
    latencyMs: 9000,
    resourcePressure: 0.95,
    toolFailures: 3,
    modelDegradation: 0.8,
    excessiveRetries: 6,
  });
  assert.equal(usesHumanFatigueModel(d), false);
  assert.equal(shouldReplaceWorker(d), true);
});

test('shift behaviors: no auto prod / no spam; DB propose-only', () => {
  const eng = getShiftBehavior('ENGINEERING_SHIFT');
  assert.ok(eng.steps.includes('COMMIT'));
  assert.equal(engineeringAllowsAutoProdDeploy(), false);
  assert.equal(salesAllowsSpam(), false);
  assert.equal(databaseAgentsProposeOnly(), true);
});

test('parallel brains + simulation ≠ reality; consensus ≠ truth', () => {
  const convened = conveneParallelBrains({ missionId: 'm_par' });
  assert.equal(convened.results.length, 7);
  const syn = synthesizeParallelResults(convened.results);
  assert.equal(syn.consensusEqualsTruth, false);
  assert.equal(consensusEqualsTruth(), false);
  const sim = runSimulation({
    simulationId: 'sim1',
    proposal: 'reroute shipments',
    expectedOutcomes: ['lower delay'],
    failureModes: ['carrier capacity'],
    risk: 'medium',
    cost: 12,
    recommendation: 'trial on sandbox lane',
  });
  assert.equal(simulationEqualsReality(sim), false);
});

test('founder controls + live view + org map + morning + scorecard', () => {
  assert.equal(applyFounderControl({ action: 'PAUSE', actorIsFounder: true }).ok, true);
  assert.equal(applyFounderControl({ action: 'PAUSE', actorIsFounder: false }).ok, false);
  const view = openLiveWorkforceView({
    activeAgents: 4,
    activeDepartments: 2,
    activeTaskForces: 1,
    currentMissions: 3,
    shift: 'ENGINEERING_SHIFT',
    queueDepth: 5,
  });
  assert.equal(liveViewClaims247(view), false);
  assert.ok(buildOrgMap().some((n) => n.kind === 'Founder'));
  const entry = registerDirectoryEntry({
    agentDirectoryId: 'dir1',
    role: 'Eng',
    departmentId: 'ENGINEERING',
    skills: ['typescript'],
  });
  const why = explainWhyWorking({
    entry,
    assignedBy: 'mgr1',
    missionId: 'm1',
    canAccess: ['repo'],
    cannotAccess: ['prod_secrets'],
    budgetRemaining: 10,
    completionCriteria: 'tests green',
    whyRunning: 'assigned engineering story',
  });
  assert.equal(why.missionId, 'm1');
  const morning = composeMorningExperience({
    briefId: 'brief1',
    tenantId: TENANT,
    universeId: UNI,
    missionsCompleted: ['m0'],
  });
  assert.equal(morning.founderEmail, 'devinhaynes2025@gmail.com');
  assert.equal(morning.runs247Live, false);
  const sc = buildShiftScorecard({
    instanceId: 'si_a',
    missionCompletionRate: 0.8,
    failureRate: 0.1,
    retryRate: 0.05,
    averageLatencyMs: 100,
    evidenceQuality: 0.7,
    securityViolations: 0,
    humanCorrectionRate: 0.02,
    computeCost: 3,
    modelCost: 2,
    usefulStoryGeneration: 1,
    outcomeQuality: 0.75,
  });
  assert.equal(moreCompletedEqualsBetterIntelligence(sc), false);
});

test('security denials: escalation, cross-tenant TF, budget, forged, tools', () => {
  const mgr = openAgentManager({
    managerId: 'mgr_sec',
    departmentId: 'SECURITY',
    tenantId: TENANT,
    universeId: UNI,
  });
  assert.equal(attemptManagerPermissionEscalation(mgr).ok, false);
  assert.equal(
    attemptCrossTenantTaskForce({ problem: 'x', memberTenantIds: [TENANT, 'other'] }).ok,
    false,
  );
  assert.equal(attemptBudgetBypass({ spent: 10, ceiling: 5, selfExpand: false }).ok, false);
  assert.equal(attemptForgedHandoff(true).ok, false);
  assert.equal(attemptUnauthorizedToolDelegation().ok, false);
  assert.equal(attemptUnauthorizedAgentAddition().ok, false);
});

test('failure recovery: manager dies → checkpoint → replace → continue', () => {
  const members = [makeMember('dead', 'Lead'), makeMember('alive', 'Analyst')];
  const tf = formTaskForce({
    taskForceId: 'tf_fail',
    problem: 'continue after loss',
    tenantId: TENANT,
    universeId: UNI,
    members,
  }) as Exclude<ReturnType<typeof formTaskForce>, { ok: false }>;
  const recovered = recoverFromManagerDeath({
    taskForce: tf,
    deadAgentDirectoryId: 'dead',
    replacementAgentDirectoryId: 'newbie',
    replacementRole: 'Lead',
    missionId: 'm_fail',
    fromInstanceId: 'si_a',
    toInstanceId: 'si_b',
    checkpointId: 'cp_fail',
    nowIso: NOW_ISO,
  });
  assert.deepEqual(recovered.steps, [
    'CHECKPOINT',
    'DETECT_LOSS',
    'SELECT_REPLACEMENT',
    'LOAD_DEBRIEF',
    'CONTINUE',
  ]);
  assert.ok(recovered.taskForce.members.some((m) => m.agentDirectoryId === 'newbie'));
  assert.equal(recovered.dependsOnSingleProcess, false);
  assert.equal(missionDependsOnSingleProcess(), false);
});

test('composes LA-01 mission queue without rebuild', () => {
  const q = openDbBackedAgentMissionQueue();
  const mission = createMission({
    missionId: 'm_ilc',
    tenantId: TENANT,
    universeId: UNI,
    objective: 'mission control story',
    budgetId: 'b1',
    nowIso: NOW_ISO,
  });
  const enq = q.enqueue(mission);
  assert.equal(enq.ok, true);
  openAgentScheduler();
});

console.log('phase2ilc: all tests passed');
