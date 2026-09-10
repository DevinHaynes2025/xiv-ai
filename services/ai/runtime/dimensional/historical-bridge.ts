/**
 * Historical / temporal → PathwayEdge bridge.
 * Separates OBSERVED, HYPOTHESIS, and SIMULATION; ancient sources never auto-verify.
 */

import type { PathwayEdge } from './types';

export type HistoricalStance = 'OBSERVED' | 'HYPOTHESIS' | 'SIMULATION';

export type HistoricalTemporalRef = {
  /** Node id for the graph endpoint (claim, document, event, scenario). */
  refId: string;
  /** Optional peer for edge construction; if omitted, only metadata is computed. */
  relatedRefId?: string;
  stance: HistoricalStance;
  /** Caller-supplied raw confidence in [0, 1]; clamped and stance-gated. */
  rawEvidence?: number;
  /** True when the source is ancient / archaeological / poorly attested. */
  ancientSource?: boolean;
  /** Explicit human or curator verification — never implied by age alone. */
  curatorVerified?: boolean;
  weight?: number;
};

export type BridgedPathway = PathwayEdge & {
  stance: HistoricalStance;
  autoVerified: false;
  ancientSource: boolean;
};

const STANCE_EVIDENCE_CEILING: Readonly<Record<HistoricalStance, number>> = Object.freeze({
  OBSERVED: 1,
  HYPOTHESIS: 0.49,
  SIMULATION: 0.35,
});

/**
 * Ancient / unverified sources cannot exceed a low evidence ceiling and never auto-verify.
 */
export function evidenceScoreForRef(ref: HistoricalTemporalRef): number {
  const raw = clamp01(ref.rawEvidence ?? defaultRawForStance(ref.stance));
  let score = Math.min(raw, STANCE_EVIDENCE_CEILING[ref.stance]);

  if (ref.ancientSource && !ref.curatorVerified) {
    score = Math.min(score, 0.4);
  }
  // Even curator-verified ancient material is not auto-verified into production facts.
  if (ref.ancientSource) {
    score = Math.min(score, ref.curatorVerified ? 0.75 : score);
  }
  return score;
}

function defaultRawForStance(stance: HistoricalStance): number {
  switch (stance) {
    case 'OBSERVED':
      return 0.85;
    case 'HYPOTHESIS':
      return 0.4;
    case 'SIMULATION':
      return 0.25;
    default:
      return 0;
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Map a historical/temporal reference pair into a PathwayEdge with evidenceScore.
 * Ancient sources never set autoVerified; stance labels stay explicit.
 */
export function bridgeHistoricalRef(ref: HistoricalTemporalRef): BridgedPathway {
  if (!ref.refId) {
    throw new TypeError('refId is required');
  }
  const to = ref.relatedRefId ?? `${ref.refId}:context`;
  const evidenceScore = evidenceScoreForRef(ref);
  return {
    from: ref.refId,
    to,
    weight: ref.weight ?? 1,
    evidenceScore,
    stance: ref.stance,
    autoVerified: false,
    ancientSource: Boolean(ref.ancientSource),
  };
}

export function bridgeHistoricalRefs(refs: readonly HistoricalTemporalRef[]): BridgedPathway[] {
  return refs.map((ref) => bridgeHistoricalRef(ref));
}

/** Strip stance metadata for pathway search consumers that only accept PathwayEdge. */
export function asPathwayEdges(bridged: readonly BridgedPathway[]): PathwayEdge[] {
  return bridged.map(({ from, to, weight, evidenceScore }) => ({
    from,
    to,
    weight,
    evidenceScore,
  }));
}