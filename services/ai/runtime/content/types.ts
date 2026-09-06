import type { DataClassification, UniverseVisibility } from '../universe/types';

export type ConsumerContentType = 'post' | 'photo' | 'video' | 'review' | 'idea' | 'learning' | 'discussion';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'held';

export type ContentItem = {
  contentId: string;
  authorId: string;
  universeId?: string;
  organizationId?: string;
  contentType: ConsumerContentType;
  visibility: UniverseVisibility;
  classification: DataClassification;
  mediaReferences: readonly string[];
  createdAt: string;
  source: 'consumer' | 'company';
  moderationStatus: ModerationStatus;
};
