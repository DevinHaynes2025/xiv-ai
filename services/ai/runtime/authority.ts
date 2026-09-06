/**
 * XIV Agent Authority Model.
 * Higher levels never imply automatic execution in Phase 2A.
 */

export const AuthorityLevel = {
  L0_Observe: 'L0',
  L1_Recommend: 'L1',
  L2_Draft: 'L2',
  L3_HumanApproval: 'L3',
  L4_BoundedAutonomy: 'L4',
  L5_HumanOnly: 'L5',
} as const;

export type AuthorityLevel = (typeof AuthorityLevel)[keyof typeof AuthorityLevel];

export const AUTHORITY_RANK: Record<AuthorityLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
};

export const AUTHORITY_LABEL: Record<AuthorityLevel, string> = {
  L0: 'Observe',
  L1: 'Recommend',
  L2: 'Draft',
  L3: 'Human Approval',
  L4: 'Bounded Autonomy',
  L5: 'Human Only',
};

export const DEFAULT_AUTHORITY: AuthorityLevel = AuthorityLevel.L0_Observe;

export function authorityRank(level: AuthorityLevel) {
  return AUTHORITY_RANK[level];
}

export function hasMinimumAuthority(actual: AuthorityLevel, required: AuthorityLevel) {
  return authorityRank(actual) >= authorityRank(required);
}

/** L4 is reserved. Phase 2A never grants unattended execution. */
export function boundedAutonomyEnabled() {
  return false;
}
