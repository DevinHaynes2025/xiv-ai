/**
 * Bottleneck evidence routing — links path/matrix evidence to HC2 analyzer
 * bottleneck classes (COMPUTE_BOUND, MEMORY_BOUND, DATA_TRANSFER_BOUND, …).
 * Soft-wires HC2 when present; presence ≠ VERIFIED.
 */

import {
  BOTTLENECK_CLASSES,
  softWireHopState,
  type BottleneckClass,
  type Hc3SoftWireSnapshot,
  type SoftWirePresence,
  type TenantScope,
  hc3SoftWireSnapshot,
} from './types.ts';
import type { ChipPath } from './path-graph.ts';
import type { HardwareMatrixEntry } from './registry.ts';

export type BottleneckEvidenceLink = {
  linkId: string;
  pathId: string;
  matrixEntryId: string | null;
  bottleneckClass: BottleneckClass;
  evidenceRefs: readonly string[];
  hc2SoftWire: SoftWirePresence;
  hc2ConceptsAvailable: boolean;
  /** Recommendation only — recommend ≠ act. */
  recommendation: string;
  scope: TenantScope;
  at: string;
};

export type RouteBottleneckInput = {
  linkId: string;
  path: ChipPath;
  matrixEntry: HardwareMatrixEntry | null;
  bottleneckClass: BottleneckClass;
  evidenceRefs: readonly string[];
  observedTransferBound?: boolean;
  scope: TenantScope;
  repoRoot?: string;
};

/**
 * Route bottleneck classification onto a chip path.
 * When HC2 absent → WAITING_DATA concepts note, still records the class locally.
 */
export function routeBottleneckEvidence(
  input: RouteBottleneckInput,
): BottleneckEvidenceLink {
  const soft: Hc3SoftWireSnapshot = hc3SoftWireSnapshot(input.repoRoot);
  const hc2 = soft.hc2ChipBottleneckAnalyzer;
  const hc2ConceptsAvailable = hc2.present;

  let recommendation: string;
  if (input.bottleneckClass === 'DATA_TRANSFER_BOUND') {
    recommendation =
      'DATA_TRANSFER_BOUND — do not blindly move workload to GPU; prefer locality / batching / layout (HC2 concept). Recommend≠act.';
  } else if (input.bottleneckClass === 'COMPUTE_BOUND') {
    recommendation =
      'COMPUTE_BOUND — candidate software fixes only (quantization/batching/runtime); no silicon modify.';
  } else if (input.bottleneckClass === 'MEMORY_BOUND') {
    recommendation =
      'MEMORY_BOUND — memory layout / precision / caching candidates; evidence-gated.';
  } else {
    recommendation = `${input.bottleneckClass} — classify from evidence; software-level candidates only.`;
  }

  if (!hc2ConceptsAvailable) {
    recommendation +=
      ' HC2 analyzer soft-wire WAITING_DATA — class mirrored locally.';
  }

  // Fallback honesty: if path used fallback, do not imply accelerator fixed the bottleneck.
  if (input.path.usesFallback) {
    recommendation +=
      ' Path used CPU/GPU/NPU fallback — fallback ≠ claimed accelerator VERIFIED.';
  }

  return {
    linkId: input.linkId,
    pathId: input.path.pathId,
    matrixEntryId: input.matrixEntry?.entryId ?? input.path.matrixEntryId,
    bottleneckClass: input.bottleneckClass,
    evidenceRefs: input.evidenceRefs,
    hc2SoftWire: hc2,
    hc2ConceptsAvailable,
    recommendation,
    scope: input.scope,
    at: new Date().toISOString(),
  };
}

export function isKnownBottleneckClass(value: string): value is BottleneckClass {
  return (BOTTLENECK_CLASSES as readonly string[]).includes(value);
}

export function bottleneckSoftWireState(
  snapshot?: Hc3SoftWireSnapshot,
): 'PASS' | 'WAITING_DATA' {
  const soft = snapshot ?? hc3SoftWireSnapshot();
  return softWireHopState(soft.hc2ChipBottleneckAnalyzer.present);
}

export { BOTTLENECK_CLASSES };
