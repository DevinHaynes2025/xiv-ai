import test from "node:test";
import assert from "node:assert/strict";
import {presentInvestigationWorkspace} from "./xvi-investigation-workspace";
const base={workspaceId:"workspace:1",audience:"ENTREPRENEUR",title:"Expansion opportunity",state:"ACTIVE",items:[{itemId:"i1",type:"STORY",refId:"story:1",label:"Demand story"},{itemId:"i2",type:"VISUALIZATION",refId:"viz:1",label:"Revenue outlook"}],unresolvedQuestionCount:2,disputedItemCount:0,lastUpdatedAt:"2026-10-02T01:30:00Z",safeReadOnly:true,canMutate:false,canClaimExecution:false} as const;
test("active investigation stays in Universe",()=>{const x=presentInvestigationWorkspace(base);assert.equal(x.attentionRoute,"UNIVERSE");assert.equal(x.primaryAction,"Continue investigation");});
test("disputed evidence routes to Needs You",()=>{const x=presentInvestigationWorkspace({...base,disputedItemCount:1});assert.equal(x.attentionRoute,"NEEDS_YOU");assert.equal(x.primaryAction,"Review disputed evidence");});
test("explicit review state routes to Needs You",()=>{const x=presentInvestigationWorkspace({...base,state:"NEEDS_REVIEW" as const});assert.equal(x.attentionRoute,"NEEDS_YOU");});
test("archived investigation stays read only",()=>{const x=presentInvestigationWorkspace({...base,state:"ARCHIVED" as const});assert.equal(x.primaryAction,"Open archive");assert.equal(x.canMutate,false);});
test("execution claim remains disabled",()=>{const x=presentInvestigationWorkspace(base);assert.equal(x.canClaimExecution,false);});
