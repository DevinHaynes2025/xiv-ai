import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { resetAgentPopulation } from './agent-population';
import { runLocalDevelopmentCivilization } from './local-dev-civilization';
import type { WorkEnvelope } from './collaboration-protocol';
import type { AllowedLocalCommand } from './local-command-runner';

const envelope: WorkEnvelope = {
  id: 'civ-1',
  tenantId: 't1',
  universeId: 'u1',
  storyId: '62L-O',
  objective: 'Prepare a bounded local patch candidate.',
  requestedRoles: ['coder', 'tester', 'security'],
  sourceProvider: 'cursor',
  targetProviders: ['chatgpt', 'local_model'],
  evidenceRefs: ['story:62L-O'],
  classification: 'internal',
  consequence: 'LOW',
  productionAuthorized: false,
  permissionExpansionAuthorized: false,
};

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

const runner = async (input: { id: AllowedLocalCommand }) => ({
  exitCode: 0,
  stdout: input.id,
  stderr: '',
  timedOut: false,
  productionEffect: false as const,
});

const root = await mkdtemp(join(tmpdir(), 'xiv-civ-'));
try {
  resetAgentPopulation();
  const prepared = await runLocalDevelopmentCivilization({
    envelope,
    demand: {
      tenantId: 't1',
      universeId: 'u1',
      taskId: 'civ-1',
      requestedRoles: ['coder', 'tester', 'security'],
      consequence: 'LOW',
      approved: true,
    },
    observations: [
      { provider: 'chatgpt', state: 'UNAVAILABLE', evidenceRefs: [], notes: 'Not configured.' },
      { provider: 'local_model', state: 'UNAVAILABLE', evidenceRefs: [], notes: 'Not verified in this run.' },
    ],
    currentBranch: 'chatgpt/62l-local-brain-offline',
    files,
    cwd: root,
    testCommands: ['git_diff_check'],
    runner,
  });
  assert.equal(prepared.productionAuthorization, false);
  assert.equal(prepared.companyDivisionRuntimes, false);
  assert.equal(prepared.sandbox.allowed, true);
  assert.equal(prepared.taskForce.status, 'PLANNED');
  assert.equal(prepared.coding.accepted, true);
  assert.equal(prepared.testing?.passed, true);
  assert.equal(prepared.security?.passed, true);
  assert.ok(prepared.evidenceRefs.length >= 3);
  assert.equal(prepared.status, 'UNAVAILABLE');
  assert.ok(prepared.providers.every((provider) => provider.state === 'UNAVAILABLE'));

  resetAgentPopulation();
  const blockedBranch = await runLocalDevelopmentCivilization({
    envelope,
    demand: {
      tenantId: 't1',
      universeId: 'u1',
      taskId: 'civ-2',
      requestedRoles: ['coder'],
      consequence: 'LOW',
      approved: true,
    },
    observations: [],
    currentBranch: 'main',
    files,
    cwd: root,
    runner,
  });
  assert.equal(blockedBranch.status, 'BLOCKED');

  resetAgentPopulation();
  const approval = await runLocalDevelopmentCivilization({
    envelope: { ...envelope, consequence: 'HIGH' },
    demand: {
      tenantId: 't1',
      universeId: 'u1',
      taskId: 'civ-3',
      requestedRoles: ['coder'],
      consequence: 'HIGH',
      approved: true,
    },
    observations: [],
    currentBranch: 'chatgpt/62l-local-brain-offline',
    files,
    cwd: root,
    runner,
  });
  assert.equal(approval.status, 'HUMAN_APPROVAL_REQUIRED');

  console.log('local-dev-civilization.test.ts PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
