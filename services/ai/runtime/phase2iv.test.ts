/**
 * Phase 2I-V / 2I-S extension: Compute Fabric, Algorithm Foundry V2, polyglot data, trust roots.
 * Deterministic. No network. Does not weaken 2I-T. Does not mix 2I-U mature communities.
 */
import assert from 'node:assert/strict';

import { boundedAutonomyEnabled } from './authority';
import { companiesHouseSourceState } from './international';
import { gleifAdapterCapabilityStatus, recordGleifValidatedRetrieval, resetGleifAdapterStatusForTests } from './international/status';
import { gleifRemainsIdentityOnly } from './market';
import { globalDataFabricProductionLive } from './network-os';
import { EXPERIENCE_AGENTS } from './network-os/experience';
import {
  agentObtainsDbCredentials,
  algorithmCannotBypassApproval,
  algorithmCannotDeployItself,
  auditRootCanBeDisabled,
  dataRootPreservesProvenance,
  detectNvidiaCapability,
  deviceCannotImpersonateIdentity,
  evaluateArtifact,
  gpuUnavailableFallsBackToCpu,
  mobileRequiresNvidia,
  modelGrantsOwnPermissions,
  moreComputeMeansMorePrivilege,
  nvidiaCapabilityCanBeFabricated,
  nvidiaRequiredForXiv,
  promoteAlgorithm,
  proposeFoundryAlgorithm,
  replicateRegion,
  routeComputeWorkload,
  routeDataQuery,
  scheduleAiWorkload,
  trustRootUnknownIsTrusted,
  unknownDependencyIsTrusted,
} from './foundations';
import { recordSecValidatedRetrieval, resetSecAdapterStatusForTests, secAdapterCapabilityStatus } from './sources/sec-status';
import {
  recordWorldBankValidatedRetrieval,
  resetWorldBankAdapterStatusForTests,
  worldBankAdapterCapabilityStatus,
} from './sources/world-bank-status';

function test(name: string, run: () => void) {
  run();
  console.log(`ok - ${name}`);
}

test('GPU unavailable → CPU fallback', () => {
  assert.equal(gpuUnavailableFallsBackToCpu(), true);
  const routed = routeComputeWorkload({ guardianAuthorized: true, nvidiaPresent: false });
  assert.equal(routed.allowed, true);
  if (routed.allowed) assert.equal(routed.accelerator, 'CPU');
});

test('NVIDIA capability cannot be fabricated', () => {
  assert.equal(nvidiaCapabilityCanBeFabricated(), false);
  assert.equal(nvidiaRequiredForXiv(), false);
  assert.equal(mobileRequiresNvidia(), false);
  const phone = detectNvidiaCapability('CUDA_AVAILABLE', { hostHasNvidia: false });
  assert.equal(phone.available, false);
  assert.equal(phone.evidence, false);
});

test('GPU workload still requires Guardian', () => {
  const denied = routeComputeWorkload({ guardianAuthorized: false, nvidiaPresent: true });
  assert.equal(denied.allowed, false);
  if (!denied.allowed) assert.equal(denied.reason, 'gpu_workload_requires_guardian');
});

test('algorithm cannot deploy itself', () => {
  assert.equal(algorithmCannotDeployItself(), true);
  const denied = promoteAlgorithm({
    candidate: proposeFoundryAlgorithm({ class: 'InventoryAlgorithm', workload: 'safety_stock_optimization' }),
    next: 'production',
    selfDeploy: true,
    humanApproved: true,
  });
  assert.equal(denied.allowed, false);
});

test('algorithm cannot bypass approval', () => {
  assert.equal(algorithmCannotBypassApproval(), true);
});

test('model cannot grant itself permissions', () => {
  assert.equal(modelGrantsOwnPermissions(), false);
  const denied = scheduleAiWorkload({ guardianAuthorized: true, modelPolicyAllows: false });
  assert.equal(denied.allowed, false);
});

test('agent cannot directly obtain DB credentials', () => {
  assert.equal(agentObtainsDbCredentials(), false);
  const denied = routeDataQuery({
    store: 'RELATIONAL',
    tenantId: 'tenant-a',
    purpose: 'ops',
    rawSecretRequested: true,
  });
  assert.equal(denied.allowed, false);
});

test('graph query respects tenant', () => {
  const denied = routeDataQuery({
    store: 'GRAPH',
    tenantId: 'tenant-a',
    requestedTenantId: 'tenant-b',
    purpose: 'supply_graph',
  });
  assert.equal(denied.allowed, false);
});

test('vector query respects Universe', () => {
  const denied = routeDataQuery({
    store: 'VECTOR',
    tenantId: 'tenant-a',
    universeId: 'ops',
    requestedUniverseId: 'finance',
    purpose: 'retrieval',
  });
  assert.equal(denied.allowed, false);
});

test('search query respects classification', () => {
  const denied = routeDataQuery({
    store: 'SEARCH',
    tenantId: 'tenant-a',
    classification: 'TENANT_PRIVATE',
    purpose: 'public_discovery',
  });
  assert.equal(denied.allowed, false);
});

test('object storage respects data scope', () => {
  const denied = routeDataQuery({
    store: 'OBJECT',
    tenantId: 'tenant-a',
    purpose: 'media',
  });
  assert.equal(denied.allowed, false);
});

test('cross-database joins cannot bypass authorization', () => {
  const denied = routeDataQuery({
    store: 'RELATIONAL',
    tenantId: 'tenant-a',
    purpose: 'ops',
    crossDatabaseJoinBypass: true,
  });
  assert.equal(denied.allowed, false);
});

test('data root preserves provenance', () => {
  const denied = dataRootPreservesProvenance({ from: 'source-a', to: 'object-b' });
  assert.equal('allowed' in denied && denied.allowed === false, true);
  const kept = dataRootPreservesProvenance({
    from: 'source-a',
    to: 'object-b',
    evidence: { source: 'ledger', retrievedAt: '2026-09-07T00:00:00.000Z', reference: 'lin-1' },
  });
  assert.equal('allowed' in kept, false);
  if (!('allowed' in kept)) assert.equal(kept.historicalRetention, true);
});

test('device root cannot impersonate identity root', () => {
  assert.equal(deviceCannotImpersonateIdentity(), true);
});

test('audit root cannot be disabled', () => {
  assert.equal(auditRootCanBeDisabled(), false);
});

test('artifact without valid signature denied', () => {
  const denied = evaluateArtifact({ signed: false, signatureValid: false });
  assert.equal(denied.allowed, false);
});

test('unknown dependency trust state != trusted', () => {
  assert.equal(unknownDependencyIsTrusted(), false);
  assert.equal(trustRootUnknownIsTrusted('DependencyTrustRoot'), false);
});

test('regional policy prevents forbidden replication', () => {
  const denied = replicateRegion({ sourceRegion: 'NORTH_AMERICA', destRegion: 'EUROPE', policyAllows: false });
  assert.equal(denied.allowed, false);
});

test('more compute does not mean more privilege', () => {
  assert.equal(moreComputeMeansMorePrivilege(), false);
});

test('experience agents unchanged', () => {
  assert.equal(EXPERIENCE_AGENTS.length, 11);
});

test('L4 remains disabled', () => {
  assert.equal(boundedAutonomyEnabled(), false);
});

test('GDF production-live=false', () => {
  assert.equal(globalDataFabricProductionLive(), false);
});

test('World Bank proven', () => {
  resetWorldBankAdapterStatusForTests();
  recordWorldBankValidatedRetrieval();
  assert.equal(worldBankAdapterCapabilityStatus(), 'LIVE');
  resetWorldBankAdapterStatusForTests();
});

test('SEC proven', () => {
  resetSecAdapterStatusForTests();
  recordSecValidatedRetrieval();
  assert.equal(secAdapterCapabilityStatus(), 'LIVE');
  resetSecAdapterStatusForTests();
});

test('GLEIF proven', () => {
  resetGleifAdapterStatusForTests();
  recordGleifValidatedRetrieval();
  assert.equal(gleifAdapterCapabilityStatus(), 'LIVE');
  assert.equal(gleifRemainsIdentityOnly(), true);
  resetGleifAdapterStatusForTests();
});

test('Companies House NOT_CONFIGURED', () => {
  assert.equal(companiesHouseSourceState(), 'NOT_CONFIGURED');
});
