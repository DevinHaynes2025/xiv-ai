import assert from 'node:assert/strict';
import { defaultControlTowerServerConfig, sanitizeControlTowerSnapshot } from './local-control-tower-server';
import { AgentHeartbeatStore } from './agent-heartbeat-store';
import { nextJobState } from './persistent-queue-worker';
import { decideRecovery } from './recovery-supervisor';

assert.equal(defaultControlTowerServerConfig.host, '127.0.0.1');
assert.equal(defaultControlTowerServerConfig.externalNetworkAllowed, false);
assert.equal(defaultControlTowerServerConfig.topSecretResponsesAllowed, false);

const hb = new AgentHeartbeatStore();
hb.upsert({ tenantId: 't1', agentId: 'a1', role: 'QA', status: 'ACTIVE', lastSeenAt: new Date().toISOString(), evidenceRefs: ['r1'] });
assert.equal(hb.activeCount('t1'), 1);

const snap = sanitizeControlTowerSnapshot({ tenantId: 't1', generatedAt: new Date().toISOString(), activeAgents: 99, queuedJobs: 1, failedJobs: 0, checkpoints: 1, ollama: 'UNVERIFIED', runtime: 'UNVERIFIED' });
assert.equal(snap.activeAgents, 8);

const retried = nextJobState({ tenantId: 't1', jobId: 'j1', kind: 'study', status: 'RUNNING', attempts: 0, maxAttempts: 2, requiresHumanApproval: true, productionMutationAllowed: false, evidenceRefs: [] }, false);
assert.equal(retried.status, 'RETRY_WAIT');
assert.equal(decideRecovery({ tenantId: 't1', jobId: 'j1', checkpointAvailable: true, attempts: 1, maxAttempts: 2, classification: 'INTERNAL', evidenceRefs: ['r1'] }), 'RESUME_FROM_CHECKPOINT');

console.log('12D-69 localhost control tower/heartbeats/queue/recovery contracts: OK');
