/**
 * Agent Society + Intelligence Fabric lanes.
 */

import {
  AGENT_SOCIETY_ROLES,
  INTELLIGENCE_FABRIC_LANES,
  type AgentSocietyRole,
  type IntelligenceFabricLane,
} from './types';

export type AgentSociety = {
  roles: readonly AgentSocietyRole[];
  selfGrantEnabled: false;
  l4Enabled: false;
  productionLive: false;
};

export type IntelligenceFabric = {
  lanes: readonly IntelligenceFabricLane[];
  privateAutoEntersGlobal: false;
  productionLive: false;
};

export function openAgentSociety(): AgentSociety {
  return {
    roles: AGENT_SOCIETY_ROLES,
    selfGrantEnabled: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function listAgentSocietyRoles(): readonly AgentSocietyRole[] {
  return AGENT_SOCIETY_ROLES;
}

export function openIntelligenceFabric(): IntelligenceFabric {
  return {
    lanes: INTELLIGENCE_FABRIC_LANES,
    privateAutoEntersGlobal: false,
    productionLive: false,
  };
}

export function listIntelligenceFabricLanes(): readonly IntelligenceFabricLane[] {
  return INTELLIGENCE_FABRIC_LANES;
}

export function privateIntelligenceAutoEntersGlobal(): false {
  return false;
}

export function societyRoleGrantsL4(_role: AgentSocietyRole): false {
  return false;
}
