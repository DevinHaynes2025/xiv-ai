import assert from 'node:assert/strict';
import { assertOfflineTeamGuardrails, buildOfflineTeamStatus, eligibleOfflineSeats } from './orchestrator';
import { decideGrokBridge, GROK_API_BASE_URL, GROK_DEFAULT_MODEL } from './grok-bridge';

assertOfflineTeamGuardrails();
assert.equal(GROK_API_BASE_URL, 'https://api.x.ai/v1');
assert.equal(GROK_DEFAULT_MODEL, 'grok-4.6');
assert.deepEqual(eligibleOfflineSeats(false).map((seat) => seat.id), ['LOCAL_RULES', 'REVIEWER', 'LEARNING_RECORDER']);
assert.equal(eligibleOfflineSeats(true).length, 4);
const status = buildOfflineTeamStatus({ ollamaReachable: true, grokConfigured: true, grokReachable: false, runningSeatIds: ['OLLAMA_BUILDER', 'LEARNING_RECORDER'], pendingStories: 12 });
assert.equal(status.enabledOfflineSeats, 4);
assert.equal(status.runningSeats, 2);
assert.equal(status.pendingStories, 12);
assert.equal(decideGrokBridge({ apiKeyPresent: false, networkAvailable: true, enabled: true, baseUrl: GROK_API_BASE_URL, model: GROK_DEFAULT_MODEL }).mode, 'WAITING_CREDENTIALS');
assert.equal(decideGrokBridge({ apiKeyPresent: true, networkAvailable: false, enabled: true, baseUrl: GROK_API_BASE_URL, model: GROK_DEFAULT_MODEL }).mode, 'WAITING_NETWORK');
const remote = decideGrokBridge({ apiKeyPresent: true, networkAvailable: true, enabled: true, baseUrl: GROK_API_BASE_URL, model: GROK_DEFAULT_MODEL });
assert.equal(remote.mode, 'REMOTE_SANDBOX');
assert.equal(remote.productionAuthority, false);
console.log('XIV 12D-19 offline team runtime contracts hold.');
