import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { SharedHostLeaseStore, type HostLeaseBinding } from './shared-host-lease-store';
import { OfflineStoryQueue, type OfflineStory } from './offline-story-queue';
import { SharedQueueAdmission, type SharedQueueContext, type SharedQueueTicket } from './shared-queue-admission';
import { getEnterpriseRole } from './enterprise-workforce';

const hostId = 'a'.repeat(32), source = 'b'.repeat(40), planHash = 'c'.repeat(64);
const context: SharedQueueContext = { tenantId: 'synthetic-tenant', holderInstanceId: 'synthetic-worker',
  sourceCommit: source, approvedPlanSha256: planHash, providerId: 'ollama', modelId: 'qwen2.5-coder:7b', presenceEvidenceRef: 'fixture:presence' };
const binding = (lane: 'HOMEBASE' | 'OFFLINE_SHIFT' = 'HOMEBASE'): HostLeaseBinding => ({
  tenantId: context.tenantId, holderInstanceId: context.holderInstanceId, lane, workId: 'work-1',
  sourceCommit: source, providerId: 'ollama', modelId: context.modelId, presenceEvidenceRef: 'fixture:presence' });
const story = (id = 'story-1'): OfflineStory => ({ id, tenantId: context.tenantId, roleId: 'node_backend',
  objective: `Synthetic bounded draft ${id}`, acceptance: ['Must pass the fixture test'], dependencies: [],
  sourceRevision: source, masterPlanSha256: planHash, kind: 'PRODUCT_STORY', securityClass: 'ORDINARY' });
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'xiv-admission-test-'));
  const path = join(dir, 'host.sqlite'); SharedHostLeaseStore.initialize(path, hostId);
  let now = 1_800_000_000_000;
  const stores: SharedHostLeaseStore[] = [], queues: OfflineStoryQueue[] = [];
  return { dir, path, now: () => now, advance: (n: number) => { now += n; }, setTime: (n: number) => { now = n; },
    open: () => { const s = new SharedHostLeaseStore(path, hostId, () => now); stores.push(s); return s; },
    queue: (name = 'queue') => { const q = new OfflineStoryQueue(join(dir, `${name}.sqlite`), () => now); queues.push(q); return q; },
    done: () => { for (const q of queues) { try { q.close(); } catch {} } for (const s of stores) { try { s.close(); } catch {} } rmSync(dir, { recursive: true, force: true }); } };
}
function reserve(s: SharedHostLeaseStore, b = binding()) {
  const r = s.acquire(b); if (r.status !== 'RESERVED_NOT_STARTED') throw new Error('expected reservation'); return r.handle;
}
function claim(c: SharedQueueAdmission): SharedQueueTicket {
  const r = c.claimNext('node_backend'); if (r.status !== 'ADMITTED_NOT_STARTED') throw new Error('expected admission'); return r.ticket;
}

test('explicit initialization rejects existing paths and missing-ledger opens never reset a lock', () => {
  const f = fixture(); try {
    assert.throws(() => SharedHostLeaseStore.initialize(f.path, hostId));
    const missing = join(f.dir, 'missing.sqlite'); assert.throws(() => new SharedHostLeaseStore(missing, hostId)); assert.equal(existsSync(missing), false);
    assert.throws(() => SharedHostLeaseStore.initialize(':memory:', hostId));
    assert.throws(() => SharedHostLeaseStore.initialize(join(f.dir, 'bad.sqlite'), 'bad'));
  } finally { f.done(); }
});
test('two database connections exclude HOMEBASE and OFFLINE_SHIFT without provider calls', () => {
  const f = fixture(); try { const a = f.open(), b = f.open(); reserve(a); const second = b.acquire(binding('OFFLINE_SHIFT'));
    assert.equal(second.status, 'BLOCKED'); assert.equal(second.decision, 'DENY_ACTIVE_LEASE');
  } finally { f.done(); }
});
test('expired active lease survives restart and is not silently stolen', () => {
  const f = fixture(); try { reserve(f.open()); f.advance(30_001); const b = f.open();
    const r = b.acquire(binding('OFFLINE_SHIFT')); assert.equal(r.decision, 'DENY_EXPIRED_UNSETTLED'); assert.equal(r.operatorReviewRequired, true);
  } finally { f.done(); }
});
test('unacknowledged cancellation remains held across restart and cannot be released', () => {
  const f = fixture(); try { const a = f.open(); const h = a.markStopped(reserve(a), false); f.advance(60_000); const b = f.open();
    assert.equal(b.acquire(binding('OFFLINE_SHIFT')).decision, 'DENY_OPERATOR_REVIEW_HOLD'); assert.throws(() => b.release(h, 'fixture:unproven'));
  } finally { f.done(); }
});
test('confirmed stop requires explicit release before a successor may reserve', () => {
  const f = fixture(); try { const a = f.open(); const h = a.markStopped(reserve(a), true, 'fixture:provider-closed');
    assert.equal(a.acquire(binding('OFFLINE_SHIFT')).decision, 'DENY_RELEASE_REQUIRED'); a.release(h, 'fixture:controller-release');
    assert.equal(a.acquire(binding('OFFLINE_SHIFT')).status, 'RESERVED_NOT_STARTED');
  } finally { f.done(); }
});
test('wrong owner secret and substituted tenant, instance or revision cannot change state', () => {
  const f = fixture(); try { const a = f.open(), h = reserve(a);
    for (const patch of [{ownerSecret:'0'.repeat(64)}, {tenantId:'other'}, {holderInstanceId:'other'}, {revision:2}, {leaseId:'other'}]) assert.throws(() => a.renew({...h,...patch}));
    assert.equal(a.snapshot(context.tenantId).state, 'ACTIVE');
  } finally { f.done(); }
});
test('renewal changes revision and rejects stale handles, expiry and bad TTLs', () => {
  const f = fixture(); try { const a = f.open(), h = reserve(a); f.advance(1000); const next = a.renew(h, 5000);
    assert.equal(next.revision, 2); assert.throws(() => a.renew(h));
    for (const ttl of [0,-1,30_001,NaN,Infinity]) assert.throws(() => a.renew(next,ttl));
    f.advance(5000); assert.throws(() => a.renew(next));
  } finally { f.done(); }
});
test('string false, missing acknowledgment and evidence-free confirmed stops fail closed', () => {
  const f = fixture(); try { const a = f.open(), h = reserve(a);
    assert.throws(() => a.markStopped(h, 'false' as never, 'fixture:text')); assert.throws(() => a.markStopped(h, undefined as never));
    assert.throws(() => a.markStopped(h,true)); assert.throws(() => a.markStopped(h,false,'fixture:ambiguous'));
    assert.equal(a.snapshot(context.tenantId).state,'ACTIVE');
  } finally { f.done(); }
});
test('monotonic clock watermark survives reopen and invalid clock values deny operations', () => {
  const f = fixture(); try { reserve(f.open()); const original=f.now(); f.setTime(original-1); const b=f.open(); assert.throws(()=>b.acquire(binding()));
    for(const n of [NaN,Infinity,-1,Number.MAX_SAFE_INTEGER]) {f.setTime(n); assert.throws(()=>b.snapshot(context.tenantId));}
  } finally { f.done(); }
});
test('corrupt lease JSON and missing singleton are not interpreted as an idle host', () => {
  for (const mutation of ["UPDATE xiv_host_lease SET record='{',owner_digest='"+'a'.repeat(64)+"'", 'DELETE FROM xiv_host_lease']) {
    const f=fixture(); try {const db=new DatabaseSync(f.path);db.exec(mutation);db.close();assert.throws(()=>f.open());} finally {f.done();}
  }
});
test('configured host ID must match the persistent ledger',()=>{const f=fixture();try{assert.throws(()=>new SharedHostLeaseStore(f.path,'b'.repeat(32)));}finally{f.done();}});
test('snapshots redact bearer secret, model and other-tenant identity; counts remain unknown',()=>{
  const f=fixture();try{const a=f.open(),h=reserve(a);const s=a.snapshot('different-tenant');const text=JSON.stringify(s);
    assert.equal(s.state,'HELD_BY_OTHER_SCOPE'); assert.equal(text.includes(h.ownerSecret),false);assert.equal(text.includes(context.tenantId),false);
    assert.equal(text.includes(context.modelId),false);assert.equal(s.liveAgentCount,null);assert.equal(s.hostAdoptionVerified,false);
  }finally{f.done();}
});
test('persistent slot stores only a digest of the owner secret',()=>{
  const f=fixture();try{const h=reserve(f.open());const db=new DatabaseSync(f.path);const row=db.prepare('SELECT * FROM xiv_host_lease').get();db.close();
    assert.equal(JSON.stringify(row).includes(h.ownerSecret),false);assert.equal(String(row!.owner_digest).length,64);
  }finally{f.done();}
});
test('binding checks prevent one work item from borrowing another reservation',()=>{
  const f=fixture();try{const a=f.open(),h=reserve(a);assert.throws(()=>a.assertBinding(h,{...binding(),workId:'wrong'}));a.assertBinding(h,binding());}finally{f.done();}
});
test('untrusted timestamps cannot select candidate time and malformed identity is rejected',()=>{
  const f=fixture();try{const a=f.open();assert.throws(()=>a.acquire({...binding(),tenantId:'tenant\n'}));
    const h=reserve(a,{...binding(),nowMs:0} as HostLeaseBinding);assert.equal(h.revision,1);assert.equal(a.snapshot(context.tenantId).expiredUnsettled,false);
  }finally{f.done();}
});
test('two separate story databases share admission; denied work returns READY without a model call',()=>{
  const f=fixture();try{const h=f.open(),q1=f.queue('one'),q2=f.queue('two');q1.enqueue([story('one')]);q2.enqueue([story('two')]);
    const a=new SharedQueueAdmission(q1,h,context),b=new SharedQueueAdmission(q2,f.open(),{...context,holderInstanceId:'second-worker'});
    claim(a);const denied=b.claimNext('node_backend');assert.equal(denied.status,'HOST_BLOCKED');assert.equal(denied.modelCallsMade,0);
    assert.equal(q2.page(context.tenantId)[0].state,'READY');assert.equal(q2.summary(context.tenantId).leaseHeld,false);
  }finally{f.done();}
});
test('HOMEBASE reservation blocks the real story queue adapter',()=>{
  const f=fixture();try{const h=f.open();reserve(h);const q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,f.open(),context);
    assert.equal(a.claimNext('node_backend').status,'HOST_BLOCKED');assert.equal(q.summary(context.tenantId).leaseHeld,false);
  }finally{f.done();}
});
test('no eligible story leaves host unreserved and capacity fixtures never dispatch',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([{...story(),kind:'CAPACITY_FIXTURE'}]);const a=new SharedQueueAdmission(q,h,context);
    assert.equal(a.claimNext('node_backend').status,'NO_ELIGIBLE_STORY_OR_QUEUE_BUSY');assert.equal(h.snapshot(context.tenantId).held,false);
  }finally{f.done();}
});
test('plan and source revision mismatches return unstarted work without reserving host',()=>{
  for(const patch of [{masterPlanSha256:'d'.repeat(64)},{sourceRevision:'d'.repeat(40)}]){
    const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([{...story(),...patch}]);assert.throws(()=>new SharedQueueAdmission(q,h,context).claimNext('node_backend'));
      assert.equal(h.snapshot(context.tenantId).held,false);assert.equal(q.page(context.tenantId)[0].state,'READY');
    }finally{f.done();}
  }
});
test('draft settlement releases host but remains AWAITING_REVIEW, not autonomous learning',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,h,context),t=claim(a);
    const r=a.settle(t,{providerAcknowledged:true,outcome:'DRAFT',outputHash:'e'.repeat(64),evidenceRef:'fixture:complete'});
    assert.equal(r.learningPromoted,false);assert.equal(q.page(context.tenantId)[0].state,'AWAITING_REVIEW');assert.equal(h.snapshot(context.tenantId).held,false);
  }finally{f.done();}
});
test('dependent story waits for designated review in the existing queue',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story('first'),{...story('second'),dependencies:['first']}]);
    const a=new SharedQueueAdmission(q,h,context);a.settle(claim(a),{providerAcknowledged:true,outcome:'DRAFT',outputHash:'e'.repeat(64),evidenceRef:'fixture:complete'});
    assert.equal(a.claimNext('node_backend').status,'NO_ELIGIBLE_STORY_OR_QUEUE_BUSY');
    q.acceptReview(context.tenantId,'first',getEnterpriseRole('node_backend').reviewerIds[0],'fixture:review');
    assert.equal(claim(a).storyLease.storyId,'second'); // Fixture review metadata is not independent model approval.
  }finally{f.done();}
});
test('unconfirmed provider stop retains BOTH leases and rejects late retry',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,h,context),t=claim(a);
    assert.equal(a.settle(t,{providerAcknowledged:false,outcome:'FAILED'}).status,'HELD_FOR_OPERATOR');
    assert.equal(q.summary(context.tenantId).leaseHeld,true);assert.equal(h.snapshot(context.tenantId).state,'STOPPED_UNCONFIRMED');
    assert.throws(()=>a.settle(t,{providerAcknowledged:true,outcome:'FAILED',evidenceRef:'fixture:late'}));
  }finally{f.done();}
});
test('malformed settlement cannot release either lease',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,h,context),t=claim(a);
    assert.throws(()=>a.settle(t,{providerAcknowledged:'true' as never,outcome:'FAILED'}));
    assert.throws(()=>a.settle(t,{providerAcknowledged:true,outcome:'DRAFT',outputHash:'bad',evidenceRef:'fixture:bad'}));
    assert.equal(h.snapshot(context.tenantId).held,true);assert.equal(q.summary(context.tenantId).leaseHeld,true);
  }finally{f.done();}
});
test('I/O failure on host admission leaves the queue lease held for review, not falsely idle',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);h.close();assert.throws(()=>new SharedQueueAdmission(q,h,context).claimNext('node_backend'));
    assert.equal(q.summary(context.tenantId).leaseHeld,true);
  }finally{f.done();}
});
test('fault between host-stop and queue settlement leaves a blocking STOPPED_CONFIRMED record',()=>{
  const f=fixture();let q:OfflineStoryQueue|undefined;try{
    class FaultyQueue extends OfflineStoryQueue { override settle():void {throw new Error('injected storage fault');} }
    q=new FaultyQueue(join(f.dir,'faulty.sqlite'),f.now);q.enqueue([story()]);const h=f.open(),a=new SharedQueueAdmission(q,h,context),t=claim(a);
    assert.throws(()=>a.settle(t,{providerAcknowledged:true,outcome:'FAILED',evidenceRef:'fixture:closed'}));
    assert.equal(h.snapshot(context.tenantId).state,'STOPPED_CONFIRMED');assert.equal(q.summary(context.tenantId).leaseHeld,true);
    assert.equal(f.open().acquire(binding()).decision,'DENY_RELEASE_REQUIRED');
  }finally{q?.close();f.done();}
});
test('retiring unstarted work requires the exact queue owner and returns frozen story snapshots',()=>{
  const f=fixture();try{const q=f.queue();q.enqueue([story()]);const l=q.claimNext(context.tenantId,'node_backend','owner')!;
    assert.throws(()=>q.returnUnstarted({...l,token:'wrong'}));const r=q.inspectLease(l);assert.ok(Object.isFrozen(r.acceptance));q.returnUnstarted(l);
    assert.throws(()=>q.returnUnstarted(l));assert.equal(q.page(context.tenantId)[0].state,'READY');
  }finally{f.done();}
});
test('reopening both stores preserves ownership and settlement works with the existing handle',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,h,context),t=claim(a);q.close();h.close();
    const b=new SharedQueueAdmission(f.queue(),f.open(),context);b.settle(t,{providerAcknowledged:true,outcome:'FAILED',evidenceRef:'fixture:settled'});
    assert.equal(b.queue.page(context.tenantId)[0].state,'FAILED');
  }finally{f.done();}
});
test('cross-controller and mismatched work tickets are rejected',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const l=q.claimNext(context.tenantId,'node_backend',context.holderInstanceId)!;
    const handle=reserve(h,{...binding('OFFLINE_SHIFT'),workId:'wrong-work'});const a=new SharedQueueAdmission(q,h,context);
    assert.throws(()=>a.renew({storyLease:l,hostHandle:handle}));
    assert.throws(()=>a.renew({storyLease:{...l,tenantId:'other'},hostHandle:handle}));
  }finally{f.done();}
});
test('same story ID in different databases cannot borrow another queue token reservation',()=>{
  const f=fixture();try{const h=f.open(),q1=f.queue('same-one'),q2=f.queue('same-two');q1.enqueue([story()]);q2.enqueue([story()]);
    const a=new SharedQueueAdmission(q1,h,context),b=new SharedQueueAdmission(q2,h,context),t=claim(a);
    const second=q2.claimNext(context.tenantId,'node_backend',context.holderInstanceId)!;
    assert.throws(()=>b.renew({storyLease:second,hostHandle:t.hostHandle}));
  }finally{f.done();}
});
test('heartbeat renewal cannot extend the fixed story deadline forever',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();q.enqueue([story()]);const a=new SharedQueueAdmission(q,h,context);let t=claim(a);
    for(let i=0;i<23;i++){f.advance(5000);t=a.renew(t);}f.advance(5000);assert.throws(()=>a.renew(t));assert.equal(q.summary(context.tenantId).leaseHeld,true);
  }finally{f.done();}
});
test('cloud routes and invalid configured bindings cannot create an admission controller',()=>{
  const f=fixture();try{const h=f.open(),q=f.queue();
    for(const patch of [{providerId:'xai'},{modelId:'glm-5.3-flash:cloud'},{sourceCommit:'bad'},{approvedPlanSha256:'bad'},{tenantId:''}])
      assert.throws(()=>new SharedQueueAdmission(q,h,{...context,...patch} as SharedQueueContext));
  }finally{f.done();}
});

async function raceChild(path:string, lane:string) {
  const ext=process.argv[1].endsWith('.ts')?'.ts':'.js';
  const child=spawn(process.execPath,[...process.execArgv.filter(a=>a!=='--test'),join(dirname(process.argv[1]),'shared-host-race.fixture'+ext),path,hostId,lane],{stdio:['ignore','ignore','pipe','ipc']});
  let stderr='';child.stderr?.on('data',c=>{stderr+=String(c);});
  const ready=new Promise<void>((resolve,reject)=>{child.on('message',m=>{if((m as {type:string}).type==='ready')resolve();});child.on('error',reject);child.on('exit',code=>{if(code!==0)reject(new Error(`child failed: ${stderr}`));});});
  const result=new Promise<string>((resolve,reject)=>{child.on('message',m=>{if((m as {type:string}).type==='result')resolve((m as {status:string}).status);});child.on('error',reject);child.on('exit',code=>{if(code!==0)reject(new Error(`child failed: ${stderr}`));});});
  return {child,ready,result};
}
test('four independent Node processes contend for one persistent slot: exactly one wins',{timeout:15000},async()=>{
  const dir=mkdtempSync(join(tmpdir(),'xiv-host-process-test-')),path=join(dir,'host.sqlite');const children:ChildProcess[]=[];
  try{SharedHostLeaseStore.initialize(path,hostId);const racers=await Promise.all(Array.from({length:4},(_,i)=>raceChild(path,i%2?'HOMEBASE':'OFFLINE_SHIFT')));
    children.push(...racers.map(r=>r.child));await Promise.all(racers.map(r=>r.ready));for(const r of racers)r.child.send('GO');
    const results=await Promise.all(racers.map(r=>r.result));assert.equal(results.filter(r=>r==='RESERVED_NOT_STARTED').length,1);
    assert.ok(results.every(r=>['RESERVED_NOT_STARTED','BLOCKED','BLOCKED_IO'].includes(r)));
    await Promise.all(racers.map(r=>new Promise<void>(resolve=>{if(r.child.exitCode!==null)resolve();else r.child.on('exit',()=>resolve());})));
  }finally{for(const c of children)if(c.exitCode===null)c.kill();rmSync(dir,{recursive:true,force:true});}
});
