import { createId, nowIso } from '../actions';
import { sanitizeAuditText, stripSignedUrlSecrets } from '../audit-access';

export type TraceStage =
  | 'request'
  | 'policy'
  | 'agent'
  | 'handoff'
  | 'tool'
  | 'gateway'
  | 'result'
  | 'evaluation';

export type RuntimeTraceEvent = {
  eventId: string;
  correlationId: string;
  stage: TraceStage;
  summary: string;
  timestamp: string;
};

export function createCorrelationId() {
  return createId('cor');
}

export function recordTrace(input: {
  correlationId: string;
  stage: TraceStage;
  summary: string;
}): RuntimeTraceEvent {
  return {
    eventId: createId('trc'),
    correlationId: input.correlationId,
    stage: input.stage,
    summary: sanitizeAuditText(stripSignedUrlSecrets(input.summary)),
    timestamp: nowIso(),
  };
}

export function summarizeTrace(events: readonly RuntimeTraceEvent[]) {
  return events.map((event) => `${event.stage}:${event.summary}`).join(' → ');
}
