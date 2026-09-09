export type {
  CloudProviderStatus,
  CyberDefenseRole,
  DataClassification,
  DeviceCapability,
  DeviceCapabilityGrantState,
  DeviceCapabilityName,
  DeviceClass,
  DeviceIdentity,
  DevicePlatform,
  DeviceTrustState,
  IncidentStage,
  LocationPermission,
  LocationPrecision,
  LocationPurpose,
  RealtimeSourceState,
  SecuritySeverity,
  SurfaceLayout,
  XivDevice,
} from './types';

export {
  authorizeDeviceSession,
  clientDeviceClaimIsAuthority,
  createDeviceIdentity,
  deviceStateIsTenantAuthority,
  endpointProtectionClaimed,
  enrollDevice,
  nativeDesktopPackagingState,
  revokeDevice,
  transferSession,
} from './devices';
export type { DeviceEnrollment, DeviceSession, SessionTransferRequest } from './devices';

export {
  capabilityAvailabilityForSurface,
  deviceHasCapability,
  evaluateCapability,
} from './capabilities';
export type { CapabilityDecision, CapabilityRequest } from './capabilities';

export {
  locationAccessAudited,
  locationAudits,
  locationServiceLive,
  preciseGpsExposed,
  requestLocation,
} from './location';
export type { LocationAuditRecord, LocationObservation, LocationRequest } from './location';

export {
  createResearchAlert,
  describeRealtimeObservation,
  marketPriceFeedsUnavailable,
  notificationTransportProductionLive,
  pollingIsStreaming,
  realtimeTruthBoundary,
  watchProvenSources,
} from './realtime';
export type { RealtimeObservation, ResearchAlertCandidate, ResearchWatchRule } from './realtime';

export {
  XIV_AGENT_DIRECTORY,
  XIV_CYBER_DEFENSE_ROLES,
  classifyExternalContent,
  cloudProviderStatus,
  createSecurityAgent,
  cyberEndpointProtectionClaimed,
  evaluateDlp,
  externalTextCannotOverrideGuardian,
  incidentHighImpactRequiresApproval,
  l4DisabledForCyberAgents,
  promptInjectionRemainsData,
  redactSecretExposure,
  requestAgentSelfPromotion,
  requestAgentSelfToolGrant,
  secretsAreRedacted,
  securityAgentCannotBypassHumanApproval,
  securityDirectorAgent,
  securityDirectorCannotOverrideGuardian,
  socAlertWithoutTelemetry,
  threatIntelSourceStatus,
} from './cyber';
export type { DlpDecision, PromptInjectionSignal, SecurityAgentProfile, SecurityAlert } from './cyber';

export {
  layoutForWidth,
  supportedDeviceSurfaces,
  surfaceCapabilitiesDoNotFabricateAvailability,
  surfacePreview,
} from './surfaces';
export type { SurfacePreview } from './surfaces';
