import { buildLocalDbReceipt } from './live-local-database-adapter';
import { createAgentState, restoreAgentStates } from './persistent-agent-state-store';
import { scheduleAgentMeeting } from './agent-meeting-scheduler';
import { createControlTowerApiConfig, summarizeControlTower } from './control-tower-local-api';

const db = buildLocalDbReceipt({ tenantId: 'tenant-a', engine: 'FILE_JSON', path: '.xiv-runtime/xiv-local-db.json', encryptedAtRest: true, localhostOnly: true });
if (db.health !== 'UNVERIFIED') throw new Error('unverified local DB must remain UNVERIFIED');

const state = createAgentState({ tenantId: 'tenant-a', agentId: 'agent-1', role: 'QA', status: 'PAUSED', checkpointId: 'cp-1', memoryNamespace: 'qa', queueItemIds: ['job-1'] });
if (restoreAgentStates([state], 'tenant-a').length !== 1) throw new Error('agent state restore failed');

const meeting = scheduleAgentMeeting({ tenantId: 'tenant-a', meetingId: 'm-1', topic: 'Pilot health', participantAgentIds: ['agent-1', 'agent-2'], cadence: 'ON_DEMAND', scheduledFor: new Date().toISOString() });
if (!meeting.preserveDissent) throw new Error('dissent must be preserved');

const api = createControlTowerApiConfig();
if (api.host !== '127.0.0.1' || api.externalNetworkAllowed) throw new Error('Control Tower API must remain localhost-only');

const snapshot = summarizeControlTower({ tenantId: 'tenant-a', status: 'UNVERIFIED', activeAgents: 2, queuedJobs: 1, pendingSync: 1, conflicts: 0, meetingsScheduled: 1, databaseHealth: 'UNVERIFIED', ollamaHealth: 'UNVERIFIED', gpuHealth: 'UNVERIFIED' });
if (snapshot.activeAgents !== 2) throw new Error('snapshot mismatch');

console.log('12D-66 live local DB/agent state/meeting/control API contracts: OK');
