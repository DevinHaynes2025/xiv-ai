export type AuthorizationFreshness = {
  roleVersion: number;
  membershipUpdatedAt: string;
  authorizationCheckedAt: string;
  authorizationExpiresAt: string;
};

export function authorizationIsFresh(input: AuthorizationFreshness, now = Date.now()) {
  const expires = Date.parse(input.authorizationExpiresAt);
  if (!Number.isFinite(expires) || expires <= now) {
    return { fresh: false as const, reason: 'Authorization expired. Revalidate membership before a sensitive action.' };
  }
  if (input.roleVersion < 1) {
    return { fresh: false as const, reason: 'Invalid roleVersion.' };
  }
  return { fresh: true as const, reason: 'Authorization is within the freshness window.' };
}

export function requireFreshAuthorization(input: AuthorizationFreshness, sensitive: boolean, now = Date.now()) {
  const check = authorizationIsFresh(input, now);
  if (sensitive && !check.fresh) {
    return { allowed: false as const, reason: check.reason };
  }
  if (!check.fresh) {
    return { allowed: false as const, reason: check.reason };
  }
  return { allowed: true as const, reason: 'Sensitive action may proceed with fresh authorization.' };
}

export function cachedRoleIsTrustedForever() {
  return false;
}
