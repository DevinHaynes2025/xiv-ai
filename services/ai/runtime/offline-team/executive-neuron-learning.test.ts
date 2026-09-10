import assert from 'node:assert/strict';
import { compileExecutiveLessons } from './executive-neuron-learning';
import { generateNextStories } from './next-story-generator';

const cells = compileExecutiveLessons([
  { tenantId: 'xiv', sourceRole: 'CTO', content: 'Improve Ollama runtime tests', evidenceRefs: ['meeting:1'], approved: true, approvedBy: 'CEO' },
  { tenantId: 'xiv', sourceRole: 'CISO', content: 'Strengthen tenant security', evidenceRefs: ['meeting:2'], approved: true, approvedBy: 'CEO' },
  { tenantId: 'xiv', sourceRole: 'CFO', content: 'Unapproved finance thought', evidenceRefs: ['meeting:3'], approved: false },
]);

assert.equal(cells.length, 2);
assert.ok(cells.every(c => c.cellId.startsWith('adc_')));
assert.ok(cells.every(c => c.tenantId === 'xiv'));

const stories = generateNextStories(cells, 8);
assert.ok(stories.length >= 1 && stories.length <= 8);
assert.ok(stories.every(s => s.requiresHumanReview));
assert.ok(stories.every(s => s.productionAuthority === false));

console.log('12D-37 executive neuron learning contracts: OK');
