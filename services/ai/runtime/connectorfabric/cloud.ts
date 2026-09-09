/**
 * Cloud Fabric + Enterprise Plugin targets.
 * Org connects only explicitly authorized accounts/projects/subscriptions.
 * Path: Identity → Tenant → Universe → Guardian → Connector → Cloud Policy → Resource Permission → Action → Audit
 * Cisco/network connectors never bypass network controls.
 */

import {
  CLOUD_AUTH_PATH,
  CLOUD_PROVIDER_KINDS,
  ENTERPRISE_PLUGIN_TARGETS,
  type CloudAuthPathHop,
  type CloudProviderKind,
  type ConnectorHealthState,
  type EnterprisePluginTarget,
} from './types';

export type CloudAccountBinding = {
  provider: CloudProviderKind;
  accountOrProjectId: string;
  tenantId: string;
  universeId: string;
  explicitlyAuthorized: boolean;
  healthState: ConnectorHealthState;
  productionCredentialsEnabled: false;
};

export type EnterprisePlugin = {
  target: EnterprisePluginTarget;
  healthState: ConnectorHealthState;
  bypassesNetworkControls: false;
  productionLive: false;
  evidence: null;
};

export function listCloudProviders(): readonly CloudProviderKind[] {
  return CLOUD_PROVIDER_KINDS;
}

export function listCloudAuthPath(): readonly CloudAuthPathHop[] {
  return CLOUD_AUTH_PATH;
}

export function listEnterprisePluginTargets(): readonly EnterprisePluginTarget[] {
  return ENTERPRISE_PLUGIN_TARGETS;
}

export function openCloudFabric() {
  return {
    providers: CLOUD_PROVIDER_KINDS.map(
      (provider): CloudAccountBinding => ({
        provider,
        accountOrProjectId: 'NONE',
        tenantId: 'none',
        universeId: 'none',
        explicitlyAuthorized: false,
        healthState: 'NOT_CONFIGURED',
        productionCredentialsEnabled: false,
      }),
    ),
    authPath: CLOUD_AUTH_PATH,
    autoConnectsAllAccounts: false as const,
    productionLive: false as const,
  };
}

export function bindCloudAccount(input: {
  provider: CloudProviderKind;
  accountOrProjectId: string;
  tenantId: string;
  universeId: string;
  explicitlyAuthorized: boolean;
}): { allowed: true; binding: CloudAccountBinding } | { allowed: false; reason: string } {
  if (!input.explicitlyAuthorized) {
    return { allowed: false, reason: 'explicit_authorization_required' };
  }
  if (!input.accountOrProjectId || input.accountOrProjectId === 'NONE') {
    return { allowed: false, reason: 'account_or_project_required' };
  }
  return {
    allowed: true,
    binding: {
      provider: input.provider,
      accountOrProjectId: input.accountOrProjectId,
      tenantId: input.tenantId,
      universeId: input.universeId,
      explicitlyAuthorized: true,
      healthState: 'CONFIGURED',
      productionCredentialsEnabled: false,
    },
  };
}

export function evaluateCloudAction(input: {
  binding: CloudAccountBinding;
  tenantId: string;
  universeId: string;
  guardianApproved: boolean;
  resourcePermission: boolean;
  audited: boolean;
}): { allowed: boolean; reason: string; path: readonly CloudAuthPathHop[] } {
  if (!input.binding.explicitlyAuthorized) {
    return { allowed: false, reason: 'cloud_account_not_authorized', path: CLOUD_AUTH_PATH };
  }
  if (input.binding.tenantId !== input.tenantId) {
    return { allowed: false, reason: 'tenant_mismatch', path: CLOUD_AUTH_PATH };
  }
  if (input.binding.universeId !== input.universeId) {
    return { allowed: false, reason: 'universe_mismatch', path: CLOUD_AUTH_PATH };
  }
  if (!input.guardianApproved) {
    return { allowed: false, reason: 'guardian_required', path: CLOUD_AUTH_PATH };
  }
  if (!input.resourcePermission) {
    return { allowed: false, reason: 'resource_permission_required', path: CLOUD_AUTH_PATH };
  }
  if (!input.audited) {
    return { allowed: false, reason: 'audit_required', path: CLOUD_AUTH_PATH };
  }
  return { allowed: true, reason: 'cloud_action_authorized', path: CLOUD_AUTH_PATH };
}

export function openEnterprisePlugins(): readonly EnterprisePlugin[] {
  return ENTERPRISE_PLUGIN_TARGETS.map((target) => ({
    target,
    healthState: 'NOT_CONFIGURED' as const,
    bypassesNetworkControls: false as const,
    productionLive: false as const,
    evidence: null,
  }));
}

export function pluginState(target: EnterprisePluginTarget): ConnectorHealthState {
  void target;
  return 'NOT_CONFIGURED';
}

export function ciscoMayBypassNetworkControls(): false {
  return false;
}

export function networkConnectorMayBypassControls(): false {
  return false;
}

export function evaluateCiscoCapability(input: {
  inventory?: boolean;
  telemetry?: boolean;
  deviceHealth?: boolean;
  securityEvents?: boolean;
  enterpriseNetworkingContext?: boolean;
  bypassNetworkControls?: boolean;
}): { allowed: boolean; reason: string; capabilities: string[] } {
  if (input.bypassNetworkControls === true) {
    return { allowed: false, reason: 'cisco_must_never_bypass_network_controls', capabilities: [] };
  }
  const capabilities: string[] = [];
  if (input.inventory) capabilities.push('authorized_network_inventory');
  if (input.telemetry) capabilities.push('authorized_telemetry');
  if (input.deviceHealth) capabilities.push('device_health');
  if (input.securityEvents) capabilities.push('security_events');
  if (input.enterpriseNetworkingContext) capabilities.push('enterprise_networking_context');
  return {
    allowed: true,
    reason: 'authorized_cisco_context_only',
    capabilities,
  };
}
