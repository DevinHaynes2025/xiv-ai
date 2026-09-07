/**
 * Phase 2I-F elite experience contracts.
 * Extends 2I-E. Does not claim new LIVE infrastructure.
 */
import { AUTHORITY_LABEL, AuthorityLevel, boundedAutonomyEnabled, type AuthorityLevel as AuthorityLevelId } from '../authority';
import { clientSelectorIsNotAuthority } from '../tenant/authorize';
import { messagingRealtimeLive } from './messaging';
import { videoMeetingInfrastructureLive, videoProvider } from './meetings';
import { nvidiaInfrastructureLive } from './compute';
import { oracleDefaultsReadOnly, unknownDatabaseSourceDenied } from './connectors';
import { secAdapterCapabilityStatus, secGlobalFabricIsProductionLive } from '../sources/sec-status';
import { worldBankAdapterCapabilityStatus, worldBankGlobalFabricIsProductionLive } from '../sources/world-bank-status';
import type { DataSurfaceState } from './surface-state';
import { demoSurfaceMustBeLabeled } from './surface-state';

export const PREMIUM_PRIMARY_NAV = ['home', 'intelligence', 'network', 'meetings', 'ai'] as const;
export type PremiumPrimaryNav = (typeof PREMIUM_PRIMARY_NAV)[number];

export const PREMIUM_ROUTE_MAP = {
  home: 'index',
  intelligence: 'intelligence',
  network: 'network',
  meetings: 'meetings',
  ai: 'agents',
  messages: 'messages',
  conversation: 'conversation',
  mixer: 'mixer',
  events: 'events',
  'agent-room': 'agent-room',
  sources: 'sources',
  company: 'company',
  professional: 'professional',
  'meeting-room': 'meeting-room',
  offline: 'offline',
  discover: 'discover',
  watchlist: 'watchlist',
  research: 'research',
  sheets: 'sheets',
  charts: 'charts',
  originals: 'originals',
  daily: 'daily',
  'idea-room': 'idea-room',
  privacy: 'privacy',
  'company-research': 'company-research',
  'company-timeline': 'company-timeline',
  startups: 'startups',
  'research-room': 'research-room',
  'company-comparison': 'company-comparison',
  documentary: 'documentary',
  'company-profile': 'company-profile',
  devices: 'devices',
  'device-detail': 'device-detail',
  location: 'location',
  'security-agents': 'security-agents',
  'security-incidents': 'security-incidents',
  'identity-security': 'identity-security',
  'access-security': 'access-security',
  'agent-security': 'agent-security',
  audit: 'audit',
  'cross-device': 'cross-device',
  knowledge: 'knowledge',
  articles: 'articles',
  history: 'history',
  'product-passport': 'product-passport',
  suppliers: 'suppliers',
  parcel: 'parcel',
  commerce: 'commerce',
  'agent-foundry': 'agent-foundry',
  boards: 'boards',
  temporal: 'temporal',
  civilizations: 'civilizations',
  thinkers: 'thinkers',
  foresight: 'foresight',
  'time-machine': 'time-machine',
  atlas: 'atlas',
  archives: 'archives',
  pocket: 'pocket',
  'pocket-wms': 'pocket-wms',
  'pocket-tms': 'pocket-tms',
  'supplier-connect': 'supplier-connect',
  'device-trust': 'device-trust',
  'pocket-security': 'pocket-security',
  communities: 'communities',
  groups: 'groups',
  places: 'places',
  answers: 'answers',
  reviews: 'reviews',
  'live-rooms': 'live-rooms',
  'data-agents': 'data-agents',
  'supply-graph': 'supply-graph',
  'warehouse-twin': 'warehouse-twin',
  earth: 'earth',
  pipelines: 'pipelines',
  'defense-mesh': 'defense-mesh',
  'location-fabric': 'location-fabric',
  universes: 'universes',
  transport: 'transport',
  ports: 'ports',
  geospatial: 'geospatial',
  legacy: 'legacy',
  council: 'council',
  assembly: 'assembly',
  'algorithm-foundry': 'algorithm-foundry',
  brains: 'brains',
  philosophy: 'philosophy',
  'founder-twin': 'founder-twin',
  voice: 'voice',
  'night-shift': 'night-shift',
  sovereign: 'sovereign',
  'ai-marketing': 'ai-marketing',
  'universe-fabric': 'universe-fabric',
} as const;

export type PremiumRouteKey = keyof typeof PREMIUM_ROUTE_MAP;

export function resolvePremiumRoute(input: { experience: 'business' | 'executive'; path: PremiumRouteKey }) {
  const file = PREMIUM_ROUTE_MAP[input.path];
  const root = input.experience === 'executive' ? '/executive' : '/business';
  return { allowed: true as const, href: `${root}/${file === 'index' ? '' : file}`.replace(/\/$/, '') || root, file };
}

export type ConnectorCatalogEntry = {
  id: string;
  name: string;
  surface: DataSurfaceState;
  provenLive: boolean;
};

export function connectorCatalog(): readonly ConnectorCatalogEntry[] {
  const worldBankLive = worldBankAdapterCapabilityStatus() === 'LIVE';
  const secLive = secAdapterCapabilityStatus() === 'LIVE';
  return [
    {
      id: 'world_bank_open_data',
      name: 'World Bank Open Data',
      surface: worldBankLive ? 'LIVE' : 'CONNECTED',
      provenLive: worldBankLive,
    },
    {
      id: 'us_sec_edgar',
      name: 'U.S. SEC EDGAR',
      surface: secLive ? 'LIVE' : 'CONNECTED',
      provenLive: secLive,
    },
    { id: 'supabase', name: 'Supabase', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'postgresql', name: 'PostgreSQL', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'oracle', name: 'Oracle Database', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'sql_server', name: 'SQL Server', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'snowflake', name: 'Snowflake', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'bigquery', name: 'BigQuery', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'crm', name: 'CRM', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'erp', name: 'ERP', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'wms', name: 'WMS', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'tms', name: 'TMS', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'nvidia', name: 'NVIDIA compute', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'video', name: 'Video meetings', surface: 'NOT_CONFIGURED', provenLive: false },
    { id: 'messaging', name: 'Messaging transport', surface: 'NOT_CONFIGURED', provenLive: false },
  ];
}

export function unprovenConnectorMustNotBeLive(id: string) {
  const row = connectorCatalog().find((item) => item.id === id);
  if (!row) return { allowed: false as const, reason: 'Unknown connector denied.', live: false as const };
  if (row.provenLive) return { allowed: true as const, surface: row.surface, live: true as const };
  return { allowed: true as const, surface: row.surface, live: false as const };
}

export function providerStateTruthful() {
  return {
    worldBankAdapter: worldBankAdapterCapabilityStatus(),
    secAdapter: secAdapterCapabilityStatus(),
    worldBankFabricProductionLive: worldBankGlobalFabricIsProductionLive(),
    secFabricProductionLive: secGlobalFabricIsProductionLive(),
    nvidiaLive: nvidiaInfrastructureLive(),
    oracleReadOnlyDefault: oracleDefaultsReadOnly(),
    unknownDbDenied: unknownDatabaseSourceDenied('mystery_db').allowed === false,
    video: videoProvider().status,
    messagesTransportLive: messagingRealtimeLive(),
    meetingsTransportLive: videoMeetingInfrastructureLive(),
  };
}

export function globalDataFabricProductionLive() {
  return worldBankGlobalFabricIsProductionLive() || secGlobalFabricIsProductionLive();
}

export type ExperienceMessageKind = 'human' | 'xiv_agent' | 'system' | 'workflow';

export type ExperienceMessage = {
  messageId: string;
  conversationId: string;
  organizationId: string;
  kind: ExperienceMessageKind;
  body: string;
  surface: DataSurfaceState;
  transportLive: false;
};

export function messagesUiClaimsTransportLive() {
  return messagingRealtimeLive();
}

export function meetingsUiClaimsTransportLive() {
  return videoMeetingInfrastructureLive();
}

export function createDemoExperienceRecord(input: { id: string; title: string }) {
  return {
    id: input.id,
    title: input.title,
    surface: 'DEMO' as const,
    demo: true as const,
    fabricatedProduction: false as const,
  };
}

export function demoDataIsIdentifiable(record: { surface: DataSurfaceState; demo?: boolean }) {
  return demoSurfaceMustBeLabeled(record.surface) && record.demo === true;
}

export function uiTenantSelectorIsNotAuthority(selector?: string | null) {
  return clientSelectorIsNotAuthority(selector);
}

export function uiCannotTakeCrossOrgAction(input: {
  actorOrganizationId?: string | null;
  targetOrganizationId?: string | null;
}) {
  const actor = input.actorOrganizationId?.trim() ?? '';
  const target = input.targetOrganizationId?.trim() ?? '';
  if (!actor || !target || actor !== target) {
    return { allowed: false as const, reason: 'UI contracts cannot authorize arbitrary cross-org action.' };
  }
  return { allowed: true as const, reason: 'Same-tenant selector still requires server membership.' };
}

export function agentAuthorityLabel(level: AuthorityLevelId) {
  return AUTHORITY_LABEL[level];
}

export function l4RemainsDisabled() {
  return boundedAutonomyEnabled() === false;
}

export function consequentialActionRequiresHumanApproval(input: { authority: AuthorityLevelId; consequential: boolean }) {
  if (!input.consequential) return { required: false as const, authority: input.authority };
  if (input.authority === AuthorityLevel.L4_BoundedAutonomy || boundedAutonomyEnabled()) {
    return { required: true as const, allowed: false as const, reason: 'L4 remains disabled. Human approval required.' };
  }
  if (input.authority === AuthorityLevel.L5_HumanOnly || input.authority === AuthorityLevel.L3_HumanApproval) {
    return { required: true as const, allowed: true as const };
  }
  return { required: true as const, allowed: false as const, reason: 'Consequential actions require L3 human approval.' };
}

export function sourceProvenanceRequired(input: { source?: string | null; surface: DataSurfaceState }) {
  if (!input.source) {
    return { allowed: false as const, reason: 'Source provenance is required on live-looking cards.' };
  }
  return { allowed: true as const, source: input.source };
}

export type ProfessionalProfileView = {
  professionalId: string;
  legalName: string;
  expertise: readonly string[];
  problemsSolved: readonly string[];
  industries: readonly string[];
  projects: readonly string[];
  contributions: readonly string[];
  businessInterests: readonly string[];
  collaborationInterests: readonly string[];
  followerCountShown: false;
  surface: DataSurfaceState;
};

export type CompanyProfileView = {
  organizationId: string;
  legalName: string;
  industry: string | null;
  surface: DataSurfaceState;
};

export type MeetingRoomFoundation = {
  visualOnly: true;
  transportLive: false;
  transcriptionLive: false;
  recordingLive: false;
};

export function meetingRoomFoundation(): MeetingRoomFoundation {
  return { visualOnly: true, transportLive: false, transcriptionLive: false, recordingLive: false };
}

export const EXPERIENCE_AGENTS = [
  'Executive',
  'Finance',
  'Supply Chain',
  'Operations',
  'Security',
  'Procurement',
  'Growth',
  'Customer Experience',
  'Technology',
  'People',
  'Innovation',
] as const;
