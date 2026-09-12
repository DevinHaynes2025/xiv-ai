import { createPublicKey, randomBytes, verify, type KeyObject } from 'node:crypto';

/** Presence telemetry only. A valid signature authenticates an enrolled reporter, not its claims. */
export const AGENT_PRESENCE_LIMITS = Object.freeze({ maxInstances: 1024, maxReceiptBytes: 8192, maxTtlMs: 120_000 });
export interface AgentPresenceEnrollment {
  agentId: string;
  instanceId: string;
  definitionId: string;
  providerId: string;
  modelId: string;
  masterPlanSha256: string;
  sourceCommit: string;
  publicKeyPem: string;
  expiresAtMs: number;
}
export interface AgentPresencePayload {
  schemaVersion: 1;
  collectorId: string;
  tenantId: string;
  agentId: string;
  instanceId: string;
  definitionId: string;
  providerId: string;
  modelId: string;
  masterPlanSha256: string;
  sourceCommit: string;
  sequence: number;
  observedAtMs: number;
  expiresAtMs: number;
  state: 'IDLE' | 'RUNNING' | 'STOPPED';
}
const fields: readonly (keyof AgentPresencePayload)[] = Object.freeze([
  'schemaVersion', 'collectorId', 'tenantId', 'agentId', 'instanceId', 'definitionId',
  'providerId', 'modelId', 'masterPlanSha256', 'sourceCommit', 'sequence',
  'observedAtMs', 'expiresAtMs', 'state',
]);
const identity = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(v);
const epoch = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const hex = (v: unknown, length: number): v is string => typeof v === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(v);
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
function isPayload(v: unknown): v is AgentPresencePayload {
  if (!object(v) || Object.keys(v).length !== fields.length || !fields.every(k => Object.hasOwn(v, k))) return false;
  return v.schemaVersion === 1 && hex(v.collectorId, 32)
    && ['tenantId', 'agentId', 'instanceId', 'definitionId', 'providerId', 'modelId'].every(k => identity(v[k]))
    && hex(v.masterPlanSha256, 64) && hex(v.sourceCommit, 40)
    && epoch(v.sequence) && v.sequence > 0 && epoch(v.observedAtMs) && epoch(v.expiresAtMs)
    && ['IDLE', 'RUNNING', 'STOPPED'].includes(v.state as string);
}
/** Fixed field-order encoding plus protocol domain separation. No private key is handled here. */
export function agentPresenceSigningBytes(payload: AgentPresencePayload): Buffer {
  if (!isPayload(payload)) throw new Error('invalid presence payload');
  return Buffer.from('XIV_AGENT_PRESENCE_V1\0' + JSON.stringify(fields.map(k => payload[k])), 'utf8');
}
type Registered = { config: Readonly<AgentPresenceEnrollment>; key: KeyObject; revoked: boolean; last?: Readonly<AgentPresencePayload> };

/**
 * Construct only from operator-controlled enrollment configuration and catalog IDs.
 * Do not accept enrollment or public keys from heartbeat messages. No network API is installed.
 * A new random collector challenge invalidates all prior-run receipts after restart.
 */
export class AgentPresenceCensus {
  readonly collectorId = randomBytes(16).toString('hex');
  readonly tenantId: string;
  private readonly registrations = new Map<string, Registered>();
  private readonly clock: () => number;
  private lastClock = -1;
  private readonly definitionCount: number;

  constructor(input: { tenantId: string; definitionIds: readonly string[]; enrollments: readonly AgentPresenceEnrollment[]; clock?: () => number }) {
    if (!identity(input.tenantId) || !Array.isArray(input.definitionIds) || !Array.isArray(input.enrollments)) throw new Error('invalid census configuration');
    if (input.definitionIds.length > 10_000 || input.enrollments.length > AGENT_PRESENCE_LIMITS.maxInstances) throw new Error('census capacity exceeded');
    const definitions = new Set(input.definitionIds);
    if (definitions.size !== input.definitionIds.length || !input.definitionIds.every(identity)) throw new Error('invalid or duplicate definition IDs');
    this.tenantId = input.tenantId; this.definitionCount = definitions.size; this.clock = input.clock ?? Date.now;
    const now = this.now();
    for (const c of input.enrollments) {
      if (!c || ![c.agentId, c.instanceId, c.definitionId, c.providerId, c.modelId].every(identity)
        || !definitions.has(c.definitionId) || !hex(c.masterPlanSha256, 64) || !hex(c.sourceCommit, 40)
        || !epoch(c.expiresAtMs) || c.expiresAtMs <= now || this.registrations.has(c.instanceId)
        || typeof c.publicKeyPem !== 'string' || c.publicKeyPem.length > 2048
        || !c.publicKeyPem.startsWith('-----BEGIN PUBLIC KEY-----')) throw new Error('invalid enrollment');
      const key = createPublicKey(c.publicKeyPem);
      if (key.type !== 'public' || key.asymmetricKeyType !== 'ed25519') throw new Error('Ed25519 public key required');
      this.registrations.set(c.instanceId, { config: Object.freeze({ ...c }), key, revoked: false });
    }
  }
  private now(): number {
    const value = this.clock();
    if (!epoch(value) || value < this.lastClock) throw new Error('invalid or backward census clock');
    this.lastClock = value; return value;
  }
  /** Reject malformed, forged, stale, cross-scope and replayed reports without logging input. */
  accept(raw: string): boolean {
    const now = this.now();
    if (typeof raw !== 'string' || Buffer.byteLength(raw, 'utf8') > AGENT_PRESENCE_LIMITS.maxReceiptBytes) return false;
    try {
      const envelope: unknown = JSON.parse(raw);
      if (!object(envelope) || Object.keys(envelope).length !== 2 || !Object.hasOwn(envelope, 'payload')
        || !Object.hasOwn(envelope, 'signatureHex') || !isPayload(envelope.payload) || !hex(envelope.signatureHex, 128)) return false;
      const p = envelope.payload; const r = this.registrations.get(p.instanceId);
      if (!r || r.revoked || r.config.expiresAtMs <= now || p.collectorId !== this.collectorId || p.tenantId !== this.tenantId) return false;
      const bound = ['agentId', 'instanceId', 'definitionId', 'providerId', 'modelId', 'masterPlanSha256', 'sourceCommit'] as const;
      if (r.last?.state === 'STOPPED' || !bound.every(k => p[k] === r.config[k]) || p.sequence <= (r.last?.sequence ?? 0)
        || p.observedAtMs > now || p.expiresAtMs <= now || p.expiresAtMs <= p.observedAtMs
        || p.expiresAtMs - p.observedAtMs > AGENT_PRESENCE_LIMITS.maxTtlMs
        || p.expiresAtMs > r.config.expiresAtMs || (r.last && p.observedAtMs < r.last.observedAtMs)) return false;
      if (!verify(null, agentPresenceSigningBytes(p), r.key, Buffer.from(envelope.signatureHex, 'hex'))) return false;
      r.last = Object.freeze({ ...p }); return true;
    } catch { return false; }
  }
  /** Operator-only lifecycle action; this class must not be exposed directly to untrusted clients. */
  revoke(instanceId: string): void {
    const r = this.registrations.get(instanceId);
    if (!r) throw new Error('unknown enrolled instance');
    r.revoked = true;
  }
  snapshot() {
    const now = this.now();
    const instances = [...this.registrations.values()].map(r => {
      const state = r.revoked ? 'REVOKED' : r.config.expiresAtMs <= now ? 'ENROLLMENT_EXPIRED'
        : !r.last ? 'UNOBSERVED' : r.last.expiresAtMs <= now ? 'STALE' : r.last.state;
      return Object.freeze({ agentId: r.config.agentId, instanceId: r.config.instanceId, definitionId: r.config.definitionId,
        state, lastObservedAtMs: r.last?.observedAtMs ?? null, sequence: r.last?.sequence ?? null });
    });
    const count = (states: readonly string[]) => instances.filter(i => states.includes(i.state)).length;
    const current = count(['IDLE', 'RUNNING', 'STOPPED']);
    const complete = instances.length > 0 && current === instances.length;
    return Object.freeze({ scope: 'THIS_TENANT_AND_EXPLICIT_ENROLLMENTS', tenantId: this.tenantId, observedAtMs: now,
      catalogDefinitionCount: this.definitionCount, enrolledInstanceCount: instances.length, freshReportingInstanceCount: current,
      reportedRunningInstanceCount: count(['RUNNING']), reportedIdleInstanceCount: count(['IDLE']),
      scopedRunningInstanceCount: complete ? count(['RUNNING']) : null,
      totalLiveAgents: null, telemetryCompleteForScope: complete, instances: Object.freeze(instances),
      assurance: 'ENROLLED_REPORTER_SIGNATURE_NOT_EXECUTION_ATTESTATION',
      executionClaimsVerified: false, providerIdentityAttested: false, offlineExecutionAttested: false,
      productionAuthorityGranted: false, privateDataAuthorityGranted: false, learningPromoted: false });
  }
}
