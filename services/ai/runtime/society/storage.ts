import { storageLabeledInfinite } from '../planetary/vaults';
import type { StorageEngine, StorageTier } from './types';

export const STORAGE_ENGINES: readonly StorageEngine[] = [
  'OBJECT',
  'RELATIONAL',
  'GRAPH',
  'VECTOR',
  'SEARCH',
  'STREAM',
  'TIME_SERIES',
  'CACHE',
  'ARCHIVE',
];

export const INTELLIGENCE_STORAGE_TIERS: readonly StorageTier[] = ['HOT', 'WARM', 'COLD', 'ARCHIVE', 'SOURCE_REFERENCE'];

export function intelligenceStorageLabeledInfinite(): boolean {
  return storageLabeledInfinite();
}

export function trillionScaleClaimedWithoutBenchmark(): false {
  return false;
}
