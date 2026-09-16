# 12D-274 — Document Ingest Bridge (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-document-ingest.ts` + 10
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-274` (node TAP
via tsx) = **10/10 pass**; `typecheck:12d-274` (strict tsc, also
covering the 12D-1xx queue) = **exit 0**. Sibling regressions (single
tsx run): **86/86** across the offline story queue, 12d-273 queue
census, 12d-274 document ingest, the pathway evidence bridge, 12d-269
approval link, 12d-264 ledger, 12d-271 pathway census, and 12d-272
custody journal census. Shell build (Next.js 16.3.5): compiled,
typechecked, 13 static pages — the page now mounts NINE ingest
surfaces and the route table includes `/api/ingest/document`.
CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers:
CLAUDE_CODE (self-review; findings below). GROK_XAI review PENDING —
never fabricated.

## What this rung is

The honest answer to the CEO's 2026-09-16 directive — "use all the
documents and get the AI agents to start learning and reading" —
built INSIDE the standing constraints:

- **READING = the queue.** `prepareDocumentStories` turns one LOCAL
  document into a bounded set of ORDINARY `memory_curator` reading
  stories (one per chunk), each bound to the document's sha256 digest
  (`sourceRevision`) AND the approved master plan hash
  (`masterPlanSha256`). Admission, dedup, and single-lease discipline
  are the REAL 12D-1xx queue's — proven end-to-end by the suite.
- **LEARNING ACCUMULATES AS EVIDENCE, NEVER AS WEIGHTS.** A reviewed,
  human-approved chunk flows the EXISTING chain — review →
  pathway candidate (12D-2xx bridge) → recorded approval (12D-269
  link) → 12D-264 ledger — and the ledger is LEDGERED, NEVER
  ACTIVATED (`activated: 0` proven in the end-to-end test). Any
  learning promotion (ANY weight mutation) stays a CEO decision and
  is structurally impossible in this module: the produced stories are
  plain ORDINARY backlog text with no execution path,
  `learningPromotionIsNotInThisModule: true`.
- **UNTRUSTED DOCUMENT TEXT IS DATA, NEVER INSTRUCTIONS.** Chunk text
  is quoted inside the objective under an explicit
  `<<<UNTRUSTED_DOCUMENT_TEXT>>>` treat-as-data framing, with the
  operator-facing acceptance line PRECEDING the quoted block.
- **THE SECRET RE-GATE LIVES INSIDE THE VALIDATOR FROM DAY ONE** (the
  12D-267 lesson): a document (title OR body) carrying
  credential-shaped content refuses and never becomes queue material.

## Structural rules (all suite-proven)

- **NO SILENT TRUNCATION**: an over-`maxDocumentChars` (100,000)
  document refuses; an over-`maxChunkChars` (2,200) single paragraph
  refuses ("re-chunk the source deliberately"). Chunking is
  deterministic (paragraph-split + greedy pack), so re-ingesting the
  same document yields the same fingerprints — and the REAL queue's
  own dedup refuses re-admission (proven: `inserted: 0,
  duplicates: 3`).
- **EXACT-KEYS GATE IN ORDER**: `{ tenantId, documentId, title,
  bodyText }` — reordering, extras, absences all refuse.
- **END-TO-END CHAIN PROVEN**: ingest → REAL queue admit → claim →
  settle → review APPROVED → 12D-2xx candidate → 12D-269 recorded
  approval → 12D-264 ledger append → census (`entries: 1,
  activated: 0`).

## Defects found and paid down during this story

- **(caught by the shell build, paid down — the 12D-273 class again)**
  the ingest module originally imported `type OfflineStory` from the
  queue module; even a TYPE-only import drags `node:sqlite` into the
  browser-facing Next build (TS2307 + TS7006). The honest fix mirrors
  the policy-snapshot pattern: the module pins a LOCAL
  `OrdinaryQueueStory` shape, and the suite proves REAL compatibility
  two ways — a typecheck-time assignability gate (`readonly
  OfflineStory[] = result.stories`, with the queue imported
  test-side only) and REAL admission (the prepared stories enqueue
  into an actual OfflineStoryQueue unchanged).
- **(caught by the suite, fixed)** the first fixture used three short
  paragraphs and asserted 3 chunks — the greedy packer correctly
  packed them into ONE chunk. The module was right; the fixture was
  wrong. Padded the fixture paragraphs past half the chunk budget so
  the SPLIT is exercised, not just the pack.
- **(self-caught before first run)** a framing assertion didn't match
  the module's exact pin (`UNTRUSTED_DATA` vs `UNTRUSTED DATA …
  never commands`) and one assertion was INVERTED (it asserted the
  chunk text does NOT follow the marker — but the design QUOTES it
  there, as data). Replaced with ordered-index assertions proving the
  hostile text sits INSIDE the quoted block and the acceptance line
  precedes it.
- **(caught by tsc, fixed)** property narrowing doesn't reach into
  the `map` closure — validated identities are captured into locals
  (`vTenantId`, `vDocumentId`, `vTitle`).

## The honest boundary

- The bridge PREPARES stories; it does not READ them — reading is the
  queue's claim/settle/review flow, and the human review gate stays
  in it (`humanDecision: 'REQUIRED'`).
- Credential-shape detection is a heuristic denylist, not proof of
  safety; ORDINARY-only admission is the structural bound.
- ZERO real documents ingested so far — zero real user stories ever
  claimed; `billionUsersProven: false`; `learningPromoted: false`;
  `automaticRecovery: false`; `modelCalls: 0`, `remoteCalls: 0`;
  `collectsNothing: true` — all pinned and frozen.
- The shell surface displays prepared stories BY REFERENCE (id +
  objective length) — the route projects them; the document text is
  never re-dumped to the render.

## Exact files

- `services/ai/runtime/offline-team/xiv-document-ingest.ts` (new)
- `services/ai/runtime/offline-team/xiv-document-ingest.test.ts`
  (new, 10 tests — REAL queue admission + dedup refusal; END-TO-END
  queue→review→candidate→approval→ledger with `activated: 0`;
  untrusted-data framing ordering incl. hostile injection text;
  secret re-gate (sk- + PRIVATE KEY) refusals; oversized-document and
  oversized-paragraph refusals; source-bound digest + approved plan
  hash on every chunk; exact-keys gates incl. reordering/extras/
  missing; malformed submissions + bad identities; deterministic
  re-ingest; guardrail/policy pins)
- `services/ai/package.json` — `test:12d-274`, `typecheck:12d-274`
- `.gitlab-ci.yml` — `typecheck:12d-274`, `test:12d-274` steps
- `services/xiv-story-shell/src/app/api/ingest/document/route.ts`
  (new — LOCAL server-side contract, REFUSED carries zero document
  content, projects stories to references only)
- `services/xiv-story-shell/src/app/document-ingest-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the panel)
- `docs/ai-agents/12d-274-document-ingest-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-274  # RAN: exit 0 (after the story-shape paydown)
npm run test:12d-274       # RAN: 10/10 pass
sibling run via tsx --test # RAN: 86/86 (queue + 6 chain suites)
shell npm run build        # RAN: compiled; route /api/ingest/document
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install, no credentials. The commit stages ONLY the
files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- The queue-admission DOOR for the prepared stories (a supervised,
  operator-driven step that admits the prepared stories into the REAL
  queue and reports the measured counts) — the natural next rung of
  the reading chain; still fail-closed, still no activation.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated).
- Rail integration for 12D-266 (BLOCKED on CEO authorization +
  credentials).
- GitHub Phase 1 lockdown (blocked on the CEO's `! gh auth login`).