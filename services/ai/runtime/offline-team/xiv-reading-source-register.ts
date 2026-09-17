// 12D-276 — Reading Source Register: the fail-closed contract that
// registers PUBLIC reading sources BEFORE anything is read. This is the
// alignment link the CEO's 2026-09-16 directive asks for ("make sure all
// agents and AI tools are aligned … extract data from the web and
// documents and break the information down and recycle and feed the
// XIV AI OS brain"): NO reading enters the 12D-274 ingest → 12D-275
// admission chain unless its SOURCE was registered first — public class,
// license-noted, bounded, and hash-bound in a tamper-evident register.
//
//   * PUBLIC-CLASS ONLY: a source is PUBLIC_WEB, OPEN_SOURCE_REPO, or
//     PUBLISHED_STANDARD — anything else (TOP_SECRET, CONFIDENTIAL,
//     PRIVATE, INTERNAL) refuses. The register is where the standing
//     security boundary becomes a STRUCTURAL fact: a source that is not
//     public cannot even be registered, so it can never be read into
//     the OS through this door.
//   * CREDENTIAL-SHAPED CONTENT NEVER REGISTERS: the secret re-gate
//     lives inside the validator (the 12D-267 lesson) — a title or
//     license note carrying credential-shaped strings refuses.
//   * THE REGISTER IS A TAMPER-EVIDENT CHAIN: each entry's digest is
//     sha256 over the canonical entry chained to the previous digest
//     (the 12D-264 ledger pattern). Replaying the chain re-derives
//     every digest; tampering with a line refuses. Disclosed residual
//     (the 12D-272 lesson, DISCLOSED not patched): tail truncation of a
//     hash chain replays clean as a shorter lawful register — compare
//     the head digest out of band; middle deletions DO refuse.
//   * THE REGISTER NEVER READS: registering a source is not fetching
//     it. The reading step is human-supervised (the reading agent reads
//     the source out-of-band), and the fetched text then enters the OS
//     through the 12D-274 ingest contract. remoteCalls: 0 — this module
//     never touches the network, even for public URLs.
//   * MEASURED, BOUNDED BOOKKEEPING: maxEntriesPerRegister bounds the
//     register; each entry cites its source and the documentId the
//     reading will use. ZERO entries claim any reading happened —
//     registered ≠ read; the register records intent and provenance,
//     and the census renders measured counts only.
//
// Disclosed residuals:
//   * URL strings are validated structurally (https, length) — the
//     register cannot prove a URL resolves or is live; reading is
//     supervised anyway.
//   * sourceId dedup is exact-match within one register; the same URL
//     under two sourceIds is two entries (the chain binds what was
//     REGISTERED, not the world's URL space).
//   * OPERATOR/RUNTIME-SIDE PURE MODULE: no fs, no network, no clock,
//     no randomness. The store is injected (the 12D-236 pattern); the
//     shell may import the pure functions for a census view.

import { createHash } from 'crypto';

export const READING_SOURCE_REGISTER_POLICY = Object.freeze({
  policyVersion: '12d-276-v1',
  domain: 'XIV_OS_READING_SOURCE_REGISTER',
  maxEntriesPerRegister: 10_000,
  maxTitleChars: 200,
  maxUrlChars: 2_000,
  maxLicenseNoteChars: 500,
  sourceClasses: ['PUBLIC_WEB', 'OPEN_SOURCE_REPO', 'PUBLISHED_STANDARD'],
});

export const READING_SOURCE_REGISTER_GUARDRAILS = Object.freeze({
  publicClassOnly: true, // a non-public source cannot even register
  registeredIsNotRead: true, // registering provenance never reads anything
  secretReGateInsideTheValidator: true, // the 12D-267 lesson, from day one
  tamperEvidentChain: true, // digests chained; tampering refuses
  tailTruncationResidualDisclosed: true, // compare the head digest out of band
  licenseNoted: true, // every entry carries its license note
  remoteCalls: 0, // this module never fetches, even public URLs
  modelCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const ENTRY_KEYS = ['tenantId', 'sourceId', 'title', 'sourceUrl', 'sourceClass', 'licenseNote'] as const;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const URL_RE = /^https:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/;
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{10,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{22,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|[?&](?:[A-Za-z]+-)?token=[A-Za-z0-9]{20,}|[Bb]earer [A-Za-z0-9_.=+/-]{30,})/;

/** The injected register store contract — a LOCAL book, never a network sink. */
export interface ReadingSourceStore {
  load(): readonly string[] | null;
  save(lines: readonly string[]): void;
}

export type ReadingSourceEntry = Readonly<{
  op: 'SOURCE_REGISTERED';
  tenantId: string;
  sourceId: string;
  title: string;
  sourceUrl: string;
  sourceClass: string;
  licenseNote: string;
  entryDigest: string;
}>;

export type ReadingSourceCensus = Readonly<{
  entries: number;
  capacity: number;
  remainingCapacity: number;
  byClass: Readonly<Record<string, number>>;
  sourcesRead: 0;
  learningPromoted: false;
  activated: 0;
}>;

const entryDigestOf = (genesis: string, prev: string, canonical: string): string =>
  createHash('sha256').update(JSON.stringify([genesis, prev, 'SOURCE_REGISTERED', canonical]), 'utf8').digest('hex');

const canonicalEntry = (e: Readonly<{
  tenantId: string; sourceId: string; title: string;
  sourceUrl: string; sourceClass: string; licenseNote: string;
}>): string =>
  JSON.stringify(e, ['tenantId', 'sourceId', 'title', 'sourceUrl', 'sourceClass', 'licenseNote']);

/**
 * Register ONE public reading source. Requires a live store and budget
 * under the hard cap; refuses duplicate sourceIds. Registered is NOT
 * read: nothing is fetched here. Throws on ANY anomaly.
 */
export function registerReadingSource(
  store: ReadingSourceStore,
  registerGenesis: string,
  raw: unknown,
): ReadingSourceEntry {
  if (typeof registerGenesis !== 'string' || registerGenesis.length < 8)
    throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('a source registration object is required; fail closed');
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.length !== ENTRY_KEYS.length || !ENTRY_KEYS.every((k, i) => keys[i] === k))
    throw new Error(`a source registration must have exactly the keys [${ENTRY_KEYS.join(', ')}] in order; fail closed`);
  const r = raw as Readonly<Record<string, unknown>>;
  if (typeof r.tenantId !== 'string' || !ID_RE.test(r.tenantId))
    throw new Error('a scoped tenant id is required; fail closed');
  if (typeof r.sourceId !== 'string' || !ID_RE.test(r.sourceId))
    throw new Error('a scoped source id is required; fail closed');
  if (typeof r.title !== 'string' || r.title.trim().length < 1 || r.title.length > READING_SOURCE_REGISTER_POLICY.maxTitleChars)
    throw new Error(`a bounded source title (1..${READING_SOURCE_REGISTER_POLICY.maxTitleChars} chars) is required; fail closed`);
  if (typeof r.sourceUrl !== 'string' || !URL_RE.test(r.sourceUrl)
    || r.sourceUrl.length > READING_SOURCE_REGISTER_POLICY.maxUrlChars)
    throw new Error('an https source URL is required; fail closed');
  if (typeof r.sourceClass !== 'string' || !(READING_SOURCE_REGISTER_POLICY.sourceClasses as readonly string[]).includes(r.sourceClass))
    throw new Error(`the source class must be exactly one of [${READING_SOURCE_REGISTER_POLICY.sourceClasses.join(', ')}]; a source that is not public cannot register; fail closed`);
  if (typeof r.licenseNote !== 'string' || r.licenseNote.trim().length < 1
    || r.licenseNote.length > READING_SOURCE_REGISTER_POLICY.maxLicenseNoteChars)
    throw new Error(`a bounded license note (1..${READING_SOURCE_REGISTER_POLICY.maxLicenseNoteChars} chars) is required; fail closed`);
  if (SECRET_CONTENT_RE.test(r.title) || SECRET_CONTENT_RE.test(r.licenseNote) || SECRET_CONTENT_RE.test(r.sourceUrl))
    throw new Error('the source registration carries credential-shaped content; it is never registered; fail closed');

  const lines = store.load();
  if (lines !== null && lines.length >= READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister)
    throw new Error(`the register is full (${READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister} entries); open a new register; fail closed`);
  let prev = registerGenesis;
  if (lines) {
    for (const line of lines) {
      const e = parseSourceLine(line, registerGenesis, prev);
      prev = e.entryDigest;
      if (e.tenantId === r.tenantId && e.sourceId === r.sourceId)
        throw new Error(`source ${r.sourceId} is already registered for tenant ${r.tenantId}; a source registers exactly once; fail closed`);
    }
  }
  const canonical = canonicalEntry({
    tenantId: r.tenantId, sourceId: r.sourceId, title: r.title,
    sourceUrl: r.sourceUrl, sourceClass: r.sourceClass, licenseNote: r.licenseNote,
  });
  const entry: ReadingSourceEntry = Object.freeze({
    op: 'SOURCE_REGISTERED' as const,
    tenantId: r.tenantId,
    sourceId: r.sourceId,
    title: r.title,
    sourceUrl: r.sourceUrl,
    sourceClass: r.sourceClass,
    licenseNote: r.licenseNote,
    entryDigest: entryDigestOf(registerGenesis, prev, canonical),
  });
  const line = JSON.stringify(entry);
  if (line.length > 8192) throw new Error('the register line exceeds 8192 chars; fail closed');
  store.save([...(lines ?? []), line]);
  return entry;
}

/**
 * Read-only, chain-validating iteration over the register's entries
 * (12D-277's binding contract walks this; the census counts it). Every
 * line's digest re-derives against its predecessor; tampering refuses.
 * This never writes and never fetches.
 */
export function readSourceRegisterEntries(
  store: ReadingSourceStore,
  registerGenesis: string,
): readonly ReadingSourceEntry[] {
  if (typeof registerGenesis !== 'string' || registerGenesis.length < 8)
    throw new Error('the register genesis must be a string of at least 8 chars; fail closed');
  const lines = store.load();
  if (lines === null) return Object.freeze([]);
  const entries: ReadingSourceEntry[] = [];
  let prev = registerGenesis;
  for (const line of lines) {
    const e = parseSourceLine(line, registerGenesis, prev);
    prev = e.entryDigest;
    entries.push(e);
  }
  return Object.freeze(entries);
}

/**
 * Replay the register chain and render a MEASURED census. Validates
 * every line's digest against its predecessor; any tampering with a
 * middle entry refuses. DISCLOSED RESIDUAL (the 12D-272 lesson): a
 * lawful TAIL truncation replays clean as a shorter register — compare
 * the head digest out of band to detect it. The census renders measured
 * counts only; registered sources are NOT reads.
 */
export function replaySourceRegisterCensus(
  store: ReadingSourceStore,
  registerGenesis: string,
): ReadingSourceCensus {
  const entries = readSourceRegisterEntries(store, registerGenesis);
  if (entries.length === 0) {
    // An EMPTY store and an EMPTY REGISTER are the same zero here — but
    // load() === null vs [] is still observable through the store itself.
    return Object.freeze({
      entries: 0,
      capacity: READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister,
      remainingCapacity: READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister,
      byClass: Object.freeze({}),
      sourcesRead: 0 as const,
      learningPromoted: false as const,
      activated: 0 as const,
    });
  }
  const byClass: Record<string, number> = Object.fromEntries(
    READING_SOURCE_REGISTER_POLICY.sourceClasses.map((c) => [c, 0]),
  );
  for (const e of entries) {
    const count = byClass[e.sourceClass];
    if (count === undefined) throw new Error('unknown source class in the register; fail closed');
    byClass[e.sourceClass] = count + 1;
  }
  return Object.freeze({
    entries: entries.length,
    capacity: READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister,
    remainingCapacity: READING_SOURCE_REGISTER_POLICY.maxEntriesPerRegister - entries.length,
    byClass: Object.freeze(byClass),
    sourcesRead: 0 as const,
    learningPromoted: false as const,
    activated: 0 as const,
  });
}

/** Re-derive, never invent: a register line validates against its chain. */
function parseSourceLine(
  line: string,
  registerGenesis: string,
  prevDigest: string,
): ReadingSourceEntry {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line) as unknown;
  } catch {
    throw new Error('a register line is not valid JSON; fail closed');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('a register line must be an object; fail closed');
  const e = parsed as Readonly<Record<string, unknown>>;
  if (e.op !== 'SOURCE_REGISTERED')
    throw new Error('unknown register op; fail closed');
  for (const k of ['tenantId', 'sourceId', 'title', 'sourceUrl', 'sourceClass', 'licenseNote'] as const) {
    if (typeof e[k] !== 'string') throw new Error(`register field ${k} must be a string; fail closed`);
  }
  if (typeof e.entryDigest !== 'string' || !/^[0-9a-f]{64}$/.test(e.entryDigest))
    throw new Error('a register entry digest must be hex64; fail closed');
  const canonical = canonicalEntry({
    tenantId: e.tenantId as string, sourceId: e.sourceId as string,
    title: e.title as string, sourceUrl: e.sourceUrl as string,
    sourceClass: e.sourceClass as string, licenseNote: e.licenseNote as string,
  });
  const expected = entryDigestOf(registerGenesis, prevDigest, canonical);
  if (e.entryDigest !== expected)
    throw new Error('a register line fails its chain digest; the register is tampered; fail closed');
  return parsed as unknown as ReadingSourceEntry;
}