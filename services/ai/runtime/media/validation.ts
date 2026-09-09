import type { MediaAsset, MediaKind } from './types';

export const ALLOWED_MIME_BY_KIND: Record<MediaKind, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: ['application/pdf', 'text/plain'],
  business_update: ['application/pdf', 'text/plain', 'image/jpeg', 'image/png'],
  company_announcement: ['application/pdf', 'text/plain', 'image/jpeg'],
  product_demo: ['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg'],
  learning_content: ['application/pdf', 'video/mp4', 'text/plain'],
  review: ['text/plain', 'image/jpeg', 'image/png'],
  idea: ['text/plain', 'application/pdf'],
};

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;
export const MEDIA_SIZE_LIMITS = {
  consumer: { image: 8 * 1024 * 1024, video: 25 * 1024 * 1024 },
  professional: { image: 12 * 1024 * 1024, video: 40 * 1024 * 1024 },
  business: { image: 15 * 1024 * 1024, video: 80 * 1024 * 1024 },
  enterprise: { image: 25 * 1024 * 1024, video: 200 * 1024 * 1024 },
  sovereign: { image: 25 * 1024 * 1024, video: 200 * 1024 * 1024 },
} as const;

export type MediaLimitTier = keyof typeof MEDIA_SIZE_LIMITS;

const EXECUTABLE_MIME = /^(application\/x-msdownload|application\/x-executable|application\/x-sh|application\/javascript|text\/javascript)/i;

export type MediaValidationResult = {
  ok: boolean;
  reason: string;
};

export function validateMediaAsset(
  asset: Partial<MediaAsset>,
  options?: { tier?: MediaLimitTier },
): MediaValidationResult {
  if (!asset.ownerId) return { ok: false, reason: 'Missing owner: DENY' };
  if (!asset.mediaType) return { ok: false, reason: 'Declared media type is required: DENY' };
  if (!asset.mimeType) return { ok: false, reason: 'MIME type is required: DENY' };
  if (EXECUTABLE_MIME.test(asset.mimeType)) {
    return { ok: false, reason: 'Executable or script MIME denied regardless of filename.' };
  }
  const allowed = ALLOWED_MIME_BY_KIND[asset.mediaType];
  if (!allowed?.includes(asset.mimeType)) {
    return { ok: false, reason: 'Unsupported MIME: DENY. Filename extension is not trusted.' };
  }
  if (typeof asset.sizeBytes !== 'number' || asset.sizeBytes <= 0) {
    return { ok: false, reason: 'Invalid size: DENY' };
  }
  const tier = options?.tier ?? 'consumer';
  const kindLimit =
    asset.mediaType === 'video' ? MEDIA_SIZE_LIMITS[tier].video : MEDIA_SIZE_LIMITS[tier].image;
  if (asset.sizeBytes > kindLimit || asset.sizeBytes > MAX_MEDIA_BYTES) {
    return { ok: false, reason: `Oversized ${asset.mediaType ?? 'media'}: DENY` };
  }
  if (!asset.checksum) return { ok: false, reason: 'Missing checksum: DENY' };
  if (!asset.visibility) return { ok: false, reason: 'Visibility is required: DENY' };
  const companyPrivate = asset.visibility !== 'public' && asset.source !== 'client';
  if (companyPrivate && (!asset.universeId || !asset.organizationId)) {
    return { ok: false, reason: 'Missing Universe ownership for private company media: DENY' };
  }
  if (asset.visibility !== 'public' && asset.source === 'company' && !asset.universeId) {
    return { ok: false, reason: 'Missing Universe for private company media: DENY' };
  }
  return { ok: true, reason: 'Media metadata passed deterministic validation. Upload is not production-enabled.' };
}
