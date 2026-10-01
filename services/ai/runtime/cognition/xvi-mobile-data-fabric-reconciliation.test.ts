import test from "node:test";
import assert from "node:assert/strict";
import {issueOfflineReconciliationReceipt,validateOfflineCheckpoint,issueCompactionReceipt,validateCompactionReceiptInput} from "./xvi-mobile-data-fabric-reconciliation";

const H="a".repeat(64);
const checkpoint={checkpointId:"checkpoint:device:1",tenantId:"tenant:alpha",deviceId:"device:iphone:1",mode:"LOCAL_ONLY",firstSequence:0,lastSequence:2,eventCount:3,previousCheckpointHash:null,checkpointHash:H,replayKeys:["r1","r2","r3"],observedAt:"2026-10-01T07:30:00Z",state:"SEALED",secretsPresent:false,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
const compaction={compactionId:"compact:alpha:1",tenantId:"tenant:alpha",sourceCheckpointIds:["checkpoint:device:1"],shardId:"shard:us-tx-001",partitionId:"partition:2026-10-01T07",level:"DEVICE_WINDOW",sourceEventCount:1000,outputRecordCount:100,outputContentHash:H,createdAt:"2026-10-01T07:40:00Z",promotionEligible:false,quarantineReasons:[],safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("sealed checkpoint emits read-only reconciliation receipt",()=>{const x=issueOfflineReconciliationReceipt(checkpoint);assert.equal(x.contiguous,true);assert.equal(x.acceptedSequenceCount,3);assert.equal(x.executionAuthority,false);});
test("sequence mismatch is refused",()=>{assert.throws(()=>validateOfflineCheckpoint({...checkpoint,eventCount:2}),/CHECKPOINT_SEQUENCE_COUNT_MISMATCH/);});
test("replay key count mismatch is refused",()=>{assert.throws(()=>validateOfflineCheckpoint({...checkpoint,replayKeys:["r1"]}),/REPLAY_KEY_COUNT_MISMATCH/);});
test("offline governed open checkpoint is refused",()=>{assert.throws(()=>validateOfflineCheckpoint({...checkpoint,mode:"OFFLINE_GOVERNED" as const,state:"OPEN" as const}),/OFFLINE_GOVERNED_OPEN_CHECKPOINT_FORBIDDEN/);});
test("compaction cannot expand record count",()=>{assert.throws(()=>validateCompactionReceiptInput({...compaction,sourceEventCount:10,outputRecordCount:11}),/COMPACTION_EXPANSION_FORBIDDEN/);});
test("raw batch cannot promote directly to CORE",()=>{assert.throws(()=>validateCompactionReceiptInput({...compaction,level:"RAW_BATCH" as const,promotionEligible:true}),/RAW_BATCH_CANNOT_PROMOTE_TO_CORE/);});
test("quarantined compaction cannot promote",()=>{assert.throws(()=>validateCompactionReceiptInput({...compaction,promotionEligible:true,quarantineReasons:["PRIVACY_REVIEW"]}),/QUARANTINED_COMPACTION_CANNOT_PROMOTE/);});
test("compaction receipt reports bounded compression",()=>{const x=issueCompactionReceipt(compaction);assert.equal(x.compressionRatio,10);assert.equal(x.safeReadOnly,true);assert.equal(x.productionAuthority,false);});
test("authority escalation is refused",()=>{assert.throws(()=>validateOfflineCheckpoint({...checkpoint,productionAuthority:true} as any),/CHECKPOINT_AUTHORITY_OR_SECRET_VIOLATION/);});
test("accessor input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...checkpoint};Object.defineProperty(x,"mode",{enumerable:true,get(){hits++;return "LOCAL_ONLY";}});assert.throws(()=>validateOfflineCheckpoint(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
