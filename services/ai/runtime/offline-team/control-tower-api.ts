/**
 * 12D-115: Governed, read-only, LOOPBACK-ONLY control-tower snapshot API surface.
 *
 * This module is a pure ROUTE CONTRACT: it defines what a snapshot surface may serve and
 * under which guards, without binding a socket. `buildSnapshotServer(deps)` returns a
 * handler that a host MAY bind to 127.0.0.1 — conceptually and by contract — and that
 * refuses any non-loopback remote address at the contract level, before a provider is
 * ever consulted. The surface serves only JSON derived from caller-injected READ-ONLY
 * providers (queueSummary, controlTowerPacket, storageFeedSnapshot); it computes nothing
 * new about the world, exposes zero write routes, and is OFF by default: nothing mounts
 * it anywhere, the handler cannot mount itself, and construction requires an explicit
 * operator authorization receipt ref.
 *
 * HONEST STATE: every payload (success or error) carries humanDecision:'REQUIRED',
 * liveAgentCount:null, modelCalls:0, remoteCalls:0, realEntitiesCreated:0,
 * learningPromoted:false, generatedByModel:false. `realUserStories` is only ever the
 * count passed through from a provider — when a route's provider does not carry one it
 * is null, never 0-by-default, never fabricated. Provider results are validated
 * fail-closed: any malformed, cross-tenant, oversized, or field-inventing result yields
 * a 503 envelope, never a partial or repaired payload.
 */
import { CONTROL_TOWER_GUARDRAILS, CONTROL_TOWER_POLICY } from './control-tower-evidence';
import type { ControlTowerEvidencePacket } from './control-tower-evidence';

export type SnapshotQueueState = 'READY' | 'LEASED' | 'AWAITING_REVIEW' | 'DONE' | 'FAILED';
export type SnapshotQueueStateKey = 'READY' | 'LEASED' | 'AWAITING_REVIEW' | 'DONE' | 'FAILED';

const QUEUE_STATES: readonly SnapshotQueueStateKey[] = ['READY', 'LEASED', 'AWAITING_REVIEW', 'DONE', 'FAILED'];

export const SNAPSHOT_API_POLICY = Object.freeze({
  bindHost: '127.0.0.1' as const,
  autoMounted: false,
  mountedByDefault: false,
  writeRoutes: 0,
  servedRoutes: 4,
  maxRequestPathChars: 256,
  maxOperatorRefChars: 256,
  minOperatorRefChars: 8,
  maxQueueRowsInView: 2_000_000,
  maxArtifactsInView: 1_000_000,
  maxProviderCallsPerRequest: 3,
});

export const SNAPSHOT_API_GUARDRAILS = Object.freeze({
  loopbackOnly: true,
  readOnly: true,
  autoMounted: false,
  mountedByDefault: false,
  canMountItself: false,
  requiresOperatorAuthorizationReceipt: true,
  writeRoutes: 0,
  modelCallsAllowed: 0,
  remoteCallsAllowed: false,
  startsWorkers: false,
  activatesCandidates: false,
  learningPromoted: false,
  humanDecision: 'REQUIRED' as const,
});

export interface QueueSummaryView {
  kind: 'QUEUE_SUMMARY';
  tenantId: string;
  generatedAtMs: number;
  states: Readonly<Record<SnapshotQueueStateKey, number>>;
  realUserStories: number;
  capacityFixtures: number;
}

export type StorageTierCountKey = 'LOCAL' | 'OFFLINE_CARRIER' | 'CLOUD';

export interface StorageFeedView {
  kind: 'STORAGE_FEED_SNAPSHOT';
  tenantId: string;
  generatedAtMs: number;
  artifactsByTier: Readonly<Record<StorageTierCountKey, number>>;
  exportableOffLocalPlane: number;
}

export interface SnapshotProviders {
  /** Read-only queue summary for the bound tenant (e.g. derived from OfflineStoryQueue page counts). */
  queueSummary: () => unknown;
  /** Read-only control-tower evidence packet (12D-107 CONTROL_TOWER_EVIDENCE). */
  controlTowerPacket: () => unknown;
  /** Read-only storage-tier feed snapshot for this tenant. */
  storageFeedSnapshot: () => unknown;
}

export interface SnapshotApiRequest {
  method: string;
  path: string;
  /** Remote address as the host observed it. Missing or non-loopback addresses are refused. */
  remoteAddress: string;
}

export interface SnapshotApiResponse {
  status: number;
  body: Readonly<Record<string, unknown>>;
}

export interface SnapshotApiServer {
  kind: 'CONTROL_TOWER_SNAPSHOT_SERVER';
  bindHost: '127.0.0.1';
  externalInterfaceBound: false;
  /** This surface never mounts itself; mounting is a separate, separately-reviewed host step. */
  mounted: false;
  canMount: false;
  hasOperatorAuthorization: true;
  authorizationReceiptRecorded: true;
  routes: readonly string[];
  operatorAuthorizationReceiptRef: string;
  handle(request: SnapshotApiRequest): SnapshotApiResponse;
}

export const SNAPSHOT_API_ROUTES: readonly string[] = Object.freeze([
  '/control-tower/queue-summary',
  '/control-tower/evidence',
  '/control-tower/storage-feed',
  '/control-tower/snapshot',
]);

const LOOPBACK_ADDRESSES: ReadonlySet<string> = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const nonNegativeMs = (v: unknown): v is number => count(v);

const OPERATOR_REF_BYPASS_VALUES: ReadonlySet<string> = new Set(['none', 'null', 'undefined', 'anonymous', 'bypass', 'omitted', 'skip']);

function operatorReceipt(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error('operator authorization receipt ref required');
  const trimmed = value.trim();
  if (OPERATOR_REF_BYPASS_VALUES.has(trimmed.toLowerCase())) throw new Error('operator authorization receipt ref must be an explicit receipt, not a bypass placeholder');
  if (/\s/.test(trimmed)) throw new Error('operator authorization receipt ref must not contain whitespace');
  if (trimmed.length < SNAPSHOT_API_POLICY.minOperatorRefChars || trimmed.length > SNAPSHOT_API_POLICY.maxOperatorRefChars) {
    throw new Error(`operator authorization receipt ref must be ${SNAPSHOT_API_POLICY.minOperatorRefChars}..${SNAPSHOT_API_POLICY.maxOperatorRefChars} characters`);
  }
  return trimmed;
}

/** Exact-shape check: unexpected or missing fields on a provider view are a fabrication attempt. */
function exactShape(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const own = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (own.length !== expected.length || own.some((k, i) => k !== expected[i])) {
    throw new Error(`${label} has unexpected or missing fields`);
  }
  return value as Record<string, unknown>;
}

function validateTenant(v: unknown, tenantId: string, label: string): void {
  if (v !== tenantId) throw new Error(`cross-tenant ${label} on control-tower snapshot surface`);
}

function validateQueueSummary(value: unknown, tenantId: string): QueueSummaryView {
  const q = exactShape(value, ['kind', 'tenantId', 'generatedAtMs', 'states', 'realUserStories', 'capacityFixtures'], 'queue summary');
  if (q.kind !== 'QUEUE_SUMMARY') throw new Error('unexpected queue summary kind');
  validateTenant(q.tenantId, tenantId, 'queue summary');
  if (!nonNegativeMs(q.generatedAtMs)) throw new Error('queue summary timestamp invalid');
  const states = exactShape(q.states, QUEUE_STATES, 'queue states');
  let total = 0;
  for (const s of QUEUE_STATES) {
    if (!count(states[s])) throw new Error(`queue state count invalid: ${s}`);
    total += states[s];
  }
  if (total > SNAPSHOT_API_POLICY.maxQueueRowsInView) throw new Error('queue summary exceeds the proven row ceiling');
  if (!count(q.realUserStories) || !count(q.capacityFixtures)) throw new Error('queue story counts must be non-negative integers');
  if (q.realUserStories + q.capacityFixtures !== total) throw new Error('queue summary counts are inconsistent; refusing to serve invented stories');
  return q as unknown as QueueSummaryView;
}

const CONTROL_TOWER_PACKET_KEYS: readonly string[] = ['kind', 'tenantId', 'generatedAtMs', 'pathway', 'devices', 'evidenceRefs', 'guardrails'];
const PATHWAY_KEYS: readonly string[] = ['packetsConsidered', 'uniqueStories', 'eligibleNow', 'blocked', 'topBlockReasons', 'humanActionsRequired'];
const DEVICES_KEYS: readonly string[] = ['assessmentsConsidered', 'byState', 'observedLocalWorkers', 'workersStartedByThisSurface'];
const DEVICE_STATES: readonly string[] = [
  'ENROLLED_NOT_ACTIVE', 'ELIGIBLE_FOR_LOCAL_TASKS', 'PAUSED', 'REVOKED', 'EXPIRED', 'UNVERIFIED_COMPATIBILITY',
];

/**
 * Exact-shape, fail-closed validation of a caller-provided CONTROL_TOWER_EVIDENCE packet.
 * A packet with any invented, missing, or inconsistent field is a fabrication attempt and
 * yields provider_invalid — nothing is served (including on the aggregate /snapshot route).
 */
function validateControlTowerPacket(value: unknown, tenantId: string): ControlTowerEvidencePacket {
  const p = exactShape(value, CONTROL_TOWER_PACKET_KEYS, 'control-tower packet');
  if (p.kind !== 'CONTROL_TOWER_EVIDENCE') throw new Error('unexpected control-tower packet kind');
  validateTenant(p.tenantId, tenantId, 'control-tower packet');
  if (!nonNegativeMs(p.generatedAtMs)) throw new Error('control-tower packet timestamp invalid');
  if (JSON.stringify(p.guardrails) !== JSON.stringify(CONTROL_TOWER_GUARDRAILS)) {
    throw new Error('control-tower packet violates control-tower guardrails');
  }
  const pathway = exactShape(p.pathway, PATHWAY_KEYS, 'control-tower pathway view');
  if (!count(pathway.packetsConsidered) || !count(pathway.uniqueStories) || !count(pathway.eligibleNow) || !count(pathway.blocked)) {
    throw new Error('control-tower pathway counts invalid');
  }
  if (pathway.packetsConsidered > CONTROL_TOWER_POLICY.maxPathwayPackets) throw new Error('control-tower pathway view exceeds packet ceiling');
  if (pathway.uniqueStories > pathway.packetsConsidered) throw new Error('control-tower pathway uniqueStories exceeds packetsConsidered');
  if (pathway.eligibleNow + pathway.blocked !== pathway.packetsConsidered) throw new Error('control-tower pathway counts are inconsistent');
  if (!Array.isArray(pathway.topBlockReasons) || pathway.topBlockReasons.length > CONTROL_TOWER_POLICY.maxPathwayPackets) {
    throw new Error('control-tower top block reasons invalid');
  }
  for (const entry of pathway.topBlockReasons) {
    const e = exactShape(entry, ['reason', 'count'], 'control-tower block reason');
    if (typeof e.reason !== 'string' || e.reason.trim().length === 0 || e.reason.length > 256 || !count(e.count)) {
      throw new Error('control-tower block reason invalid');
    }
  }
  if (!Array.isArray(pathway.humanActionsRequired) || pathway.humanActionsRequired.length > CONTROL_TOWER_POLICY.maxPathwayPackets) {
    throw new Error('control-tower human actions list invalid');
  }
  for (const action of pathway.humanActionsRequired) {
    if (typeof action !== 'string' || action.trim().length === 0 || action.length > 256) throw new Error('control-tower human action invalid');
  }
  const devices = exactShape(p.devices, DEVICES_KEYS, 'control-tower device view');
  if (!count(devices.assessmentsConsidered) || !count(devices.observedLocalWorkers)) throw new Error('control-tower device counts invalid');
  if (devices.assessmentsConsidered > CONTROL_TOWER_POLICY.maxDeviceAssessments) throw new Error('control-tower device view exceeds assessment ceiling');
  if (devices.observedLocalWorkers > devices.assessmentsConsidered) throw new Error('control-tower observedLocalWorkers exceeds assessmentsConsidered');
  if (devices.workersStartedByThisSurface !== 0) throw new Error('control-tower surface cannot have started workers');
  const byState = exactShape(devices.byState, DEVICE_STATES, 'control-tower device states');
  let stateTotal = 0;
  for (const s of DEVICE_STATES) {
    if (!count(byState[s])) throw new Error(`control-tower device state count invalid: ${s}`);
    stateTotal += byState[s];
  }
  if (stateTotal !== devices.assessmentsConsidered) throw new Error('control-tower device state counts are inconsistent');
  if (!Array.isArray(p.evidenceRefs) || p.evidenceRefs.length > CONTROL_TOWER_POLICY.maxEvidenceRefs) {
    throw new Error('control-tower evidence refs invalid');
  }
  for (const evidenceRef of p.evidenceRefs) {
    if (typeof evidenceRef !== 'string' || evidenceRef.trim().length === 0 || evidenceRef.length > 256) {
      throw new Error('control-tower evidence ref invalid');
    }
  }
  return value as ControlTowerEvidencePacket;
}

function validateStorageFeed(value: unknown, tenantId: string): StorageFeedView {
  const s = exactShape(value, ['kind', 'tenantId', 'generatedAtMs', 'artifactsByTier', 'exportableOffLocalPlane'], 'storage feed');
  if (s.kind !== 'STORAGE_FEED_SNAPSHOT') throw new Error('unexpected storage feed kind');
  validateTenant(s.tenantId, tenantId, 'storage feed');
  if (!nonNegativeMs(s.generatedAtMs)) throw new Error('storage feed timestamp invalid');
  const byTier = exactShape(s.artifactsByTier, ['LOCAL', 'OFFLINE_CARRIER', 'CLOUD'], 'storage tiers') as Record<StorageTierCountKey, unknown>;
  let total = 0;
  for (const tier of ['LOCAL', 'OFFLINE_CARRIER', 'CLOUD'] as const) {
    if (!count(byTier[tier])) throw new Error(`storage tier count invalid: ${tier}`);
    total += byTier[tier];
  }
  if (total > SNAPSHOT_API_POLICY.maxArtifactsInView) throw new Error('storage feed exceeds the view ceiling');
  if (!count(s.exportableOffLocalPlane)) throw new Error('storage exportable count invalid');
  const cloudCount = byTier.CLOUD;
  if (!count(cloudCount) || s.exportableOffLocalPlane > cloudCount) throw new Error('exportable-off-local count exceeds cloud tier count');
  return s as unknown as StorageFeedView;
}

const HONEST_ERROR_CODES = Object.freeze({
  loopbackRefused: 'loopback_only',
  methodNotAllowed: 'method_not_allowed',
  notFound: 'not_found',
  malformedRequest: 'malformed_request',
  providerInvalid: 'provider_invalid',
});

function honestMeta(realUserStories: number | null) {
  return Object.freeze({
    humanDecision: 'REQUIRED' as const,
    liveAgentCount: null as null,
    realUserStories,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    realEntitiesCreated: 0 as const,
    agentsStarted: 0 as const,
    learningPromoted: false as const,
    generatedByModel: false as const,
    guardrails: SNAPSHOT_API_GUARDRAILS,
  });
}

function okEnvelope(route: string, tenantId: string, generatedAtMs: number, data: unknown, realUserStories: number | null): SnapshotApiResponse {
  return {
    status: 200,
    body: Object.freeze({
      kind: 'CONTROL_TOWER_SNAPSHOT_RESPONSE' as const,
      route, tenantId, generatedAtMs,
      data: Object.freeze(data as Record<string, unknown>),
      ...honestMeta(realUserStories),
    }),
  };
}

function errorEnvelope(route: string, status: number, code: string, message: string): SnapshotApiResponse {
  return {
    status,
    body: Object.freeze({
      kind: 'CONTROL_TOWER_SNAPSHOT_ERROR' as const,
      route,
      error: Object.freeze({ code, message }),
      ...honestMeta(null),
    }),
  };
}

function sanitizePath(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) return 'unparseable';
  return value.length > SNAPSHOT_API_POLICY.maxRequestPathChars ? value.slice(0, SNAPSHOT_API_POLICY.maxRequestPathChars) : value;
}

/**
 * Constructs the snapshot surface. The surface exists ONLY because a human operator's
 * authorization receipt ref was supplied; it binds to 127.0.0.1 conceptually, serves the
 * three read-only providers (plus the aggregate route), and can never mount itself.
 */
export function buildSnapshotServer(input: {
  tenantId: string;
  operatorAuthorizationRef: string;
  providers: SnapshotProviders;
  clock?: () => number;
}): SnapshotApiServer {
  if (!input || !id(input.tenantId)) throw new Error('tenant identity required');
  const receipt = operatorReceipt(input.operatorAuthorizationRef);
  const providers = input.providers;
  if (!providers || typeof providers !== 'object') throw new Error('read-only snapshot providers required');
  const providerKeys = Object.keys(providers).sort();
  if (providerKeys.length !== 3
    || providerKeys[0] !== 'controlTowerPacket' || providerKeys[1] !== 'queueSummary' || providerKeys[2] !== 'storageFeedSnapshot') {
    throw new Error('exactly the three read-only providers are required: queueSummary, controlTowerPacket, storageFeedSnapshot');
  }
  for (const key of providerKeys) {
    if (typeof (providers as unknown as Record<string, unknown>)[key] !== 'function') throw new Error(`provider ${key} must be a read-only function`);
  }
  const clock = input.clock ?? Date.now;
  if (typeof clock !== 'function') throw new Error('clock required');
  const tenantId = input.tenantId;

  const serve = (route: string, read: () => { data: unknown; realUserStories: number | null }): SnapshotApiResponse => {
    try {
      const { data, realUserStories } = read();
      return okEnvelope(route, tenantId, clock(), data, realUserStories);
    } catch {
      // Fail closed: never serve a repaired or partial snapshot.
      return errorEnvelope(route, 503, HONEST_ERROR_CODES.providerInvalid, 'snapshot provider failed validation; nothing was served');
    }
  };

  const server: SnapshotApiServer = {
    kind: 'CONTROL_TOWER_SNAPSHOT_SERVER',
    bindHost: '127.0.0.1' as const,
    externalInterfaceBound: false as const,
    mounted: false as const,
    canMount: false as const,
    hasOperatorAuthorization: true as const,
    authorizationReceiptRecorded: true as const,
    routes: SNAPSHOT_API_ROUTES,
    operatorAuthorizationReceiptRef: receipt,
    handle(request: SnapshotApiRequest): SnapshotApiResponse {
      if (!request || typeof request !== 'object') return errorEnvelope('unparseable', 400, HONEST_ERROR_CODES.malformedRequest, 'malformed request');
      const route = sanitizePath(request.path);
      const remote = request.remoteAddress;
      // Contract-level loopback enforcement, BEFORE any provider is consulted.
      if (typeof remote !== 'string' || !LOOPBACK_ADDRESSES.has(remote)) {
        return errorEnvelope(route, 403, HONEST_ERROR_CODES.loopbackRefused, 'the control-tower snapshot surface is loopback-only; remote addresses are refused');
      }
      if (typeof request.method !== 'string' || request.method !== 'GET') {
        return errorEnvelope(route, 405, HONEST_ERROR_CODES.methodNotAllowed, 'the snapshot surface is read-only: GET only');
      }
      const readQueue = () => {
        const q = validateQueueSummary(providers.queueSummary(), tenantId);
        return { data: q, realUserStories: q.realUserStories };
      };
      switch (route) {
        case '/control-tower/queue-summary':
          return serve(route, readQueue);
        case '/control-tower/evidence':
          return serve(route, () => ({ data: validateControlTowerPacket(providers.controlTowerPacket(), tenantId), realUserStories: null }));
        case '/control-tower/storage-feed':
          return serve(route, () => ({ data: validateStorageFeed(providers.storageFeedSnapshot(), tenantId), realUserStories: null }));
        case '/control-tower/snapshot':
          return serve(route, () => {
            const q = readQueue();
            return {
              data: {
                queue: q.data,
                controlTower: validateControlTowerPacket(providers.controlTowerPacket(), tenantId),
                storageFeed: validateStorageFeed(providers.storageFeedSnapshot(), tenantId),
              },
              realUserStories: q.realUserStories,
            };
          });
        default:
          return errorEnvelope(route, 404, HONEST_ERROR_CODES.notFound, 'not a control-tower snapshot route');
      }
    },
  };
  return Object.freeze(server);
}