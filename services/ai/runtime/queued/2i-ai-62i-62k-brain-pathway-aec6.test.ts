import assert from 'node:assert/strict';
import {
  PATHWAY_CURRENT,
  PATHWAY_CREATES_AUTHORITY,
  PATHWAY_ID,
  PATHWAY_LIVE,
  PATHWAY_NEXT,
  PATHWAY_QUALITY,
  PATHWAY_STORY_IDS,
  denyCrossTenantPathwayLink,
  denyPathwayCreatesAgents,
  denyPathwayCreatesEnterpriseAccess,
  denyUnverifiedToVerifiedPromotion,
  openQueuedArchitecturePathway,
  pathwayIsImplemented,
} from './2i-ai-62i-62k-brain-pathway-aec6';

assert.equal(PATHWAY_ID, 'xiv-brain-pathway:2I-AI-62I-62J-62K');
assert.equal(PATHWAY_LIVE, false);
assert.equal(PATHWAY_CREATES_AUTHORITY, false);
assert.equal(PATHWAY_QUALITY, 'UNVERIFIED');
assert.equal(PATHWAY_CURRENT, '2I-AI-62K');
assert.equal(PATHWAY_NEXT, '2I-AI-62L');
assert.equal(pathwayIsImplemented(), false);

const pathway = openQueuedArchitecturePathway();
assert.equal(pathway.productionLive, false);
assert.equal(pathway.createsAuthority, false);
assert.equal(pathway.l4Enabled, false);
assert.equal(pathway.current, '2I-AI-62K');
assert.equal(pathway.next, '2I-AI-62L');
assert.equal(pathway.brain.l4Enabled, false);
assert.equal(pathway.brain.personalAutoToCompany, false);
assert.equal(pathway.brain.companyAutoToGlobal, false);
assert.equal(pathway.brain.privateAutoToPublic, false);

assert.deepEqual(
  pathway.nodes.map((node) => node.nodeId),
  PATHWAY_STORY_IDS.map((id) => `queue:${id}`),
);

for (const node of pathway.nodes) {
  assert.equal(node.kind, 'ResearchNode');
  assert.equal(node.lane, 'COMPANY');
  assert.equal(node.quality, 'UNVERIFIED');
  assert.equal(node.confidence, 0);
  assert.equal(node.freshness, 'UNKNOWN');
  assert.ok(node.quality !== 'VERIFIED');
}

assert.equal(pathway.edges.length, PATHWAY_STORY_IDS.length - 1);
for (const edge of pathway.edges) {
  assert.equal(edge.relation, 'REFERENCES');
  assert.equal(edge.fromLane, 'COMPANY');
  assert.equal(edge.toLane, 'COMPANY');
}

assert.equal(pathway.edges[0]?.fromNodeId, 'queue:2I-AI-62H');
assert.equal(pathway.edges[0]?.toNodeId, 'queue:2I-AI-62I');
assert.equal(pathway.edges[1]?.fromNodeId, 'queue:2I-AI-62I');
assert.equal(pathway.edges[1]?.toNodeId, 'queue:2I-AI-62J');
assert.equal(pathway.edges[2]?.fromNodeId, 'queue:2I-AI-62J');
assert.equal(pathway.edges[2]?.toNodeId, 'queue:2I-AI-62K');
assert.equal(pathway.edges[3]?.fromNodeId, 'queue:2I-AI-62K');
assert.equal(pathway.edges[3]?.toNodeId, 'queue:2I-AI-62L');

assert.equal(denyCrossTenantPathwayLink().allowed, false);
assert.equal(denyUnverifiedToVerifiedPromotion().allowed, false);
assert.equal(denyPathwayCreatesEnterpriseAccess().allowed, false);
assert.equal(denyPathwayCreatesAgents().allowed, false);

console.log('2I-AI-62I→62J→62K neural pathway brain upload holds (QUEUED, not live).');
