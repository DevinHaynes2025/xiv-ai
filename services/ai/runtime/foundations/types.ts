export type AcceleratorKind = 'CPU' | 'NVIDIA_GPU' | 'OTHER_GPU' | 'NPU_EDGE';

export type NvidiaSignal =
  | 'CUDA_AVAILABLE'
  | 'TENSORRT_AVAILABLE'
  | 'GPU_MEMORY'
  | 'GPU_COUNT'
  | 'COMPUTE_CAPABILITY'
  | 'MIG_AVAILABLE'
  | 'NVENC_AVAILABLE'
  | 'NVDEC_AVAILABLE';

export type AlgorithmClass =
  | 'OptimizationAlgorithm'
  | 'ForecastingAlgorithm'
  | 'RoutingAlgorithm'
  | 'SchedulingAlgorithm'
  | 'GraphAlgorithm'
  | 'SearchAlgorithm'
  | 'RankingAlgorithm'
  | 'RecommendationAlgorithm'
  | 'AnomalyDetectionAlgorithm'
  | 'ClusteringAlgorithm'
  | 'ClassificationAlgorithm'
  | 'SimulationAlgorithm'
  | 'DigitalTwinAlgorithm'
  | 'RiskAlgorithm'
  | 'AllocationAlgorithm'
  | 'InventoryAlgorithm'
  | 'NetworkFlowAlgorithm'
  | 'SupplyChainAlgorithm'
  | 'CostOptimizationAlgorithm';

export type OptimizationWorkload =
  | 'vehicle_routing'
  | 'warehouse_slotting'
  | 'inventory_optimization'
  | 'supplier_allocation'
  | 'production_scheduling'
  | 'network_design'
  | 'dock_scheduling'
  | 'load_planning'
  | 'forecast_reconciliation'
  | 'safety_stock_optimization'
  | 'multi_echelon_inventory'
  | 'facility_location'
  | 'constraint_optimization';

export type PolyglotStoreClass =
  | 'RELATIONAL'
  | 'GRAPH'
  | 'VECTOR'
  | 'SEARCH'
  | 'OBJECT'
  | 'STREAM'
  | 'TIME_SERIES'
  | 'CACHE'
  | 'WAREHOUSE_LAKEHOUSE'
  | 'ARCHIVE';

export type TrustRoot =
  | 'SecureBuildRoot'
  | 'CodeSigningRoot'
  | 'ArtifactIntegrityRoot'
  | 'DependencyTrustRoot'
  | 'DeviceTrustRoot'
  | 'IdentityTrustRoot'
  | 'SessionTrustRoot'
  | 'TenantTrustRoot'
  | 'UniverseTrustRoot'
  | 'DataTrustRoot'
  | 'AgentTrustRoot'
  | 'ModelTrustRoot'
  | 'PolicyTrustRoot'
  | 'AuditTrustRoot'
  | 'RecoveryRoot';

export type InfrastructurePlane = 'CONTROL_PLANE' | 'DATA_PLANE' | 'COMPUTE_PLANE';

export const NVIDIA_SIGNALS: readonly NvidiaSignal[] = [
  'CUDA_AVAILABLE',
  'TENSORRT_AVAILABLE',
  'GPU_MEMORY',
  'GPU_COUNT',
  'COMPUTE_CAPABILITY',
  'MIG_AVAILABLE',
  'NVENC_AVAILABLE',
  'NVDEC_AVAILABLE',
];

export const ALGORITHM_CLASSES: readonly AlgorithmClass[] = [
  'OptimizationAlgorithm',
  'ForecastingAlgorithm',
  'RoutingAlgorithm',
  'SchedulingAlgorithm',
  'GraphAlgorithm',
  'SearchAlgorithm',
  'RankingAlgorithm',
  'RecommendationAlgorithm',
  'AnomalyDetectionAlgorithm',
  'ClusteringAlgorithm',
  'ClassificationAlgorithm',
  'SimulationAlgorithm',
  'DigitalTwinAlgorithm',
  'RiskAlgorithm',
  'AllocationAlgorithm',
  'InventoryAlgorithm',
  'NetworkFlowAlgorithm',
  'SupplyChainAlgorithm',
  'CostOptimizationAlgorithm',
];

export const POLYGLOT_STORE_CLASSES: readonly PolyglotStoreClass[] = [
  'RELATIONAL',
  'GRAPH',
  'VECTOR',
  'SEARCH',
  'OBJECT',
  'STREAM',
  'TIME_SERIES',
  'CACHE',
  'WAREHOUSE_LAKEHOUSE',
  'ARCHIVE',
];

export const TRUST_ROOTS: readonly TrustRoot[] = [
  'SecureBuildRoot',
  'CodeSigningRoot',
  'ArtifactIntegrityRoot',
  'DependencyTrustRoot',
  'DeviceTrustRoot',
  'IdentityTrustRoot',
  'SessionTrustRoot',
  'TenantTrustRoot',
  'UniverseTrustRoot',
  'DataTrustRoot',
  'AgentTrustRoot',
  'ModelTrustRoot',
  'PolicyTrustRoot',
  'AuditTrustRoot',
  'RecoveryRoot',
];
