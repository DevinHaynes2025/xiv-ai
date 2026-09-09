import type { DataClassification } from '../universe/types';
import type { UniverseVisibility } from '../universe/types';

export type SignedUploadGrant = {
  mediaId: string;
  ownerId: string;
  universeId: string;
  organizationId: string;
  allowedMime: string;
  maxBytes: number;
  expiresAt: string;
  uploadEnabled: false;
  configured: false;
  credentialsReturned: false;
  visibility: UniverseVisibility;
  classification: DataClassification;
};

export function createSignedUploadGrant(input: {
  mediaId: string;
  ownerId: string;
  universeId: string;
  organizationId: string;
  allowedMime: string;
  maxBytes: number;
  visibility: UniverseVisibility;
  classification: DataClassification;
  ttlMs?: number;
}): SignedUploadGrant {
  return {
    ...input,
    expiresAt: new Date(Date.now() + (input.ttlMs ?? 15 * 60_000)).toISOString(),
    uploadEnabled: false,
    configured: false,
    credentialsReturned: false,
  };
}

export function signedDownloadFor(referenceId: string, visibility: UniverseVisibility) {
  if (visibility !== 'public') {
    return {
      downloadReference: `dl_${referenceId}`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      credentialsReturned: false as const,
      permanentPublicUrl: null,
      public: false,
    };
  }
  return {
    downloadReference: `dl_${referenceId}`,
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    credentialsReturned: false as const,
    permanentPublicUrl: null,
    public: true,
  };
}
