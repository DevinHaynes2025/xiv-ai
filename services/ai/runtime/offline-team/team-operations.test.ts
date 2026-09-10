import assert from 'node:assert/strict';
import { normalizeTeamMember, summarizeTeam } from './team-operations';
import { validateGrowthManifest } from './database-growth-manifest';
import { buildBlueprintReport } from './blueprint-conformance';

const qwen=normalizeTeamMember({id:'qwen-local',role:'CODER',provider:'OLLAMA',state:'ACTIVE',evidence:['OLLAMA_PLUS_LOCAL','qwen2.5-coder:7b']});
const cursor=normalizeTeamMember({id:'cursor',role:'IDE_AGENT',provider:'CURSOR',state:'ACTIVE',evidence:[]});
assert.equal(qwen.state,'ACTIVE');
assert.equal(cursor.state,'UNVERIFIED');
assert.equal(summarizeTeam([qwen,cursor]).active,1);

const growth=validateGrowthManifest({tenantId:'xiv-local',atomicCells:100,shards:4,documentsIndexed:12,lessonsStored:3,simulationsStored:2,targetScale:'TRILLION_SCALE_TARGET',evidence:['planning-target']});
assert.equal(growth.atomicCells,100);

const report=buildBlueprintReport('grok/12d-29-local-team-ops-blueprint-reports',[{area:'OFFLINE_FIRST',status:'PASS',evidence:['OLLAMA_PLUS_LOCAL'],note:'local runtime verified'},{area:'SIMULATION_HONESTY',status:'PASS',evidence:['quantum simulator only'],note:'no QPU claim'}],new Date('2026-09-10T00:00:00Z'));
assert.equal(report.productionReady,false);
console.log('12D-29 local team operations contracts: OK');
