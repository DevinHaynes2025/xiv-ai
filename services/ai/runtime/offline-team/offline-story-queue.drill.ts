import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {OfflineStoryQueue,type OfflineStory} from './offline-story-queue';
/**
 * 12D-103 operational drill: proves the queue LEDGER can be OPERATED at the 2M-row policy
 * ceiling — claim, renew, settle, review, page, void, summary — with real latency numbers
 * and hard invariant checks. SYNTHETIC capacity rows only: never contacts a model, never
 * uses an existing project database, and creates ZERO real user stories.
 */
const args=process.argv.slice(2);
const argOf=(name:string,def:string)=>{const raw=args.find(a=>a.startsWith(`--${name}=`));return raw?raw.slice(name.length+3):def;};
const capacityRows=Number(argOf('rows','2000000'));
const drillStories=Number(argOf('stories','1000'));
if(!Number.isSafeInteger(capacityRows)||capacityRows<1||capacityRows>2_000_001)throw new Error('rows must be 1..2000001');
if(!Number.isSafeInteger(drillStories)||drillStories<1||drillStories>10_000)throw new Error('stories must be 1..10000');
const dir=mkdtempSync(join(tmpdir(),'xiv-operational-drill-')),path=join(dir,'drill.sqlite');
const anomalies:string[]=[];
const stats={values:[] as number[],add:(ms:number)=>{stats.values.push(ms);},summary:()=>{
 const v=[...stats.values].sort((a,b)=>a-b);const pct=(p:number)=>Number(v[Math.min(v.length-1,Math.floor(p*v.length))].toFixed(3));
 return {count:v.length,minMs:Number(v[0].toFixed(3)),medianMs:pct(0.5),p95Ms:pct(0.95),maxMs:Number(v[v.length-1].toFixed(3))};}};
let q:OfflineStoryQueue|undefined;
try{
 q=new OfflineStoryQueue(path);
 const fixtureStory=(i:number):OfflineStory=>({id:`fixture-${i}`,tenantId:'capacity-test-only',roleId:'load_test',
  objective:`SYNTHETIC CAPACITY FIXTURE ${i}; not an approved product requirement`,
  acceptance:['Benchmark row is stored and paged; no implementation or model execution'],dependencies:[],
  sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'CAPACITY_FIXTURE'});
 const drillStory=(i:number):OfflineStory=>({id:`drill-story-${i}`,tenantId:'drill-tenant',roleId:'load_test',
  objective:`SYNTHETIC OPERATIONAL DRILL ${i}; exercises claim/renew/settle/review only`,
  acceptance:['Ledger cycle completes without invariant violation'],dependencies:[],
  sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'PRODUCT_STORY'});
 // Phase 1: capacity rows, budgeted inside the policy ceiling (maxRows is TOTAL rows):
 // capacity fill + M cycle stories + 1 dedicated operator-void probe story = capacityRows.
 const capacityFill=capacityRows-drillStories-1;
 if(capacityFill<1)throw new Error('rows must exceed stories+1');
 const insertStart=performance.now();
 for(let first=1;first<=capacityFill;first+=1000){
  const batch:OfflineStory[]=[];for(let i=first;i<=Math.min(capacityFill,first+999);i++)batch.push(fixtureStory(i));
  q.enqueue(batch);
 }
 const capacityInsertMs=performance.now()-insertStart;
 // Phase 2: claimable product stories for the operational loop.
 const drillInsertStart=performance.now();
 for(let first=1;first<=drillStories;first+=1000){
  const batch:OfflineStory[]=[];for(let i=first;i<=Math.min(drillStories,first+999);i++)batch.push(drillStory(i));
  q.enqueue(batch);
 }
 const drillInsertMs=performance.now()-drillInsertStart;
 // Phase 3: full ledger cycle per story — claim, renew, settle, review — timed end to end.
 const claimMs:number[]=[],renewMs:number[]=[],settleMs:number[]=[],reviewMs:number[]=[];
 const cycleStart=performance.now();
 for(let i=1;i<=drillStories;i++){
  let t=performance.now();
  const lease=q.claimNext('drill-tenant','load_test','drill-worker',120_000);
  if(!lease){anomalies.push(`claim ${i} returned null while a READY product story existed`);break;}
  claimMs.push(performance.now()-t);
  t=performance.now();
  const renewed=q.renewLease(lease,300_000);
  if(!renewed.extended||renewed.extensionExhausted)anomalies.push(`renew ${i} extended=${renewed.extended} exhausted=${renewed.extensionExhausted}`);
  renewMs.push(performance.now()-t);
  t=performance.now();
  const outputHash='f'.repeat(64); // Synthetic settled output; no model was invoked.
  q.settle(renewed.lease,{outcome:'DRAFT',outputHash,providerSettled:true});
  settleMs.push(performance.now()-t);
  t=performance.now();
  try{
   q.applyReviewDecision({tenantId:lease.tenantId,storyId:lease.storyId,reviewerId:'secure_code_reviewer',
    expectedOutputHash:outputHash,decision:'APPROVED',reviewRef:`drill:review-${i}`});
  }catch(error){
   const s=q.inspectStory(lease.tenantId,lease.storyId);
   anomalies.push(`review ${i} (${lease.storyId}) failed: ${(error as Error).message}; state=${s?.state} hash=${s?.outputHash?.slice(0,8)} leaseHeld=${q.inspectHeldLease()!==null}`);
  }
  reviewMs.push(performance.now()-t);
 }
 const cycleTotalMs=performance.now()-cycleStart;
 // Phase 4: read surfaces at depth.
 const pageMs:number[]=[];
 for(let n=0;n<100;n++){const at=Math.floor(Math.random()*capacityRows);
  const t=performance.now();q.page('capacity-test-only',at,100);pageMs.push(performance.now()-t);}
 const pageStats={count:100,minMs:Number(Math.min(...pageMs).toFixed(3)),medianMs:Number([...pageMs].sort((a,b)=>a-b)[50].toFixed(3)),
  maxMs:Number(Math.max(...pageMs).toFixed(3))};
 const summaryStart=performance.now();const summary=q.summary('capacity-test-only');const summaryMs=performance.now()-summaryStart;
 // Phase 5: invariant checks.
 const drillSummary=q.summary('drill-tenant');
 const doneRows=drillSummary.counts.find(c=>String(c.state)==='DONE');
 if(Number(doneRows?.count??0)!==drillStories)anomalies.push(`DONE count ${doneRows?.count} != ${drillStories}`);
 if(drillSummary.leaseHeld)anomalies.push('lease still held after the drill cycle');
 if(summary.leaseHeld)anomalies.push('capacity tenant reports a phantom lease');
 // Operator recovery surface on a live held lease: claim one, void it to READY, re-claim.
 q.enqueue([drillStory(drillStories+1)]); // Dedicated probe story, budgeted into the ceiling above.
 const voidLease=q.claimNext('drill-tenant','load_test','drill-worker',120_000);
 if(!voidLease)anomalies.push('operator-void probe claim returned null');
 else{const held=q.inspectHeldLease();if(!held||held.token!==voidLease.token)anomalies.push('inspectHeldLease mismatch during void probe');
  q.voidLease(held!,'READY','drill:operator-void-probe');
  const reclaimed=q.claimNext('drill-tenant','load_test','drill-worker',120_000);
  if(!reclaimed)anomalies.push('re-claim after operator void returned null');
  else q.voidLease(q.inspectHeldLease()!,'FAILED','drill:operator-retire-probe');}
 q.close();q=undefined;
 const pct=(v:number[])=>{const s=[...v].sort((a,b)=>a-b);return{minMs:Number(s[0].toFixed(3)),medianMs:Number(s[Math.floor(s.length/2)].toFixed(3)),p95Ms:Number(s[Math.floor(s.length*0.95)].toFixed(3)),maxMs:Number(s[s.length-1].toFixed(3))};};
 console.log(JSON.stringify({kind:'SYNTHETIC_OPERATIONAL_DRILL',node:process.version,platform:process.platform,
  requestedCapacityRows:capacityRows,drillStories,productStoriesCreated:0,realUserStories:0,modelCalls:0,remoteCalls:0,
  timing:{requestedCapacityRows:capacityRows,capacityFillRows:capacityFill,drillStories,
   capacityInsertMs:Math.round(capacityInsertMs),drillInsertMs:Math.round(drillInsertMs),cycleTotalMs:Math.round(cycleTotalMs),
   claim:pct(claimMs),renew:pct(renewMs),settle:pct(settleMs),review:pct(reviewMs),deepPage:pageStats,summaryMs:Number(summaryMs.toFixed(3))},
  anomalies,dbBytes:statSync(path).size,processRssMiB:Number((process.memoryUsage().rss/1024/1024).toFixed(1)),
  capacityRowsAreUserStories:false,millionUsersProven:false,liveAgentsProven:false,automaticRecovery:false,
  humanDecision:'REQUIRED',learningPromoted:false,createdAt:new Date().toISOString()},null,2));
}finally{q?.close();rmSync(dir,{recursive:true,force:true});}