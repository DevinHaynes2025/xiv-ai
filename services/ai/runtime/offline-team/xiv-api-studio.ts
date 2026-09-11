export type ApiEnvironment = 'LOCAL_ONLY' | 'HYBRID' | 'CLOUD';
export type ApiVisibility = 'PRIVATE' | 'ORG' | 'PUBLIC';

export interface ApiStudioEndpoint {
  id: string;
  tenantId: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  environment: ApiEnvironment;
  visibility: ApiVisibility;
  requiredScopes: string[];
  secretRef?: string;
  topSecretAllowed: boolean;
  humanApprovalRequired: boolean;
}

export function validateApiEndpoint(endpoint: ApiStudioEndpoint): string[] {
  const errors: string[] = [];
  if (!endpoint.tenantId) errors.push('tenantId required');
  if (!endpoint.path.startsWith('/')) errors.push('path must start with /');
  if (endpoint.visibility === 'PUBLIC' && endpoint.topSecretAllowed) errors.push('TOP_SECRET cannot be public');
  if (endpoint.secretRef && !endpoint.secretRef.startsWith('vault://')) errors.push('secretRef must use vault:// reference');
  return errors;
}

export const API_STUDIO_GUARDRAILS = {
  plaintextSecretsAllowed: false,
  crossTenantBypassAllowed: false,
  publicTopSecretAllowed: false,
  productionPublishRequiresHumanApproval: true,
} as const;
