/**
 * 62L-ES-HC4 — Message bus for agent/task orchestration.
 *
 * Tenant/Universe isolation on all publishes and subscriptions.
 * No cross-tenant pooling. Guardian/RLS unchanged.
 */

import { createHash } from 'node:crypto';
import {
  HC4_LOCKS,
  scopesMatch,
  type Hc4Actor,
  type TenantScope,
} from './types.ts';

export type BusMessageKind =
  | 'task_dispatch'
  | 'task_result'
  | 'route_decision'
  | 'receipt'
  | 'acceleration_plan'
  | 'heartbeat'
  | 'denial';

export type BusMessage = {
  messageId: string;
  kind: BusMessageKind;
  topic: string;
  payload: Readonly<Record<string, unknown>>;
  scope: TenantScope;
  fromActorId: string;
  createdAt: string;
  correlationId?: string;
};

export type BusPublishResult =
  | { published: true; message: BusMessage }
  | {
      published: false;
      denied: true;
      state: 'DENIED';
      reason: string;
    };

export type MessageBus = {
  publish(input: {
    actor: Hc4Actor;
    kind: BusMessageKind;
    topic: string;
    payload: Readonly<Record<string, unknown>>;
    correlationId?: string;
  }): BusPublishResult;
  subscribe(input: {
    actor: Hc4Actor;
    topic: string;
  }): readonly BusMessage[];
  /** Peek without tenant match — always denied (isolation probe). */
  attemptCrossTenantRead(input: {
    actor: Hc4Actor;
    foreignScope: TenantScope;
    topic: string;
  }): {
    denied: true;
    state: 'DENIED';
    reason: string;
  };
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createMessageBus(): MessageBus {
  const inbox: BusMessage[] = [];

  return {
    publish(input) {
      if (HC4_LOCKS.CROSS_TENANT_POOLING) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_CROSS_TENANT_POOLING_MUST_BE_FALSE',
        };
      }
      if (HC4_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE) {
        return {
          published: false,
          denied: true,
          state: 'DENIED',
          reason: 'LOCK_VIOLATION_GUARDIAN_RLS_BYPASS_MUST_BE_FALSE',
        };
      }

      const scope: TenantScope = {
        orgId: input.actor.orgId,
        tenantId: input.actor.tenantId,
        universeId: input.actor.universeId,
      };

      const message: BusMessage = {
        messageId: `msg-${sha256(
          `${input.topic}:${input.kind}:${nowIso()}:${input.actor.id}`,
        )}`,
        kind: input.kind,
        topic: input.topic,
        payload: input.payload,
        scope,
        fromActorId: input.actor.id,
        createdAt: nowIso(),
        correlationId: input.correlationId,
      };
      inbox.push(message);
      return { published: true, message };
    },

    subscribe(input) {
      const scope: TenantScope = {
        orgId: input.actor.orgId,
        tenantId: input.actor.tenantId,
        universeId: input.actor.universeId,
      };
      return inbox.filter(
        (m) => m.topic === input.topic && scopesMatch(m.scope, scope),
      );
    },

    attemptCrossTenantRead(input) {
      void input;
      return {
        denied: true,
        state: 'DENIED',
        reason:
          'GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION — cross-tenant message bus read denied.',
      };
    },
  };
}
