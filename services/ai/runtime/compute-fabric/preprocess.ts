/**
 * 62L-EX17 — preprocessing + quantum preprocessing fabrics with provenance.
 * Never call end-to-end purely quantum when major stages are classical.
 */

import {
  EX17_LOCKS,
  ex17Deny,
  type ComputeStageRequest,
  type Ex17Denial,
  type ProvenanceRecord,
} from './types.ts';

export type PreprocessResult =
  | {
      ok: true;
      provenance: ProvenanceRecord;
      classicalDominant: boolean;
      quantumPreprocessApplied: boolean;
    }
  | Ex17Denial;

export function runPreprocessFabric(
  request: ComputeStageRequest,
  inputRefs: readonly string[] = ['raw-payload'],
): PreprocessResult {
  if (request.claimPurelyQuantumEndToEnd === true) {
    return ex17Deny('PURELY_QUANTUM_E2E_CLAIM_FORBIDDEN');
  }
  if (
    request.majorStagesClassical &&
    EX17_LOCKS.END_TO_END_PURELY_QUANTUM_WHEN_MAJOR_STAGES_CLASSICAL === false
  ) {
    // Proceed classically; never mark as purely quantum e2e.
  }

  const quantumPreprocessApplied =
    request.requestedDevice === 'SIMULATOR_CPU' ||
    request.requestedDevice === 'SIMULATOR_GPU' ||
    request.requestedDevice === 'PHYSICAL_QPU_CANDIDATE';

  const provenance: ProvenanceRecord = {
    provenanceId: `prov-pre-${request.requestId}`,
    fabric: quantumPreprocessApplied ? 'QUANTUM_PREPROCESS' : 'PREPROCESS',
    inputs: inputRefs,
    outputs: [`preprocessed:${request.requestId}`],
    classicalStages: request.majorStagesClassical
      ? ['INGEST', 'VALIDATE', 'PREPROCESS', 'ENCODE']
      : ['PREPROCESS'],
    quantumClaimed: quantumPreprocessApplied,
    purelyQuantumEndToEnd: false,
  };

  return {
    ok: true,
    provenance,
    classicalDominant: request.majorStagesClassical,
    quantumPreprocessApplied,
  };
}
