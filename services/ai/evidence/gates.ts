import { refuse } from '../civilization/errors';
import { requireGate, requireSupervisor, visibleTo, type EvidenceState } from './store';
import type { EvidenceActor, EvidenceLevel, HumanApprovalRule, ReleaseGate } from './types';

// Section 37 — the ownership matrix, as data.
//
// Two reconciliations were needed between section 37 and section 54, and both
// are deliberate rather than transcription errors.
//
// Section 37 allows an exception on tenant isolation ("required for failure
// exception") and on secret scanning ("required for exception"), while section
// 54 says confirmed cross-tenant exposure and unresolved exposed production
// secrets can never be waived. Those are different objects. A gap in the
// isolation *test suite* is a schedule problem a named human can accept for a
// bounded window; a *confirmed leak between tenants* is not. So the conditions
// section 54 protects are modelled as their own gates, marked hardBlocker, and
// the corresponding test gates keep the exception route section 37 gives them.
// The result is that "we have not finished the cross-tenant suite" is
// negotiable and "we have proven data crossed a tenant boundary" is not.

export type GateSeed = {
  gateKey: string;
  title: string;
  sectionRef: string;
  ownerRole: string;
  verifierRole: string;
  requiredEvidenceLevel: EvidenceLevel;
  humanApprovalRule: HumanApprovalRule;
  threshold: string;
  releaseCritical: boolean;
  hardBlocker?: boolean;
};

export const OWNERSHIP_MATRIX: readonly GateSeed[] = [
  {
    gateKey: 'runtime_identity',
    title: 'Runtime identity',
    sectionRef: '37',
    ownerRole: 'Runtime Platform',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'runtime_attestation',
    title: 'Runtime attestation',
    sectionRef: '37',
    ownerRole: 'Security/Platform',
    verifierRole: 'Security reviewer',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'rls',
    title: 'Row level security',
    sectionRef: '37, 40',
    ownerRole: 'Database',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '100% of tenant-bearing tables',
    releaseCritical: true,
  },
  {
    gateKey: 'tenant_isolation',
    title: 'Tenant isolation',
    sectionRef: '37, 40, 57',
    ownerRole: 'Database/Security',
    verifierRole: 'independent security verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'universe_isolation',
    title: 'Universe isolation',
    sectionRef: '37, 57',
    ownerRole: 'Database/Security',
    verifierRole: 'independent security verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'workload_authorization',
    title: 'Workload authorization',
    sectionRef: '37',
    ownerRole: 'Runtime/Security',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'compute_routing',
    title: 'Compute routing',
    sectionRef: '37, 57',
    ownerRole: 'Runtime Platform',
    verifierRole: 'QA/Platform verifier',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: '>=99.9%',
    releaseCritical: false,
  },
  {
    gateKey: 'intel_runtime',
    title: 'Intel runtime',
    sectionRef: '37',
    ownerRole: 'Runtime Platform',
    verifierRole: 'QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'hardware contract suite',
    releaseCritical: false,
  },
  {
    gateKey: 'amd_runtime',
    title: 'AMD runtime',
    sectionRef: '37',
    ownerRole: 'Runtime Platform',
    verifierRole: 'QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'hardware contract suite',
    releaseCritical: false,
  },
  {
    gateKey: 'nvidia_runtime',
    title: 'NVIDIA runtime',
    sectionRef: '37',
    ownerRole: 'Runtime/ML',
    verifierRole: 'QA/ML verifier',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'accelerator tests',
    releaseCritical: false,
  },
  {
    gateKey: 'ios',
    title: 'iOS',
    sectionRef: '37, 46',
    ownerRole: 'Mobile',
    verifierRole: 'QA/Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'required',
    threshold: 'device regression suite',
    releaseCritical: false,
  },
  {
    gateKey: 'android',
    title: 'Android',
    sectionRef: '37, 46',
    ownerRole: 'Mobile',
    verifierRole: 'QA/Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'required',
    threshold: 'device regression suite',
    releaseCritical: false,
  },
  {
    gateKey: 'offline_mode',
    title: 'Offline mode',
    sectionRef: '37',
    ownerRole: 'Runtime/Mobile',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: 'tamper + authority tests',
    releaseCritical: true,
  },
  {
    gateKey: 'agent_runtime_assignment',
    title: 'Agent runtime assignment',
    sectionRef: '37, 41',
    ownerRole: 'Agent Platform',
    verifierRole: 'Security/QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: '100%',
    releaseCritical: false,
  },
  {
    gateKey: 'resource_governor',
    title: 'Resource governor',
    sectionRef: '37, 57',
    ownerRole: 'Runtime Platform',
    verifierRole: 'SRE/QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'kill_switch',
    title: 'Kill switch',
    sectionRef: '37, 57',
    ownerRole: 'Runtime/SRE',
    verifierRole: 'Security/SRE verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'failure_recovery',
    title: 'Failure recovery',
    sectionRef: '37',
    ownerRole: 'SRE/Runtime',
    verifierRole: 'QA/SRE',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'fault-injection report',
    releaseCritical: false,
  },
  {
    gateKey: 'model_authorization',
    title: 'Model authorization',
    sectionRef: '37, 45, 57',
    ownerRole: 'ML Platform',
    verifierRole: 'AI Evaluation/Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '100%',
    releaseCritical: true,
  },
  {
    gateKey: 'agent_evaluation',
    title: 'Agent evaluation',
    sectionRef: '37, 45',
    ownerRole: 'AI Evaluation',
    verifierRole: 'independent evaluator',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'required',
    threshold: 'defined risk level',
    releaseCritical: true,
  },
  {
    gateKey: 'secret_scanning',
    title: 'Secret scanning',
    sectionRef: '37, 47, 57',
    ownerRole: 'Security',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '0 blockers',
    releaseCritical: true,
  },
  {
    gateKey: 'dependency_scanning',
    title: 'Dependency scanning',
    sectionRef: '37, 48, 57',
    ownerRole: 'Security/Platform',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: '0 critical',
    releaseCritical: true,
  },
  {
    gateKey: 'provenance',
    title: 'Provenance',
    sectionRef: '37, 51, 57',
    ownerRole: 'Information Logistics',
    verifierRole: 'QA/Security',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '100% of critical flows',
    releaseCritical: true,
  },
  {
    gateKey: 'backup_restore',
    title: 'Backup/restore',
    sectionRef: '37, 49, 57',
    ownerRole: 'Database/SRE',
    verifierRole: 'independent SRE/DB reviewer',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'required',
    threshold: 'PASS',
    releaseCritical: true,
  },
  {
    gateKey: 'rollback',
    title: 'Rollback',
    sectionRef: '37, 50, 57',
    ownerRole: 'Release/SRE',
    verifierRole: 'QA/SRE',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'required',
    threshold: 'PASS',
    releaseCritical: true,
  },
  {
    gateKey: 'cost_governance',
    title: 'Cost governance',
    sectionRef: '37, 44',
    ownerRole: 'FinOps/Platform',
    verifierRole: 'Platform/Finance reviewer',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'exception_only',
    threshold: 'budget',
    releaseCritical: false,
  },
  {
    gateKey: 'api_web_regression',
    title: 'API/web regression',
    sectionRef: '57',
    ownerRole: 'App/API',
    verifierRole: 'QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'gate threshold',
    releaseCritical: false,
  },
  {
    gateKey: 'mobile_regression',
    title: 'Mobile regression',
    sectionRef: '46, 57',
    ownerRole: 'Mobile',
    verifierRole: 'QA',
    requiredEvidenceLevel: 'E3',
    humanApprovalRule: 'none',
    threshold: 'gate threshold',
    releaseCritical: false,
  },
  {
    gateKey: 'canary_promotion',
    title: 'Canary promotion',
    sectionRef: '37, 59',
    ownerRole: 'Release',
    verifierRole: 'Security + QA',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'ceo',
    threshold: 'complete gate package',
    releaseCritical: true,
  },

  // The five conditions section 54 says an exception can never waive. They are
  // gates in their own right so that "no exception exists for this" is a fact
  // the system holds, not a convention someone has to remember.
  {
    gateKey: 'no_confirmed_cross_tenant_exposure',
    title: 'No confirmed cross-tenant exposure',
    sectionRef: '54',
    ownerRole: 'Database/Security',
    verifierRole: 'independent security verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '0 occurrences',
    releaseCritical: true,
    hardBlocker: true,
  },
  {
    gateKey: 'no_guardian_bypass',
    title: 'No Guardian bypass',
    sectionRef: '54',
    ownerRole: 'Security',
    verifierRole: 'independent security verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '0 occurrences',
    releaseCritical: true,
    hardBlocker: true,
  },
  {
    gateKey: 'no_unauthorized_production_action',
    title: 'No unauthorized production action',
    sectionRef: '54',
    ownerRole: 'Runtime/Security',
    verifierRole: 'independent security verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '0 occurrences',
    releaseCritical: true,
    hardBlocker: true,
  },
  {
    gateKey: 'no_exposed_production_secrets',
    title: 'No unresolved exposed production secrets',
    sectionRef: '47, 54',
    ownerRole: 'Security',
    verifierRole: 'Security',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '0 unresolved',
    releaseCritical: true,
    hardBlocker: true,
  },
  {
    gateKey: 'dangerous_workload_stoppable',
    title: 'A dangerous workload can always be stopped',
    sectionRef: '54',
    ownerRole: 'Runtime/SRE',
    verifierRole: 'Security/SRE verifier',
    requiredEvidenceLevel: 'E4',
    humanApprovalRule: 'none',
    threshold: '100%',
    releaseCritical: true,
    hardBlocker: true,
  },
];

export function declareGate(state: EvidenceState, actor: EvidenceActor, seed: GateSeed): ReleaseGate {
  requireSupervisor(state, actor);

  if (state.gates.some((g) => g.universeId === actor.universeId && g.gateKey === seed.gateKey)) {
    refuse('gate_key_duplicate', seed.gateKey);
  }

  const gate: ReleaseGate = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: state.organizationOf(actor.universeId),
    gateKey: seed.gateKey,
    title: seed.title,
    sectionRef: seed.sectionRef,
    ownerRole: seed.ownerRole,
    verifierRole: seed.verifierRole,
    requiredEvidenceLevel: seed.requiredEvidenceLevel,
    humanApprovalRule: seed.humanApprovalRule,
    threshold: seed.threshold,
    releaseCritical: seed.releaseCritical,
    hardBlocker: seed.hardBlocker ?? false,
    assignedOwnerId: null,
    assignedVerifierId: null,
    assignedApproverId: null,
    blockedReason: null,
    unavailableReason: null,
    provenance: { declaredBy: actor.userId, slice: '2I-AI-62D-governance' },
    createdBy: actor.userId,
    createdAt: state.clock(),
  };
  state.gates.push(gate);
  return gate;
}

export function seedOwnershipMatrix(state: EvidenceState, actor: EvidenceActor): ReleaseGate[] {
  return OWNERSHIP_MATRIX.map((seed) => declareGate(state, actor, seed));
}

export type AssignmentInput = {
  gateKey: string;
  ownerId?: string;
  verifierId?: string;
  approverId?: string;
};

// Section 36's separation of duties, checked at the moment responsibility is
// handed out rather than only when evidence arrives. Catching it here means the
// team learns that nobody independent is available while there is still time to
// find somebody, instead of at the gate.
export function assignGate(state: EvidenceState, actor: EvidenceActor, input: AssignmentInput): ReleaseGate {
  requireSupervisor(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);

  const owner = input.ownerId ?? gate.assignedOwnerId;
  const verifier = input.verifierId ?? gate.assignedVerifierId;
  const approver = input.approverId ?? gate.assignedApproverId;

  if (owner && verifier && owner === verifier) {
    refuse('verifier_must_be_independent', `${gate.gateKey}: owner and verifier are the same person`);
  }
  if (gate.releaseCritical && approver && (approver === owner || approver === verifier)) {
    refuse(
      'approver_must_be_independent',
      `${gate.gateKey} is release critical, so its approver cannot also own or verify it`,
    );
  }

  gate.assignedOwnerId = owner ?? null;
  gate.assignedVerifierId = verifier ?? null;
  gate.assignedApproverId = approver ?? null;
  return gate;
}

export function blockGate(state: EvidenceState, actor: EvidenceActor, input: { gateKey: string; reason: string }) {
  requireSupervisor(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);
  gate.blockedReason = input.reason;
  return gate;
}

// UNAVAILABLE is not a failure. It is XIV saying the provider, runtime or
// integration is not configured, so no honest test can be run at all. Keeping it
// distinct stops an unconfigured integration from being reported as a pass.
export function markUnavailable(
  state: EvidenceState,
  actor: EvidenceActor,
  input: { gateKey: string; reason: string },
) {
  requireSupervisor(state, actor);
  const gate = requireGate(state, actor.universeId, input.gateKey);
  gate.unavailableReason = input.reason;
  return gate;
}

export function listGates(state: EvidenceState, actor: EvidenceActor): ReleaseGate[] {
  return visibleTo(state, actor, state.gates);
}
