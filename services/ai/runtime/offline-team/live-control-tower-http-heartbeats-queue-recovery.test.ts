import { strict as assert } from 'node:assert';
import { controlTowerHttpPolicy } from './control-tower-http-server';
import { diskHeartbeatPolicy } from './disk-heartbeat-store';
import { recoveryReceiptPolicy } from './auto-recovery-receipt';

assert.equal(controlTowerHttpPolicy.bindHost, '127.0.0.1');
assert.equal(controlTowerHttpPolicy.externalNetworkAllowed, false);
assert.equal(controlTowerHttpPolicy.topSecretResponsesAllowed, false);
assert.equal(diskHeartbeatPolicy.activeAgentLimit, 8);
assert.equal(diskHeartbeatPolicy.topSecretPayloadAllowed, false);
assert.equal(recoveryReceiptPolicy.automaticProductionMutationAllowed, false);
assert.equal(recoveryReceiptPolicy.humanReviewAfterRetryExhaustion, true);

console.log('12D-70 live control tower/heartbeats/queue/recovery contracts: OK');
