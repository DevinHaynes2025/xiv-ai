import test from "node:test";
import assert from "node:assert/strict";
import { validateOrganizationIdentityReconciliation, issueCanonicalIdentityReceipt } from "./xvi-organization-identity-reconciliation";

const H = "a".repeat(64);
const candidate = {organizationId:"org:africa:alpha",canonicalName:"Alpha Holdings",jurisdictionId:"jurisdiction:iso3166-1:ng",aliases:["Alpha"],identityKeys:["registry:NG-1"],lifecycleState:"ACTIVE"} as const;
const evidence = {sourceId:"source:registry",sourceRecordId:"r1",contentHash:H,supports:true,confidence:0.98,quarantineReasons:[]} as const;
const base = {reconciliationId:"reconcile:org:alpha",kind:"RENAME",decision:"CONFIRMED",canonicalOrganizationId:"org:africa:alpha",candidates:[candidate],evidence:[evidence],effectiveAt:"2026-10-01T06:30:00Z",reviewedByHuman:true,modesAllowed:["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"],secretsPresent:false,executionAuthority:false,networkAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("confirmed rename emits read-only canonical receipt",()=>{const x=issueCanonicalIdentityReceipt(base);assert.equal(x.kind,"RENAME");assert.equal(x.safeReadOnly,true);assert.equal(x.canRewriteHistory,false);assert.equal(x.executionAuthority,false);assert.deepEqual(x.displayAliasSet,["Alpha","Alpha Holdings"]);});
test("merge requires multiple candidates and human review",()=>{assert.throws(()=>validateOrganizationIdentityReconciliation({...base,kind:"MERGE" as const,reviewedByHuman:false}),/STRUCTURAL_CHANGE_REQUIRES_HUMAN_REVIEW/);assert.throws(()=>validateOrganizationIdentityReconciliation({...base,kind:"MERGE" as const}),/MERGE_REQUIRES_MULTIPLE_CANDIDATES/);});
test("confirmed reconciliation cannot hide contradiction",()=>{const x=structuredClone(base) as any;x.evidence.push({...evidence,sourceId:"source:other",sourceRecordId:"r2",supports:false});assert.throws(()=>validateOrganizationIdentityReconciliation(x),/CONFIRMED_CONTRADICTION_REQUIRES_REVIEW_STATE/);});
test("quarantined evidence cannot be confirmed",()=>{const x=structuredClone(base) as any;x.evidence[0].quarantineReasons=["SOURCE_CONFLICT"];assert.throws(()=>validateOrganizationIdentityReconciliation(x),/CONFIRMED_REQUIRES_CLEAN_EVIDENCE|QUARANTINED_EVIDENCE_REQUIRES_STATE/);});
test("canonical organization must be one candidate",()=>{assert.throws(()=>validateOrganizationIdentityReconciliation({...base,canonicalOrganizationId:"org:africa:missing"}),/CANONICAL_MUST_BE_CANDIDATE/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateOrganizationIdentityReconciliation({...base,mutationAuthority:true} as any),/AUTHORITY_OR_SECRET_VIOLATION/);});
test("accessor input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>=structuredClone(base) as any;Object.defineProperty(x,"kind",{enumerable:true,get(){hits++;return "RENAME";}});assert.throws(()=>validateOrganizationIdentityReconciliation(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
