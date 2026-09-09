import type { DataClassification } from '../universe/types';

export type LiveStreamStatus = 'scheduled' | 'live' | 'ended' | 'cancelled' | 'blocked' | 'not_configured';

export type LiveVisibility = 'public' | 'community' | 'organization' | 'universe' | 'invite_only';

export type LiveCategory =
  | 'ceo_update'
  | 'founder'
  | 'earnings'
  | 'product_demo'
  | 'training'
  | 'education'
  | 'panel'
  | 'operations_walkthrough'
  | 'customer_qa'
  | 'innovation'
  | 'town_hall'
  | 'professional_event';

export type LiveRoom = {
  streamId: string;
  hostUserId: string;
  organizationId: string | null;
  universeId: string | null;
  title: string;
  description: string;
  category: LiveCategory;
  visibility: LiveVisibility;
  status: LiveStreamStatus;
  startedAt: string | null;
  scheduledAt: string | null;
  endedAt: string | null;
  viewerCount: number | null;
  moderationState: 'clear' | 'review' | 'warned' | 'blocked';
  recordingState: 'not_configured' | 'off' | 'requested';
  dataClassification: DataClassification;
  prototype: boolean;
};

export type LiveSurface = 'live' | 'upcoming' | 'company' | 'industry' | 'learning' | 'innovation';

export type ProviderStatus = 'not_configured';

export type ModerationRecommendation = 'recommend_block' | 'recommend_warning' | 'recommend_review';
