import { generateHumanCollaborationTeamDefinition } from './xvi-human-collaboration-team';
import { sha256 } from './xvi-canonical-sha256';

export const WORKSPACE_LIMITS = Object.freeze({ requestBytes: 2048, proposals: 32, acceptedRequests: 128 });
export const WORKSPACE_FEEDBACK = Object.freeze({
  CLARIFY_GOAL: 'Please clarify the goal and constraints.',
  NEED_EVIDENCE: 'Please provide evidence and state uncertainty.',
  CORRECT_ASSUMPTION: 'Please revisit the proposed assumptions.',
  ACCESSIBILITY: 'Please provide a plain-language, accessible explanation.',
} as const);
export type FeedbackKind = keyof typeof WORKSPACE_FEEDBACK;
type Decision = 'AWAITING_HUMAN_REVIEW' | 'REVIEWED_ONLY' | 'REVOKED';
export interface WorkspaceProposal {
  readonly id: string;
  readonly tenantId: string;
  readonly conversationId: string;
  readonly version: number;
  readonly kind: FeedbackKind;
  readonly summary: string;
  readonly decision: Decision;
  readonly applied: false;
  readonly consent: true;
  readonly provenance: 'BUILTIN_SYNTHETIC_FEEDBACK_V1';
  readonly license: 'CC0-1.0';
  readonly classification: 'SYNTHETIC_PUBLIC';
  readonly retention: 'SESSION_ONLY_UNTIL_DELETE';
  readonly policyVersion: 'xvi-core-values-v1';
}

const EVIDENCE = Object.freeze([
  Object.freeze({ id: 'synthetic-evidence-1', title: 'Goal', text: 'Plan a clearer explanation of a fictional task.', uncertainty: 'SYNTHETIC_EXAMPLE', provenance: 'BUILTIN_SYNTHETIC_FIXTURE_V1', license: 'CC0-1.0', classification: 'SYNTHETIC_PUBLIC' }),
  Object.freeze({ id: 'synthetic-evidence-2', title: 'Constraint', text: 'Offer proposals only. No action has been executed.', uncertainty: 'DECLARED_CONSTRAINT', provenance: 'BUILTIN_SYNTHETIC_FIXTURE_V1', license: 'CC0-1.0', classification: 'SYNTHETIC_PUBLIC' }),
] as const);

const identifier = (value: unknown): value is string => typeof value === 'string' && value.length <= 32 && /^[a-z][a-z0-9-]*$/.test(value);


/**
 * In-memory synchronization contract for a trusted local host, NOT an authenticated service.
 * Only built-in synthetic feedback is admitted; no raw documents or arbitrary text are accepted.
 * The host must keep humanOverride away from agents. All results remain unapplied metadata.
 */
export function createHumanWorkspace(tenantId: string, conversationId: string) {
  if (!identifier(tenantId) || !identifier(conversationId)) throw new Error('WORKSPACE_SCOPE_REFUSED');
  const team = generateHumanCollaborationTeamDefinition();
  let revision = 0;
  let sequence = 0;
  let previousDigest: string | null = null;
  let paused = false;
  let killed = false;
  let deleted = false;
  const proposals = new Map<string, WorkspaceProposal>();
  const accepted = new Set<string>();
  const snapshot = () => Object.freeze({
    tenantId, conversationId, revision, paused, killed, deleted,
    mode: 'OFFLINE_ONLY' as const, ci: 'CI_UNVERIFIED' as const,
    syncState: deleted ? 'DELETED' as const : 'LOCAL_ONLY' as const,
    authenticated: false as const, transport: 'UNAVAILABLE' as const,
    retention: 'SESSION_ONLY_UNTIL_DELETE' as const,
    policyVersion: team.coreValuesVersion,
    evidence: deleted ? Object.freeze([]) : EVIDENCE,
    proposals: Object.freeze([...proposals.values()]),
    team,
  });
  const stateIdentity = () => Object.freeze({ revision, digest: sha256(JSON.stringify({
    tenantId, conversationId, revision, paused, killed, deleted,
    proposals: [...proposals.values()], acceptedRequestIds: [...accepted],
    evidenceIds: deleted ? [] : EVIDENCE.map(item => item.id), policyVersion: team.coreValuesVersion,
  })) });
  type EventDetails = { requestId?: string | null; requestDigest?: string | null;
    requestEncoding?: 'CANONICAL_REQUEST_V1' | 'RAW_BOUNDED_JSON' | 'REDACTED';
    proposalId?: string | null; before?: ReturnType<typeof stateIdentity> };
  const receipt = (operation: string, outcome: 'RECORDED' | 'REFUSED', reason: string, details: EventDetails = {}) => {
    const after = stateIdentity();
    const before = details.before ?? after;
    const proposal = details.proposalId ? proposals.get(details.proposalId) : undefined;
    // Fixed key order, explicit nulls, primitive fields and frozen nested objects define v1.
    const payload = Object.freeze({
      receiptVersion: 'xvi-workspace-receipt-v1', tenantId, conversationId,
      sequence: sequence + 1, previousDigest, operation, outcome, reason,
      request: Object.freeze({ id: details.requestId ?? null, digest: details.requestDigest ?? null,
        encoding: details.requestEncoding ?? 'REDACTED' }),
      transition: Object.freeze({ fromRevision: before.revision, toRevision: after.revision,
        fromStateDigest: before.digest, toStateDigest: after.digest,
        proposalId: proposal?.id ?? null, proposalVersion: proposal?.version ?? null,
        proposalDigest: proposal ? sha256(JSON.stringify(proposal)) : null }),
      revision, syncState: reason === 'OFFLINE_CONFLICT' ? 'OFFLINE_CONFLICT' as const : deleted ? 'DELETED' as const : 'LOCAL_ONLY' as const,
      policyVersion: team.coreValuesVersion, collaborationVersion: team.collaborationContract.version,
      persisted: false as const, authenticated: false as const, applied: false as const,
      mode: 'OFFLINE_ONLY' as const, ci: 'CI_UNVERIFIED' as const,
    });
    const canonicalPayload = JSON.stringify(payload);
    const digest = sha256(canonicalPayload);
    sequence++; previousDigest = digest;
    return Object.freeze({ ...payload, canonicalPayload, digest, id: `xvi-workspace-receipt-v1:${digest}` });
  };
  const refuse = (reason: string, operation = 'REQUEST', details: EventDetails = {}) => receipt(operation, 'REFUSED', reason, details);
  const dispatch = (serialized: unknown) => {
    if (typeof serialized !== 'string') return refuse('PAYLOAD_REFUSED');
    if (serialized.length > WORKSPACE_LIMITS.requestBytes) return refuse('PAYLOAD_CHARACTER_LIMIT');
    if (new TextEncoder().encode(serialized).length > WORKSPACE_LIMITS.requestBytes) return refuse('PAYLOAD_BYTE_LIMIT');
    let event: EventDetails = { requestDigest: sha256(serialized), requestEncoding: 'RAW_BOUNDED_JSON' };
    let operation = 'REQUEST';
    const reject = (reason: string) => refuse(reason, operation, event);
    let input: unknown;
    try { input = JSON.parse(serialized); } catch { return reject('PAYLOAD_REFUSED'); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) return reject('PAYLOAD_REFUSED');
    const request = input as Record<string, unknown>;
    const keys = Object.keys(request).sort();
    if (keys.join(',') !== 'baseRevision,consent,conversationId,kind,requestId,tenantId,value' ||
        !identifier(request.tenantId) || !identifier(request.conversationId) || !identifier(request.requestId) ||
        !Number.isSafeInteger(request.baseRevision) || (request.baseRevision as number) < 0 ||
        typeof request.consent !== 'boolean' || typeof request.value !== 'string' || request.value.length > 128 ||
        !['FEEDBACK', 'REVIEW', 'REVOKE'].includes(request.kind as string)) return reject('PAYLOAD_REFUSED');
    operation = request.kind as string;
    event = { requestId: request.requestId, requestEncoding: 'CANONICAL_REQUEST_V1', requestDigest: sha256(JSON.stringify({
      tenantId: request.tenantId, conversationId: request.conversationId, requestId: request.requestId,
      baseRevision: request.baseRevision, kind: request.kind, value: request.value, consent: request.consent,
    })) };
    // Scope-refused requests never echo even the supplied identifier.
    if (request.tenantId !== tenantId || request.conversationId !== conversationId) return refuse('SCOPE_REFUSED', operation, { ...event, requestId: null });
    if (deleted) return reject('DELETED');
    if (accepted.has(request.requestId)) return reject('REPLAY_REFUSED');
    if (request.baseRevision !== revision) return reject('OFFLINE_CONFLICT');
    if (killed && request.kind !== 'REVOKE') return reject('KILLED');
    if (paused && request.kind !== 'REVOKE') return reject('PAUSED');
    if (accepted.size >= WORKSPACE_LIMITS.acceptedRequests) return reject('REQUEST_CAPACITY_REACHED');
    const before = stateIdentity();
    let proposalId: string;
    if (request.kind === 'FEEDBACK') {
      if (request.consent !== true) return reject('CONSENT_REQUIRED');
      if (!Object.hasOwn(WORKSPACE_FEEDBACK, request.value)) return reject('FEEDBACK_KIND_REFUSED');
      if (proposals.size >= WORKSPACE_LIMITS.proposals) return reject('PROPOSAL_CAPACITY_REACHED');
      const kind = request.value as FeedbackKind;
      const id = `proposal-${proposals.size + 1}`;
      proposalId = id;
      proposals.set(id, Object.freeze({ id, tenantId, conversationId, version: 1, kind,
        summary: WORKSPACE_FEEDBACK[kind], decision: 'AWAITING_HUMAN_REVIEW', applied: false,
        consent: true, provenance: 'BUILTIN_SYNTHETIC_FEEDBACK_V1', license: 'CC0-1.0',
        classification: 'SYNTHETIC_PUBLIC', retention: 'SESSION_ONLY_UNTIL_DELETE', policyVersion: team.coreValuesVersion }));
    } else {
      const proposal = proposals.get(request.value);
      if (!proposal) return reject('UNKNOWN_PROPOSAL');
      if (proposal.decision === 'REVOKED') return reject('PROPOSAL_REVOKED');
      if (request.kind === 'REVIEW' && proposal.decision !== 'AWAITING_HUMAN_REVIEW') return reject('ALREADY_REVIEWED');
      proposalId = proposal.id;
      proposals.set(proposal.id, Object.freeze({ ...proposal, version: proposal.version + 1,
        decision: request.kind === 'REVIEW' ? 'REVIEWED_ONLY' : 'REVOKED', applied: false }));
    }
    accepted.add(request.requestId);
    revision++;
    return receipt(operation, 'RECORDED', request.kind === 'REVIEW' ? 'REVIEW_ONLY_NO_EXECUTION' : 'LOCAL_METADATA_ONLY', { ...event, before, proposalId });
  };
  const humanOverride = Object.freeze({
    pause() { if (deleted) return refuse('DELETED', 'PAUSE'); const before = stateIdentity(); paused = true; revision++; return receipt('PAUSE', 'RECORDED', 'HUMAN_PAUSE', { before }); },
    resume() { if (deleted || killed) return refuse(deleted ? 'DELETED' : 'KILLED', 'RESUME'); const before = stateIdentity(); paused = false; revision++; return receipt('RESUME', 'RECORDED', 'LOCAL_METADATA_ONLY', { before }); },
    kill() { if (deleted) return refuse('DELETED', 'KILL'); const before = stateIdentity(); killed = true; paused = true; revision++; return receipt('KILL', 'RECORDED', 'HUMAN_KILL_LATCHED', { before }); },
    deleteConversation() {
      const before = stateIdentity();
      proposals.clear(); accepted.clear(); deleted = true; paused = true; killed = true; revision++;
      return receipt('DELETE', 'RECORDED', 'LOCAL_CONVERSATION_DELETED', { before });
    },
    exportConversation() {
      if (deleted) return Object.freeze({ receipt: refuse('DELETED', 'EXPORT'), data: null });
      return Object.freeze({ receipt: receipt('EXPORT', 'RECORDED', 'LOCAL_SYNTHETIC_EXPORT'),
        data: JSON.stringify({ tenantId, conversationId, revision, evidence: EVIDENCE, proposals: [...proposals.values()], policyVersion: team.coreValuesVersion }) });
    },
  });
  return Object.freeze({ snapshot, humanOverride,
    // This function records local human input; it must not be exposed as agent authority.
    recordHumanInput: dispatch,
    requestOnlineSync: (_request: unknown) => refuse('ONLINE_SYNC_UNAVAILABLE', 'ONLINE_SYNC'),
    requestDocumentAdmission: (_request: unknown) => refuse('DOCUMENT_ADMISSION_UNAVAILABLE', 'DOCUMENT_ADMISSION'),
    requestActivation: (_request: unknown) => refuse('ACTIVATION_UNAVAILABLE', 'ACTIVATION'),
  });
}

export type HumanWorkspace = ReturnType<typeof createHumanWorkspace>;
export type HumanWorkspaceSnapshot = ReturnType<HumanWorkspace['snapshot']>;
