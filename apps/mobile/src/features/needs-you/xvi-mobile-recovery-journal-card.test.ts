import test from 'node:test';
import assert from 'node:assert/strict';
import {presentMobileRecoveryJournal,validateRecoveryJournalReceipt,validateMobileRecoveryContext} from './xvi-mobile-recovery-journal-card';

const context={tenantId:'tenant:alpha',deviceId:'device:iphone:1',mode:'OFFLINE_GOVERNED',networkReachable:false} as const;
const base={
  schemaVersion:'xvi-recovery-journal-v1',
  journalId:'journal:1',
  transactionId:'tx:1',
  journalState:'APPLIED',
  idempotentReplay:false,
  queueDelta:0,
  replayKeyConsumed:true,
  fingerprintReserved:true,
  propagationTargets:['CHECKPOINT','COMPACTION'],
  requiresFurtherRecovery:true,
  observability:{replayCount:0,recallCount:1,recoveryCount:0,abortedCount:0},
  safeReadOnly:true,
  executionAuthority:false,
  mutationAuthority:false,
  productionAuthority:false,
} as const;

test('pending applied recovery routes to Needs You',()=>{const x=presentMobileRecoveryJournal(base,context);assert.equal(x.attentionRoute,'NEEDS_YOU');assert.equal(x.primaryAction,'Review recovery');assert.equal(x.canSync,false);});
test('prepared recovery remains read only and Needs You routed',()=>{const x=presentMobileRecoveryJournal({...base,journalState:'PREPARED' as const},context);assert.equal(x.attentionRoute,'NEEDS_YOU');assert.equal(x.canClaimExecution,false);});
test('recovered receipt returns to Universe without execution authority',()=>{const x=presentMobileRecoveryJournal({...base,journalState:'RECOVERED' as const,propagationTargets:[],requiresFurtherRecovery:false,observability:{replayCount:0,recallCount:1,recoveryCount:1,abortedCount:0}},context);assert.equal(x.attentionRoute,'UNIVERSE');assert.equal(x.primaryAction,'Return to Universe');assert.equal(x.canClaimExecution,false);});
test('aborted recovery routes to Needs You',()=>{const x=presentMobileRecoveryJournal({...base,journalState:'ABORTED' as const,propagationTargets:[],requiresFurtherRecovery:false,observability:{replayCount:0,recallCount:1,recoveryCount:0,abortedCount:1}},context);assert.equal(x.attentionRoute,'NEEDS_YOU');assert.equal(x.title,'Recovery stopped safely');});
test('idempotent replay is surfaced accessibly',()=>{const x=presentMobileRecoveryJournal({...base,idempotentReplay:true,observability:{replayCount:1,recallCount:1,recoveryCount:0,abortedCount:0}},context);assert.match(x.accessibilityLabel,/duplicate recovery replay/i);});
test('further recovery mismatch fails closed',()=>{assert.throws(()=>validateRecoveryJournalReceipt({...base,requiresFurtherRecovery:false}),/RECOVERY_FURTHER_STATE_MISMATCH/);});
test('replay observability mismatch fails closed',()=>{assert.throws(()=>validateRecoveryJournalReceipt({...base,idempotentReplay:true}),/RECOVERY_REPLAY_OBSERVABILITY_MISMATCH/);});
test('unknown or excess propagation target fails closed',()=>{assert.throws(()=>validateRecoveryJournalReceipt({...base,propagationTargets:['REPLAY_LEDGER','CHECKPOINT','COMPACTION','EVIDENCE_SUMMARY','UNKNOWN'] as any}),/RECOVERY_PROPAGATION_TARGET_INVALID/);});
test('duplicate propagation target fails closed',()=>{assert.throws(()=>validateRecoveryJournalReceipt({...base,propagationTargets:['CHECKPOINT','CHECKPOINT'] as any}),/RECOVERY_PROPAGATION_TARGET_INVALID/);});
test('authority escalation is refused',()=>{assert.throws(()=>validateRecoveryJournalReceipt({...base,mutationAuthority:true} as any),/RECOVERY_RECEIPT_AUTHORITY_VIOLATION/);});
test('invalid context identity is refused',()=>{assert.throws(()=>validateMobileRecoveryContext({...context,tenantId:'alpha'}),/RECOVERY_CONTEXT_INVALID/);});
test('accessor-bearing receipt fails closed without getter execution',()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,'journalState',{enumerable:true,get(){hits++;return 'APPLIED';}});assert.throws(()=>validateRecoveryJournalReceipt(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
