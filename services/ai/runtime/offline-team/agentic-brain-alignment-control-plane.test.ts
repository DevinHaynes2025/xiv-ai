import {
  alignAgent,
  assessScaleReadiness,
  buildCeoProgressPacket,
  buildParallelUniversePlan,
  createCapabilityGenome,
} from './agentic-brain-alignment-control-plane';

const genome = createCapabilityGenome({
  genomeId: 'genome:ollama-builder:v1',
  agentRole: 'OLLAMA_BUILDER',
  version: 1,
  skills: ['typescript', 'reasoning', 'offline-rag'],
  reasoningStyles: ['evidence-first', 'stepwise', 'contrarian-check'],
  languages: ['en'],
  accessibilitySupports: ['plain-language-output'],
  culturalContextTags: ['user-selected-context-only'],
  permittedTools: ['OLLAMA_LOCAL', 'GITLAB'],
  permittedSecurityClasses: ['ORDINARY', 'CONFIDENTIAL', 'TOP_SECRET'],
  pathwayIds: ['pathway:local-code-review:v1'],
  evidenceRefs: ['receipt:genome-review'],
});
if (genome.demographicTraitsUsedForDecisioning || genome.biologicalGenomeClaim || genome.modelWeightsMutated) throw new Error('capability genome guardrails failed');

const connections = [
  { toolId: 'OLLAMA_LOCAL', status: 'VERIFIED', evidenceRef: 'receipt:ollama-local', verifiedAt: '2026-09-11T22:00:00Z', localExecution: true, remoteExecution: false, productionAuthority: false, privateDataAllowed: true },
  { toolId: 'GITLAB', status: 'VERIFIED', evidenceRef: 'receipt:gitlab', verifiedAt: '2026-09-11T22:00:00Z', localExecution: false, remoteExecution: true, productionAuthority: false, privateDataAllowed: false },
  { toolId: 'CLAUDE_CODE', status: 'VERIFIED', evidenceRef: 'receipt:claude-review', verifiedAt: '2026-09-11T22:00:00Z', localExecution: false, remoteExecution: true, productionAuthority: false, privateDataAllowed: false },
] as const;

const localAgent = alignAgent({
  agentId: 'agent:ollama-builder:1',
  tenantId: 'tenant:xiv',
  role: 'OLLAMA_BUILDER',
  genome,
  requestedSecurityClass: 'TOP_SECRET',
  requiredToolIds: ['OLLAMA_LOCAL'],
  connectionReceipts: connections,
  evidenceRefs: ['receipt:alignment'],
  networkAvailable: true,
});
if (!localAgent.aligned || localAgent.executionMode !== 'OFFLINE_LOCAL') throw new Error('TOP_SECRET local agent should align offline');

const badSecret = alignAgent({
  agentId: 'agent:ollama-builder:2',
  tenantId: 'tenant:xiv',
  role: 'OLLAMA_BUILDER',
  genome,
  requestedSecurityClass: 'TOP_SECRET',
  requiredToolIds: ['OLLAMA_LOCAL', 'GITLAB'],
  connectionReceipts: connections,
  evidenceRefs: ['receipt:alignment'],
  networkAvailable: true,
});
if (badSecret.aligned || badSecret.executionMode !== 'DENY') throw new Error('TOP_SECRET remote dependency must be rejected');

const universe = buildParallelUniversePlan({ universeId: 'universe:scenario:1', tenantId: 'tenant:xiv', purpose: 'SCENARIO_TEST' });
if (!universe.isolated || universe.productionMutationAllowed || universe.quantumHardwareVerified || universe.executionModel !== 'CLASSICAL_SIMULATOR') throw new Error('parallel universe safety contract failed');

const scale = assessScaleReadiness({ targetUsers: 1_000_000_000, measuredConcurrentUsers: 0, measuredRequestsPerSecond: 0, loadEvidenceRefs: [] });
if (scale.billionsReady) throw new Error('billions-ready cannot be claimed without measured load evidence');

const report = buildCeoProgressPacket({
  generatedAt: '2026-09-11T22:00:00Z',
  connections,
  alignments: [localAgent, badSecret],
  scale,
  cloudExecutionVerified: false,
});
if (report.ceo !== 'Devin Xavier Haynes') throw new Error('CEO packet recipient mismatch');
if (!report.offlineCapable || !report.onlineCapable || !report.hybridCapable) throw new Error('expected local+remote capability evidence');
if (report.quantumStatus !== 'CLASSICAL_SIMULATION_ONLY') throw new Error('quantum status must remain evidence-based');
if (report.scale.billionsReady) throw new Error('CEO packet must not overclaim scale readiness');

console.log('12D-91 agentic brain alignment contracts: OK');
