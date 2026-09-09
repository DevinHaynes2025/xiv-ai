import { freshnessOf } from './freshness';
import { requireRecord, requireMember, type EvidenceState } from './store';
import type { EvidenceActor } from './types';

// Section 51 — information lineage, applied to the evidence trail itself.
//
// 62B already reconstructs the domain chain for a decision: source, ingestion,
// classification, model, agent, meeting, recommendation, human approval,
// result. This is the parallel chain for a release gate, and it exists for the
// same reason: a link that cannot be reconstructed is a link that might not have
// happened. Missing links fail the gate rather than being annotated.

export type LineageLink = {
  step: string;
  present: boolean;
  detail: string;
};

export type EvidenceLineage = {
  evidenceId: string;
  complete: boolean;
  missing: string[];
  chain: LineageLink[];
};

export function reconstructEvidence(
  state: EvidenceState,
  actor: EvidenceActor,
  recordId: string,
): EvidenceLineage {
  requireMember(state, actor);
  const record = requireRecord(state, actor.universeId, recordId);
  const gate = state.gates.find((item) => item.id === record.gateId);
  const verifications = state.verifications.filter((item) => item.evidenceId === record.id);
  const satisfied = verifications.find((item) => item.verdict === 'satisfies');
  const approval = state.approvals.find(
    (item) => item.gateId === record.gateId && item.commitSha === record.code.commitSha,
  );
  const failures = state.failures.filter((item) => item.evidenceId === record.id);

  const link = (step: string, present: boolean, detail: string): LineageLink => ({ step, present, detail });

  const chain: LineageLink[] = [
    link('CRITERION', Boolean(gate), gate ? `${gate.gateKey} — ${gate.title}` : 'the gate is missing'),
    link(
      'CODE IDENTITY',
      record.code.commitSha.length >= 7,
      `${record.code.repository}@${record.code.branch}#${record.code.commitSha.slice(0, 12)}`,
    ),
    link('OWNER', Boolean(record.primaryOwner), record.primaryOwner || 'unowned'),
    link('EXECUTION', Boolean(record.executorId), `${record.executorType}:${record.executorId}`),
    link(
      'EXPECTATION',
      Boolean(record.expectedResult.trim()),
      `${record.outcomeKind === 'negative' ? 'expected denial: ' : ''}${record.expectedResult}`,
    ),
    link('RESULT', Boolean(record.actualResult.trim()), `${record.status} — ${record.actualResult}`),
    link(
      'ARTIFACT',
      Boolean(record.evidenceLocation && record.evidenceHash),
      `${record.evidenceLocation} sha256:${record.evidenceHash.slice(0, 16)}`,
    ),
    link(
      'REPRODUCTION',
      Boolean(record.reproductionCommand),
      record.reproductionCommand ?? 'no command recorded, so nobody else can re-run it',
    ),
    link(
      'INDEPENDENT VERIFICATION',
      Boolean(satisfied),
      satisfied ? `${satisfied.verifierId} (${satisfied.verifierRole})` : 'nobody independent has confirmed it',
    ),
    link(
      'HUMAN APPROVAL',
      gate?.humanApprovalRule === 'none' || Boolean(approval),
      gate?.humanApprovalRule === 'none'
        ? 'not required for this gate'
        : approval
          ? `${approval.decision} by ${approval.approverId}`
          : 'required and not yet given',
    ),
    link(
      'FRESHNESS',
      freshnessOf(state, record) === 'VALID',
      `${freshnessOf(state, record)}${failures.length ? ` with ${failures.length} recorded failure(s)` : ''}`,
    ),
  ];

  const missing = chain.filter((item) => !item.present).map((item) => item.step);
  return { evidenceId: record.id, complete: missing.length === 0, missing, chain };
}
