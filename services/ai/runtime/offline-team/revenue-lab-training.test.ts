import assert from 'node:assert/strict';
import { buildRevenueLabPrompt } from './cfo-ollama-revenue-lab';
import { decideRevenueCouncil } from './revenue-lab-council';
import { buildTrainingLedger } from './training-evaluation-ledger';
import { runRevenueLab } from './revenue-lab-runner';

const prompt = buildRevenueLabPrompt({ runId:'run-31', tenantId:'xiv-local', objective:'Test pricing and profitability', facts:['No signed contracts are currently proven.'], role:'CFO' });
assert.equal(prompt.model, 'qwen2.5-coder:7b');
assert.equal(prompt.productionMutationAllowed, false);

const council = decideRevenueCouncil([{ role:'CFO', response:'Test one pricing hypothesis.', confidence:0.7, evidenceRefs:['E1'], objections:[] }]);
assert.equal(council.selectedRole, 'CFO');

const ledger = buildTrainingLedger([{ evaluationId:'e1', runId:'run-31', agentRole:'CFO', skill:'finance-reasoning', score:0.8, evidenceRefs:['E1'], lesson:'Verify assumptions.', createdAt:'2026-09-10T00:00:00.000Z' }]);
assert.equal(ledger.mutatesModelWeights, false);

const run = await runRevenueLab({ runId:'run-31', tenantId:'xiv-local', objective:'Evaluate pricing', facts:['Scenario only'], generate: async (_model, promptText) => `analysis:${promptText.length}` });
assert.equal(run.positions.length, 5);
assert.equal(run.model, 'qwen2.5-coder:7b');
assert.equal(run.training.evaluations.length, 5);
assert.equal(run.outputHash.length, 64);

console.log('12D-31 CFO Ollama revenue lab/training contracts: OK');
