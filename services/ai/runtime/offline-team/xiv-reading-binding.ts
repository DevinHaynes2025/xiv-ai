// 12D-277 — Reading Binding Contract: the fail-closed proof that a
// reading traces to a REGISTERED source. This closes the loop the CEO's
// 2026-09-16 directive asks for ("make sure all agents and AI tools are
// aligned … extract data from the web and documents … recycle and feed
// the XIV AI OS brain"): between the 12D-276 register and the
// 12D-274/12D-275 ingest+admission chain sits THIS contract — an
// operator binds a reading (a document digest that was or will be
// ingested) to its registered source, and the binding is only issued if
// the register chain, re-derived line by line, actually contains that
// source for that tenant.
//
//   * NO REGISTER, NO BINDING: a reading whose (tenantId, sourceId) is
//     not an entry of the chain REFUSES — a reading cannot even claim
//     provenance it doesn't have. The binding is re-derived from the
//     register bytes, never taken from the caller's word.
//   * PUBLIC CLASS RE-CHECKED FROM THE CHAIN: the binding re-reads the
//     source's class from the register bytes and refuses anything that
//     is not one of the three public classes (a tampered or foreign
//     register cannot smuggle a non-public class through).
//   * THE BINDING IS A FROZEN RECEIPT: it carries the source's entry
//     digest (the chain position that proves registration), the
//     source's URL, the document digest being bound, and the pinned
//     honest flags. It is EVIDENCE, not a command: nothing is read,
//     ingested, admitted, or activated here.
//   * DETERMINISTIC: the same register bytes and reading input always
//     produce the same binding.
//   * PURE: no fs, no network, no clock, no randomness, no model calls.
//     The register store is injected (the 12D-236 pattern).
//
// Disclosed residuals:
//   * The binding is the operator's PROVENANCE RECEIPT — it proves the
//     source was registered and re-states the document digest the
//     operator declared. It cannot prove, by bytes alone, that the
//     text ingested under that digest was truly fetched from that URL:
//     the digest chain binds the REGISTER to the reading's identity,
//     and the human-supervised reading step remains the trust point
//     (disclosed; the queue's fingerprint discipline still binds the
//     admitted story bytes).
//   * The binding is checked by the operator at bind time; a future
//     rung may make 12D-275 admission REQUIRE a matching binding —
//     disclosed as the next candidate, not assumed here.

import {
  READING_SOURCE_REGISTER_POLICY,
  readSourceRegisterEntries,
  type ReadingSourceStore,
} from './xiv-reading-source-register';

export const READING_BINDING_POLICY = Object.freeze({
  policyVersion: '12d-277-v1',
  domain: 'XIV_OS_READING_BINDING',
});

export const READING_BINDING_GUARDRAILS = Object.freeze({
  reDerivedFromRegisterNeverTaken: true, // the chain proves the source registered
  publicClassReCheckedFromTheChain: true,
  evidenceNeverCommand: true, // a binding reads, ingests, and admits NOTHING
  deterministic: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const READING_KEYS = ['tenantId', 'sourceId', 'documentId', 'documentDigestSha256'] as const;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HEX64_RE = /^[0-9a-f]{64}$/;

export type ReadingBinding = Readonly<{
  kind: 'READING_BOUND_TO_SOURCE';
  policyVersion: string;
  tenantId: string;
  sourceId: string;
  sourceUrl: string;
  sourceClass: string;
  sourceEntryDigestSha256: string;
  documentId: string;
  documentDigestSha256: string;
  learningPromoted: false;
  activated: 0;
  humanDecision: 'REQUIRED';
}>;

/**
 * Bind one reading to its REGISTERED source. Walks the register chain
 * (re-deriving every entry digest), finds the (tenantId, sourceId)
 * entry, re-checks its public class FROM THE CHAIN, and returns a
 * frozen provenance receipt. Throws on ANY anomaly — fail closed.
 */
export function bindReadingToSource(
  store: ReadingSourceStore,
  registerGenesis: string,
  raw: unknown,
): ReadingBinding {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('a reading binding object is required; fail closed');
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.length !== READING_KEYS.length || !READING_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a reading binding must have exactly the keys [${READING_KEYS.join(', ')}] in order; fail closed`);
  const r = raw as Readonly<Record<string, unknown>>;
  if (typeof r.tenantId !== 'string' || !ID_RE.test(r.tenantId))
    throw new Error('a scoped tenant id is required; fail closed');
  if (typeof r.sourceId !== 'string' || !ID_RE.test(r.sourceId))
    throw new Error('a scoped source id is required; fail closed');
  if (typeof r.documentId !== 'string' || !ID_RE.test(r.documentId))
    throw new Error('a scoped document id is required; fail closed');
  if (typeof r.documentDigestSha256 !== 'string' || !HEX64_RE.test(r.documentDigestSha256))
    throw new Error('a hex64 document digest is required; fail closed');

  // Re-derive the chain from its bytes — the caller's word proves nothing.
  const entries = readSourceRegisterEntries(store, registerGenesis);
  const entry = entries.find((e) => e.tenantId === r.tenantId && e.sourceId === r.sourceId);
  if (!entry)
    throw new Error(`source ${r.sourceId} is not registered for tenant ${r.tenantId}; NO REGISTER, NO BINDING; fail closed`);
  // The public class is re-checked FROM THE CHAIN BYTES, not trusted.
  if (!(READING_SOURCE_REGISTER_POLICY.sourceClasses as readonly string[]).includes(entry.sourceClass))
    throw new Error('the registered source class is not public; the binding refuses; fail closed');
  return Object.freeze({
    kind: 'READING_BOUND_TO_SOURCE' as const,
    policyVersion: READING_BINDING_POLICY.policyVersion,
    tenantId: r.tenantId,
    sourceId: r.sourceId,
    sourceUrl: entry.sourceUrl,
    sourceClass: entry.sourceClass,
    sourceEntryDigestSha256: entry.entryDigest,
    documentId: r.documentId,
    documentDigestSha256: r.documentDigestSha256,
    learningPromoted: false as const,
    activated: 0 as const,
    humanDecision: 'REQUIRED' as const,
  });
}