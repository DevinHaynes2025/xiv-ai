import { canReserveStorage, STORAGE_TIERS, type StorageTierName } from '../storage';
import { canReadMedia } from './policy';
import type { MediaAsset, MediaPipelineStatus, MediaScanStatus } from './types';
import { validateMediaAsset, type MediaLimitTier } from './validation';
import { createUnavailableScanner } from './processing';

export type MediaDraft = MediaAsset & {
  localUri?: string;
  pipelineStatus: MediaPipelineStatus;
};

export function prepareSelectedMedia(asset: Partial<MediaAsset> & { localUri?: string }, tier: MediaLimitTier = 'consumer') {
  const validation = validateMediaAsset(asset, { tier });
  const draft: MediaDraft = {
    mediaId: asset.mediaId ?? `media_${Date.now().toString(36)}`,
    ownerId: asset.ownerId ?? '',
    universeId: asset.universeId ?? '',
    organizationId: asset.organizationId ?? '',
    mediaType: asset.mediaType ?? 'image',
    mimeType: asset.mimeType ?? '',
    sizeBytes: asset.sizeBytes ?? 0,
    checksum: asset.checksum ?? '',
    visibility: asset.visibility ?? 'private',
    classification: asset.classification ?? 'internal',
    storageProvider: 'not_configured',
    storageKeyReference: '',
    encryptionReference: '',
    uploadStatus: validation.ok ? 'selected' : 'rejected',
    scanStatus: 'unavailable',
    processingStatus: 'pending',
    retentionClass: 'standard',
    createdAt: new Date().toISOString(),
    source: asset.source ?? 'client',
    prototype: true,
    pipelineStatus: validation.ok ? 'selected' : 'rejected',
    publicUrl: null,
    localUri: asset.localUri,
  };
  return { ok: validation.ok, reason: validation.reason, draft };
}

export function quarantineMedia(draft: MediaDraft): MediaDraft {
  if (draft.pipelineStatus === 'rejected' || draft.pipelineStatus === 'failed') return draft;
  return {
    ...draft,
    pipelineStatus: 'quarantined',
    uploadStatus: 'quarantined',
    scanStatus: 'unavailable',
  };
}

export async function scanSelectedMedia(draft: MediaDraft) {
  const result = await createUnavailableScanner().scan(draft);
  return {
    ...draft,
    pipelineStatus: 'quarantined' as const,
    scanStatus: result.status,
  };
}

export function mediaIsTrusted(draft: MediaDraft) {
  return draft.scanStatus === 'safe' && draft.pipelineStatus === 'ready';
}

export function privateMediaPublicUrl(draft: MediaDraft) {
  if (draft.visibility !== 'public') return null;
  return draft.publicUrl ?? null;
}

export function checkMediaQuota(sizeBytes: number, usedBytes: number, tier: StorageTierName) {
  return canReserveStorage(
    { usedBytes, objectCount: 1, namespace: 'images' },
    STORAGE_TIERS[tier],
    sizeBytes,
  );
}

export function authorizationExpired(expiresAt: string, now = Date.now()) {
  return Date.parse(expiresAt) <= now;
}

export function scanStatusLabel(status: MediaScanStatus) {
  if (status === 'unavailable') return 'SCAN UNAVAILABLE';
  if (status === 'safe') return 'READY';
  if (status === 'rejected') return 'REJECTED';
  return status.toUpperCase();
}

export { canReadMedia };
