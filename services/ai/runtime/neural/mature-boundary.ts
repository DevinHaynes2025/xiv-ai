/**
 * Architectural boundary stub for Phase 2I-U mature communities.
 * Boundary only — no mature content, no production surface, no community implementation.
 */

export type MatureCommunityBoundary = {
  phase: '2I-U';
  implemented: false;
  productionEnabled: false;
  contentPresent: false;
  mixesIntoPhase2IW: false;
};

export type MatureBoundaryGate = {
  name: 'MatureCommunityBoundary';
  admitsMatureContent: false;
  productionLive: false;
};

export function openMatureCommunityBoundary(): MatureCommunityBoundary {
  return {
    phase: '2I-U',
    implemented: false,
    productionEnabled: false,
    contentPresent: false,
    mixesIntoPhase2IW: false,
  };
}

export function matureBoundaryGate(): MatureBoundaryGate {
  return {
    name: 'MatureCommunityBoundary',
    admitsMatureContent: false,
    productionLive: false,
  };
}

export function matureBoundaryIsProduction(): false {
  return false;
}

export function admitMatureContentIntoNeuralFabric(): false {
  return false;
}

export function evaluateMatureBoundaryRequest(input: { requestMatureContent: boolean }) {
  if (input.requestMatureContent) {
    return { allowed: false as const, reason: 'mature_content_not_in_phase_2iw' };
  }
  return { allowed: true as const, boundaryOnly: true as const };
}
