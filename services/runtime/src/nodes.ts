import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { fingerprint, sign, verifySignature, type SigningKeys } from './crypto';
import { RuntimeError } from './errors';
import type { IdFactory } from './ids';
import { sameTenant, type TenantStore } from './isolation';
import type {
  AuthenticatedPrincipal,
  HardwareProfile,
  NodeCapacity,
  NodeState,
  RuntimeNode,
  TenantRef,
} from './types';

/**
 * A node enrollment ticket is minted by the control plane before a node is
 * allowed to speak. A node that presents no ticket, a forged ticket, a ticket
 * for another tenant, or a re-used ticket never receives an identity.
 */
export type EnrollmentTicket = {
  enrollmentId: string;
  tenant: TenantRef;
  fingerprint: string;
  hardware: HardwareProfile;
  capacity: NodeCapacity;
  issuedByPrincipalId: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
};

export type RegistrationResult = {
  node: RuntimeNode;
  created: boolean;
};

const ENROLLMENT_TTL_MS = 15 * 60 * 1000;

export class NodeRegistry {
  private readonly consumedEnrollments = new Set<string>();
  private readonly fingerprintIndex = new Map<string, string>();
  private readonly revokedFingerprints = new Set<string>();

  constructor(
    private readonly store: TenantStore<RuntimeNode>,
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly keys: SigningKeys,
    private readonly audit: AuditLedger,
  ) {}

  static nodeFingerprint(parts: { serial: string; platform: string; publicKey: string }) {
    return fingerprint([parts.serial, parts.platform, parts.publicKey]);
  }

  issueEnrollment(input: {
    principal: AuthenticatedPrincipal;
    tenant: TenantRef;
    fingerprint: string;
    hardware: HardwareProfile;
    capacity: NodeCapacity;
  }): EnrollmentTicket {
    if (!input.principal.capabilities.includes('node.register')) {
      throw new RuntimeError('unauthorized', 'The requester cannot enroll runtime nodes.', {
        principalId: input.principal.principalId,
      });
    }
    if (!sameTenant(input.principal.tenant, input.tenant)) {
      throw new RuntimeError('isolation_violation', 'Enrollment requested outside the requester tenant.', {
        principalId: input.principal.principalId,
      });
    }

    const issuedAt = this.clock.now();
    const body = {
      enrollmentId: this.ids.mint('enr'),
      tenant: input.tenant,
      fingerprint: input.fingerprint,
      hardware: input.hardware,
      capacity: input.capacity,
      issuedByPrincipalId: input.principal.principalId,
      issuedAt,
      expiresAt: issuedAt + ENROLLMENT_TTL_MS,
    };
    const ticket: EnrollmentTicket = { ...body, signature: sign(this.keys.enrollment, body) };

    this.audit.append({
      tenant: input.tenant,
      category: 'node',
      kind: 'enrollment_issued',
      subjectId: ticket.enrollmentId,
      principalId: input.principal.principalId,
      detail: { fingerprint: input.fingerprint, hardwareClass: input.hardware.classId },
    });
    return ticket;
  }

  /**
   * Registration is idempotent per hardware fingerprint: re-registering the same
   * node returns its existing identity instead of minting a second active one.
   */
  register(ticket: EnrollmentTicket, presented: { fingerprint: string }): RegistrationResult {
    const { signature, ...body } = ticket;
    if (!verifySignature(this.keys.enrollment, body, signature)) {
      this.audit.append({
        tenant: ticket.tenant,
        category: 'security',
        kind: 'node_registration_rejected',
        subjectId: ticket.enrollmentId,
        detail: { reason: 'enrollment_signature_invalid' },
      });
      throw new RuntimeError('enrollment_invalid', 'The enrollment ticket is not valid.', {
        enrollmentId: ticket.enrollmentId,
      });
    }
    if (this.clock.now() > ticket.expiresAt) {
      throw new RuntimeError('enrollment_invalid', 'The enrollment ticket has expired.', {
        enrollmentId: ticket.enrollmentId,
      });
    }
    if (presented.fingerprint !== ticket.fingerprint) {
      this.audit.append({
        tenant: ticket.tenant,
        category: 'security',
        kind: 'node_registration_rejected',
        subjectId: ticket.enrollmentId,
        detail: { reason: 'fingerprint_mismatch' },
      });
      throw new RuntimeError('enrollment_invalid', 'The presented hardware fingerprint does not match enrollment.', {
        enrollmentId: ticket.enrollmentId,
      });
    }
    if (this.revokedFingerprints.has(presented.fingerprint)) {
      this.audit.append({
        tenant: ticket.tenant,
        category: 'security',
        kind: 'node_registration_rejected',
        subjectId: presented.fingerprint,
        detail: { reason: 'node_revoked' },
      });
      throw new RuntimeError('node_revoked', 'This node identity was revoked and cannot re-register.', {
        fingerprint: presented.fingerprint,
      });
    }

    const existingNodeId = this.fingerprintIndex.get(presented.fingerprint);
    if (existingNodeId) {
      const existing = this.store.get(ticket.tenant, existingNodeId);
      if (existing) {
        this.audit.append({
          tenant: ticket.tenant,
          category: 'node',
          kind: 'node_registration_deduplicated',
          subjectId: existing.nodeId,
          detail: { enrollmentId: ticket.enrollmentId },
        });
        return { node: existing, created: false };
      }
      throw new RuntimeError('duplicate_identity', 'This fingerprint is bound to another tenant.', {
        fingerprint: presented.fingerprint,
      });
    }

    if (this.consumedEnrollments.has(ticket.enrollmentId)) {
      throw new RuntimeError('enrollment_invalid', 'The enrollment ticket was already used.', {
        enrollmentId: ticket.enrollmentId,
      });
    }

    const now = this.clock.now();
    const node: RuntimeNode = {
      nodeId: this.ids.mint('node'),
      tenant: ticket.tenant,
      hardware: ticket.hardware,
      state: 'active',
      enrollmentFingerprint: presented.fingerprint,
      enrollmentId: ticket.enrollmentId,
      ownerPrincipalId: ticket.issuedByPrincipalId,
      registeredAt: now,
      lastSeenAt: now,
      degraded: false,
      capacity: ticket.capacity,
    };

    this.store.put(ticket.tenant, node.nodeId, node);
    this.fingerprintIndex.set(presented.fingerprint, node.nodeId);
    this.consumedEnrollments.add(ticket.enrollmentId);

    this.audit.append({
      tenant: node.tenant,
      category: 'node',
      kind: 'node_registered',
      subjectId: node.nodeId,
      principalId: ticket.issuedByPrincipalId,
      detail: {
        organizationId: node.tenant.organizationId,
        universeId: node.tenant.universeId,
        hardwareClass: node.hardware.classId,
        enrollmentId: node.enrollmentId,
      },
    });
    return { node, created: true };
  }

  get(scope: TenantRef, nodeId: string): RuntimeNode | undefined {
    return this.store.get(scope, nodeId);
  }

  require(scope: TenantRef, nodeId: string): RuntimeNode {
    const node = this.store.get(scope, nodeId);
    if (!node) {
      throw new RuntimeError('unknown_node', 'This runtime node is not registered in the caller scope.', { nodeId });
    }
    return node;
  }

  list(scope: TenantRef): RuntimeNode[] {
    return this.store.list(scope);
  }

  setState(scope: TenantRef, nodeId: string, state: NodeState, reason: string): RuntimeNode {
    const node = this.require(scope, nodeId);
    if (node.state === 'revoked' && state !== 'revoked') {
      throw new RuntimeError('node_revoked', 'A revoked node cannot be returned to service.', { nodeId });
    }
    const next: RuntimeNode = { ...node, state, controlReason: reason };
    this.store.put(scope, nodeId, next);
    if (state === 'revoked') this.revokedFingerprints.add(node.enrollmentFingerprint);
    return next;
  }

  markDegraded(scope: TenantRef, nodeId: string, degraded: boolean): RuntimeNode {
    const node = this.require(scope, nodeId);
    const next: RuntimeNode = { ...node, degraded };
    this.store.put(scope, nodeId, next);
    return next;
  }

  heartbeat(scope: TenantRef, nodeId: string): RuntimeNode {
    const node = this.require(scope, nodeId);
    const next: RuntimeNode = { ...node, lastSeenAt: this.clock.now() };
    this.store.put(scope, nodeId, next);
    return next;
  }

  /** Distinct identities minted, used to prove there are no duplicates. */
  get identityCount() {
    return this.fingerprintIndex.size;
  }

  get nodeCount() {
    return this.store.size;
  }

  isRevokedFingerprint(value: string) {
    return this.revokedFingerprints.has(value);
  }
}
