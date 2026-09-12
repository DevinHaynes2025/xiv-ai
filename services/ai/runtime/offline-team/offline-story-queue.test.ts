import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
const story=(id='s1',tenantId='t'):OfflineStory=>({id,tenantId,roleId:'web_engineer',objective:'Objective '+id,acceptance:['Tests pass'],dependencies:[],sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'PRODUCT_STORY'});
function memory(fn:(q:OfflineStoryQueue,setTime:(n:number)=>void)=>void){let now=1000;const q=new OfflineStoryQueue(':memory:',()=>now);try{fn(q,n=>now=n);}finally{q.close();}}

test('source stories are durable and isolated by tenant',()=>{
 const dir=mkdtempSync(join(tmpdir(),'xiv-queue-test-'));const path=join(dir,'queue.sqlite');
 try{let q=new OfflineStoryQueue(path);q.enqueue([story(),story('s2','other')]);q.close();q=new OfflineStoryQueue(path);
 assert.equal(q.page('t').length,1);assert.equal(q.page('other').length,1);q.close();}finally{rmSync(dir,{recursive:true,force:true});}
});
test('semantic duplicates do not inflate backlog and conflicting IDs roll back',()=>memory(q=>{
 assert.equal(q.enqueue([story()]).inserted,1);assert.equal(q.enqueue([story()]).duplicates,1);
 assert.equal(q.enqueue([{...story(),id:'alias'}]).duplicates,1);
 assert.throws(()=>q.enqueue([story('second'),{...story(),objective:'Conflict'}]));assert.equal(q.page('t').length,1);
}));
test('bounded paging uses increasing ordinals without offset scans',()=>memory(q=>{
 q.enqueue([story(),story('s2'),story('s3')]);const first=q.page('t',0,2);const next=q.page('t',Number(first.at(-1)!.ordinal),2);
 assert.equal(first.length,2);assert.equal(next.length,1);assert.equal(next[0].id,'s3');assert.throws(()=>q.page('t',0,101));
}));
test('expired lease blocks replacement until original provider settlement',()=>memory((q,time)=>{
 q.enqueue([story(),story('s2')]);const l=q.claimNext('t','web_engineer','owner',10)!;time(2000);
 assert.equal(q.claimNext('t','web_engineer','other'),null);assert.equal(q.summary('t').leaseExpired,true);
 q.settle(l,{outcome:'DRAFT',outputHash:'f'.repeat(64),providerSettled:true});
 assert.equal(q.page('t')[0].state,'FAILED');assert.equal(q.page('t')[0].output_hash,null);assert.ok(q.claimNext('t','web_engineer','other'));
}));
test('lease persists after reopen and cannot be stolen through another connection',()=>{
 const dir=mkdtempSync(join(tmpdir(),'xiv-queue-test-')),path=join(dir,'queue.sqlite');
 try{const a=new OfflineStoryQueue(path,()=>1000),b=new OfflineStoryQueue(path,()=>1000);a.enqueue([story(),story('s2')]);
 const l=a.claimNext('t','web_engineer','one')!;assert.equal(b.claimNext('t','web_engineer','two'),null);a.close();
 assert.equal(b.claimNext('t','web_engineer','two'),null);b.settle(l,{outcome:'FAILED',providerSettled:true});b.close();}
 finally{rmSync(dir,{recursive:true,force:true});}
});
test('lease holds globally across tenant queues in this one database',()=>memory(q=>{
 q.enqueue([story(),story('s2','other')]);q.claimNext('t','web_engineer','one');assert.equal(q.claimNext('other','web_engineer','two'),null);
}));
test('foreign, altered and unconfirmed settlement cannot release a lease',()=>memory(q=>{
 q.enqueue([story()]);const l=q.claimNext('t','web_engineer','owner')!;
 for(const patch of [{token:'wrong'},{tenantId:'other'},{ownerId:'other'},{deadlineMs:l.deadlineMs+1},{roleId:'node_backend'}])
 assert.throws(()=>q.settle({...l,...patch},{outcome:'FAILED',providerSettled:true}));
 assert.throws(()=>q.settle(l,{outcome:'FAILED',providerSettled:false as never}));assert.equal(q.summary('t').leaseHeld,true);
}));
test('completed draft needs designated review before dependent work can proceed',()=>memory(q=>{
 q.enqueue([story(),{...story('s2'),dependencies:['s1']}]);const l=q.claimNext('t','web_engineer','owner')!;
 q.settle(l,{outcome:'DRAFT',outputHash:'a'.repeat(64),providerSettled:true});assert.equal(q.claimNext('t','web_engineer','owner'),null);
 assert.throws(()=>q.acceptReview('t','s1','web_engineer','review:1'));q.acceptReview('t','s1','secure_code_reviewer','review:1');
 assert.equal(q.claimNext('t','web_engineer','owner')!.storyId,'s2');
}));
test('dependencies cannot be satisfied by another tenants completed work',()=>memory(q=>{
 q.enqueue([{...story('s1','other')},{...story('s2'),dependencies:['s1']}]);
 const l=q.claimNext('other','web_engineer','owner')!;q.settle(l,{outcome:'DRAFT',outputHash:'a'.repeat(64),providerSettled:true});q.acceptReview('other','s1','secure_code_reviewer','review:1');
 assert.equal(q.claimNext('t','web_engineer','owner'),null);
}));
test('capacity fixtures are not executable user stories',()=>memory(q=>{
 q.enqueue([{...story(),kind:'CAPACITY_FIXTURE'}]);assert.equal(q.claimNext('t','web_engineer','owner'),null);
 assert.equal(q.summary('t').capacityRowsAreUserStories,false);
}));
test('unknown roles, sensitive classifications, invalid versions and unbounded batches fail',()=>memory(q=>{
 for(const patch of [{roleId:'fake'},{securityClass:'TOP_SECRET' as never},{sourceRevision:'invalid'},{dependencies:['s1']},{acceptance:[]},{objective:'x'.repeat(3001)}])assert.throws(()=>q.enqueue([{...story(),...patch}]));
 assert.throws(()=>q.enqueue(Array(1001).fill(story())));assert.equal(q.page('t').length,0);
}));
test('invalid clock and backwards time cannot silently extend a lease',()=>memory((q,time)=>{
 q.enqueue([story()]);const l=q.claimNext('t','web_engineer','owner')!;time(0);assert.throws(()=>q.settle(l,{outcome:'FAILED',providerSettled:true}));
 time(NaN);assert.throws(()=>q.claimNext('t','web_engineer','other'));
}));
