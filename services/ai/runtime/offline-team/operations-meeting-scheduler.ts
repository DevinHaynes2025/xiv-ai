import type { WorkRole } from './team-task-meeting-orchestrator';

export interface OperationsMeetingPlan {
  meetingId: string;
  tenantId: string;
  objective: string;
  scheduledFor: string;
  ownerRole: WorkRole;
  roles: WorkRole[];
  evidenceRefs: string[];
  agenda: string[];
}

export interface OperationsMeetingDecision {
  decisionId: string;
  summary: string;
  ownerRole: WorkRole;
  evidenceRefs: string[];
  productionImpact: boolean;
  humanApproved: boolean;
}

export interface OperationsMeetingOutcome {
  meetingId: string;
  tenantId: string;
  heldAt: string;
  minutes: string[];
  decisions: OperationsMeetingDecision[];
  dissent: string[];
  followUpTaskIds: string[];
}

export interface OperationsMeetingReceipt {
  meetingId: string;
  tenantId: string;
  participantCount: number;
  evidenceCount: number;
  dissentCount: number;
  pendingHumanApprovalCount: number;
  measuredAt: string;
}

export class OperationsMeetingScheduler {
  private plans = new Map<string, OperationsMeetingPlan>();
  private outcomes = new Map<string, OperationsMeetingOutcome>();

  schedule(plan: OperationsMeetingPlan) {
    if (!plan.meetingId || !plan.tenantId || !plan.objective) throw new Error('meeting id/tenant/objective required');
    if (plan.roles.length < 2 || plan.roles.length > 8) throw new Error('operations meetings require 2-8 active roles');
    if (!plan.roles.includes(plan.ownerRole)) throw new Error('meeting owner must be an active participant');
    if (!plan.evidenceRefs.length) throw new Error('meeting evidence required');
    if (!plan.agenda.length) throw new Error('meeting agenda required');
    if (Number.isNaN(Date.parse(plan.scheduledFor))) throw new Error('valid meeting schedule required');
    this.plans.set(plan.meetingId, plan);
    return plan;
  }

  recordOutcome(outcome: OperationsMeetingOutcome) {
    const plan = this.plans.get(outcome.meetingId);
    if (!plan || plan.tenantId !== outcome.tenantId) throw new Error('matching meeting plan required');
    if (!outcome.minutes.length) throw new Error('meeting minutes required');
    for (const decision of outcome.decisions) {
      if (!plan.roles.includes(decision.ownerRole)) throw new Error('decision owner must be a meeting participant');
      if (!decision.evidenceRefs.length) throw new Error('decision evidence required');
    }
    this.outcomes.set(outcome.meetingId, outcome);
    return outcome;
  }

  actionableDecisions(meetingId: string) {
    const outcome = this.outcomes.get(meetingId);
    if (!outcome) return [];
    return outcome.decisions.filter(decision => !decision.productionImpact || decision.humanApproved);
  }

  pendingHumanApprovals(meetingId: string) {
    const outcome = this.outcomes.get(meetingId);
    if (!outcome) return [];
    return outcome.decisions.filter(decision => decision.productionImpact && !decision.humanApproved);
  }

  receipt(meetingId: string): OperationsMeetingReceipt {
    const plan = this.plans.get(meetingId);
    const outcome = this.outcomes.get(meetingId);
    if (!plan || !outcome) throw new Error('completed meeting plan and outcome required');
    return {
      meetingId,
      tenantId: plan.tenantId,
      participantCount: plan.roles.length,
      evidenceCount: plan.evidenceRefs.length + outcome.decisions.reduce((sum, decision) => sum + decision.evidenceRefs.length, 0),
      dissentCount: outcome.dissent.length,
      pendingHumanApprovalCount: this.pendingHumanApprovals(meetingId).length,
      measuredAt: new Date().toISOString(),
    };
  }
}

export const OPERATIONS_MEETING_GUARDRAILS = {
  minimumActiveRoles: 2,
  maximumActiveRoles: 8,
  preserveMinutes: true,
  preserveDissent: true,
  decisionsRequireEvidence: true,
  productionImpactRequiresHumanApproval: true,
};
