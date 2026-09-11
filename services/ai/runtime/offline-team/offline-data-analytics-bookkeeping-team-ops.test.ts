import { OfflineLearningDataPlane } from './offline-learning-data-plane';
import { UsageAnalyticsLedger } from './usage-analytics-ledger';
import { BookkeepingOps } from './bookkeeping-ops';
import { TeamTaskMeetingOrchestrator } from './team-task-meeting-orchestrator';
import { VendorDeviceIntegrationRegistry } from './vendor-device-integration-registry';

const plane = new OfflineLearningDataPlane();
plane.addRecord({ recordId:'r1', tenantId:'t1', sourceRef:'src:1', contentHash:'sha256:abc', trust:'APPROVED', classification:'INTERNAL', createdAt:new Date().toISOString(), confidence:0.9 });
if (!plane.canEnterTrustedBrain('t1','r1')) throw new Error('approved learning record should enter trusted brain');
plane.registerNode({ nodeId:'local-db', plane:'LOCAL', role:'DATABASE', status:'VERIFIED', receiptRef:'receipt:db' });

const analytics = new UsageAnalyticsLedger();
analytics.append({ eventId:'e1', tenantId:'t1', actorHash:'u:a', type:'VIEW', occurredAt:new Date().toISOString() });
analytics.append({ eventId:'e2', tenantId:'t1', actorHash:'u:a', type:'SESSION_START', occurredAt:new Date().toISOString() });
analytics.append({ eventId:'e3', tenantId:'t1', actorHash:'u:b', type:'VIEW', occurredAt:new Date().toISOString() });
const snapshot = analytics.snapshot('t1');
if (snapshot.views !== 2 || snapshot.uniqueUsers !== 2 || snapshot.sessions !== 1) throw new Error('usage snapshot mismatch');

const books = new BookkeepingOps();
books.post({ entryId:'b1', tenantId:'t1', account:'cash', amountCents:1000, currency:'USD', side:'DEBIT', occurredAt:new Date().toISOString(), evidenceRef:'invoice:1', approved:true });
if (books.balance('t1','cash') !== 1000) throw new Error('bookkeeping balance mismatch');

const ops = new TeamTaskMeetingOrchestrator();
ops.assign({ taskId:'task:1', tenantId:'t1', title:'Measure onboarding funnel', ownerRole:'PRODUCT', status:'ACTIVE', priority:5, evidenceRefs:['metric:1'] });
if (ops.activeTasks('t1').length !== 1) throw new Error('active task missing');
ops.validateMeeting({ meetingId:'m1', tenantId:'t1', objective:'Review operational health', roles:['VIRTUAL_COO','DATA','SECURITY'], evidenceRefs:['receipt:health'], decisionRequiresHumanApproval:true });

const registry = new VendorDeviceIntegrationRegistry();
registry.registerVendor({ vendorId:'google', name:'Google', category:'CLOUD', state:'TARGET', evidenceRefs:[] });
registry.registerDevice({ deviceId:'android-generic', family:'ANDROID', architecture:'arm64', state:'TARGET' });
if (registry.getVendor('google')?.state !== 'TARGET') throw new Error('vendor state mismatch');

console.log('12D-59 offline data/analytics/bookkeeping/team ops contracts: OK');
