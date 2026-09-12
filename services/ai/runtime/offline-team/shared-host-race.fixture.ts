// Synthetic multi-process test helper only. Does not call a provider or initialize a ledger.
import { SharedHostLeaseStore } from './shared-host-lease-store';
const [path,hostId,lane]=process.argv.slice(2);
if(!process.send || !['HOMEBASE','OFFLINE_SHIFT'].includes(lane))throw new Error('test IPC context required');
const store=new SharedHostLeaseStore(path,hostId);
const timer=setTimeout(()=>process.exit(2),8000);
process.once('message',()=>{
  let status:string;
  try{status=store.acquire({tenantId:'race-fixture',holderInstanceId:`process-${process.pid}`,lane:lane as 'HOMEBASE'|'OFFLINE_SHIFT',
    workId:'synthetic-work',providerId:'fixture',modelId:'fixture',presenceEvidenceRef:'fixture:not-authenticated',sourceCommit:'b'.repeat(40)}).status;}
  catch{status='BLOCKED_IO';}
  store.close();clearTimeout(timer);process.send!({type:'result',status},()=>process.disconnect?.());
});
process.send({type:'ready'});
