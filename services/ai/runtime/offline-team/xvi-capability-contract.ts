import { sha256 } from './xvi-canonical-sha256';

export const CAPABILITY_POLICY_VERSION = 'xvi-capability-policy-v1' as const;
export const EXECUTION_MODES = Object.freeze(['OFFLINE_ONLY', 'ONLINE_ALLOWED', 'CLOUD_GOVERNED'] as const);
export type ExecutionMode = typeof EXECUTION_MODES[number];
const futureNetwork = Object.freeze(['EXPLICIT_HUMAN_CONSENT', 'PURPOSE_BOUND_APPROVAL', 'LEAST_PRIVILEGE_ADAPTER', 'VISIBLE_RECEIPT'] as const);
const futureCloud = Object.freeze([...futureNetwork, 'VERIFIED_IDENTITY', 'TENANT_UNIVERSE_ISOLATION', 'REVOCABLE_PERMISSION', 'RESIDENCY_POLICY'] as const);
export const CAPABILITY_MATRIX = Object.freeze({
  OFFLINE_ONLY: Object.freeze({ availability: 'LOCAL_METADATA_ONLY', network: false, cloud: false, requirements: Object.freeze(['NO_INTERNET', 'NO_PROVIDER', 'NO_CREDENTIALS'] as const) }),
  ONLINE_ALLOWED: Object.freeze({ availability: 'UNAVAILABLE_IN_FOUNDATION', network: false, cloud: false, requirements: futureNetwork }),
  CLOUD_GOVERNED: Object.freeze({ availability: 'UNAVAILABLE_IN_FOUNDATION', network: false, cloud: false, requirements: futureCloud }),
} as const);
export const CAPABILITY_CONTRACT = Object.freeze({
  version: 'xvi-capability-contract-v1', policyVersion: CAPABILITY_POLICY_VERSION,
  defaultMode: 'OFFLINE_ONLY', automaticTransitions: false, agentsEnabled: false,
  agentPermissions: Object.freeze([]), consequentialActions: 'HUMAN_APPROVAL_REQUIRED_EXECUTION_UNAVAILABLE',
  synchronization: 'UNAVAILABLE', storage: 'SESSION_ONLY_NOT_DURABLE',
  futureSynchronizationRequires: Object.freeze([...futureCloud, 'REPLAY_PROTECTION', 'STALE_UPDATE_REFUSAL']),
  organizationUniverses: 'DECLARED_ISOLATION_REQUIREMENT_NOT_PROVISIONED',
  ecosystemAdapters: 'DECLARED_LEAST_PRIVILEGE_REQUIREMENT_NOT_CONNECTED',
  configurablePolicyMetadata: Object.freeze(['language', 'locale', 'accessibility', 'culturalContext', 'dataResidency']),
  safetyRulesConfigurable: false, authenticated: false, ci: 'CI_UNVERIFIED',
} as const);

export const DEFAULT_CAPABILITY_PREFERENCES = Object.freeze({
  language: 'en', locale: 'en-US', accessibility: 'PLAIN_LANGUAGE',
  culturalContext: 'unspecified', dataResidency: 'DEVICE_ONLY',
});
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(v) && !/[\r\n]/.test(v);
const exactKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).sort().join(',') === keys.sort().join(',');
function boundedJson(input: unknown): Record<string, unknown> | null {
  if (typeof input !== 'string' || input.length > 2048 || new TextEncoder().encode(input).length > 2048) return null;
  try { const v: unknown = JSON.parse(input); return v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null; } catch { return null; }
}
/** Preferences are metadata only; no translation, residency enforcement or safety overrides. */
export function parseCapabilityPreferences(serialized: unknown) {
  const p = boundedJson(serialized);
  if (!p || !exactKeys(p, ['language', 'locale', 'accessibility', 'culturalContext', 'dataResidency']) ||
      !['en', 'es', 'fr', 'ja', 'ar'].includes(p.language as string) ||
      !['en-US', 'en-GB', 'es-ES', 'fr-FR', 'ja-JP', 'ar-SA'].includes(p.locale as string) ||
      !(p.locale as string).startsWith(`${p.language}-`) ||
      !['PLAIN_LANGUAGE', 'REDUCED_MOTION', 'SCREEN_READER'].includes(p.accessibility as string) ||
      !identifier(p.culturalContext) || !['DEVICE_ONLY', 'EU_ONLY', 'US_ONLY'].includes(p.dataResidency as string)) throw new Error('CAPABILITY_PREFERENCES_REFUSED');
  return Object.freeze({ language: p.language as string, locale: p.locale as string,
    accessibility: p.accessibility as string, culturalContext: p.culturalContext, dataResidency: p.dataResidency as string });
}

const OPERATIONS = Object.freeze(['PROPOSE_LOCAL_CHANGE', 'DISCARD_LOCAL_CHANGES', 'REQUEST_MODE_CHANGE', 'SYNCHRONIZE', 'UPLOAD', 'CLOUD_OPERATION'] as const);
export type CapabilityOperation = typeof OPERATIONS[number];
export interface CapabilityRequest {
  readonly requestId: string; readonly executionMode: ExecutionMode;
  readonly tenantId: string; readonly universeId: string; readonly actorId: string;
  readonly purpose: 'CLARIFY_GOAL' | 'REVIEW_CAPABILITIES'; readonly policyVersion: typeof CAPABILITY_POLICY_VERSION;
  readonly baseRevision: number; readonly operation: CapabilityOperation;
  readonly targetMode: ExecutionMode | null; readonly consent: boolean;
}

/** Trusted local scope labels, not authentication. No handle executes or synchronizes work. */
export function createCapabilitySession(tenantId: string, universeId: string, actorId: string,
  preferencesJson: unknown = JSON.stringify(DEFAULT_CAPABILITY_PREFERENCES)) {
  if (![tenantId, universeId, actorId].every(identifier)) throw new Error('CAPABILITY_SCOPE_REFUSED');
  const preferences = parseCapabilityPreferences(preferencesJson);
  const scope = Object.freeze({ executionMode: 'OFFLINE_ONLY' as const, tenantId, universeId, actorId, policyVersion: CAPABILITY_POLICY_VERSION });
  const pending: Readonly<CapabilityRequest>[] = [];
  const accepted = new Set<string>();
  let revision = 0, sequence = 0;
  let previousDigest: string | null = null;
  const stateDigest = () => sha256(JSON.stringify({ scope, preferences, revision, pending, accepted: [...accepted] }));
  const snapshot = () => Object.freeze({ ...scope, revision, preferences,
    pending: Object.freeze([...pending]), pendingReviewCount: pending.length,
    connectivity: 'NOT_OBSERVED' as const, synchronization: 'BLOCKED_NO_AUTHENTICATED_ADAPTER' as const,
    uncertainty: 'IDENTITY_AND_CONNECTIVITY_UNVERIFIED' as const,
    retention: 'SESSION_ONLY_LOST_ON_RELOAD' as const, authenticated: false, agentsEnabled: false,
    agentPermissions: Object.freeze([]), ci: 'CI_UNVERIFIED' as const });
  function record(serialized: unknown) {
    const before = stateDigest();
    let request: Readonly<CapabilityRequest> | null = null;
    let reason = 'PAYLOAD_REFUSED';
    let outcome: 'RECORDED' | 'REFUSED' = 'REFUSED';
    const input = boundedJson(serialized);
    const valid = input && exactKeys(input, ['requestId', 'executionMode', 'tenantId', 'universeId', 'actorId', 'purpose', 'policyVersion', 'baseRevision', 'operation', 'targetMode', 'consent']) &&
      [input.requestId, input.tenantId, input.universeId, input.actorId].every(identifier) &&
      EXECUTION_MODES.includes(input.executionMode as ExecutionMode) &&
      ['CLARIFY_GOAL', 'REVIEW_CAPABILITIES'].includes(input.purpose as string) &&
      typeof input.policyVersion === 'string' && input.policyVersion.length <= 64 &&
      Number.isSafeInteger(input.baseRevision) && (input.baseRevision as number) >= 0 &&
      OPERATIONS.includes(input.operation as CapabilityOperation) && typeof input.consent === 'boolean' &&
      (input.operation === 'REQUEST_MODE_CHANGE' ? EXECUTION_MODES.includes(input.targetMode as ExecutionMode) : input.targetMode === null);
    if (valid) {
      // A fixed field order defines canonical request v1, independently of input JSON order.
      request = Object.freeze({ requestId: input.requestId, executionMode: input.executionMode,
        tenantId: input.tenantId, universeId: input.universeId, actorId: input.actorId,
        purpose: input.purpose, policyVersion: input.policyVersion, baseRevision: input.baseRevision,
        operation: input.operation, targetMode: input.targetMode, consent: input.consent } as CapabilityRequest);
      if (request.tenantId !== tenantId || request.universeId !== universeId || request.actorId !== actorId) reason = 'SCOPE_REFUSED';
      else if (request.policyVersion !== CAPABILITY_POLICY_VERSION) reason = 'POLICY_VERSION_REFUSED';
      else if (request.executionMode !== scope.executionMode) reason = 'MODE_SPOOFING_REFUSED';
      else if (accepted.has(request.requestId)) reason = 'REPLAY_REFUSED';
      else if (request.baseRevision !== revision) reason = 'STALE_REVISION_REFUSED';
      else if (!request.consent) reason = 'VISIBLE_HUMAN_CONSENT_REQUIRED';
      else if (request.operation === 'REQUEST_MODE_CHANGE' && request.targetMode !== 'OFFLINE_ONLY') reason = 'MODE_TRANSITION_UNAVAILABLE';
      else if (['SYNCHRONIZE', 'UPLOAD', 'CLOUD_OPERATION'].includes(request.operation)) reason = 'AUTHENTICATED_ADAPTER_UNAVAILABLE';
      else if (accepted.size >= 128 && request.operation !== 'DISCARD_LOCAL_CHANGES') reason = 'SESSION_CAPACITY_REACHED';
      else if (request.operation === 'PROPOSE_LOCAL_CHANGE' && pending.length >= 32) reason = 'PENDING_CAPACITY_REACHED';
      else {
        if (request.operation === 'PROPOSE_LOCAL_CHANGE') pending.push(request);
        if (request.operation === 'DISCARD_LOCAL_CHANGES') pending.length = 0;
        // At capacity discard remains available; revision prevents replay of its unchanged request.
        if (accepted.size < 128) accepted.add(request.requestId);
        revision++; outcome = 'RECORDED';
        reason = request.operation === 'PROPOSE_LOCAL_CHANGE' ? 'PENDING_HUMAN_REVIEW_NO_EXECUTION' :
          request.operation === 'DISCARD_LOCAL_CHANGES' ? 'LOCAL_PENDING_CHANGES_DISCARDED' : 'ALREADY_OFFLINE_NO_TRANSITION';
      }
    }
    const bounded = typeof serialized === 'string' && serialized.length <= 2048 && new TextEncoder().encode(serialized).length <= 2048;
    const payload = Object.freeze({ receiptVersion: 'xvi-capability-receipt-v1', ...scope,
      purpose: request?.purpose ?? 'VALIDATE_REQUEST',
      sequence: ++sequence, previousDigest, operation: request?.operation ?? 'INVALID_REQUEST',
      requestId: reason === 'SCOPE_REFUSED' ? null : request?.requestId ?? null,
      requestDigest: request ? sha256(JSON.stringify(request)) : bounded ? sha256(serialized as string) : null,
      requestEncoding: request ? 'CANONICAL_REQUEST_V1' : bounded ? 'RAW_BOUNDED_JSON' : 'REDACTED',
      requestedMode: request?.executionMode ?? null, targetMode: request?.targetMode ?? null,
      outcome, reason, revision, fromStateDigest: before, toStateDigest: stateDigest(),
      pendingReviewCount: pending.length, persisted: false, authenticated: false, executed: false, ci: 'CI_UNVERIFIED',
    });
    const canonicalPayload = JSON.stringify(payload), digest = sha256(canonicalPayload);
    previousDigest = digest;
    return Object.freeze({ ...payload, canonicalPayload, digest, id: `xvi-capability-receipt-v1:${digest}` });
  }
  return Object.freeze({ snapshot, record });
}
export type CapabilitySnapshot = ReturnType<ReturnType<typeof createCapabilitySession>['snapshot']>;
