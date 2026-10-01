import test from "node:test";
import assert from "node:assert/strict";
import {evaluateReplayBudget,validateReplayBudgetInput} from "./xvi-mobile-data-fabric-replay-budget";

const F1="a".repeat(64), F2="b".repeat(64);
const NOW="2026-10-01T10:00:00Z";
const entry={replayKey:"old-key",eventFingerprint:F1,checkpointId:"checkpoint:device:1",tenantId:"tenant:alpha",deviceId:"device:iphone:1",firstSeenAt:"2026-10-01T09:00:00Z",recallState:"ACTIVE"} as const;
const base={tenantId:"tenant:alpha",deviceId:"device:iphone:1",mode:"LOCAL_ONLY",checkpointId:"checkpoint:device:2",replayKey:"new-key",eventFingerprint:F2,priorLedgerEntries:[entry],currentQueueDepth:100,queueCapacity:1000,retryCount:0,maxRetries:3,retryAfterAt:null,quarantineReasons:[],observedAt:"2026-10-01T09:30:00Z",safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("new event can be accepted within queue budget",()=>{const x=evaluateReplayBudget(base,NOW);assert.equal(x.decision,"ACCEPT");assert.equal(x.effectiveQueueDepth,101);assert.equal(x.canMutateQueue,false);});
test("duplicate replay key is refused as duplicate",()=>{const x=evaluateReplayBudget({...base,replayKey:"old-key"},NOW);assert.equal(x.decision,"DUPLICATE");assert.equal(x.duplicateByReplayKey,true);});
test("cross-checkpoint fingerprint duplicate is detected",()=>{const x=evaluateReplayBudget({...base,eventFingerprint:F1},NOW);assert.equal(x.decision,"DUPLICATE");assert.equal(x.duplicateByFingerprint,true);});
test("quarantine dominates duplicate and pressure",()=>{const x=evaluateReplayBudget({...base,replayKey:"old-key",currentQueueDepth:1000,quarantineReasons:["POISONING_SUSPECTED"]},NOW);assert.equal(x.decision,"QUARANTINE");assert.equal(x.requiresHumanReview,true);});
test("saturated queue defers when retries remain",()=>{const x=evaluateReplayBudget({...base,currentQueueDepth:1000,retryCount:1,maxRetries:3},NOW);assert.equal(x.decision,"DEFER");assert.equal(x.retryDisposition,"RETRY_LATER");});
test("saturated queue drops when retry budget exhausted",()=>{const x=evaluateReplayBudget({...base,currentQueueDepth:1000,retryCount:3,maxRetries:3},NOW);assert.equal(x.decision,"DROP");assert.equal(x.retryDisposition,"NO_RETRY");});
test("recalled ledger entry no longer blocks new event",()=>{const x=evaluateReplayBudget({...base,eventFingerprint:F1,priorLedgerEntries:[{...entry,recallState:"RECALLED" as const}]},NOW);assert.equal(x.decision,"ACCEPT");});
test("queue depth cannot exceed capacity",()=>{assert.throws(()=>validateReplayBudgetInput({...base,currentQueueDepth:1001}),/QUEUE_DEPTH_EXCEEDS_CAPACITY/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateReplayBudgetInput({...base,mutationAuthority:true} as any),/REPLAY_AUTHORITY_VIOLATION/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"mode",{enumerable:true,get(){hits++;return "LOCAL_ONLY";}});assert.throws(()=>validateReplayBudgetInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
