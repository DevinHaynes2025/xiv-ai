import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { nonce, sign, verifySignature, type SigningKeys } from './crypto';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import { sameTenant } from './isolation';
import type {
  AttestationState,
  AuthenticatedPrincipal,
  AuthorizationGrant,
  Capability,
  Principal,
  PrincipalKind,
  RuntimeNode,
  TenantRef,
  WorkloadClassification,
  WorkloadSpec,
} from './types';

const CLASSIFICATION_RANK: Record<WorkloadClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

const GRANT_TTL_MS = 5 * 60 * 1000;

export type PrincipalRecord = Principal & {
  tokenId: string;
  maxClassification: WorkloadClassification;
  revoked: boolean;
};

/**
 * Principal directory. Tokens are opaque handles held by the caller; the plane
 * never trusts a caller-supplied principal object, only a token it can resolve.
 */
export class PrincipalDirectory {
  private readonly byToken = new Map<string, PrincipalRecord>();
  private readonly byId = new Map<string, PrincipalRecord>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
  ) {}

  enroll(input: {
    kind: PrincipalKind;
    tenant: TenantRef;
    capabilities: readonly Capability[];
    maxClassification?: WorkloadClassification;
    principalId?: string;
  }): { record: PrincipalRecord; token: string } {
    const record: PrincipalRecord = {
      principalId: input.principalId ?? this.ids.mint('prin'),
      kind: input.kind,
      tenant: input.tenant,
      capabilities: [...input.capabilities],
      tokenId: this.ids.mint('tok'),
      maxClassification: input.maxClassification ?? 'internal',
      revoked: false,
    };
    const token = `${record.tokenId}.${nonce(16)}`;
    this.byToken.set(token, record);
    this.byId.set(record.principalId, record);
    return { record, token };
  }

  verify(token: string | undefined | null): AuthenticatedPrincipal {
    if (!token) {
      throw new RuntimeError('unauthenticated', 'A verified requester is required.', {}, 401);
    }
    const record = this.byToken.get(token);
    if (!record || record.revoked) {
      throw new RuntimeError('unauthenticated', 'A verified requester is required.', {}, 401);
    }
    return {
      principalId: record.principalId,
      kind: record.kind,
      tenant: record.tenant,
      capabilities: record.capabilities,
      authenticated: true,
      tokenId: record.tokenId,
      verifiedAt: this.clock.now(),
    };
  }

  lookup(principalId: string): PrincipalRecord | undefined {
    return this.byId.get(principalId);
  }

  maxClassificationFor(principalId: string): WorkloadClassification {
    return this.byId.get(principalId)?.maxClassification ?? 'public';
  }

  revoke(principalId: string) {
    const record = this.byId.get(principalId);
    if (record) record.revoked = true;
  }
}

export type ApprovalRecord = {
  approvalId: string;
  workloadId: string;
  tenant: TenantRef;
  approverPrincipalId: string;
  approverKind: PrincipalKind;
  at: number;
};

/**
 * Approvals may only be created by a human principal holding `approval.grant`.
 * An agent principal cannot fabricate one, which is what AC-11 requires.
 */
export class ApprovalRegistry {
  private readonly byWorkload = new Map<string, ApprovalRecord>();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  grant(principal: AuthenticatedPrincipal, workloadId: string, tenant: TenantRef): ApprovalRecord {
    if (principal.kind !== 'human') {
      this.audit.append({
        tenant,
        category: 'security',
        kind: 'approval_fabrication_blocked',
        subjectId: workloadId,
        principalId: principal.principalId,
        detail: { principalKind: principal.kind },
      });
      throw new RuntimeError('unauthorized', 'Only a human principal can record an approval.', {
        principalId: principal.principalId,
      });
    }
    if (!principal.capabilities.includes('approval.grant')) {
      throw new RuntimeError('unauthorized', 'This principal cannot approve workloads.', {
        principalId: principal.principalId,
      });
    }
    if (!sameTenant(principal.tenant, tenant)) {
      throw new RuntimeError('isolation_violation', 'Approvals cannot cross tenant boundaries.', {
        principalId: principal.principalId,
      });
    }
    const record: ApprovalRecord = {
      approvalId: this.ids.mint('apr'),
      workloadId,
      tenant,
      approverPrincipalId: principal.principalId,
      approverKind: principal.kind,
      at: this.clock.now(),
    };
    this.byWorkload.set(workloadId, record);
    this.audit.append({
      tenant,
      category: 'authorization',
      kind: 'approval_recorded',
      subjectId: workloadId,
      principalId: principal.principalId,
      detail: { approvalId: record.approvalId },
    });
    return record;
  }

  find(workloadId: string): ApprovalRecord | undefined {
    return this.byWorkload.get(workloadId);
  }

  export(): Record<string, ApprovalRecord> {
    return Object.fromEntries(this.byWorkload.entries());
  }

  restore(rows: Record<string, ApprovalRecord>) {
    this.byWorkload.clear();
    for (const [key, value] of Object.entries(rows)) this.byWorkload.set(key, value);
  }
}

export type AuthorizationOutcome =
  | { allowed: true; grant: AuthorizationGrant; reason: string }
  | { allowed: false; grant: null; reason: string };

declare const clearanceBrand: unique symbol;

/**
 * Proof that the guardian cleared one specific execution. The brand key is a
 * module-private symbol, so no caller outside this module can construct a
 * clearance and hand it to the execution engine.
 */
export type GuardianClearance = {
  readonly [clearanceBrand]: true;
  grantId: string;
  workloadId: string;
  nodeId: string;
  tenant: TenantRef;
  classification: WorkloadClassification;
  attestationId: string | null;
  clearedAt: number;
};

export class WorkloadAuthorizer {
  private readonly consumedGrants = new Set<string>();
  private guardianBypassAttempts = 0;

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly keys: SigningKeys,
    private readonly audit: AuditLedger,
    private readonly principals: PrincipalDirectory,
    private readonly approvals: ApprovalRegistry,
  ) {}

  /**
   * AC-04 gate. Produces a signed, single-use grant or a refusal with a stable
   * reason code. Every outcome is audited, so "workloads with policy decision"
   * is measurable rather than assumed.
   */
  authorize(principal: AuthenticatedPrincipal, spec: WorkloadSpec): AuthorizationOutcome {
    const refuse = (reason: string): AuthorizationOutcome => {
      this.audit.append({
        tenant: spec.tenant,
        category: 'authorization',
        kind: 'workload_authorization_denied',
        subjectId: spec.workloadId,
        principalId: principal.principalId,
        detail: { reason, classification: spec.classification },
      });
      return { allowed: false, grant: null, reason };
    };

    if (!sameTenant(principal.tenant, spec.tenant)) return refuse('tenant_mismatch');
    if (!spec.tenant.organizationId.trim() || !spec.tenant.universeId.trim()) return refuse('missing_tenant_context');
    if (!principal.capabilities.includes('workload.submit')) return refuse('capability_missing');

    const missing = spec.requiredCapabilities.filter((capability) => !principal.capabilities.includes(capability));
    if (missing.length) return refuse('capability_missing');

    const ceiling = this.principals.maxClassificationFor(principal.principalId);
    if (CLASSIFICATION_RANK[spec.classification] > CLASSIFICATION_RANK[ceiling]) {
      return refuse('classification_above_principal_ceiling');
    }
    if (
      (spec.classification === 'confidential' || spec.classification === 'restricted') &&
      !principal.capabilities.includes('workload.submit.protected')
    ) {
      return refuse('protected_capability_missing');
    }

    const approval = spec.requiresApproval ? this.approvals.find(spec.workloadId) : undefined;
    if (spec.requiresApproval && !approval) return refuse('approval_required');
    if (approval && approval.approverKind !== 'human') return refuse('approval_not_human');

    const issuedAt = this.clock.now();
    const body = {
      grantId: this.ids.mint('grant'),
      workloadId: spec.workloadId,
      tenant: spec.tenant,
      principalId: principal.principalId,
      classification: spec.classification,
      capabilities: [...spec.requiredCapabilities],
      requiresApproval: spec.requiresApproval,
      approvalId: approval?.approvalId,
      issuedAt,
      expiresAt: issuedAt + GRANT_TTL_MS,
    };
    const grant: AuthorizationGrant = { ...body, signature: sign(this.keys.grant, body) };

    this.audit.append({
      tenant: spec.tenant,
      category: 'authorization',
      kind: 'workload_authorized',
      subjectId: spec.workloadId,
      principalId: principal.principalId,
      detail: {
        grantId: grant.grantId,
        classification: spec.classification,
        approvalId: approval?.approvalId ?? null,
        capabilities: body.capabilities,
      },
    });
    return { allowed: true, grant, reason: 'authorized' };
  }

  /**
   * Guardian: the last gate before execution. Re-verifies the grant against the
   * node it is about to run on. A grant is single-use, so a replayed grant or a
   * grant re-pointed at another node or tenant is refused here.
   */
  clear(input: {
    grant: AuthorizationGrant;
    node: RuntimeNode;
    attestation: AttestationState | null;
    protectedExecution: boolean;
  }): GuardianClearance {
    const { grant, node } = input;
    const { signature, ...body } = grant;

    const deny = (reason: string): never => {
      this.guardianBypassAttempts += 1;
      this.audit.append({
        tenant: grant.tenant,
        category: 'security',
        kind: 'guardian_denied',
        subjectId: grant.workloadId,
        principalId: grant.principalId,
        detail: { reason, nodeId: node.nodeId },
      });
      throw new RuntimeError('grant_invalid', 'The guardian refused this execution.', {
        reason,
        workloadId: grant.workloadId,
      });
    };

    if (!verifySignature(this.keys.grant, body, signature)) deny('grant_signature_invalid');
    if (this.clock.now() > grant.expiresAt) deny('grant_expired');
    if (this.consumedGrants.has(grant.grantId)) deny('grant_replayed');
    if (!sameTenant(grant.tenant, node.tenant)) deny('node_tenant_mismatch');
    if (node.state !== 'active') deny(`node_state_${node.state}`);
    if (grant.requiresApproval && !grant.approvalId) deny('approval_missing');
    if (input.protectedExecution && (!input.attestation || input.attestation.status !== 'required_pass')) {
      deny('attestation_not_satisfied');
    }

    this.consumedGrants.add(grant.grantId);
    const clearance = {
      grantId: grant.grantId,
      workloadId: grant.workloadId,
      nodeId: node.nodeId,
      tenant: grant.tenant,
      classification: grant.classification,
      attestationId: input.attestation?.attestationId ?? null,
      clearedAt: this.clock.now(),
    } as GuardianClearance;

    this.audit.append({
      tenant: grant.tenant,
      category: 'authorization',
      kind: 'guardian_cleared',
      subjectId: grant.workloadId,
      principalId: grant.principalId,
      detail: { nodeId: node.nodeId, attestationId: clearance.attestationId },
    });
    return clearance;
  }

  get deniedGuardianAttempts() {
    return this.guardianBypassAttempts;
  }

  isGrantConsumed(grantId: string) {
    return this.consumedGrants.has(grantId);
  }
}
