import { cortexId } from './cortex-store';
import { runOfflineExperiment, type OfflineExperimentRun } from './offline-experiment-factory';
import type { ExperimentCandidate } from './autonomous-research-types';
import type { EvidenceState } from './autonomous-research-types';

export type IndependentReplication = {
  id: string;
  tenantId: string;
  universeId: string;
  originalId: string;
  replicaId: string;
  originalLane: 'primary';
  replicaLane: 'independent';
  sharedMutableState: false;
  digestMatch: boolean;
  measurementAgreed: boolean;
  evidenceState: EvidenceState;
  originalState: EvidenceState;
  replicaState: EvidenceState;
  notes: string[];
  inventedDiscovery: false;
  productionAuthorization: false;
};

export async function replicateIndependently(input: {
  tenantId: string;
  universeId: string;
  original: OfflineExperimentRun;
  candidate: ExperimentCandidate;
  softwareCwd?: string;
  root?: string;
}): Promise<IndependentReplication> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.original.tenantId !== input.tenantId || input.original.universeId !== input.universeId) {
    throw new Error('REPLICATION_TENANT_UNIVERSE_MISMATCH');
  }

  const replica = await runOfflineExperiment({
    tenantId: input.tenantId,
    universeId: input.universeId,
    candidate: input.candidate,
    softwareCwd: input.softwareCwd,
    replicaLane: 'independent',
    root: input.root,
  });

  const digestMatch = replica.manifest.digest === input.original.manifest.digest
    && replica.manifest.protocol === input.original.manifest.protocol
    && replica.kind === input.original.kind;
  const measurementAgreed = digestMatch
    && replica.measurement.metric === input.original.measurement.metric
    && replica.measurement.value === input.original.measurement.value
    && replica.evidenceState === input.original.evidenceState;

  let evidenceState: EvidenceState;
  if (!digestMatch) evidenceState = 'FAIL';
  else if (input.original.evidenceState === 'NOT_TESTED' || replica.evidenceState === 'NOT_TESTED') evidenceState = 'NOT_TESTED';
  else if (input.original.evidenceState === 'WAITING_DATA' || replica.evidenceState === 'WAITING_DATA') evidenceState = 'WAITING_DATA';
  else if (input.original.evidenceState === 'UNAVAILABLE' || replica.evidenceState === 'UNAVAILABLE') evidenceState = 'UNAVAILABLE';
  else if (!measurementAgreed) evidenceState = 'FAIL';
  else if (input.original.evidenceState === 'PASS' && replica.evidenceState === 'PASS') evidenceState = 'PASS';
  else if (input.original.evidenceState === 'FAIL' && replica.evidenceState === 'FAIL') evidenceState = 'FAIL';
  else evidenceState = 'UNKNOWN';

  return {
    id: cortexId('repl'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    originalId: input.original.id,
    replicaId: replica.id,
    originalLane: 'primary',
    replicaLane: 'independent',
    sharedMutableState: false,
    digestMatch,
    measurementAgreed,
    evidenceState,
    originalState: input.original.evidenceState,
    replicaState: replica.evidenceState,
    notes: [
      digestMatch ? 'Replica used the same reproducibility manifest digest.' : 'Replica digest diverged; not an independent confirmation.',
      measurementAgreed ? 'Independent measurement agreed with the primary lane.' : 'Independent measurement disagreed; do not invent a discovery.',
      'Replica lane does not share mutable factory state with the primary beyond the sealed manifest protocol.',
    ],
    inventedDiscovery: false,
    productionAuthorization: false,
  };
}
