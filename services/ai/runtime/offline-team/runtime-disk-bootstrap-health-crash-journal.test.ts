import { runtimeDiskPolicy } from './runtime-disk-writer';
import { recoveryPolicy } from './crash-resume-journal';
import { localHealthRoute, evaluateLocalHealth } from './local-health-endpoint';
import { receiptPolicy } from './runtime-receipt-writer';

const health = evaluateLocalHealth({
  runtimeWritable: true,
  ollamaReachable: null,
  activeAgents: 0,
  queueDepth: 0,
  checkpointFresh: false,
  gpuVerified: false,
  notes: [],
});

if (runtimeDiskPolicy.root !== '.xiv-runtime') throw new Error('runtime root mismatch');
if (runtimeDiskPolicy.productionMutationAllowed) throw new Error('production mutation must remain false');
if (recoveryPolicy.autoResumeProductionMutations) throw new Error('unsafe auto resume');
if (localHealthRoute.bind !== '127.0.0.1' || localHealthRoute.externalExposureAllowed) throw new Error('health route must remain localhost-only');
if (!receiptPolicy.healthyRequiresFreshReceipt) throw new Error('fresh receipt required');
if (health.state === 'HEALTHY') throw new Error('unverified runtime must not report healthy');

console.log('12D-68 runtime disk/bootstrap/health/crash journal contracts: OK');
