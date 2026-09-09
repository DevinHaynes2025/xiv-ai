import { createId, nowIso } from '../actions';

export type RuntimeEventType =
  | 'business.data.updated'
  | 'business.event.detected'
  | 'agent.task.created'
  | 'agent.task.completed'
  | 'agent.failed'
  | 'agent.policy.denied'
  | 'security.signal'
  | 'security.incident'
  | 'live.started'
  | 'live.ended'
  | 'case.created'
  | 'outcome.measured';

export type RuntimeEvent = {
  eventId: string;
  type: RuntimeEventType;
  correlationId: string;
  tenant: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

export function createEventBus() {
  const events: RuntimeEvent[] = [];
  return {
    infrastructure: 'in_memory_abstraction' as const,
    publish(input: Omit<RuntimeEvent, 'eventId' | 'createdAt'> & { eventId?: string }) {
      if (!input.correlationId) {
        throw new Error('Event bus requires a correlationId.');
      }
      const event: RuntimeEvent = {
        ...input,
        eventId: input.eventId ?? createId('bus'),
        createdAt: nowIso(),
      };
      events.push(event);
      return event;
    },
    list() {
      return [...events];
    },
  };
}

export function eventHasCorrelationId(event: Pick<RuntimeEvent, 'correlationId'>) {
  return Boolean(event.correlationId);
}
