import { createSecurityAgent, securityDirectorAgent, XIV_CYBER_DEFENSE_ROLES } from '../runtime/everywhere/cyber';
import { verifySecurity } from './security-verifier';
import { hostOsClass, type DeviceClass, type OsClass } from './hybrid-edge-cloud-types';
import { probeHardware } from './hardware-probe';
import { registerDeviceNode } from './device-node-runtime';
import {
  DEFENSIVE_CYBER_ACTIONS,
  OFFENSIVE_CYBER_ACTIONS,
  type DefensiveCyberAction,
  type EnsEvidenceState,
  type OffensiveCyberAction,
} from './enterprise-nervous-types';

export type CyberScope = 'xiv_owned' | 'explicitly_authorized';

export function runDefensiveCyberAction(input: {
  action: DefensiveCyberAction | OffensiveCyberAction | string;
  scope: CyberScope;
  targetSystem: string;
  tenantId: string;
  ownedByXiv?: boolean;
  explicitAuthorization?: boolean;
}): {
  allowed: boolean;
  state: EnsEvidenceState;
  reason: string;
  defensiveOnly: true;
  thirdPartyExploit: false;
} {
  if ((OFFENSIVE_CYBER_ACTIONS as readonly string[]).includes(input.action)) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: 'OFFENSIVE_THIRD_PARTY_EXPLOIT_DENIED',
      defensiveOnly: true,
      thirdPartyExploit: false,
    };
  }
  if (!(DEFENSIVE_CYBER_ACTIONS as readonly string[]).includes(input.action)) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: 'UNKNOWN_CYBER_ACTION_DENIED',
      defensiveOnly: true,
      thirdPartyExploit: false,
    };
  }
  const inScope =
    (input.scope === 'xiv_owned' && input.ownedByXiv === true) ||
    (input.scope === 'explicitly_authorized' && input.explicitAuthorization === true);
  if (!inScope) {
    return {
      allowed: false,
      state: 'FAIL',
      reason: 'CYBER_SCOPE_NOT_XIV_OWNED_OR_AUTHORIZED',
      defensiveOnly: true,
      thirdPartyExploit: false,
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason: `DEFENSIVE_${input.action.toUpperCase()}`,
    defensiveOnly: true,
    thirdPartyExploit: false,
  };
}

export function conveneCyberDefenseCouncil(input: { tenantId: string; universeId: string }) {
  const director = securityDirectorAgent();
  const roles = XIV_CYBER_DEFENSE_ROLES.map((role) => createSecurityAgent(role));
  return {
    tenantId: input.tenantId,
    universeId: input.universeId,
    director,
    agents: roles,
    defensiveOnly: true as const,
    l4AutonomyEnabled: false as const,
    cannotSelfPromote: true as const,
    cannotOverrideGuardian: true as const,
    productionAuthorization: false as const,
  };
}

export function auditLocalConfigDefensively(input: {
  files: Array<{ path: string; content?: string; unifiedDiff?: string }>;
  tenantBoundaryChanged?: boolean;
}) {
  const result = verifySecurity({
    files: input.files,
    tenantBoundaryChanged: input.tenantBoundaryChanged,
    productionLocks: {
      l4Autonomy: false,
      autoProduction: false,
      productionDbWrite: false,
      productionGitPush: false,
      guardianOverride: false,
    },
  });
  return {
    ...result,
    defensiveOnly: true as const,
    exploitPayload: false as const,
  };
}

export async function longTermOsPortability(input: {
  tenantId: string;
  universeId: string;
  deviceClass: DeviceClass;
  requestedOs?: OsClass;
  root?: string;
}) {
  const host = hostOsClass();
  const hardware = await probeHardware();
  const node = await registerDeviceNode({
    tenantId: input.tenantId,
    universeId: input.universeId,
    deviceClass: input.deviceClass,
    osClass: input.requestedOs,
    root: input.root,
  });
  const liveWindows = host === 'windows' ? ('NOT_TESTED' as const) : ('NOT_TESTED' as const);
  const liveIos = 'NOT_TESTED' as const;
  const liveMacos = 'NOT_TESTED' as const;
  return {
    hostOs: host,
    logicalNode: node,
    hardware: hardware.map((item) => ({ kind: item.kind, availability: item.availability })),
    physicalControl: false as const,
    certifiedAllOperatingSystems: false as const,
    windowsNodeVerification: liveWindows,
    iosNodeVerification: liveIos,
    macosNodeVerification: liveMacos,
    state: 'PASS' as EnsEvidenceState,
    note: 'Logical adapters only. Physical OS certification is NOT_TESTED.',
  };
}
