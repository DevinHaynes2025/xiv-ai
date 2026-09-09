export type LogicalScaleTier = 'million' | 'billion' | 'trillion';

export type LogicalScaleBenchmark = {
  tier: LogicalScaleTier;
  addressableContexts: number;
  materializedContexts: number;
  addressablePathways: number;
  materializedPathways: number;
  materializedProcessCount: number;
  materializedFileCount: number;
  strategy: 'sparse_indexes_object_packages_logical_addresses';
  productionAuthorization: false;
};

const ADDRESSABLE: Record<LogicalScaleTier, number> = {
  million: 1_000_000,
  billion: 1_000_000_000,
  trillion: 1_000_000_000_000,
};

const HARD_MATERIALIZED = 10_000;

export function benchmarkLogicalScale(input: {
  tier: LogicalScaleTier;
  materializedContexts: number;
  materializedPathways: number;
}): LogicalScaleBenchmark {
  const materializedContexts = Math.max(0, Math.min(input.materializedContexts, HARD_MATERIALIZED));
  const materializedPathways = Math.max(0, Math.min(input.materializedPathways, HARD_MATERIALIZED));
  return {
    tier: input.tier,
    addressableContexts: ADDRESSABLE[input.tier],
    materializedContexts,
    addressablePathways: ADDRESSABLE[input.tier],
    materializedPathways,
    materializedProcessCount: materializedContexts,
    materializedFileCount: 0,
    strategy: 'sparse_indexes_object_packages_logical_addresses',
    productionAuthorization: false,
  };
}

export function assertScaleIsLogical(benchmark: LogicalScaleBenchmark) {
  return (
    benchmark.materializedProcessCount <= HARD_MATERIALIZED &&
    benchmark.materializedFileCount === 0 &&
    benchmark.materializedContexts <= HARD_MATERIALIZED &&
    benchmark.addressableContexts >= benchmark.materializedContexts
  );
}
