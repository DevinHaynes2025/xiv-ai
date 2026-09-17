# 12D-313 — Remaining Directive-#4 Sources Read Through the Supervised Cycle

**Story rung:** 12D-313 · **Policy:** the REAL `12d-283-v1` cycle (no new
policy — this rung is the operator loop over committed doors) ·
**Parents:** 12D-284 (cycle CLI) / 12D-302 (directive-#4 registration) /
12D-309 (first reading rung)

## What this rung is

The LAST five directive-#4 agent-memory sources — registered in 12D-302,
unread until now — **read through the REAL 12D-283 supervised cycle, end
to end, one chunk per invocation**. With this rung, all ten directive-#4
sources have been read:

- **volcengine/OpenViking** (AGPLv3 mixed, crates/examples Apache-2.0 —
  REFERENCE ONLY, no AGPL code copied) — document `openviking-readme-12d-313`,
  **11 chunks / 11 cycle invocations**, all settled AWAITING_REVIEW.
- **kingjulio8238/Memary** (MIT) — document `memary-readme-12d-313`,
  **10 chunks / 10 cycles**, all AWAITING_REVIEW.
- **tinyhumansai/OpenHuman** (GPL-3.0 — REFERENCE ONLY, no GPL code
  copied) — document `openhuman-readme-12d-313`, **10 chunks / 10 cycles**,
  all AWAITING_REVIEW.
- **benclawbot/open-brain** (MIT) — document `open-brain-readme-12d-313`,
  **10 chunks / 10 cycles**, all AWAITING_REVIEW.
- **langchain-ai/OpenWiki** (MIT) — document `openwiki-readme-12d-313`,
  **21 chunks / 21 cycles**, all AWAITING_REVIEW.

**Total measured this rung: 62 cycle invocations = 62 model calls**, every
one the loopback first reader pinned to `127.0.0.1:11434` /
`qwen2.5-coder:7b` — **remoteCalls 0** (loopback is not remote), every
draft sha256 recorded in the queue, every cycle STOPPED before review.

## Measured fail-closed events (the discipline working)

- **The 2200-char paragraph gate refused the first OpenViking submission**
  (modelCalls 0): "a paragraph exceeds 2200 chars; re-chunk the source
  deliberately — silent truncation is refused; fail closed." The
  deliberate re-chunk was applied as the gate demands: paragraph breaks
  inserted at sentence boundaries (then word boundaries for HTML-dense
  blocks with no punctuation), content preserved — NO truncation
  (verified: every resulting paragraph ≤ 2000 chars, byte count
  unchanged). The same disclosed re-chunk was applied uniformly to all
  five bodies before submission.
- **The `main`-branch fetch of open-brain's README 404'd** (14 bytes) —
  the fetch went to `master` (the repo's actual default branch) and
  succeeded; the re-submitted bytes are what the 12D-287 digest binds.
- No queue-head refusals this rung: the sources were read strictly one
  document stream at a time in sequence, so the head always offered the
  current document's next chunk. No credential-shaped content in any
  submission (the REAL ingest gate screened every chunk); no retry loops.

## Reading notes (the operator's honest mapping — reference only, built from, never copied)

- **OpenViking** — a self-evolving context database for agents: context
  organized as a virtual filesystem under `viking://`, browsed with
  `ls`/`tree`/`read`/`write`, directory summaries for on-demand loading.
  Their file-metaphor memory is a useful reference shape for our OWN
  bounded reads; what we do NOT adopt: self-evolution (memory that
  rewrites itself) — in XIV AI OS memory facts change only through
  human review, and their commercial-edition split is an honest reminder
  that the OSS core and the paid platform are different things.
- **Memary** — a memory layer for autonomous agents (knowledge graph +
  memory stream). Their "auto-generated memory" principle (agent memory
  updates automatically as the agent interacts) is precisely the
  learning-shaped path XIV AI OS refuses: our memory entries exist ONLY
  as human-reviewed DONE stories, `learningPromoted` stays false. Their
  multi-graph per-user separation is a real pattern that matches our
  tenant-bound queues.
- **OpenHuman** — an agent harness with a "brain" (Memory Tree + Obsidian
  wiki: "your data compressed into scored Markdown trees in SQLite on
  your machine… No vector-soup black box") and TokenJuice token
  compression. Their local-SQLite human-readable memory posture matches
  our own local-first, disclosed-bounds discipline; their auto-fetch
  every 20 minutes is an ingestion cadence we would have to gate behind
  an explicit operator decision, not a default. GPL-3.0: reference only.
- **open-brain** — provenance-aware semantic memory for coding agents
  (PostgreSQL + pgvector). Their governance table is the closest mirror
  of our own discipline read so far: "contradiction reconciliation,
  memory compaction, bounded maintenance, proposal generation, HUMAN
  REVIEW, reversible consolidation, lifecycle transitions, conservative
  pruning, and immutable automation receipts" — proposals become memory
  only through human review, and receipts are immutable. Our difference:
  their proposal generation is automatic; in XIV AI OS every candidate
  memory fact already carries an independent review chain before it
  exists at all.
- **OpenWiki** — a self-maintaining code wiki with "Grounded Claims":
  it tracks the material propositions behind factual pages, each pointing
  to exact repository evidence (`repo://src/server.ts#L40-L82`) with the
  evidence version observed when the claim was established, and refuses
  to update on stale evidence. This is the SAME trust shape as our
  digest-bound chain (evidence version + content digest + refusal on
  staleness). Their "stale or unresolved Claim requires work even if the
  planner omits it" is a fail-closed pattern worth referencing for our
  own document-reingest discipline.

## Honest scope (what this is NOT)

- NOT adoption of any of the five: reading references only — built from,
  never copied; no AGPL/GPL code entered the tree (both sources were
  registered reference-only in 12D-302 and remain so).
- NOT learning: drafts are text; `learningPromoted false`, weights
  CEO-gated; nothing in the queue mutates a model.
- NOT activation, NOT a write path beyond the queue's own reading
  stories: `activated 0` everywhere, `collectsNothing true`.
- Review decisions on the 83 settled drafts (21 from 12D-309 + 62 from
  this rung) are **the CEO's** — never self-reviewed; the drafts stay
  AWAITING_REVIEW until Devin decides.

## Verification (measured, local)

- 62/62 cycle packets verified programmatically: every one
  `kind SUPERVISED_READING_CYCLE`, `humanDecision REQUIRED`,
  `remoteCalls 0`, `modelCalls 1`, `learningPromoted false`,
  `activated 0`, loopback `127.0.0.1:11434`, model `qwen2.5-coder:7b`.
  Packets captured verbatim in
  `.xiv-runtime/cycle-{openviking,memary,openhuman,open-brain,openwiki}-12d-313-c*.json`
  (scratch, never committed).
- Queue truth read back: this live queue now holds **15 DONE + 83
  AWAITING_REVIEW**; every chunk of all five documents is
  AWAITING_REVIEW with 0 READY/LEASED/FAILED (remainingReady 0 each).
- No code changed this rung — the committed tree is exactly the 12D-312
  tree (`git diff HEAD` empty; the 12D-312 evidence — 1376/1376 across
  239 files, shell build exit 0 — carries over unchanged).

## Next candidates

1. **CEO review decisions on the 83 settled drafts** — now spanning all
   ten directive-#4 sources; once Devin decides, the memory block carries
   the reviewed facts of the full directive-#4 reading corpus.
2. A citation-assist rung: surface the exact carried storyIds next to the
   composer so the operator can verify a draft's citations by eye
   (12D-312 handoff candidate).
3. The stale-evidence fail-closed pattern from OpenWiki's Grounded
   Claims as a design reference for document re-ingestion rungs.