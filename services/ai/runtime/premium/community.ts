import { clientSelectorIsNotAuthority } from '../tenant/authorize';
import type { CommunityType, FollowMode } from './types';

export type FollowPreference = {
  mode: FollowMode;
  showFollowerCount: false;
  rankingUsesFollowerCount: false;
  creatorPopularityBoost: false;
  changesEvidenceQuality: false;
};

export function defaultFollowPreference(): FollowPreference {
  return {
    mode: 'DISABLED',
    showFollowerCount: false,
    rankingUsesFollowerCount: false,
    creatorPopularityBoost: false,
    changesEvidenceQuality: false,
  };
}

export function followingDisabledWorks(preference = defaultFollowPreference()): boolean {
  return preference.mode === 'DISABLED';
}

export function followerCountIsRankingAuthority(preference = defaultFollowPreference()): boolean {
  return preference.rankingUsesFollowerCount || preference.creatorPopularityBoost;
}

export type CommunityMembership = {
  communityId: string;
  type: CommunityType;
  userId: string;
  organizationId: string | null;
  grantsTenantAccess: false;
  contentIsVerifiedFact: false;
};

export function joinCommunity(input: {
  communityId: string;
  type: CommunityType;
  userId: string;
  organizationId?: string | null;
}): CommunityMembership {
  return {
    communityId: input.communityId,
    type: input.type,
    userId: input.userId,
    organizationId: input.organizationId ?? null,
    grantsTenantAccess: false,
    contentIsVerifiedFact: false,
  };
}

export function communityMembershipGrantsTenantAccess(membership: CommunityMembership): boolean {
  return membership.grantsTenantAccess || clientSelectorIsNotAuthority(membership.organizationId).allowed;
}

export function communityContentIsVerifiedFact(membership: CommunityMembership): boolean {
  return membership.contentIsVerifiedFact;
}

export type ProfileKind = 'CONSUMER' | 'PROFESSIONAL' | 'COMPANY';

export type XivProfile = {
  kind: ProfileKind;
  displayName: string;
  isCompanyIdentity: boolean;
};

export function createProfile(kind: ProfileKind, displayName: string): XivProfile {
  return { kind, displayName, isCompanyIdentity: kind === 'COMPANY' };
}

export function consumerProfileIsCompanyIdentity(profile: XivProfile): boolean {
  return profile.kind === 'CONSUMER' && profile.isCompanyIdentity;
}
