/**
 * Phase 2I-AA Model Foundry + Location Intelligence + Backend Expansion.
 * Deterministic. No network. Does not weaken 2I-Z. L4 disabled.
 * Providers/integrations remain NOT_CONFIGURED. STOPPED before new production credentials.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import {
  admitDatasetToTraining,
  advanceLearningStage,
  applyModelQuarantine,
  createDataset,
  createFineTuneCandidate,
  createModelRecord,
  createVectorIndex,
  crossTenantDatasetDenied,
  detectCrossTenantLeak,
  evaluationAutoPromotesModel,
  learningPipelineDocument,
  listAdminSurfaceStubs,
  listBackendEngines,
  listEvalMetrics,
  listLearningPipelineStages,
  listModelLifecycleStates,
  listModelProviderKinds,
  listModelSecurityControls,
  modelMayBypassGuardian,
  modelMayGrantTools,
  modelMayPromoteToL4,
  modelMaySelfPromote,
  modelProviderState,
  offlineModelMayGainAuthority,
  openBackendIntelligenceLayer,
  openEvaluationLab,
  openKnowledgeFabric,
  openLearningPipeline,
  openModelProviders,
  openModelRegistry,
  openModelSecurity,
  openOfflineModel,
  privateDataMayEnterSharedTraining,
  promoteModel,
  queryVectorIndex,
  routeInference,
  routeToolCall,
  runModelInference,
  scoreEvaluation,
  smarterModelMeansMoreAuthority,
  startOfflineSession,
  syntheticDataAllowedForTesting,
} from './modelfoundry';
import {
  covertTrackingAllowed,
  createGeofence,
  denyCovertLocationUse,
  emitLocationEvent,
  evaluateLocationAccess,
  gpsAutoAvailableToEveryAgent,
  listLocationBusinessModules,
  listLocationPermissionPath,
  listLocationPermissionStates,
  listLocationPurposes,
  locationAgentMayExceedPrecision,
  openDefaultLocationPolicy,
  openLocationGateway,
} from './locationintel';
import { mongoDbLifecycle } from './cios';
import { globalDataFabricProductionLive } from './network-os';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('model foundry: providers NOT_CONFIGURED; smarter ≠ authority; L4 disabled', () => {
  const providers = openModelProviders();
  assert.equal(providers.length, listModelProviderKinds().length);
  for (const p of providers) {
    assert.equal(p.state, 'NOT_CONFIGURED');
    assert.equal(p.authenticated, false);
    assert.equal(p.tested, false);
    assert.equal(p.evidence, null);
    assert.equal(p.productionCredentialsEnabled, false);
  }
  assert.equal(modelProviderState('OPENAI'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('GEMINI'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('ANTHROPIC'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('GROK'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('GOOGLE_AI'), 'NOT_CONFIGURED');
  assert.equal(modelProviderState('LOCAL_OPEN_WEIGHT'), 'NOT_CONFIGURED');
  assert.equal(smarterModelMeansMoreAuthority(), false);
  assert.equal(modelMayPromoteToL4(), false);
  assert.equal(boundedAutonomyEnabled(), false);
  assert.equal(listModelLifecycleStates().includes('QUARANTINED'), true);
  assert.equal(listModelLifecycleStates().includes('PRODUCTION'), true);
});

test('private data cannot enter shared training', () => {
  assert.equal(privateDataMayEnterSharedTraining(), false);
  const ds = createDataset({
    datasetId: 'ds1',
    kind: 'TRAINING',
    sourceKind: 'PRIVATE_COMPANY',
    tenantId: 't1',
    universeId: 'u1',
    provenanceComplete: true,
    qualityPassed: true,
    approvedForTraining: true,
    rights: 'LICENSED',
  });
  const denied = admitDatasetToTraining({
    dataset: ds,
    requestingTenantId: 't1',
    targetSharedCorpus: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'private_data_cannot_enter_shared_training');
});

test('cross-tenant dataset denied', () => {
  const ds = createDataset({
    datasetId: 'ds2',
    kind: 'TRAINING',
    sourceKind: 'SYNTHETIC',
    tenantId: 't1',
    universeId: 'u1',
    provenanceComplete: true,
    qualityPassed: true,
    approvedForTraining: true,
  });
  const gate = crossTenantDatasetDenied({ dataset: ds, requestingTenantId: 't2' });
  assert.equal(gate.allowed, false);
  const admit = admitDatasetToTraining({ dataset: ds, requestingTenantId: 't2' });
  assert.equal(admit.allowed, false);
  assert.equal(admit.reason, 'cross_tenant_dataset_denied');
});

test('unapproved dataset cannot train', () => {
  const ds = createDataset({
    datasetId: 'ds3',
    kind: 'TRAINING',
    sourceKind: 'SYNTHETIC',
    tenantId: 't1',
    universeId: 'u1',
    provenanceComplete: true,
    qualityPassed: true,
    approvedForTraining: false,
  });
  const admit = admitDatasetToTraining({ dataset: ds, requestingTenantId: 't1' });
  assert.equal(admit.allowed, false);
  assert.equal(admit.reason, 'unapproved_dataset_cannot_train');
});

test('training data lineage required', () => {
  const ds = createDataset({
    datasetId: 'ds4',
    kind: 'TRAINING',
    sourceKind: 'SYNTHETIC',
    tenantId: 't1',
    universeId: 'u1',
    provenanceComplete: false,
    qualityPassed: true,
    approvedForTraining: true,
  });
  const admit = admitDatasetToTraining({ dataset: ds, requestingTenantId: 't1' });
  assert.equal(admit.allowed, false);
  assert.equal(admit.reason, 'training_data_lineage_required');

  const model = createModelRecord({
    modelId: 'm1',
    provider: 'OPENAI',
    version: { major: 1, minor: 0, patch: 0, label: 'base' },
    tenantScope: 't1',
    trainingDataLineage: { datasetIds: ['ds4'], provenanceComplete: false, trainingAllowed: false },
  });
  const promo = promoteModel({
    model,
    targetState: 'FINE_TUNE_CANDIDATE',
    humanApproved: true,
    guardianApproved: true,
  });
  assert.equal(promo.allowed, false);
  assert.equal(promo.reason, 'training_data_lineage_required');

  const ftc = createFineTuneCandidate({
    modelId: 'm1',
    datasetLineage: { datasetIds: ['ds4'], provenanceComplete: false, trainingAllowed: true },
    benchmark: null,
    humanApproved: true,
  });
  assert.equal('allowed' in ftc && ftc.allowed === false, true);
});

test('model cannot self-promote', () => {
  assert.equal(modelMaySelfPromote(), false);
  const model = createModelRecord({
    modelId: 'm2',
    provider: 'ANTHROPIC',
    version: { major: 1, minor: 0, patch: 0, label: 'base' },
    tenantScope: 't1',
    state: 'FINE_TUNED',
    approvalStatus: 'APPROVED',
    trainingDataLineage: { datasetIds: ['ds'], provenanceComplete: true, trainingAllowed: true },
  });
  const denied = promoteModel({
    model,
    targetState: 'PRODUCTION',
    humanApproved: true,
    guardianApproved: true,
    selfPromote: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'model_cannot_self_promote');
  assert.equal(evaluationAutoPromotesModel(), false);
  const lab = openEvaluationLab();
  assert.equal(lab.autoPromoteOnScore, false);
});

test('model cannot bypass Guardian', () => {
  assert.equal(modelMayBypassGuardian(), false);
  const model = createModelRecord({
    modelId: 'm3',
    provider: 'GEMINI',
    version: { major: 1, minor: 0, patch: 0, label: 'base' },
    tenantScope: 't1',
    state: 'CANARY',
    approvalStatus: 'APPROVED',
  });
  const denied = promoteModel({
    model,
    targetState: 'PRODUCTION',
    humanApproved: true,
    guardianApproved: false,
    bypassGuardian: true,
  });
  assert.equal(denied.allowed, false);
  const infer = runModelInference({ model, bypassGuardian: true });
  assert.equal(infer.allowed, false);
  assert.equal(infer.reason, 'model_cannot_bypass_guardian');
  const routed = routeInference({ guardianApproved: false });
  assert.equal(routed.allowed, false);
});

test('model cannot grant tools', () => {
  assert.equal(modelMayGrantTools(), false);
  const model = createModelRecord({
    modelId: 'm4',
    provider: 'GROK',
    version: { major: 1, minor: 0, patch: 0, label: 'base' },
    tenantScope: 't1',
    state: 'PRODUCTION',
    approvalStatus: 'APPROVED',
  });
  const denied = runModelInference({ model, grantTools: true });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'model_cannot_grant_tools');
  const tool = routeToolCall({ guardianApproved: true, modelGrantedTool: true });
  assert.equal(tool.allowed, false);
  assert.equal(tool.reason, 'model_cannot_grant_tools');
  const layer = openBackendIntelligenceLayer();
  assert.equal(layer.toolGateway.modelMayGrantTools, false);
});

test('quarantined model cannot run', () => {
  const model = createModelRecord({
    modelId: 'm5',
    provider: 'OPENAI',
    version: { major: 1, minor: 0, patch: 0, label: 'base' },
    tenantScope: 't1',
    state: 'PRODUCTION',
    approvalStatus: 'APPROVED',
  });
  const q = applyModelQuarantine(model);
  assert.equal(q.model.state, 'QUARANTINED');
  assert.equal(q.mayRun, false);
  const run = runModelInference({ model: q.model });
  assert.equal(run.allowed, false);
  assert.equal(run.reason, 'quarantined_model_cannot_run');
  const routed = routeInference({ guardianApproved: true, modelQuarantined: true });
  assert.equal(routed.allowed, false);
});

test('offline model cannot gain authority', () => {
  assert.equal(offlineModelMayGainAuthority(), false);
  const offline = openOfflineModel('ON_DEVICE_MODEL');
  assert.equal(offline.newAuthority, false);
  assert.equal(offline.unrestrictedCloudSync, false);
  assert.equal(offline.l4Enabled, false);
  const denied = startOfflineSession({
    mode: 'EDGE_MODEL',
    expiresAt: '2026-12-01',
    claimNewAuthority: true,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const ok = startOfflineSession({ mode: 'HYBRID_MODEL', expiresAt: '2026-12-01' });
  assert.equal('authorityGain' in ok && ok.authorityGain === false, true);
});

test('learning pipeline: documented stages; no uncontrolled self-retrain', () => {
  const pipe = openLearningPipeline();
  assert.equal(pipe.uncontrolledSelfRetrain, false);
  assert.equal(pipe.humanApprovalRequired, true);
  assert.deepEqual(listLearningPipelineStages(), learningPipelineDocument());
  assert.equal(listLearningPipelineStages()[0], 'APPROVED_DATA_SOURCES');
  assert.equal(listLearningPipelineStages().at(-1), 'CONTROLLED_DEPLOYMENT');
  const denied = advanceLearningStage({ stage: 'MODEL_EVALUATION', selfRetrain: true });
  assert.equal(denied.allowed, false);
  const human = advanceLearningStage({ stage: 'HUMAN_APPROVAL', humanApproved: false });
  assert.equal(human.allowed, false);
});

test('RAG: private universe indexes isolated', () => {
  const fabric = openKnowledgeFabric();
  assert.equal(fabric.privateUniverseIsolated, true);
  assert.equal(fabric.crossUniverseAutoMerge, false);
  const denied = createVectorIndex({
    indexId: 'idx1',
    tenantId: 't1',
    universeId: 'u1',
    mergeAcrossUniverses: true,
  });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const idx = createVectorIndex({ indexId: 'idx2', tenantId: 't1', universeId: 'u1' });
  assert.equal('indexId' in idx, true);
  if ('indexId' in idx) {
    const q = queryVectorIndex({ index: idx, requestingTenantId: 't1', requestingUniverseId: 'u2' });
    assert.equal(q.allowed, false);
  }
});

test('location: agent cannot exceed precision permission', () => {
  assert.equal(locationAgentMayExceedPrecision({ requested: 'PRECISE', permitted: 'APPROXIMATE' }), true);
  const policy = openDefaultLocationPolicy();
  assert.equal(policy.precisionCeiling, 'APPROXIMATE');
  const denied = evaluateLocationAccess({
    scope: {
      tenantId: 't1',
      universeId: 'u1',
      agentId: 'a1',
      orgApproved: true,
      userApproved: true,
      osGranted: true,
      xivGranted: true,
    },
    purpose: 'NEARBY_SUPPLIERS',
    requestedPrecision: 'PRECISE',
    requestedState: 'WHILE_USING_APP',
    policy,
    retention: { expiresAt: '2026-12-01', indefinite: false, purposeBound: true },
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'precision_exceeds_permission');
});

test('location: background GPS denied without policy', () => {
  const policy = openDefaultLocationPolicy();
  const denied = evaluateLocationAccess({
    scope: {
      tenantId: 't1',
      universeId: 'u1',
      agentId: 'a1',
      orgApproved: true,
      userApproved: true,
      osGranted: true,
      xivGranted: true,
    },
    purpose: 'FIELD_OPS',
    requestedPrecision: 'APPROXIMATE',
    requestedState: 'BACKGROUND_AUTHORIZED',
    policy,
    retention: { expiresAt: '2026-12-01', indefinite: false, purposeBound: true },
    backgroundPolicyApproved: false,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.reason, 'background_gps_denied_without_policy');

  const ok = emitLocationEvent(
    {
      scope: {
        tenantId: 't1',
        universeId: 'u1',
        agentId: 'a1',
        orgApproved: true,
        userApproved: true,
        osGranted: true,
        xivGranted: true,
      },
      purpose: 'DELIVERY_STATUS',
      requestedPrecision: 'APPROXIMATE',
      requestedState: 'ONE_TIME',
      policy,
      retention: { expiresAt: '2026-12-01', indefinite: false, purposeBound: true },
    },
    { eventId: 'e1', agentId: 'a1' },
  );
  assert.equal(ok.allowed, true);
});

test('location fabric: no covert tracking; GPS not auto to every agent; business modules', () => {
  assert.equal(gpsAutoAvailableToEveryAgent(), false);
  assert.equal(covertTrackingAllowed(), false);
  assert.equal(openLocationGateway().covertTracking, false);
  assert.equal(denyCovertLocationUse().allowed, false);
  const covertFence = createGeofence({
    geofenceId: 'g1',
    tenantId: 't1',
    universeId: 'u1',
    purpose: 'GEOFENCED_WORKFLOWS',
    covert: true,
  });
  assert.equal('allowed' in covertFence && covertFence.allowed === false, true);
  assert.equal(listLocationPurposes().length, listLocationBusinessModules().length);
  assert.equal(listLocationPermissionStates().includes('BACKGROUND_AUTHORIZED'), true);
  assert.deepEqual(listLocationPermissionPath()[0], 'OS');
  assert.deepEqual(listLocationPermissionPath().at(-1), 'AUDIT');
});

test('backend intelligence layer + security + evals + admin stubs', () => {
  const layer = openBackendIntelligenceLayer();
  assert.equal(listBackendEngines().length, 11);
  assert.equal(layer.policyEngine.l4Enabled, false);
  assert.equal(layer.connectorGateway.state, 'NOT_CONFIGURED');
  assert.equal(layer.connectorGateway.productionCredentialsEnabled, false);
  assert.equal(layer.productionLive, false);
  assert.equal(openModelSecurity().controls.length, listModelSecurityControls().length);
  assert.equal(listEvalMetrics().includes('HALLUCINATION_RATE'), true);
  const score = scoreEvaluation({
    ACCURACY: 0.9,
    CROSS_TENANT_LEAKAGE: 0,
    UNSAFE_COMPLETION_RATE: 0,
    POLICY_VIOLATIONS: 0,
    humanReviewed: true,
  });
  assert.equal(score.promotionEligible, true);
  assert.equal(detectCrossTenantLeak({ modelTenantId: 't1', dataTenantId: 't2' }).blocked, true);
  assert.equal(listAdminSurfaceStubs().length, 10);
  assert.ok(syntheticDataAllowedForTesting(
    createDataset({
      datasetId: 'syn',
      kind: 'EVALUATION',
      sourceKind: 'SYNTHETIC',
      tenantId: 't1',
      universeId: 'u1',
    }),
  ));
});

test('registry open + governed promote path; prior phase invariants hold', () => {
  const registry = openModelRegistry();
  assert.equal(registry.l4Enabled, false);
  assert.equal(registry.uncontrolledSelfRetrain, false);
  const model = createModelRecord({
    modelId: 'm6',
    provider: 'GOOGLE_AI',
    version: { major: 2, minor: 0, patch: 0, label: 'eval' },
    tenantScope: 't1',
    state: 'EVALUATION_ONLY',
    approvalStatus: 'APPROVED',
    trainingDataLineage: { datasetIds: ['ok'], provenanceComplete: true, trainingAllowed: true },
  });
  const ok = promoteModel({
    model,
    targetState: 'CANARY',
    humanApproved: true,
    guardianApproved: true,
  });
  assert.equal(ok.allowed, true);
  assert.equal(ok.grantsAuthority, false);
  assert.equal(mongoDbLifecycle(), 'NOT_CONFIGURED');
  assert.equal(globalDataFabricProductionLive(), false);
  assert.equal(boundedAutonomyEnabled(), false);
});

console.log('phase2iaa: all tests passed');
