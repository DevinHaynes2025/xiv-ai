import test from "node:test";
import assert from "node:assert/strict";
import { assessEvidenceIndependence, validateEvidenceIndependenceInput } from "./xvi-organization-evidence-independence";

const H1="a".repeat(64), H2="b".repeat(64), H3="c".repeat(64);
const original=(id:string,hash=H1,supports=true)=>({sourceId:id,upstreamSourceIds:[],relation:"ORIGINAL",contentHash:hash,observedAt:"2026-10-01T07:00:00Z",supportsIdentity:supports,quarantineReasons:[]});
const dependent=(id:string,upstream:string,relation:"MIRROR"|"SYNDICATED"|"DERIVED"|"AGGREGATED"="MIRROR",hash=H1,supports=true)=>({sourceId:id,upstreamSourceIds:[upstream],relation,contentHash:hash,observedAt:"2026-10-01T07:00:00Z",supportsIdentity:supports,quarantineReasons:[]});
const base={organizationId:"org:africa:alpha",mode:"LOCAL_ONLY",evidence:[original("registry",H1),original("exchange",H2),original("university",H3)],safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("three independent originals count as three groups",()=>{const x=assessEvidenceIndependence(base);assert.equal(x.independentGroupCount,3);assert.equal(x.independentSupportingGroupCount,3);assert.equal(x.requiresHumanReview,false);assert.equal(x.independenceIsTruth,false);});
test("mirror and syndicated copies collapse to one upstream group",()=>{const x=assessEvidenceIndependence({...base,evidence:[original("registry",H1),dependent("mirror","registry","MIRROR",H1),dependent("wire","registry","SYNDICATED",H1)]});assert.equal(x.independentGroupCount,1);assert.equal(x.independentSupportingGroupCount,1);assert.equal(x.dependentEvidenceCount,2);assert.equal(x.requiresHumanReview,true);});
test("duplicate content hashes are surfaced",()=>{const x=assessEvidenceIndependence({...base,evidence:[original("a",H1),original("b",H1),original("c",H2)]});assert.equal(x.duplicateContentHashCount,1);assert.equal(x.requiresHumanReview,true);});
test("contradiction in a source group forces review",()=>{const x=assessEvidenceIndependence({...base,evidence:[original("registry",H1),dependent("mirror","registry","MIRROR",H2,false),original("exchange",H3)]});assert.equal(x.requiresHumanReview,true);assert.equal(x.sourceGroups.find(g=>g.rootSourceId==="registry")?.contradictingMembers,1);});
test("lineage cycle is refused",()=>{const evidence=[dependent("a","b"),dependent("b","a")];assert.throws(()=>assessEvidenceIndependence({...base,evidence}),/SOURCE_LINEAGE_CYCLE/);});
test("dependent source without upstream is refused",()=>{const bad={...dependent("m","registry"),upstreamSourceIds:[]};assert.throws(()=>validateEvidenceIndependenceInput({...base,evidence:[bad]}),/DEPENDENT_SOURCE_REQUIRES_UPSTREAM/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateEvidenceIndependenceInput({...base,executionAuthority:true} as any),/INDEPENDENCE_AUTHORITY_VIOLATION/);});
test("accessor input fails closed with zero getter executions",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"mode",{enumerable:true,get(){hits++;return "LOCAL_ONLY";}});assert.throws(()=>validateEvidenceIndependenceInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
