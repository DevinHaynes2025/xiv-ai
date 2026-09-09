import assert from 'node:assert/strict';

import { runTestingAgent } from './testing-agent';
import type { AllowedLocalCommand } from './local-command-runner';

const runner = async (input: { id: AllowedLocalCommand }) => ({
  exitCode: input.id === 'git_diff_check' ? 0 : 1,
  stdout: input.id,
  stderr: '',
  timedOut: false,
  productionEffect: false as const,
});

const passed = await runTestingAgent({
  cwd: process.cwd(),
  commands: ['git_diff_check'],
  runner,
});
assert.equal(passed.passed, true);
assert.equal(passed.results[0].commandId, 'git_diff_check');
assert.equal(passed.results[0].exitCode, 0);
assert.equal(passed.productionAuthorization, false);

const rejected = await runTestingAgent({
  cwd: process.cwd(),
  commands: ['curl', 'git_status'],
  runner,
});
assert.equal(rejected.passed, false);
assert.match(rejected.reason, /NOT_ALLOWLISTED/);
assert.equal(rejected.results.length, 0);

const failed = await runTestingAgent({
  cwd: process.cwd(),
  commands: ['npm_test'],
  runner,
});
assert.equal(failed.passed, false);
assert.equal(failed.results[0].exitCode, 1);

console.log('testing-agent.test.ts PASS');
