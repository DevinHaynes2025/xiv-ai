import type { ConnectivityTransport, DatabaseKind, EnterpriseCategory } from './types';

export const ENTERPRISE_VENDORS = ['cisco', 'ibm', 'oracle', 'microsoft', 'aws', 'gcp', 'snowflake', 'sap', 'salesforce'] as const;

export function connectivityIsAuthAuthority(_transport: ConnectivityTransport): false {
  return false;
}

export function enterpriseVendorStatus(vendor: (typeof ENTERPRISE_VENDORS)[number] | string): 'NOT_CONFIGURED' {
  void vendor;
  return 'NOT_CONFIGURED';
}

export function unconfiguredEnterpriseVendorRemainsNotConfigured(): boolean {
  return ENTERPRISE_VENDORS.every((vendor) => enterpriseVendorStatus(vendor) === 'NOT_CONFIGURED');
}

export function databaseConnectionBypassesClassification(input: {
  kind: DatabaseKind;
  classification: 'TENANT_PRIVATE' | 'PUBLIC';
  destination: 'same_tenant' | 'global_brain';
}): false {
  void input;
  return false;
}

export function enterpriseCategoryStatus(_category: EnterpriseCategory): 'NOT_CONFIGURED' {
  return 'NOT_CONFIGURED';
}
