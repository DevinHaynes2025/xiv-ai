import { v5PrimaryNavUnchanged } from '../premium/design';
import type { AgentDivision } from './types';
import { AGENT_DIVISIONS } from './types';

export type DivisionAgent = {
  division: AgentDivision;
  name: string;
  alwaysOn: false;
  grantsAuthority: false;
};

export const AGENT_DIVISION_CATALOG: readonly DivisionAgent[] = [
  { division: 'EXECUTIVE', name: 'CEO Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'EXECUTIVE', name: 'Strategy Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'EXECUTIVE', name: 'Chief of Staff Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'EXECUTIVE', name: 'Decision Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'OPERATIONS', name: 'Operations Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'OPERATIONS', name: 'Process Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'OPERATIONS', name: 'Capacity Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'OPERATIONS', name: 'Quality Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'OPERATIONS', name: 'Maintenance Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Supplier Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Procurement Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Inventory Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Warehouse Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Transportation Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Freight Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Parcel Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Customs Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Trade Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SUPPLY_CHAIN', name: 'Returns Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Finance Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Cash Flow Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Cost Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Budget Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Research Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'FINANCE', name: 'Risk Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Legal Research Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Jurisdiction Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Privacy Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Compliance Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Rights Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'LEGAL_GOVERNANCE', name: 'Policy Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'SOC Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Identity Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Device Security Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Agent Security Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Data Security Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Threat Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'SECURITY', name: 'Incident Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PEOPLE', name: 'Learning Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PEOPLE', name: 'Employee Experience Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PEOPLE', name: 'Wellness Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PEOPLE', name: 'Community Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Video Analysis Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Post Analysis Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Translation Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Moderation Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Rights Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'MEDIA', name: 'Summary Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Chief Data Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Database Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Lineage Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Quality Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Graph Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Vector Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Search Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'DATA', name: 'Streaming Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Plugin Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Runtime Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Device Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Deployment Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Observability Agent', alwaysOn: false, grantsAuthority: false },
  { division: 'PLATFORM', name: 'Cost Optimization Agent', alwaysOn: false, grantsAuthority: false },
];

export function agentsRunConstantly(): false {
  void AGENT_DIVISIONS;
  return false;
}

export function divisionAgentGrantsAuthority(_agent: DivisionAgent): false {
  return false;
}

export function experienceAgentsUnchanged(): boolean {
  return v5PrimaryNavUnchanged();
}

export function listDivision(division: AgentDivision): readonly DivisionAgent[] {
  return AGENT_DIVISION_CATALOG.filter((agent) => agent.division === division);
}
