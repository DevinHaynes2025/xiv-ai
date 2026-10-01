import test from "node:test";
import assert from "node:assert/strict";
import {presentInsightCard} from "./xvi-insight-story-card";
const base={audience:"ENTREPRENEUR",title:"Demand is accelerating",summary:"Qualified demand rose across three independent evidence roots.",confidencePosture:"HIGH",independentEvidenceRoots:3,hasProjection:false,uncertaintyLabel:null,visualAvailable:true,nextQuestion:"Which segment is driving the change?",safeReadOnly:true,canTakeExternalAction:false,canClaimFact:true} as const;
test("entrepreneur card uses business insight framing",()=>{const x=presentInsightCard(base);assert.equal(x.eyebrow,"Business insight");assert.equal(x.primaryAction,"Explore data");});
test("projection routes to projection action",()=>{const x=presentInsightCard({...base,hasProjection:true,uncertaintyLabel:"80–120 orders"});assert.equal(x.primaryAction,"View projection");});
test("disputed story routes to evidence review",()=>{const x=presentInsightCard({...base,confidencePosture:"DISPUTED" as const,canClaimFact:false});assert.equal(x.primaryAction,"Review evidence");});
test("consumer card keeps same shared contract",()=>{const x=presentInsightCard({...base,audience:"CONSUMER" as const});assert.equal(x.eyebrow,"For you");assert.equal(x.canClaimExecution,false);});
test("executive card uses executive framing",()=>{const x=presentInsightCard({...base,audience:"EXECUTIVE" as const});assert.equal(x.eyebrow,"Executive intelligence");});
