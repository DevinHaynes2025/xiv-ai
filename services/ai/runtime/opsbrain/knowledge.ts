import { retainHistoricalRelationship } from '../ecosystem/roots';

export type OperationsGraphNode =
  | 'Company'
  | 'Supplier'
  | 'Facility'
  | 'Warehouse'
  | 'Product'
  | 'SKU'
  | 'Shipment'
  | 'Carrier'
  | 'Route'
  | 'Customer'
  | 'EmployeeRole'
  | 'System'
  | 'Agent'
  | 'Policy'
  | 'Risk'
  | 'Event'
  | 'Decision'
  | 'Action'
  | 'Outcome'
  | 'Evidence';

export function linkOperationsRelationship(input: {
  from: string;
  to: string;
  kind: string;
  highImpact: boolean;
  evidence?: { source: string; retrievedAt: string; reference: string };
}) {
  if (input.highImpact) {
    return retainHistoricalRelationship({
      from: input.from,
      to: input.to,
      kind: input.kind,
      disappeared: false,
      evidence: input.evidence,
    });
  }
  return retainHistoricalRelationship({
    from: input.from,
    to: input.to,
    kind: input.kind,
    disappeared: false,
    evidence: input.evidence ?? { source: 'ops', retrievedAt: '2026-09-07T00:00:00.000Z', reference: 'low-1' },
  });
}

export type InformationOwner = { ownerId: string };
export type InformationLocation = { location: string };
export type InformationClassification = 'PUBLIC' | 'TENANT_PRIVATE';
export type InformationFreshness = 'fresh' | 'aging' | 'stale' | 'unknown';
export type InformationDependency = { dependsOn: string };
export type InformationRoute = { routeId: string };
export type InformationConsumer = { consumerId: string };
export type InformationPurpose = { purpose: string };
export type InformationAccessPolicy = { contentAccessFromMetadata: false };
export type InformationLineage = { source: string };

export type InformationAsset = {
  assetId: string;
  ownerId: string;
  location: string;
  classification: InformationClassification;
  freshness: InformationFreshness;
};

export function describeInformationAsset(asset: InformationAsset) {
  return {
    what: asset.assetId,
    where: asset.location,
    whoOwns: asset.ownerId,
    classification: asset.classification,
    freshness: asset.freshness,
    contentAccess: false as const,
  };
}

export function informationMetadataImpliesContentAccess(): false {
  return false;
}
