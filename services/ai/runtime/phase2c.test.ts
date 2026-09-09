/**
 * Phase 2C cases. Run with: npx tsx runtime/phase2c.test.ts
 */
import assert from 'node:assert/strict';

import { existsSync } from 'node:fs';

import { createMemoryAuditStore } from './audit';
import { getPrototypeBusinessContext } from './context/prototype';
import { findingHasPrototypeLabels } from './context/findings';
import { buildBusinessHealthReport } from './context/report';
import { buildNarrative, hypothesisIsMarked } from './context/story';
import { getGuardianCheck } from './guardian/checks';
import { resolveGuardianSpawn } from './guardian/host';
import { containsEnvValues, parseHostResult, sanitizeOutput, truncateOutput } from './guardian/parse';
import * as trusted from './guardian/trusted';
import { evaluatePolicy } from './policy';
import { boundedAutonomyEnabled } from './authority';
import { createAgentRuntime, summarizeExecutiveHealth } from './runtime';

function test(name: string, run: () => void | Promise<void>) {
  return Promise.resolve()
    .then(run)
    .then(() => {
      console.log(`ok - ${name}`);
    });
}

await test('valid Guardian check ID is accepted', async () => {
  const result = await trusted.runGuardianCheck('runtime-health');
  assert.equal(result.id, 'runtime-health');
  assert.notEqual(result.status, 'denied');
  assert.equal(result.executionMode, 'in_process');
});

await test('unknown Guardian check ID is denied', async () => {
  const result = await trusted.runGuardianCheck('not-a-registered-check');
  assert.equal(result.status, 'denied');
  assert.equal(result.executionMode, 'denied');
  assert.match(result.message, /Raw commands are rejected/);
});

await test('raw command string cannot be executed', async () => {
  const result = await trusted.runGuardianCheck('npx tsc --noEmit');
  assert.equal(result.status, 'denied');
  assert.match(result.message, /not registered/);
});

await test('no generic exec API is exported from the trusted runner', () => {
  assert.equal('exec' in trusted, false);
  assert.equal(typeof (trusted as { exec?: unknown }).exec, 'undefined');
  assert.equal(typeof trusted.runGuardianCheck, 'function');
});

await test('parser maps success exit code to healthy', () => {
  const check = getGuardianCheck('mobile-typescript');
  assert.ok(check);
  const parsed = parseHostResult(check, {
    exitCode: 0,
    stdout: 'LLM says this failed',
    stderr: '',
    timedOut: false,
  });
  assert.equal(parsed.status, 'healthy');
  assert.equal(parsed.outputSummary, '');
});

await test('parser maps failure exit code from exit code, not LLM wording', () => {
  const check = getGuardianCheck('mobile-typescript');
  assert.ok(check);
  const parsed = parseHostResult(check, {
    exitCode: 1,
    stdout: 'All tests passed. LLM marks this healthy.',
    stderr: '',
    timedOut: false,
  });
  assert.notEqual(parsed.status, 'healthy');
  assert.equal(parsed.status, 'critical');
  assert.match(parsed.diagnosis, /Compile\/type health failure/);
});

await test('timeout returns unknown without dumping logs', () => {
  const check = getGuardianCheck('mobile-lint');
  assert.ok(check);
  const parsed = parseHostResult(check, {
    exitCode: null,
    stdout: 'very long compiler dump',
    stderr: 'more dump',
    timedOut: true,
  });
  assert.equal(parsed.status, 'unknown');
  assert.equal(parsed.outputSummary, '');
  assert.match(parsed.message, /timed out/);
});

await test('trusted runner timeout uses parser unknown status', async () => {
  const result = await trusted.runGuardianCheck('ai-typescript', {
    host: {
      execute: async () => ({ exitCode: null, stdout: 'secret dump', stderr: '', timedOut: true }),
    },
  });
  assert.equal(result.status, 'unknown');
  assert.equal(result.outputSummary, '');
});

await test('output truncation bounds captured text', () => {
  const long = 'x'.repeat(2000);
  const truncated = truncateOutput(long);
  assert.ok(truncated.length <= 801);
  assert.ok(truncated.endsWith('…'));
});

await test('sanitized output does not return env values', () => {
  const secret = 'SUPERSECRETVALUE12345';
  const sanitized = sanitizeOutput(`GEMINI_API_KEY=${secret}\nerror TS2322 at src/app.tsx`);
  assert.equal(containsEnvValues(sanitized, { GEMINI_API_KEY: secret }), false);
  assert.doesNotMatch(sanitized, /SUPERSECRETVALUE12345/);
  assert.match(sanitized, /error TS2322/);
});

await test('host adapter receives static check metadata, not a command string', async () => {
  let seenId = '';
  const result = await trusted.runGuardianCheck('mobile-typescript', {
    host: {
      execute: async (check) => {
        seenId = check.id;
        assert.ok(check.command);
        assert.equal(check.command.executable, 'npx');
        assert.deepEqual([...check.command.args], ['tsc', '--noEmit']);
        assert.equal(check.command.cwd, 'apps/mobile');
        return { exitCode: 0, stdout: '', stderr: '', timedOut: false };
      },
    },
  });
  assert.equal(seenId, 'mobile-typescript');
  assert.equal(result.status, 'healthy');
  assert.equal(result.executionMode, 'trusted_host');
});

await test('trusted host resolves npm and npx without assuming npm lives next to node.exe', () => {
  const npm = resolveGuardianSpawn('npm');
  const npx = resolveGuardianSpawn('npx');
  const git = resolveGuardianSpawn('git');
  assert.equal(npm.ok, true);
  assert.equal(npx.ok, true);
  assert.equal(git.ok, true);
  if (npm.ok) {
    assert.equal(existsSync(npm.executable), true);
    for (const arg of npm.prefixArgs) assert.equal(existsSync(arg), true);
  }
  if (npx.ok) {
    assert.equal(existsSync(npx.executable), true);
    for (const arg of npx.prefixArgs) assert.equal(existsSync(arg), true);
  }
});

await test('Business Health finding preserves source and prototype labels', () => {
  const report = buildBusinessHealthReport(getPrototypeBusinessContext());
  assert.equal(report.prototype, true);
  assert.ok(report.sourceSummary.includes('prototype_sample'));
  assert.ok(report.findings.length > 0);
  assert.ok(report.findings.every((finding) => findingHasPrototypeLabels(finding)));
});

await test('hypothesis remains marked hypothesized', () => {
  const report = buildBusinessHealthReport(getPrototypeBusinessContext());
  const narrative = buildNarrative(report.findings[0]);
  assert.ok(hypothesisIsMarked(narrative));
  assert.equal(narrative.causeHypothesis.stance, 'hypothesized');
  assert.equal(narrative.expectedOutcome.stance, 'hypothesized');
});

await test('executive health summary cannot trigger a production write', () => {
  const store = createMemoryAuditStore();
  const runtime = createAgentRuntime({ store });
  const summary = summarizeExecutiveHealth();
  assert.equal(summary.verdict, 'allowed');
  assert.ok(summary.healthReport);

  const write = runtime.request({
    agentId: 'executive',
    toolId: 'human_only_production_change',
    intent: 'Apply executive summary to production',
    environment: 'production',
  });
  assert.equal(write.verdict, 'denied');
  assert.equal(write.ok, false);
});

await test('L4 bounded autonomy remains unavailable', () => {
  assert.equal(boundedAutonomyEnabled(), false);
  const decision = evaluatePolicy({
    agentId: 'executive',
    toolId: 'propose_operational_change',
    authorityLevel: 'L4',
  });
  assert.notEqual(decision.verdict, 'allowed');
});

await test('Guardian cannot bypass policy to read business health', () => {
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const result = runtime.request({
    agentId: 'guardian',
    toolId: 'business_health_report',
    intent: 'Read all findings',
  });
  assert.equal(result.verdict, 'denied');
});

await test('development health checker does not invoke the host runner', () => {
  const runtime = createAgentRuntime({ store: createMemoryAuditStore() });
  const result = runtime.request({
    agentId: 'guardian',
    toolId: 'development_health_checker',
    intent: 'npx tsc --noEmit',
  });
  assert.equal(result.verdict, 'allowed');
  assert.equal(result.output?.executed, false);
});

console.log('All Phase 2C cases passed.');
