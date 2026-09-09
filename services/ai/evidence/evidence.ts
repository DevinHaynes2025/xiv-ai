import * as exceptions from './exceptions';
import * as failures from './failures';
import * as freshness from './freshness';
import * as gates from './gates';
import * as lineage from './lineage';
import * as manifest from './manifest';
import * as ownership from './ownership';
import * as readiness from './readiness';
import * as records from './records';
import { createEvidenceState, type EvidenceState, type EvidenceStateOptions } from './store';
import type { EvidenceActor } from './types';

// The bounded surface of the evidence layer.
//
// Two things are deliberately absent and will stay absent. There is no function
// that sets a gate to PASS, because PASS is computed from evidence by
// assessGate. And there is no function that records an approval on behalf of
// somebody else, because section 59 reserves that act for a person and section
// 60 forbids automation from manufacturing it. Everything automation is allowed
// to do — collect, hash, calculate, recommend — is here; the one thing it is not
// allowed to do has no entry point.

export type EvidenceLedger = ReturnType<typeof createEvidenceLedger>;

export function createEvidenceLedger(options: EvidenceStateOptions) {
  const state: EvidenceState = createEvidenceState(options);

  return {
    state,

    declareGate: (actor: EvidenceActor, seed: gates.GateSeed) => gates.declareGate(state, actor, seed),
    seedOwnershipMatrix: (actor: EvidenceActor) => gates.seedOwnershipMatrix(state, actor),
    assignGate: (actor: EvidenceActor, input: gates.AssignmentInput) => gates.assignGate(state, actor, input),
    blockGate: (actor: EvidenceActor, input: { gateKey: string; reason: string }) =>
      gates.blockGate(state, actor, input),
    markUnavailable: (actor: EvidenceActor, input: { gateKey: string; reason: string }) =>
      gates.markUnavailable(state, actor, input),
    listGates: (actor: EvidenceActor) => gates.listGates(state, actor),

    recordEvidence: (actor: EvidenceActor, input: records.RecordEvidenceInput) =>
      records.recordEvidence(state, actor, input),
    supersede: (actor: EvidenceActor, input: Parameters<typeof records.supersede>[2]) =>
      records.supersede(state, actor, input),
    invalidate: (actor: EvidenceActor, input: { recordId: string; reason: string }) =>
      records.invalidate(state, actor, input),
    reuseAcrossCommits: (actor: EvidenceActor, input: Parameters<typeof records.reuseAcrossCommits>[2]) =>
      records.reuseAcrossCommits(state, actor, input),
    listRecords: (actor: EvidenceActor) => records.listRecords(state, actor),
    recordsForGate: (actor: EvidenceActor, gateKey: string, commitSha?: string) =>
      records.recordsForGate(state, actor, gateKey, commitSha),
    negativeEvidence: (actor: EvidenceActor) => records.negativeEvidence(state, actor),

    verify: (actor: EvidenceActor, input: ownership.VerifyInput) => ownership.verify(state, actor, input),
    approve: (actor: EvidenceActor, input: ownership.ApproveInput) => ownership.approve(state, actor, input),
    assessGate: (actor: EvidenceActor, gateKey: string, commitSha: string) =>
      ownership.assessGate(state, actor, gateKey, commitSha),
    listVerifications: (actor: EvidenceActor) => ownership.listVerifications(state, actor),
    listApprovals: (actor: EvidenceActor) => ownership.listApprovals(state, actor),

    fileException: (actor: EvidenceActor, input: exceptions.FileExceptionInput) =>
      exceptions.fileException(state, actor, input),
    acceptException: (actor: EvidenceActor, input: Parameters<typeof exceptions.acceptException>[2]) =>
      exceptions.acceptException(state, actor, input),
    revokeException: (actor: EvidenceActor, input: { exceptionId: string; reason: string }) =>
      exceptions.revokeException(state, actor, input),
    listExceptions: (actor: EvidenceActor) => exceptions.listExceptions(state, actor),
    expiringExceptions: (actor: EvidenceActor, withinMs: number) =>
      exceptions.expiringExceptions(state, actor, withinMs),

    recordFailure: (actor: EvidenceActor, input: failures.RecordFailureInput) =>
      failures.recordFailure(state, actor, input),
    closeFailure: (actor: EvidenceActor, input: failures.CloseFailureInput) =>
      failures.closeFailure(state, actor, input),
    listFailures: (actor: EvidenceActor) => failures.listFailures(state, actor),
    openFailures: (actor: EvidenceActor) => failures.openFailures(state, actor),

    declareChange: (actor: EvidenceActor, input: freshness.DeclareChangeInput) =>
      freshness.declareChange(state, actor, input),
    freshnessOf: (recordId: string) => {
      const record = state.records.find((item) => item.id === recordId);
      return record ? freshness.freshnessOf(state, record) : 'INVALID';
    },
    explainFreshness: (actor: EvidenceActor, recordId: string) => {
      const record = records.listRecords(state, actor).find((item) => item.id === recordId);
      return record ? freshness.explainFreshness(state, record) : 'unknown record';
    },

    buildManifest: (actor: EvidenceActor, input: manifest.ManifestInput) =>
      manifest.buildManifest(state, actor, input),
    listManifests: (actor: EvidenceActor) => manifest.listManifests(state, actor),

    readiness: (actor: EvidenceActor, commitSha: string) => readiness.readiness(state, actor, commitSha),
    canaryReadiness: (actor: EvidenceActor, commitSha: string) =>
      readiness.canaryReadiness(state, actor, commitSha),
    classifyForBrief: (actor: EvidenceActor, gateKey: string, commitSha: string) =>
      readiness.classifyForBrief(state, actor, gateKey, commitSha),
    answerDefinitionOfDone: (actor: EvidenceActor, gateKey: string, commitSha: string) =>
      readiness.answerDefinitionOfDone(state, actor, gateKey, commitSha),

    reconstructEvidence: (actor: EvidenceActor, recordId: string) =>
      lineage.reconstructEvidence(state, actor, recordId),
  };
}
