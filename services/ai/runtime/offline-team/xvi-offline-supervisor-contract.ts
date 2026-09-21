import { sha256 } from './xvi-canonical-sha256';

export const OFFLINE_SUPERVISOR_POLICY = Object.freeze({
  version: 'xvi-offline-supervisor-policy-v1', requestBytes: 2048,
  pendingLimit: 1, rememberedRequests: 64, minLeaseMs: 1000, maxLeaseMs: 30_000,
  maxLifetimeMs: 120_000, maxLogicalTimeMs: Number.MAX_SAFE_INTEGER - 120_000,
  retryLimit: 0, checkpointStorage: 'UNAVAILABLE', crashRecovery: 'HUMAN_REVIEW_REQUIRED_NO_RESTORE',
  execution: 'UNAVAILABLE', serviceActivation: 'UNAVAILABLE', agentsEnabled: false,
  agentPermissions: Object.freeze([]), automaticTransitions: false,
} as const);
export const SUPERVISOR_MODE_DECLARATIONS = Object.freeze({
  OFFLINE_ONLY: 'SYNTHETIC_CONTRACT_ONLY', ONLINE_ALLOWED: 'UNAVAILABLE', CLOUD_GOVERNED: 'UNAVAILABLE',
} as const);
export type SupervisorState = 'IDLE' | 'PENDING_REVIEW' | 'LEASED' | 'DRAINING' | 'PAUSED' | 'KILLED';
const OPERATIONS = Object.freeze(['PROPOSE', 'APPROVE', 'HEARTBEAT', 'COMPLETE', 'EXPIRE', 'PAUSE', 'RESUME', 'DRAIN', 'KILL'] as const);
type Operation = typeof OPERATIONS[number];
type Mode = keyof typeof SUPERVISOR_MODE_DECLARATIONS;
export interface SupervisorRequest {
  readonly tenantId: string; readonly universeId: string; readonly actorId: string;
  readonly executionMode: Mode; readonly policyVersion: string; readonly purpose: 'SYNTHETIC_SUPERVISOR_METADATA';
  readonly requestId: string; readonly baseRevision: number; readonly operation: Operation;
  readonly nowMs: number; readonly referenceId: string | null; readonly durationMs: number | null;
  readonly consent: boolean;
}
type Pending = Readonly<{ id: string; requestId: string; durationMs: number }>;
type Lease = Readonly<{ id: string; proposalId: string; durationMs: number; issuedAtMs: number;
  heartbeatAtMs: number; expiresAtMs: number; hardDeadlineMs: number }>;
const identifier = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-z0-9-]{0,31}$/.test(v) && !/[\r\n]/.test(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const KEYS = Object.freeze(['tenantId', 'universeId', 'actorId', 'executionMode', 'policyVersion', 'purpose', 'requestId', 'baseRevision', 'operation', 'nowMs', 'referenceId', 'durationMs', 'consent']);
function parseRequest(serialized: string): Readonly<SupervisorRequest> | null {
  let v: Record<string, unknown>;
  try { const parsed: unknown = JSON.parse(serialized); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null; v = parsed as Record<string, unknown>; } catch { return null; }
  if (Object.keys(v).length !== KEYS.length || !KEYS.every(k => Object.hasOwn(v, k)) ||
      ![v.tenantId, v.universeId, v.actorId, v.requestId].every(identifier) ||
      !Object.hasOwn(SUPERVISOR_MODE_DECLARATIONS, typeof v.executionMode === 'string' ? v.executionMode : '') ||
      typeof v.policyVersion !== 'string' || v.policyVersion.length > 64 || v.purpose !== 'SYNTHETIC_SUPERVISOR_METADATA' ||
      !integer(v.baseRevision) || !integer(v.nowMs) || v.nowMs > OFFLINE_SUPERVISOR_POLICY.maxLogicalTimeMs ||
      !OPERATIONS.includes(v.operation as Operation) || typeof v.consent !== 'boolean') return null;
  const referenced = ['APPROVE', 'HEARTBEAT', 'COMPLETE', 'EXPIRE'].includes(v.operation as string);
  if (referenced ? !identifier(v.referenceId) : v.referenceId !== null) return null;
  if (v.operation === 'PROPOSE' ? !integer(v.durationMs) || v.durationMs < OFFLINE_SUPERVISOR_POLICY.minLeaseMs || v.durationMs > OFFLINE_SUPERVISOR_POLICY.maxLeaseMs : v.durationMs !== null) return null;
  // This construction, not incoming key order, defines canonical request v1.
  return Object.freeze({ tenantId: v.tenantId, universeId: v.universeId, actorId: v.actorId,
    executionMode: v.executionMode, policyVersion: v.policyVersion, purpose: v.purpose,
    requestId: v.requestId, baseRevision: v.baseRevision, operation: v.operation,
    nowMs: v.nowMs, referenceId: v.referenceId, durationMs: v.durationMs, consent: v.consent } as SupervisorRequest);
}

/** Pure in-memory decision contract. Trusted host labels/handles are not authentication.
 * Keep humanControl away from models. No method runs work, schedules time or restores state.
 */
export function createOfflineSupervisorContract(tenantId: string, universeId: string, actorId: string) {
  if (![tenantId, universeId, actorId].every(identifier)) throw new Error('SUPERVISOR_SCOPE_REFUSED');
  const scope = Object.freeze({ tenantId, universeId, actorId, executionMode: 'OFFLINE_ONLY' as const,
    policyVersion: OFFLINE_SUPERVISOR_POLICY.version });
  let lifecycle: SupervisorState = 'IDLE';
  let revision = 0, sequence = 0, observedAtMs = 0;
  let pending: Pending | null = null, lease: Lease | null = null;
  let previousDigest: string | null = null;
  const accepted = new Set<string>();
  const state = () => Object.freeze({ ...scope, lifecycle, revision, observedAtMs, pending, lease,
    acceptedRequestIds: Object.freeze([...accepted]) });
  const digestState = () => sha256(JSON.stringify(state()));
  const snapshot = () => Object.freeze({ ...state(),
    pendingReviewCount: pending ? 1 : 0, runningWorkers: 0, agentsEnabled: false,
    agentPermissions: OFFLINE_SUPERVISOR_POLICY.agentPermissions, execution: 'UNAVAILABLE',
    connectivity: 'NOT_OBSERVED', synchronization: 'UNAVAILABLE',
    healthBasis: 'CALLER_SUPPLIED_LOGICAL_TIME_NOT_LIVE_HEALTH',
    checkpointStorage: 'UNAVAILABLE', recovery: OFFLINE_SUPERVISOR_POLICY.crashRecovery,
    authenticated: false, persisted: false, ci: 'CI_UNVERIFIED',
  } as const);
  function record(serialized: unknown, channel: 'PROPOSAL_ONLY' | 'HUMAN_CONTROL') {
    const beforeRevision = revision, fromStateDigest = digestState();
    let request: Readonly<SupervisorRequest> | null = null;
    let encoding: 'REDACTED' | 'RAW_BOUNDED_JSON' | 'CANONICAL_REQUEST_V1' = 'REDACTED';
    let requestDigest: string | null = null;
    let reason = 'PAYLOAD_REFUSED', outcome: 'RECORDED' | 'REFUSED' = 'REFUSED';
    if (typeof serialized === 'string' && serialized.length <= OFFLINE_SUPERVISOR_POLICY.requestBytes) {
      if (new TextEncoder().encode(serialized).length > OFFLINE_SUPERVISOR_POLICY.requestBytes) reason = 'PAYLOAD_BYTE_LIMIT';
      else {
        request = parseRequest(serialized);
        encoding = request ? 'CANONICAL_REQUEST_V1' : 'RAW_BOUNDED_JSON';
        requestDigest = sha256(request ? JSON.stringify(request) : serialized);
      }
    }
    if (request) {
      const r = request;
      const stop = channel === 'HUMAN_CONTROL' && (r.operation === 'PAUSE' || r.operation === 'KILL');
      if (r.tenantId !== tenantId || r.universeId !== universeId || r.actorId !== actorId) reason = 'SCOPE_REFUSED';
      else if (r.executionMode !== 'OFFLINE_ONLY') reason = 'MODE_UNAVAILABLE';
      else if (r.policyVersion !== scope.policyVersion) reason = 'POLICY_VERSION_REFUSED';
      else if (channel === 'PROPOSAL_ONLY' && r.operation !== 'PROPOSE') reason = 'HUMAN_CONTROL_REQUIRED';
      else if (lifecycle === 'KILLED') reason = 'KILL_LATCHED';
      else if (accepted.has(r.requestId)) reason = 'REPLAY_REFUSED';
      else if (stop && r.operation === 'PAUSE' && lifecycle === 'PAUSED') reason = 'ALREADY_PAUSED';
      else if (!stop && r.baseRevision !== revision) reason = 'STALE_REVISION';
      else if (!stop && r.nowMs < observedAtMs) reason = 'TIME_REGRESSION';
      else if (!stop && !r.consent) reason = 'HUMAN_CONSENT_REQUIRED';
      else if (!stop && accepted.size >= OFFLINE_SUPERVISOR_POLICY.rememberedRequests) reason = 'SESSION_CAPACITY';
      else {
        reason = 'TRANSITION_REFUSED';
        if (stop) {
          lifecycle = r.operation === 'KILL' ? 'KILLED' : 'PAUSED'; pending = null; lease = null;
          reason = r.operation === 'KILL' ? 'HUMAN_KILL_LATCHED' : 'HUMAN_PAUSE_CANCELLED_LEASE';
          outcome = 'RECORDED';
        } else if (r.operation === 'PROPOSE' && lifecycle === 'IDLE') {
          pending = Object.freeze({ id: `proposal-${revision + 1}`, requestId: r.requestId, durationMs: r.durationMs! });
          lifecycle = 'PENDING_REVIEW'; outcome = 'RECORDED'; reason = 'AWAITING_HUMAN_REVIEW';
        } else if (r.operation === 'APPROVE' && lifecycle === 'PENDING_REVIEW' && pending) {
          if (r.referenceId !== pending.id) reason = 'STALE_PROPOSAL';
          else {
            lease = Object.freeze({ id: `lease-${revision + 1}`, proposalId: pending.id, durationMs: pending.durationMs,
              issuedAtMs: r.nowMs, heartbeatAtMs: r.nowMs, expiresAtMs: r.nowMs + pending.durationMs,
              hardDeadlineMs: r.nowMs + OFFLINE_SUPERVISOR_POLICY.maxLifetimeMs });
            pending = null; lifecycle = 'LEASED'; outcome = 'RECORDED'; reason = 'LEASE_METADATA_ONLY_NO_EXECUTION';
          }
        } else if (['HEARTBEAT', 'COMPLETE', 'EXPIRE'].includes(r.operation) && lease) {
          if (r.referenceId !== lease.id) reason = 'STALE_LEASE';
          else if (r.operation === 'EXPIRE') {
            if (r.nowMs < lease.expiresAtMs) reason = 'LEASE_NOT_EXPIRED';
            else { lease = null; lifecycle = 'PAUSED'; outcome = 'RECORDED'; reason = 'TIMEOUT_REQUIRES_HUMAN_REVIEW'; }
          } else if (r.nowMs >= lease.expiresAtMs) reason = 'LEASE_EXPIRED';
          else if (r.operation === 'COMPLETE') {
            lease = null; lifecycle = lifecycle === 'DRAINING' ? 'PAUSED' : 'IDLE';
            outcome = 'RECORDED'; reason = 'COMPLETION_METADATA_NOT_EXECUTION_ATTESTATION';
          } else if (lifecycle === 'DRAINING') reason = 'DRAINING_NO_RENEWAL';
          else if (r.nowMs <= lease.heartbeatAtMs) reason = 'HEARTBEAT_NOT_ADVANCING';
          else {
            lease = Object.freeze({ ...lease, heartbeatAtMs: r.nowMs,
              expiresAtMs: Math.min(r.nowMs + lease.durationMs, lease.hardDeadlineMs) });
            outcome = 'RECORDED'; reason = 'HEARTBEAT_METADATA_ONLY';
          }
        } else if (r.operation === 'DRAIN' && lifecycle !== 'PAUSED' && lifecycle !== 'DRAINING') {
          pending = null; lifecycle = lease ? 'DRAINING' : 'PAUSED'; outcome = 'RECORDED'; reason = 'DRAIN_BLOCKS_NEW_LEASES';
        } else if (r.operation === 'RESUME' && lifecycle === 'PAUSED') {
          lifecycle = 'IDLE'; outcome = 'RECORDED'; reason = 'RESUMED_METADATA_ONLY';
        }
        if (outcome === 'RECORDED') {
          observedAtMs = Math.max(observedAtMs, r.nowMs); revision++;
          if (accepted.size < OFFLINE_SUPERVISOR_POLICY.rememberedRequests) accepted.add(r.requestId);
        }
      }
    }
    const payload = Object.freeze({ receiptVersion: 'xvi-offline-supervisor-receipt-v1', ...scope,
      purpose: request?.purpose ?? 'VALIDATE_REQUEST', channel, sequence: ++sequence, previousDigest,
      requestId: reason === 'SCOPE_REFUSED' ? null : request?.requestId ?? null,
      requestDigest, requestEncoding: encoding, requestedMode: request?.executionMode ?? null,
      operation: request?.operation ?? 'INVALID_REQUEST', outcome, reason,
      fromRevision: beforeRevision, toRevision: revision, fromStateDigest, toStateDigest: digestState(),
      result: Object.freeze({ lifecycle, pendingId: pending?.id ?? null, lease,
        observedAtMs, execution: 'UNAVAILABLE', agentsEnabled: false }),
      authenticated: false, persisted: false, executed: false, ci: 'CI_UNVERIFIED',
    });
    const canonicalPayload = JSON.stringify(payload), digest = sha256(canonicalPayload);
    previousDigest = digest;
    return Object.freeze({ ...payload, canonicalPayload, digest, id: `xvi-offline-supervisor-receipt-v1:${digest}` });
  }
  return Object.freeze({ snapshot,
    propose: (serialized: unknown) => record(serialized, 'PROPOSAL_ONLY'),
    humanControl: Object.freeze({ record: (serialized: unknown) => record(serialized, 'HUMAN_CONTROL') }),
  });
}
export type OfflineSupervisorSnapshot = ReturnType<ReturnType<typeof createOfflineSupervisorContract>['snapshot']>;
