import { FileBackedRuntimeStore } from './file-backed-runtime-store';
import { recoverAgentAfterRestart } from './agent-restart-recovery';
import { summarizeMeeting } from './local-meeting-runner';
import { validateControlTowerServer } from './control-tower-local-server';

const store = new FileBackedRuntimeStore({ rootDir: '.xiv-runtime', encryptedAtRest: true, externalNetworkAllowed: false });
const record = store.createRecord({
  tenantId: 'tenant-a', id: 'state-1', kind: 'AGENT_STATE', classification: 'INTERNAL', payload: { ok: true },
  createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
});
if (!record.sha256) throw new Error('missing-hash');

const recovery = recoverAgentAfterRestart({ tenantId: 'tenant-a', agentId: 'agent-1', checkpointId: 'cp-1', memoryNamespace: 'm1', status: 'FAILED', queue: [], lastHeartbeatAt: new Date(0).toISOString(), stateHash: 'abc' });
if (!recovery.restored || recovery.resumedStatus !== 'RECOVERING') throw new Error('recovery-failed');

const meeting = summarizeMeeting({ meetingId: 'm-1', tenantId: 'tenant-a', participants: [
  { agentId: 'a', role: 'analyst', evidenceRefs: ['e1'] },
  { agentId: 'b', role: 'reviewer', evidenceRefs: ['e2'] },
], agenda: ['review'], dissentRequired: true, productionMutationAllowed: false });
if (meeting.participantCount !== 2 || !meeting.humanApprovalRequired) throw new Error('meeting-contract-failed');

validateControlTowerServer({ host: '127.0.0.1', port: 8765, authRequired: true, externalNetworkAllowed: false, topSecretResponsesAllowed: false });
console.log('12D-67 executable runtime store/restart/meeting/control server contracts: OK');
