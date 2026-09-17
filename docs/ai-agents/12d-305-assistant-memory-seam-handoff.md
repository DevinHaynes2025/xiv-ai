# 12D-305 — Assistant Agent-Memory Seam (the "mini brain" semantic memory, read door)

**Status:** DONE — verified, measured live, committed.
**Lineage:** CEO directive 2026-09-17 #4 ("each of xiv ai agentic agents will
have the on mini brain built inside") — its first honest local rung. The
cerememory reading's mapping (semantic memory = DONE chunks + reviewed facts)
becomes a real fail-closed contract. The vision (mini clouds, trillions of
brains, atomic level) stays VISION — this rung builds the local READ door
only.
**Policy:** `12d-305-v1`, domain `XIV_OS_ASSISTANT_MEMORY_SEAM`.

## What was built

**`services/ai/runtime/offline-team/xiv-assistant-memory.ts`** — the pure
(read-only) memory contract (`prepareAssistantMemoryRead(queue, {tenantId})`):

- **READ-ONLY queue walk**: the trusted queue's own bounded `page` door is the
  ONLY queue method invoked — a spy test proves no write door (enqueue /
  claimNext / settle / acceptReview / applyReviewDecision / voidLease /
  recoverFailedStory / returnUnstarted / renewLease / close) is ever touched.
- **SEMANTIC memory only**: entries are DONE stories exclusively — a fact
  enters the mini brain only through independent human review. READY / LEASED
  / AWAITING_REVIEW / FAILED rows are scanned but never carried.
- **TENANT-BOUND**: only the requested tenant's rows are walked.
- **BOUNDED, disclosed**: at most 6 entries carried (the most recent reviewed
  facts within the window, `entriesTruncated` when the cap bites), each
  objective truncated to 2,000 chars with `objectiveTruncated` disclosed, at
  most 500 rows scanned with `scannedTruncated` disclosed.
- **SECRET-SCREENED**: `SECRET_CONTENT_RE` runs over every DONE objective — a
  secret-shaped memory refuses the WHOLE read (defense in depth over the
  ingest screen; the door never trusts it).
- `memoryDigest` = sha256 over the canonical entries, re-derivable via the
  exported `deriveAssistantMemoryDigest` (the caller re-derives before
  trusting — the 12D-301 discipline).
- Stateless: re-derived on every read, held by the caller, persisted nowhere.
  No clock, no randomness — deterministic byte-identical reads.

## What this door is NOT (disclosed scope)

- **Not a prompt seam yet** — nothing composes into a model call
  (`modelCalls 0`); the 12D-302 conversation seam is unchanged. Feeding the
  memory into a turn is a later rung with its own derived ceiling.
- **Not learning** — no weights move, nothing is activated
  (`learningPromoted false`, `activated 0` — CEO-gated, always).
- **Not a write path** — read-only by contract.

## Measured live (real queue, real DONE facts)

The REAL live reading queue (`reading-queue-cycle-live-2026-09-16.sqlite`,
tenant `xiv-os`) walked: **15 DONE facts** found (HDX chunks 1/2, AGO census
chunk-1, rakazo chunks 1/2, cerememory chunk-1, …), the **6 most recent
carried** (`entriesTruncated true`, disclosed), digest **re-derived and
matched**, the cerememory objective truncation disclosed
(`objectiveTruncated true`, exactly 2,000 chars). modelCalls 0, remoteCalls 0,
learningPromoted false, humanDecision REQUIRED. Scratch:
`.xiv-runtime/run-live-memory-12d-305.ts` (untracked, never committed).

## Verification

- `npm run test:12d-305` — **12/12 pass**: reviewed-only memory; unreviewed
  states excluded; tenant-bound both directions; entry cap bites disclosed
  (most-recent carried); objective truncation disclosed; scan bound disclosed
  (505-row fixture); secret-shaped DONE objective refuses the whole read;
  spy-proven read-only walk; malformed requests/junk queues/reordered keys
  refuse; deterministic byte-identical reads; frozen packets and guardrails;
  source purity.
- `npm run typecheck:12d-305` — exit 0. Shell build — exit 0 (no shell change
  this rung; the memory panel is the next rung).
- Full chain regression — see commit message. Python backend — 37/37.
- GitLab CI NOT claimed passed (org quota `ci_quota_exceeded`); local
  verification is the measured evidence.

## Suite-caught paydowns this rung

- Test-fixture defect: the held singleton lease blocked a second claim in the
  unreviewed-states fixture — fixed with the REAL `returnUnstarted` door.
- Spy-queue approach rewritten: a Proxy over the queue breaks the private
  `#db` brand — own-property method wrappers (delegating to the prototype)
  record touched doors instead.
- A malformed draft of the module (var-after-use in objective extraction) was
  caught by the suite and rewritten before commit.

## Next candidates

- 12D-306: assistant memory shell surface (memory panel — paste-free view;
  the shell never holds a queue, so the packet is carried runtime-side) and/
  or the prompt seam: feed the bounded memory block into a composed turn with
  a DERIVED prompt ceiling (the 12D-302 derivation pattern).
- Read mem0 / cognee / neural-memory through the cycle (registered, unread).
- Approval/ledger doors stay CEO-gated downstream — nothing activates without
  the human decision.