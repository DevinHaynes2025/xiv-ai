import test from "node:test";
import assert from "node:assert/strict";
import { compileCombinedIdentityDecision } from "./xvi-organization-identity-decision-compiler";

const lifecycle={organizationId:"org:africa:alpha",identityState:"RESOLVED",lifecycleState:"ACTIVE",supportingEvidenceCount:3,contradictingEvidenceCount:0,requiresHumanReview:false,safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
const reconciliation={reconciliationId:"reconcile:org:alpha",kind:"RENAME",decision:"CONFIRMED",canonicalOrganizationId:"org:africa:alpha",supportingEvidenceCount:2,contradictingEvidenceCount:0,requiresHumanReview:false,safeReadOnly:true,canRewriteHistory:false,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
const confidence={organizationId:"org:africa:alpha",confidenceBand:"HIGH",escalationState:"CLEAR",conflictClasses:["NONE"],distinctSupportingSources:3,requiresHumanReview:false,safeReadOnly:true,scoreIsTruth:false,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
const independence={organizationId:"org:africa:alpha",independentGroupCount:3,independentSupportingGroupCount:3,dependentEvidenceCount:0,duplicateContentHashCount:0,quarantinedEvidenceCount:0,requiresHumanReview:false,safeReadOnly:true,independenceIsTruth:false,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
const base={lifecycle,reconciliation,confidence,independence,observedAt:"2026-10-01T07:30:00Z"} as const;

test("clean combined identity routes to Universe",()=>{const x=compileCombinedIdentityDecision(base);assert.equal(x.route,"UNIVERSE");assert.equal(x.severity,"INFO");assert.equal(x.canDisplayCanonicalIdentity,true);assert.equal(x.canClaimTruth,false);});
test("conflicted lifecycle routes to Needs You",()=>{const x=compileCombinedIdentityDecision({...base,lifecycle:{...lifecycle,identityState:"CONFLICTED" as const,contradictingEvidenceCount:1,requiresHumanReview:true}});assert.equal(x.route,"NEEDS_YOU");assert.equal(x.severity,"REVIEW");});
test("revoked identity is blocked",()=>{const x=compileCombinedIdentityDecision({...base,lifecycle:{...lifecycle,identityState:"REVOKED" as const,requiresHumanReview:true}});assert.equal(x.severity,"BLOCKED");});
test("quarantined confidence is blocked",()=>{const x=compileCombinedIdentityDecision({...base,confidence:{...confidence,escalationState:"QUARANTINED" as const,requiresHumanReview:true}});assert.equal(x.severity,"BLOCKED");});
test("weak independence routes to review",()=>{const x=compileCombinedIdentityDecision({...base,independence:{...independence,independentSupportingGroupCount:1,requiresHumanReview:true}});assert.equal(x.route,"NEEDS_YOU");assert.ok(x.reasons.some(r=>/independent corroboration/i.test(r)));});
test("canonical organization mismatch is refused",()=>{assert.throws(()=>compileCombinedIdentityDecision({...base,reconciliation:{...reconciliation,canonicalOrganizationId:"org:africa:other"}}),/RECONCILIATION_CANONICAL_MISMATCH/);});
test("truth claims are refused",()=>{assert.throws(()=>compileCombinedIdentityDecision({...base,confidence:{...confidence,scoreIsTruth:true as any}}),/CONFIDENCE_TRUTH_CLAIM_FORBIDDEN/);});
test("authority escalation is refused",()=>{assert.throws(()=>compileCombinedIdentityDecision({...base,lifecycle:{...lifecycle,mutationAuthority:true as any}}),/LIFECYCLE_AUTHORITY_VIOLATION/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"observedAt",{enumerable:true,get(){hits++;return "2026-10-01T07:30:00Z";}});assert.throws(()=>compileCombinedIdentityDecision(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
