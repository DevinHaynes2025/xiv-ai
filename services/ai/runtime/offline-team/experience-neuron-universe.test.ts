import assert from 'node:assert/strict';
import { getExperienceMode } from './experience-modes';
import { validateOsRuntimeReceipt } from './cross-os-runtime';
import { createUniverseNode } from './community-universe';
import { makeNeuron, connectNeurons } from './neuron-fabric';

assert.equal(getExperienceMode('BUSINESS').offlineCapable, true);
assert.equal(getExperienceMode('WELLNESS').disallowedClaims.includes('diagnosis'), true);
assert.equal(getExperienceMode('SPIRITUAL_GUIDANCE').disallowedClaims.includes('divine-authority'), true);

const windows = validateOsRuntimeReceipt({ os: 'WINDOWS', support: 'VERIFIED', runtime: 'PowerShell + Node + Ollama', evidenceRefs: ['LOCAL:12D24_OK','LOCAL:OLLAMA_PLUS_LOCAL'] });
assert.equal(windows.support, 'VERIFIED');
assert.throws(() => validateOsRuntimeReceipt({ os: 'ANDROID', support: 'VERIFIED', runtime: 'planned', evidenceRefs: [] }));

const universe = createUniverseNode({
  universeId: 'xiv-local-universe',
  kind: 'BUSINESS_WORLD',
  dimensionIds: [1, 2, 12, 100],
  simulationOnly: true,
  memberAgentIds: ['OLLAMA_BUILDER','REVIEWER'],
  evidenceRefs: ['SIMULATION:12D28'],
});
assert.equal(universe.simulationOnly, true);
assert.equal(universe.dimensionIds.length, 4);

const a = makeNeuron({ tenantId: 'xiv-local', kind: 'DOCUMENT', payload: { title: 'offline evidence' }, evidenceRefs: ['doc:1'] });
const b = makeNeuron({ tenantId: 'xiv-local', kind: 'LESSON', payload: { lesson: 'verify before promotion' }, evidenceRefs: ['lesson:1'] });
const edges = connectNeurons([a,b],[{ from: a.neuronId, to: b.neuronId, kind: 'DERIVED_FROM', confidence: 0.9, evidenceRefs: ['edge:1'] }]);
assert.equal(edges.length, 1);
assert.throws(() => connectNeurons([a, { ...b, tenantId: 'other' }],[{ from: a.neuronId, to: b.neuronId, kind: 'ROUTES_TO', confidence: 1, evidenceRefs: [] }]));

console.log('12D-28 experience/community/cross-os/neuron contracts: OK');
