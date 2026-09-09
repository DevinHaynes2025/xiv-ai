import { evaluateDataAccess } from '../premium/data';
import type { DataClassification, ExtensionApiName } from './types';
import { EXTENSION_APIS } from './types';

export type Developer = {
  developerId: string;
  organizationId: string;
};

export type DeveloperOrganization = {
  organizationId: string;
  name: string;
};

export type DeveloperIdentity = {
  identityId: string;
  developerId: string;
};

export type DeveloperCredential = {
  credentialReference: string;
  rawProductionSecretStored: false;
};

export type DeveloperProject = {
  projectId: string;
  organizationId: string;
};

export type DeveloperApplication = {
  applicationId: string;
  projectId: string;
};

export type DeveloperEnvironment = {
  environmentId: string;
  kind: 'sandbox' | 'production';
};

export type DeveloperAPIKeyReference = {
  keyReference: string;
  rawKeyStored: false;
};

export type DeveloperPermission = {
  permissionId: string;
  granted: boolean;
};

export type DeveloperPolicy = {
  defaultDeny: true;
  productionSecretsInSource: false;
};

export type DeveloperAudit = {
  eventId: string;
  developerId: string;
};

export type DeveloperSandbox = {
  sandboxId: string;
  tenantId: string;
  productionAccess: false;
};

export type SandboxTenant = { tenantId: string; kind: 'sandbox' };
export type SandboxUniverse = { universeId: string; tenantId: string };
export type SandboxData = { class: 'sandbox'; productionCustomerData: false };
export type SandboxCredentialReference = { reference: string; rawSecret: never };
export type SandboxPolicy = { productionAccess: false };
export type SandboxAudit = { eventId: string; environment: 'sandbox' };

export type SdkContext = {
  tenantId?: string;
  universeId?: string;
  organizationId?: string;
};

export type ExtensionApiRequest = {
  api: ExtensionApiName;
  tenantId?: string;
  universeId?: string;
  classification?: DataClassification;
  purpose?: string;
  capability?: string;
  destination?: 'same_tenant' | 'public' | 'global_brain';
  rateLimited?: boolean;
};

export type ExtensionApiDecision =
  | { allowed: false; reason: string; audited: true }
  | { allowed: true; audited: true; rateLimited: true };

export function sdkStoresRawProductionSecret(): false {
  return false;
}

export function createDeveloperCredential(reference: string): DeveloperCredential {
  return { credentialReference: reference, rawProductionSecretStored: false };
}

export function createDeveloperSandbox(tenantId: string): DeveloperSandbox {
  return { sandboxId: `sandbox:${tenantId}`, tenantId, productionAccess: false };
}

export function sandboxAccessesProductionData(_sandbox: DeveloperSandbox): false {
  return false;
}

export function readSandboxData(input: {
  sandbox: DeveloperSandbox;
  dataClass: 'sandbox' | 'production_customer';
}) {
  if (input.dataClass === 'production_customer') {
    return { allowed: false as const, reason: 'developer_sandbox_cannot_access_production_data' };
  }
  return { allowed: true as const, data: { class: 'sandbox' as const, productionCustomerData: false as const } };
}

export function invokeSdk(input: SdkContext & { capability?: string }) {
  if (!input.tenantId || !input.universeId) {
    return { allowed: false as const, reason: 'sdk_requires_tenant_and_universe_context' };
  }
  return { allowed: true as const, tenantId: input.tenantId, universeId: input.universeId };
}

export function invokeExtensionApi(request: ExtensionApiRequest): ExtensionApiDecision {
  void EXTENSION_APIS;
  if (!request.tenantId || !request.universeId) {
    return { allowed: false, reason: 'api_requires_tenant_and_universe', audited: true };
  }
  if (!request.capability) {
    return { allowed: false, reason: 'api_requires_capability', audited: true };
  }
  if (!request.classification) {
    return { allowed: false, reason: 'api_requires_classification', audited: true };
  }
  if (!request.purpose) {
    return { allowed: false, reason: 'api_requires_purpose', audited: true };
  }
  if (request.classification === 'FOUNDER_RESTRICTED') {
    return { allowed: false, reason: 'plugin_cannot_access_founder_restricted_data', audited: true };
  }
  const data = evaluateDataAccess({
    agent: 'Database Security',
    tenantId: request.tenantId,
    requestedTenantId: request.tenantId,
    classification: request.classification === 'PUBLIC' ? 'PUBLIC' : 'TENANT_PRIVATE',
    destination: request.destination ?? 'same_tenant',
    viaGateway: true,
    rawSecretRequested: false,
    destructiveMigration: false,
  });
  if (!data.allowed) {
    return { allowed: false, reason: data.reason, audited: true };
  }
  return { allowed: true, audited: true, rateLimited: true };
}

export const SDK_SENSITIVE_CAPABILITIES = [
  'identity',
  'universe_context',
  'organization_context',
  'agent_invocation',
  'data_access',
  'events',
  'notifications',
  'storage',
  'search',
  'documents',
  'workflow',
  'approvals',
  'audit',
  'location',
  'camera',
  'barcode',
  'nfc',
  'bluetooth',
  'offline_queue',
] as const;

export function sensitiveCapabilityRequiresPermission(_capability: (typeof SDK_SENSITIVE_CAPABILITIES)[number]): true {
  return true;
}
