/**
 * Logical dimensional-compute contracts for XIV AI.
 * "Dimensions" are computational/semantic axes, not claims about physical spacetime.
 */

export type DimensionCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type ExtendedDimensionCount = number;

export type ComputeBackend =
  | 'cpu'
  | 'gpu'
  | 'npu'
  | 'quantum-simulator'
  | 'qpu';

export type SiliconFamily =
  | 'amd'
  | 'nvidia'
  | 'arm'
  | 'apple'
  | 'intel'
  | 'samsung'
  | 'generic';

export type StorageTier = 'local' | 'edge' | 'cloud' | 'archive';

export interface DimensionalPoint {
  dimensions: number;
  coordinates: readonly number[];
}

export interface DimensionalWorkload {
  id: string;
  dimensions: number;
  operation: 'project' | 'search' | 'simulate' | 'optimize' | 'graph-path';
  requiredBackend?: ComputeBackend;
  offlineAllowed: boolean;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface DeviceCapability {
  deviceId: string;
  silicon: SiliconFamily;
  backends: readonly ComputeBackend[];
  maxLogicalDimensions: number;
  offlineReady: boolean;
  verified: boolean;
}

export interface DataGene {
  /** Content-addressed identity; analogy to a gene, not biological DNA. */
  contentHash: string;
  schemaVersion: string;
  provenance: readonly string[];
  createdAt: string;
}

export interface PathwayEdge {
  from: string;
  to: string;
  weight: number;
  evidenceScore: number;
}

export interface RouteDecision {
  workloadId: string;
  backend: ComputeBackend;
  deviceId: string;
  dimensions: number;
  reason: string;
  productionAuthorized: false;
}
