import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { buildAgentCensus } from './agent-census';
import { runBoundedBackgroundShift, validateShiftPolicy, BACKGROUND_SHIFT_DEFAULTS as defaults, type ShiftContribution } from './bounded-background-shift';
import { parseTextReviewerResult, reviewerArgs } from './claude-text-reviewer';
const ordinary: ShiftContribution = { localStatus: 'RECEIVED', localMemo: 'Synthetic design recommendation',
  reviewerStatus: 'RECEIVED', reviewerMemo: 'Synthetic peer critique', modelIdentity: { fixture: true } };
const signal = () => new AbortController().signal;
const config = { executable: '/test/claude', modelId: 'test-model', providerLabel: 'fixture-provider', externalReviewApproved: true, policyReviewed: true, maxBudgetUsd: .25 };

test('census counts definitions, not running instances', () => {
 const c = buildAgentCensus([{ id: 'a', name: 'A', status: 'prototype' }, { id: 'b', name: 'B', status: 'future' }], [{ id: 'w', enabled: true, requiresOllama: true }]);
 assert.equal(c.coreDefinitionCount, 2); assert.equal(c.configuredEnabledSeatCount, 1); assert.equal(c.liveAgentCount, null); assert.equal(c.countsAreAdditive, false);
});
test('duplicate identities and invalid registry statuses fail', () => {
 const d = { id: 'a', name: 'A', status: 'prototype' }; assert.throws(() => buildAgentCensus([d, d], []));
 assert.throws(() => buildAgentCensus([{ ...d, status: 'running' }], []));
 assert.throws(() => buildAgentCensus([], [{ id: '', enabled: true, requiresOllama: false }]));
});
test('census snapshots do not alias input definitions', () => {
 const d = { id: 'a', name: 'A', status: 'prototype' }; const c = buildAgentCensus([d], []); d.name = 'changed'; assert.equal(c.coreDefinitions[0].name, 'A');
});
test('finite shift policy rejects unbounded work and zero-delay polling', () => {
 for (const rounds of [0, 5, NaN, Infinity, 1.2]) assert.throws(() => validateShiftPolicy({ ...defaults, rounds }));
 for (const intervalMs of [0, 100, Infinity, 3_600_001]) assert.throws(() => validateShiftPolicy({ ...defaults, intervalMs }));
});
test('sequential rounds exchange critique without promoting learning', async () => {
 let running = 0; let max = 0; const priors: (string | undefined)[] = []; let saved = 0;
 const result = await runBoundedBackgroundShift({ policy: defaults, signal: signal(),
 round: async (_, prior) => { running++; max = Math.max(max, running); priors.push(prior); await Promise.resolve(); running--; return ordinary; },
 report: async r => { saved++; assert.equal(r.learningPromoted, false); assert.equal(r.modelWeightsChanged, false); }, wait: async () => {} });
 assert.equal(max, 1); assert.equal(saved, 2); assert.deepEqual(priors, [undefined, ordinary.reviewerMemo]); assert.equal(result.lockMayBeReleased, true);
});
test('disabled external reviewer remains pending', async () => {
 const result = await runBoundedBackgroundShift({ policy: { ...defaults, rounds: 1 }, signal: signal(),
 round: async () => ({ ...ordinary, reviewerStatus: 'PENDING', reviewerMemo: undefined }), report: async () => {} });
 assert.equal(result.reports[0].status, 'AWAITING_EXTERNAL_REVIEW'); assert.equal(result.reports[0].allAgentsAligned, false);
});
test('failure stops after first attempt and retains operator lock', async () => {
 let calls = 0; const result = await runBoundedBackgroundShift({ policy: defaults, signal: signal(),
 round: async () => { calls++; return { ...ordinary, reviewerStatus: 'FAILED' }; }, report: async () => {} });
 assert.equal(calls, 1); assert.equal(result.lockMayBeReleased, false);
});
test('offline model blocks rather than falling back to cloud', async () => {
 const result = await runBoundedBackgroundShift({ policy: defaults, signal: signal(),
 round: async () => ({ localStatus: 'BLOCKED', reviewerStatus: 'PENDING', modelIdentity: {} }), report: async () => {} });
 assert.equal(result.completedReports, 1); assert.equal(result.reports[0].status, 'BLOCKED');
});
test('pre-aborted shift invokes no providers', async () => {
 const c = new AbortController(); c.abort(); let calls = 0;
 const result = await runBoundedBackgroundShift({ policy: defaults, signal: c.signal, round: async () => { calls++; return ordinary; }, report: async () => {} });
 assert.equal(calls, 0); assert.equal(result.stopped, true);
});
test('deadline stops ignored cancellation; no replacement round starts', async () => {
 let calls = 0; let received: AbortSignal | undefined;
 const result = await runBoundedBackgroundShift({ policy: { ...defaults, roundTimeoutMs: 10 }, signal: signal(),
 round: async (_, __, s) => { calls++; received = s; return await new Promise<ShiftContribution>(() => {}); }, report: async () => {} });
 assert.equal(calls, 1); assert.equal(received?.aborted, true); assert.equal(result.lockMayBeReleased, false); assert.equal(result.reports[0].contribution, null);
});
test('stop during a round rejects late output', async () => {
 const c = new AbortController(); let resolve: ((r: ShiftContribution) => void) | undefined;
 const p = runBoundedBackgroundShift({ policy: defaults, signal: c.signal,
 round: async () => new Promise<ShiftContribution>(r => { resolve = r; queueMicrotask(() => c.abort()); }), report: async () => {} });
 const result = await p; resolve?.(ordinary); assert.equal(result.reports[0].status, 'STOPPED'); assert.equal(result.reports[0].contribution, null);
});
test('failed report persistence prevents further work', async () => {
 let calls = 0; await assert.rejects(runBoundedBackgroundShift({ policy: defaults, signal: signal(), round: async () => { calls++; return ordinary; },
 report: async () => { throw new Error('disk full'); }, wait: async () => {} })); assert.equal(calls, 1);
});
test('invalid provider response is not reported as a completed review', async () => {
 const result = await runBoundedBackgroundShift({ policy: defaults, signal: signal(),
 round: async () => ({ ...ordinary, reviewerMemo: '' }), report: async () => {} }); assert.equal(result.reports[0].status, 'FAILED');
});
test('external review requires opt-in and a per-call budget', () => {
 assert.throws(() => reviewerArgs({ ...config, externalReviewApproved: false }));
 assert.throws(() => reviewerArgs({ ...config, policyReviewed: false }));
 for (const maxBudgetUsd of [0, NaN, Infinity, 1]) assert.throws(() => reviewerArgs({ ...config, maxBudgetUsd }));
 assert.throws(() => reviewerArgs({ ...config, modelId: '--unsafe' }));
});
test('review argv disables tools and preserves automatic permission checking', () => {
 const args = reviewerArgs(config); assert.equal(args[args.indexOf('--permission-mode') + 1], 'auto');
 assert.equal(args[args.indexOf('--tools') + 1], ''); assert.equal(args[args.indexOf('--disallowedTools') + 1], '*');
 assert.equal(args.includes('--bare'), false); assert.ok(args.includes('--no-session-persistence'));
 assert.equal(args.includes('--dangerously-skip-permissions'), false);
});
test('model identity remains reported/configured, not falsely attested', () => {
 const r = parseTextReviewerResult(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'Review memo',
 modelUsage: { 'glm-fixture:cloud': {} }, total_cost_usd: .01 }), config);
 assert.deepEqual(r.reportedModels, ['glm-fixture:cloud']); assert.equal(r.providerLabel, 'fixture-provider'); assert.match(r.identityAssurance, /NOT_ATTESTATION/);
});
test('failed, empty and oversized Claude output rejected', () => {
 for (const value of [{ type: 'result', subtype: 'success', is_error: true, result: 'no' },
 { type: 'result', subtype: 'success', is_error: false, result: '' }, { result: 'untyped' }]) assert.throws(() => parseTextReviewerResult(JSON.stringify(value), config));
 assert.throws(() => parseTextReviewerResult('x'.repeat(65_537), config));
});
