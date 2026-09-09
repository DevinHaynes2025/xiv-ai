export type TaskForceKind =
  | 'SUPPLY_CHAIN_DISRUPTION'
  | 'SUPPLIER_RECOVERY'
  | 'PRODUCT_RECALL'
  | 'CYBER_INCIDENT'
  | 'MARKET_ENTRY'
  | 'LEGAL_REVIEW'
  | 'CAPITAL_REVIEW'
  | 'WAREHOUSE_CRISIS'
  | 'LOGISTICS_EXCEPTION'
  | 'PROCUREMENT'
  | 'CUSTOMER_ESCALATION'
  | 'FINANCIAL_RISK'
  | 'PRODUCT_LAUNCH'
  | 'BUSINESS_CONTINUITY'
  | 'EXECUTIVE_DECISION'
  | 'DATA_QUALITY'
  | 'GLOBAL_EXPANSION';

export type IncidentSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HealthDomain =
  | 'FINANCIAL'
  | 'SUPPLY_CHAIN'
  | 'OPERATIONS'
  | 'SECURITY'
  | 'CUSTOMER'
  | 'PEOPLE'
  | 'DATA'
  | 'TECHNOLOGY'
  | 'COMPLIANCE'
  | 'MARKET';

export type HealthState = 'HEALTHY' | 'WATCH' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export type TwinStance = 'observed' | 'reported' | 'inferred' | 'simulated' | 'unknown';

export type OperationsAgentRole =
  | 'ChiefOperationsAgent'
  | 'ExecutiveOperationsAgent'
  | 'SupplyChainOperationsAgent'
  | 'ProcurementOperationsAgent'
  | 'InventoryOperationsAgent'
  | 'WarehouseOperationsAgent'
  | 'TransportationOperationsAgent'
  | 'ManufacturingOperationsAgent'
  | 'QualityOperationsAgent'
  | 'FinanceOperationsAgent'
  | 'SecurityOperationsAgent'
  | 'LegalWorkflowAgent'
  | 'ComplianceOperationsAgent'
  | 'CustomerOperationsAgent'
  | 'PeopleOperationsAgent'
  | 'DataOperationsAgent'
  | 'InfrastructureOperationsAgent'
  | 'MediaOperationsAgent'
  | 'InternationalOperationsAgent'
  | 'SustainabilityOperationsAgent';

export const TASK_FORCE_KINDS: readonly TaskForceKind[] = [
  'SUPPLY_CHAIN_DISRUPTION',
  'SUPPLIER_RECOVERY',
  'PRODUCT_RECALL',
  'CYBER_INCIDENT',
  'MARKET_ENTRY',
  'LEGAL_REVIEW',
  'CAPITAL_REVIEW',
  'WAREHOUSE_CRISIS',
  'LOGISTICS_EXCEPTION',
  'PROCUREMENT',
  'CUSTOMER_ESCALATION',
  'FINANCIAL_RISK',
  'PRODUCT_LAUNCH',
  'BUSINESS_CONTINUITY',
  'EXECUTIVE_DECISION',
  'DATA_QUALITY',
  'GLOBAL_EXPANSION',
];

export const OPERATIONS_AGENT_ROLES: readonly OperationsAgentRole[] = [
  'ChiefOperationsAgent',
  'ExecutiveOperationsAgent',
  'SupplyChainOperationsAgent',
  'ProcurementOperationsAgent',
  'InventoryOperationsAgent',
  'WarehouseOperationsAgent',
  'TransportationOperationsAgent',
  'ManufacturingOperationsAgent',
  'QualityOperationsAgent',
  'FinanceOperationsAgent',
  'SecurityOperationsAgent',
  'LegalWorkflowAgent',
  'ComplianceOperationsAgent',
  'CustomerOperationsAgent',
  'PeopleOperationsAgent',
  'DataOperationsAgent',
  'InfrastructureOperationsAgent',
  'MediaOperationsAgent',
  'InternationalOperationsAgent',
  'SustainabilityOperationsAgent',
];
