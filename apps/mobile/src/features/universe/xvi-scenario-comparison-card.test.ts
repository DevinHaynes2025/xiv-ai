import test from "node:test";
import assert from "node:assert/strict";
import {presentScenarioComparisonCard} from "./xvi-scenario-comparison-card";

const receipt = {
  schemaVersion:"xvi-scenario-comparison-v1",
  scenarioSetId:"scenario-set:1",
  runMode:"ONLINE_GOVERNED",
  baseScenarioId:"scenario:base",
  upsideScenarioId:"scenario:up",
  downsideScenarioId:"scenario:down",
  upsideDeltaFromBase:25,
  downsideDeltaFromBase:-15,
  upsideMaterialChange:false,
  downsideMaterialChange:false,
  highSensitivityChangeCount:0,
  weakCalibrationScenarioCount:1,
  disputedScenarioCount:0,
  quarantinedEvidenceCount:0,
  canRenderComparison:true,
  requiresHumanReview:false,
  route:"UNIVERSE",
  zeroSecretContext:true,
  safeReadOnly:true,
  canTakeExternalAction:false,
  executionAuthority:false,
  mutationAuthority:false,
  productionAuthority:false
} as const;

const base = {
  audience:"ENTREPRENEUR",
  metricLabel:"Qualified demand",
  unitLabel:"leads",
  horizonLabel:"Next 90 days",
  baseProjectedValue:100,
  receipt,
  safeReadOnly:true,
  canTakeExternalAction:false
} as const;

test("clear entrepreneur scenario stays in Universe",()=> {
  const x=presentScenarioComparisonCard(base);
  assert.equal(x.eyebrow,"Business scenarios");
  assert.equal(x.route,"UNIVERSE");
  assert.equal(x.reviewState,"CLEAR");
  assert.equal(x.primaryAction,"Explore scenarios");
  assert.equal(x.baseValue,100);
  assert.equal(x.upsideValue,125);
  assert.equal(x.downsideValue,85);
});

test("consumer framing uses For you",()=> {
  const x=presentScenarioComparisonCard({...base,audience:"CONSUMER"});
  assert.equal(x.eyebrow,"For you · Scenarios");
});

test("executive framing uses executive scenarios",()=> {
  const x=presentScenarioComparisonCard({...base,audience:"EXECUTIVE"});
  assert.equal(x.eyebrow,"Executive scenarios");
});

test("material high-sensitivity change routes to Needs You",()=> {
  const changed={...receipt,upsideMaterialChange:true,highSensitivityChangeCount:1,requiresHumanReview:true,route:"NEEDS_YOU"} as const;
  const x=presentScenarioComparisonCard({...base,receipt:changed});
  assert.equal(x.reviewState,"NEEDS_REVIEW");
  assert.equal(x.primaryAction,"Review assumptions");
  assert.equal(x.route,"NEEDS_YOU");
});

test("disputed scenario blocks comparison and routes to evidence review",()=> {
  const disputed={...receipt,disputedScenarioCount:1,canRenderComparison:false,requiresHumanReview:true,route:"NEEDS_YOU"} as const;
  const x=presentScenarioComparisonCard({...base,receipt:disputed});
  assert.equal(x.reviewState,"BLOCKED");
  assert.equal(x.primaryAction,"Review evidence");
});

test("quarantined evidence blocks comparison",()=> {
  const quarantined={...receipt,quarantinedEvidenceCount:2,canRenderComparison:false,requiresHumanReview:true,route:"NEEDS_YOU"} as const;
  const x=presentScenarioComparisonCard({...base,receipt:quarantined});
  assert.equal(x.reviewState,"BLOCKED");
  assert.match(x.evidenceLabel,/2 quarantined evidence items/);
});

test("local-only mode remains explicit",()=> {
  const x=presentScenarioComparisonCard({...base,receipt:{...receipt,runMode:"LOCAL_ONLY"}});
  assert.equal(x.modeLabel,"Local only");
});

test("offline-governed mode remains explicit",()=> {
  const x=presentScenarioComparisonCard({...base,receipt:{...receipt,runMode:"OFFLINE_GOVERNED"}});
  assert.equal(x.modeLabel,"Offline governed");
});

test("forged route is rejected",()=> {
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,receipt:{...receipt,route:"NEEDS_YOU"}} as any),
    /SCENARIO_CARD_REVIEW_STATE_MISMATCH/
  );
});

test("forged render state is rejected",()=> {
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,receipt:{...receipt,canRenderComparison:false}} as any),
    /SCENARIO_CARD_RENDER_STATE_MISMATCH/
  );
});

test("duplicate scenario ids are rejected",()=> {
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,receipt:{...receipt,upsideScenarioId:"scenario:base"}} as any),
    /SCENARIO_CARD_SCENARIO_IDS_INVALID/
  );
});

test("authority escalation is rejected",()=> {
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,canTakeExternalAction:true} as any),
    /SCENARIO_CARD_AUTHORITY_VIOLATION/
  );
});

test("accessor-bearing receipt fails closed without executing getter",()=> {
  let hits=0;
  const hostile:Record<string,unknown>={...receipt};
  Object.defineProperty(hostile,"route",{enumerable:true,get(){hits++;return "UNIVERSE";}});
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,receipt:hostile} as any),
    /SCENARIO_CARD_RECEIPT_ACCESSOR_FORBIDDEN/
  );
  assert.equal(hits,0);
});

test("non-finite base projection is rejected",()=> {
  assert.throws(
    ()=>presentScenarioComparisonCard({...base,baseProjectedValue:Number.POSITIVE_INFINITY}),
    /BASE_PROJECTED_VALUE_INVALID/
  );
});

test("presentation never claims truth or execution",()=> {
  const x=presentScenarioComparisonCard(base);
  assert.equal(x.canClaimTruth,false);
  assert.equal(x.canClaimExecution,false);
  assert.equal(x.canMutate,false);
  assert.equal(x.safeReadOnly,true);
  assert.equal(x.secondaryAction,"Ask XVI");
  assert.equal(x.disclaimer,"Scenario analysis, not a prediction.");
});
