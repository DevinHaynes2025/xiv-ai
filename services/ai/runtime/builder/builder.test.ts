import assert from 'node:assert/strict';
import { DEFAULT_BUILDERS, decideBuilderRequest, planDatabase, selectBuilder } from './index';

const local = decideBuilderRequest({
  requestId: 'local-1', provider: 'OLLAMA', target: 'LOCAL', artifactKind: 'DATABASE_SCHEMA',
  objective: 'build an offline knowledge database', repositoryBranch: 'xiv-12d-dimensional-fabric',
  requiresNetwork: false, touchesProductionData: false, destructive: false,
});
assert.equal(local.allowed, true);
assert.equal(local.executionMode, 'SANDBOX_EXECUTE');
assert.equal(selectBuilder(DEFAULT_BUILDERS, true)?.provider, 'OLLAMA');

const production = decideBuilderRequest({
  requestId: 'prod-1', provider: 'GROK', target: 'PRODUCTION', artifactKind: 'MIGRATION',
  objective: 'change production schema', repositoryBranch: 'xiv-12d-dimensional-fabric',
  requiresNetwork: true, touchesProductionData: true, destructive: false,
});
assert.equal(production.allowed, false);
assert.equal(production.executionMode, 'BLOCKED');

const plan = planDatabase({
  requestId: 'cloud-1', provider: 'GROK', target: 'CLOUD_SANDBOX', artifactKind: 'ARCHITECTURE',
  objective: 'design cloud database', repositoryBranch: 'xiv-12d-dimensional-fabric',
  requiresNetwork: true, touchesProductionData: false, destructive: false,
}, {
  name: 'xiv-knowledge-shard', engine: 'POSTGRES', purpose: 'knowledge graph metadata',
  tablesOrCollections: ['facts', 'edges', 'sources', 'shards'], offlineCapable: true, productionReady: false,
});
assert.equal(plan.decision.allowed, true);
assert.ok(plan.steps.includes('stop before production deployment'));

console.log('governed offline-cloud builder contracts hold');
