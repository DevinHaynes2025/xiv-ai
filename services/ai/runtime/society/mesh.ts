import { databaseConnectionBypassesClassification } from '../pocket/connectors';
import { knowledgeCrossOrgDenied } from '../knowledge/loop';
import type { MeshProviderClass } from './types';

export const MESH_PROVIDER_CLASSES: readonly MeshProviderClass[] = [
  'PUBLIC',
  'OPEN_LICENSE',
  'LICENSED',
  'PARTNER',
  'TENANT_AUTHORIZED',
];

export function unauthorizedNetworkSourceDenied(authorized: boolean): boolean {
  return authorized === false;
}

export function unauthorizedDatabaseDenied(authorized: boolean): boolean {
  return (
    authorized === false &&
    databaseConnectionBypassesClassification({
      kind: 'RELATIONAL',
      classification: 'TENANT_PRIVATE',
      destination: 'global_brain',
    }) === false
  );
}

export function interceptOverseasNetworks(): false {
  return false;
}

export function secretlyListenToCommunications(): false {
  return false;
}

export function harvestCredentials(): false {
  return false;
}

export function bypassProviderAccessControls(): false {
  return false;
}

export function societyCrossOrgDenied(): boolean {
  return knowledgeCrossOrgDenied();
}
