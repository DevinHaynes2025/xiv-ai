/**
 * Phase 2I-AC Neural Brain + Data Nervous System + Agent DevOps + Continuous Evolution.
 * Deterministic. No network. Does not weaken 2I-AB/AA/Z.
 * Authorized lineage ≠ surveillance. Creative ≠ production authority.
 * L4 disabled. Providers NOT_CONFIGURED. STOPPED before new production credentials.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  advanceLogisticsStage,
  aiTrackingEveryMovementMeansAuthorizedLineage,
  aiTrackingEveryMovementMeansSurveillance,
  answerInformationLogisticsQuestion,
  answerLogisticsTraversal,
  authorizedLineageObservabilityEnabled,
  buildLineage,
  companyAutoPromotesToGlobal,
  createDataAsset,
  createLogisticsNode,
  emitDataEvent,
  evaluateDataAccess,
  linkLogisticsNodes,
  listDataEventKinds,
  listInformationLogisticsQuestions,
  listInformationLogisticsStages,
  metadataPreferredForAudit,
  moreDataMeansPermissionToUseIt,
  offlineEqualsAuthorized as dataOfflineEqualsAuthorized,
  openDataAudit,
  openDataNervousGrounding,
  openDataNervousSystem,
  openInformationLogisticsGraph,
  personalAutoPromotesToCompany,
  privateAutoPromotesToPublic,
  rawPiiPayloadsRecordedForAudit,
  rawSecretsRecordedForAudit,
  recordSensitivePayloadForAudit,
  sourceRefsAndPermittedDerivedIntelligenceAllowed,
  surveillanceTrackingAllowed,
  traverseLineage,
  wholesaleUnauthorizedCopyrightCopyingAllowed,
} from './datanervous';
import {
  FOUNDER_TWIN_DISCLOSURE,
  advanceCouncilStage,
  aiAgreementEqualsVerified,
  companyMayAutoPromoteToGlobal,
  createIntelligenceGraphNode,
  createKnowledgeNode,
  createMediaAsset,
  createMediaRights,
  evaluateCrossLanePromotion,
  evidencePromotesQuality,
  extractStructuredIntelligence,
  forceArtificialConsensus,
  founderTwinDisclosure,
  linkIntelligenceGraphNodes,
  linkKnowledgeNodes,
  listBrainLanes,
  listCouncilFlow,
  listCouncilRoles,
  listKnowledgeQualityStates,
  listMediaAssetKinds,
  listNamedIntelligenceGraphs,
  openAgentCollaborationGraph,
  openCouncilSession,
  openDataLineageGraph,
  openDecisionGraph,
  openEvidenceGraph,
  openFounderCouncil,
  openKnowledgeGraph,
  openMultimodalKnowledgeLibrary,
  openMultimodalKnowledgeRegistry,
  openOutcomeGraph,
  openXivBrainV4,
  personalMayAutoPromoteToCompany,
  privateMayAutoPromoteToPublic,
  promoteKnowledgeQuality,
  recordDisagreement,
  recordFounderDecision,
  twinBecomesActualCeo,
  twinBecomesUltimateAuthority,
  wholesaleCopyrightDatabaseCopyAllowed,
} from './neuralbrain';
import {
  advanceContinuousBuilderStage,
  advanceDevOpsStage,
  agentMayDisableSecurityGates,
  agentMayExpandCredentials,
  agentMayForcePushProtectedBranches,
  agentMayModifyAuditHistory,
  agentMaySelfApprovePrivilegedChanges,
  agentMaySilentConsequentialProdDeploy,
  castReviewVote,
  continuousBuilderL4Enabled,
  continuousBuilderMaySilentProdDeploy,
  creativeCapabilityEqualsProductionAuthority,
  evaluateContinuousBuilderProdGate,
  evaluateForbiddenAction,
  evaluateHighRiskApproval,
  evaluatePrepAction,
  evaluateProductionDeploy,
  listAgentDevOpsForbidden,
  listAgentDevOpsStages,
  listCodeReviewChain,
  listContinuousBuilderStages,
  listCreativeCapabilities,
  moreAgentsMeansMorePermissions,
  moreIntelligenceMeansMoreAuthority,
  openAgentCreativeControl,
  openCodeReviewChain,
  openContinuousBuilder,
  openContinuousBuilderRun,
  openDevOpsRun,
  passContinuousBuilderHumanGate,
  passHumanPolicyGate,
  recommendRollback,
  selfApprovePrivilegedChange,
} from './agentdevops';
import {
  advanceContentStage,
  aggregateMorningFounderBrief,
  agentDeploymentState,
  aiAgreementEqualsTruth,
  claimBillionsOfUsers,
  claimTrillionsOfAgentsOrDatabases,
  connectedNetworkEqualsTrusted,
  continuousEvolutionMayAutoShip,
  createVisualGraphNode,
  creativeControlEqualsProductionControl,
  darkPatternsAllowed,
  extremeScaleIsProven,
  extremeScaleStatus,
  founderTwinEqualsActualFounder,
  l4AutonomyEnabled,
  l4RemainsDisabled,
  listContentIntelligenceStages,
  listFeedbackLoopStages,
  listNightShiftKinds,
  listNotConfiguredProviders,
  listVisualGraphKinds,
  moreDataMeansPermissionToUse,
  nightShiftMaySilentProductionDeploy,
  offlineEqualsAuthorized,
  openContentIntelligenceEngine,
  openContinuousEvolutionEngine,
  openFeedbackLoopV4,
  openInterfaceEvolutionEngine,
  openNightShiftV3,
  openNightShiftV4,
  openPhase2iacInvariants,
  openVisualIntelligenceContracts,
  pluginInstalledEqualsUnrestricted,
  productionCredentialsEnabledInPhase2iac,
  proposeInterfaceChange,
  providerState,
  runFeedbackCycle,
  startContentPipeline,
  stoppedBeforeNewProductionCredentials,
  storeExpectedOutcome,
  visualNodeExposesRequiredFields,
} from './evolution';
import {
  collaborationObjectGrantsL4,
  collaborationObjectGrantsPrivilege,
  createCollaborationObject,
  listAgentSocietyRoles,
  listCollaborationObjectKinds,
  mongoDbLifecycle,
  openAgentSociety,
  openAgentSocietyCollaboration,
} from './cios';
import { modelProviderState } from './modelfoundry';
import { l4AutonomyEnabled as abL4, productionCredentialsEnabledInPhase2iab } from './supplygraph';
import { agentMeshL4Enabled } from './agentmesh';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('grounding: authorized lineage not surveillance; L4 off; scale unproven; STOP credentials', () => {
  const g = openPhase2iacInvariants();
  assert.equal(g.authorizedLineageNotSurveillance, true);
  assert.equal(g.metadataPreferredForAudit, true);
  assert.equal(g.moreIntelligenceNotMoreAuthority, true);
  assert.equal(g.moreAgentsNotMorePermissions, true);
  assert.equal(g.moreDataNotMorePermission, true);
  assert.equal(g.offlineNotAuthorized, true);
  assert.equal(g.aiAgreementNotTruth, true);
  assert.equal(g.creativeControlNotProductionControl, true);
  assert.equal(g.founderTwinNotActualFounder, true);
  assert.equal(g.pluginInstalledNotUnrestricted, true);
  assert.equal(g.connectedNetworkNotTrusted, true);
  assert.equal(g.noAutoPersonalCompanyGlobalPublicPromotion, true);
  assert.equal(g.noWholesaleUnauthorizedCopyrightCopy, true);
  assert.equal(g.semiAutonomousDevOpsWithHumanGate, true);
  assert.equal(g.extremeScale, 'ENGINEERING_CAPACITY_TARGET');
  assert.equal(g.extremeScaleProven, false);
  assert.equal(g.l4Enabled, false);
  assert.equal(g.productionCredentialsEnabled, false);
  assert.equal(g.stoppedBeforeNewProductionCredentials, true);
  assert.equal(aiTrackingEveryMovementMeansAuthorizedLineage(), true);
  assert.equal(aiTrackingEveryMovementMeansSurveillance(), false);
  assert.equal(surveillanceTrackingAllowed(), false);
  assert.equal(authorizedLineageObservabilityEnabled(), true);
  assert.equal(l4RemainsDisabled(), true);
  assert.equal(l4AutonomyEnabled(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(extremeScaleStatus(), 'ENGINEERING_CAPACITY_TARGET');
  assert.equal(extremeScaleIsProven(), false);
  assert.equal(claimBillionsOfUsers(), false);
  assert.equal(claimTrillionsOfAgentsOrDatabases(), false);
  assert.equal(productionCredentialsEnabledInPhase2iac(), false);
  assert.equal(stoppedBeforeNewProductionCredentials(), true);
});

test('data nervous: event kinds + metadata-only audit; no raw secrets/PII', () => {
  const kinds = listDataEventKinds();
  assert.ok(kinds.includes('CREATED'));
  assert.ok(kinds.includes('USED_BY_AGENT'));
  assert.ok(kinds.includes('PROPOSED_FOR_DECISION'));
  assert.ok(kinds.includes('DELETED'));
  assert.equal(kinds.length, 17);
  assert.equal(rawSecretsRecordedForAudit(), false);
  assert.equal(rawPiiPayloadsRecordedForAudit(), false);
  assert.equal(metadataPreferredForAudit(), true);
  const asset = createDataAsset({
    assetId: 'a1',
    kind: 'document',
    classification: 'TENANT_PRIVATE',
    purpose: 'OPERATIONS',
    owner: { ownerId: 'o1', tenantId: 't1', universeId: 'u1', kind: 'TEAM' },
    region: 'us-east-1',
    retentionPolicyId: 'ret-1',
  });
  assert.equal(asset.containsRawSecrets, false);
  assert.equal(asset.containsRawPiiPayload, false);
  const event = emitDataEvent({
    eventId: 'e1',
    kind: 'INGESTED',
    assetId: asset.assetId,
    occurredAt: '2026-09-08T00:00:00Z',
    source: 'connector',
    purpose: 'OPERATIONS',
    tenantId: 't1',
    universeId: 'u1',
    classification: 'TENANT_PRIVATE',
    resultSummary: 'ingested metadata',
    provenanceRef: 'prov-1',
  });
  assert.equal(event.payloadMode, 'METADATA_ONLY');
  assert.equal(event.rawSecretsRecorded, false);
  assert.equal(event.rawPiiRecorded, false);
  const audit = openDataAudit(event);
  assert.equal(audit.metadataOnly, true);
  assert.equal(audit.rawPayloadStored, false);
  assert.throws(() => recordSensitivePayloadForAudit({ secret: 'x' }));
});

test('data access: cross-tenant denied; more data ≠ permission', () => {
  assert.equal(moreDataMeansPermissionToUseIt(), false);
  assert.equal(moreDataMeansPermissionToUse(), false);
  const asset = createDataAsset({
    assetId: 'a2',
    kind: 'table',
    classification: 'COMPANY',
    purpose: 'ANALYTICS',
    owner: { ownerId: 'o1', tenantId: 't1', universeId: 'u1', kind: 'TEAM' },
    region: 'us-east-1',
    retentionPolicyId: 'ret-1',
  });
  const denied = evaluateDataAccess({
    asset,
    consumer: { consumerId: 'c2', kind: 'AGENT', tenantId: 't2' },
    purpose: 'ANALYTICS',
    authorized: true,
  });
  assert.equal(denied.authorized, false);
  assert.equal(denied.deniedReason, 'cross_tenant_data_access_denied');
  const ok = evaluateDataAccess({
    asset,
    consumer: { consumerId: 'c1', kind: 'AGENT', tenantId: 't1' },
    purpose: 'ANALYTICS',
    authorized: true,
  });
  assert.equal(ok.authorized, true);
});

test('lineage traversal answers origin/agents/decisions/universe', () => {
  const event1 = emitDataEvent({
    eventId: 'e-origin',
    kind: 'CREATED',
    assetId: 'asset-x',
    occurredAt: '2026-09-08T01:00:00Z',
    source: 'human-alice',
    purpose: 'OPERATIONS',
    tenantId: 't1',
    universeId: 'u1',
    classification: 'INTERNAL',
    agentId: null,
    resultSummary: 'created',
    provenanceRef: 'p1',
  });
  const event2 = emitDataEvent({
    eventId: 'e-agent',
    kind: 'USED_BY_AGENT',
    assetId: 'asset-x',
    occurredAt: '2026-09-08T02:00:00Z',
    source: 'runtime',
    purpose: 'AGENT_REASONING',
    tenantId: 't1',
    universeId: 'u1',
    classification: 'INTERNAL',
    agentId: 'agent-research',
    resultSummary: 'used',
    provenanceRef: 'p1',
  });
  const event3 = emitDataEvent({
    eventId: 'e-decision',
    kind: 'PROPOSED_FOR_DECISION',
    assetId: 'asset-x',
    occurredAt: '2026-09-08T03:00:00Z',
    source: 'runtime',
    purpose: 'OPERATIONS',
    tenantId: 't1',
    universeId: 'u1',
    classification: 'INTERNAL',
    agentId: 'agent-exec',
    resultSummary: 'proposed',
    provenanceRef: 'p1',
  });
  const lineage = buildLineage({
    assets: [{ assetId: 'asset-x', classification: 'INTERNAL', tenantId: 't1', universeId: 'u1' }],
    events: [event1, event2, event3],
  });
  const answer = traverseLineage(lineage, 'asset-x');
  assert.equal(answer.originAssetId, 'asset-x');
  assert.ok(answer.whoChanged.includes('human-alice'));
  assert.ok(answer.agentsUsed.includes('agent-research'));
  assert.ok(answer.decisionsDepended.includes('e-decision'));
  assert.equal(answer.universeOwner, 'u1');
});

test('information logistics graph stages Source→Lesson', () => {
  const graph = openInformationLogisticsGraph();
  const stages = listInformationLogisticsStages();
  assert.equal(stages[0], 'SOURCE');
  assert.equal(stages[stages.length - 1], 'LESSON');
  assert.equal(graph.physicalSupplyChainLinked, true);
  assert.equal(graph.aiDecisionChainLinked, true);
  assert.equal(advanceLogisticsStage('SOURCE'), 'DOCUMENT_OR_EVENT');
  const n1 = createLogisticsNode({
    nodeId: 'n1',
    stage: 'SOURCE',
    refId: 'src-1',
    tenantId: 't1',
    universeId: 'u1',
    summary: 'source',
  });
  const n2 = createLogisticsNode({
    nodeId: 'n2',
    stage: 'CLAIM',
    refId: 'claim-1',
    tenantId: 't1',
    universeId: 'u1',
    summary: 'claim',
  });
  const edge = linkLogisticsNodes({ edgeId: 'le1', from: n1, to: n2, relation: 'FEEDS' });
  assert.ok('edgeId' in edge);
  const traversal = answerLogisticsTraversal([n1, n2], [edge as { edgeId: string; fromNodeId: string; toNodeId: string; relation: 'FEEDS' }], 'n1');
  assert.equal(traversal.origin?.nodeId, 'n1');
});

test('no auto Personal→Company / Company→Global / Private→Public', () => {
  assert.equal(personalAutoPromotesToCompany(), false);
  assert.equal(companyAutoPromotesToGlobal(), false);
  assert.equal(privateAutoPromotesToPublic(), false);
  assert.equal(personalMayAutoPromoteToCompany(), false);
  assert.equal(companyMayAutoPromoteToGlobal(), false);
  assert.equal(privateMayAutoPromoteToPublic(), false);
  assert.equal(dataOfflineEqualsAuthorized(), false);
  assert.equal(offlineEqualsAuthorized(), false);
  const denied = evaluateCrossLanePromotion({ from: 'PERSONAL', to: 'COMPANY', humanAuthorized: false });
  assert.equal(denied.allowed, false);
  const ok = evaluateCrossLanePromotion({ from: 'PERSONAL', to: 'COMPANY', humanAuthorized: true });
  assert.equal(ok.allowed, true);
});

test('XIV Brain V4 separated lanes + knowledge nodes; cross-lane blocked', () => {
  const brain = openXivBrainV4();
  assert.deepEqual([...listBrainLanes()], [
    'PERSONAL',
    'COMPANY',
    'POCKET',
    'PUBLIC_INTELLIGENCE',
    'HISTORICAL',
    'SUPPLIER',
    'PRODUCT',
    'LOCATION',
  ]);
  assert.equal(brain.personalAutoToCompany, false);
  assert.equal(brain.l4Enabled, false);
  const personal = createKnowledgeNode({
    nodeId: 'k1',
    kind: 'ClaimNode',
    lane: 'PERSONAL',
    tenantId: 't1',
    universeId: 'u1',
    summary: 'personal claim',
  });
  const company = createKnowledgeNode({
    nodeId: 'k2',
    kind: 'ClaimNode',
    lane: 'COMPANY',
    tenantId: 't1',
    universeId: 'u1',
    summary: 'company claim',
  });
  const blocked = linkKnowledgeNodes({
    edgeId: 'ke1',
    from: personal,
    to: company,
    relation: 'SUPPORTS',
  });
  assert.ok('allowed' in blocked && blocked.allowed === false);
  const refOk = linkKnowledgeNodes({
    edgeId: 'ke2',
    from: personal,
    to: company,
    relation: 'REFERENCES',
  });
  assert.ok('edgeId' in refOk);
});

test('knowledge quality: AI agreement ≠ VERIFIED; evidence promotes', () => {
  assert.equal(aiAgreementEqualsVerified(), false);
  assert.equal(aiAgreementEqualsTruth(), false);
  assert.equal(evidencePromotesQuality(), true);
  assert.ok(listKnowledgeQualityStates().includes('VERIFIED'));
  assert.ok(listKnowledgeQualityStates().includes('CONTRADICTED'));
  const node = createKnowledgeNode({
    nodeId: 'kq1',
    kind: 'ClaimNode',
    lane: 'COMPANY',
    tenantId: 't1',
    universeId: 'u1',
    quality: 'UNVERIFIED',
    summary: 'claim',
  });
  const aiOnly = promoteKnowledgeQuality({
    node,
    agentAgreementCount: 5,
    evidenceCount: 0,
    humanVerified: false,
    contradicted: false,
    stale: false,
    retracted: false,
  });
  assert.equal(aiOnly.to, 'UNVERIFIED');
  assert.equal(aiOnly.reason, 'ai_agreement_is_not_verification');
  const withEvidence = promoteKnowledgeQuality({
    node,
    agentAgreementCount: 0,
    evidenceCount: 2,
    humanVerified: false,
    contradicted: false,
    stale: false,
    retracted: false,
  });
  assert.equal(withEvidence.to, 'SUPPORTED');
  const verified = promoteKnowledgeQuality({
    node,
    agentAgreementCount: 1,
    evidenceCount: 2,
    humanVerified: true,
    contradicted: false,
    stale: false,
    retracted: false,
  });
  assert.equal(verified.to, 'VERIFIED');
});

test('multimodal library: rights required; no wholesale copyright copy', () => {
  const lib = openMultimodalKnowledgeLibrary();
  assert.equal(lib.wholesaleUnauthorizedCopyAllowed, false);
  assert.equal(wholesaleCopyrightDatabaseCopyAllowed(), false);
  assert.equal(wholesaleUnauthorizedCopyrightCopyingAllowed(), false);
  assert.equal(sourceRefsAndPermittedDerivedIntelligenceAllowed(), true);
  assert.ok(listMediaAssetKinds().includes('ARTICLE'));
  assert.ok(listMediaAssetKinds().includes('BUSINESS_LIVE'));
  assert.ok(listMediaAssetKinds().includes('GOVERNMENT_OPEN_DATA'));
  const deniedRights = createMediaRights({ rightsId: 'r-deny', state: 'DENIED' });
  assert.equal(deniedRights.mayCopyWholesale, false);
  const denied = createMediaAsset({
    assetId: 'm1',
    kind: 'ARTICLE',
    source: { sourceId: 's1', uri: 'https://example.com', publisher: 'x', rights: 'DENIED', authorized: false },
    rights: deniedRights,
    tenantId: 't1',
    universeId: 'u1',
    title: 'Denied',
  });
  assert.ok('allowed' in denied && denied.allowed === false);
  const rights = createMediaRights({ rightsId: 'r-ok', state: 'LICENSED', licenseRef: 'lic-1' });
  const asset = createMediaAsset({
    assetId: 'm2',
    kind: 'REPORT',
    source: { sourceId: 's2', uri: 'https://licensed.example', publisher: 'y', rights: 'LICENSED', authorized: true },
    rights,
    tenantId: 't1',
    universeId: 'u1',
    title: 'Licensed Report',
  });
  assert.ok('assetId' in asset);
  assert.ok(!('allowed' in asset));
  const intel = extractStructuredIntelligence(asset);
  assert.equal(intel.giantFileDump, false);
  assert.equal(intel.summary.derivedOnly, true);
});

test('founder council: exact twin disclosure; never CEO; preserve disagreement', () => {
  assert.equal(FOUNDER_TWIN_DISCLOSURE, 'XIV Founder Twin — AI representation of Devin Xavier Haynes');
  assert.equal(founderTwinDisclosure(), FOUNDER_TWIN_DISCLOSURE);
  const council = openFounderCouncil();
  assert.equal(council.twinDisclosure, FOUNDER_TWIN_DISCLOSURE);
  assert.equal(council.twinIsActualCeo, false);
  assert.equal(council.twinIsUltimateAuthority, false);
  assert.equal(council.forcedArtificialConsensus, false);
  assert.equal(twinBecomesActualCeo(), false);
  assert.equal(twinBecomesUltimateAuthority(), false);
  assert.equal(founderTwinEqualsActualFounder(), false);
  assert.ok(listCouncilRoles().includes('FounderTwin'));
  assert.ok(listCouncilRoles().includes('Contradiction'));
  assert.equal(listCouncilFlow()[0], 'QUESTION');
  assert.equal(listCouncilFlow()[listCouncilFlow().length - 1], 'AUTHORIZED_HUMAN_DECISION');
  const session = openCouncilSession({ sessionId: 'cs1', agendaItems: ['Should we ship?'] });
  assert.equal(session.twinDisclosure, FOUNDER_TWIN_DISCLOSURE);
  assert.equal(session.twinIsUltimateAuthority, false);
  assert.equal(advanceCouncilStage('QUESTION'), 'INDEPENDENT_ANALYSIS');
  const disagreement = recordDisagreement({
    disagreementId: 'd1',
    roles: ['Finance', 'Product'],
    issue: 'budget vs speed',
  });
  assert.equal(disagreement.preserved, true);
  assert.throws(() => forceArtificialConsensus(['Finance', 'Product']));
  const decision = recordFounderDecision({
    decisionId: 'fd1',
    decision: 'defer',
    decidedAt: '2026-09-08T04:00:00Z',
  });
  assert.equal(decision.humanAuthorized, true);
  assert.equal(decision.twinIsAuthority, false);
  assert.equal(decision.twinIsActualCeo, false);
});

test('agent creative control allowed; ≠ production authority', () => {
  const creative = openAgentCreativeControl();
  assert.equal(creative.equalsProductionAuthority, false);
  assert.equal(creativeCapabilityEqualsProductionAuthority(), false);
  assert.equal(creativeControlEqualsProductionControl(), false);
  const caps = listCreativeCapabilities();
  assert.ok(caps.includes('BRAINSTORM'));
  assert.ok(caps.includes('WRITE_CODE'));
  assert.ok(caps.includes('MIGRATION_PLANS'));
  assert.ok(caps.includes('VIDEO_SCRIPTS'));
});

test('agent devops stages + forbidden silent prod / force push / credential expand', () => {
  const stages = listAgentDevOpsStages();
  assert.equal(stages[0], 'IDEA');
  assert.ok(stages.includes('HUMAN_POLICY_GATE'));
  assert.ok(stages.includes('CANARY'));
  assert.ok(stages.includes('PRODUCTION'));
  assert.ok(stages.includes('ROLLBACK'));
  assert.equal(agentMaySilentConsequentialProdDeploy(), false);
  assert.equal(agentMayDisableSecurityGates(), false);
  assert.equal(agentMaySelfApprovePrivilegedChanges(), false);
  assert.equal(agentMayExpandCredentials(), false);
  assert.equal(agentMayForcePushProtectedBranches(), false);
  assert.equal(agentMayModifyAuditHistory(), false);
  for (const action of listAgentDevOpsForbidden()) {
    assert.equal(evaluateForbiddenAction(action).allowed, false);
  }
  const prep = evaluatePrepAction('PREPARE_PRS');
  assert.equal(prep.allowed, true);
  assert.equal(prep.grantsProductionAuthority, false);
  let run = openDevOpsRun({ runId: 'r1', branch: 'sandbox/feature' });
  assert.equal(run.stage, 'IDEA');
  // Advance to RC then gate
  for (let i = 0; i < 11; i++) {
    const next = advanceDevOpsStage(run);
    assert.ok('stage' in next);
    run = next as typeof run;
  }
  assert.equal(run.stage, 'HUMAN_POLICY_GATE');
  const blockedProd = evaluateProductionDeploy(run);
  assert.equal(blockedProd.allowed, false);
  run = passHumanPolicyGate(run);
  assert.equal(run.humanPolicyGatePassed, true);
  const allowed = evaluateProductionDeploy(run);
  assert.equal(allowed.allowed, true);
  const rb = recommendRollback(run, 'canary_regression');
  assert.equal(rb.recommended, true);
  assert.equal(rb.autoExecuted, false);
});

test('multi-agent review chain independent high-risk approvals', () => {
  const chain = openCodeReviewChain();
  assert.equal(chain.highRiskRequiresIndependentPaths, true);
  assert.deepEqual([...listCodeReviewChain()], [
    'Builder',
    'Testing',
    'Security',
    'Architecture',
    'Performance',
    'Database',
    'Contradiction',
    'Release',
    'HumanPolicyGate',
  ]);
  assert.equal(selfApprovePrivilegedChange().allowed, false);
  assert.equal(moreAgentsMeansMorePermissions(), false);
  assert.equal(moreIntelligenceMeansMoreAuthority(), false);
  const incomplete = evaluateHighRiskApproval([
    castReviewVote({ voteId: 'v1', role: 'Builder', verdict: 'APPROVE', notes: 'ok' }),
  ]);
  assert.equal(incomplete.approved, false);
  const complete = evaluateHighRiskApproval([
    castReviewVote({ voteId: 'v2', role: 'Security', verdict: 'APPROVE', notes: 'ok' }),
    castReviewVote({ voteId: 'v3', role: 'Architecture', verdict: 'APPROVE', notes: 'ok' }),
    castReviewVote({ voteId: 'v4', role: 'Contradiction', verdict: 'APPROVE', notes: 'ok' }),
    castReviewVote({ voteId: 'v5', role: 'HumanPolicyGate', verdict: 'APPROVE', notes: 'ok' }),
  ]);
  assert.equal(complete.approved, true);
});

test('interface evolution: proposals without dark patterns or auto-ship', () => {
  const engine = openInterfaceEvolutionEngine();
  assert.equal(engine.darkPatternsAllowed, false);
  assert.equal(engine.autoShipToProduction, false);
  assert.equal(darkPatternsAllowed(), false);
  const proposal = proposeInterfaceChange({
    proposalId: 'ui1',
    kind: 'ACCESSIBILITY',
    summary: 'Improve focus order',
  });
  assert.equal(proposal.darkPattern, false);
  assert.equal(proposal.autoShipsToProduction, false);
});

test('feedback loop V4 stores expected before execution', () => {
  const loop = openFeedbackLoopV4();
  assert.equal(loop.storeExpectedBeforeExecution, true);
  assert.equal(loop.measureExpectedVsActual, true);
  assert.equal(listFeedbackLoopStages()[0], 'OBSERVE');
  assert.equal(listFeedbackLoopStages()[listFeedbackLoopStages().length - 1], 'NEW_HYPOTHESIS');
  const expected = storeExpectedOutcome({
    expectationId: 'ex1',
    hypothesisId: 'h1',
    expected: 'latency<100ms',
    storedAt: '2026-09-08T05:00:00Z',
  });
  assert.equal(expected.storedBeforeExecution, true);
  const cycle = runFeedbackCycle({
    cycleId: 'fc1',
    hypothesisId: 'h1',
    expected: 'latency<100ms',
    actual: 'latency=120ms',
    at: '2026-09-08T05:01:00Z',
  });
  assert.equal(cycle.stage, 'NEW_HYPOTHESIS');
  assert.equal(cycle.lesson, 'expectation_missed');
  assert.ok(cycle.newHypothesis);
});

test('night shift V4 + morning founder brief aggregates', () => {
  const ns = openNightShiftV4();
  assert.equal(ns.version, 'V4');
  assert.equal(ns.silentProductionDeploy, false);
  assert.equal(ns.morningBriefRequired, true);
  assert.equal(ns.continuousBuilderSandboxOnlyOvernight, true);
  assert.equal(nightShiftMaySilentProductionDeploy(), false);
  assert.equal(openNightShiftV3().silentProductionDeploy, false);
  assert.ok(listNightShiftKinds().includes('RESEARCH'));
  assert.ok(listNightShiftKinds().includes('INFORMATION_LOGISTICS'));
  assert.ok(listNightShiftKinds().includes('CONTENT_INTELLIGENCE'));
  const brief = aggregateMorningFounderBrief({
    briefId: 'mb1',
    generatedAt: '2026-09-08T12:00:00Z',
    missions: ['research-1'],
    findings: ['f1'],
    contradictions: ['c1'],
    bugs: ['b1'],
    security: ['s1'],
    dataQuality: ['dq1'],
    sandboxBuilds: ['sb1'],
    releaseCandidates: ['rc1'],
    productIdeas: ['p1'],
    uxProposals: ['ux1'],
    supplierIntel: ['si1'],
    cost: ['cost1'],
    failedOrBlocked: ['blocked1'],
    humanDecisionsRequired: ['decide-rc'],
  });
  assert.equal(brief.twinIsAuthority, false);
  assert.equal(brief.productionDeployedOvernight, false);
  assert.ok(brief.humanDecisionsRequired.includes('decide-rc'));
});

test('content intelligence requires rights; structured not dump', () => {
  const engine = openContentIntelligenceEngine();
  assert.equal(engine.giantFileDump, false);
  assert.equal(engine.structuredIntelligence, true);
  assert.equal(engine.requiresRights, true);
  assert.equal(listContentIntelligenceStages()[0], 'SOURCE_ASSET');
  const denied = startContentPipeline({ runId: 'cp1', mediaAssetId: 'm1', rightsVerified: false });
  assert.ok('allowed' in denied && denied.allowed === false);
  const started = startContentPipeline({ runId: 'cp2', mediaAssetId: 'm2', rightsVerified: true });
  assert.ok(!('allowed' in started));
  const advanced = advanceContentStage(started);
  assert.ok(!('allowed' in advanced));
  assert.equal(advanced.stage, 'RIGHTS_AND_SOURCE');
});

test('visual intelligence contracts expose inspectable fields', () => {
  const contracts = openVisualIntelligenceContracts();
  assert.ok(listVisualGraphKinds().includes('DATA_LINEAGE'));
  assert.ok(listVisualGraphKinds().includes('EVIDENCE'));
  assert.ok(listVisualGraphKinds().includes('AGENT_COLLABORATION'));
  assert.ok(listVisualGraphKinds().includes('COMPANY_BRAIN'));
  assert.ok(listVisualGraphKinds().includes('UNIVERSE'));
  assert.ok(contracts.inspectableFields.includes('confidence'));
  assert.ok(contracts.inspectableFields.includes('permissions'));
  const node = createVisualGraphNode({
    nodeId: 'vn1',
    graphKind: 'DECISION',
    label: 'Ship RC?',
    sourceRef: 'decision-1',
    confidence: 0.4,
    freshness: 'CURRENT',
  });
  assert.equal(visualNodeExposesRequiredFields(node), true);
});

test('named graphs: Knowledge/Evidence/Decision/Outcome/AgentCollaboration/DataLineage', () => {
  assert.deepEqual([...listNamedIntelligenceGraphs()], [
    'KnowledgeGraph',
    'EvidenceGraph',
    'DecisionGraph',
    'OutcomeGraph',
    'AgentCollaborationGraph',
    'DataLineageGraph',
  ]);
  for (const graph of [
    openKnowledgeGraph(),
    openEvidenceGraph(),
    openDecisionGraph(),
    openOutcomeGraph(),
    openAgentCollaborationGraph(),
    openDataLineageGraph(),
  ]) {
    assert.equal(graph.crossTenantLinksAllowed, false);
    assert.equal(graph.l4Enabled, false);
    assert.equal(graph.inspectable, true);
  }
  const a = createIntelligenceGraphNode({
    nodeId: 'g1',
    kind: 'EvidenceNode',
    label: 'ev',
    tenantId: 't1',
    universeId: 'u1',
  });
  const b = createIntelligenceGraphNode({
    nodeId: 'g2',
    kind: 'DecisionNode',
    label: 'dec',
    tenantId: 't2',
    universeId: 'u1',
  });
  const denied = linkIntelligenceGraphNodes({
    edgeId: 'ge1',
    from: a,
    to: b,
    relation: 'SUPPORTS',
  });
  assert.ok('allowed' in denied && denied.allowed === false);
});

test('data nervous system + information logistics questions', () => {
  const dns = openDataNervousSystem();
  assert.equal(dns.surveillanceTrackingAllowed, false);
  assert.equal(dns.informationLogisticsGraph, true);
  assert.equal(dns.l4Enabled, false);
  assert.ok(listInformationLogisticsQuestions().includes('WHERE_DID_THIS_COME_FROM'));
  assert.ok(listInformationLogisticsQuestions().includes('WHICH_UNIVERSE_OWNS_THIS'));
  const n1 = createLogisticsNode({
    nodeId: 'lq1',
    stage: 'SOURCE',
    refId: 'src-q',
    tenantId: 't1',
    universeId: 'u9',
    summary: 'source',
  });
  const n2 = createLogisticsNode({
    nodeId: 'lq2',
    stage: 'DECISION',
    refId: 'dec-q',
    tenantId: 't1',
    universeId: 'u9',
    summary: 'decision',
  });
  const n3 = createLogisticsNode({
    nodeId: 'lq3',
    stage: 'LESSON',
    refId: 'les-q',
    tenantId: 't1',
    universeId: 'u9',
    summary: 'lesson',
  });
  const edge = linkLogisticsNodes({ edgeId: 'lqe1', from: n1, to: n2, relation: 'DECIDES' });
  assert.ok('edgeId' in edge);
  const q = answerInformationLogisticsQuestion({
    question: 'WHICH_UNIVERSE_OWNS_THIS',
    nodes: [n1, n2, n3],
    edges: [edge as { edgeId: string; fromNodeId: string; toNodeId: string; relation: 'DECIDES' }],
    startNodeId: 'lq1',
  });
  assert.equal(q.surveillance, false);
  assert.deepEqual([...q.answer], ['u9']);
});

test('multimodal knowledge registry rights gate', () => {
  const reg = openMultimodalKnowledgeRegistry();
  assert.equal(reg.registry, true);
  assert.equal(reg.rightsRequiredBeforeIndex, true);
  assert.equal(reg.wholesaleUnauthorizedCopyAllowed, false);
});

test('continuous evolution engine composes loops; never auto-ships', () => {
  const engine = openContinuousEvolutionEngine();
  assert.equal(engine.feedbackLoopV4, true);
  assert.equal(engine.nightShiftV4, true);
  assert.equal(engine.autoShipToProduction, false);
  assert.equal(engine.l4Enabled, false);
  assert.equal(continuousEvolutionMayAutoShip(), false);
});

test('continuous builder pipeline + prod gate; L4 disabled', () => {
  const builder = openContinuousBuilder();
  assert.equal(builder.prodGateRequiresHumanPolicy, true);
  assert.equal(builder.silentProdDeployAllowed, false);
  assert.equal(builder.l4Enabled, false);
  assert.equal(continuousBuilderMaySilentProdDeploy(), false);
  assert.equal(continuousBuilderL4Enabled(), false);
  assert.equal(listContinuousBuilderStages()[0], 'IDEA');
  assert.ok(listContinuousBuilderStages().includes('HUMAN_POLICY_GATE'));
  let run = openContinuousBuilderRun({ runId: 'cb1' });
  for (let i = 0; i < 8; i++) {
    const next = advanceContinuousBuilderStage(run);
    assert.ok('stage' in next);
    run = next as typeof run;
  }
  assert.equal(run.stage, 'HUMAN_POLICY_GATE');
  assert.equal(evaluateContinuousBuilderProdGate(run).allowed, false);
  run = passContinuousBuilderHumanGate(run);
  assert.equal(evaluateContinuousBuilderProdGate(run).allowed, true);
  assert.equal(evaluateContinuousBuilderProdGate(run).l4Enabled, false);
});

test('agent society roles + structured collaboration objects', () => {
  const society = openAgentSociety();
  assert.equal(society.l4Enabled, false);
  assert.equal(society.selfGrantEnabled, false);
  assert.ok(listAgentSocietyRoles().length >= 17);
  const collab = openAgentSocietyCollaboration();
  assert.equal(collab.moreAgentsMeansMorePermissions, false);
  assert.ok(listCollaborationObjectKinds().includes('EvidencePack'));
  assert.ok(listCollaborationObjectKinds().includes('FounderBriefItem'));
  const obj = createCollaborationObject({
    objectId: 'co1',
    kind: 'DecisionProposal',
    authorRole: 'Engineering',
    tenantId: 't1',
    universeId: 'u1',
    summary: 'propose RC',
  });
  assert.equal(collaborationObjectGrantsPrivilege(obj), false);
  assert.equal(collaborationObjectGrantsL4(obj), false);
});

test('providers NOT_CONFIGURED; agent deployment gated; compose with prior phases', () => {
  for (const key of listNotConfiguredProviders()) {
    assert.equal(providerState(key), 'NOT_CONFIGURED');
  }
  assert.equal(modelProviderState('OPENAI'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('ANTHROPIC'), 'NOT_CONFIGURED');
  assert.equal(mongoDbLifecycle(), 'NOT_CONFIGURED');
  assert.equal(abL4(), false);
  assert.equal(agentMeshL4Enabled(), false);
  assert.equal(productionCredentialsEnabledInPhase2iab(), false);
  const deploy = agentDeploymentState();
  assert.equal(deploy.mayPrepareRcCanary, true);
  assert.equal(deploy.maySilentProdDeploy, false);
  assert.equal(deploy.requiresHumanPolicyGate, true);
  assert.equal(deploy.l4Enabled, false);
  assert.equal(pluginInstalledEqualsUnrestricted(), false);
  assert.equal(connectedNetworkEqualsTrusted(), false);
  const nervous = openDataNervousGrounding();
  assert.equal(nervous.productionCredentialsEnabled, false);
  assert.equal(nervous.l4Enabled, false);
});

console.log('phase2iac: all tests passed');
