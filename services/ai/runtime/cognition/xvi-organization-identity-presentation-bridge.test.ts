import test from "node:test";
import assert from "node:assert/strict";
import { compileCanonicalIdentityBridge, validateCanonicalIdentityBridgeInput } from "./xvi-organization-identity-presentation-bridge";

const NOW = "2026-10-01T06:30:00Z";
const base = {
  organizationId:"org:africa:alpha",
  canonicalName:"Alpha Holdings",
  mode:"LOCAL_ONLY",
  identityState:"RESOLVED",
  lifecycleState:"ACTIVE",
  identityKeyCount:2,
  supportingEvidenceCount:12,
  contradictingEvidenceCount:0,
  observedAt:"2026-10-01T06:00:00Z",
  reconciliationKind:"RENAME",
  reconciliationDecision:"CONFIRMED",
  reconciliationRequiresHumanReview:false,
  evidenceQuarantined:false,
  safeReadOnly:true,
  executionAuthority:false,
  mutationAuthority:false,
  productionAuthority:false,
} as const;

test("clean confirmed identity routes to Universe",()=>{const x=compileCanonicalIdentityBridge(base,NOW);assert.equal(x.route,"UNIVERSE");assert.equal(x.requiresHumanReview,false);assert.deepEqual(x.reviewReasons,[]);});
test("conflicted identity routes to Needs You",()=>{const x=compileCanonicalIdentityBridge({...base,identityState:"CONFLICTED" as const,contradictingEvidenceCount:1},NOW);assert.equal(x.route,"NEEDS_YOU");assert.ok(x.reviewReasons.includes("IDENTITY_CONFLICTED"));assert.ok(x.reviewReasons.includes("CONTRADICTORY_EVIDENCE"));});
test("proposed merge requires structural review",()=>{const x=compileCanonicalIdentityBridge({...base,reconciliationKind:"MERGE" as const,reconciliationDecision:"PROPOSED" as const,reconciliationRequiresHumanReview:true},NOW);assert.equal(x.route,"NEEDS_YOU");assert.ok(x.reviewReasons.includes("STRUCTURAL_CHANGE_REVIEW"));});
test("stale identity routes to Needs You",()=>{const x=compileCanonicalIdentityBridge({...base,observedAt:"2026-09-20T00:00:00Z"},NOW);assert.equal(x.route,"NEEDS_YOU");assert.ok(x.reviewReasons.includes("STALE_EVIDENCE"));});
test("quarantined evidence cannot be confirmed",()=>{assert.throws(()=>validateCanonicalIdentityBridgeInput({...base,evidenceQuarantined:true}),/QUARANTINED_EVIDENCE_CANNOT_CONFIRM/);});
test("resolved identity cannot hide contradiction",()=>{assert.throws(()=>validateCanonicalIdentityBridgeInput({...base,contradictingEvidenceCount:1}),/RESOLVED_CANNOT_HIDE_CONTRADICTION/);});
test("authority escalation refused",()=>{assert.throws(()=>validateCanonicalIdentityBridgeInput({...base,mutationAuthority:true} as any),/IDENTITY_BRIDGE_AUTHORITY_VIOLATION/);});
test("accessor input fails closed with zero getter executions",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"canonicalName",{enumerable:true,get(){hits++;return "evil";}});assert.throws(()=>validateCanonicalIdentityBridgeInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
