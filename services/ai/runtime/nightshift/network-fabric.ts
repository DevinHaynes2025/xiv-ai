/**
 * Network Abstraction Fabric — authorized connectivity only.
 * Network presence ≠ authorization. Providers stay NOT_CONFIGURED without proof.
 */
import type { CapabilityLifecycle, NetworkFabricMode } from './types';

export type NetworkAbstractionFabric = {
  fabricId: string;
  mode: NetworkFabricMode;
  networkIsAuthorization: false;
  NetworkProvider: CapabilityLifecycle;
  productionLive: false;
};

export function openNetworkAbstractionFabric(
  mode: NetworkFabricMode = 'AUTHORIZED_CONNECTIVITY',
): NetworkAbstractionFabric {
  return {
    fabricId: 'network-abstraction-fabric',
    mode,
    networkIsAuthorization: false,
    NetworkProvider: 'NOT_CONFIGURED',
    productionLive: false,
  };
}

export function authorizeNetworkPath(input: {
  connectivityPresent: boolean;
  guardianApproved: boolean;
  purpose: string;
  authorizedEndpoint: boolean;
}) {
  if (!input.guardianApproved) {
    return { allowed: false as const, reason: 'network_path_requires_guardian' };
  }
  if (!input.purpose) {
    return { allowed: false as const, reason: 'purpose_required' };
  }
  if (!input.authorizedEndpoint) {
    return { allowed: false as const, reason: 'unauthorized_endpoint' };
  }
  // Connectivity alone never authorizes.
  if (input.connectivityPresent && !input.guardianApproved) {
    return { allowed: false as const, reason: 'network_is_not_authorization' };
  }
  return {
    allowed: true as const,
    networkIsAuthorization: false as const,
    NetworkProvider: 'NOT_CONFIGURED' as const,
  };
}

export function networkEqualsAuthorization(): false {
  return false;
}

export function networkProviderState(): CapabilityLifecycle {
  return 'NOT_CONFIGURED';
}

export function unauthorizedConnectivityAllowed(): false {
  return false;
}
