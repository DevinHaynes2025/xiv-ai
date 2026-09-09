import { createId, nowIso } from '../actions';
import type { Incident, IncidentStatus } from './types';

export function createIncident(input: Omit<Incident, 'incidentId' | 'detectedAt' | 'containedAt' | 'resolvedAt'> & {
  incidentId?: string;
  detectedAt?: string;
}): Incident {
  return {
    ...input,
    incidentId: input.incidentId ?? createId('inc'),
    detectedAt: input.detectedAt ?? nowIso(),
    containedAt: null,
    resolvedAt: null,
  };
}

export function advanceIncident(incident: Incident, status: IncidentStatus): Incident {
  return {
    ...incident,
    status,
    containedAt: status === 'contained' || status === 'recovering' || status === 'resolved' ? incident.containedAt ?? nowIso() : incident.containedAt,
    resolvedAt: status === 'resolved' || status === 'postmortem' ? nowIso() : incident.resolvedAt,
  };
}
