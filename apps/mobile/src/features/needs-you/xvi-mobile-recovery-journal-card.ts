export type XviOperatingMode = 'ONLINE_GOVERNED' | 'OFFLINE_GOVERNED' | 'LOCAL_ONLY';
export type XviRecoveryJournalState = 'PREPARED' | 'APPLIED' | 'RECOVERED' | 'ABORTED';
export type XviPropagationTarget = 'REPLAY_LEDGER' | 'CHECKPOINT' | 'COMPACTION' | 'EVIDENCE_SUMMARY';
export type XviRecoveryAttentionRoute = 'UNIVERSE' | 'NEEDS_YOU';

export interface XviRecoveryJournalReceiptInput {
  readonly schemaVersion: 'xvi-recovery-journal-v1';
  readonly journalId: string;
  readonly transactionId: string;
  readonly journalState: XviRecoveryJournalState;
  readonly idempotentReplay: boolean;
  readonly queueDelta: number;
  readonly replayKeyConsumed: boolean;
  readonly fingerprintReserved: boolean;
  readonly propagationTargets: readonly XviPropagationTarget[];
  readonly requiresFurtherRecovery: boolean;
  readonly observability: Readonly<{
    readonly replayCount: number;
    readonly recallCount: number;
    readonly recoveryCount: number;
    readonly abortedCount: number;
  }>;
  readonly safeReadOnly: true;
  readonly executionAuthority: false;
  readonly mutationAuthority: false;
  readonly productionAuthority: false;
}

export interface XviMobileRecoveryContext {
  readonly tenantId: string;
  readonly deviceId: string;
  readonly mode: XviOperatingMode;
  readonly networkReachable: boolean;
}

export interface XviMobileRecoveryPresentation {
  readonly schemaVersion: 'xvi-mobile-recovery-card-v1';
  readonly journalState: XviRecoveryJournalState;
  readonly attentionRoute: XviRecoveryAttentionRoute;
  readonly title: string;
  readonly body: string;
  readonly modeLabel: string;
  readonly connectionLabel: string;
  readonly propagationLabel: string;
  readonly replayLabel: string | null;
  readonly primaryAction: 'Review recovery' | 'Return to Universe' | null;
  readonly secondaryAction: 'Ask XVI';
  readonly safeReadOnly: true;
  readonly canRetry: false;
  readonly canSync: false;
  readonly canMutate: false;
  readonly canClaimExecution: false;
  readonly accessibilityLabel: string;
}

const PLAIN=Object.getPrototypeOf({});
const STATES=new Set<XviRecoveryJournalState>(['PREPARED','APPLIED','RECOVERED','ABORTED']);
const TARGETS=new Set<XviPropagationTarget>(['REPLAY_LEDGER','CHECKPOINT','COMPACTION','EVIDENCE_SUMMARY']);
const MODES=new Set<XviOperatingMode>(['ONLINE_GOVERNED','OFFLINE_GOVERNED','LOCAL_ONLY']);
const RECEIPT_KEYS=['schemaVersion','journalId','transactionId','journalState','idempotentReplay','queueDelta','replayKeyConsumed','fingerprintReserved','propagationTargets','requiresFurtherRecovery','observability','safeReadOnly','executionAuthority','mutationAuthority','productionAuthority'] as const;
const OBS_KEYS=['replayCount','recallCount','recoveryCount','abortedCount'] as const;
const CONTEXT_KEYS=['tenantId','deviceId','mode','networkReachable'] as const;

function plain(v:unknown,label:string):asserts v is Record<string,unknown>{
  if(v===null||typeof v!=='object'||Object.getPrototypeOf(v)!==PLAIN)throw new Error(`${label}_PLAIN_REQUIRED`);
  if(Object.getOwnPropertySymbols(v).length)throw new Error(`${label}_SYMBOLS_FORBIDDEN`);
  for(const k of Object.keys(v)){const d=Object.getOwnPropertyDescriptor(v,k);if(!d||d.get||d.set)throw new Error(`${label}_ACCESSOR_FORBIDDEN`);}
}
function exact(v:Record<string,unknown>,keys:readonly string[],label:string):void{
  const a=Object.keys(v).sort(),b=[...keys].sort();
  if(a.length!==b.length||a.some((k,i)=>k!==b[i]))throw new Error(`${label}_SCHEMA_MISMATCH`);
}
function count(v:number,label:string):void{
  if(!Number.isSafeInteger(v)||v<0||v>10_000_000)throw new Error(`${label}_INVALID`);
}
function humanize(v:string):string{
  return v.toLowerCase().split('_').map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
}

export function validateRecoveryJournalReceipt(input:unknown):Readonly<XviRecoveryJournalReceiptInput>{
  plain(input,'RECOVERY_RECEIPT'); exact(input,RECEIPT_KEYS,'RECOVERY_RECEIPT');
  const r=input as unknown as XviRecoveryJournalReceiptInput;
  if(r.schemaVersion!=='xvi-recovery-journal-v1'||!/^journal:/.test(r.journalId)||!/^tx:/.test(r.transactionId)||!STATES.has(r.journalState))throw new Error('RECOVERY_RECEIPT_STATE_INVALID');
  if(typeof r.idempotentReplay!=='boolean'||!Number.isSafeInteger(r.queueDelta)||Math.abs(r.queueDelta)>1||typeof r.replayKeyConsumed!=='boolean'||typeof r.fingerprintReserved!=='boolean'||typeof r.requiresFurtherRecovery!=='boolean')throw new Error('RECOVERY_RECEIPT_FLAGS_INVALID');
  if(!Array.isArray(r.propagationTargets)||r.propagationTargets.length>4)new Error('RECOVERY_PROPAGATION_COUNT_INVALID');
  const seen=new Set<XviPropagationTarget>();
  for(const t of r.propagationTargets){if(!TARGETS.has(t)||seen.has(t))throw new Error('RECOVERY_PROPAGATION_TARGET_INVALID');seen.add(t);}
  plain(r.observability,'RECOVERY_OBSERVABILITY'); exact(r.observability as unknown as Record<string,unknown>,OBS_KEYS,'RECOVERY_OBSERVABILITY');
  count(r.observability.replayCount,'REPLAY_COUNT'); count(r.observability.recallCount,'RECALL_COUNT'); count(r.observability.recoveryCount,'RECOVERY_COUNT'); count(r.observability.abortedCount,'ABORTED_COUNT');
  const expectedFurther=r.journalState==='PREPARED'||(r.journalState==='APPLIED'&&r.propagationTargets.length>0);
  if(r.requiresFurtherRecovery!==expectedFurther)throw new Error('RECOVERY_FURTHER_STATE_MISMATCH');
  if(r.idempotentReplay!== (r.observability.replayCount>0))throw new Error('RECOVERY_REPLAY_OBSERVABILITY_MISMATCH');
  if((r.journalState==='RECOVERED')!== (r.observability.recoveryCount>0))throw new Error('RECOVERY_COMPLETION_OBSERVABILITY_MISMATCH');
  if((r.journalState==='ABORTED')!== (r.observability.abortedCount>0))throw new Error('RECOVERY_ABORT_OBSERVABILITY_MISMATCH');
  if(r.safeReadOnly!==true||r.executionAuthority!==false||r.mutationAuthority!==false||r.productionAuthority!==false)throw new Error('RECOVERY_RECEIPT_AUTHORITY_VIOLATION');
  return Object.freeze({...r,propagationTargets:Object.freeze([...r.propagationTargets]),observability:Object.freeze({...r.observability})});
}

export function validateMobileRecoveryContext(input:unknown):Readonly<XviMobileRecoveryContext>{
  plain(input,'RECOVERY_CONTEXT'); exact(input,CONTEXT_KEYS,'RECOVERY_CONTEXT');
  const c=input as unknown as XviMobileRecoveryContext;
  if(!/^tenant:/.test(c.tenantId)||!/^device:/.test(c.deviceId)||!MODES.has(c.mode)||typeof c.networkReachable!=='boolean')throw new Error('RECOVERY_CONTEXT_INVALID');
  return Object.freeze({...c});
}

export function presentMobileRecoveryJournal(receiptInput:unknown,contextInput:unknown):Readonly<XviMobileRecoveryPresentation>{
  const r=validateRecoveryJournalReceipt(receiptInput);
  const c=validateMobileRecoveryContext(contextInput);
  const modeLabel=humanize(c.mode);
  const connectionLabel=c.networkReachable?'Network reachable':'Offline';
  const propagationLabel=r.propagationTargets.length===0?'No propagation targets pending':`${r.propagationTargets.length} governed propagation target${r.propagationTargets.length===1?'':'s'} pending`;
  const replayLabel=r.idempotentReplay?'Idempotent recovery replay detected; duplicate effects are not claimed':null;
  const needsAttention=r.requiresFurtherRecovery||r.journalState==='ABORTED';
  const attentionRoute:XviRecoveryAttentionRoute=needsAttention?'NEEDS_YOU':'UNIVERSE';
  let title:string,body:string,primaryAction:XviMobileRecoveryPresentation['primaryAction'];
  switch(r.journalState){
    case'PREPARED':
      title='Recovery prepared safely';
      body='XVI has a read-only recovery record prepared. No queue or production action is claimed from this screen.';
      primaryAction='Review recovery';
      break;
    case'APPLIED':
      if(r.requiresFurtherRecovery){
        title='Recovery propagation pending';
        body='A recovery receipt exists, but downstream replay, checkpoint, compaction, or evidence state still requires governed reconciliation.';
        primaryAction='Review recovery';
      }else{
        title='Recovery applied';
        body='The recovery journal reports the applied step with no remaining propagation targets. This screen does not execute or synchronize anything.';
        primaryAction='Return to Universe';
      }
      break;
    case'RECOVERED':
      title='Recovery journal reconciled';
      body='The recovery journal reports a recovered state with no pending propagation. This is a read-only receipt, not an execution claim.';
      primaryAction='Return to Universe';
      break;
    case'ABORTED':
      title='Recovery stopped safely';
      body='Recovery was aborted. XVI keeps this path read-only until a new governed recovery decision is issued.';
      primaryAction='Review recovery';
      break;
  }
  const accessibilityLabel=`${title}. ${modeLabel}. ${connectionLabel}. ${propagationLabel}. ${replayLabel??'No duplicate recovery replay reported.'} Read-only recovery status.`;
  return Object.freeze({
    schemaVersion:'xvi-mobile-recovery-card-v1',
    journalState:r.journalState,
    attentionRoute,
    title,body,modeLabel,connectionLabel,propagationLabel,replayLabel,primaryAction,
    secondaryAction:'Ask XVI',
    safeReadOnly:true,
    canRetry:false,
    canSync:false,
    canMutate:false,
    canClaimExecution:false,
    accessibilityLabel,
  });
}
