// 12D-314 — Citation Verify Card: an OPERATOR VERIFICATION surface, not
// a model surface. The operator pastes ANY draft text (e.g. a draft from
// the 12D-310/311 cited doors) plus the REAL 12D-305 memory packet, and
// this door — with modelCalls 0, no caller, nothing persisted —
//   * re-verifies the packet through the REAL 12D-306 gate;
//   * extracts the draft's [mem:<storyId>] citations through the REAL
//     12D-310 extractor (strict id shape, distinct, in order);
//   * checks every citation against the VERIFIED carried set and
//     reports the verdict honestly:
//       ALL_CITATIONS_VERIFIED  — every cited id is a carried fact id;
//       UNGROUNDED_NO_CITATIONS — zero citations, disclosed, not hidden;
//       FABRICATED_CITATIONS    — cited ids outside the carried set,
//                                 disclosed BY ID so the operator can
//                                 see exactly which claims are
//                                 ungrounded (the ids are operator-draft
//                                 text, never model output, and the
//                                 extractor only yields id-shaped
//                                 strings — no secret can ride in).
// Fail closed end to end: exact keys in order, bounded strings, secret
// screening on the draft, digest re-derivable from the draft, honest
// flags pinned, no write path, no weight mutation, nothing activated.
// This card NEVER judges the draft's prose — only its citations; the
// operator decides what (if anything) the draft is worth.
//
// Honest scope (disclosed): verification-only rung — modelCalls 0,
// no shell surface yet in this module (the shell surface is the paired
// rung), pure derivation over the REAL gates.
import { MAX_ASSISTANT_REPLY_CHARS } from './xiv-assistant-turn';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { extractCitedStoryIds } from './xiv-assistant-memory-cited-turn';
import { SECRET_CONTENT_RE } from './xiv-document-ingest';
import { createHash } from 'node:crypto';

export const CITATION_VERIFY_CARD_POLICY = Object.freeze({
  policyVersion: '12d-314-v1',
  domain: 'XIV_OS_CITATION_VERIFY_CARD',
});

export const CITATION_VERIFY_CARD_GUARDRAILS = Object.freeze({
  theRealMemoryGate: true, // the packet goes through the REAL 12D-306 view-model gate
  theRealCitationExtractor: true, // citations come from the REAL 12D-310 extractor
  verificationOnly: true, // no model call, no caller, nothing drafted here
  fabricatedCitationsDisclosedById: true, // the operator verifies by eye
  zeroCitationsDisclosedNotHidden: true,
  proseNeverJudged: true, // only citations are checked — the operator judges the words
  tenantSelfDescribing: true, // the verdict is bound to the packet's own tenant
  boundedDraftOnly: true,
  secretScreened: true,
  pureModule: true,
  modelCalls: 0,
  remoteCalls: 0,
  activated: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const INPUT_KEYS = ['draft', 'memoryPacket'] as const;

/**
 * The verdict is DERIVED, never guessed: it is a pure function of the
 * re-extracted citations against the verified carried set.
 */
export type CitationVerdict =
  | 'ALL_CITATIONS_VERIFIED'
  | 'UNGROUNDED_NO_CITATIONS'
  | 'FABRICATED_CITATIONS';

export type CitationVerifyCardPacket = Readonly<
  | {
      status: 'VERIFIED';
      kind: 'CITATION_VERIFY_CARD';
      policyVersion: string;
      draft: string;
      draftSha256: string;
      draftChars: number;
      tenantId: string;
      carriedCount: number;
      carriedStoryIds: readonly string[];
      citedCount: number;
      citedStoryIds: readonly string[];
      fabricatedCount: number;
      fabricatedStoryIds: readonly string[];
      verdict: CitationVerdict;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      stoppedBefore: string;
      humanDecision: 'REQUIRED';
    }
  | {
      status: 'REFUSED';
      kind: 'CITATION_VERIFY_CARD';
      policyVersion: string;
      reason: string;
      modelCalls: 0;
      remoteCalls: 0;
      activated: 0;
      learningPromoted: false;
      humanDecision: 'REQUIRED';
    }
>;

function refuse(reason: string): CitationVerifyCardPacket {
  return Object.freeze({
    status: 'REFUSED' as const,
    kind: 'CITATION_VERIFY_CARD' as const,
    policyVersion: CITATION_VERIFY_CARD_POLICY.policyVersion,
    reason,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

export interface CitationVerifyCardPrepared {
  readonly status: 'PREPARED';
  readonly draft: string;
  readonly draftSha256: string;
  readonly draftChars: number;
  readonly tenantId: string;
  readonly carriedStoryIds: readonly string[];
  readonly citedStoryIds: readonly string[];
  readonly fabricatedStoryIds: readonly string[];
  readonly verdict: CitationVerdict;
}

/**
 * Build ONE citation verify card. NEVER throws; any anomaly refuses
 * before anything renders (the card is derived, never trusted). The
 * memory packet is verified through the REAL 12D-306 gate — a refused
 * packet refuses the card and the refusal carries no memory content.
 */
export function prepareCitationVerifyCard(
  raw: unknown,
): CitationVerifyCardPrepared | CitationVerifyCardPacket {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      return refuse('the input must be an object; fail closed');
    const keys = Object.keys(raw as Record<string, unknown>);
    if (keys.length !== INPUT_KEYS.length || !INPUT_KEYS.every((k, i) => keys[i] === k))
      return refuse(`the input must have exactly the keys [${INPUT_KEYS.join(', ')}] in order; fail closed`);
    const p = raw as Readonly<Record<string, unknown>>;
    if (typeof p.draft !== 'string' || p.draft.length < 1 || p.draft.length > MAX_ASSISTANT_REPLY_CHARS)
      return refuse(`draft must be a bounded string (1..${MAX_ASSISTANT_REPLY_CHARS.toLocaleString('en-US')} chars); fail closed`);
    // SECRET SCREENING — the draft is screened before anything is derived from it.
    if (SECRET_CONTENT_RE.test(p.draft))
      return refuse('the draft is secret-shaped (credential/key pattern); secrets are never processed or echoed; fail closed');
    // THE MEMORY PACKET IS RE-VERIFIED through the REAL 12D-306 gate — never trusted.
    const vm = buildAssistantMemoryViewModel(p.memoryPacket);
    if (vm.kind === 'REFUSED')
      return refuse(`the memory packet failed verification (${vm.reason}); the card refuses; fail closed`);
    const carriedStoryIds = vm.display.entries.map((e) => e.storyId);
    // THE REAL 12D-310 EXTRACTOR — citations are extracted, never trusted.
    const citedStoryIds = extractCitedStoryIds(p.draft);
    const carried = new Set(carriedStoryIds);
    const fabricatedStoryIds = citedStoryIds.filter((id) => !carried.has(id));
    const verdict: CitationVerdict = citedStoryIds.length === 0
      ? 'UNGROUNDED_NO_CITATIONS'
      : fabricatedStoryIds.length > 0
        ? 'FABRICATED_CITATIONS'
        : 'ALL_CITATIONS_VERIFIED';
    return Object.freeze({
      status: 'PREPARED' as const,
      draft: p.draft,
      draftSha256: createHash('sha256').update(p.draft, 'utf8').digest('hex'),
      draftChars: p.draft.length,
      tenantId: vm.display.tenantId,
      carriedStoryIds,
      citedStoryIds,
      fabricatedStoryIds,
      verdict,
    });
  } catch (err) {
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

/**
 * Emit the FROZEN card packet from a prepared card (the exact shape the
 * view model re-verifies). Pure derivation — nothing here calls a model.
 */
export function buildCitationVerifyCardPacket(
  prepared: CitationVerifyCardPrepared,
): CitationVerifyCardPacket {
  if (prepared.status !== 'PREPARED')
    return refuse('the card packet is built only from a PREPARED card; fail closed');
  return Object.freeze({
    status: 'VERIFIED' as const,
    kind: 'CITATION_VERIFY_CARD' as const,
    policyVersion: CITATION_VERIFY_CARD_POLICY.policyVersion,
    draft: prepared.draft,
    draftSha256: prepared.draftSha256,
    draftChars: prepared.draftChars,
    tenantId: prepared.tenantId,
    carriedCount: prepared.carriedStoryIds.length,
    carriedStoryIds: Object.freeze([...prepared.carriedStoryIds]),
    citedCount: prepared.citedStoryIds.length,
    citedStoryIds: Object.freeze([...prepared.citedStoryIds]),
    fabricatedCount: prepared.fabricatedStoryIds.length,
    fabricatedStoryIds: Object.freeze([...prepared.fabricatedStoryIds]),
    verdict: prepared.verdict,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    activated: 0 as const,
    learningPromoted: false as const,
    stoppedBefore: 'verification only — no model ran, no draft was written, the operator decides',
    humanDecision: 'REQUIRED' as const,
  });
}