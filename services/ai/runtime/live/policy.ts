import { canViewOrganization, canViewUniverse } from '../tenant/authorize';
import type { PersistenceStatus } from '../tenant/context';
import type { OrganizationMembership, UniverseMembership } from '../tenant/types';
import type { LiveRoom } from './types';

export function publicLiveCannotExposeRestricted(room: Pick<LiveRoom, 'visibility' | 'dataClassification'>) {
  if (room.visibility === 'public' && room.dataClassification !== 'public') {
    return { allowed: false as const, reason: 'Public livestream cannot expose restricted or non-public data: DENY' };
  }
  return { allowed: true as const, reason: 'Public catalog item stays public-classified.' };
}

export function authorizeLiveAccess(input: {
  room: LiveRoom;
  actorUserId?: string | null;
  persistenceStatus?: PersistenceStatus;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
}) {
  const classification = publicLiveCannotExposeRestricted(input.room);
  if (!classification.allowed) return classification;

  if (input.room.visibility === 'public' || input.room.visibility === 'community') {
    if (input.room.status === 'not_configured') {
      return { allowed: false as const, reason: 'LIVE INFRASTRUCTURE NOT CONFIGURED' };
    }
    return { allowed: true as const, reason: 'Public or community live catalog may be listed.' };
  }

  if (input.persistenceStatus !== 'ready') {
    return {
      allowed: false as const,
      reason: 'Private tenant-backed live sessions are NOT CONFIGURED while tenant persistence is blocked.',
    };
  }

  if (input.room.visibility === 'organization') {
    const view = canViewOrganization({
      actorUserId: input.actorUserId,
      organization: input.room.organizationId ? { id: input.room.organizationId } : null,
      membership: input.organizationMembership,
    });
    return view.allowed
      ? { allowed: true as const, reason: view.reason }
      : { allowed: false as const, reason: 'Private organization live requires tenant authorization: DENY' };
  }

  const view = canViewUniverse({
    actorUserId: input.actorUserId,
    organization: input.room.organizationId ? { id: input.room.organizationId } : null,
    universe:
      input.room.universeId && input.room.organizationId
        ? { id: input.room.universeId, organizationId: input.room.organizationId }
        : null,
    organizationMembership: input.organizationMembership,
    universeMembership: input.universeMembership,
  });
  return view.allowed
    ? { allowed: true as const, reason: view.reason }
    : { allowed: false as const, reason: 'Private Universe live requires tenant authorization: DENY' };
}
