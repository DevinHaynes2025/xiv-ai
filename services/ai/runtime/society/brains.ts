import type { LogicalBrainId } from './types';

export const GLOBAL_BRAIN_NETWORK: readonly LogicalBrainId[] = [
  'PERSONAL',
  'COMPANY',
  'INDUSTRY',
  'SUPPLY_CHAIN',
  'PRODUCT',
  'SUPPLIER',
  'ECONOMIC',
  'HISTORICAL',
  'CIVILIZATION',
  'LEGACY',
  'EARTH',
  'GLOBAL_BUSINESS',
];

export const BRAIN_LAYERS = [
  'Facts',
  'Claims',
  'Evidence',
  'Relationships',
  'Events',
  'Contradictions',
  'Interpretations',
  'Forecasts',
  'Lessons',
] as const;

export function brainsArePhysicalNestedDatabases(): false {
  return false;
}
