import type { MediaAsset, MediaProcessor, MediaScanResult, MediaScanner } from './types';

export function createUnavailableScanner(): MediaScanner {
  return {
    async scan(asset: MediaAsset): Promise<MediaScanResult> {
      return {
        mediaId: asset.mediaId,
        status: 'unavailable',
        engine: 'unavailable',
        prototype: true,
      };
    },
  };
}

export function createUnavailableProcessor(): MediaProcessor {
  return {
    async process(asset: MediaAsset) {
      return {
        mediaId: asset.mediaId,
        status: 'pending' as const,
        prototype: true as const,
      };
    },
  };
}
