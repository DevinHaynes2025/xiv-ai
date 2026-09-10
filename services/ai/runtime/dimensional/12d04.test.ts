import assert from 'node:assert/strict';
import { BUILDER_GUARDRAILS, decideBuilderRequest } from '../builder';
import {
  CURRENT_DIMENSIONAL_MILESTONE,
  DATABASE_CITY_GUARDRAILS,
  DEFAULT_VECTOR_PROVIDER_STATUS,
  PHYSICAL_PORTAL_CAPABILITY,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  RESEARCH_DIMENSION_CEILING,
  appendSyncEntry,
  assertNoFakeAcceleratorVerified,
  bridgeHistoryOntoCity,
  buildNeuralHighways,
  createDefaultDatabaseCity,
  createGlobalBrain,
  createLocalVectorStub,
  createPocketBrain,
  createWaitingVectorProvider,
  defaultSiliconClaims,
  demoteMemoryHeat,
  executeCloudSandboxPlan,
  markSiliconDetected,
  planGoogleCloudSandbox,
  promoteMemoryHeat,
  reconcileJournal,
  routeCityPath,
} from './index';

assert.equal(CURRENT_DIMENSIONAL_MILESTONE, 12);
assert.equal(RESEARCH_DIMENSION_CEILING, 100);
assert.equal(PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(PHYSICAL_PORTAL_CAPABILITY, false);
assert.equal(DATABASE_CITY_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(DATABASE_CITY_GUARDRAILS.PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousProductionDML, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousDestructiveMigration, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousSecretCreation, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousDeployment, false);
assert.equal(BUILDER_GUARDRAILS.autonomousDeployment, false);
assert.equal(DATABASE_CITY_GUARDRAILS.unstructuredMillionDbClaim, false);
assert.equal(DATABASE_CITY_GUARDRAILS.liveProductionDdlAllowed, false);

const city = createDefaultDatabaseCity('test-city');
assert.equal(city.length, 5);
assert.deepEqual(
  city.map((n) => n.tier),
  ['device', 'local_shard', 'company_brain', 'regional_brain', 'global_brain'],
);
assert.ok(city.every((n) => n.holdsGlobalBrain === false));

const pocket = createPocketBrain({ nodeId: 'pb-1', deviceId: 'phone-1' });
assert.equal(pocket.kind, 'pocket_brain');
assert.equal(pocket.holdsGlobalBrain, false);
assert.equal(pocket.offlineCapable, true);

const global = createGlobalBrain({ nodeId: 'gb-1' });
assert.equal(global.kind, 'global_brain');
assert.equal(global.materializesOnDevice, false);
assert.equal(global.federated, true);

const highways = buildNeuralHighways(city);
assert.ok(highways.length >= 8);
assert.ok(highways.every((e) => e.evidenceScore > 0));

const route = routeCityPath(city, 'device', 'global_brain');
assert.ok(route);
assert.equal(route!.sparse, true);
assert.equal(route!.productionAuthorized, false);
assert.deepEqual(route!.tiers, [
  'device',
  'local_shard',
  'company_brain',
  'regional_brain',
  'global_brain',
]);
assert.equal(route!.path.length, 5);

const down = routeCityPath(city, 'regional_brain', 'local_shard');
assert.ok(down);
assert.deepEqual(down!.tiers, ['regional_brain', 'company_brain', 'local_shard']);

assert.equal(promoteMemoryHeat('warm'), 'hot');
assert.equal(demoteMemoryHeat('hot'), 'warm');
assert.equal(demoteMemoryHeat('archive'), 'archive');

const historical = bridgeHistoryOntoCity(
  {
    refId: 'ancient-route',
    relatedRefId: 'modern-lane',
    stance: 'HYPOTHESIS',
    ancientSource: true,
  },
  'local_shard',
  'company_brain',
);
assert.equal(historical.highwayKind, 'reconcile');
assert.equal(historical.autoVerified, false);
assert.ok(historical.evidenceScore <= 0.4);

const localEntry = appendSyncEntry({
  entryId: 'e1',
  op: 'UPSERT',
  entityId: 'fact-1',
  contentHash: 'abc',
  sourceTier: 'device',
  targetTier: 'local_shard',
});
assert.equal(localEntry.applied, false);
assert.equal(localEntry.offlineOrigin, true);

const peerSame = appendSyncEntry({
  entryId: 'e2',
  op: 'UPSERT',
  entityId: 'fact-1',
  contentHash: 'abc',
  sourceTier: 'company_brain',
  targetTier: 'local_shard',
  offlineOrigin: false,
});
const ok = reconcileJournal([localEntry], [peerSame]);
assert.equal(ok.conflicts.length, 0);
assert.equal(ok.applied.length, 1);
assert.equal(ok.productionMutation, false);

const peerDiff = appendSyncEntry({
  entryId: 'e3',
  op: 'UPSERT',
  entityId: 'fact-1',
  contentHash: 'xyz',
  sourceTier: 'company_brain',
  targetTier: 'local_shard',
  offlineOrigin: false,
});
const conflicted = reconcileJournal([localEntry], [peerDiff]);
assert.equal(conflicted.conflicts.length, 1);
assert.equal(conflicted.conflicts[0].strategy, 'MANUAL');
assert.equal(conflicted.conflicts[0].resolved, false);
assert.equal(conflicted.productionMutation, false);

const localVec = createLocalVectorStub([
  { id: 'a', embedding: [1, 0, 0] },
  { id: 'b', embedding: [0.9, 0.1, 0] },
  { id: 'c', embedding: [0, 1, 0] },
]);
const hits = localVec.search({ queryId: 'q1', embedding: [1, 0, 0], topK: 2 });
assert.equal(hits.providerStatus, 'LOCAL_STUB');
assert.equal(hits.hits.length, 2);
assert.equal(hits.hits[0].id, 'a');

const waiting = createWaitingVectorProvider('vertex-ann');
const waitResult = waiting.search({ queryId: 'q2', embedding: [1, 0], topK: 3 });
assert.equal(waitResult.providerStatus, 'WAITING_PROVIDER');
assert.equal(waitResult.hits.length, 0);
assert.equal(DEFAULT_VECTOR_PROVIDER_STATUS, 'WAITING_PROVIDER');

const sandbox = planGoogleCloudSandbox({ planId: 'gcp-1' });
assert.equal(sandbox.target, 'CLOUD_SANDBOX');
assert.equal(sandbox.autonomousDeploy, false);
assert.equal(sandbox.secretsEmbedded, false);
assert.equal(sandbox.provider, 'GOOGLE_CLOUD');
const exec = executeCloudSandboxPlan(sandbox);
assert.equal(exec.status, 'GENERATE_ONLY');
assert.equal(exec.deployed, false);
const blocked = executeCloudSandboxPlan(sandbox, true);
assert.equal(blocked.status, 'BLOCKED');
assert.equal(blocked.deployed, false);

const silicon = defaultSiliconClaims();
assert.equal(silicon.find((c) => c.backend === 'cpu')?.status, 'VERIFIED');
assert.ok(silicon.filter((c) => c.backend !== 'cpu').every((c) => c.status === 'WAITING'));
const detected = markSiliconDetected(silicon, 'gpu');
assert.equal(detected.find((c) => c.backend === 'gpu')?.status, 'DETECTED');
assertNoFakeAcceleratorVerified(detected);
assert.throws(() =>
  assertNoFakeAcceleratorVerified([
    { backend: 'gpu', status: 'VERIFIED', notes: 'fake' },
  ]),
);

const productionBlocked = decideBuilderRequest({
  requestId: 'dbcity-prod',
  provider: 'LOCAL_RULES',
  target: 'PRODUCTION',
  artifactKind: 'DATABASE_SCHEMA',
  objective: 'should block',
  repositoryBranch: 'grok/12d-04-database-city',
  requiresNetwork: false,
  touchesProductionData: true,
  destructive: false,
});
assert.equal(productionBlocked.allowed, false);
assert.equal(productionBlocked.executionMode, 'BLOCKED');

console.log('XIV 12D-04 Database City + Neural Highway Fabric contracts hold (L4=false, no live DDL).');
