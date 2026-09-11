import { strict as assert } from 'node:assert';
import { canStartAgent } from './local-agent-runtime-supervisor';
import { scheduleWorkload } from './cpu-gpu-workload-scheduler';
import { validateLocalApiRoute } from './private-local-api-gateway';
import { decideVaultAccess } from './vault-audit-console';
import { evaluateExperiment } from './lean-six-sigma-debug-loop';
import { canRecoverToHomebase } from './xiv-homebase-recovery';

assert.equal(canStartAgent({agentId:'a1',tenantId:'t1',role:'QA',state:'IDLE',memoryNamespace:'m1',evidenceRefs:['e1']}, []), true);
assert.equal(scheduleWorkload({workloadId:'w1',tenantId:'t1',estimatedMemoryMb:512,gpuPreferred:true,consequential:false},{cpuDetected:true,gpuDetected:true,gpuVerified:false,availableMemoryMb:4096}), 'UNVERIFIED_GPU');
assert.equal(validateLocalApiRoute({routeId:'r1',tenantId:'t1',path:'/brain',classification:'TOP_SECRET',localhostOnly:true,requiredScopes:['brain.read'],humanApprovalRequired:true}), true);
assert.equal(decideVaultAccess({eventId:'v1',tenantId:'t1',actorId:'agent',role:'AGENT',vaultRef:'vault://x',classification:'TOP_SECRET',requestedAction:'READ',evidenceRefs:['e1'],humanApproved:false}), 'DENY');
assert.equal(evaluateExperiment({experimentId:'x1',tenantId:'t1',phase:'ANALYZE',hypothesis:'reduce latency',evidenceRefs:['e1'],sandboxOnly:true,approvedForPromotion:false}), 'LEARN');
assert.equal(canRecoverToHomebase({tenantId:'t1',failedExperimentId:'x1',reason:'regression',checkpoint:{checkpointId:'c1',tenantId:'t1',createdAt:new Date(0).toISOString(),stateHash:'abc',approvedLessons:[],evidenceRefs:['e1'],productionSafe:true}}), true);

console.log('12D-62 local agent supervisor/homebase recovery contracts: OK');
