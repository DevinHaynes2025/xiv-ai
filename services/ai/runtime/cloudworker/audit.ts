/**
 * Audit trail for LA-02 cloud worker actions.
 */

export type CloudWorkerAuditEvent = {
  eventId: string;
  at: string;
  kind:
    | 'WORKER_START'
    | 'WORKER_CRASH'
    | 'WORKER_RECOVER'
    | 'SCHEDULE_ASSIGN'
    | 'NIGHT_SHIFT_DENY'
    | 'DLQ'
    | 'COST_DENY'
    | 'DEPLOY_BLOCKED'
    | 'SECURITY_DENIED'
    | 'OFFLINE_FOUNDER_TEST';
  workerId?: string;
  missionId?: string;
  detail: string;
  l4Enabled: false;
  productionLive: false;
};

export type CloudWorkerAuditLog = {
  events: CloudWorkerAuditEvent[];
};

export function openCloudWorkerAuditLog(): CloudWorkerAuditLog {
  return { events: [] };
}

export function appendAudit(
  log: CloudWorkerAuditLog,
  event: Omit<CloudWorkerAuditEvent, 'l4Enabled' | 'productionLive'>,
): CloudWorkerAuditEvent {
  const row: CloudWorkerAuditEvent = {
    ...event,
    l4Enabled: false,
    productionLive: false,
  };
  log.events.push(row);
  return row;
}

export function auditAllowsSilentProd(_log: CloudWorkerAuditLog): false {
  return false;
}
