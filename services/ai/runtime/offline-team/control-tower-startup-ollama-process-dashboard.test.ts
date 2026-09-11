import { strict as assert } from 'node:assert';
import { buildStartupReceipt } from './control-tower-startup-runner';
import { classifyOllamaHeartbeat } from './live-ollama-heartbeat';
import { validateAgentProcess, boundedActiveAgents } from './agent-process-registry';
import { buildRuntimeDashboardSnapshot } from './runtime-dashboard-snapshot';

const startup = buildStartupReceipt({ status: 'UNVERIFIED', timestamp: new Date().toISOString(), ollamaReachable: false, agentRegistryLoaded: true, dashboardWritten: true, evidenceRefs: [] });
assert.equal(startup.localhostOnly, true);
assert.equal(startup.productionMutationAllowed, false);
assert.equal(classifyOllamaHeartbeat(true), 'UNVERIFIED');
assert.equal(classifyOllamaHeartbeat(true, 'receipt:ollama'), 'ACTIVE');
assert.equal(validateAgentProcess({ agentId: 'a1', role: 'worker', status: 'ACTIVE' }).status, 'UNVERIFIED');
assert.equal(boundedActiveAgents([]), true);
const snapshot = buildRuntimeDashboardSnapshot({ timestamp: new Date().toISOString(), mode: 'OFFLINE', brainHealth: 'UNVERIFIED', activeAgents: 0, queueDepth: 0, pausedForReview: 0, recoveryPending: 0, ollama: 'UNVERIFIED', gpu: 'UNVERIFIED' });
assert.equal(snapshot.topSecretExternalExposure, false);
console.log('12D-71 control tower startup/ollama/process/dashboard contracts: OK');
