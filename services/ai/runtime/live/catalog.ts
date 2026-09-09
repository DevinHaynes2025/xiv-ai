import type { LiveRoom, LiveSurface } from './types';

export const LIVE_SURFACES: readonly LiveSurface[] = [
  'live',
  'upcoming',
  'company',
  'industry',
  'learning',
  'innovation',
];

export const PROTOTYPE_LIVE_ROOMS: readonly LiveRoom[] = [
  {
    streamId: 'live_ceo_briefing',
    hostUserId: '',
    organizationId: null,
    universeId: null,
    title: 'CEO update',
    description: 'Business-only briefing card. Delivery is not configured.',
    category: 'ceo_update',
    visibility: 'public',
    status: 'not_configured',
    startedAt: null,
    scheduledAt: null,
    endedAt: null,
    viewerCount: null,
    moderationState: 'clear',
    recordingState: 'not_configured',
    dataClassification: 'public',
    prototype: true,
  },
  {
    streamId: 'live_product_demo',
    hostUserId: '',
    organizationId: null,
    universeId: null,
    title: 'Product demonstration',
    description: 'Company product walkthrough. No live video is attached.',
    category: 'product_demo',
    visibility: 'public',
    status: 'not_configured',
    startedAt: null,
    scheduledAt: null,
    endedAt: null,
    viewerCount: null,
    moderationState: 'clear',
    recordingState: 'not_configured',
    dataClassification: 'public',
    prototype: true,
  },
  {
    streamId: 'live_training',
    hostUserId: '',
    organizationId: null,
    universeId: null,
    title: 'Business training',
    description: 'Learning surface for professional education. Stream provider is absent.',
    category: 'training',
    visibility: 'public',
    status: 'not_configured',
    startedAt: null,
    scheduledAt: null,
    endedAt: null,
    viewerCount: null,
    moderationState: 'clear',
    recordingState: 'not_configured',
    dataClassification: 'public',
    prototype: true,
  },
];

export function liveInfrastructureLabel() {
  return 'LIVE INFRASTRUCTURE NOT CONFIGURED';
}
