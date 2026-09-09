import { canViewOrganization, canViewUniverse, userCannotJoinArbitraryOrganization } from './authorize';
import { tenantPersistenceIsLive } from './collision';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './types';

export type IsolationActor = {
  userId: string;
  organization: Organization;
  universe: Universe;
  organizationMembership: OrganizationMembership;
  universeMembership: UniverseMembership;
};

export function isolationProofRequired() {
  return [
    'A cannot read B',
    'B cannot read A',
    'A cannot join B',
    'B cannot join A',
    'A cannot read Universe B',
    'B cannot read Universe A',
  ] as const;
}

export function evaluateLiveIsolationPlan(input: { a: IsolationActor; b: IsolationActor }) {
  const aReadsB = canViewOrganization({
    actorUserId: input.a.userId,
    organization: input.b.organization,
    membership: input.a.organizationMembership,
  });
  const bReadsA = canViewOrganization({
    actorUserId: input.b.userId,
    organization: input.a.organization,
    membership: input.b.organizationMembership,
  });
  const aJoinsB = userCannotJoinArbitraryOrganization();
  const aReadsUniB = canViewUniverse({
    actorUserId: input.a.userId,
    organization: input.b.organization,
    universe: input.b.universe,
    organizationMembership: input.a.organizationMembership,
    universeMembership: input.a.universeMembership,
  });
  const bReadsUniA = canViewUniverse({
    actorUserId: input.b.userId,
    organization: input.a.organization,
    universe: input.a.universe,
    organizationMembership: input.b.organizationMembership,
    universeMembership: input.b.universeMembership,
  });

  const helperPass =
    aReadsB.allowed === false &&
    bReadsA.allowed === false &&
    aJoinsB.allowed === false &&
    aReadsUniB.allowed === false &&
    bReadsUniA.allowed === false;

  return {
    helperPass,
    hostedRlsPass: false,
    live: false,
    reason: helperPass
      ? 'TypeScript isolation helpers deny cross-tenant access. Hosted RLS two-user proof is NOT RUN. tenantPersistence is not LIVE.'
      : 'Isolation helpers failed.',
    persistenceLive: tenantPersistenceIsLive(),
  };
}
