import { consumerMayAccessClassification } from '../security/classification';
import { canReadUniverseResource } from '../universe/permissions';
import type { Universe, UniverseMembership } from '../universe/types';
import type { MediaAsset } from './types';
import { validateMediaAsset } from './validation';

export function canConsumerReadMedia(asset: MediaAsset) {
  if (asset.visibility !== 'public') {
    return { allowed: false as const, reason: 'Private company media denied to consumer.' };
  }
  if (!consumerMayAccessClassification(asset.classification)) {
    return { allowed: false as const, reason: 'Consumer cannot read classified company media.' };
  }
  return { allowed: true as const, reason: 'Public media may be read when policy allows.' };
}

export function canReadMedia(input: {
  asset: MediaAsset;
  universe?: Universe;
  membership?: UniverseMembership;
  consumer?: boolean;
}) {
  const valid = validateMediaAsset(input.asset);
  if (!valid.ok) return { allowed: false as const, reason: valid.reason };
  if (input.consumer) return canConsumerReadMedia(input.asset);
  return canReadUniverseResource({
    universe: input.universe,
    membership: input.membership,
    resource: {
      resourceId: input.asset.mediaId,
      universeId: input.asset.universeId,
      organizationId: input.asset.organizationId,
      ownerId: input.asset.ownerId,
      resourceType: 'media',
      visibility: input.asset.visibility,
      classification: input.asset.classification,
      createdAt: input.asset.createdAt,
    },
  });
}
