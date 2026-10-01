import test from "node:test";
import assert from "node:assert/strict";
import {issueGlobalCompletenessRollup,validateGlobalCompletenessRollupInput} from "./xvi-global-completeness-rollup";
const domain=(name:string,c=1,f=1,l=1,r=3,q=0,d=0)=>({domain:name,coverageRatio:c,freshnessRatio:f,licenseCompatibilityRatio:l,independentSourceRoots:r,quarantinedUnits:q,disputedUnits:d});
const country=(id:string,region:string,domains:any[],langs:string[]=[])=>({jurisdictionId:id,region,domainCoverage:domains,languageCoverageRatio:langs.length?0.5:1,uncoveredLanguages:langs,observedAt:"2026-10-01T19:00:00Z"});
const base={snapshots:[
  country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS"),domain("INFRASTRUCTURE")]),
  country("jurisdiction:ng","AFRICA",[domain("ORGANIZATIONS"),domain("INFRASTRUCTURE")]),
  country("jurisdiction:us","AMERICAS",[domain("ORGANIZATIONS"),domain("INFRASTRUCTURE")])
],requiredDomains:["ORGANIZATIONS","INFRASTRUCTURE"],observedAt:"2026-10-01T19:00:00Z",safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;
test("healthy countries roll up without hiding structure",()=>{const x=issueGlobalCompletenessRollup(base);assert.equal(x.totalCountries,3);assert.equal(x.globalRequiresHumanReview,false);assert.equal(x.averagesAreNotCompleteness,true);});
test("zero coverage country is preserved explicitly",()=>{const x=issueGlobalCompletenessRollup({...base,snapshots:[country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS",0),domain("INFRASTRUCTURE")]),country("jurisdiction:ng","AFRICA",[domain("ORGANIZATIONS"),domain("INFRASTRUCTURE")])]});assert.ok(x.countriesWithZeroCoverage.includes("jurisdiction:ke"));assert.equal(x.globalRequiresHumanReview,true);});
test("missing required domain is treated as zero coverage",()=>{const x=issueGlobalCompletenessRollup({...base,snapshots:[country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS")])]});assert.ok(x.countriesWithZeroCoverage.includes("jurisdiction:ke"));});
test("language gaps survive regional rollup",()=>{const x=issueGlobalCompletenessRollup({...base,snapshots:[country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS"),domain("INFRASTRUCTURE")],["sw"])]});assert.ok(x.countriesWithLanguageGaps.includes("jurisdiction:ke"));});
test("weak independence survives regional rollup",()=>{const x=issueGlobalCompletenessRollup({...base,snapshots:[country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS",1,1,1,1),domain("INFRASTRUCTURE")])]});assert.equal(x.regionRollups[0].weakIndependenceCountries.length,1);});
test("regional average cannot erase country gap",()=>{const x=issueGlobalCompletenessRollup({...base,snapshots:[country("jurisdiction:ke","AFRICA",[domain("ORGANIZATIONS",0),domain("INFRASTRUCTURE")]),country("jurisdiction:ng","AFRICA",[domain("ORGANIZATIONS",1),domain("INFRASTRUCTURE")])]});const a=x.regionRollups[0].domainAverages.find(d=>d.domain==="ORGANIZATIONS");assert.equal(a?.averageCoverageRatio,0.5);assert.equal(x.regionRollups[0].zeroCoverageCountries.length,1);});
test("duplicate country snapshot is refused",()=>{assert.throws(()=>validateGlobalCompletenessRollupInput({...base,snapshots:[base.snapshots[0],base.snapshots[0]]}),/COUNTRY_SNAPSHOT_IDENTITY_INVALID/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateGlobalCompletenessRollupInput({...base,mutationAuthority:true} as any),/GLOBAL_ROLLUP_AUTHORITY_VIOLATION/);});
test("accessor-bearing input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"observedAt",{enumerable:true,get(){hits++;return "2026-10-01T19:00:00Z";}});assert.throws(()=>validateGlobalCompletenessRollupInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
