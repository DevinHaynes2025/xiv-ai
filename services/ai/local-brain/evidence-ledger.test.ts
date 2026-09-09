import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { appendEvidenceEvent, listEvidenceEvents } from './evidence-ledger';
import { loadPersistentInbox, publishPersistentAgentMessage } from './persistent-agent-bus';

const root = await mkdtemp(join(tmpdir(), 'xiv-evidence-'));
try {
  const first = await appendEvidenceEvent({
    kind: 'evidence',
    tenantId: 't1',
    universeId: 'u1',
    storyId: '62L-N',
    summary: 'Recorded a local sandbox decision.',
    payload: { exitCode: 0 },
  }, root);
  assert.equal(first.productionAuthorization, false);

  await appendEvidenceEvent({
    kind: 'communication',
    tenantId: 't1',
    universeId: 'u2',
    summary: 'Wrong universe.',
    payload: {},
  }, root);

  const scoped = await listEvidenceEvents({ tenantId: 't1', universeId: 'u1', root });
  assert.equal(scoped.length, 1);
  assert.equal(scoped[0].id, first.id);

  const message = await publishPersistentAgentMessage({
    fromRole: 'coder',
    toRole: 'tester',
    tenantId: 't1',
    universeId: 'u1',
    kind: 'evidence',
    body: 'Patch proposal ready.',
    evidenceRefs: [first.id],
    requiresHumanApproval: false,
  }, root);
  const inbox = await loadPersistentInbox({ role: 'tester', tenantId: 't1', universeId: 'u1', root });
  assert.equal(inbox.some((item) => item.id === message.id), true);
  const otherInbox = await loadPersistentInbox({ role: 'tester', tenantId: 't1', universeId: 'u2', root });
  assert.equal(otherInbox.length, 0);

  console.log('evidence-ledger.test.ts PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
