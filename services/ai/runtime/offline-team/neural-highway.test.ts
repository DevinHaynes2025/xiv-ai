import assert from 'node:assert/strict';
import { routeNeuralHighway } from './neural-highway';
import { decideCouncil } from './model-council';

const routes = routeNeuralHighway(
  { tenantId: 'tenant-a', objective: 'summarize local records', requiresOffline: true, maxLatencyMs: 1000, minPrivacyScore: 7, allowedProviders: ['OLLAMA','LOCAL_RULES','GROK'] },
  [
    { provider: 'OLLAMA', execution: 'LOCAL', available: true, offlineCapable: true, latencyMs: 30, costScore: 1, privacyScore: 10, evidenceRefs: ['local-probe'] },
    { provider: 'LOCAL_RULES', execution: 'LOCAL', available: true, offlineCapable: true, latencyMs: 5, costScore: 0, privacyScore: 10, evidenceRefs: [] },
    { provider: 'GROK', execution: 'CLOUD_SANDBOX', available: true, offlineCapable: false, latencyMs: 300, costScore: 4, privacyScore: 7, evidenceRefs: ['network-probe'] },
  ],
);
assert.equal(routes.length, 2);
assert.equal(routes[0]?.provider, 'LOCAL_RULES');

const council = decideCouncil([
  { provider: 'OLLAMA', proposal: 'local path', confidence: 0.82, evidenceRefs: ['e1'], objections: [] },
  { provider: 'LOCAL_RULES', proposal: 'deterministic path', confidence: 0.78, evidenceRefs: ['e2'], objections: ['needs model review'] },
]);
assert.equal(council.requiresHumanReview, true);
assert.equal(council.preservedPositions.length, 2);
