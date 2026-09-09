/**
 * 62L-EM9 — Compute Resource Market Simulator contracts.
 *
 * Estimate-only comparison of local / edge / authorized-cloud compute.
 * Simulation does not execute the workload.
 */

import type {
  ComputeNode,
  ComputeTaskRequest,
  ComputeTruthState,
  MeasuredEvidence,
  PlacementClass,
  PrivacyClass,
} from './universal-compute-registry-types';

/** Explicit UNKNOWN sentinel — used when pricing/capacity cannot be evidenced. */
export type UnknownValue = 'UNKNOWN';

export type CompareDimension =
  | 'cpu_gpu_npu_availability'
  | 'model_compatibility'
  | 'measured_latency'
  | 'throughput'
  | 'ram_vram_requirements'
  | 'reliability_history'
  | 'privacy_locality_fit'
  | 'network_dependence'
  | 'energy_proxy'
  | 'estimated_cost'
  | 'queue_delay'
  | 'data_egress_impact'
  | 'fallback_quality';

export const EM9_COMPARE_DIMENSIONS: readonly CompareDimension[] = [
  'cpu_gpu_npu_availability',
  'model_compatibility',
  'measured_latency',
  'throughput',
  'ram_vram_requirements',
  'reliability_history',
  'privacy_locality_fit',
  'network_dependence',
  'energy_proxy',
  'estimated_cost',
  'queue_delay',
  'data_egress_impact',
  'fallback_quality',
] as const;

export type DeviceDescriptor = {
  placement: PlacementClass;
  vendor: ComputeNode['vendor'];
  deviceType: ComputeNode['deviceType'];
  cpuPresent: boolean;
  gpuPresent: boolean;
  npuPresent: boolean;
  label: string;
};

export type EstimateNumberOrUnknown = number | UnknownValue;

/**
 * Candidate route returned by the market simulator (estimate-only).
 * Required fields per EM9 contract.
 */
export type MarketCandidate = {
  nodeId: string;
  device: DeviceDescriptor;
  verificationState: ComputeTruthState;
  estimatedLatency: EstimateNumberOrUnknown;
  estimatedCost: EstimateNumberOrUnknown;
  privacyScore: number;
  reliabilityScore: number;
  energyProxy: EstimateNumberOrUnknown;
  queueEstimate: EstimateNumberOrUnknown;
  confidence: number;
  evidenceRefs: string[];
  /** Research lane for NOT_TESTED / unverified hardware — never production recommend. */
  lane: 'production_eligible' | 'research';
  localityFit: number;
  networkDependence: number;
  dataEgressImpact: EstimateNumberOrUnknown;
  fallbackQuality: number;
  classicalScore: number;
  measuredCapacity: EstimateNumberOrUnknown;
  denialCodes: string[];
  reasons: string[];
};

export type HistoricalBenchmark = {
  nodeId: string;
  metric: string;
  value: number;
  unit: string;
  /** Required — historical data without timestamp is rejected. */
  recordedAt: string;
  evidenceId: string;
};

export type MarketSimulationRequest = {
  task: ComputeTaskRequest;
  /** Declared model / runtime compatibility tags the route must satisfy when set. */
  requiredModelTags?: string[];
  /** RAM requirement (bytes) — used for fit scoring when known. */
  requiredRamBytes?: number;
  /** VRAM requirement (bytes) — UNKNOWN fit when node VRAM unknown. */
  requiredVramBytes?: number;
  /** Expected tokens or units for throughput comparison (optional). */
  expectedThroughputUnits?: number;
  /** When true, recommendation is consequential and must gate. */
  consequential?: boolean;
  /** Optional queue depth hints keyed by nodeId — never invented. */
  queueHints?: Record<string, number>;
  /** Historical benchmarks (must include timestamps). */
  historicalBenchmarks?: HistoricalBenchmark[];
  /** Optional model tags declared per nodeId. */
  nodeModelTags?: Record<string, string[]>;
  /** If true, attempt quantum-inspired ranking hook (still classical-first). */
  enableQuantumInspiredHook?: boolean;
  now?: string;
};

export type GateDecision = {
  required: boolean;
  status: 'NOT_REQUIRED' | 'PENDING_HUMAN_OR_POLICY' | 'DENIED_AUTONOMOUS';
  reason: string;
  recommendEqualsExecute: false;
};

export type QuantumInspiredHookResult = {
  attempted: boolean;
  classicalBaselinePassed: boolean;
  quantumAdvantageClaimed: false;
  classicalTopNodeId: string | null;
  quantumInspiredTopNodeId: string | null;
  matchesClassicalTop: boolean | null;
  reason: string;
};

export type MarketSimulationResult = {
  taskId: string;
  simulatedAt: string;
  /** Hard lock evidence — simulator never executed workload. */
  executedWorkload: false;
  purchasedOrProvisioned: false;
  fabricatedPrices: false;
  fabricatedCapacity: false;
  l4AutonomyEnabled: false;
  compareDimensions: readonly CompareDimension[];
  eligibleVerifiedNodeIds: string[];
  researchCandidates: MarketCandidate[];
  productionCandidates: MarketCandidate[];
  rankedProduction: MarketCandidate[];
  recommended: MarketCandidate | null;
  recommendationLane: 'production' | 'none';
  cheapestNodeId: string | null;
  cheapestIsRecommended: boolean;
  localityPreferenceApplied: boolean;
  gate: GateDecision;
  quantumHook: QuantumInspiredHookResult;
  rejectedBenchmarks: Array<{ evidenceId?: string; reason: string }>;
  softWireNote: string;
  reason: string;
};

export type { ComputeNode, ComputeTaskRequest, PrivacyClass, MeasuredEvidence };
