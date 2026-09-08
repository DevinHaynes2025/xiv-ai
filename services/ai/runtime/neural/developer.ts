/**
 * Developer ecosystem contracts for Phase 2I-W.
 * Sandbox and SDK surfaces only. No production secret materialization.
 */

export type DeveloperWorkspace = {
  workspaceId: string;
  productionSecretsInSource: false;
  productionAccess: false;
};

export type DeveloperSdkBinding = {
  bindingId: string;
  tenantRequired: true;
  universeRequired: true;
};

export type DeveloperTooling = {
  debuggerCanDeploy: false;
  debuggerCanExecuteShell: false;
  canBypassGuardian: false;
};

export function openDeveloperWorkspace(input: { tenantId: string; universeId: string }): DeveloperWorkspace {
  return {
    workspaceId: `dev:${input.tenantId}:${input.universeId}`,
    productionSecretsInSource: false,
    productionAccess: false,
  };
}

export function bindDeveloperSdk(input: { tenantId?: string; universeId?: string }) {
  if (!input.tenantId || !input.universeId) {
    return { allowed: false as const, reason: 'developer_sdk_requires_tenant_and_universe' };
  }
  return {
    allowed: true as const,
    binding: {
      bindingId: `sdk:${input.tenantId}:${input.universeId}`,
      tenantRequired: true as const,
      universeRequired: true as const,
    } satisfies DeveloperSdkBinding,
  };
}

export function developerTooling(): DeveloperTooling {
  return {
    debuggerCanDeploy: false,
    debuggerCanExecuteShell: false,
    canBypassGuardian: false,
  };
}

export function developerSandboxAccessesProduction(): false {
  return false;
}

export function developerStoresRawDbCredential(): false {
  return false;
}
