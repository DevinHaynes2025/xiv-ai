import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SOVEREIGN_SEALED_CYCLE = [
  'compartment_declare',
  'identity_bind',
  'strong_auth',
  'key_policy',
  'device_trust',
  'audit_channel',
  'sealed_access',
  'label_alone_reject',
  'government_architecture',
  'ux_shell',
  'responsive_tokens',
  'adaptive_nav',
  'control_tower_ux',
  'connectivity_state',
  'accessibility',
  'session_continuity',
  'trust_gateway',
  'isolated_universe',
  'evidence',
  'learning',
] as const;

export type AxHop = (typeof SOVEREIGN_SEALED_CYCLE)[number];

export type AxEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'UNKNOWN'
  | 'NOT_TESTED'
  | 'DENIED';

export const AX_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  FOUNDER_IMPERSONATION: false as const,
  TIP_LAND: false as const,
  INVENTED_PASS: false as const,
  INVENTED_GOVERNMENT_CERTIFICATION: false as const,
  CLASSIFIED_SYSTEM_APPROVAL_CLAIMED: false as const,
  LABEL_ALONE_SUFFICIENT: false as const,
  CEO_FOUNDER_SEALED_REPLICATING: false as const,
  GUARDIAN_RLS_WEAKENED: false as const,
  PERMISSION_EXPANSION: false as const,
  PRODUCTION_DATABASE_WRITE: false as const,
  MIGRATIONS_APPLIED: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED: true as const,
  SHARED_CONTROLS_ISOLATED_DATA: true as const,
  ONLY_FOUNDER_BECAUSE_OF_LABEL: false as const,
});

export const COMPARTMENT_TYPES = [
  'FOUNDER-SEALED',
  'ORGANIZATION-SEALED',
  'GOVERNMENT/REGULATED-SEALED',
  'LEGAL/PRIVILEGED',
  'SECURITY-RESTRICTED',
  'CUSTOMER-MANAGED',
] as const;

export type CompartmentType = (typeof COMPARTMENT_TYPES)[number];

export const ACCESS_PREREQUISITES = [
  'identity_controls',
  'strong_authentication',
  'cryptographic_key_policy',
  'device_trust',
  'audit_evidence',
] as const;

export type AccessPrerequisite = (typeof ACCESS_PREREQUISITES)[number];

export const UX_SHELLS = [
  'desktop_executive',
  'laptop',
  'phone_executive',
  'phone_consumer_employee',
  'tablet_2in1',
] as const;

export type UxShellId = (typeof UX_SHELLS)[number];

export const CONNECTIVITY_STATES = ['offline', 'hybrid', 'live'] as const;
export type ConnectivityState = (typeof CONNECTIVITY_STATES)[number];

export const MOBILE_FIRST_LAYERS = ['business_story', 'evidence', 'raw_data'] as const;
export type MobileFirstLayer = (typeof MOBILE_FIRST_LAYERS)[number];

export const TRUST_PLATFORMS = [
  'desktop',
  'laptop',
  'phone',
  'tablet',
  'web',
  'server',
  'approved_edge',
] as const;

export type TrustPlatform = (typeof TRUST_PLATFORMS)[number];

export const LABEL_ALONE_INSUFFICIENT = 'LABEL_ALONE_INSUFFICIENT';
export const FOUNDER_SEALED_DENY_DEFAULT = 'FOUNDER_SEALED_DENY_BY_DEFAULT';
export const GOVERNMENT_CERTIFICATION_UNAVAILABLE = 'GOVERNMENT_CERTIFICATION_NOT_TESTED_UNAVAILABLE';
export const UNVERIFIED_PLATFORM_UNAVAILABLE = 'UNVERIFIED_PLATFORM_UNAVAILABLE';
export const FOUNDER_IMPERSONATION_DENIED = 'FOUNDER_IMPERSONATION_DENIED';
export const SEALED_NON_REPLICATING = 'CEO_FOUNDER_SEALED_NON_REPLICATING';

export const NEXT_PHASE_TITLE =
  '62L-AY — XIV Sovereign Identity Kernel + Founder Root of Trust + Government/Enterprise Deployment Profiles + Cross-Device Secure Sync';

export type PredecessorId = 'AW' | 'AV' | 'AK' | 'AL' | 'AE' | 'AN' | 'AU';

const HERE = dirname(fileURLToPath(import.meta.url));

const PREDECESSOR_MODULES: Record<PredecessorId, string> = {
  AW: 'universal-app-runtime.ts',
  AV: 'universal-runtime.ts',
  AK: 'package-manifest.ts',
  AL: 'distributed-app-network-runtime.ts',
  AE: 'ceo-sealed-vault.ts',
  AN: 'information-control-tower-runtime.ts',
  AU: 'information-economy-runtime.ts',
};

const PREDECESSOR_REPORTS: Record<PredecessorId, string> = {
  AW: '62L_AW_UNIVERSAL_APP_RUNTIME_BUSINESS_OS_REPORT.md',
  AV: '62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md',
  AK: '62L_AK_OFFLINE_DEVELOPER_PLATFORM_MARKETPLACE_REPORT.md',
  AL: '62L_AL_DISTRIBUTED_APP_NETWORK_EDGE_SYNC_REPORT.md',
  AE: '62L_AE_HYBRID_EDGE_CLOUD_CEO_VAULT_REPORT.md',
  AN: '62L_AN_INFORMATION_CONTROL_TOWER_SEMANTIC_ROUTER_REPORT.md',
  AU: '62L_AU_AGENTIC_INFORMATION_ECONOMY_LOGISTICS_REPORT.md',
};

export function predecessorModuleState(id: PredecessorId): 'AVAILABLE' | 'WAITING_DATA' {
  return existsSync(join(HERE, PREDECESSOR_MODULES[id])) ? 'AVAILABLE' : 'WAITING_DATA';
}

export function predecessorReportState(cwd: string, id: PredecessorId): AxEvidenceState {
  return existsSync(join(cwd, 'docs', 'operations', PREDECESSOR_REPORTS[id])) ? 'PASS' : 'WAITING_DATA';
}

export function predecessorMap(
  cwd = process.cwd(),
): Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: AxEvidenceState }> {
  const ids = Object.keys(PREDECESSOR_MODULES) as PredecessorId[];
  return Object.fromEntries(
    ids.map((id) => [id, { module: predecessorModuleState(id), report: predecessorReportState(cwd, id) }]),
  ) as Record<PredecessorId, { module: 'AVAILABLE' | 'WAITING_DATA'; report: AxEvidenceState }>;
}

export type AxHopRecord = {
  hop: AxHop;
  state: AxEvidenceState;
  summary: string;
  at: string;
};
