// 12D-91 — agentic brain alignment control-plane contracts.
// 12D-291 paydown: converted from a bare tsx script (custom OK output, no
// node:test summary) to a REAL node:test suite — every original scenario
// preserved (the genome and connection receipts are immutable fixture
// constants, shared as the original shared them); the suite is now
// chain-measurable.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
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

const connections = [
  { toolId: 'OLLAMA_LOCAL', status: 'VERIFIED', evidenceRef: 'receipt:ollama-local', verifiedAt: '2026-09-11T22:00:00Z', localExecution: true, remoteExecution: false, productionAuthority: false, privateDataAllowed: true },
  { toolId: 'GITLAB', status: 'VERIFIED', evidenceRef: 'receipt:gitlab', verifiedAt: '2026-09-11T22:00:00Z', localExecution: false, remoteExecution: true, productionAuthority: false, privateDataAllowed: false },
  { toolId: 'CLAUDE_CODE', status: 'VERIFIED', evidenceRef: 'receipt:claude-review', verifiedAt: '2026-09-11T22:00:00Z', localExecution: false, remoteExecution: true, productionAuthority: false, privateDataAllowed: false },
] as const;

test('12d-91 the capability genome mutates no weights and uses no demographics', () => {
  assert.equal(genome.demographicTraitsUsedForDecisioning, false);
  assert.equal(genome.biologicalGenomeClaim, false);
  assert.equal(genome.modelWeightsMutated, false);
});

test('12d-91 a TOP_SECRET agent with only local tools aligns OFFLINE_LOCAL', () => {
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
  assert.equal(localAgent.aligned, true);
  assert.equal(localAgent.executionMode, 'OFFLINE_LOCAL');
});

test('12d-91 a TOP_SECRET agent requiring a remote tool is denied', () => {
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
  assert.equal(badSecret.aligned, false);
  assert.equal(badSecret.executionMode, 'DENY');
});

test('12d-91 the parallel universe plan is a classical simulator with nothing production', () => {
  const universe = buildParallelUniversePlan({ universeId: 'universe:scenario:1', tenantId: 'tenant:xiv', purpose: 'SCENARIO_TEST' });
  assert.equal(universe.isolated, true);
  assert.equal(universe.productionMutationAllowed, false);
  assert.equal(universe.quantumHardwareVerified, false);
  assert.equal(universe.executionModel, 'CLASSICAL_SIMULATOR');
});

test('12d-91 billions-ready cannot be claimed without measured load evidence', () => {
  const scale = assessScaleReadiness({ targetUsers: 1_000_000_000, measuredConcurrentUsers: 0, measuredRequestsPerSecond: 0, loadEvidenceRefs: [] });
  assert.equal(scale.billionsReady, false, 'billions-ready cannot be claimed without measured load evidence');
});

test('12d-91 the CEO progress packet is addressed to Devin and stays evidence-based', () => {
  const localAgent = alignAgent({
    agentId: 'agent:ollama-builder:1', tenantId: 'tenant:xiv', role: 'OLLAMA_BUILDER', genome,
    requestedSecurityClass: 'TOP_SECRET', requiredToolIds: ['OLLAMA_LOCAL'], connectionReceipts: connections,
    evidenceRefs: ['receipt:alignment'], networkAvailable: true,
  });
  const badSecret = alignAgent({
    agentId: 'agent:ollama-builder:2', tenantId: 'tenant:xiv', role: 'OLLAMA_BUILDER', genome,
    requestedSecurityClass: 'TOP_SECRET', requiredToolIds: ['OLLAMA_LOCAL', 'GITLAB'], connectionReceipts: connections,
    evidenceRefs: ['receipt:alignment'], networkAvailable: true,
  });
  const scale = assessScaleReadiness({ targetUsers: 1_000_000_000, measuredConcurrentUsers: 0, measuredRequestsPerSecond: 0, loadEvidenceRefs: [] });
  const report = buildCeoProgressPacket({
    generatedAt: '2026-09-11T22:00:00Z',
    connections,
    alignments: [localAgent, badSecret],
    scale,
    cloudExecutionVerified: false,
  });
  assert.equal(report.ceo, 'Devin Xavier Haynes');
  assert.ok(report.offlineCapable && report.onlineCapable && report.hybridCapable,
    'expected local+remote capability evidence');
  assert.equal(report.quantumStatus, 'CLASSICAL_SIMULATION_ONLY');
  assert.equal(report.scale.billionsReady, false, 'CEO packet must not overclaim scale readiness');
});