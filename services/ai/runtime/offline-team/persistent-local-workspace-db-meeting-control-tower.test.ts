import { validateWorkspaceRecord } from './persistent-agent-workspace';
import { validateOfflineDatabaseConfig } from './offline-database-server';
import { validateMeeting } from './agent-meeting-recorder';
import { summarizeReconnect } from './reconnect-control-tower';

const workspaceOk = validateWorkspaceRecord({ id:'w1', tenantId:'t1', agentId:'a1', kind:'TASK', payloadHash:'h1', evidenceRefs:['e1'], createdAt:new Date().toISOString(), approved:false });
const dbOk = validateOfflineDatabaseConfig({ tenantId:'t1', engine:'SQLITE', bindHost:'127.0.0.1', port:43165, encryptedAtRest:true, externalNetworkAllowed:false });
const meetingOk = validateMeeting({ meetingId:'m1', tenantId:'t1', topic:'sync', startedAt:new Date().toISOString(), requiresHumanApproval:true, contributions:[{agentId:'a1',role:'OPS',proposal:'p1',evidenceRefs:['e1'],confidence:.8},{agentId:'a2',role:'SECURITY',proposal:'p2',evidenceRefs:['e2'],confidence:.9,dissent:'review'}] });
const summary = summarizeReconnect([{ id:'r1', tenantId:'t1', sourceDeviceId:'d1', state:'REVIEW_REQUIRED', classification:'TOP_SECRET', evidenceRefs:['e1'], payloadHash:'h2', humanApprovalRequired:true }]);
if (!workspaceOk || !dbOk || !meetingOk || summary.reviewRequired !== 1 || summary.topSecretHeldLocal !== 1) throw new Error('12D-65 contract failure');
console.log('12D-65 persistent workspace/database/meeting/control tower contracts: OK');
