import { evaluateBrainTransfer } from '../fabric';
import { evaluateDataAccess } from '../premium/data';
import type { UniverseFabricType } from './types';

export type UniversePolicy = { privateByDefault: boolean };
export type UniverseDataBoundary = { tenantIsolated: true };
export type UniverseRelationship = { from: UniverseFabricType; to: UniverseFabricType; autoPromote: false };

export type UniverseFabric = {
  type: UniverseFabricType;
  policy: UniversePolicy;
  spaceBasedServersRequired: false;
};

export const UNIVERSE_FABRIC_TYPES: readonly UniverseFabricType[] = [
  'PERSONAL',
  'COMPANY',
  'SUPPLIER',
  'INDUSTRY',
  'COMMUNITY',
  'KNOWLEDGE',
  'HISTORICAL',
  'EARTH',
  'GLOBAL_PUBLIC',
];

export function openUniverseFabric(type: UniverseFabricType): UniverseFabric {
  return {
    type,
    policy: { privateByDefault: type === 'PERSONAL' || type === 'COMPANY' },
    spaceBasedServersRequired: false,
  };
}

export function universeBypassesTenantIsolation(type: UniverseFabricType, tenantId: string, requestedTenantId: string): boolean {
  void type;
  return evaluateDataAccess({
    agent: 'Graph',
    tenantId,
    requestedTenantId,
    classification: 'TENANT_PRIVATE',
    destination: 'same_tenant',
    viaGateway: true,
    rawSecretRequested: false,
    destructiveMigration: false,
  }).allowed === true && tenantId !== requestedTenantId;
}

export function companyUniverseRemainsPrivate(): boolean {
  return evaluateBrainTransfer({ from: 'company', to: 'global' }).allowed === false;
}

export function personalUniverseRemainsPrivate(): boolean {
  return evaluateBrainTransfer({ from: 'personal', to: 'global' }).allowed === false;
}
