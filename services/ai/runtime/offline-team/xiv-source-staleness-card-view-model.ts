// 12D-315 — Source Staleness Card VIEW MODEL: the frozen render of the
// card packet. Fail closed like its siblings: exact keys in order for
// each status, the ENTIRE derivation re-computed from the card's OWN
// inputs (the REAL 12D-306 gate re-runs on the carried memoryPacket, the
// recorded digest heads are re-parsed from the verified objectives, the
// digest entries are re-screened, and every assessment row and the
// verdict are RE-DERIVED — a packet whose rows or verdict do not match
// its own inputs refuses with NOTHING rendered), honest flags enforced.
import {
  SOURCE_STALENESS_CARD_POLICY,
  type AssessedDocument,
  type DocumentStalenessVerdict,
  type SourceStalenessVerdict,
} from './xiv-source-staleness-card';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';

export const SOURCE_STALENESS_CARD_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-315-v1',
  domain: 'XIV_OS_SOURCE_STALENESS_CARD_VIEW_MODEL',
});

export const SOURCE_STALENESS_CARD_VIEW_MODEL_GUARDRAILS = Object.freeze({
  derivationReComputedFromTheInputs: true,
  theRealMemoryGateReRun: true,
  staleEvidenceRenderedByStoryId: true,
  uncheckedRenderedAsUnchecked: true,
  exactKeysInOrder: true,
  honestFlagsEnforced: true,
  modelCalls: 0,
  remoteCalls: 0,
  activated: 0,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const VERIFIED_KEYS = [
  'status', 'kind', 'policyVersion', 'memoryPacket', 'currentDigests', 'tenantId',
  'assessed', 'staleCount', 'staleDocumentIds', 'uncheckedCount', 'affectedStoryIds',
  'verdict', 'modelCalls', 'remoteCalls', 'activated', 'learningPromoted',
  'stoppedBefore', 'humanDecision',
] as const;

const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

const MAX_DIGEST_ENTRIES = 24;
const DOCUMENT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA_RE = /^[0-9a-f]{64}$/;
const DOC_REF_RE = /doc:([^:\s"]+):([0-9a-f]{16})/;

export type SourceStalenessCardViewModel =
  | Readonly<{
      kind: 'VERIFIED_SOURCE_STALENESS_CARD';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        tenantId: string;
        assessed: readonly AssessedDocument[];
        staleCount: number;
        staleDocumentIds: readonly string[];
        uncheckedCount: number;
        affectedStoryIds: readonly string[];
        verdict: SourceStalenessVerdict;
        stoppedBefore: string;
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

const REFUSAL_HEADLINE = 'Source staleness card refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[]): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`a staleness card packet must have exactly the keys [${keys.join(', ')}] in order for its status; fail closed`);
}

function assessGate(value: unknown): AssessedDocument[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_DIGEST_ENTRIES + 6)
    throw new Error('assessed must be a non-empty array of at most 30 rows; fail closed');
  const rows: AssessedDocument[] = [];
  for (const row of value as unknown[]) {
    if (row === null || typeof row !== 'object' || Array.isArray(row))
      throw new Error('each assessed row must be an object; fail closed');
    const keys = Object.keys(row as Record<string, unknown>);
    if (keys.length !== 4 || keys[0] !== 'documentId' || keys[1] !== 'recordedDigestHead' || keys[2] !== 'currentDigestHead' || keys[3] !== 'verdict')
      throw new Error('each assessed row must have exactly the keys [documentId, recordedDigestHead, currentDigestHead, verdict] in order; fail closed');
    const r = row as Readonly<Record<string, unknown>>;
    if (typeof r.documentId !== 'string' || !DOCUMENT_ID_RE.test(r.documentId))
      throw new Error('each assessed row documentId must be id-shaped; fail closed');
    for (const headField of ['recordedDigestHead', 'currentDigestHead'] as const) {
      if (typeof r[headField] !== 'string' || (r[headField] !== '' && !/^[0-9a-f]{16}$/.test(r[headField] as string)))
        throw new Error(`each assessed row ${headField} must be empty or a hex16 digest head; fail closed`);
    }
    if (r.verdict !== 'CURRENT' && r.verdict !== 'STALE' && r.verdict !== 'UNCHECKED' && r.verdict !== 'PATTERN_ABSENT')
      throw new Error('each assessed row verdict must be CURRENT, STALE, UNCHECKED or PATTERN_ABSENT; fail closed');
    rows.push(r as unknown as AssessedDocument);
  }
  const docIds = rows.map((r) => r.documentId);
  if (new Set(docIds).size !== docIds.length)
    throw new Error('assessed rows must have distinct documentIds; fail closed');
  return rows;
}

export function buildSourceStalenessCardViewModel(raw: unknown): SourceStalenessCardViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: SOURCE_STALENESS_CARD_VIEW_MODEL_POLICY.policyVersion,
        reason: 'the card input is not an object; fail closed',
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'NO card was rendered: the packet could not be verified.',
          operatorNote: 'Paste the REAL 12D-305 memory packet plus the re-fetched digests.',
        }),
      });
    }
    const p = raw as Readonly<Record<string, unknown>>;
    if (p.status === 'VERIFIED') {
      requireExactKeys(p as Record<string, unknown>, VERIFIED_KEYS);
      if (p.kind !== 'SOURCE_STALENESS_CARD')
        throw new Error('a VERIFIED card must carry kind SOURCE_STALENESS_CARD; fail closed');
      if (p.policyVersion !== SOURCE_STALENESS_CARD_POLICY.policyVersion)
        throw new Error(`a VERIFIED card must carry policyVersion ${SOURCE_STALENESS_CARD_POLICY.policyVersion}; fail closed`);
      // THE ENTIRE DERIVATION IS RE-COMPUTED from the card's own inputs.
      const vm = buildAssistantMemoryViewModel(p.memoryPacket);
      if (vm.kind === 'REFUSED')
        throw new Error(`the carried memory packet failed re-verification (${vm.reason}); the card is refused`);
      if (!Array.isArray(p.currentDigests) || p.currentDigests.length < 1 || p.currentDigests.length > MAX_DIGEST_ENTRIES)
        throw new Error(`currentDigests must be an array of 1..${MAX_DIGEST_ENTRIES} entries; fail closed`);
      const seen = new Set<string>();
      const digests: { documentId: string; digestSha256: string }[] = [];
      for (const entry of p.currentDigests as unknown[]) {
        if (entry === null || typeof entry !== 'object' || Array.isArray(entry))
          throw new Error('each currentDigests entry must be an object; fail closed');
        const eKeys = Object.keys(entry as Record<string, unknown>);
        if (eKeys.length !== 2 || eKeys[0] !== 'documentId' || eKeys[1] !== 'digestSha256')
          throw new Error('each currentDigests entry must have exactly the keys [documentId, digestSha256] in order; fail closed');
        const e = entry as Readonly<Record<string, unknown>>;
        if (typeof e.documentId !== 'string' || !DOCUMENT_ID_RE.test(e.documentId))
          throw new Error('each documentId must be id-shaped; fail closed');
        if (typeof e.digestSha256 !== 'string' || !SHA_RE.test(e.digestSha256))
          throw new Error('each digestSha256 must be lowercase hex64; fail closed');
        if (seen.has(e.documentId))
          throw new Error('currentDigests must have distinct documentIds; fail closed');
        seen.add(e.documentId);
        digests.push({ documentId: e.documentId, digestSha256: e.digestSha256 });
      }
      // Re-derive the recorded heads from the verified objectives.
      const recorded = new Map<string, string>();
      const patternAbsent: string[] = [];
      for (const entry of vm.display.entries) {
        const match = entry.objective.match(DOC_REF_RE);
        if (match === null) { patternAbsent.push(entry.storyId); continue; }
        if (!recorded.has(match[1]!)) recorded.set(match[1]!, match[2]!);
      }
      const reDerived: AssessedDocument[] = [];
      for (const [documentId, recordedHead] of recorded) {
        const supplied = digests.find((d) => d.documentId === documentId);
        if (supplied === undefined) {
          reDerived.push(Object.freeze({ documentId, recordedDigestHead: recordedHead, currentDigestHead: '', verdict: 'UNCHECKED' as const }));
          continue;
        }
        const currentHead = supplied.digestSha256.slice(0, 16);
        reDerived.push(Object.freeze({
          documentId, recordedDigestHead: recordedHead, currentDigestHead: currentHead,
          verdict: (currentHead === recordedHead ? 'CURRENT' : 'STALE') as DocumentStalenessVerdict,
        }));
      }
      for (const d of digests) {
        if (!recorded.has(d.documentId))
          reDerived.push(Object.freeze({ documentId: d.documentId, recordedDigestHead: '', currentDigestHead: d.digestSha256.slice(0, 16), verdict: 'UNCHECKED' as const }));
      }
      for (const storyId of patternAbsent)
        reDerived.push(Object.freeze({ documentId: storyId, recordedDigestHead: '', currentDigestHead: '', verdict: 'PATTERN_ABSENT' as const }));
      // The packet's own rows must match the re-derivation EXACTLY.
      const assessed = assessGate(p.assessed);
      const canon = (rows: AssessedDocument[]) => rows.map((r) => [r.documentId, r.recordedDigestHead, r.currentDigestHead, r.verdict].join(';')).join('|');
      if (canon(assessed) !== canon(reDerived))
        throw new Error('the assessed rows do not match the re-derived derivation from the card inputs; fail closed');
      const stale = assessed.filter((a) => a.verdict === 'STALE');
      const reDerivedStaleIds = reDerived.filter((a) => a.verdict === 'STALE').map((a) => a.documentId);
      if (typeof p.staleCount !== 'number' || !Number.isSafeInteger(p.staleCount) || p.staleCount !== stale.length)
        throw new Error('staleCount must equal the number of STALE rows; fail closed');
      const staleIds = p.staleDocumentIds;
      if (!Array.isArray(staleIds) || staleIds.length !== stale.length
        || staleIds.some((id) => typeof id !== 'string' || !DOCUMENT_ID_RE.test(id))
        || staleIds.join('|') !== reDerivedStaleIds.join('|'))
        throw new Error('staleDocumentIds must match the STALE rows exactly; fail closed');
      const reDerivedAffected = reDerived
        .filter((a) => a.verdict === 'STALE')
        .flatMap((a) => vm.display.entries
          .filter((e) => { const m = e.objective.match(DOC_REF_RE); return m !== null && m[1] === a.documentId; })
          .map((e) => e.storyId));
      if (!Array.isArray(p.affectedStoryIds) || (p.affectedStoryIds as unknown[]).join('|') !== reDerivedAffected.join('|'))
        throw new Error('affectedStoryIds must match the re-derived affected stories exactly; fail closed');
      const reDerivedUnchecked = reDerived.filter((a) => a.verdict !== 'STALE' && a.verdict !== 'CURRENT').length;
      if (typeof p.uncheckedCount !== 'number' || !Number.isSafeInteger(p.uncheckedCount) || p.uncheckedCount !== reDerivedUnchecked)
        throw new Error('uncheckedCount must equal the number of non-current non-stale rows; fail closed');
      const reDerivedVerdict: SourceStalenessVerdict = stale.length > 0
        ? 'STALE_SOURCES_PRESENT'
        : reDerived.every((a) => a.verdict === 'CURRENT')
          ? 'ALL_CURRENT'
          : 'UNCHECKED_SOURCES_PRESENT';
      if (p.verdict !== reDerivedVerdict)
        throw new Error('the verdict does not match the re-derived verdict; fail closed');
      if (typeof p.tenantId !== 'string' || p.tenantId !== vm.display.tenantId)
        throw new Error('the card tenantId must match the memory packet tenant; fail closed');
      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned (modelCalls 0, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (typeof p.stoppedBefore !== 'string' || !p.stoppedBefore.includes('the operator decides'))
        throw new Error('stoppedBefore must disclose that the operator decides; fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');
      const headline = reDerivedVerdict === 'STALE_SOURCES_PRESENT'
        ? `Staleness check FAILED — ${stale.length} source(s) changed after their facts were read; ${reDerivedAffected.length} reviewed fact(s) cite moved evidence`
        : reDerivedVerdict === 'ALL_CURRENT'
          ? `Staleness check PASSED — all ${recorded.size} carried source(s) still hash to the digest their facts were read as`
          : `Staleness check INCOMPLETE — carried sources remain UNCHECKED; undisclosed staleness is not currency`;
      return Object.freeze({
        kind: 'VERIFIED_SOURCE_STALENESS_CARD' as const,
        policyVersion: SOURCE_STALENESS_CARD_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline,
          tenantId: String(p.tenantId),
          assessed: Object.freeze(assessed),
          staleCount: stale.length,
          staleDocumentIds: Object.freeze(staleIds as string[]),
          uncheckedCount: reDerivedUnchecked,
          affectedStoryIds: Object.freeze(reDerivedAffected),
          verdict: reDerivedVerdict,
          stoppedBefore: p.stoppedBefore,
          operatorNote: `Re-verified against source-staleness-card policy ${SOURCE_STALENESS_CARD_POLICY.policyVersion}: the memory packet was RE-VERIFIED through the REAL gate, the recorded digest heads were RE-PARSED from the verified objectives (the same record the 12D-287 continuation gate binds re-submissions to), and every row plus the verdict were RE-DERIVED — nothing is trusted. Stale evidence is disclosed BY storyId: those facts stay in the packet (the card never mutates memory) but they cite evidence that moved — stale evidence requires re-work even if omitted (the OpenWiki Grounded-Claims discipline). UNCHECKED means nobody re-fetched that source yet. Nothing is fetched, nothing is persisted (modelCalls 0, remoteCalls 0); no weights moved (learningPromoted false); humanDecision REQUIRED.`,
        }),
      });
    }
    if (p.status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS);
      if (p.kind !== 'SOURCE_STALENESS_CARD')
        throw new Error('a REFUSED packet must carry kind SOURCE_STALENESS_CARD; fail closed');
      if (p.policyVersion !== SOURCE_STALENESS_CARD_POLICY.policyVersion)
        throw new Error(`a REFUSED packet must carry policyVersion ${SOURCE_STALENESS_CARD_POLICY.policyVersion}; fail closed`);
      if (typeof p.reason !== 'string' || p.reason.length < 1)
        throw new Error('a REFUSED packet must carry a bounded reason; fail closed');
      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned (modelCalls 0, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: SOURCE_STALENESS_CARD_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'NO card was rendered: the packet could not be verified, and nothing from it is displayed.',
          operatorNote: 'Paste the REAL 12D-305 memory packet plus re-fetched lowercase-hex64 digests; both are re-verified before anything renders.',
        }),
      });
    }
    throw new Error('a staleness card packet must carry status VERIFIED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: SOURCE_STALENESS_CARD_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'NO card was rendered: the packet could not be verified.',
        operatorNote: 'Only an intact card renders. Tampered cards render nothing.',
      }),
    });
  }
}