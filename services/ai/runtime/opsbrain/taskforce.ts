import { conveneTaskForce, taskForceGrantsPermissions } from '../ecosystem/taskforce';
import { AGENT_DIVISION_CATALOG } from './agents';

export type OperationsIncident =
  | 'SUPPLIER_DELAY'
  | 'WAREHOUSE_EXCEPTION'
  | 'FREIGHT_DISRUPTION'
  | 'CASH_PRESSURE'
  | 'SECURITY_INCIDENT';

export type AssembledTaskForce = {
  incident: OperationsIncident;
  assembled: readonly string[];
  alwaysOn: false;
  grantsPermissions: false;
  executesWithoutHuman: false;
};

const INCIDENT_ROSTER: Record<OperationsIncident, readonly string[]> = {
  SUPPLIER_DELAY: [
    'Supplier Agent',
    'Inventory Agent',
    'Warehouse Agent',
    'Transportation Agent',
    'Finance Agent',
    'Legal Research Agent',
  ],
  WAREHOUSE_EXCEPTION: ['Warehouse Agent', 'Inventory Agent', 'Operations Agent', 'Quality Agent'],
  FREIGHT_DISRUPTION: ['Transportation Agent', 'Freight Agent', 'Customs Agent', 'Supplier Agent'],
  CASH_PRESSURE: ['Finance Agent', 'Cash Flow Agent', 'Cost Agent', 'Risk Agent'],
  SECURITY_INCIDENT: ['SOC Agent', 'Threat Agent', 'Incident Agent', 'Identity Agent'],
};

export function assembleOperationsTaskForce(incident: OperationsIncident): AssembledTaskForce {
  const assembled = INCIDENT_ROSTER[incident].filter((name) =>
    AGENT_DIVISION_CATALOG.some((agent) => agent.name === name),
  );
  const convened = conveneTaskForce('SUPPLY_DISRUPTION', assembled);
  return {
    incident,
    assembled,
    alwaysOn: false,
    grantsPermissions: taskForceGrantsPermissions(convened),
    executesWithoutHuman: false,
  };
}

export function taskForceExecutesWithoutHuman(_force: AssembledTaskForce): false {
  return false;
}

export function idleAgentsConsumeCompute(_catalogSize: number): false {
  return false;
}
