import { startPilotDaemon } from './live-pilot-mode-daemon';
import { publishCollaborationMessage } from './offline-agent-collaboration-bus';
import { classifySyncEntry, approveSyncEntry } from './homebase-sync-journal';
import { evaluatePilotHealth } from './pilot-runtime-health';

const daemon = startPilotDaemon({ tenantId:'t1', deviceId:'d1', checkpointId:'cp1', maxLocalAgents:4, localhostOnly:true, productionMutationAllowed:false }, 3, true);
if (daemon.state !== 'RUNNING' || daemon.externalNetworkUsed) throw new Error('daemon contract failed');

const msg = publishCollaborationMessage({ tenantId:'t1', allowedAgentIds:['a1','a2','a3'], maxAgents:3, localhostOnly:true }, { id:'m1', tenantId:'t1', fromAgentId:'a1', toAgentIds:['a2'], kind:'EVIDENCE', body:'finding', evidenceRefs:['ev1'], createdAt:new Date().toISOString() });
if (msg.id !== 'm1') throw new Error('bus contract failed');

const queued = classifySyncEntry({ id:'s1', tenantId:'t1', deviceId:'d1', sourceCheckpointId:'cp1', classification:'INTERNAL', changeType:'LESSON', contentHash:'h1', evidenceRefs:['ev1'], status:'QUEUED', humanApproval:false, createdAt:new Date().toISOString() });
const approved = approveSyncEntry(queued);
if (approved.status !== 'APPROVED' || !approved.humanApproval) throw new Error('sync journal contract failed');

const health = evaluatePilotHealth({ daemonRunning:true, ollamaReachable:true, queueDepth:4, checkpointAgeMinutes:10, activeAgents:3, maxAgents:4, storageWritable:true });
if (health.overall !== 'HEALTHY') throw new Error('health contract failed');
console.log('12D-64 live pilot daemon/collab/sync journal contracts: OK');
