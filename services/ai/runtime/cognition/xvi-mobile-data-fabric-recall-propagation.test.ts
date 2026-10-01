import test from "node:test";
import assert from "node:assert/strict";
import {evaluateRecallPropagation,validateRecallPropagationInput} from "./xvi-mobile-data-fabric-recall-propagation";

const acks=[
  {target:"REPLAY_LEDGER",state:"ACKNOWLEDGED",version:4,acknowledgedAt:"2026-10-01T11:10:00Z",failureCode:null},
  {target:"CHECKPOINT",state:"ACKNOWLEDGED",version:4,acknowledgedAt:"2026-10-01T11:11:00Z",failureCode:null},
  {target:"COMPACTION",state:"ACKNOWLEDGED",version:4,acknowledgedAt:"2026-10-01T11:12:00Z",failureCode:null},
  {target:"EVIDENCE_SUMMARY",state:"ACKNOWLEDGED",version:4,acknowledgedAt:"2026-10-01T11:13:00Z",failureCode:null},
] as const;
const base={recallId:"recall:1",tombstoneId:"tombstone:1",tenantId:"tenant:alpha",sourceDeviceId:"device:iphone:1",currentVersion:3,incomingVersion:4,sourceDeviceVersion:3,peerDeviceVersions:{"device:asus:1":3},targetAcks:acks,retryCount:0,maxRetries:3,observedAt:"2026-10-01T11:00:00Z",safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("fully acknowledged recall can claim completion",()=>{const x=evaluateRecallPropagation(base,"2026-10-01T11:20:00Z");assert.equal(x.completed,true);assert.equal(x.canClaimCompletion,true);assert.equal(x.conflictState,"CLEAR");});
test("stale writer is rejected",()=>{const x=evaluateRecallPropagation({...base,currentVersion:5,incomingVersion:4},"2026-10-01T11:20:00Z");assert.equal(x.staleWriterRejected,true);assert.equal(x.conflictState,"STALE_WRITER");assert.equal(x.canClaimCompletion,false);});
test("version gap requires human review",()=>{const x=evaluateRecallPropagation({...base,currentVersion:3,incomingVersion:6},"2026-10-01T11:20:00Z");assert.equal(x.conflictState,"VERSION_GAP");assert.equal(x.requiresHumanReview,true);});
test("failed target becomes partial failure and retry",()=>{const failed=acks.map(x=>x.target==="COMPACTION"?{...x,state:"FAILED" as const,acknowledgedAt:null,failureCode:"INVALIDATION_FAILED"}:x);const y=evaluateRecallPropagation({...base,targetAcks:failed},"2026-10-01T11:20:00Z");assert.equal(y.conflictState,"PARTIAL_FAILURE");assert.equal(y.requiresRetry,true);assert.equal(y.completed,false);});
test("exhausted partial failure requires review",()=>{const failed=acks.map(x=>x.target==="COMPACTION"?{...x,state:"FAILED" as const,acknowledgedAt:null,failureCode:"INVALIDATION_FAILED"}:x);const y=evaluateRecallPropagation({...base,targetAcks:failed,retryCount:3,maxRetries:3},"2026-10-01T11:20:00Z");assert.equal(y.requiresRetry,false);assert.equal(y.requiresHumanReview,true);});
test("pending targets cannot claim completion",()=>{const pending=acks.map(x=>x.target==="EVIDENCE_SUMMARY"?{...x,state:"PENDING" as const,acknowledgedAt:null,failureCode:null}:x);const y=evaluateRecallPropagation({...base,targetAcks:pending},"2026-10-01T11:20:00Z");assert.equal(y.completed,false);assert.equal(y.canClaimCompletion,false);});
test("duplicate propagation target is refused",()=>{assert.throws(()=>validateRecallPropagationInput({...base,targetAcks:[acks[0],acks[0]]}),/TARGET_ACK_INVALID/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateRecallPropagationInput({...base,mutationAuthority:true} as any),/PROPAGATION_AUTHORITY_VIOLATION/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"incomingVersion",{enumerable:true,get(){hits++;return 4;}});assert.throws(()=>validateRecallPropagationInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
