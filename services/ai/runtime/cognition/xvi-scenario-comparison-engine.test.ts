import test from "node:test";
import assert from "node:assert/strict";
import {compareScenarios,validateScenarioComparisonInput} from "./xvi-scenario-comparison-engine";

const H1="a".repeat(64), H2="b".repeat(64);
const assumption=(id:string,v:number,sensitivity:"LOW"|"MEDIUM"|"HIGH"="MEDIUM")=>({assumptionId:id,label:id,normalizedValue:v,unitLabel:"index",sensitivity});
const scenario=(kind:"BASE"|"UPSIDE"|"DOWNSIDE",value:number,lower:number,upper:number,assumptions:any[],calibrationState:"UNTESTED"|"CALIBRATED"|"UNDERPERFORMING"|"DISPUTED"="CALIBRATED",q=0)=>({scenarioId:`scenario:${kind.toLowerCase()}`,kind,projectedValue:value,lower,upper,assumptions,provenanceRootHashes:[H1,H2],quarantinedEvidenceCount:q,calibrationState});
const base={scenarioSetId:"scenario-set:1",tenantId:"tenant:alpha",userScopeId:"user-scope:1",runMode:"ONLINE_GOVERNED",sourceStoryId:"story:1",sourceVisualizationId:"viz:1",metricId:"revenue",unitLabel:"USD",horizonLabel:"90 days",materialityThresholdRatio:0.1,scenarios:[
  scenario("BASE",100,90,110,[assumption("demand",1,"HIGH"),assumption("price",1)]),
  scenario("UPSIDE",125,110,140,[assumption("demand",1.2,"HIGH"),assumption("price",1)]),
  scenario("DOWNSIDE",80,65,95,[assumption("demand",0.8,"HIGH"),assumption("price",1)])
],observedAt:"2026-10-01T12:15:00Z",zeroSecretContext:true,safeReadOnly:true,executionAuthority:false,mutationAuthority:false,productionAuthority:false} as const;

test("compares three scenarios without action authority",()=>{const x=compareScenarios(base);assert.equal(x.upsideDeltaFromBase,25);assert.equal(x.downsideDeltaFromBase,-20);assert.equal(x.canTakeExternalAction,false);});
test("material high-sensitivity change routes Needs You",()=>{const x=compareScenarios(base);assert.equal(x.upsideMaterialChange,true);assert.equal(x.highSensitivityChangeCount,1);assert.equal(x.route,"NEEDS_YOU");});
test("small low-sensitivity movement stays in Universe",()=>{const x=compareScenarios({...base,materialityThresholdRatio:0.5,scenarios:[
  scenario("BASE",100,95,105,[assumption("demand",1,"LOW")]),
  scenario("UPSIDE",110,100,120,[assumption("demand",1.1,"LOW")]),
  scenario("DOWNSIDE",95,85,105,[assumption("demand",0.95,"LOW")])
]});assert.equal(x.route,"UNIVERSE");});
test("quarantine blocks clean rendering",()=>{const x=compareScenarios({...base,scenarios:[base.scenarios[0],base.scenarios[1],{...base.scenarios[2],quarantinedEvidenceCount:1}]});assert.equal(x.canRenderComparison,false);assert.equal(x.route,"NEEDS_YOU");});
test("disputed calibration routes Needs You",()=>{const x=compareScenarios({...base,scenarios:[base.scenarios[0],{...base.scenarios[1],calibrationState:"DISPUTED" as const},base.scenarios[2]]});assert.equal(x.disputedScenarioCount,1);assert.equal(x.route,"NEEDS_YOU");});
test("assumption set mismatch is refused",()=>{assert.throws(()=>validateScenarioComparisonInput({...base,scenarios:[base.scenarios[0],scenario("UPSIDE",125,110,140,[assumption("other",1)]),base.scenarios[2]]}),/ASSUMPTION_SET_MISMATCH/);});
test("assumption metadata mismatch is refused",()=>{assert.throws(()=>compareScenarios({...base,scenarios:[base.scenarios[0],scenario("UPSIDE",125,110,140,[{...assumption("demand",1.2,"HIGH"),label:"different"},assumption("price",1)]),base.scenarios[2]]}),/ASSUMPTION_METADATA_MISMATCH/);});
test("value must stay inside interval",()=>{assert.throws(()=>validateScenarioComparisonInput({...base,scenarios:[scenario("BASE",150,90,110,[assumption("demand",1,"HIGH"),assumption("price",1)]),base.scenarios[1],base.scenarios[2]]}),/SCENARIO_INTERVAL_INVALID/);});
test("duplicate provenance roots are refused",()=>{const bad={...base,scenarios:[{...base.scenarios[0],provenanceRootHashes:[H1,H1]},base.scenarios[1],base.scenarios[2]]};assert.throws(()=>validateScenarioComparisonInput(bad),/PROVENANCE_ROOT_DUPLICATE/);});
test("authority escalation is refused",()=>{assert.throws(()=>validateScenarioComparisonInput({...base,executionAuthority:true} as any),/SCENARIO_COMPARISON_AUTHORITY_VIOLATION/);});
test("all governed run modes are accepted",()=>{for(const runMode of ["ONLINE_GOVERNED","OFFLINE_GOVERNED","LOCAL_ONLY"] as const) assert.equal(compareScenarios({...base,runMode}).runMode,runMode);});
test("accessor input fails closed without getter execution",()=>{let hits=0;const x:Record<string,unknown>={...base};Object.defineProperty(x,"scenarioSetId",{enumerable:true,get(){hits++;return "scenario-set:evil";}});assert.throws(()=>validateScenarioComparisonInput(x),/ACCESSOR_FORBIDDEN/);assert.equal(hits,0);});
