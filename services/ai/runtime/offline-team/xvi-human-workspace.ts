import { generateHumanCollaborationTeamDefinition } from './xvi-human-collaboration-team';

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

// Synchronous SHA-256 over UTF-8 keeps the contract browser-safe and transitions atomic.
// Only bounded, locally constructed strings reach this helper. Tests use Node crypto
// as an independent digest oracle; this is integrity metadata, not authentication.
const SHA256_K = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
function sha256(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes); padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bytes.length / 0x20000000));
  view.setUint32(padded.length - 4, (bytes.length * 8) >>> 0);
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const rotate = (value: number, bits: number) => (value >>> bits) | (value << (32 - bits));
  const words = new Uint32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = words[i - 15], y = words[i - 2];
      words[i] = (words[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3)) + words[i - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10))) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_K[i] + words[i]) >>> 0;
      const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    for (const [i, value] of [a, b, c, d, e, f, g, h].entries()) hash[i] = (hash[i] + value) >>> 0;
  }
  return hash.map(word => word.toString(16).padStart(8, '0')).join('');
}

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
