/**
 * Bounded multi-agent society meetings — thin energy-aware wrapper over agentmeetings concepts.
 * Consequential actions requireApproval. Meeting ≠ authority. Energy exhaustion stops the meeting.
 */

import {
  chargeEnergy,
  createEnergyBudget,
  isEnergyExhausted,
  type EnergyBudget,
} from './energy';

export type SocietyMeetingStatus = 'OPEN' | 'PAUSED' | 'STOPPED_ENERGY' | 'CLOSED' | 'AWAITING_APPROVAL';

export type SocietyAgendaItem = {
  itemId: string;
  title: string;
  /** Estimated energy units for this agenda item. */
  estimatedCost: number;
  consequential: boolean;
};

export type SocietyMeeting = {
  meetingId: string;
  organizationId: string;
  universeId: string;
  title: string;
  agenda: readonly SocietyAgendaItem[];
  participantIds: readonly string[];
  turnLimit: number;
  turnsUsed: number;
  status: SocietyMeetingStatus;
  energy: EnergyBudget;
  requiresApprovalForConsequential: true;
  meetingEqualsAuthority: false;
  l4Enabled: false;
  productionLive: false;
};

export type SocietyTurnResult =
  | { ok: true; meeting: SocietyMeeting; charged: number }
  | {
      ok: false;
      reason:
        | 'turn_limit_reached'
        | 'energy_budget_exhausted'
        | 'meeting_not_open'
        | 'consequential_requires_approval';
      audited: true;
      meeting: SocietyMeeting;
    };

const DEFAULT_TURN_COST = 1;

export function estimateMeetingEnergyCost(agenda: readonly SocietyAgendaItem[]): number {
  return agenda.reduce((sum, item) => sum + Math.max(0, item.estimatedCost), 0);
}

export function createSocietyMeeting(input: {
  meetingId: string;
  organizationId: string;
  universeId: string;
  title: string;
  agenda: readonly SocietyAgendaItem[];
  participantIds: readonly string[];
  turnLimit: number;
  energyCeiling?: number;
}): SocietyMeeting {
  const estimated = estimateMeetingEnergyCost(input.agenda);
  const ceiling = input.energyCeiling ?? Math.max(estimated, 1);
  return {
    meetingId: input.meetingId,
    organizationId: input.organizationId,
    universeId: input.universeId,
    title: input.title,
    agenda: input.agenda,
    participantIds: input.participantIds,
    turnLimit: Math.max(1, input.turnLimit),
    turnsUsed: 0,
    status: 'OPEN',
    energy: createEnergyBudget({
      budgetId: 'energy:' + input.meetingId,
      organizationId: input.organizationId,
      universeId: input.universeId,
      ceiling,
    }),
    requiresApprovalForConsequential: true,
    meetingEqualsAuthority: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function runSocietyTurn(
  meeting: SocietyMeeting,
  input: { cost?: number; consequential?: boolean; approved?: boolean } = {},
): SocietyTurnResult {
  if (meeting.status !== 'OPEN') {
    return { ok: false, reason: 'meeting_not_open', audited: true, meeting };
  }
  if (meeting.turnsUsed >= meeting.turnLimit) {
    return {
      ok: false,
      reason: 'turn_limit_reached',
      audited: true,
      meeting: { ...meeting, status: 'CLOSED' },
    };
  }
  if (input.consequential && !input.approved) {
    return {
      ok: false,
      reason: 'consequential_requires_approval',
      audited: true,
      meeting: { ...meeting, status: 'AWAITING_APPROVAL' },
    };
  }
  if (isEnergyExhausted(meeting.energy)) {
    return {
      ok: false,
      reason: 'energy_budget_exhausted',
      audited: true,
      meeting: { ...meeting, status: 'STOPPED_ENERGY' },
    };
  }
  const cost = input.cost ?? DEFAULT_TURN_COST;
  const charged = chargeEnergy(meeting.energy, cost);
  if (!charged.ok) {
    return {
      ok: false,
      reason: 'energy_budget_exhausted',
      audited: true,
      meeting: { ...meeting, status: 'STOPPED_ENERGY', energy: charged.budget },
    };
  }
  const next: SocietyMeeting = {
    ...meeting,
    turnsUsed: meeting.turnsUsed + 1,
    energy: charged.budget,
    status: meeting.turnsUsed + 1 >= meeting.turnLimit ? 'CLOSED' : 'OPEN',
    requiresApprovalForConsequential: true,
    meetingEqualsAuthority: false,
    l4Enabled: false,
    productionLive: false,
  };
  return { ok: true, meeting: next, charged: cost };
}

export function stopMeetingOnEnergyExhaustion(meeting: SocietyMeeting): SocietyMeeting {
  return {
    ...meeting,
    status: 'STOPPED_ENERGY',
    meetingEqualsAuthority: false,
    l4Enabled: false,
    productionLive: false,
    requiresApprovalForConsequential: true,
  };
}

export function meetingEqualsAuthority(): false {
  return false;
}

export function societyL4Enabled(): false {
  return false;
}
