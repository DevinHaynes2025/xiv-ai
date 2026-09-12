import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {OfflineStoryQueue,type OfflineStory} from './offline-story-queue';
// Opt-in synthetic capacity test. Never contact a model or use an existing project database.
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--rows'||!/^\d+$/.test(args[1])) throw new Error('explicit --rows count required');
const rows=Number(args[1]);
if(!Number.isSafeInteger(rows)||rows<1||rows>1_000_001)throw new Error('rows must be 1..1000001');
const dir=mkdtempSync(join(tmpdir(),'xiv-capacity-fixture-')),path=join(dir,'test.sqlite');
let q:OfflineStoryQueue|undefined;
try{
 q=new OfflineStoryQueue(path);const start=performance.now();
 for(let first=1;first<=rows;first+=1000){
  const batch:OfflineStory[]=[];
  for(let i=first;i<=Math.min(rows,first+999);i++) batch.push({id:`fixture-${i}`,tenantId:'capacity-test-only',
   roleId:'load_test',objective:`SYNTHETIC CAPACITY FIXTURE ${i}; not an approved product requirement`,
   acceptance:['Benchmark row is stored and paged; no implementation or model execution'],dependencies:[],
   sourceRevision:'a'.repeat(40),masterPlanSha256:'b'.repeat(64),securityClass:'ORDINARY',kind:'CAPACITY_FIXTURE'});
  q.enqueue(batch);
 }
 const insertMs=performance.now()-start;q.close();q=new OfflineStoryQueue(path);
 const readStart=performance.now(),page=q.page('capacity-test-only',Math.max(0,rows-100),100),readMs=performance.now()-readStart;
 const summary=q.summary('capacity-test-only');
 const actual=summary.counts.reduce((sum,r)=>sum+Number(r.count),0);
 if(actual!==rows||page.length!==Math.min(100,rows)||q.claimNext('capacity-test-only','load_test','test')!==null)throw new Error('capacity assertion failed');
 q.close();q=undefined;
 console.log(JSON.stringify({kind:'SYNTHETIC_BACKLOG_CAPACITY_TEST',node:process.version,sqliteBackend:'node:sqlite',
  platform:process.platform,requestedRows:rows,storedRows:actual,productStoriesCreated:0,modelCalls:0,
  insertionMs:Math.round(insertMs),lastPageReadMs:Number(readMs.toFixed(3)),pageSize:page.length,
  dbBytes:statSync(path).size,processRssMiB:Number((process.memoryUsage().rss/1024/1024).toFixed(1)),
  millionUsersProven:false,liveAgentsProven:false,createdAt:new Date().toISOString()},null,2));
}finally{q?.close();rmSync(dir,{recursive:true,force:true});}
