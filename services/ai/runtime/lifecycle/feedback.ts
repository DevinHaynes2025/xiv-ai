/**
 * 62L-EX13 — XivFeedbackEvent processing.
 * Structured feedback only — no hidden CoT.
 * Cross-tenant / cross-Universe / restricted → DENIED or QUARANTINED.
 * Lifecycle feedback cannot alter permissions / Guardian / RLS.
 */

import {
  DEFENSIVE_CYBER_POLICY,
  EX13_LOCKS,
  MATURE_COMMUNITY_POLICY,
  type FeedbackDisposition,
  type XivFeedbackEvent,
} from './types.ts';

export type FeedbackProcessResult = {
  disposition: FeedbackDisposition;
  reason: string;
  event: XivFeedbackEvent;
  permissionsChanged: false;
  guardianChanged: false;
  rlsChanged: false;
};

export function createFeedbackEvent(
  partial: Omit<XivFeedbackEvent, 'hiddenChainOfThought'> & { hiddenChainOfThought?: false },
): XivFeedbackEvent {
  return {
    ...partial,
    hiddenChainOfThought: false,
    mayAlterPermissions: partial.mayAlterPermissions ?? false,
    mayAlterGuardian: partial.mayAlterGuardian ?? false,
    mayAlterRls: partial.mayAlterRls ?? false,
  };
}

export function processFeedbackEvent(
  event: XivFeedbackEvent,
  scope: { tenantId: string; universeId: string },
): FeedbackProcessResult {
  if (event.hiddenChainOfThought !== false) {
    return deny(event, 'HIDDEN_COT_FORBIDDEN');
  }

  if (event.tenantId !== scope.tenantId || EX13_LOCKS.CROSS_TENANT_FEEDBACK) {
    return deny(event, 'CROSS_TENANT_FEEDBACK_DENIED');
  }
  if (event.universeId !== scope.universeId || EX13_LOCKS.CROSS_UNIVERSE_FEEDBACK) {
    return deny(event, 'CROSS_UNIVERSE_FEEDBACK_DENIED');
  }

  if (event.dataClass === 'RESTRICTED') {
    return {
      disposition: 'DENIED',
      reason: 'RESTRICTED_DATA_DENIED',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }
  if (event.dataClass === 'QUARANTINE') {
    return {
      disposition: 'QUARANTINED',
      reason: 'QUARANTINED_DATA_BLACK_HOLE',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }

  if (
    event.mayAlterPermissions ||
    event.mayAlterGuardian ||
    event.mayAlterRls ||
    EX13_LOCKS.LIFECYCLE_ALTERS_PERMISSIONS ||
    EX13_LOCKS.BROADEN_PERMISSIONS ||
    EX13_LOCKS.WEAKEN_GUARDIAN_RLS
  ) {
    return {
      disposition: 'DENIED',
      reason: 'LIFECYCLE_FEEDBACK_CANNOT_ALTER_PERMISSIONS',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }

  if (event.evidenceRejected || event.evidenceRevoked) {
    return {
      disposition: 'REJECTED',
      reason: 'REJECTED_OR_REVOKED_EVIDENCE',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }

  if (event.source === 'UX_INTERACTION' || event.source === 'USER_EXPLICIT') {
    return {
      disposition: 'UX_EVIDENCE',
      reason: 'UX_EVIDENCE_REQUIRES_PATTERNS_AND_REVIEW_BEFORE_DEFAULTS_CHANGE',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }

  if (!event.evidenceAccepted || event.evidenceIds.length === 0) {
    return {
      disposition: 'WAITING_DATA',
      reason: 'FEEDBACK_WAITING_ACCEPTED_EVIDENCE',
      event,
      permissionsChanged: false,
      guardianChanged: false,
      rlsChanged: false,
    };
  }

  return {
    disposition: 'ACCEPTED_EVIDENCE',
    reason: 'STRUCTURED_FEEDBACK_ACCEPTED_FOR_PATHWAY_REVIEW',
    event,
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
  };
}

function deny(event: XivFeedbackEvent, reason: string): FeedbackProcessResult {
  return {
    disposition: 'DENIED',
    reason,
    event,
    permissionsChanged: false,
    guardianChanged: false,
    rlsChanged: false,
  };
}

export function matureCommunityHooksPrepared(): typeof MATURE_COMMUNITY_POLICY {
  return MATURE_COMMUNITY_POLICY;
}

export function defensiveCyberOnly(): typeof DEFENSIVE_CYBER_POLICY {
  return DEFENSIVE_CYBER_POLICY;
}
