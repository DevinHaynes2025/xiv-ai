import test from 'node:test';
import assert from 'node:assert/strict';
import { presentMobileDataStatus, validateMobileDataStatusInput } from './xvi-mobile-data-fabric-status-card';

const NOW='2026-10-01T08:00:00Z';
const base={
  tenantId:'tenant:alpha',
  deviceId:'device:iphone:1',
  mode:'ONLINE_GOVERNED',
  networkReachable:true,
  pendingEventCount:100,
  queueCapacity:1000,
  checkpointState:'SEALED',
  lastCheckpointAt:'2026-10-01T07:50:00Z',
  lastReconciliationAt:'2026-10-01T07:55:00Z',
  quarantinedRecordCount:0,
  retryAfterAt:null,
  safeReadOnly:true,
  executionAuthority:false,
  mutationAuthority:false,
  productionAuthority:false,
} as const;

test('healthy online governed state presents live read-only status',()=>{const x=presentMobileDataStatus(base,NOW);assert.equal(x.statusState,'LIVE');assert.equal(x.attentionRoute,'UNIVERSE');assert.equal(x.canSync,false);});
test('offline governed mode presents bounded offline buffering',()=>{const x=presentMobileDataStatus({...base,mode:'OFFLINE_GOVERNED' as const,networkReachable:false},NOW);assert.equal(x.statusState,'OFFLINE_BUFFERING');assert.equal(x.attentionRoute,'UNIVERSE');});
test('local only mode remains local only',()=>{const x=presentMobileDataStatus({...base,mode:'LOCAL_ONLY' as const,networkReachable:false},NOW);assert.equal(x.statusState,'LOCAL_ONLY');});
test('queue backpressure routes to Needs You',()=>{const x=presentMobileDataStatus({...base,pendingEventCount:850},NOW);assert.equal(x.statusState,'BACKPRESSURE');assert.equal(x.attentionRoute,'NEEDS_YOU');});
test('quarantined data dominates other presentation states',()=>{const x=presentMobileDataStatus({...base,quarantinedRecordCount:2},NOW);assert.equal(x.statusState,'QUARANTINED');assert.equal(x.primaryAction,'Review quarantined data');});
test('online governed connectivity loss routes to recovery',()=>{const x=presentMobileDataStatus({...base,networkReachable:false},NOW);assert.equal(x.statusState,'RECOVERY_REQUIRED');assert.equal(x.attentionRoute,'NEEDS_YOU');});
test('stale checkpoint routes to safe recovery',()=>{const x=presentMobileDataStatus({...base,lastCheckpointAt:'2026-09-29T00:00:00Z'},NOW);assert.equal(x.statusState,'RECOVERY_REQUIRED');});
test('queue cannot exceed governed capacity',()=>{assert.throws(()=>validateMobileDataStatusInput({...base,pendingEventCount:1001}),/QUEUE_BOUNDS_INVALID/);});
test('authority escalation is refused',()=>{assert.throws(()=>validateMobileDataStatusInput({...base,mutationAuthority:true} as any),/MOBILE_STATUS_AUTHORITY_VIOLATION/);});
test('accessor-bearing input fails closed without getter execution',()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,'mode',{enumerable:true,get(){hits++;return 'ONLINE_GOVERNED';}});assert.throws(()=>validateMobileDataStatusInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
