import test from "node:test";
import assert from "node:assert/strict";
import { issueMobileIngestionReceipt, validateMobileIngestionBatch } from "./xvi-mobile-data-fabric-ingestion";
const H="a".repeat(64);
const event=(id:string,privacyClass="BUSINESS" as const)=>({eventId:`event:${id}`,dataClass:"EVENT" as const,occurredAt:"2026-10-01T07:45:00Z",payloadHash:H,payloadBytes:1024,privacyClass,consentBasis:"BUSINESS_AUTHORIZED" as const,containsSecrets:false as const});
const base={schemaVersion:"xvi-mobile-ingestion-v1",tenantId:"tenant:alpha",deviceNodeId:"device:iphone-1",jurisdictionId:"jurisdiction:iso3166-1:us",mode:"LOCAL_ONLY",sequenceStart:0,sequenceEnd:1,offlineCheckpointId:null,previousBatchHash:null,batchHash:H,replayKey:"replay:mobile.batch.0001",createdAt:"2026-10-01T07:46:00Z",events:[event("1"),event("2")],executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("bounded local batch is eligible for CORE feed",()=>{const x=issueMobileIngestionReceipt(base);assert.equal(x.eventCount,2);assert.equal(x.feedCoreEligible,true);assert.equal(x.safeReadOnly,true);});
test("restricted data quarantines rather than feeds CORE",()=>{const x=issueMobileIngestionReceipt({...base,sequenceEnd:0,events:[event("1","RESTRICTED")]});assert.equal(x.requiresQuarantine,true);assert.equal(x.feedCoreEligible,false);});
test("offline governed requires checkpoint",()=>{assert.throws(()=>validateMobileIngestionBatch({...base,mode:"OFFLINE_GOVERNED"} as any),/OFFLINE_GOVERNED_REQUIRES_CHECKPOINT/);});
test("sequence must match event count",()=>{assert.throws(()=>validateMobileIngestionBatch({...base,sequenceEnd:4} as any),/SEQUENCE_EVENT_COUNT_MISMATCH/);});
test("secret-bearing event is forbidden",()=>{const bad={...event("1"),containsSecrets:true};assert.throws(()=>validateMobileIngestionBatch({...base,sequenceEnd:0,events:[bad]} as any),/SECRET_BEARING_EVENT_FORBIDDEN/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateMobileIngestionBatch({...base,productionAuthority:true} as any),/BATCH_AUTHORITY_VIOLATION/);});
test("duplicate event IDs are refused",()=>{assert.throws(()=>validateMobileIngestionBatch({...base,events:[event("1"),event("1")]} as any),/EVENT_ID_INVALID_OR_DUPLICATE/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"mode",{enumerable:true,get(){hits++;return "LOCAL_ONLY";}});assert.throws(()=>validateMobileIngestionBatch(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
