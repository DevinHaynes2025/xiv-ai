/**
 * Agent data gathering — authorized sources only.
 */

export type GatherRequest = {
  sourceAuthorized: boolean;
  purpose?: string;
  classification?: string;
  guardianApproved: boolean;
  inventsMissingData?: boolean;
};

export type GatherDecision =
  | { allowed: true; invented: false }
  | { allowed: false; reason: string };

export function gatherAuthorizedData(input: GatherRequest): GatherDecision {
  if (input.guardianApproved !== true) {
    return { allowed: false, reason: 'gathering_requires_guardian' };
  }
  if (input.sourceAuthorized !== true) {
    return { allowed: false, reason: 'gathering_requires_authorized_source' };
  }
  if (!input.purpose || !input.classification) {
    return { allowed: false, reason: 'gathering_requires_purpose_and_classification' };
  }
  if (input.inventsMissingData === true) {
    return { allowed: false, reason: 'gathering_cannot_invent_missing_data' };
  }
  return { allowed: true, invented: false };
}

export function agentGathersUnauthorizedSource(): false {
  return false;
}

export function agentInventsMissingBusinessData(): false {
  return false;
}
