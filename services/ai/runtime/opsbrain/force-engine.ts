import { conveneTaskForce, taskForceGrantsPermissions } from '../ecosystem/taskforce';
import { boundedAutonomyEnabled } from '../authority';
import { defaultDenyUnknownHandoff } from '../security/firewall';
import type { IncidentSeverity, TaskForceKind } from './command-types';
import { TASK_FORCE_KINDS } from './command-types';

export type TaskForceMember = { memberId: string; permissionsGranted: false };
export type TaskForceAgent = { role: string; permissionsGranted: false };
export type TaskForceObjective = { objectiveId: string };
export type TaskForceScope = { allowed: readonly string[] };
export type TaskForceAuthority = { grantsPermissions: false; grantsL4: false };
export type TaskForceEvidence = { evidenceId: string };
export type TaskForceRecommendation = { recommendationId: string; verifiedByMembership: false };
export type TaskForceDecision = { decisionId: string; humanRequired: true };
export type TaskForceAction = { actionId: string };
export type TaskForceOutcome = { outcomeId: string };
export type TaskForceAudit = { eventId: string };

export type GovernedTaskForce = {
  kind: TaskForceKind;
  tenantId: string;
  universeId: string;
  scope: readonly string[];
  grantsPermissions: false;
  disablesGuardian: false;
  grantsL4: false;
};

export type TaskForce = GovernedTaskForce;

export function conveneGovernedTaskForce(input: {
  kind: TaskForceKind;
  tenantId: string;
  universeId: string;
  members: readonly string[];
  scope?: readonly string[];
}): GovernedTaskForce {
  void TASK_FORCE_KINDS;
  const convened = conveneTaskForce('SUPPLY_DISRUPTION', input.members);
  return {
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    scope: input.scope ?? [input.kind],
    grantsPermissions: taskForceGrantsPermissions(convened),
    disablesGuardian: false,
    grantsL4: false,
  };
}

export function taskForceParticipationGrantsPermission(_force: GovernedTaskForce): false {
  return false;
}

export function agentExpandsTaskForceScope(force: GovernedTaskForce, requestedScope: string) {
  if (!force.scope.includes(requestedScope)) {
    return { allowed: false as const, reason: 'agent_cannot_expand_task_force_scope' };
  }
  return { allowed: true as const, scope: requestedScope };
}

export function taskForceDisablesGuardian(): false {
  void defaultDenyUnknownHandoff();
  return false;
}

export function taskForceGrantsL4(): false {
  void boundedAutonomyEnabled();
  return false;
}

export type IncidentType = TaskForceKind;
export type IncidentScope = { tenantId: string; universeId: string };
export type IncidentCommander = { humanRequired: true };
export type IncidentTaskForce = { forceId: string; grantsPermissions: false };
export type IncidentEvidence = { evidenceId: string };
export type IncidentTimeline = { entries: readonly string[] };
export type IncidentAction = { actionId: string };
export type IncidentApproval = { approved: boolean };
export type IncidentResolution = { resolved: boolean };
export type IncidentPostmortem = { lessonId: string };

export type EnterpriseIncident = {
  incidentId: string;
  severity: IncidentSeverity;
  bypassesGuardian: false;
  bypassesApproval: false;
};

export type Incident = EnterpriseIncident;

export function openIncident(input: { severity: IncidentSeverity; approved?: boolean }) {
  if (input.severity === 'CRITICAL' && input.approved !== true) {
    return { allowed: false as const, reason: 'critical_incident_cannot_bypass_approval' };
  }
  return {
    allowed: true as const,
    incident: {
      incidentId: `inc:${input.severity}`,
      severity: input.severity,
      bypassesGuardian: false as const,
      bypassesApproval: false as const,
    } satisfies EnterpriseIncident,
  };
}

export function criticalIncidentBypassesApproval(): false {
  return false;
}
