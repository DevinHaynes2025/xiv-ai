import type { MediaAsset } from './types';

export function mediaProvenance(asset: MediaAsset) {
  return {
    mediaId: asset.mediaId,
    ownerId: asset.ownerId,
    universeId: asset.universeId,
    organizationId: asset.organizationId,
    checksum: asset.checksum,
    source: asset.source,
    prototype: asset.prototype,
    storageKeyReference: asset.storageKeyReference,
  };
}
