/**
 * 62L-EM D — Agent Runtime Heartbeat API
 *
 * Contract for offline-agent runtime heartbeats.
 * Missing / stale → WAITING_NODE / OFFLINE_STOPPED (never claim RUNNING_VERIFIED).
 * Soft-wires EL classifyHeartbeat freshness rules.
 */

import type { RuntimeHeartbeat } from './types';
import { classifyHeartbeat, DEFAULT_HEARTBEAT_STALE_MS } from './runtime-state';
import { EM_LOCKS } from './honesty';

export type HeartbeatApiRequest = {
  nodeId: string;
  observedAt?: string | null;
  running?: boolean | null;
  /** Optional sequence / generation for idempotent updates. */
  sequence?: number;
  /** Opaque agent enrollment id — not proof of work while offline. */
  enrollmentId?: string;
};

export type HeartbeatApiResponse = {
  ok: boolean;
  heartbeat: RuntimeHeartbeat;
  agentsMayClaimWorking: boolean;
  offlinePolicy: {
    missingOrStaleMeansWaitingOrStopped: true;
    agentsWorkingWhileNodeOff: false;
    runningVerifiedRequiresFreshEvidence: true;
  };
  httpStatusHint: 200 | 409 | 503;
};

export type HeartbeatStoreRecord = HeartbeatApiRequest & {
  receivedAt: string;
};

/** In-memory heartbeat registry for local/offline agent runtime (not durable prod store). */
export class AgentRuntimeHeartbeatApi {
  private readonly records = new Map<string, HeartbeatStoreRecord>();
  private readonly staleAfterMs: number;

  constructor(staleAfterMs = DEFAULT_HEARTBEAT_STALE_MS) {
    this.staleAfterMs = staleAfterMs;
  }

  /** POST /heartbeat — ingest a node heartbeat. */
  postHeartbeat(request: HeartbeatApiRequest, now = new Date()): HeartbeatApiResponse {
    if (!request.nodeId?.trim()) {
      const heartbeat = classifyHeartbeat(
        { nodeId: '', observedAt: null, running: false },
        now,
        this.staleAfterMs,
      );
      return this.wrap(heartbeat, 409);
    }

    const existing = this.records.get(request.nodeId);
    if (
      existing &&
      typeof request.sequence === 'number' &&
      typeof existing.sequence === 'number' &&
      request.sequence < existing.sequence
    ) {
      const heartbeat = classifyHeartbeat(existing, now, this.staleAfterMs);
      return this.wrap(heartbeat, 409);
    }

    const record: HeartbeatStoreRecord = {
      ...request,
      receivedAt: now.toISOString(),
    };
    this.records.set(request.nodeId, record);
    const heartbeat = classifyHeartbeat(record, now, this.staleAfterMs);
    return this.wrap(heartbeat, 200);
  }

  /** GET /heartbeat/:nodeId — read classified state. */
  getHeartbeat(nodeId: string, now = new Date()): HeartbeatApiResponse {
    const record = this.records.get(nodeId);
    if (!record) {
      const heartbeat = classifyHeartbeat(
        { nodeId, observedAt: null, running: null },
        now,
        this.staleAfterMs,
      );
      // Missing → WAITING_NODE / UNKNOWN — treat as not running.
      const normalized: RuntimeHeartbeat =
        heartbeat.state === 'UNKNOWN'
          ? {
              ...heartbeat,
              state: 'WAITING_NODE',
              detail: 'No heartbeat recorded — WAITING_NODE (offline agents must not claim work).',
            }
          : heartbeat;
      return this.wrap(normalized, 503);
    }
    const heartbeat = classifyHeartbeat(record, now, this.staleAfterMs);
    const status: 200 | 503 =
      heartbeat.state === 'RUNNING_VERIFIED' ? 200 : 503;
    return this.wrap(heartbeat, status);
  }

  listNodes(now = new Date()): HeartbeatApiResponse[] {
    return [...this.records.keys()].map((nodeId) => this.getHeartbeat(nodeId, now));
  }

  private wrap(heartbeat: RuntimeHeartbeat, httpStatusHint: 200 | 409 | 503): HeartbeatApiResponse {
    const agentsMayClaimWorking =
      heartbeat.state === 'RUNNING_VERIFIED' && EM_LOCKS.AGENTS_WORKING_WHILE_NODE_OFF === false;
    return {
      ok: httpStatusHint === 200 && heartbeat.state === 'RUNNING_VERIFIED',
      heartbeat,
      agentsMayClaimWorking: agentsMayClaimWorking && heartbeat.state === 'RUNNING_VERIFIED',
      offlinePolicy: {
        missingOrStaleMeansWaitingOrStopped: true,
        agentsWorkingWhileNodeOff: EM_LOCKS.AGENTS_WORKING_WHILE_NODE_OFF,
        runningVerifiedRequiresFreshEvidence: true,
      },
      httpStatusHint,
    };
  }
}

export function createHeartbeatApi(staleAfterMs?: number) {
  return new AgentRuntimeHeartbeatApi(staleAfterMs);
}
