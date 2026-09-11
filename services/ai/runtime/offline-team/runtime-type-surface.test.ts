import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { buildRevenueLabPrompt, REVENUE_LAB_GUARDRAILS } from './cfo-ollama-revenue-lab';
import { validateDevicePilotEnrollment, type DevicePilotEnrollment } from './device-pilot-enrollment';
import { authorizeDevicePilotAction } from './device-pilot-policy';
import { createMeetingMessage } from './multi-agent-meeting-bus';
import { buildExecutiveDecisionPacket } from './executive-decision-packet';

// Inspect the real public symbol graph without executing the barrel's modules.
// These origin assertions protect against resolving duplicate names to the wrong contract.
const expectedOrigins: readonly (readonly [string, string])[] = [
  ['ExecutiveRole', 'executive-cabinet'],
  ['CabinetOllamaRole', 'executive-cabinet-ollama-runner'],
  ['ExecutiveDecisionPacket', 'executive-decision-packet'],
  ['buildExecutiveDecisionPacket', 'executive-decision-packet'],
  ['CabinetDecisionPacket', 'executive-cabinet-council'],
  ['buildCabinetDecisionPacket', 'executive-cabinet-council'],
  ['DataClass', 'private-data-brain'],
  ['ApiToolDataClass', 'ai-tool-api-registry'],
  ['GovernedToolDataClass', 'governed-tool-registry'],
  ['planAgenticSearch', 'agentic-search-engine'],
  ['planAgenticSearchWorker', 'agentic-search-worker'],
  ['OsFamily', 'cross-os-runtime'],
  ['DeviceOsFamily', 'universal-device-compatibility'],
  ['VisualEvidencePoint', 'visual-intelligence-engine'],
  ['DashboardEvidencePoint', 'live-visual-dashboard'],
  ['ComponentEvidencePoint', 'client-visual-component-gateway'],
  ['EnrollmentReceipt', 'elite-onboarding'],
  ['LiveEnrollmentReceipt', 'live-onboarding-runtime'],
  ['HISTORICAL_ARCHIVE_GUARDRAILS', 'historical-technology-archive'],
  ['HISTORICAL_BUSINESS_ARCHIVE_GUARDRAILS', 'historical-business-tech-archive'],
  ['AgentMeeting', 'agent-campus-meetings'],
  ['OperationsAgentMeeting', 'team-task-meeting-orchestrator'],
  ['HistoricalArchiveRecord', 'historical-business-tech-archive'],
  ['IngestedHistoricalArchiveRecord', 'historical-archive-ingestion'],
  ['PartnerState', 'industry-ecosystem-graph'],
  ['AdapterPartnerState', 'partner-adapter-atlas'],
  ['OllamaModelInfo', 'model-discovery'],
  ['OllamaBridgeModelInfo', 'ollama-live-runtime-bridge'],
  ['BrainSecurityClass', 'offline-brain-agent-council'],
  ['AlignmentBrainSecurityClass', 'agentic-brain-alignment-control-plane'],
];

test('public barrel compiles and all 30 canonical/alias origins are correct', () => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const filename = resolve(directory, 'index.ts');
  const configPath = resolve(directory, '../../tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  assert.equal(parsed.errors.length, 0);
  const program = ts.createProgram([filename], parsed.options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: path => path,
    getNewLine: () => '\n',
  }));
  const source = program.getSourceFile(filename);
  assert.ok(source);
  const checker = program.getTypeChecker();
  const module = checker.getSymbolAtLocation(source);
  assert.ok(module);
  const exports = new Map(checker.getExportsOfModule(module).map(symbol => [symbol.name, symbol]));
  for (const [name, origin] of expectedOrigins) {
    const symbol = exports.get(name);
    assert.ok(symbol, `missing public export: ${name}`);
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    const files = target.declarations?.map(declaration => basename(declaration.getSourceFile().fileName));
    assert.ok(files?.includes(`${origin}.ts`), `${name} resolved to the wrong source contract`);
  }
});

const task = { runId: 'test-run', tenantId: 'test-tenant', objective: 'Synthetic planning test', facts: ['Synthetic fixture only'], role: 'CFO' as const };

test('finance prompt keeps its default model and forbids production authority', () => {
  const result = buildRevenueLabPrompt(task);
  assert.equal(result.model, 'qwen2.5-coder:7b');
  assert.equal(result.productionMutationAllowed, false);
  assert.equal(REVENUE_LAB_GUARDRAILS.moneyMovementAllowed, false);
  assert.equal(REVENUE_LAB_GUARDRAILS.contractSigningAllowed, false);
});

test('finance prompt accepts the callers string model without making any model call', () => {
  const configuredModel: string = 'fixture-local-model:7b';
  const result = buildRevenueLabPrompt(task, configuredModel);
  assert.equal(result.model, configuredModel);
  assert.equal(buildRevenueLabPrompt(task, undefined).model, REVENUE_LAB_GUARDRAILS.defaultModel);
  assert.deepEqual(task.facts, ['Synthetic fixture only']);
});

function enrollment(): DevicePilotEnrollment {
  return { userId: 'test-user', tenantId: 'test-tenant', deviceId: 'test-device', enrolledAt: '2026-09-11T00:00:00Z',
    consentVersion: 'test-v1', capabilities: Object.freeze(['FILES_READ', 'LOCAL_MODELS'] as const),
    biometricOrPasskeyVerified: true, mfaVerified: true, recoveryConfigured: true, auditEnabled: true, killSwitchEnabled: true };
}

test('device enrollment accepts readonly capabilities without mutating consent', () => {
  const value = enrollment();
  assert.equal(validateDevicePilotEnrollment(value), true);
  assert.equal(Object.isFrozen(value.capabilities), true);
  assert.deepEqual(value.capabilities, ['FILES_READ', 'LOCAL_MODELS']);
  assert.equal(validateDevicePilotEnrollment({ ...value, capabilities: ['FILES_READ', 'FILES_READ'] }), false);
});

test('readonly capability typing does not relax tenant or private-data routing', () => {
  const value = enrollment();
  const action = { actionId: 'test-action', tenantId: value.tenantId, deviceId: value.deviceId,
    capability: 'FILES_READ' as const, risk: 'LOW' as const, requiresNetwork: false, containsTopSecret: false };
  assert.equal(authorizeDevicePilotAction(value, action).allowed, true);
  assert.equal(authorizeDevicePilotAction(value, { ...action, tenantId: 'other-tenant' }).allowed, false);
  assert.equal(authorizeDevicePilotAction(value, { ...action, capability: 'CAMERA' }).allowed, false);
  assert.equal(authorizeDevicePilotAction(value, { ...action, containsTopSecret: true, requiresNetwork: true }).allowed, false);
});

test('meeting evidence sorting uses a copy and keeps the source packet immutable', () => {
  const message = createMeetingMessage({ meetingId: 'test-meeting', tenantId: 'test-tenant', role: 'CHALLENGER',
    content: 'Synthetic review evidence', evidenceRefs: ['Z', 'A'], createdAt: '2026-09-11T00:00:00Z' });
  const packet = buildExecutiveDecisionPacket({ messages: [message] });
  const original = [...packet.evidenceRefs];
  assert.deepEqual([...packet.evidenceRefs].sort(), ['A', 'Z']);
  assert.deepEqual(packet.evidenceRefs, original);
  assert.equal(Object.isFrozen(packet.evidenceRefs), true);
  assert.equal(packet.productionExecutionAllowed, false);
  assert.equal(packet.requiresHumanApproval, true);
});
