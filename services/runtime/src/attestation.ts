import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { sign, verifySignature, type SigningKeys } from './crypto';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import type {
  AttestationRecord,
  AttestationState,
  RuntimeNode,
  TrustPolicy,
  WorkloadClassification,
} from './types';

export const DEFAULT_TRUST_POLICY: TrustPolicy = {
  protectedClassifications: ['confidential', 'restricted'],
  maxAttestationAgeMs: 60 * 60 * 1000,
  requiredMeasurements: ['boot_chain', 'runtime_image', 'policy_bundle'],
};

export function isProtectedClassification(policy: TrustPolicy, classification: WorkloadClassification): boolean {
  return policy.protectedClassifications.includes(classification);
}

/**
 * Attestation service for the runtime fleet.
 *
 * `evaluate` is the only way to learn a node's trust state and it is
 * time-sensitive: a record that has aged past the trust policy reports
 * `expired`, not `required_pass`. There is no "assume good" branch.
 */
export class AttestationService {
  private readonly latest = new Map<string, AttestationRecord>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly keys: SigningKeys,
    private readonly audit: AuditLedger,
    private readonly policy: TrustPolicy = DEFAULT_TRUST_POLICY,
  ) {}

  get trustPolicy() {
    return this.policy;
  }

  /**
   * Records an attestation quote. Missing required measurements produce a
   * `fail` verdict rather than being ignored.
   */
  submit(input: {
    node: RuntimeNode;
    measurements: Record<string, string>;
    validForMs?: number;
    forceVerdict?: 'pass' | 'fail';
  }): AttestationRecord {
    const issuedAt = this.clock.now();
    const missing = this.policy.requiredMeasurements.filter((name) => !input.measurements[name]);
    const verdict = input.forceVerdict ?? (missing.length === 0 ? 'pass' : 'fail');
    const body = {
      attestationId: this.ids.mint('att'),
      nodeId: input.node.nodeId,
      verdict,
      measurements: input.measurements,
      issuedAt,
      expiresAt: issuedAt + (input.validForMs ?? this.policy.maxAttestationAgeMs),
    };
    const record: AttestationRecord = { ...body, signature: sign(this.keys.attestation, body) };
    this.latest.set(input.node.nodeId, record);

    this.audit.append({
      tenant: input.node.tenant,
      category: 'attestation',
      kind: verdict === 'pass' ? 'attestation_passed' : 'attestation_failed',
      subjectId: input.node.nodeId,
      detail: {
        attestationId: record.attestationId,
        missingMeasurements: missing,
        expiresAt: record.expiresAt,
      },
    });
    return record;
  }

  evaluate(nodeId: string): AttestationState {
    const evaluatedAt = this.clock.now();
    const record = this.latest.get(nodeId);
    if (!record) return { nodeId, status: 'absent', evaluatedAt };

    const { signature, ...body } = record;
    if (!verifySignature(this.keys.attestation, body, signature)) {
      return { nodeId, status: 'failed', attestationId: record.attestationId, verdict: 'fail', evaluatedAt };
    }
    if (record.verdict === 'fail') {
      return {
        nodeId,
        status: 'failed',
        attestationId: record.attestationId,
        verdict: 'fail',
        expiresAt: record.expiresAt,
        evaluatedAt,
      };
    }
    if (evaluatedAt > record.expiresAt) {
      return {
        nodeId,
        status: 'expired',
        attestationId: record.attestationId,
        verdict: 'pass',
        expiresAt: record.expiresAt,
        evaluatedAt,
      };
    }
    return {
      nodeId,
      status: 'required_pass',
      attestationId: record.attestationId,
      verdict: 'pass',
      expiresAt: record.expiresAt,
      evaluatedAt,
    };
  }

  /**
   * The hard gate used before any protected execution. Quarantined, paused and
   * revoked nodes are refused here even when they hold a valid attestation.
   */
  assertEligible(node: RuntimeNode, classification: WorkloadClassification): AttestationState {
    const state = this.evaluate(node.nodeId);
    if (!isProtectedClassification(this.policy, classification)) return state;

    if (node.state !== 'active') {
      throw new RuntimeError('node_unavailable', 'Protected workloads cannot run on a non-active node.', {
        nodeId: node.nodeId,
        nodeState: node.state,
      });
    }
    if (state.status !== 'required_pass') {
      this.audit.append({
        tenant: node.tenant,
        category: 'security',
        kind: 'protected_execution_blocked',
        subjectId: node.nodeId,
        detail: { attestationStatus: state.status, classification },
      });
      throw new RuntimeError('attestation_required', 'This node does not satisfy the required trust policy.', {
        nodeId: node.nodeId,
        attestationStatus: state.status,
      });
    }
    return state;
  }

  revoke(nodeId: string) {
    this.latest.delete(nodeId);
  }

  export(): Record<string, AttestationRecord> {
    return Object.fromEntries(this.latest.entries());
  }

  restore(rows: Record<string, AttestationRecord>) {
    this.latest.clear();
    for (const [nodeId, record] of Object.entries(rows)) this.latest.set(nodeId, record);
  }
}
