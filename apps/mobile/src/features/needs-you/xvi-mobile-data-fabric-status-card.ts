export type XviOperatingMode = 'ONLINE_GOVERNED' | 'OFFLINE_GOVERNED' | 'LOCAL_ONLY';
export type XviMobileCheckpointState = 'NONE' | 'OPEN' | 'SEALED' | 'RECONCILING' | 'RECONCILED' | 'REVOKED';
export type XviMobileStatusState = 'LIVE' | 'LOCAL_ONLY' | 'OFFLINE_BUFFERING' | 'RECONCILING' | 'BACKPRESSURE' | 'RECOVERY_REQUIRED' | 'QUARANTINED';
export type XviMobileAttentionRoute = 'UNIVERSE' | 'NEEDS_YOU';

export interface XviMobileDataStatusInput {
  readonly tenantId: string;
  readonly deviceId: string;
  readonly mode: XviOperatingMode;
  readonly networkReachable: boolean;
  readonly pendingEventCount: number;
  readonly queueCapacity: number;
  readonly checkpointState: XviMobileCheckpointState;
  readonly lastCheckpointAt: string | null;
  readonly lastReconciliationAt: string | null;
  readonly quarantinedRecordCount: number;
  readonly retryAfterAt: string | null;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviMobileDataStatusPresentation {
  readonly schemaVersion: 'xvi-mobile-data-status-card-v1';
  readonly statusState: XviMobileStatusState;
  readonly attentionRoute: XviMobileAttentionRoute;
  readonly title: string;
  readonly body: string;
  readonly modeLabel: string;
  readonly connectionLabel: string;
  readonly queueLabel: string;
  readonly checkpointLabel: string;
  readonly attentionLabel: string | null;
  readonly primaryAction: 'Open sync status' | 'Open recovery' | 'Review quarantined data' | 'Open storage status' | null;
  readonly secondaryAction: 'Ask XVI' | null;
  readonly safeReadOnly: true;
  readonly canSync: false;
  readonly canMutate: false;
  readonly canClaimExecution: false;
  readonly accessibilityLabel: string;
}

const PLAIN = Object.getPrototypeOf({});
const MODES = new Set<XviOperatingMode>(['ONLINE_GOVERNED','OFFLINE_GOVERNED','LOCAL_ONLY']);
const CHECKPOINTS = new Set<XviMobileCheckpointState>(['NONE','OPEN','SEALED','RECONCILING','RECONCILED','REVOKED']);
const KEYS = ['tenantId','deviceId','mode','networkReachable','pendingEventCount','queueCapacity','checkpointState','lastCheckpointAt','lastReconciliationAt','quarantinedRecordCount','retryAfterAt','safeReadOnly','executionAuthority','mutationAuthority','productionAuthority'] as const;

function plain(v: unknown): asserts v is Record<string, unknown> {
  if (v === null || typeof v !== 'object' || Object.getPrototypeOf(v) !== PLAIN) throw new Error('MOBILE_STATUS_PLAIN_OBJECT_REQUIRED');
  if (Object.getOwnPropertySymbols(v).length) throw new Error('MOBILE_STATUS_SYMBOLS_FORBIDDEN');
  for (const k of Object.keys(v)) {
    const d = Object.getOwnPropertyDescriptor(v,k);
    if (!d || d.get || d.set) throw new Error('MOBILE_STATUS_ACCESSOR_FORBIDDEN');
  }
}
function exact(v: Record<string, unknown>): void {
  const a=Object.keys(v).sort(), b=[...KEYS].sort();
  if (a.length!==b.length || a.some((k,i)=>k!==b[i])) throw new Error('MOBILE_STATUS_SCHEMA_MISMATCH');
}
function count(v:number,max:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<0||v>max) throw new Error(`${label}_INVALID`);
}
function isoOrNull(v:string|null,label:string):void{
  if(v===null)return;
  if(typeof v!=='string'||!v.includes('T')||Number.isNaN(Date.parse(v))) throw new Error(`${label}_INVALID`);
}
function humanize(v:string):string{
  return v.toLowerCase().split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
}

export function validateMobileDataStatusInput(input: unknown): Readonly<XviMobileDataStatusInput> {
  plain(input); exact(input);
  const v=input as unknown as XviMobileDataStatusInput;
  if(!/^tenant:/.test(v.tenantId)||!/^device:/.test(v.deviceId)) throw new Error('MOBILE_STATUS_IDENTITY_INVALID');
  if(!MODES.has(v.mode)||!CHECKPOINTS.has(v.checkpointState)) throw new Error('MOBILE_STATUS_STATE_INVALID');
  if(typeof v.networkReachable!=='boolean') throw new Error('NETWORK_REACHABLE_INVALID');
  count(v.pendingEventCount,10_000_000,'PENDING_EVENT_COUNT');
  count(v.queueCapacity,10_000_000,'QUEUE_CAPACITY');
  count(v.quarantinedRecordCount,10_000_000,'QUARANTINED_RECORD_COUNT');
  if(v.queueCapacity<1||v.pendingEventCount>v.queueCapacity) throw new Error('QUEUE_BOUNDS_INVALID');
  isoOrNull(v.lastCheckpointAt,'LAST_CHECKPOINT_AT');
  isoOrNull(v.lastReconciliationAt,'LAST_RECONCILIATION_AT');
  isoOrNull(v.retryAfterAt,'RETRY_AFTER_AT');
  if(v.checkpointState!=='NONE'&&v.lastCheckpointAt===null) throw new Error('CHECKPOINT_TIMESTAMP_REQUIRED');
  if(v.checkpointState==='NONE'&&v.lastCheckpointAt!==null) throw new Error('CHECKPOINT_TIMESTAMP_WITHOUT_STATE');
  if(v.quarantinedRecordCount>0&&v.checkpointState==='NONE') throw new Error('QUARANTINE_REQUIRES_CHECKPOINT_CONTEXT');
  if(v.safeReadOnly!==true||v.executionAuthority!==false||v.mutationAuthority!==false||v.productionAuthority!==false) throw new Error('MOBILE_STATUS_AUTHORITY_VIOLATION');
  return Object.freeze({...v});
}

export function presentMobileDataStatus(input: unknown, now: string, staleCheckpointAfterMs=86400000, backpressureRatio=0.8): Readonly<XviMobileDataStatusPresentation> {
  const v=validateMobileDataStatusInput(input);
  if(typeof now!=='string'||!now.includes('T')||Number.isNaN(Date.parse(now))) throw new Error('NOW_INVALID');
  if(!Number.isSafeInteger(staleCheckpointAfterMs)||staleCheckpointAfterMs<60000||staleCheckpointAfterMs>2592000000) throw new Error('STALE_POLICY_INVALID');
  if(!Number.isFinite(backpressureRatio)||backpressureRatio<0.5||backpressureRatio>=1) throw new Error('BACKPRESSURE_POLICY_INVALID');
  const nowMs=Date.parse(now);
  for(const time of [v.lastCheckpointAt,v.lastReconciliationAt,v.retryAfterAt]) if(time!==null&&Date.parse(time)>nowMs) throw new Error('MOBILE_STATUS_TIMESTAMP_FROM_FUTURE');

  const ratio=v.pendingEventCount/v.queueCapacity;
  const stale=v.pendingEventCount>0&&v.lastCheckpointAt!==null&&(nowMs-Date.parse(v.lastCheckpointAt))>staleCheckpointAfterMs;
  const retryBlocked=v.retryAfterAt!==null&&Date.parse(v.retryAfterAt)>nowMs;
  let statusState:XviMobileStatusState;
  let attentionRoute:XviMobileAttentionRoute='UNIVERSE';
  let attentionLabel:string|null=null;
  let primaryAction:XviMobileDataStatusPresentation['primaryAction']='Open sync status';

  if(v.checkpointState==='REVOKED'||v.quarantinedRecordCount>0){
    statusState='QUARANTINED'; attentionRoute='NEEDS_YOU';
    attentionLabel=v.checkpointState==='REVOKED'?'Offline checkpoint was revoked; governed review required':`${v.quarantinedRecordCount} quarantined record${v.quarantinedRecordCount===1?'':'s'} require review`;
    primaryAction='Review quarantined data';
  }else if(ratio>=backpressureRatio){
    statusState='BACKPRESSURE'; attentionRoute='NEEDS_YOU'; attentionLabel='Local queue is nearing its governed capacity'; primaryAction='Open storage status';
  }else if((v.mode==='ONLINE_GOVERNED'&&!v.networkReachable)||stale||retryBlocked){
    statusState='RECOVERY_REQUIRED'; attentionRoute='NEEDS_YOU';
    attentionLabel=retryBlocked?'Recovery is waiting for the governed retry window':stale?'Local checkpoint is stale and needs a safe recheck':'Online-governed connectivity is unavailable';
    primaryAction='Open recovery';
  }else if(v.checkpointState==='RECONCILING') statusState='RECONCILING';
  else if(v.mode==='LOCAL_ONLY') statusState='LOCAL_ONLY';
  else if(!v.networkReachable||v.mode==='OFFLINE_GOVERNED') statusState='OFFLINE_BUFFERING';
  else statusState='LIVE';

  const modeLabel=humanize(v.mode);
  const connectionLabel=v.networkReachable?'Network reachable':'Offline';
  const queueLabel=`${v.pendingEventCount.toLocaleString()} pending of ${v.queueCapacity.toLocaleString()} local capacity`;
  const checkpointLabel=v.checkpointState==='NONE'?'No checkpoint yet':`${humanize(v.checkpointState)} checkpoint`;
  const content:Record<XviMobileStatusState,{title:string;body:string}>={
    LIVE:{title:'XVI data fabric connected',body:'Governed mobile data can be staged for checkpoint and reconciliation. This screen does not perform synchronization.'},
    LOCAL_ONLY:{title:'Local-only mode active',body:'Mobile data stays on this device until a separately governed transition is approved.'},
    OFFLINE_BUFFERING:{title:'Working safely offline',body:'Events remain in the bounded local queue until checkpoint reconciliation is available.'},
    RECONCILING:{title:'Reconciling offline data',body:'XVI is presenting checkpoint reconciliation state. No successful sync is claimed until a verified receipt exists.'},
    BACKPRESSURE:{title:'Local data queue needs attention',body:'The governed queue is nearing capacity. Review storage status before collecting more buffered data.'},
    RECOVERY_REQUIRED:{title:'Safe recovery required',body:'Normal progression is paused until connectivity, checkpoint freshness, or retry state is trustworthy again.'},
    QUARANTINED:{title:'Data held for review',body:'Quarantined or revoked checkpoint data cannot progress toward CORE until governed review clears it.'},
  };
  const c=content[statusState];
  return Object.freeze({
    schemaVersion:'xvi-mobile-data-status-card-v1',
    statusState,attentionRoute,title:c.title,body:c.body,modeLabel,connectionLabel,queueLabel,checkpointLabel,attentionLabel,primaryAction,
    secondaryAction:'Ask XVI',safeReadOnly:true,canSync:false,canMutate:false,canClaimExecution:false,
    accessibilityLabel:`${c.title}. ${modeLabel}. ${connectionLabel}. ${queueLabel}. ${checkpointLabel}. ${attentionLabel??'No recovery review required.'} Read-only status.`,
  });
}
