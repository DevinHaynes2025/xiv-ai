import { normalizeHeartbeat } from './live-tool-heartbeats';
import { planAgenticSearch } from './agentic-search-worker';

const ollama = normalizeHeartbeat({
  toolId: 'ollama', kind: 'LOCAL', health: 'ACTIVE', checkedAt: new Date().toISOString(),
  evidenceRefs: ['local:ollama-tags'], capabilities: ['local-llm'], tenantScoped: true, topSecretAllowed: true,
});
const lovable = normalizeHeartbeat({
  toolId: 'lovable', kind: 'PLUGIN', health: 'AVAILABLE', checkedAt: new Date().toISOString(),
  evidenceRefs: ['plugin:lovable-connected'], capabilities: ['ux','full-stack'], tenantScoped: true, topSecretAllowed: true,
});

if (!ollama.topSecretAllowed) throw new Error('local Ollama should remain eligible for governed top-secret work');
if (lovable.topSecretAllowed) throw new Error('external plugin must never receive top-secret permission');

const plan = planAgenticSearch({
  missionId: 'm-44', tenantId: 'tenant-a', query: 'Find approved lessons about mobile UX and security',
  confidentiality: 'TOP_SECRET', preferredSources: ['COMPANY_BRAIN','COMMUNITY','HISTORY_GRAPH','PUBLIC_WEB'],
}, [ollama, lovable]);

if (plan.selectedTools.includes('lovable')) throw new Error('top-secret mission routed to plugin');
if (!plan.selectedTools.includes('ollama')) throw new Error('top-secret mission should retain local tool');
if (plan.selectedSources.includes('PUBLIC_WEB')) throw new Error('top-secret mission routed to public web');

console.log('12D-44 live tool heartbeat/search worker contracts: OK');
