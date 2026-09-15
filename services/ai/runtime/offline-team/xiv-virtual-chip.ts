// 12D-240 — XIV Virtual Chip: hardware-adapter DECLARATION registry. The honest
// engineering surface for the CEO's 2026-09-15 direction ("virtual XIV chips
// compatible with every CPU, GPU, NPU on earth; the first quantum AI agent OS"):
//
//   * An adapter's compatibility is DECLARED by the operator — this contract
//     REGISTERS the declaration, it does not make hardware work.
//   * `proven` is PINNED to false and is not an accepted input. There is NO
//     promotion path in this contract: measured-compatibility proof requires a
//     drill story (the 12D-103 pattern — synthetic capacity fixture +
//     operational drill), which is a FUTURE, separately reviewed story. A
//     promotion attempt refuses with exactly that message.
//   * `quantumPathProven: false` is a pinned structural flag — "the first
//     quantum AI agent OS" is an ASPIRATION, never a claim. Nothing here
//     asserts quantum capability, a quantum device, or any hardware at all:
//     this registry touches NOTHING physical. `remoteCalls: 0`, no driver, no
//     device open, no kernel interaction — a pure declarations ledger.
//   * Every packet carries the honest flags; `billionUsersProven: false` and
//     `humanDecision: 'REQUIRED'` included.
//
// Disclosed residuals, stated plainly:
//   * A DECLARED adapter is a declaration only — vendor authenticity is
//     out-of-band operator custody (registration is not issuance proof; the
//     12D-233 disclosure carries over verbatim).
//   * One registry instance per deployment is single-writer operator
//     discipline (same as every ledger on this branch); durability across a
//     process restart is the 12D-236/237 pattern and is NOT re-solved here.
//   * "Compatible with every digital product" is a LONG-HORIZON aspiration —
//     never a property of this contract. Nothing is universal until measured.

import { createHash } from 'crypto';

export const XIV_VIRTUAL_CHIP_POLICY = Object.freeze({
  policyVersion: '12d-240-v1',
  domain: 'XIV_VIRTUAL_CHIP_ADAPTER' as const,
  allowedArchitectures: ['cpu', 'gpu', 'npu', 'fpga', 'asic', 'neuromorphic', 'quantum'] as const,
  maxAdapterNameChars: 96,
  maxDeclaredByChars: 128,
});

export const XIV_VIRTUAL_CHIP_GUARDRAILS = Object.freeze({
  compatibilityIsDeclaredNotProven: true,
  provenPinnedFalseUntilMeasuredDrill: true,
  quantumPathProven: false, // an aspiration, never a claim
  promotionRefusedInThisContract: true,
  measuredDrillRequiredForProven: true,
  touchesNoPhysicalDevice: true, // a pure registry: no driver, no device open
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

const ARCH_RE = /^[a-z]$/;

export interface VirtualChipAdapter {
  /** sha256 over the canonical declaration — re-derived by verification. */
  readonly adapterId: string;
  readonly adapterName: string;
  readonly architecture: (typeof XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures)[number];
  /** PINNED — compatibility is a DECLARATION until a measured drill story. */
  readonly compatibility: 'DECLARED';
  readonly proven: false;
  readonly quantumPathProven: false;
  readonly declaredBy: string;
  readonly declaredAtMs: number;
  readonly declarationDigest: string;
  readonly guardrails: typeof XIV_VIRTUAL_CHIP_GUARDRAILS;
}

const DECLARATION_KEYS = ['adapterName', 'architecture', 'declaredBy', 'declaredAtMs'] as const;

/** The declaration digest covers EVERY declared input, in a fixed key order. */
const deriveDeclarationDigest = (
  input: Readonly<{ adapterName: string; architecture: string; declaredBy: string; declaredAtMs: number }>,
): string => sha256(JSON.stringify({
  domain: XIV_VIRTUAL_CHIP_POLICY.domain,
  adapterName: input.adapterName,
  architecture: input.architecture,
  declaredBy: input.declaredBy,
  declaredAtMs: input.declaredAtMs,
}));

/**
 * Register one hardware-adapter COMPATIBILITY DECLARATION. Fail-closed:
 * the exact-shape gate runs FIRST, the architecture must be on the policy
 * allowlist, and a duplicate declaration (same canonical digest) refuses for
 * the registry's lifetime. NOTHING physical is touched — no driver, no device.
 */
export class VirtualChipRegistry {
  readonly #genesis: string;
  readonly #adapters = new Map<string, VirtualChipAdapter>();

  constructor(genesis: string) {
    if (typeof genesis !== 'string' || genesis.length < 8)
      throw new Error('the virtual-chip registry genesis must be a string of at least 8 chars; fail closed');
    this.#genesis = genesis;
  }

  get genesis(): string {
    return this.#genesis;
  }

  /** Register one adapter declaration. The digest is re-derived, never invented. */
  declare(input: Readonly<{
    adapterName: string; architecture: string; declaredBy: string; declaredAtMs: number;
  }>): Readonly<VirtualChipAdapter> {
    if (!hasExactKeys(input, DECLARATION_KEYS))
      throw new Error(`an adapter declaration must have exactly the keys ${DECLARATION_KEYS.join(', ')}; fail closed`);
    if (typeof input.adapterName !== 'string'
      || input.adapterName.length < 2
      || input.adapterName.length > XIV_VIRTUAL_CHIP_POLICY.maxAdapterNameChars
      || !/^[A-Za-z0-9][A-Za-z0-9 ._/()-]*$/.test(input.adapterName))
      throw new Error(`adapterName must match ^[A-Za-z0-9][A-Za-z0-9 ._/()-]*$ (2..${XIV_VIRTUAL_CHIP_POLICY.maxAdapterNameChars} chars); fail closed`);
    if (typeof input.architecture !== 'string'
      || !(XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures as readonly string[]).includes(input.architecture))
      throw new Error(`architecture must be one of ${XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures.join(' | ')}; fail closed`);
    if (typeof input.declaredBy !== 'string'
      || input.declaredBy.length < 1
      || input.declaredBy.length > XIV_VIRTUAL_CHIP_POLICY.maxDeclaredByChars)
      throw new Error(`declaredBy must be a string of 1..${XIV_VIRTUAL_CHIP_POLICY.maxDeclaredByChars} chars; fail closed`);
    if (!safeInt(input.declaredAtMs))
      throw new Error('declaredAtMs must be a safe integer; fail closed');

    const declarationDigest = sha256(JSON.stringify({
      genesis: this.#genesis,
      domain: XIV_VIRTUAL_CHIP_POLICY.domain,
      adapterName: input.adapterName,
      architecture: input.architecture,
      declaredBy: input.declaredBy,
      declaredAtMs: input.declaredAtMs,
    }));
    if (this.#adapters.has(declarationDigest))
      throw new Error('this exact adapter declaration is already registered (declared exactly once); fail closed');

    const adapter: VirtualChipAdapter = Object.freeze({
      adapterId: declarationDigest,
      adapterName: input.adapterName,
      architecture: input.architecture as (typeof XIV_VIRTUAL_CHIP_POLICY.allowedArchitectures)[number],
      compatibility: 'DECLARED' as const,
      proven: false as const,
      quantumPathProven: false as const,
      declaredBy: input.declaredBy,
      declaredAtMs: input.declaredAtMs,
      declarationDigest,
      guardrails: XIV_VIRTUAL_CHIP_GUARDRAILS,
    });
    this.#adapters.set(declarationDigest, adapter);
    return adapter;
  }

  /**
   * REFUSED by construction: measured-compatibility proof requires a drill
   * story (12D-103 pattern) that does not exist yet. This contract issues
   * DECLARED only — there is no promotion path, ever, in this story.
   */
  promoteToProven(adapterId: string, evidenceRef: string): never {
    void adapterId;
    void evidenceRef;
    throw new Error(
      'proven compatibility requires a measured drill (12D-103 pattern) — a future, separately reviewed story; '
      + 'this contract issues DECLARED only and never claims hardware compatibility; fail closed',
    );
  }

  /** Read-only lookup by adapter id (the digest). */
  adapterFor(adapterId: string): Readonly<VirtualChipAdapter> | null {
    return this.#adapters.get(adapterId) ?? null;
  }

  /** A frozen snapshot of the declarations, in registration order. */
  listAdapters(): readonly Readonly<VirtualChipAdapter>[] {
    return Object.freeze([...this.#adapters.values()]);
  }

  get size(): number {
    return this.#adapters.size;
  }

  /** Read-only verification: EVERY declared digest re-derives from its inputs. */
  verify(): Readonly<{ ok: boolean; adapters: number }> {
    for (const adapter of this.#adapters.values()) {
      verifyVirtualChipAdapter(adapter, this.#genesis);
    }
    return Object.freeze({ ok: true, adapters: this.#adapters.size });
  }
}

const VERIFIED_ADAPTER_KEYS = [
  'adapterId', 'adapterName', 'architecture', 'compatibility', 'proven',
  'quantumPathProven', 'declaredBy', 'declaredAtMs', 'declarationDigest', 'guardrails',
] as const;

/** Read-only single-adapter verification — re-derives the declaration digest. */
export function verifyVirtualChipAdapter(
  adapter: Readonly<VirtualChipAdapter>,
  genesis: string,
): Readonly<{ ok: boolean; adapterId: string }> {
  if (!hasExactKeys(adapter, VERIFIED_ADAPTER_KEYS))
    throw new Error('adapter shape mismatch; fail closed');
  if (adapter.compatibility !== 'DECLARED' || adapter.proven !== false || adapter.quantumPathProven !== false)
    throw new Error(`adapter ${JSON.stringify(adapter.adapterName)} claims proven compatibility — impossible in this contract; fail closed`);
  const rederived = sha256(JSON.stringify({
    genesis,
    domain: XIV_VIRTUAL_CHIP_POLICY.domain,
    adapterName: adapter.adapterName,
    architecture: adapter.architecture,
    declaredBy: adapter.declaredBy,
    declaredAtMs: adapter.declaredAtMs,
  }));
  if (rederived !== adapter.declarationDigest || adapter.adapterId !== adapter.declarationDigest)
    throw new Error(`adapter ${JSON.stringify(adapter.adapterName)} declaration digest mismatch — tampered; fail closed`);
  return Object.freeze({ ok: true, adapterId: adapter.adapterId });
}