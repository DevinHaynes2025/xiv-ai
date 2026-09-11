export type LocalApiClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface LocalApiRoute {
  routeId: string;
  tenantId: string;
  path: string;
  classification: LocalApiClassification;
  localhostOnly: boolean;
  requiredScopes: string[];
  humanApprovalRequired: boolean;
}

export function validateLocalApiRoute(route: LocalApiRoute): boolean {
  if (!route.routeId || !route.tenantId || !route.path.startsWith('/')) return false;
  if (route.classification === 'TOP_SECRET' && !route.localhostOnly) return false;
  if (route.classification === 'TOP_SECRET' && route.requiredScopes.length === 0) return false;
  return true;
}

export const localApiGatewayGuardrails = {
  defaultBind: '127.0.0.1',
  topSecretExternalRoutingAllowed: false,
  plaintextSecretsAllowed: false,
  productionPublishRequiresHumanApproval: true,
};
