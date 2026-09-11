export interface AvatarMarketplaceListing {
  listingId: string;
  ownerUserId: string;
  avatarId: string;
  rightsBasis: 'SELF_OWNED' | 'LICENSED';
  consentReceiptId: string;
  identityVerified: boolean;
  transferMode: 'LICENSE_CAPABILITIES' | 'LICENSE_PERSONA_STYLE';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'REJECTED';
}

export function canListAvatar(listing: AvatarMarketplaceListing): boolean {
  return listing.identityVerified && !!listing.consentReceiptId && listing.status === 'APPROVED';
}

export const AVATAR_MARKETPLACE_GUARDRAILS = {
  sellAnotherPersonsIdentityAllowed: false,
  impersonationAllowed: false,
  personalityRightsReviewRequired: true,
  fraudReviewRequired: true,
  rawPrivateMemoryTransferAllowed: false,
};
