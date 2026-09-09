/**
 * Consent & Outreach Engine — no Yellow Pages spam.
 * Suppression lists, jurisdiction checks, and opt-out are mandatory.
 */
import type { OutreachChannel } from './types';

export type OutreachRequest = {
  channel: OutreachChannel;
  recipientConsented: boolean;
  suppressed: boolean;
  jurisdictionAllowed: boolean;
  optedOut: boolean;
  yellowPagesBulkScraped?: boolean;
};

export type OutreachDecision =
  | { allowed: true; audited: true }
  | { allowed: false; reason: string };

export function evaluateOutreach(input: OutreachRequest): OutreachDecision {
  if (input.yellowPagesBulkScraped === true) {
    return { allowed: false, reason: 'yellow_pages_spam_denied' };
  }
  if (input.suppressed) {
    return { allowed: false, reason: 'recipient_on_suppression_list' };
  }
  if (input.optedOut) {
    return { allowed: false, reason: 'recipient_opted_out' };
  }
  if (!input.jurisdictionAllowed) {
    return { allowed: false, reason: 'jurisdiction_blocks_outreach' };
  }
  if (!input.recipientConsented) {
    return { allowed: false, reason: 'consent_required' };
  }
  return { allowed: true, audited: true };
}

export function yellowPagesSpamAllowed(): false {
  return false;
}

export function outreachBypassesConsent(): false {
  return false;
}

export function outreachBypassesSuppression(): false {
  return false;
}

export function outreachIgnoresJurisdiction(): false {
  return false;
}
