import { buildOnboardingScreen } from './onboarding-experience-ui';
import { composeSecurityCommandCenter } from './security-command-center-view';
import { buildAvatarUniverseHome } from './avatar-universe-home';
import { validateConsentGrant } from './privacy-consent-center';

const screen = buildOnboardingScreen({
  tenantId: 'tenant-a', userId: 'user-a', step: 'PRIVACY', formFactor: 'PHONE',
  title: 'Privacy controls', body: 'Choose what XIV may access.', required: true,
  completed: false, evidenceRefs: [], nextAllowed: false,
});
if (screen.nextAllowed) throw new Error('required step bypassed');

const consent = validateConsentGrant({
  tenantId: 'tenant-a', userId: 'user-a', scope: 'LOCAL_MODEL', granted: true,
  grantedAt: new Date().toISOString(), policyVersion: '1', evidenceRef: 'consent:1',
});
if (!consent.granted) throw new Error('consent missing');

const sec = composeSecurityCommandCenter({
  tenantId: 'tenant-a', userId: 'user-a', overall: 'HEALTHY',
  controls: [{ controlId: 'mfa', label: 'MFA', state: 'HEALTHY', evidenceRefs: ['evidence:mfa'], userActionRequired: false }],
  activeDefensiveAgents: 4, quarantinedItems: 0, emergencyStopAvailable: false,
});
if (!sec.emergencyStopAvailable) throw new Error('emergency stop missing');

const home = buildAvatarUniverseHome({
  tenantId: 'tenant-a', userId: 'user-a', avatarId: 'avatar:a', mode: 'BUSINESS',
  greeting: 'Welcome to XIV', recommendedActions: ['Review business health'], agentStatusRefs: ['agents:1'],
  privacySummaryRef: 'privacy:1', securitySummaryRef: 'security:1', marketplaceBundleIds: ['xiv-starter'], offlineReady: true,
});
if (!home.offlineReady) throw new Error('offline readiness missing');

console.log('12D-54 onboarding UI/security/avatar home contracts: OK');
