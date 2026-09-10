import { runXivExperience } from './xiv-experience-runtime';
import { classifyFreshness } from './experience-freshness';
import { buildOllamaStoryPrompt } from './ollama-story-explanation';

const now = new Date().toISOString();
const output = runXivExperience({
  tenantId: 'tenant-a',
  formFactor: 'PHONE',
  title: 'Business Health',
  narrative: 'Supplier variability is creating fulfillment pressure.',
  signals: [
    { signalId: 's1', tenantId: 'tenant-a', metric: 'supply-chain-health', value: 78, evidenceRefs: ['evidence:1'], observedAt: now },
    { signalId: 's2', tenantId: 'tenant-a', metric: 'customer-health', value: 90, evidenceRefs: ['evidence:2'], observedAt: now },
  ],
  classification: 'CONFIDENTIAL',
  requiresHumanApproval: true,
});
if (output.healthScore !== 84) throw new Error('health score mismatch');
if (output.visual.tenantId !== 'tenant-a') throw new Error('tenant mismatch');
if (!output.visual.requiresHumanApproval) throw new Error('approval flag missing');

const freshness = classifyFreshness(now, now);
if (freshness.state !== 'LIVE') throw new Error('freshness classification failed');

const prompt = buildOllamaStoryPrompt({ tenantId: 'tenant-a', objective: 'Explain the business health change', evidenceRefs: ['evidence:1'], classification: 'CONFIDENTIAL' });
if (prompt.provider !== 'OLLAMA' || prompt.networkAllowed) throw new Error('Ollama story prompt must remain local');

console.log('12D-50 XIV experience runtime/live story dashboard contracts: OK');
