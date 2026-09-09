/**
 * Local-first agent message bus.
 * Envelope-based routing with tenant/Universe isolation.
 * No unstructured shared global memory.
 */

import { createHash } from 'node:crypto';
import {
  GOB_LOCKS,
  scopesMatch,
  type DataClass,
  type MessageEnvelope,
  type TenantScope,
} from './types.ts';

export type BusPublishResult =
  | { published: true; message: MessageEnvelope }
  | {
      published: false;
      denied: true;
      state: 'DENIED';
      reason: string;
    };

export type LocalAgentMessageBus = {
  publish(input: {
    scope: TenantScope;
    missionId: string;
    taskId: string;
    parentTaskId?: string | null;
    senderAgentId: string;
    receiverAgentId: string;
    purpose: string;
    dataClass: DataClass;
    payloadType: string;
    payload: Readonly<Record<string, unknown>>;
    evidenceRefs?: readonly string[];
    ttlMs?: number;
  }): BusPublishResult;
  routeTo(input: {
    receiverAgentId: string;
    scope: TenantScope;
  }): readonly MessageEnvelope[];
  acknowledge(input: {
    messageId: string;
    scope: TenantScope;
    ack: 'ACKED' | 'NACKED';
  }): BusPublishResult;
  attemptCrossTenantRead(input: {
    scope: TenantScope;
    foreignScope: TenantScope;
    receiverAgentId: string;
  }): { denied: true; state: 'DENIED'; reason: string };
  listAllForScope(scope: TenantScope): readonly MessageEnvelope[];
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createLocalAgentMessageBus(): LocalAgentMessageBus {
  const inbox: MessageEnvelope[] = [];

  return {
    publish(input) {
      if (GOB_LOCKS.UNSTRUCTURED_SHARED_GLOBAL_MEMORY) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_UNSTRUCTURED_SHARED_GLOBAL_MEMORY',
        };
      }
      if (GOB_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_GUARDIAN_RLS_BYPASS',
        };
      }
      if (GOB_LOCKS.CROSS_TENANT_POOLING) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_CROSS_TENANT_POOLING',
        };
      }
      if (GOB_LOCKS.HIDDEN_COT_PERSISTENCE) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_HIDDEN_COT',
        };
      }
      if (input.payloadType === 'hidden_cot' || input.payloadType === 'chain_of_thought') {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'HIDDEN_COT_PERSISTENCE_FORBIDDEN',
        };
      }

      const createdAt = nowIso();
      const ttlMs = input.ttlMs ?? 3_600_000;
      const expiresAt = new Date(Date.now() + ttlMs).toISOString();
      const body = JSON.stringify({
        missionId: input.missionId,
        taskId: input.taskId,
        sender: input.senderAgentId,
        receiver: input.receiverAgentId,
        tenantId: input.scope.tenantId,
        universeId: input.scope.universeId,
        purpose: input.purpose,
        payloadType: input.payloadType,
        payload: input.payload,
        createdAt,
      });
      const messageId = `msg-${sha256(body).slice(0, 16)}`;
      const message: MessageEnvelope = {
        messageId,
        missionId: input.missionId,
        taskId: input.taskId,
        parentTaskId: input.parentTaskId ?? null,
        senderAgentId: input.senderAgentId,
        receiverAgentId: input.receiverAgentId,
        tenantId: input.scope.tenantId,
        homeUniverseId: input.scope.universeId,
        purpose: input.purpose,
        dataClass: input.dataClass,
        payloadType: input.payloadType,
        payload: input.payload,
        evidenceRefs: input.evidenceRefs ?? [],
        createdAt,
        expiresAt,
        acknowledgement: 'PENDING',
        signatureHash: sha256(body),
      };
      inbox.push(message);
      return { published: true, message };
    },

    routeTo(input) {
      return inbox.filter(
        (m) =>
          m.receiverAgentId === input.receiverAgentId &&
          m.tenantId === input.scope.tenantId &&
          m.homeUniverseId === input.scope.universeId,
      );
    },

    acknowledge(input) {
      const msg = inbox.find((m) => m.messageId === input.messageId);
      if (!msg) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'MESSAGE_NOT_FOUND',
        };
      }
      if (
        msg.tenantId !== input.scope.tenantId ||
        msg.homeUniverseId !== input.scope.universeId
      ) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'TENANT_UNIVERSE_MISMATCH',
        };
      }
      msg.acknowledgement = input.ack;
      return { published: true, message: msg };
    },

    attemptCrossTenantRead(input) {
      void input;
      return {
        denied: true,
        state: 'DENIED',
        reason: 'CROSS_TENANT_READ_DENIED',
      };
    },

    listAllForScope(scope) {
      return inbox.filter(
        (m) =>
          m.tenantId === scope.tenantId &&
          m.homeUniverseId === scope.universeId,
      );
    },
  };
}

export function assertEnvelopeScoped(
  envelope: MessageEnvelope,
  scope: TenantScope,
): boolean {
  return scopesMatch(scope, {
    orgId: scope.orgId,
    tenantId: envelope.tenantId,
    universeId: envelope.homeUniverseId,
  });
}
