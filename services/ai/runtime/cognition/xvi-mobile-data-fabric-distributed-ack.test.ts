import test from "node:test";
import assert from "node:assert/strict";
import {compareVectorClocks,evaluateDistributedRecall,validateDistributedRecallInput} from "./xvi-mobile-data-fabric-distributed-ack";
const clock=(a:number,b:number)=>({counters:{"device:iphone:1":a,"device:asus:1":b}});
const acks=[
  {target:"REPLAY_LEDGER",status:"ACKNOWLEDGED",deviceId:"device:iphone:1",vectorClock:clock(4,3),acknowledgedAt:"2026-10-01T12:05:00Z",failureCode:null},
  {target:"CHECKPOINT",status:"ACKNOWLEDGED",deviceId:"device:asus:1",vectorClock:clock(4,4),acknowledgedAt:"2026-10-01T12:06:00Z",failureCode:null},
  {target:"COMPACTION",status:"ACKNOWLEDGED",deviceId:"device:asus:1",vectorClock:clock(4,4),acknowledgedAt:"2026-10-01T12:07:00Z",failureCode:null},
  {target:"EVIDENCE_SUMMARY",status:"ACKNOWLEDGED",deviceId:"device:asus:1",vectorClock:clock(4,4),acknowledgedAt:"2026-10-01T12:08:00Z",failureCode:null},
] as const;
const base={recallId:"recall:1",tombstoneId:"tombstone:1",tenantId:"tenant:alpha",sourceDeviceId:"device:iphone:1",recallClock:clock(4,3),acknowledgements:acks,timeoutAt:"2026-10-01T12:30:00Z",observedAt:"2026-10-01T12:00:00Z",safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
test("vector clocks compare correctly",()=>{assert.equal(compareVectorClocks(clock(1,1),clock(1,1)),"EQUAL");assert.equal(compareVectorClocks(clock(1,1),clock(2,1)),"BEFORE");assert.equal(compareVectorClocks(clock(2,1),clock(1,2)),"CONCURRENT");});
test("fully acknowledged causal recall can complete",()=>{const x=evaluateDistributedRecall(base,"2026-10-01T12:10:00Z");assert.equal(x.completed,true);assert.equal(x.canClaimCompletion,true);});
test("stale acknowledgement preserves conflict",()=>{const bad=acks.map(x=>x.target==="CHECKPOINT"?{...x,vectorClock:clock(3,3)}:x);const y=evaluateDistributedRecall({...base,acknowledgements:bad},"2026-10-01T12:10:00Z");assert.equal(y.conflictPreserved,true);assert.equal(y.canClaimCompletion,false);});
test("concurrent acknowledgement preserves conflict",()=>{const bad=acks.map(x=>x.target==="COMPACTION"?{...x,vectorClock:clock(3,4)}:x);const y=evaluateDistributedRecall({...base,acknowledgements:bad},"2026-10-01T12:10:00Z");assert.equal(y.conflictPreserved,true);});
test("pending target times out into review",()=>{const pending=acks.map(x=>x.target==="EVIDENCE_SUMMARY"?{...x,status:"PENDING" as const,acknowledgedAt:null}:x);const y=evaluateDistributedRecall({...base,acknowledgements:pending},"2026-10-01T12:31:00Z");assert.equal(y.timedOut,true);assert.equal(y.requiresHumanReview,true);});
test("failed target requires review",()=>{const failed=acks.map(x=>x.target==="COMPACTION"?{...x,status:"FAILED" as const,acknowledgedAt:null,failureCode:"INVALIDATION_FAILED"}:x);const y=evaluateDistributedRecall({...base,acknowledgements:failed},"2026-10-01T12:10:00Z");assert.equal(y.requiresHumanReview,true);assert.ok(y.failedTargets.includes("COMPACTION"));});
test("duplicate acknowledgement target is refused",()=>{assert.throws(()=>validateDistributedRecallInput({...base,acknowledgements:[acks[0],acks[0]]}),/ACK_INVALID/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateDistributedRecallInput({...base,productionAuthority:true} as any),/DISTRIBUTED_RECALL_AUTHORITY_VIOLATION/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"timeoutAt",{enumerable:true,get(){hits++;return "2026-10-01T12:30:00Z";}});assert.throws(()=>validateDistributedRecallInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
