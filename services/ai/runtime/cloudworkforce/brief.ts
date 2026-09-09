/**
 * FounderShiftBrief aggregation — morning delivery address only.
 * Gmail send remains NOT_CONFIGURED until proven. Twin is not authority.
 * Architecture ≠ 24/7 LIVE.
 */

import type { AdapterLifecycle, ComputeGovernorLevel, FounderShiftBrief } from './types';
import { FOUNDER_BRIEF_EMAIL } from './types';

export function createFounderShiftBrief(input: {
  briefId: string;
  shiftId: string;
  generatedAt: string;
  missionsCompleted?: readonly string[];
  missionsFailed?: readonly string[];
  quarantined?: readonly string[];
  checkpoints?: readonly string[];
  handoffs?: readonly string[];
  securityDenials?: readonly string[];
  budgetAlerts?: readonly string[];
  lessons?: readonly string[];
  humanDecisionsRequired?: readonly string[];
  computePressure?: ComputeGovernorLevel;
  deliveryLifecycle?: AdapterLifecycle;
}): FounderShiftBrief {
  return {
    briefId: input.briefId,
    shiftId: input.shiftId,
    generatedAt: input.generatedAt,
    deliveryEmail: FOUNDER_BRIEF_EMAIL,
    deliveryLifecycle: input.deliveryLifecycle ?? 'NOT_CONFIGURED',
    sections: {
      missionsCompleted: input.missionsCompleted ?? [],
      missionsFailed: input.missionsFailed ?? [],
      quarantined: input.quarantined ?? [],
      checkpoints: input.checkpoints ?? [],
      handoffs: input.handoffs ?? [],
      securityDenials: input.securityDenials ?? [],
      budgetAlerts: input.budgetAlerts ?? [],
      lessons: input.lessons ?? [],
      humanDecisionsRequired: input.humanDecisionsRequired ?? [],
      computePressure: input.computePressure ?? 'NORMAL',
    },
    twinIsAuthority: false,
    productionDeployedOvernight: false,
    agentsRan24x7Live: false,
  };
}

export function founderBriefDeliveryEmail(): typeof FOUNDER_BRIEF_EMAIL {
  return FOUNDER_BRIEF_EMAIL;
}

export function founderBriefGmailIsLive(_brief: FounderShiftBrief): false {
  return false;
}

export function founderTwinIsDeliveryAuthority(): false {
  return false;
}

export function agentsRan24x7LiveClaim(_brief: FounderShiftBrief): false {
  return false;
}
