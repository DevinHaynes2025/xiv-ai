import assert from 'node:assert/strict';
import { buildLeanAgentFleet, activateFleetAgents, FLEET_SIZE, MAX_CONCURRENT_AGENTS } from './hybrid-agent-fleet';
import { routeHybridTask } from './hybrid-agent-router';
import { verifyPluginCapability } from './plugin-capability-gateway';
import { createFleetPathway, buildSharedLearningContext } from './fleet-neural-learning';

const fleet = buildLeanAgentFleet();
assert.equal(fleet.length, FLEET_SIZE);
assert.equal(FLEET_SIZE, 100);
assert.equal(MAX_CONCURRENT_AGENTS, 8);

const active = activateFleetAgents(fleet, fleet.slice(0, 4).map(x => x.id), ['OLLAMA:qwen2.5-coder:7b']);
assert.equal(active.filter(x => x.state === 'READY').length, 4);

const local = routeHybridTask({ tenantId: 'xiv', taskId: 't1', requiresInternet: false, containsTopSecret: false, providerEvidence: { OLLAMA: ['OLLAMA:qwen'] } });
assert.equal(local.provider, 'OLLAMA');
assert.equal(local.online, false);

const secret = routeHybridTask({ tenantId: 'xiv', taskId: 't2', requiresInternet: true, containsTopSecret: true, preferred: 'PLUGIN', providerEvidence: { OLLAMA: ['OLLAMA:qwen'], PLUGIN: ['PLUGIN:online'] } });
assert.equal(secret.provider, 'OLLAMA');
assert.equal(secret.online, false);

const plugin = verifyPluginCapability({ id: 'p1', provider: 'approved-tool', capability: 'research', status: 'UNVERIFIED', online: true, tenantScoped: true, canReceiveSecrets: false, evidenceRefs: ['receipt:p1'] });
assert.equal(plugin.status, 'AVAILABLE');

const pathway = createFleetPathway({ tenantId: 'xiv', agentId: fleet[0].id, taskId: 't1', lesson: 'prefer local evidence before online escalation', confidence: 0.9, evidenceRefs: ['receipt:t1'], approved: true });
assert.equal(buildSharedLearningContext([pathway], 'xiv').length, 1);

console.log('12D-40 hybrid 100-agent fleet/plugin/neural learning contracts: OK');
