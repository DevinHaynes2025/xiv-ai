import type {
  LocationPermission,
  LocationPrecision,
  LocationPurpose,
} from "./types";

export type LocationRequest = {
  permission: LocationPermission;
  requestedPrecision: LocationPrecision;
  purpose?: LocationPurpose;
  agentId: string;
  agentLocationScope: LocationPrecision | "NONE";
  tenantAllowsLocation: boolean;
};

export type LocationObservation = {
  granted: boolean;
  precision?: LocationPrecision;
  latitude?: number;
  longitude?: number;
  denial?: string;
  audited: boolean;
  liveGpsPath: false;
};

export type LocationAuditRecord = {
  agentId: string;
  purpose?: LocationPurpose;
  decision: "granted" | "denied";
  reason: string;
  preciseCoordinatesLogged: false;
};

const audits: LocationAuditRecord[] = [];

export function requestLocation(request: LocationRequest): LocationObservation {
  if (request.permission === "DISABLED") {
    const audit = recordAudit(request, "denied", "gps_denied_without_permission");
    return { granted: false, denial: audit.reason, audited: true, liveGpsPath: false };
  }
  if (!request.purpose) {
    const audit = recordAudit(request, "denied", "gps_denied_without_purpose");
    return { granted: false, denial: audit.reason, audited: true, liveGpsPath: false };
  }
  if (!request.tenantAllowsLocation) {
    const audit = recordAudit(request, "denied", "tenant_policy_denied_location");
    return { granted: false, denial: audit.reason, audited: true, liveGpsPath: false };
  }
  if (request.agentLocationScope === "NONE") {
    const audit = recordAudit(request, "denied", "gps_denied_outside_agent_scope");
    return { granted: false, denial: audit.reason, audited: true, liveGpsPath: false };
  }
  const precision = resolvePrecision(request.permission, request.requestedPrecision, request.agentLocationScope);
  recordAudit(request, "granted", `location_granted_${precision}`);
  return {
    granted: true,
    precision,
    latitude: precision === "PRECISE" ? 37.3349 : 37.3,
    longitude: precision === "PRECISE" ? -122.009 : -122.0,
    audited: true,
    liveGpsPath: false,
  };
}

function resolvePrecision(
  permission: LocationPermission,
  requested: LocationPrecision,
  agentScope: LocationPrecision,
): LocationPrecision {
  if (agentScope === "APPROXIMATE" || requested === "APPROXIMATE") {
    return "APPROXIMATE";
  }
  return "PRECISE";
}

export function preciseGpsExposed(observation: LocationObservation): boolean {
  return observation.granted === true && observation.precision === "PRECISE";
}

export function locationAccessAudited(agentId?: string): boolean {
  return agentId ? audits.some((row) => row.agentId === agentId) : audits.length > 0;
}

export function locationAudits(): readonly LocationAuditRecord[] {
  return audits;
}

export function locationServiceLive(): false {
  return false;
}

function recordAudit(
  request: LocationRequest,
  decision: "granted" | "denied",
  reason: string,
): LocationAuditRecord {
  const record: LocationAuditRecord = {
    agentId: request.agentId,
    purpose: request.purpose,
    decision,
    reason,
    preciseCoordinatesLogged: false,
  };
  audits.push(record);
  return record;
}
