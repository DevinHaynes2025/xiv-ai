import { AvatarBrainBootstrap } from './avatar-brain-bootstrap';

export interface AvatarUniverseSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  brainNamespaceId: string;
  modes: Array<'PERSONAL' | 'BUSINESS' | 'COMMUNITY' | 'LEARNING' | 'INNOVATION'>;
  offlineReady: boolean;
  securityStatus: 'VERIFIED' | 'REVIEW_REQUIRED';
  createdAt: string;
}

export function createAvatarUniverseSession(brain: AvatarBrainBootstrap): AvatarUniverseSession {
  return {
    sessionId: `universe:${brain.namespaceId}`,
    tenantId: brain.tenantId,
    userId: brain.userId,
    brainNamespaceId: brain.namespaceId,
    modes: ['PERSONAL','BUSINESS','COMMUNITY','LEARNING','INNOVATION'],
    offlineReady: true,
    securityStatus: 'VERIFIED',
    createdAt: new Date().toISOString(),
  };
}
