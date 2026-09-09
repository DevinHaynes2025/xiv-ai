import assert from 'node:assert/strict';

import { proposeStructuredPatch } from './coding-agent';

const files = [{
  path: 'services/ai/local-brain/example.ts',
  action: 'modify' as const,
  unifiedDiff: [
    '--- a/services/ai/local-brain/example.ts',
    '+++ b/services/ai/local-brain/example.ts',
    '@@ -1,1 +1,2 @@',
    ' export const x = 1;',
    '+export const y = 2;',
  ].join('\n'),
}];

const accepted = proposeStructuredPatch({
  storyId: '62L-N',
  tenantId: 't1',
  universeId: 'u1',
  summary: 'Add a local example export.',
  files,
  testsExpected: ['git_diff_check'],
});
assert.equal(accepted.accepted, true);
if (accepted.accepted) {
  assert.deepEqual(accepted.proposal.shellCommands, []);
  assert.equal(accepted.proposal.productionAuthorized, false);
}

const shellDenied = proposeStructuredPatch({
  tenantId: 't1',
  universeId: 'u1',
  summary: 'Do not run shell.',
  files,
  requestedShell: ['rm -rf /'],
});
assert.equal(shellDenied.accepted, false);
assert.match(shellDenied.reason, /NO_SHELL/);

const credentialDenied = proposeStructuredPatch({
  tenantId: 't1',
  universeId: 'u1',
  summary: 'Touch credentials.',
  files: [{ path: '.env', action: 'modify', unifiedDiff: '--- a/.env\n+++ b/.env\n' }],
});
assert.equal(credentialDenied.accepted, false);

const emptyDenied = proposeStructuredPatch({
  tenantId: 't1',
  universeId: 'u1',
  summary: 'Empty.',
  files: [],
});
assert.equal(emptyDenied.accepted, false);

console.log('coding-agent.test.ts PASS');
