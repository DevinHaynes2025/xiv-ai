import type { PersistenceStatus } from '../tenant/context';
import type { OrganizationMembership } from '../tenant/types';

export type LiveHostRole = 'business_owner' | 'executive';

const HOST_EXPERIENCES = new Set(['business_owner', 'executive']);
const AUTHORIZED_ORG_ROLES = new Set(['owner', 'executive', 'admin']);

export function consumerCanHostBusinessLive() {
  return false;
}

export function authorizedBusinessHostModelExists() {
  return true;
}

export function canHostBusinessLive(input: {
  experienceRole?: string | null;
  persistenceStatus?: PersistenceStatus;
  organizationMembership?: OrganizationMembership | null;
  businessVerified?: boolean;
}) {
  if (!input.experienceRole || !HOST_EXPERIENCES.has(input.experienceRole)) {
    return {
      allowed: false as const,
      configured: false,
      reason: 'Only business accounts or authorized business representatives can host Business Live. Consumers have no Go Live capability.',
    };
  }
  if (input.persistenceStatus !== 'ready') {
    return {
      allowed: false as const,
      configured: false,
      reason: 'Authorized host model exists, but real private hosting is NOT CONFIGURED while tenant persistence is blocked.',
    };
  }
  const membership = input.organizationMembership;
  if (!membership || membership.status !== 'active' || !AUTHORIZED_ORG_ROLES.has(membership.role)) {
    return {
      allowed: false as const,
      configured: false,
      reason: 'Hosting requires an authorized organization host role.',
    };
  }
  if (input.businessVerified !== true) {
    return {
      allowed: false as const,
      configured: false,
      reason: 'Business verification is required before hosting. Verification is NOT CONFIGURED.',
    };
  }
  return {
    allowed: false as const,
    configured: false,
    reason: 'Live streaming provider remains NOT CONFIGURED. Hosting authorization passed the role model only.',
  };
}

export function liveIntelligenceMayAutoPublishPrivate() {
  return false;
}

export function dlpUnavailableClaimsScanSuccess() {
  return false;
}

export const LIVE_SECURITY_CONTROLS = [
  'host_identity',
  'business_verification',
  'session_validation',
  'device_trust',
  'tenant_validation',
  'stream_key_security',
  'short_lived_credentials',
  'viewer_authorization',
  'rate_limiting',
  'bot_detection',
  'dlp',
  'recording_consent',
  'screen_share_warnings',
  'classification_controls',
  'moderation',
  'kill_switch',
  'audit',
  'post_stream_retention',
] as const;

export function liveSecurityInfrastructureStatus() {
  return 'not_configured' as const;
}
