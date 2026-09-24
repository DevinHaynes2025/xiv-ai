import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAMPUS_REPOSITORY_ROOT, runCampusCycle } from './agent-campus-runner';

test('campus output root is the repository regardless of launcher working directory', () => {
  const expected = fileURLToPath(new URL('../../../../', import.meta.url));
  assert.equal(resolve(CAMPUS_REPOSITORY_ROOT), resolve(expected));
  assert.equal(resolve(CAMPUS_REPOSITORY_ROOT, 'services/ai/runtime/offline-team/agent-campus-runner.ts'), fileURLToPath(new URL('./agent-campus-runner.ts', import.meta.url)));
});

test('planning a campus cycle never fabricates a passed exercise or training result', async () => {
  const root = await mkdtemp(join(tmpdir(), 'xiv-campus-'));
  try {
    const receipt = await runCampusCycle(root);
    assert.equal(receipt.agents.length, 4);
    assert.equal(receipt.meeting.simulationOnly, true);
    assert.equal(receipt.simulationOnly, true);
    assert.equal(receipt.modelCalls, 0);
    assert.equal(receipt.trainingExecuted, false);
    assert.equal(receipt.mutatesModelWeights, false);
    assert.equal(receipt.gym.status, 'NOT_EVALUATED');
    assert.equal(receipt.gym.score, null);
    assert.equal(receipt.gym.passed, null);
    assert.deepEqual(receipt.gym.evidenceRefs, []);
    const stored = JSON.parse(await readFile(join(root, '.xiv-runtime/agent-campus-status.json'), 'utf8'));
    assert.deepEqual(stored, receipt);
  } finally {
    // Only this test's freshly allocated temporary directory may be removed.
    assert.equal(resolve(root, '..'), resolve(tmpdir()));
    await rm(root, { recursive: true, force: true });
  }
});
