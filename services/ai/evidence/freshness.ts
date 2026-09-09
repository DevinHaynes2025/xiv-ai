import { requireMember, type EvidenceState } from './store';
import type { EvidenceActor, EvidenceRecord, EvidenceRevalidation, Freshness, RevalidationTrigger } from './types';

// Section 55 — evidence expires when its assumptions move.
//
// The reason this exists is that a permanent PASS is a lie with a delay on it.
// A cross-tenant suite that passed before an RLS policy changed says nothing
// about the policy that is deployed now, and the dangerous version of that
// sentence is the one where nobody notices. So instead of trusting history, XIV
// records the events that could have invalidated a result and recomputes.

export const REVALIDATION_TRIGGERS: readonly RevalidationTrigger[] = [
  'code_change',
  'rls_policy_change',
  'schema_change',
  'guardian_change',
  'runtime_change',
  'model_change',
  'dependency_change',
  'mobile_build_change',
  'infrastructure_change',
  'security_policy_change',
];

export type DeclareChangeInput = {
  triggerKind: RevalidationTrigger;
  detail: string;
  fromCommitSha?: string | null;
  toCommitSha?: string | null;
  gateKey?: string | null;
  affectsAllGates?: boolean;
};

export function declareChange(
  state: EvidenceState,
  actor: EvidenceActor,
  input: DeclareChangeInput,
): EvidenceRevalidation {
  requireMember(state, actor);
  const gate = input.gateKey ? state.gates.find((g) => g.gateKey === input.gateKey && g.universeId === actor.universeId) : null;

  const revalidation: EvidenceRevalidation = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    triggerKind: input.triggerKind,
    detail: input.detail,
    fromCommitSha: input.fromCommitSha ?? null,
    toCommitSha: input.toCommitSha ?? null,
    affectsGateId: gate?.id ?? null,
    affectsAllGates: input.affectsAllGates ?? !gate,
    declaredBy: actor.userId,
    occurredAt: state.clock(),
  };
  state.revalidations.push(revalidation);
  return revalidation;
}

export function freshnessOf(state: EvidenceState, record: EvidenceRecord): Freshness {
  if (record.supersededBy) return 'SUPERSEDED';
  if (record.invalidatedAt) return 'INVALID';
  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.parse(state.clock())) return 'STALE';

  const aged = state.revalidations.some(
    (change) =>
      change.universeId === record.universeId &&
      Date.parse(change.occurredAt) > Date.parse(record.completedAt) &&
      (change.affectsAllGates || change.affectsGateId === record.gateId) &&
      // The change that produced this commit is not a change that invalidates
      // evidence taken against it. Without this a run would age its own output.
      change.toCommitSha !== record.code.commitSha,
  );

  return aged ? 'STALE' : 'VALID';
}

export function explainFreshness(state: EvidenceState, record: EvidenceRecord): string {
  const freshness = freshnessOf(state, record);
  if (freshness === 'SUPERSEDED') return `superseded by ${record.supersededBy}`;
  if (freshness === 'INVALID') return record.invalidatedReason ?? 'invalidated';
  if (freshness === 'VALID') return 'nothing it depends on has changed since it was taken';

  if (record.expiresAt && Date.parse(record.expiresAt) <= Date.parse(state.clock())) {
    return `expired at ${record.expiresAt}`;
  }
  const cause = state.revalidations.find(
    (change) =>
      change.universeId === record.universeId &&
      Date.parse(change.occurredAt) > Date.parse(record.completedAt) &&
      (change.affectsAllGates || change.affectsGateId === record.gateId) &&
      change.toCommitSha !== record.code.commitSha,
  );
  return cause ? `${cause.triggerKind}: ${cause.detail}` : 'stale';
}
