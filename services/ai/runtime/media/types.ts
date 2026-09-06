import type { DataClassification, UniverseVisibility } from '../universe/types';

export type MediaKind =
  | 'image'
  | 'video'
  | 'document'
  | 'business_update'
  | 'company_announcement'
  | 'product_demo'
  | 'learning_content'
  | 'review'
  | 'idea';

export type MediaPipelineStatus =
  | 'selected'
  | 'authorized'
  | 'uploading'
  | 'quarantined'
  | 'validating'
  | 'scanning'
  | 'processing'
  | 'ready'
  | 'rejected'
  | 'failed';

export type MediaUploadStatus = MediaPipelineStatus | 'pending' | 'complete';
export type MediaScanStatus = 'pending' | 'scanning' | 'safe' | 'rejected' | 'failed' | 'unavailable';
export type MediaProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type MediaAsset = {
  mediaId: string;
  ownerId: string;
  universeId: string;
  organizationId: string;
  mediaType: MediaKind;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  visibility: UniverseVisibility;
  classification: DataClassification;
  storageProvider: string;
  storageKeyReference: string;
  encryptionReference: string;
  uploadStatus: MediaUploadStatus;
  scanStatus: MediaScanStatus;
  processingStatus: MediaProcessingStatus;
  retentionClass: 'standard' | 'restricted' | 'ephemeral';
  createdAt: string;
  source: 'client' | 'company' | 'agent_artifact';
  prototype: boolean;
  pipelineStatus?: MediaPipelineStatus;
  publicUrl?: string | null;
};

export type MediaScanResult = {
  mediaId: string;
  status: MediaScanStatus;
  engine: string;
  prototype: true;
};

export type MediaProcessResult = {
  mediaId: string;
  status: MediaProcessingStatus;
  prototype: true;
};

export type MediaScanner = {
  scan(asset: MediaAsset): Promise<MediaScanResult>;
};

export type MediaProcessor = {
  process(asset: MediaAsset): Promise<MediaProcessResult>;
};

export type MediaDeliveryProvider = {
  getSignedDelivery(reference: string): { deliveryReference: string; expiresAt: string; credentialsReturned: false };
};

export type MediaIntelligenceProvider = {
  analyzeImage(mediaId: string): Promise<MediaIntelligenceResult>;
  analyzeVideo(mediaId: string): Promise<MediaIntelligenceResult>;
  transcribeVideo(mediaId: string): Promise<MediaIntelligenceResult>;
  extractBusinessEvidence(mediaId: string): Promise<MediaIntelligenceResult>;
};

export type MediaIntelligenceResult = {
  mediaId: string;
  source: string;
  timestamp: string;
  universeId: string;
  organizationId: string;
  confidence: 'low' | 'medium' | 'high';
  provider: string;
  prototype: true;
  live: false;
  operational: false;
  summary: string;
};
