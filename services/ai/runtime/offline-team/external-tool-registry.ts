/**
 * 12D-112: Governed external build/AI tool integration registry
 * (EXPO, LOVABLE, AMD toolchain, OPENAI_CHATGPT, GROK_XAI, OLLAMA).
 *
 * HONEST STATE: no vendor agreement, API key, or integration pilot exists yet, so every
 * tool starts at NOT_STARTED and `liveIntegrationsEstablished` is hard-coded false.
 * Nothing in this module performs OAuth, stores a token, or contacts an endpoint —
 * including the local Ollama endpoint, whose well-known address is recorded as INTENT
 * ONLY and is never probed here. The registry's entire job is to record, per tool, the
 * integration intent, the required-agreement kinds, and the governance posture, so a
 * future operator decision happens on an audited surface instead of by accident.
 * Stage advancement requires an evidence receipt; 'LIVE' is unreachable from this module
 * by construction — establishing a live integration is an operator/human decision that
 * must land in a different, audited layer first.
 */
export type ExternalToolId = 'EXPO' | 'LOVABLE' | 'AMD_TOOLCHAIN' | 'OPENAI_CHATGPT' | 'GROK_XAI' | 'OLLAMA';
export type ExternalToolStage = 'NOT_STARTED' | 'AGREEMENT_PENDING' | 'INTEGRATION_RESEARCH' | 'SANDBOX_PILOT_APPROVED' | 'LIVE';
export type ExternalToolKind = 'BUILD_TOOLCHAIN' | 'WEB_BUILDER' | 'HARDWARE_TOOLCHAIN' | 'CHAT_MODEL_PROVIDER' | 'LOCAL_MODEL_RUNTIME';
export type AgreementKind = 'VENDOR_TERMS_OF_SERVICE' | 'VENDOR_SOFTWARE_LICENSE' | 'PROVIDER_TERMS' | 'API_KEY_AGREEMENT' | 'LOCAL_SOFTWARE_LICENSE';

export interface ExternalToolTarget {
  toolId: ExternalToolId;
  stage: ExternalToolStage;
  kind: ExternalToolKind;
  vendor: string;
  /** Public doc/home surface the CEO named. Recorded as a label; never fetched. */
  publicSurface: string;
  /** Agreement kinds a human must sign BEFORE any integration can progress past research. */
  requiredAgreementKinds: readonly AgreementKind[];
  /** Non-null only where a local address is already known (OLLAMA). Intent only; never contacted. */
  localEndpointNote: string | null;
  evidenceRefs: readonly string[];
}

export interface ExternalToolSnapshot {
  tools: readonly Readonly<ExternalToolTarget>[];
  toolsTenantedAtNotStarted: number;
  liveIntegrationsEstablished: false;
  remoteCallsPerformed: 0;
  modelCalls: 0;
  realEntitiesCreated: 0;
  humanDecision: 'REQUIRED';
  learningPromoted: false;
  guardrails: typeof EXTERNAL_TOOL_GUARDRAILS;
}

export const EXTERNAL_TOOL_POLICY = Object.freeze({
  maxTools: 6,
  maxRefChars: 256,
  maxEvidenceRefsPerTool: 16,
});

export const EXTERNAL_TOOL_GUARDRAILS = Object.freeze({
  liveIntegrationRequiresSignedVendorAgreementAndOperatorApproval: true,
  liveStageUnreachableFromThisModule: true,
  stageAdvancementRequiresEvidenceReceipt: true,
  noOAuthPerformed: true,
  noTokensOrCredentialsStoredOrAccepted: true,
  noEndpointsContactedIncludingLocal: true,
  localEndpointNoteIsIntentOnly: true,
  remoteCallsAllowed: false,
  modelCallsAllowed: 0,
  humanDecision: 'REQUIRED' as const,
});

const TOOLS: readonly ExternalToolId[] = ['EXPO', 'LOVABLE', 'AMD_TOOLCHAIN', 'OPENAI_CHATGPT', 'GROK_XAI', 'OLLAMA'];
const STAGES: readonly ExternalToolStage[] = ['NOT_STARTED', 'AGREEMENT_PENDING', 'INTEGRATION_RESEARCH', 'SANDBOX_PILOT_APPROVED', 'LIVE'];

const TOOL_POSTURE: Readonly<Record<ExternalToolId, {
  kind: ExternalToolKind; vendor: string; publicSurface: string;
  requiredAgreementKinds: readonly AgreementKind[]; localEndpointNote: string | null;
}>> = Object.freeze({
  EXPO: {
    kind: 'BUILD_TOOLCHAIN', vendor: 'Expo', publicSurface: 'expo.dev (React Native SDK 57)',
    requiredAgreementKinds: ['VENDOR_TERMS_OF_SERVICE'], localEndpointNote: null,
  },
  LOVABLE: {
    kind: 'WEB_BUILDER', vendor: 'Lovable', publicSurface: 'lovable.dev (web builder)',
    requiredAgreementKinds: ['VENDOR_TERMS_OF_SERVICE'], localEndpointNote: null,
  },
  AMD_TOOLCHAIN: {
    kind: 'HARDWARE_TOOLCHAIN', vendor: 'AMD', publicSurface: 'amd.com (ROCm / NPU targets)',
    requiredAgreementKinds: ['VENDOR_SOFTWARE_LICENSE'], localEndpointNote: null,
  },
  OPENAI_CHATGPT: {
    kind: 'CHAT_MODEL_PROVIDER', vendor: 'OpenAI', publicSurface: 'chatgpt.com (chatgpt/* implementer branches)',
    requiredAgreementKinds: ['PROVIDER_TERMS', 'API_KEY_AGREEMENT'], localEndpointNote: null,
  },
  GROK_XAI: {
    kind: 'CHAT_MODEL_PROVIDER', vendor: 'xAI', publicSurface: 'x.ai (Grok)',
    requiredAgreementKinds: ['PROVIDER_TERMS', 'API_KEY_AGREEMENT'], localEndpointNote: null,
  },
  OLLAMA: {
    kind: 'LOCAL_MODEL_RUNTIME', vendor: 'Ollama', publicSurface: 'ollama.com (local runtime)',
    requiredAgreementKinds: ['LOCAL_SOFTWARE_LICENSE'],
    localEndpointNote: '127.0.0.1:11434 (recorded as intent only; never contacted by this module)',
  },
});

const tools = new Map<ExternalToolId, { stage: ExternalToolStage; evidenceRefs: string[] }>(
  TOOLS.map(t => [t, { stage: 'NOT_STARTED' as const, evidenceRefs: [] }]));

const ref = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export function getExternalTool(toolId: ExternalToolId): Readonly<ExternalToolTarget> {
  const t = tools.get(toolId);
  if (!t) throw new Error(`unknown external tool: ${String(toolId)}`);
  return Object.freeze({
    toolId,
    stage: t.stage,
    kind: TOOL_POSTURE[toolId].kind,
    vendor: TOOL_POSTURE[toolId].vendor,
    publicSurface: TOOL_POSTURE[toolId].publicSurface,
    requiredAgreementKinds: Object.freeze([...TOOL_POSTURE[toolId].requiredAgreementKinds]),
    localEndpointNote: TOOL_POSTURE[toolId].localEndpointNote,
    evidenceRefs: Object.freeze([...t.evidenceRefs]),
  });
}

export function listExternalTools(): readonly Readonly<ExternalToolTarget>[] {
  return Object.freeze(TOOLS.map(getExternalTool));
}

/**
 * Record an evidence receipt and advance a tool's stage. 'LIVE' is rejected here by
 * construction: a live integration requires a signed vendor agreement plus an explicit
 * operator decision, implemented in a separate audited layer — never by a stage flag.
 */
export function advanceStage(toolId: ExternalToolId, nextStage: ExternalToolStage, receiptRef: string): Readonly<ExternalToolTarget> {
  if (!TOOLS.includes(toolId)) throw new Error(`unknown external tool: ${String(toolId)}`);
  if (!ref(receiptRef, EXTERNAL_TOOL_POLICY.maxRefChars)) throw new Error('evidence receipt required for stage advancement');
  if (nextStage === 'LIVE') throw new Error('LIVE stage is unreachable from this module; establishing a live integration requires a signed vendor agreement and an explicit operator decision in an audited layer');
  const t = tools.get(toolId)!;
  if (STAGES.indexOf(nextStage) <= STAGES.indexOf(t.stage)) throw new Error('stage regression is not permitted; use a new evidence trail');
  if (t.evidenceRefs.length >= EXTERNAL_TOOL_POLICY.maxEvidenceRefsPerTool) throw new Error('evidence ceiling reached for this tool');
  t.evidenceRefs.push(receiptRef);
  t.stage = nextStage;
  return getExternalTool(toolId);
}

/**
 * Record a bounded evidence ref against a tool WITHOUT changing its stage (e.g. a
 * research note, a draft agreement ref). Evidence never implies live integration.
 */
export function recordIntegrationEvidence(toolId: ExternalToolId, evidenceRef: string): Readonly<ExternalToolTarget> {
  if (!TOOLS.includes(toolId)) throw new Error(`unknown external tool: ${String(toolId)}`);
  if (!ref(evidenceRef, EXTERNAL_TOOL_POLICY.maxRefChars)) throw new Error('bounded evidence ref required');
  const t = tools.get(toolId)!;
  if (t.evidenceRefs.length >= EXTERNAL_TOOL_POLICY.maxEvidenceRefsPerTool) throw new Error('evidence ceiling reached for this tool');
  t.evidenceRefs.push(evidenceRef);
  return getExternalTool(toolId);
}

/** Honest registry-wide snapshot. Never claims live integration that does not exist. */
export function externalToolSnapshot(): Readonly<ExternalToolSnapshot> {
  return Object.freeze({
    tools: listExternalTools(),
    toolsTenantedAtNotStarted: [...tools.values()].filter(t => t.stage === 'NOT_STARTED').length,
    liveIntegrationsEstablished: false,
    remoteCallsPerformed: 0,
    modelCalls: 0,
    realEntitiesCreated: 0,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false,
    guardrails: EXTERNAL_TOOL_GUARDRAILS,
  });
}