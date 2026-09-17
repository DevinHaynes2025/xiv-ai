# 12D-309 — Directive-#4 Memory Sources Read Through the Supervised Cycle

**Story rung:** 12D-309 · **Policy:** the REAL `12d-283-v1` cycle (no new
policy — this rung is the operator loop over committed doors) ·
**Parents:** 12D-284 (cycle CLI) / 12D-302 (directive-#4 registration)

## What this rung is

The remaining three directive-#4 agent-memory sources — registered in
12D-302, unread until now — **read through the REAL 12D-283 supervised
cycle, end to end, one chunk per invocation**:

- **mem0ai/mem0** (Apache-2.0) — document `mem0-readme-12d-309`,
  digest sha256 `637ae9f0148a9377…`, **6 chunks / 6 cycle invocations**,
  all 6 settled AWAITING_REVIEW (`remainingReady 0`).
- **topoteretes/cognee** (Apache-2.0) — document
  `cognee-readme-12d-309`, **8 chunks / 8 cycle invocations**, all 8
  AWAITING_REVIEW (`remainingReady 0`).
- **nhadaututtheky/neural-memory** (MIT) — document
  `neural-memory-readme-12d-309`, **7 chunks / 7 cycle invocations**,
  all 7 AWAITING_REVIEW (`remainingReady 0`).

**Total measured this rung: 21 cycle invocations = 21 model calls**,
every one the loopback first reader pinned to `127.0.0.1:11434` /
`qwen2.5-coder:7b` — **remoteCalls 0** (loopback is not remote), every
draft sha256 recorded in the queue, every cycle STOPPED before review.

## The doors used (all committed, none re-implemented)

The operator door is the 12D-284 CLI
(`xiv-supervised-reading-cycle.cli.ts`): exact 8-flag args; the body is
the public README fetched to a LOCAL scratch file
(`.xiv-runtime/body-*.md`, never committed); the register and queue are
the operator's LOCAL live files. Each invocation runs the REAL chain —
12D-274 ingest → 12D-277/278 bound admission to the ALREADY-REGISTERED
source → the queue's head → the REAL 12D-280 first reader → STOP before
review. Nothing downstream of the draft ran.

## Measured fail-closed events (the discipline working)

- **Queue-head gate refusal (by design):** the first cognee invocation
  was REFUSED — `the queue's head is story doc-mem0-readme-12d-309-chunk-2;
  the reader reads what the queue offers next and never jumps the
  queue` — modelCalls 0. One document stream at a time is the DESIGNED
  behavior; the loop therefore read mem0 to completion before starting
  cognee. The refused invocation HAD already admitted cognee's chunks
  (admission precedes the head read), so every later cognee invocation
  reports `duplicates: 8, inserted: 0` and continues under the REAL
  12D-287 continuation gate — the re-submitted bytes re-derived the
  SAME document digest; changed bytes would have refused.
- No credential-shaped content in any submission (the REAL ingest gate
  screened every chunk); no retry loops; every refusal printed verbatim
  with exit code 2.

## Reading notes (the operator's honest mapping — reference only, built from, never copied)

- **mem0** — a memory layer for AI agents. Their retrieval-then-compose
  pattern (search top_k → inject into the system prompt → generate) is
  the same shape as our 12D-307/308 memory seam
  (`composeMemoryBlock` → composed prompt); their April-2026 ADD-only
  accumulation (no UPDATE/DELETE — memories accumulate) corresponds to
  our append-only human-reviewed DONE facts (never overwritten). Their
  own README discloses that headline benchmark numbers come from the
  managed platform, not the OSS SDK — the same honest
  measured-vs-vision split we pin. NOT adopted: their write path
  (`memory.add` from conversations) is learning-shaped; in XIV AI OS
  memory entries exist only as human-reviewed DONE stories and
  `learningPromoted` stays false.
- **cognee** — a knowledge-graph memory platform
  (`remember`/`recall`/`improve`/`forget`, entities + relationships,
  session distillation). Their "session distillation curates ACCEPTED
  lessons into permanent memory" matches our review-before-memory
  discipline: nothing becomes durable memory without the human gate.
  Their local-Ollama support confirms our pinned-local posture is a
  workable production pattern. NOT adopted: no code copied; our
  provenance chain stays the digest-linked register/queue.
- **neural-memory** — a no-vector-database graph with 24 explicit
  relationship types (CAUSED_BY, LEADS_TO, RESOLVED_BY, CONTRADICTS),
  spreading-activation recall, decay/reinforcement/consolidation
  lifecycle, compression tiers, Merkle-delta sync, fully offline (no
  LLM or embedding required to recall). Their CONTRADICTS relationships
  resonate with our adversarial doc-council reviews; their "we never
  store your data — you deploy the sync hub" matches our
  collectsNothing/local-first posture; their brain-health score is the
  honest self-audit analogue of our alignment-invariant audit. Their
  auto-detected memory writes from agent activity are again
  learning-shaped — in XIV AI OS that path stays CEO-gated.

## Honest scope (what this is NOT)

- NOT adoption of any of the three: reading references only — built
  from, never copied; no license-restricted code entered the tree.
- NOT learning: drafts are text; `learningPromoted false`, weights
  CEO-gated; nothing in the queue mutates a model.
- NOT activation, NOT a write path beyond the queue's own reading
  stories: `activated 0` everywhere, `collectsNothing true`.
- Review decisions on the 21 settled drafts are **the CEO's** — never
  self-reviewed; the drafts stay AWAITING_REVIEW until Devin decides.

## Verification (measured, local)

- 21/21 cycle packets verified (`kind SUPERVISED_READING_CYCLE`,
  `humanDecision REQUIRED`, `remoteCalls 0`), captured verbatim in
  `.xiv-runtime/cycle-{mem0,cognee,neural-memory}-12d-309-c*.json`
  (scratch, never committed).
- Queue truth read back: this live queue now holds **21
  AWAITING_REVIEW + 15 DONE** product stories; every chunk of all three
  documents is AWAITING_REVIEW; `remainingReady 0` for all three.
- No code changed this rung — the committed tree is exactly the 12D-308
  tree (chain regression 1322/1322 across 235 files, Python 37/37, and
  shell build exit 0 all measured there and still current).

## Flags (pinned, honest)

humanDecision REQUIRED · learningPromoted false · activated 0 ·
modelCalls 21 counted this rung (the 12D-280 CEO approval covers the
loopback first reader) · remoteCalls 0 · collectsNothing true ·
automaticRecovery false · billionUsersProven false · CI not claimed
(ci_quota_exceeded) — local verification is the measured evidence.

## Next candidates

- Review decisions on 21 settled drafts (mem0 ×6, cognee ×8,
  neural-memory ×7) — the CEO's; on approval they flow the existing
  chain (12D-269 → 12D-264) and become memory-eligible.
- Memory surfaced in the assistant turn as citable provenance (entry
  storyIds in the draft) — design rung.
- Directive-#4 sources still unread: OpenViking (AGPLv3 — reference
  only), Memary, openhuman, open-brain, openwiki.