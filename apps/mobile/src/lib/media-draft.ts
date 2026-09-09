import * as ImagePicker from 'expo-image-picker';

import {
  prepareSelectedMedia,
  quarantineMedia,
  type MediaDraft,
} from '../../../../services/ai/runtime/media';
import type { UniverseVisibility } from '../../../../services/ai/runtime/universe';

function draftChecksum(uri: string, size: number, mime: string) {
  return `draft:${mime}:${size}:${uri.slice(-24)}`;
}

function mimeFromAsset(asset: ImagePicker.ImagePickerAsset, kind: 'image' | 'video') {
  const mime = asset.mimeType?.toLowerCase();
  if (kind === 'image') {
    if (mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp') return mime;
    return 'image/jpeg';
  }
  if (mime === 'video/mp4' || mime === 'video/quicktime' || mime === 'video/webm') return mime;
  return 'video/mp4';
}

export async function selectLocalMedia(
  kind: 'image' | 'video',
  ownerId: string,
  source: 'client' | 'company',
  extras?: {
    visibility?: UniverseVisibility;
    universeId?: string;
    organizationId?: string;
  },
) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false as const, reason: 'Media library permission denied.', draft: null };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: kind === 'video' ? ['videos'] : ['images'],
    quality: 0.85,
    allowsEditing: false,
  });
  if (result.canceled || !result.assets[0]) {
    return { ok: false as const, reason: 'Selection cancelled.', draft: null };
  }
  const asset = result.assets[0];
  const mime = mimeFromAsset(asset, kind);
  const size = asset.fileSize ?? 0;
  const visibility = extras?.visibility ?? (source === 'company' ? 'organization' : 'private');
  const prepared = prepareSelectedMedia(
    {
      ownerId,
      mediaType: kind,
      mimeType: mime,
      sizeBytes: size,
      checksum: draftChecksum(asset.uri, size, mime),
      visibility,
      classification: source === 'company' ? 'internal' : 'public',
      source,
      universeId: extras?.universeId ?? '',
      organizationId: extras?.organizationId ?? '',
      localUri: asset.uri,
    },
    source === 'company' ? 'business' : 'consumer',
  );
  if (!prepared.ok) return { ok: false as const, reason: prepared.reason, draft: prepared.draft };
  return { ok: true as const, reason: prepared.reason, draft: quarantineMedia(prepared.draft) };
}

export function mediaStatusLabel(draft: MediaDraft) {
  if (draft.pipelineStatus === 'rejected') return 'REJECTED';
  if (draft.pipelineStatus === 'selected') return 'SELECTED';
  if (draft.pipelineStatus === 'quarantined' && draft.scanStatus === 'unavailable') return 'SCAN UNAVAILABLE';
  if (draft.pipelineStatus === 'quarantined') return 'QUARANTINED';
  if (draft.pipelineStatus === 'ready') return 'READY';
  return 'UPLOAD NOT CONFIGURED';
}
