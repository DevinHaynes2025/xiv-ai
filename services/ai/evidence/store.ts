import { createHash } from 'node:crypto';
import { refuse } from '../civilization/errors';
import type {
  EvidenceActor,
  EvidenceApproval,
  EvidenceException,
  EvidenceFailure,
  EvidenceManifest,
  EvidenceRecord,
  EvidenceRevalidation,
  EvidenceVerification,
  ReleaseGate,
} from './types';

// The in-memory mirror of the evidence schema. It exists so the rules can be
// exercised in tests at the speed of a unit test, and so the service layer and
// the database can be held to the same behaviour: every refusal implemented here
// has a counterpart trigger or policy in the migration, and the SQL harness
// proves the database half independently.

export type EvidenceState = {
  gates: ReleaseGate[];
  records: EvidenceRecord[];
  verifications: EvidenceVerification[];
  approvals: EvidenceApproval[];
  exceptions: EvidenceException[];
  failures: EvidenceFailure[];
  revalidations: EvidenceRevalidation[];
  manifests: EvidenceManifest[];
  // Membership and supervision are owned by the civilization layer. The
  // evidence layer is handed a resolver rather than a second copy of the
  // tenancy model, because two copies eventually disagree.
  isMember: (universeId: string, userId: string) => boolean;
  isSupervisor: (universeId: string, userId: string) => boolean;
  organizationOf: (universeId: string) => string;
  nextId: () => string;
  clock: () => string;
};

export type EvidenceStateOptions = {
  isMember: EvidenceState['isMember'];
  isSupervisor: EvidenceState['isSupervisor'];
  organizationOf: EvidenceState['organizationOf'];
  now?: () => Date;
};

export function createEvidenceState(options: EvidenceStateOptions): EvidenceState {
  let counter = 0;
  const now = options.now ?? (() => new Date());
  return {
    gates: [],
    records: [],
    verifications: [],
    approvals: [],
    exceptions: [],
    failures: [],
    revalidations: [],
    manifests: [],
    isMember: options.isMember,
    isSupervisor: options.isSupervisor,
    organizationOf: options.organizationOf,
    nextId: () => {
      counter += 1;
      return `ev-${counter.toString().padStart(6, '0')}`;
    },
    clock: () => now().toISOString(),
  };
}

export function requireMember(state: EvidenceState, actor: EvidenceActor) {
  if (!state.isMember(actor.universeId, actor.userId)) {
    refuse('tenancy_not_a_member', actor.userId);
  }
}

export function requireSupervisor(state: EvidenceState, actor: EvidenceActor) {
  requireMember(state, actor);
  if (!state.isSupervisor(actor.universeId, actor.userId)) {
    refuse('tenancy_not_a_supervisor', actor.userId);
  }
}

export function requireGate(state: EvidenceState, universeId: string, gateId: string): ReleaseGate {
  const gate = state.gates.find((item) => item.id === gateId || item.gateKey === gateId);
  if (!gate) refuse('gate_unknown', gateId);
  if (gate.universeId !== universeId) refuse('tenancy_cross_universe_blocked', gateId);
  return gate;
}

export function requireRecord(state: EvidenceState, universeId: string, recordId: string): EvidenceRecord {
  const record = state.records.find((item) => item.id === recordId);
  if (!record) refuse('evidence_record_unknown', recordId);
  if (record.universeId !== universeId) refuse('tenancy_cross_universe_blocked', recordId);
  return record;
}

export function visibleTo<T extends { universeId: string }>(
  state: EvidenceState,
  actor: EvidenceActor,
  rows: readonly T[],
): T[] {
  requireMember(state, actor);
  return rows.filter((row) => row.universeId === actor.universeId);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
