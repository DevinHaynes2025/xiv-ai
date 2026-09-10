import { buildBrainHealthReceipt } from './offline-brain-health';
import { validateMemoryShard, validatePathway } from './encrypted-memory-nervous-system';
import { createSimulationScaleManifest } from './simulation-scale-manifest';

const receipt = buildBrainHealthReceipt([
  { component: 'OLLAMA', state: 'HEALTHY', checkedAt: new Date().toISOString(), evidenceRefs: ['receipt:ollama'] },
  { component: 'GPU', state: 'UNVERIFIED', checkedAt: new Date().toISOString(), evidenceRefs: [] },
]);
if (receipt.overall !== 'UNVERIFIED') throw new Error('worst-state aggregation failed');
if (receipt.verifiedCount !== 1) throw new Error('verified count failed');

const shard = validateMemoryShard({ shardId:'s1', tenantId:'t1', userId:'u1', classification:'CONFIDENTIAL', contentHash:'sha256:abc', encrypted:true, evidenceRefs:['e1'], pathwayRefs:[], cloudSyncAllowed:false });
if (!shard.encrypted) throw new Error('encrypted shard expected');

let blocked = false;
try { validateMemoryShard({ shardId:'s2', tenantId:'t1', userId:'u1', classification:'TOP_SECRET', contentHash:'sha256:def', encrypted:true, evidenceRefs:['e2'], pathwayRefs:[], cloudSyncAllowed:true }); } catch { blocked = true; }
if (!blocked) throw new Error('TOP_SECRET cloud sync must be denied');

validatePathway({ pathwayId:'p1', tenantId:'t1', fromShardId:'s1', toShardId:'s3', relation:'SUPPORTS', confidence:0.8, evidenceRefs:['e3'] });
const sim = createSimulationScaleManifest(42n);
if (sim.logicalTargetCells !== 1_000_000_000_000n) throw new Error('trillion-scale target missing');
if (sim.measuredCells !== 42n) throw new Error('measured cells mismatch');

console.log('12D-56 offline brain health/memory nervous system contracts: OK');
