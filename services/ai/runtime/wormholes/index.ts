/**
 * 62L-EX18 — Quantum Research Wormhole Router barrel.
 * Prefer extending quantum/, agentmesh/, compute-fabric/, evidence/pathway when present.
 * Soft-wire honesty: presence ≠ VERIFIED; absent → WAITING_DATA.
 */

export * from './types.ts';
export * from './soft-wire.ts';
export * from './fingerprint.ts';
export * from './freshness.ts';
export * from './quarantine.ts';
export * from './registry.ts';
export * from './receipt.ts';
export * from './router.ts';
