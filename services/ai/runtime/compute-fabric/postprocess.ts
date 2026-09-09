/**
 * 62L-EX17 — post-processing fabric with provenance.
 */

import type { ComputeStageRequest, ProvenanceRecord } from './types.ts';

export type PostprocessResult = {
  ok: true;
  provenance: ProvenanceRecord;
};

export function runPostprocessFabric(
  request: ComputeStageRequest,
  inputRefs: readonly string[] = [`execute:${request.requestId}`],
): PostprocessResult {
  return {
    ok: true,
    provenance: {
      provenanceId: `prov-post-${request.requestId}`,
      fabric: 'POSTPROCESS',
      inputs: inputRefs,
      outputs: [`postprocessed:${request.requestId}`],
      classicalStages: ['DECODE', 'POSTPROCESS', 'VERIFY'],
      quantumClaimed: false,
      purelyQuantumEndToEnd: false,
    },
  };
}
