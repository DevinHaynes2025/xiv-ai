import test from "node:test";
import assert from "node:assert/strict";
import { assessIdentityConfidence, validateIdentityConfidenceInput } from "./xvi-organization-identity-confidence";

const NOW="2026-10-01T07:00:00Z";
const e=(id:string,supports=true,trustScore=95,confidence=0.95,observedAt="2026-10-01T06:00:00Z",jurisdictionId="jurisdiction:iso3166-1:ng",quarantineReasons:string[]=[])=>({sourceId:id,trustScore,confidence,supportsIdentity:supports,observedAt,jurisdictionId,quarantineReasons});
const base={organizationId:"org:africa:alpha",canonicalJurisdictionId:"jurisdiction:iso3166-1:ng",mode:"LOCAL_ONLY",evidence:[e("s1"),e("s2"),e("s3")],lineageConsistent:true,observedAt:NOW,safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("clean corroborated evidence can be clear without claiming truth",()=>{const x=assessIdentityConfidence(base,NOW);assert.equal(x.escalationState,"CLEAR");assert.equal(x.confidenceBand,"HIGH");assert.equal(x.scoreIsTruth,false);assert.equal(x.executionAuthority,false);});
test("contradiction forces review",()=>{const x=assessIdentityConfidence({...base,evidence:[e("s1"),e("s2"),e("s3",false)]},NOW);assert.equal(x.escalationState,"REVIEW_REQUIRED");assert.ok(x.conflictClasses.includes("SOURCE_DISAGREEMENT"));});
test("quarantined evidence dominates escalation",()=>{const x=assessIdentityConfidence({...base,evidence:[e("s1",true,95,0.95,undefined as any,undefined as any,["POISONING_SUSPECTED"]),e("s2")]},NOW);assert.equal(x.escalationState,"QUARANTINED");});
test("single-source support requires review even when strong",()=>{const x=assessIdentityConfidence({...base,evidence:[e("s1",true,100,1)]},NOW);assert.equal(x.escalationState,"REVIEW_REQUIRED");assert.ok(x.conflictClasses.includes("INSUFFICIENT_CORROBORATION"));});
test("jurisdiction mismatch requires review",()=>{const x=assessIdentityConfidence({...base,evidence:[e("s1"),e("s2",true,95,0.95,"2026-10-01T06:00:00Z","jurisdiction:iso3166-1:ke")]},NOW);assert.ok(x.conflictClasses.includes("JURISDICTION_MISMATCH"));});
test("stale evidence requires review",()=>{const old="2026-09-20T00:00:00Z";const x=assessIdentityConfidence({...base,evidence:[e("s1",true,95,0.95,old),e("s2",true,95,0.95,old)]},NOW);assert.ok(x.conflictClasses.includes("STALE_EVIDENCE"));});
test("authority escalation refused",()=>{assert.throws(()=>validateIdentityConfidenceInput({...base,productionAuthority:true} as any),/CONFIDENCE_AUTHORITY_VIOLATION/);});
test("accessor input fails closed with zero getter executions",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"mode",{enumerable:true,get(){hits++;return "LOCAL_ONLY";}});assert.throws(()=>validateIdentityConfidenceInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
