import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  listExternalTools, getExternalTool, advanceStage, recordIntegrationEvidence, externalToolSnapshot,
  EXTERNAL_TOOL_GUARDRAILS, EXTERNAL_TOOL_POLICY,
  type ExternalToolId,
} from './external-tool-registry';

test('all six CEO-named tools are registered at NOT_STARTED with honest posture', () => {
  const tools = listExternalTools();
  assert.deepEqual(tools.map(t => t.toolId), ['EXPO', 'LOVABLE', 'AMD_TOOLCHAIN', 'OPENAI_CHATGPT', 'GROK_XAI', 'OLLAMA']);
  for (const t of tools) {
    assert.equal(t.stage, 'NOT_STARTED');
    assert.deepEqual(t.evidenceRefs, []);
    assert.ok(t.requiredAgreementKinds.length > 0, 'every tool must name its required agreements');
  }
  assert.equal(getExternalTool('EXPO').publicSurface.includes('expo.dev'), true);
  assert.equal(getExternalTool('AMD_TOOLCHAIN').publicSurface.includes('ROCm'), true);
  assert.equal(getExternalTool('OLLAMA').localEndpointNote!.includes('127.0.0.1:11434'), true);
  const snap = externalToolSnapshot();
  assert.equal(snap.liveIntegrationsEstablished, false);
  assert.equal(snap.remoteCallsPerformed, 0);
  assert.equal(snap.modelCalls, 0);
  assert.equal(snap.humanDecision, 'REQUIRED');
  assert.equal(snap.learningPromoted, false);
  assert.equal(snap.toolsTenantedAtNotStarted, 6);
});

test('stage advancement requires a receipt, never regresses, and LIVE is unreachable', () => {
  assert.throws(() => advanceStage('EXPO', 'AGREEMENT_PENDING', ''), /evidence receipt required/);
  const advanced = advanceStage('EXPO', 'AGREEMENT_PENDING', 'receipt:expo:vendor-terms-draft-1');
  assert.equal(advanced.stage, 'AGREEMENT_PENDING');
  assert.deepEqual([...advanced.evidenceRefs], ['receipt:expo:vendor-terms-draft-1']);
  assert.throws(() => advanceStage('EXPO', 'NOT_STARTED', 'receipt:x'), /regression/);
  assert.throws(() => advanceStage('EXPO', 'AGREEMENT_PENDING', 'receipt:x'), /regression/);
  assert.throws(() => advanceStage('OPENAI_CHATGPT', 'LIVE', 'receipt:whatever'), /unreachable/);
  assert.throws(() => advanceStage('OLLAMA', 'LIVE', 'receipt:whatever'), /unreachable/);
  // Even the highest reachable stage never implies a live integration.
  const top = advanceStage('LOVABLE', 'SANDBOX_PILOT_APPROVED', 'receipt:lovable:pilot-1');
  assert.equal(top.stage, 'SANDBOX_PILOT_APPROVED');
  assert.equal(externalToolSnapshot().liveIntegrationsEstablished, false);
});

test('unknown tools are rejected (fail closed)', () => {
  assert.throws(() => getExternalTool('VERCEL' as never), /unknown external tool/);
  assert.throws(() => advanceStage('CURSOR' as never, 'AGREEMENT_PENDING', 'receipt:x'), /unknown external tool/);
});

test('oversized refs are rejected and the per-tool evidence ceiling holds', () => {
  assert.throws(() => advanceStage('AMD_TOOLCHAIN', 'AGREEMENT_PENDING', 'x'.repeat(EXTERNAL_TOOL_POLICY.maxRefChars + 1)), /evidence receipt required/);
  assert.throws(() => recordIntegrationEvidence('AMD_TOOLCHAIN', 'x'.repeat(EXTERNAL_TOOL_POLICY.maxRefChars + 1)), /bounded evidence ref required/);
  let t = recordIntegrationEvidence('GROK_XAI', 'research:grok:1');
  for (let i = 2; i <= EXTERNAL_TOOL_POLICY.maxEvidenceRefsPerTool; i++) {
    t = recordIntegrationEvidence('GROK_XAI', `research:grok:${i}`);
  }
  assert.equal(t.stage, 'NOT_STARTED', 'evidence recording alone never advances a stage');
  assert.equal(t.evidenceRefs.length, EXTERNAL_TOOL_POLICY.maxEvidenceRefsPerTool);
  assert.throws(() => recordIntegrationEvidence('GROK_XAI', 'research:grok:overflow'), /evidence ceiling/);
  assert.throws(() => recordIntegrationEvidence('CURSOR' as never, 'research:x'), /unknown external tool/);
});

test('policy and guardrails are frozen and assert the honest posture', () => {
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.remoteCallsAllowed, false);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.modelCallsAllowed, 0);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.noOAuthPerformed, true);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.noEndpointsContactedIncludingLocal, true);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.localEndpointNoteIsIntentOnly, true);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.liveStageUnreachableFromThisModule, true);
  assert.equal(EXTERNAL_TOOL_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.throws(() => { (EXTERNAL_TOOL_GUARDRAILS as Record<string, unknown>).remoteCallsAllowed = true; }, TypeError);
  assert.throws(() => { (EXTERNAL_TOOL_POLICY as Record<string, unknown>).maxRefChars = 1; }, TypeError);
});

test('the registry records governance posture, never credentials or endpoints contacted', () => {
  const chatgpt = getExternalTool('OPENAI_CHATGPT');
  assert.deepEqual([...chatgpt.requiredAgreementKinds], ['PROVIDER_TERMS', 'API_KEY_AGREEMENT']);
  assert.equal(chatgpt.localEndpointNote, null);
  for (const t of listExternalTools()) {
    assert.ok(typeof t.publicSurface === 'string' && t.publicSurface.length > 0);
    assert.ok(!/api[_-]?key|bearer|token/i.test(t.publicSurface), 'publicSurface must stay a label, not a credential');
  }
});

test('snapshot stays honest even after maximum in-module advancement', () => {
  advanceStage('AMD_TOOLCHAIN', 'AGREEMENT_PENDING', 'receipt:amd:license-1');
  advanceStage('AMD_TOOLCHAIN', 'INTEGRATION_RESEARCH', 'receipt:amd:research-1');
  advanceStage('AMD_TOOLCHAIN', 'SANDBOX_PILOT_APPROVED', 'receipt:amd:pilot-1');
  const snap = externalToolSnapshot();
  assert.equal(snap.liveIntegrationsEstablished, false);
  assert.equal(snap.remoteCallsPerformed, 0);
  assert.equal(snap.realEntitiesCreated, 0);
  assert.equal(snap.toolsTenantedAtNotStarted, 3);
  assert.deepEqual(snap.tools.filter(t => t.stage === 'NOT_STARTED').map(t => t.toolId), ['OPENAI_CHATGPT', 'GROK_XAI', 'OLLAMA']);
  const grok = snap.tools.find(t => t.toolId === 'GROK_XAI')!;
  assert.equal(grok.evidenceRefs.length, EXTERNAL_TOOL_POLICY.maxEvidenceRefsPerTool, 'a full evidence trail still does not advance a stage');
  assert.equal(snap.guardrails, EXTERNAL_TOOL_GUARDRAILS);
});