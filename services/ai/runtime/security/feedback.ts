import { createId, nowIso } from '../actions';

export type SecurityEventKind =
  | 'credential_attack'
  | 'bot_spike'
  | 'account_takeover'
  | 'tenant_probe'
  | 'agent_abuse'
  | 'prompt_injection'
  | 'tool_injection'
  | 'data_exfiltration'
  | 'malicious_upload'
  | 'stream_abuse'
  | 'api_abuse'
  | 'rate_limit_evasion';

export type SecurityEvent = {
  eventId: string;
  kind: SecurityEventKind;
  stance: 'observed' | 'suspected' | 'projected';
  createdAt: string;
  fabricated: false;
};

export type SecurityLesson = {
  lessonId: string;
  eventId: string;
  summary: string;
  autoEditsPolicy: false;
  createdAt: string;
};

export function recordSecurityEvent(kind: SecurityEventKind, stance: SecurityEvent['stance']): SecurityEvent {
  return {
    eventId: createId('sec'),
    kind,
    stance,
    createdAt: nowIso(),
    fabricated: false,
  };
}

export function recordSecurityLesson(event: SecurityEvent): SecurityLesson {
  return {
    lessonId: createId('sles'),
    eventId: event.eventId,
    summary: `Recorded security lesson for ${event.kind}. Policy remains human-governed.`,
    autoEditsPolicy: false,
    createdAt: nowIso(),
  };
}

export function securityAiMaySelfEditPolicy() {
  return false;
}

export function applySecurityPolicyEditFromEvent() {
  return {
    allowed: false as const,
    reason: 'Security events cannot self-edit security policy: DENY',
  };
}
