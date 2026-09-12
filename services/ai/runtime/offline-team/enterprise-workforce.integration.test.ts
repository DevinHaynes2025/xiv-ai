import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { listXivAgents } from '../agents';
import { ENTERPRISE_WORKFORCE, composeRoleDraft } from './enterprise-workforce';
import { APPROVED_MASTER_PLAN_SHA256 } from './approved-master-plan-meeting';
import { AuthenticatedAgentReport } from './agent-presence-report';

test('all existing 21 core IDs are referenced exactly once and are not replaced',()=>{
 const refs=ENTERPRISE_WORKFORCE.filter(r=>r.origin==='CORE_REFERENCE').map(r=>r.id).sort();
 assert.deepEqual(refs,listXivAgents().map(r=>r.id).sort());
 assert.equal(listXivAgents().length,21);
});
test('100-role catalog can feed existing 12D-95 report without inferring liveness',()=>{
 const report=new AuthenticatedAgentReport({tenantId:'xiv-dev-pilot',
   definitions:ENTERPRISE_WORKFORCE.map(r=>({id:r.id,name:r.name,status:'prototype'})),
   seats:[],enrollments:[]}).snapshot();
 assert.equal(report.sourceInventory.coreDefinitionCount,100);
 assert.equal(report.globalLiveAgentCount,null);
 assert.equal(report.operationalAuthorizationGranted,false);
 // This is a separate 100-profile inventory passed to the generic collector, not the 21-core registry.
});
test('role drafts bind the existing approved master-plan constant',()=>{
 const task={tenantId:'t',storyId:'s',sourceRevision:'a'.repeat(40),masterPlanSha256:APPROVED_MASTER_PLAN_SHA256,
   securityClass:'ORDINARY' as const,objective:'Review a synthetic frontend contract'};
 assert.equal(composeRoleDraft('web_engineer',task).executionStarted,false);
 assert.throws(()=>composeRoleDraft('web_engineer',{...task,masterPlanSha256:'b'.repeat(64)}));
});
