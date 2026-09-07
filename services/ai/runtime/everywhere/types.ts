export type DeviceClass = 'PHONE' | 'TABLET' | 'DESKTOP' | 'WEB' | 'WAREHOUSE_HANDHELD' | 'EDGE' | 'XR' | 'OTHER';
export type DevicePlatform = 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'LINUX' | 'WEB' | 'UNKNOWN';
export type DeviceTrustState =
  | 'UNKNOWN'
  | 'REGISTERED'
  | 'VERIFIED'
  | 'TRUSTED'
  | 'LIMITED'
  | 'AT_RISK'
  | 'QUARANTINED'
  | 'REVOKED';

export type DeviceCapabilityName =
  | 'LOCATION'
  | 'CAMERA'
  | 'BARCODE'
  | 'QR'
  | 'NFC'
  | 'BLUETOOTH'
  | 'MICROPHONE'
  | 'NOTIFICATIONS'
  | 'BIOMETRICS'
  | 'FILES'
  | 'CLIPBOARD'
  | 'OFFLINE_STORAGE'
  | 'BACKGROUND_SYNC';

export type DeviceCapability = DeviceCapabilityName;
export type DeviceCapabilityGrantState =
  | 'GRANTED'
  | 'DEVICE_LACKS'
  | 'AGENT_DENIED'
  | 'POLICY_DENIED'
  | 'UNKNOWN'
  | 'NOT_CONFIGURED';

export type DeviceIdentity = {
  deviceId: string;
  class: DeviceClass;
  platform: DevicePlatform;
  trustState: DeviceTrustState;
  clientReportedTenantId?: string;
  tenantAuthority: boolean;
};

export type XivDevice = {
  identity: DeviceIdentity;
  tenantId: string;
  universeId: string;
  capabilities: DeviceCapability[];
  enrolledAt: string;
  lastSeenAt: string;
};

export type LocationPermission = 'DISABLED' | 'ONE_TIME' | 'WHILE_USING_APP' | 'BACKGROUND_ALLOWED';
export type LocationPrecision = 'APPROXIMATE' | 'PRECISE';
export type LocationPurpose =
  | 'SUPPLY_CHAIN'
  | 'FIELD_SERVICE'
  | 'WAREHOUSE'
  | 'DELIVERY'
  | 'REAL_ESTATE'
  | 'BUSINESS_TRAVEL'
  | 'EVENTS'
  | 'SECURITY_INCIDENT'
  | 'ASSET_CONTEXT';

export type RealtimeSourceState = 'LIVE' | 'RECENT' | 'STALE' | 'HISTORICAL' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
export type SecuritySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStage = 'DETECTED' | 'TRIAGE' | 'INVESTIGATION' | 'CONTAINMENT' | 'ERADICATION' | 'RECOVERY' | 'POST_INCIDENT';
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'SECRET' | 'PERSONAL' | 'TENANT_PRIVATE';
export type SurfaceLayout = 'PHONE_COMPACT' | 'TABLET_EXPANDED' | 'DESKTOP_WORKSPACE' | 'WEB_RESPONSIVE';
export type CloudProviderStatus = 'NOT_CONFIGURED' | 'AUTHORIZED' | 'DEGRADED' | 'UNAVAILABLE';

export type CyberDefenseRole =
  | 'Security Director'
  | 'SOC'
  | 'Threat Intelligence'
  | 'Identity Security'
  | 'Access Governance'
  | 'Device Security'
  | 'Phishing Defense'
  | 'Data Loss Prevention'
  | 'Privacy Security'
  | 'Vulnerability'
  | 'Dependency Security'
  | 'Cloud Security'
  | 'API Security'
  | 'Agent Security'
  | 'Prompt Injection Defense'
  | 'Secrets Guardian'
  | 'Audit'
  | 'Incident Response'
  | 'Recovery'
  | 'Compliance Evidence';
