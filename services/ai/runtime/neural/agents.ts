import { AGENT_SPECIALTIES, type AgentSpecialty } from './types';

export type AgentPool = {
  specialties: readonly AgentSpecialty[];
  alwaysOn: false;
  instantiateOnDemand: true;
  moreAgentsMeansMorePrivilege: false;
};

export type TemporaryAssembly = {
  agents: readonly AgentSpecialty[];
  permanentAuthority: false;
  agreementRetained: true;
  disagreementRetained: true;
};

export function openAgentSociety(): AgentPool {
  return {
    specialties: AGENT_SPECIALTIES,
    alwaysOn: false,
    instantiateOnDemand: true,
    moreAgentsMeansMorePrivilege: false,
  };
}

export function instantiateSpecialty(specialty: AgentSpecialty) {
  return {
    specialty,
    running: true as const,
    grantsCredentials: false as const,
    canDisableGuardian: false as const,
    canDisableAudit: false as const,
    canSelfPromote: false as const,
    canMintProductionCredential: false as const,
  };
}

export function assembleParallelAgents(specialties: readonly AgentSpecialty[]): TemporaryAssembly {
  return {
    agents: specialties,
    permanentAuthority: false,
    agreementRetained: true,
    disagreementRetained: true,
  };
}

export function temporaryAgentReceivesPermanentAuthority(): false {
  return false;
}
