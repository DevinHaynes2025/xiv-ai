import assert from 'node:assert/strict';
import { buildBrainHierarchy, DATABASE_CITY_GUARDRAILS, memoryTierForAge, replicationPlan } from './fabric';
import { fallbackChain, routeDatabaseCity } from './router';
import type { DatabaseNode, HighwayRequest } from './types';

const nodes: DatabaseNode[] = [
  { id: 'device-1', level: 'DEVICE', provider: 'LOCAL', region: 'device', tier: 'HOT', state: 'AVAILABLE', writable: true, vectorCapable: true, graphCapable: true, encrypted: true, tenantId: 'xiv', estimatedLatencyMs: 4, estimatedCostPerMillionOps: 1 },
  { id: 'company-1', level: 'COMPANY', provider: 'GOOGLE_CLOUD', region: 'us-central1', tier: 'WARM', state: 'AVAILABLE', writable: true, vectorCapable: true, graphCapable: true, encrypted: true, tenantId: 'xiv', estimatedLatencyMs: 35, estimatedCostPerMillionOps: 8 },
  { id: 'regional-1', level: 'REGIONAL', provider: 'AZURE', region: 'centralus', tier: 'COLD', state: 'AVAILABLE', writable: true, vectorCapable: true, graphCapable: false, encrypted: true, tenantId: 'xiv', estimatedLatencyMs: 48, estimatedCostPerMillionOps: 10 },
  { id: 'global-1', level: 'GLOBAL', provider: 'GOOGLE_CLOUD', region: 'global', tier: 'ARCHIVE', state: 'AVAILABLE', writable: false, vectorCapable: true, graphCapable: true, encrypted: true, tenantId: 'xiv', estimatedLatencyMs: 90, estimatedCostPerMillionOps: 5 },
];

const request: HighwayRequest = {
  tenantId: 'xiv', requiresWrite: false, requiresVector: true, requiresGraph: false,
  offlinePreferred: true, maxLatencyMs: 100, maxCostPerMillionOps: 20,
  allowedProviders: ['LOCAL', 'GOOGLE_CLOUD', 'AZURE'],
};

assert.equal(routeDatabaseCity(nodes, request)?.nodeIds[0], 'device-1');
assert.equal(fallbackChain(nodes, request).length, 4);
assert.deepEqual(buildBrainHierarchy(nodes[0], nodes[1], nodes[2], nodes[3]).map((n) => n.level), ['DEVICE','COMPANY','REGIONAL','GLOBAL']);
assert.equal(replicationPlan(nodes).every((p) => p.productionAutoApply === false), true);
assert.equal(memoryTierForAge(0.5), 'HOT');
assert.equal(memoryTierForAge(48), 'WARM');
assert.equal(memoryTierForAge(24 * 30), 'COLD');
assert.equal(memoryTierForAge(24 * 500), 'ARCHIVE');
assert.equal(DATABASE_CITY_GUARDRAILS.providerLockInRequired, false);
assert.equal(DATABASE_CITY_GUARDRAILS.autonomousCloudCreation, false);
console.log('database city multi-cloud routing contracts hold');
