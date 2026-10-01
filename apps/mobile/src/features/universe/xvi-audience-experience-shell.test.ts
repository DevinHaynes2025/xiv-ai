import test from "node:test";
import assert from "node:assert/strict";
import {presentAudienceExperience} from "./xvi-audience-experience-shell";
const base={personalAgentAvailable:true,organizationConnected:true,communityEnabled:true,requestedModules:[],safeReadOnly:true,canMutate:false,canClaimExecution:false} as const;
test("consumer experience prioritizes people-facing modules",()=>{const x=presentAudienceExperience({...base,audience:"CONSUMER" as const});assert.ok(x.primaryModules.includes("FOR_YOU"));assert.equal(x.coreLabel,"CORE ♾️");});
test("entrepreneur experience prioritizes growth and agents",()=>{const x=presentAudienceExperience({...base,audience:"ENTREPRENEUR" as const});assert.ok(x.primaryModules.includes("OPPORTUNITIES"));assert.ok(x.primaryModules.includes("AGENTS"));});
test("executive experience prioritizes analytics and governance",()=>{const x=presentAudienceExperience({...base,audience:"EXECUTIVE" as const});assert.ok(x.primaryModules.includes("ANALYTICS"));assert.ok(x.primaryModules.includes("SECURITY"));});
test("shared intelligence stays common across audiences",()=>{for(const audience of ["CONSUMER","ENTREPRENEUR","EXECUTIVE"] as const){assert.equal(presentAudienceExperience({...base,audience}).sharedIntelligence,true);}});
test("authority claims remain disabled",()=>{const x=presentAudienceExperience({...base,audience:"EXECUTIVE" as const});assert.equal(x.canMutate,false);assert.equal(x.canClaimExecution,false);});
