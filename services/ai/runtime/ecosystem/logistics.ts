import type { DataPlacement } from './types';

export type InformationLogisticsRecord = {
  exists: true;
  owner: string;
  freshness: 'UNKNOWN' | 'STALE' | 'CURRENT';
  provenance: { source: string; retrievedAt: string; reference: string };
  placement: DataPlacement;
};

export function informationLogisticsCopiesEveryDatabase(): false {
  return false;
}

export function placeInformation(placement: DataPlacement): InformationLogisticsRecord {
  return {
    exists: true,
    owner: 'tenant-a',
    freshness: 'UNKNOWN',
    provenance: { source: 'connector', retrievedAt: '2026-09-07T00:00:00.000Z', reference: 'info-1' },
    placement,
  };
}
