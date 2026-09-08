import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { MESH_AGENT_ROLES } from './agent-mesh';
import { requestAgentInstance, populationStats } from './agent-population';
import { addKnowledgeEdge, knowledgeGraphStats, upsertKnowledgeNode } from './knowledge-graph';

const root = await mkdtemp(join(tmpdir(), 'xiv-62le-'));
try {
  assert.equal(MESH_AGENT_ROLES.length, 18, 'Expected 18 logical local mesh roles.');

  await upsertKnowledgeNode({
    id: 'fact-a',
    type: 'claim',
    domain: 'business',
    label: 'Observed fact A',
    summary: 'Synthetic test fact.',
    claimState: 'VERIFIED_FACT',
    sourceRefs: ['synthetic:test'],
    confidence: 1,
    classification: 'internal',
  }, root);
  await upsertKnowledgeNode({
    id: 'fact-b',
    type: 'claim',
    domain: 'business',
    label: 'Observed fact B',
    summary: 'Synthetic contradictory test fact.',
    claimState: 'DISPUTED',
    sourceRefs: ['synthetic:test'],
    confidence: 0.5,
    classification: 'internal',
  }, root);
  await addKnowledgeEdge({ id: 'edge-1', from: 'fact-a', to: 'fact-b', type: 'CONTRADICTS', evidenceRefs: ['synthetic:test'] }, root);
  const graph = await knowledgeGraphStats(root);
  assert.equal(graph.nodes, 2);
  assert.equal(graph.edges, 1);
  assert.equal(graph.contradictions, 1);

  const agent = requestAgentInstance({ role: 'coder', taskId: 'test-task', ttlMinutes: 10 });
  assert.equal(agent.created, true);
  if (agent.created) {
    assert.equal(agent.instance.productionAuthorized, false);
    assert.equal(agent.instance.canCreateAgents, false);
    assert.equal(agent.instance.canExpandPermissions, false);
  }
  assert.ok(populationStats().active >= 1);

  console.log('62L-E safety tests PASS');
} finally {
  await rm(root, { recursive: true, force: true });
}
