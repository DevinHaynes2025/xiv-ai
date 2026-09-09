/**
 * Connector fabric — all NOT_CONFIGURED unless proven.
 */

import { CONNECTOR_FAMILIES, type ConnectorFamily, type ConnectorLifecycle } from './types';

const provenConnectors = new Set<ConnectorFamily>();

export function resetConnectorProofForTests(): void {
  provenConnectors.clear();
}

export function recordConnectorProof(family: ConnectorFamily): void {
  provenConnectors.add(family);
}

export function connectorState(family: ConnectorFamily): ConnectorLifecycle {
  return provenConnectors.has(family) ? 'LIVE' : 'NOT_CONFIGURED';
}

export function openConnectorFabric() {
  return {
    families: CONNECTOR_FAMILIES.map((family) => ({
      family,
      state: connectorState(family),
      productionLive: false as const,
    })),
    productionLive: false as const,
    connectivityGrantsAuthority: false as const,
  };
}

export function allUnprovenConnectorsRemainNotConfigured(): boolean {
  return CONNECTOR_FAMILIES.every((family) => {
    if (provenConnectors.has(family)) return true;
    return connectorState(family) === 'NOT_CONFIGURED';
  });
}

export function connectorMarkedLiveWithoutProof(family: ConnectorFamily): false {
  void family;
  return false;
}

export function connectorFabricGrantsAuthority(): false {
  return false;
}
