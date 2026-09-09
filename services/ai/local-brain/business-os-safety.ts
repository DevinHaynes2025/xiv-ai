import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  listRuntimeProfiles,
  requestVehicleCapability,
  type RuntimeProfileId,
  type VehicleCapability,
} from './runtime-profiles';
import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import {
  ADULT_ACCESS_DENIED,
  ATC_HIGHWAY_CLAIMS,
  ATC_HIGHWAY_CONTROL_DENIED,
  EXTERNAL_SYSTEM_KINDS,
  FOUNDER_IMPERSONATION_DENIED,
  PHYSICAL_CONTROL_CLAIMS,
  SEALED_REDACTION,
  UNCONFIGURED_SYSTEM_UNAVAILABLE,
  UNVERIFIED_RUNTIME_UNAVAILABLE,
  VEHICLE_CONTROL_DENIED,
  type AwEvidenceState,
  type ExternalSystemKind,
  type PhysicalControlClaim,
} from './business-os-types';

export type AgeAttestation = {
  claimedAgeYears: number | null;
  attested: boolean;
};

export type AdultAccessResult = {
  allowed: boolean;
  state: AwEvidenceState;
  reason: string;
  identityPartnership: false;
  method: 'self_attestation';
};

export function enforceAdultAccess(attestation: AgeAttestation): AdultAccessResult {
  if (!attestation.attested || attestation.claimedAgeYears === null) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: `${ADULT_ACCESS_DENIED}: age attestation is required. Fail closed.`,
      identityPartnership: false,
      method: 'self_attestation',
    };
  }
  if (attestation.claimedAgeYears < 18) {
    return {
      allowed: false,
      state: 'DENIED',
      reason: `${ADULT_ACCESS_DENIED}: claimedAgeYears=${attestation.claimedAgeYears}.`,
      identityPartnership: false,
      method: 'self_attestation',
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: 'Self-attested 18+. This is not an identity-verification partnership.',
    identityPartnership: false,
    method: 'self_attestation',
  };
}

export type PhysicalControlResult = {
  claim: string;
  allowed: false;
  executed: false;
  isAirTrafficControl: false;
  isHighwayVehicleControl: false;
  physicalControl: false;
  state: 'DENIED';
  reason: string;
};

export function isPhysicalControlClaim(claim: string): claim is PhysicalControlClaim {
  return (PHYSICAL_CONTROL_CLAIMS as readonly string[]).includes(claim);
}

export function requestPhysicalControl(claim: string): PhysicalControlResult {
  const atcOrHighway = (ATC_HIGHWAY_CLAIMS as readonly string[]).includes(claim);
  return {
    claim,
    allowed: false,
    executed: false,
    isAirTrafficControl: false,
    isHighwayVehicleControl: false,
    physicalControl: false,
    state: 'DENIED',
    reason: atcOrHighway
      ? ATC_HIGHWAY_CONTROL_DENIED
      : isPhysicalControlClaim(claim)
        ? VEHICLE_CONTROL_DENIED
        : `${ATC_HIGHWAY_CONTROL_DENIED}: unknown physical-control claim is denied.`,
  };
}

export function requestAuthorizedVehicleData(capability: VehicleCapability) {
  return requestVehicleCapability(capability);
}

export type AppRuntimeTarget = RuntimeProfileId;

export function appRuntimeAvailability(profileId: AppRuntimeTarget) {
  const profile = listRuntimeProfiles().find((item) => item.id === profileId);
  if (!profile || profile.state !== 'AVAILABLE' || !profile.verified) {
    return {
      profileId,
      downloadable: false as const,
      verified: false as const,
      state: 'UNAVAILABLE' as const,
      reason: UNVERIFIED_RUNTIME_UNAVAILABLE,
      evidence: profile?.evidence ?? ['profile_missing'],
    };
  }
  return {
    profileId,
    downloadable: true as const,
    verified: true as const,
    state: 'AVAILABLE' as const,
    reason: 'Host probe verified this profile. Availability is this-host only, not a fleet or store claim.',
    evidence: profile.evidence,
  };
}

export function catalogDownloadableRuntimes() {
  return listRuntimeProfiles().map((item) => ({
    id: item.id,
    family: item.family,
    verified: item.verified,
    downloadable: item.verified && item.state === 'AVAILABLE',
    state: item.state,
    reason: item.verified ? item.reason : UNVERIFIED_RUNTIME_UNAVAILABLE,
  }));
}

export function probeExternalSystem(kind: ExternalSystemKind) {
  return {
    kind,
    configured: false as const,
    state: 'UNAVAILABLE' as const,
    replacesVendor: false as const,
    partnershipClaimed: false as const,
    reason: `${UNCONFIGURED_SYSTEM_UNAVAILABLE}: ${kind} is a bridge slot. XIV does not replace ERP/bank/POS/WMS/cloud/transport on day one and does not invent partnerships.`,
  };
}

export function probeAllExternalSystems() {
  return EXTERNAL_SYSTEM_KINDS.map(probeExternalSystem);
}

export function denyFounderImpersonation(impersonateFounder: boolean) {
  if (!impersonateFounder) {
    return { allowed: true as const, state: 'PASS' as const, reason: 'No founder impersonation attempted.' };
  }
  return {
    allowed: false as const,
    state: 'DENIED' as const,
    reason: FOUNDER_IMPERSONATION_DENIED,
  };
}

export function redactCeoSealed(payload: string, sealed: boolean) {
  return {
    payload: sealed ? SEALED_REDACTION : payload,
    replicating: false as const,
    ceoSealedCompartmentalized: true as const,
  };
}

export async function probeLlmSlots() {
  const model = await localModelStatus();
  return {
    localModel: {
      availability: model.availability === 'AVAILABLE' ? ('PASS' as const) : ('UNAVAILABLE' as const),
      reason: model.reason,
    },
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state === 'AVAILABLE' ? ('PASS' as const) : ('UNAVAILABLE' as const),
      configured: slot.configured,
    })),
  };
}

export type PredecessorProbe = {
  name: string;
  module: string;
  report: string;
  modulePresent: boolean;
  reportPresent: boolean;
  state: AwEvidenceState;
};

const PREDECESSORS: Array<{ name: string; module: string; report: string }> = [
  { name: 'universal_runtime_av', module: 'universal-runtime.ts', report: 'docs/operations/62L_AV_UNIVERSAL_RUNTIME_ALGORITHM_FOUNDRY_CFO_REPORT.md' },
  { name: 'package_marketplace_ak', module: 'marketplace-exchange.ts', report: 'docs/operations/62L_AK_OFFLINE_DEVELOPER_PLATFORM_MARKETPLACE_REPORT.md' },
  { name: 'software_factory_aj', module: 'software-factory-runtime.ts', report: 'docs/operations/62L_AJ_OFFLINE_SOFTWARE_FACTORY_PLUGINS_REPORT.md' },
  { name: 'supply_chain_ao', module: 'supply-chain-runtime.ts', report: 'docs/operations/62L_AO_GLOBAL_AGENTIC_SUPPLY_CHAIN_NETWORK_REPORT.md' },
  { name: 'ops_planner_ap', module: 'enterprise-ops-runtime.ts', report: 'docs/operations/62L_AP_ENTERPRISE_OPERATIONS_PLANNER_COMMAND_CENTER_REPORT.md' },
  { name: 'information_economy_au', module: 'information-economy-runtime.ts', report: 'docs/operations/62L_AU_AGENTIC_INFORMATION_ECONOMY_LOGISTICS_REPORT.md' },
  { name: 'universe_kernel_af', module: 'universe-os-kernel.ts', report: 'docs/operations/62L_AF_UNIVERSE_OS_KERNEL_MEMORY_REPLICATION_REPORT.md' },
  { name: 'agent_society_ag', module: 'agent-society-runtime.ts', report: 'docs/operations/62L_AG_PERSISTENT_OFFLINE_AGENT_SOCIETY_REPORT.md' },
];

export function probePredecessorReuse(root: string): PredecessorProbe[] {
  const repoRoot = existsSync(join(root, 'docs', 'operations')) ? root : join(root, '..', '..');
  const brain = existsSync(join(root, 'local-brain'))
    ? join(root, 'local-brain')
    : join(root, 'services', 'ai', 'local-brain');
  return PREDECESSORS.map((item) => {
    const modulePresent = existsSync(join(brain, item.module));
    const reportPresent = existsSync(join(repoRoot, item.report));
    return {
      ...item,
      modulePresent,
      reportPresent,
      state: reportPresent && modulePresent ? 'PASS' : 'WAITING_DATA',
    };
  });
}
