/**
 * 62L-EX5 — QPU Provider Truth Registry barrel.
 * Extends runtime/quantum — not a second orchestration framework.
 * Soft-wires EX1–EX4 / Agent Mesh / chipgraph / evidence / benchmark via existsSync.
 */

export * from './qpu-types.ts';
export * from './qpu-soft-wire.ts';
export * from './qpu-cost-policy.ts';
export * from './qpu-provider.ts';
export * from './qpu-registry.ts';
export * from './qpu-job.ts';
export * from './qpu-receipt.ts';
export * from './qpu-router.ts';
export {
  createStubProviderAdapter,
  listStubAdapters,
  PROVIDER_ADAPTER_CANDIDATES,
} from './providers/index.ts';
