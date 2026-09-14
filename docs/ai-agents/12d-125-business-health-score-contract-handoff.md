# 12D-125 — Governed Business Health Score contract (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Follows the master
plan's Business Health section and completes the "DIAGNOSE" rung behind the Story
Engine (12D-124): Health + Story Engine, with the plan's two governing rules enforced
in code.

## What it is

`business-health-score-contract.ts` is the GOVERNANCE ENVELOPE for a Business Health
score. The master plan's rules, verbatim, and where each is enforced:

- "Scores should never be arbitrary; each score must trace back to measurable
  factors" → the overall score is NEVER caller-supplied (there is no such input to
  `composeGovernedHealthScore`); it is DERIVED as an exact weighted points sum
  (integer percents summing to exactly 100), every factor carries a REQUIRED declared
  `basis` (the measurable evidence behind the number), and
  `assertHealthScoreInvariants` re-derives the points, the attention classification,
  and the scoreId — a forged score, doctored factor, or foreign scoreId fails closed.
- "The Story Engine explains the score in plain language" → plain-language
  explanations enter ONLY as 12D-124 `GOVERNED_STORY` id references (64-hex, bound to
  declared factors); this runtime stores references, never narratives, and makes no
  model call.
- "Health can be organized by finance, operations, customers, people, technology and
  supply chain" → the six domains are policy; a factor outside them fails closed.
- "What needs attention" → attention items are classified by POLICY thresholds
  (`needsAttentionAtOrBelow: 50`, `watchAtOrBelow: 75`), worst-first in deterministic
  order, and the classification is re-derived by the invariant check — no inference,
  no opinions, no model.

The score identity (`deriveScoreId`) binds EVERY declared input AND the derived
points — the 12D-124 review lesson applied at construction: the same numeric score
with a different declared basis or declarer is a DIFFERENT score, verified by
single-variable isolation tests.

`recordScoreReview` records the HUMAN review of the score — receipt-gated (64-hex
sha256 operator receipt), chronologically ordered (a review predating the earliest
declared factor fails closed), and requirement-shaped: `requiresDecisionSafetyWorkflow
BeforeAnyAction: true` — the master plan's TREAT rung ("human-approved actions") MUST
pass a 12D-121 decision-safety workflow first, in a system outside this runtime. The
record authorizes NOTHING and executes NOTHING.

## Honest state

Every score carries `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
`modelCalls: 0`, `remoteCalls: 0`, `scoresFromLiveData: 0` (structural — no live
metric is connected), `automaticRecovery: false`, `billionUsersProven: false`.
Guardrails: `scoresAreDerivedNeverArbitrary`, `everyFactorCarriesDeclaredBasis`,
`explanationsAreStoryReferences`, `attentionIsClassifiedByPolicy`, `executesNothing`.
Zero network calls (pure module) — 12D-113's authorized-surface audit applies.

## What this does NOT claim

No business score here comes from live data — every factor is a DECLARED number with
a DECLARED basis. The overall score is derived arithmetic over those declarations, not
a measurement of any real business. No narrative was generated; story references
point at 12D-124 stories that carry their own honesty flags. `billionUsersProven:
false`. No score review authorizes any action.

## Verification

6/6 tests (`test:12d-125`): frozen honest policy/guardrails; derived-exact overall
score (42×20 + 71×40 + 88×40 = 7200 points → 72.0, asserted arithmetically) with
policy-threshold attention classification in deterministic worst-first order and
tie-breaking by factorId; scoreId single-variable isolation (changed score, basis,
weights-sum-kept-at-100, story refs, declarer each change the id); fail-closed
inputs (out-of-scale scores, zero/negative/fractional weights, weight sums ≠ 100,
missing/blank bases, unknown domains, duplicate factor ids, invalid
declarers/timestamps, empty factors, unknown/non-hex/duplicate story references);
tamper-evident invariants (forged points, forged derived number, doctored factor,
re-classified attention items, non-hex and foreign scoreIds, claims of live data or
promoted learning, gutted governance flags, fabricated guardrails, weight-sum tamper,
unfrozen packet, caller-side pop on frozen arrays); receipt-gated reviews (malformed
receipts, unknown decisions, invalid reviewer, backfilled review timestamps,
accepted + declined records' governance shape, review against a tampered score fails
closed first). `typecheck:12d-125` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

The contract authorizes nothing and executes nothing. A reviewed score is a decision
record requiring a 12D-121 workflow before any action — never an instruction. The
master plan's TREAT and MONITOR rungs (measuring whether interventions improved
factors) are future work requiring their own review; until a measured evidence
contract exists, no outcome is recorded and no learning is promoted.

## Adversarial review (paydown record)

Adversarial review ran on the built module (2 lenses — semantics/security and
governance/honesty — then adversarial verification with live `tsx` reproduction of
every finding). 6 findings CONFIRMED, 0 refuted, all live-reproduced before any fix
was written. Paydown, all with regression tests, all green before commit:

1. **BLOCKING — undeclared fields escape the scoreId digest (2 findings, one defect).**
   Extra properties on factors or story references shipped in the frozen packet but
   never entered `deriveScoreId`'s preimage: two materially different packets composed
   to ONE scoreId (a factor carrying `scoreFromLiveDatabase: 'prod-primary'` composed
   to the identical id as the honest factor — a live-data smuggling channel under the
   `scoresFromLiveData: 0` flag). Fixed THREE ways: `hasExactKeys` shape gate FIRST in
   `assertFactor` (`/health factor carries undeclared fields/`) and on story
   references; packet projection to the declared key literals only (no spreads); the
   digest now re-derives over the declared-key content, so no undeclared field can
   exist in a valid packet at all. Tests: smuggled `scoreFromLiveDatabase` factor,
   smuggled narrative field on a story reference, destructured-missing-key factor —
   all throw; the same smuggled fields added on invariant re-check also fail the
   shape gate (`/factor carries undeclared fields/`,
   `/story reference carries undeclared fields/`).
2. **Attention re-derivation was stringly-typed.** The invariant check compared
   attention items via template strings, ignoring `domain` and coercing types (a
   string `'42'` score or a swapped domain could pass). Replaced with a structural
   JSON compare of the full expected shape (`factorId`, `domain`, `score`, `status`)
   re-derived from the factors under the policy thresholds, worst-first with
   factorId tie-break. Test: domain swap on `factor.cash-flow` (FINANCE →
   SUPPLY_CHAIN) now fails closed.
3. **`maxStoriesPerFactor` enforced only in aggregate.** With the cap at 1, two story
   references on DIFFERENT factors passed while two on the SAME factor slipped the
   aggregate count. A per-factor count map now enforces the cap individually in BOTH
   `composeGovernedHealthScore` and `assertHealthScoreInvariants`. Tests: multi-story
   per-factor overage throws at compose and at invariants.
4. **Frozen shell over unfrozen sub-arrays passed.** A hand-built score with a frozen
   top level but unfrozen `factors`/`attentionItems`/`stories` arrays (or frozen
   arrays over unfrozen elements) passed the old top-level freeze check and
   `recordScoreReview` issued a receipt-backed record on it. Added a sub-structure
   freeze gate on the arrays AND their object elements. Tests: unfrozen array,
   frozen-array-unfrozen-element — both throw.

Same defect family found and fixed in the 12D-124 SIBLING (`story-engine-contract.ts`):
the signal's exact declared shape is now gated (`hasExactKeys` first, packet projected
to declared keys — undeclared signal fields escaped the storyId digest there too), and
`assertStoryInvariants` now freeze-checks `story.signal`/`story.context`/
`story.treatments` and their object elements. 12D-124 regression tests added and the
full 5/5 suite re-run green. One live-reproduced correction during that paydown: the
first sub-freeze gate version also rejected the legitimate primitive-element case
(`story.context` is a `string[]`), which made `composeGovernedStory` itself throw —
the gate now requires freezing of object ELEMENTS only (primitives are immutable).

Residual: none known. Reviewer receipts: CLAUDE_CODE (this session, lenses +
verification). GROK_XAI PENDING — never fabricated.