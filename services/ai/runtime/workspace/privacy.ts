/**
 * Privacy zones, invitations, translation, and investment research boundaries.
 * Personal Brain != Company Brain != Global Brain.
 */
import { companyEntersGlobalBrainAutomatically, evaluateBrainTransfer } from '../fabric';
import { clientSelectorIsNotAuthority } from '../tenant/authorize';
import { uiCannotTakeCrossOrgAction } from '../network-os/experience';
import { boundedAutonomyEnabled } from '../authority';

export const PRIVACY_ZONES = ['PERSONAL', 'TEAM', 'COMPANY', 'COMMUNITY', 'GLOBAL'] as const;
export type PrivacyZone = (typeof PRIVACY_ZONES)[number];

const ZONE_RANK: Record<PrivacyZone, number> = {
  PERSONAL: 0,
  TEAM: 1,
  COMPANY: 2,
  COMMUNITY: 3,
  GLOBAL: 4,
};

export type ZoneTransition = { from: PrivacyZone; to: PrivacyZone; authorized: boolean };
export type ZoneTransitionPolicy = { automaticOutward: false };
export type ZoneAuthorization = { granted: boolean; reason: string };
export type ZoneAuditEvent = { event: string; from: PrivacyZone; to: PrivacyZone; decision: 'allowed' | 'denied' };
export type ZoneDataClassification = 'pii' | 'business_confidential' | 'restricted' | 'public' | 'internal';

export type TranslationStatus = 'ORIGINAL' | 'MACHINE_TRANSLATED' | 'HUMAN_REVIEWED' | 'UNAVAILABLE';
export type TranslationMeta = {
  sourceLanguage: string;
  preferredLanguage: string;
  translatedLanguage: string | null;
  translationProvider: 'NOT_CONFIGURED';
  translationStatus: TranslationStatus;
  humanReviewed: boolean;
  perfectTranslationClaimed: false;
};

export type InvestmentClass = 'FACT' | 'RESEARCH' | 'SIGNAL' | 'RISK' | 'INFERENCE' | 'FORECAST';
export type ResearchLanguage =
  | 'WATCH'
  | 'EMERGING'
  | 'REQUIRES_REVIEW'
  | 'HIGH_RISK'
  | 'IMPROVING'
  | 'DETERIORATING'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONFLICTING_EVIDENCE';

export type InvitationReason = string;
export type OutreachReviewState = 'requires_review' | 'approved' | 'denied';
export type OrganizationClaimState = 'unclaimed' | 'pending_verification' | 'verified';

export type CompanyInvitation = {
  candidateId: string;
  reason: InvitationReason;
  reviewState: OutreachReviewState;
  claimState: OrganizationClaimState;
  automatedMassMessaging: false;
};

export function privateDataEntersGlobalBrainAutomatically() {
  return companyEntersGlobalBrainAutomatically();
}

export function requestZoneTransition(input: ZoneTransition) {
  if (input.from === input.to) {
    return { allowed: true as const, reason: 'Same privacy zone.' };
  }
  if (ZONE_RANK[input.to] > ZONE_RANK[input.from] && input.authorized !== true) {
    return { allowed: false as const, reason: 'Privacy-zone transitions require authorization. Nothing moves outward automatically.' };
  }
  if (input.from === 'COMPANY' && input.to === 'GLOBAL') {
    const brain = evaluateBrainTransfer({ from: 'company', to: 'global', explicitShare: input.authorized });
    return { allowed: false as const, reason: brain.reason };
  }
  if (input.from === 'PERSONAL' && (input.to === 'COMPANY' || input.to === 'GLOBAL')) {
    const brain = evaluateBrainTransfer({ from: 'personal', to: input.to === 'GLOBAL' ? 'global' : 'company' });
    return { allowed: false as const, reason: brain.reason };
  }
  if (ZONE_RANK[input.to] > ZONE_RANK[input.from] && input.authorized) {
    return { allowed: false as const, reason: 'Authorized outward share is recorded in policy but not executed. No Global Brain write.' };
  }
  return { allowed: true as const, reason: 'Inward or same-scope access still requires server membership.' };
}

export function createCompanyInvitation(candidateId: string, reason: string): CompanyInvitation {
  return {
    candidateId,
    reason,
    reviewState: 'requires_review',
    claimState: 'unclaimed',
    automatedMassMessaging: false,
  };
}

export function invitationRequiresReview(invitation: CompanyInvitation) {
  return invitation.reviewState === 'requires_review' && invitation.automatedMassMessaging === false;
}

export function investmentLanguageAllowed(term: string) {
  const banned = ['BUY', 'SELL', 'GUARANTEED_WINNER', 'CERTAIN_RETURN', 'GUARANTEED_RETURN'];
  if (banned.includes(term)) {
    return { allowed: false as const, reason: 'Investment research does not emit BUY/SELL/guaranteed language.' };
  }
  return { allowed: true as const };
}

export function translationFoundation(): TranslationMeta {
  return {
    sourceLanguage: 'en',
    preferredLanguage: 'en',
    translatedLanguage: null,
    translationProvider: 'NOT_CONFIGURED',
    translationStatus: 'UNAVAILABLE',
    humanReviewed: false,
    perfectTranslationClaimed: false,
  };
}

export function workspaceTenantSelectorsAreNotAuthority(selector?: string | null) {
  return clientSelectorIsNotAuthority(selector);
}

export function workspaceCrossOrgDenied(actor?: string | null, target?: string | null) {
  return uiCannotTakeCrossOrgAction({ actorOrganizationId: actor, targetOrganizationId: target });
}

export function workspaceL4Disabled() {
  return boundedAutonomyEnabled() === false;
}
