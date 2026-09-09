import { nonce, sha256 } from './crypto';

/**
 * Identifier minting for the runtime plane.
 *
 * Node and agent identifiers must be unique for the lifetime of the plane, so
 * they combine a monotonic sequence with random material. The sequence alone
 * guarantees uniqueness inside a plane instance; the random suffix keeps ids
 * from being guessable by a caller trying to collide with another tenant.
 */
export class IdFactory {
  private sequence = 0;
  private readonly issued = new Set<string>();

  mint(prefix: string): string {
    this.sequence += 1;
    const id = `${prefix}_${this.sequence.toString(36)}${nonce(8)}`;
    if (this.issued.has(id)) {
      throw new Error(`id_collision:${prefix}`);
    }
    this.issued.add(id);
    return id;
  }

  /** Total ids minted, used by the acceptance suite to prove 0 collisions. */
  get count() {
    return this.issued.size;
  }

  get sequenceValue() {
    return this.sequence;
  }
}

/**
 * A tenant-scoped logical agent key hashes to exactly one slot. Two tenants
 * using the same human-facing key can never land on the same slot because the
 * organization and universe are part of the hashed material.
 */
export function logicalAgentSlot(organizationId: string, universeId: string, agentKey: string): string {
  return sha256(`${organizationId}\u0000${universeId}\u0000${agentKey}`);
}
