import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {DatabaseSync} from 'node:sqlite';
import {OfflineStoryQueue,type OfflineStory} from './offline-story-queue';
/**
 * MR !117 independent validation: disposable-copy before/after benchmark for the
 * story_summary(tenant,kind,state) covering index. ONE 2M insertion on a throwaway db;
 * summary measured before, index created in place (cost measured), summary after.
 * Synthetic rows only — zero user stories, zero model calls.
 */
const dir=mkdtempSync(join(tmpdir(),'xiv-summary-bench-')),path=join(dir,'bench.sqlite');
let db:DatabaseSync|undefined;
try{
 const q=new OfflineStoryQueue(path);
 const story=(i:number):OfflineStory=>({id:`fixture-${i}`,tenantId:'capacity-test-only',roleId:'load_test',
  objective:`SYNTHETIC BENCH FIXTURE ${i}; not an approved product requirement`,
  acceptance:['Benchmark row is stored and paged; no implementation or model execution'],dependencies:[],
  sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'CAPACITY_FIXTURE'});
 const t0=performance.now();
 for(let first=1;first<=2_000_000;first+=1000){
  const batch:OfflineStory[]=[];for(let i=first;i<=Math.min(2_000_000,first+999);i++)batch.push(story(i));
  q.enqueue(batch);
 }
 const insertMs=performance.now()-t0;
 const bytesBefore=statSync(path).size;
 const rssMiB=Number((process.memoryUsage().rss/1024/1024).toFixed(1));
 const run3=():number[]=>{const out:number[]=[];for(let n=0;n<3;n++){const t=performance.now();q.summary('capacity-test-only');out.push(Number((performance.now()-t).toFixed(1)));}return out;};
 const before=run3();
 q.close();
 // Index creation in place, measured — the step MR !117 defers to a disposable-copy rollout.
 db=new DatabaseSync(path);
 const bytesPreIndex=db.prepare('SELECT page_count*page_size AS bytes FROM pragma_page_count(),pragma_page_size()').get() as {bytes:number};
 const tIdx=performance.now();
 db.exec('CREATE INDEX story_summary ON stories(tenant,kind,state)');
 const indexMs=Number((performance.now()-tIdx).toFixed(1));
 const plan=db.prepare("EXPLAIN QUERY PLAN SELECT kind,state,count(*) AS count FROM stories WHERE tenant=? GROUP BY kind,state").all('capacity-test-only') as Array<{detail:string}>;
 const usesIndex=plan.some(p=>/story_summary/i.test(p.detail));
 // After-measurement runs on the raw connection holding the new index, using the queue's
 // exact summary SQL text so before/after are the same query.
 const after:number[]=[];for(let n=0;n<3;n++){const t=performance.now();
  db.prepare('SELECT kind,state,count(*) AS count FROM stories WHERE tenant=? GROUP BY kind,state').all('capacity-test-only');
  after.push(Number((performance.now()-t).toFixed(1)));}
 const bytesAfter=statSync(path).size;
 console.log(JSON.stringify({kind:'SUMMARY_INDEX_BENCHMARK_DISPOSABLE_COPY',rows:2_000_000,insertionMs:Math.round(insertMs),
  summaryBeforeMs:before,summaryAfterMs:after,indexCreationMs:indexMs,plannerUsesIndex:usesIndex,
  plan:plan.map(p=>p.detail),dbBytesBefore:bytesBefore,dbBytesAfterIndex:bytesAfter,
  indexGrowthBytes:bytesAfter-bytesBefore,processRssMiB:rssMiB,
  modelCalls:0,realUserStories:0,humanDecision:'REQUIRED',createdAt:new Date().toISOString()},null,2));
}finally{db?.close();rmSync(dir,{recursive:true,force:true});}