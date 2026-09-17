// 12D-306 — Assistant Memory View Model: the fail-closed rendering
// contract that turns a REAL 12D-305 memory packet into the story
// shell's window onto the mini brain's semantic memory.
//
// The packet is produced RUNTIME-SIDE by prepareAssistantMemoryRead (it
// needs a trusted queue — the 12D-286 lesson: queue doors are never
// shell-imported). The operator carries the packet to the shell; this
// module renders it ONLY after full re-verification:
//   * exact-key gate on the packet (14 keys, in order) and on every
//     memory entry (4 keys, in order)
//   * policy pin: 12d-305 material, kind ASSISTANT_MEMORY_READ
//   * the memory digest is RE-DERIVED from the entries (never trusted)
//   * SECRET_CONTENT_RE re-applied to every objective (defense in depth)
//   * the honest flags enforced: modelCalls 0, remoteCalls 0,
//     learningPromoted false, activated 0, humanDecision REQUIRED
//   * the disclosed bounds re-checked: entry cap 6, objective cap 2,000
//     chars (truncation flag consistent), scan cap 500 rows, doneCount
//     ≥ carried entries and consistent with entriesTruncated
// The render says what the memory IS and what it is NOT: reviewed facts
// only, read-only, nothing learned, nothing activated. PURE module: no
// fs, no network, no clock, no randomness. modelCalls 0, remoteCalls 0.
import { deriveAssistantMemoryDigest } from './xiv-assistant-memory-digest';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';

export const ASSISTANT_MEMORY_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-306-v1',
  domain: 'XIV_OS_ASSISTANT_MEMORY_VIEW_MODEL',
});

export const ASSISTANT_MEMORY_VIEW_MODEL_GUARDRAILS = Object.freeze({
  theRealDoorNotAReimplementation: true, // the packet must be 12d-305 material
  memoryDigestReDerivedNeverTrusted: true,
  secretsNeverRender: true,
  boundsReChecked: true,
  reviewedFactsOnly: true,
  ledgeredNeverActivated: true,
  refusedRendersAsRefused: true,
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  activated: 0,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const PACKET_KEYS = [
  'kind', 'policyVersion', 'tenantId', 'entries', 'scannedRows', 'scannedTruncated',
  'doneCount', 'entriesTruncated', 'memoryDigest', 'modelCalls', 'remoteCalls',
  'learningPromoted', 'activated', 'humanDecision',
] as const;
const ENTRY_KEYS = ['storyId', 'outputHash', 'objective', 'objectiveTruncated'] as const;

const SHA_RE = /^[a-f0-9]{64}$/;
const TENANT_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const STORY_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const MAX_ENTRIES = 6;
const MAX_OBJECTIVE_CHARS = 2_000;
const MAX_SCAN_ROWS = 500;

export type AssistantMemoryViewModel =
  | Readonly<{
      kind: 'VERIFIED_ASSISTANT_MEMORY';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        tenantId: string;
        carriedCount: number;
        doneCount: number;
        scannedRows: number;
        truncatedNote: string;
        entries: readonly Readonly<{
          storyId: string;
          outputHashHead: string;
          objective: string;
          objectiveTruncated: boolean;
        }>[];
        operatorNote: string;
      }>;
    }>
  | Readonly<{
      kind: 'REFUSED';
      policyVersion: string;
      reason: string;
      display: Readonly<{
        headline: string;
        bodyText: string;
        operatorNote: string;
      }>;
    }>;

const REFUSAL_HEADLINE = 'Assistant memory read refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[], what: string): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`${what} must have exactly the keys [${keys.join(', ')}] in order; fail closed`);
}

/**
 * The only door from a raw 12D-305 memory packet to the UI. Accepts
 * ANY unknown value; returns a frozen view model that is either a fully
 * re-verified view or an honest refusal. Never throws.
 */
export function buildAssistantMemoryViewModel(raw: unknown): AssistantMemoryViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('an assistant memory packet object is required; fail closed');
    const p = raw as Readonly<Record<string, unknown>>;
    requireExactKeys(p as Record<string, unknown>, PACKET_KEYS, 'a memory packet');
    if (p.kind !== 'ASSISTANT_MEMORY_READ')
      throw new Error('the packet is not ASSISTANT_MEMORY_READ material; fail closed');
    if (p.policyVersion !== '12d-305-v1')
      throw new Error('the packet is not 12d-305 material; fail closed');
    if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.learningPromoted !== false || p.activated !== 0)
      throw new Error('the packet flags must be the pinned honest values (no model calls, nothing learned, nothing activated); fail closed');
    if (p.humanDecision !== 'REQUIRED')
      throw new Error('humanDecision must be REQUIRED on a memory read; fail closed');
    if (typeof p.tenantId !== 'string' || !TENANT_RE.test(p.tenantId))
      throw new Error('the packet carries a malformed tenantId; fail closed');
    if (!Array.isArray(p.entries) || p.entries.length < 1 || p.entries.length > MAX_ENTRIES)
      throw new Error(`the packet must carry 1..${MAX_ENTRIES} memory entries; fail closed`);
    const entries = p.entries as unknown[];
    const reDerivedEntries = entries.map((e) => {
      if (e === null || typeof e !== 'object' || Array.isArray(e))
        throw new Error('a memory entry object is required; fail closed');
      const entry = e as Readonly<Record<string, unknown>>;
      requireExactKeys(entry as Record<string, unknown>, ENTRY_KEYS, 'a memory entry');
      if (typeof entry.storyId !== 'string' || !STORY_RE.test(entry.storyId))
        throw new Error('a memory entry carries a malformed storyId; fail closed');
      if (typeof entry.outputHash !== 'string' || !SHA_RE.test(entry.outputHash))
        throw new Error('a memory entry carries a malformed outputHash; fail closed');
      if (typeof entry.objective !== 'string' || entry.objective.trim().length === 0
        || entry.objective.length > MAX_OBJECTIVE_CHARS)
        throw new Error(`a memory entry objective must be bounded 1..${MAX_OBJECTIVE_CHARS} chars; fail closed`);
      if (typeof entry.objectiveTruncated !== 'boolean'
        || entry.objectiveTruncated !== (entry.objective.length === MAX_OBJECTIVE_CHARS))
        throw new Error('a memory entry truncation disclosure is inconsistent with its objective length; fail closed');
      if (SECRET_CONTENT_RE.test(entry.objective))
        throw new Error('a memory entry objective is secret-shaped; it never renders; fail closed');
      return {
        storyId: entry.storyId,
        outputHash: entry.outputHash,
        objective: entry.objective,
        objectiveTruncated: entry.objectiveTruncated,
      };
    });
    // The digest is RE-DERIVED, never trusted.
    if (p.memoryDigest !== deriveAssistantMemoryDigest(reDerivedEntries))
      throw new Error('the packet memoryDigest does not match the re-derived entries; fail closed');
    for (const [name, v] of [['scannedRows', p.scannedRows], ['doneCount', p.doneCount]] as const) {
      if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > MAX_SCAN_ROWS)
        throw new Error(`${name} must be a safe integer 1..${MAX_SCAN_ROWS}; fail closed`);
    }
    if ((p.doneCount as number) < entries.length)
      throw new Error('doneCount cannot be smaller than the carried entries; fail closed');
    if (p.entriesTruncated !== (p.doneCount as number) > MAX_ENTRIES)
      throw new Error('entriesTruncated is inconsistent with doneCount; fail closed');
    if (p.scannedTruncated !== false && (p.scannedRows as number) < MAX_SCAN_ROWS)
      throw new Error('scannedTruncated cannot be true below the scan cap; fail closed');
    const doneCount = p.doneCount as number;
    const scannedRows = p.scannedRows as number;
    const carried = entries.length;
    const truncations: string[] = [];
    if (p.entriesTruncated === true) truncations.push(`carrying the ${carried} most recent of ${doneCount} reviewed facts`);
    if (p.scannedTruncated === true) truncations.push(`the scan window capped at ${MAX_SCAN_ROWS} rows`);
    return Object.freeze({
      kind: 'VERIFIED_ASSISTANT_MEMORY' as const,
      policyVersion: ASSISTANT_MEMORY_VIEW_MODEL_POLICY.policyVersion,
      display: Object.freeze({
        headline: `Mini-brain memory verified — ${carried} reviewed fact(s) carried for ${String(p.tenantId)} — read-only, nothing learned`,
        tenantId: String(p.tenantId),
        carriedCount: carried,
        doneCount,
        scannedRows,
        truncatedNote: truncations.length === 0 ? 'no bound bit' : truncations.join('; '),
        entries: Object.freeze(reDerivedEntries.map((e) => Object.freeze({
          storyId: e.storyId,
          outputHashHead: e.outputHash.slice(0, 12) + '…',
          objective: e.objective,
          objectiveTruncated: e.objectiveTruncated,
        }))),
        operatorNote: `Re-verified against assistant-memory policy 12d-305-v1: every entry is an independently reviewed DONE fact, the memory digest was RE-DERIVED from the entries and matches, the objectives were re-screened (secrets never render), and every bound that bit is disclosed (${truncations.length === 0 ? 'none' : truncations.join('; ')}). This is a read-only view: modelCalls 0, remoteCalls 0, learningPromoted false, activated 0 — the mini brain REMEMBERS what the humans reviewed; it does not learn from it (weights stay CEO-gated). humanDecision REQUIRED.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: ASSISTANT_MEMORY_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The assistant memory packet failed verification and was NOT rendered. Nothing is shown from it — not ids, not digests, not objectives. Diagnostics below are for the operator.',
        operatorNote: 'Refused. The input must be a packet the REAL 12D-305 door produced (prepareAssistantMemoryRead) — all 14 keys in order, 12d-305 material, honest flags, and a memory digest the re-derivation reproduces.',
      }),
    });
  }
}