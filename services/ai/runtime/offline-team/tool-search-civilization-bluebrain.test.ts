import assert from 'node:assert/strict';
import { buildDefaultToolRegistry, canRouteToTool } from './ai-tool-api-registry';
import { planAgenticSearch } from './agentic-search-engine';
import { createCivilizationNode } from './civilization-knowledge-graph';
import { createAtomicPipelineCell, buildScaleReceipt } from './blue-brain-data-pipeline';
import { createVirtualWorldRoom } from './virtual-community-world';

const tools = buildDefaultToolRegistry();
assert(tools.some(t => t.id === 'lovable'));
assert.equal(canRouteToTool(tools.find(t => t.id === 'github')!, 'TOP_SECRET'), false);
assert.equal(canRouteToTool(tools.find(t => t.id === 'ollama')!, 'TOP_SECRET'), true);

const search = planAgenticSearch({ tenantId: 'xiv-demo', text: 'supplier risk', sources: ['COMPANY_BRAIN'], allowOnline: false, classification: 'CONFIDENTIAL' }, [
  { source: 'COMPANY_BRAIN', ref: 'cell:1', summary: 'Supplier variability rose', confidence: 0.88, tenantId: 'xiv-demo' },
]);
assert.equal(search.answerMode, 'LOCAL_ONLY');

const node = createCivilizationNode({ label: 'Historical innovation example', kind: 'IDEA', evidenceRefs: ['source:1'], confidence: 0.8 });
assert.equal(node.id.length, 64);

const cell = createAtomicPipelineCell({ tenantId: 'xiv-demo', content: 'approved lesson', provenanceRefs: ['meeting:1'], classification: 'INTERNAL', bytes: 0 } as any);
const receipt = buildScaleReceipt([cell], 'TRILLION_SCALE_TARGET');
assert.equal(receipt.measuredCells, 1);
assert.equal(receipt.targetTier, 'TRILLION_SCALE_TARGET');
assert.equal(receipt.quantumExecution, 'CLASSICAL');

const room = createVirtualWorldRoom({ roomId: 'innovation-1', mode: 'INNOVATION', title: 'Innovation Lab', participants: [], agentIds: ['xiv-agent-001'], visibility: 'PUBLIC', simulationOnly: true });
assert.equal(room.simulationOnly, true);

console.log('12D-43 tool registry/search/civilization/blue brain contracts: OK');
