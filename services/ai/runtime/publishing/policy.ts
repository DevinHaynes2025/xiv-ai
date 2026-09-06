import { canPublishUniverseResource } from '../universe/permissions';
import type { Universe, UniverseMembership } from '../universe/types';
import type { CompanyPublication, PublishingState } from './types';

export function canAuthorizePublication(input: {
  publication: CompanyPublication;
  universe?: Universe;
  membership?: UniverseMembership;
}) {
  return canPublishUniverseResource({
    universe: input.universe,
    membership: input.membership,
    resource: {
      resourceId: input.publication.publicationId,
      universeId: input.publication.universeId,
      organizationId: input.publication.organizationId,
      ownerId: input.publication.authorId,
      resourceType: 'announcement',
      visibility: input.publication.state === 'public' ? 'public' : 'organization',
      classification: input.publication.state === 'public' ? 'public' : 'internal',
      createdAt: input.publication.createdAt,
    },
  });
}

export function isProductionPublishWrite(state: PublishingState) {
  return state === 'public' || state === 'internal';
}

export function publishingWritesEnabled() {
  return false;
}
