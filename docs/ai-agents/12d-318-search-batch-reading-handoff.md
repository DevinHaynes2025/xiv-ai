# 12D-318 — The 2026-09-17 Search/Agentic-Search Reference Batch Read Through the Supervised Cycle

**Story rung:** 12D-318 · **Policy:** the REAL `12d-283-v1` cycle + `12d-276-v1`
register (no new policy — this rung is the operator loop over committed
doors, 12D-313 pattern) · **Parents:** 12D-317 (review slate cleared) /
12D-313 (directive-#4 reading pattern) / 12D-302 (source registration)

## What this rung is

The CEO's fourth reference-inbox drop (2026-09-17, search/agentic-search
batch) — registered and read through the REAL supervised reading cycle,
one chunk per invocation, landing on the clean review slate 12D-317
created. **Total measured: 35 cycle invocations = 35 model calls**, every
one the loopback first reader pinned to `127.0.0.1:11434` /
`qwen2.5-coder:7b` — **remoteCalls 0** (loopback is not remote), every
draft sha256 recorded in the queue, every cycle STOPPED before review.

**Registered (10 entries, idempotent re-runs verified — duplicates
refuse):** typesense-repo, manticoresearch-repo, edge-developer-docs,
edge-dumper-repo, microsoft-opensource-portal, mem-memov-bing,
webkit-repo, plus ORG-LEVEL reference-only entries typesense-org,
msedge-org, perplexityai-org (organizations have no README — registered
≠ read, by contract).

**Read (7 documents, one chunk per cycle):** the README/ReadMe of
typesense (**13 chunks / 13 cycles**), manticoresearch (**11 / 11**),
edge-developer (**2 / 2**), Edge-Dumper (**2 / 2**),
opensource.microsoft.com (**3 / 3**), mem-memov/bing (**1 / 1**), and
WebKit (**3 / 3**) — 35 chunks in all.

## Licenses verified this rung (per-source, before any read)

- **typesense** — GPL-3.0, verified on LICENSE.txt (FSF text) AND the
  GitHub API license field. Strong copyleft: reference only, no code
  copied.
- **manticoresearch** — GPL-3.0 ("GPLv3 or later" badge; LICENSE file
  FSF text; GitHub API field). Strong copyleft: reference only.
- **edge-developer** — CC-BY-4.0 verified on the LICENSE (Attribution
  4.0 International) + GitHub API; code in that repo is MIT
  (LICENSE-CODE, disclosed in its README).
- **Edge-Dumper** — MIT verified on LICENSE + GitHub API. **DEFENSIVE
  READING ONLY** — this is a credential-extraction BOF (a red-team
  tool); read to understand the technique, never aimed at any
  third-party system (the standing defensive-reference discipline,
osint-in-china/owasp-nettacker pattern).
- **opensource.microsoft.com** — MIT verified on LICENSE + GitHub API.
- **mem-memov/bing** — NO license verified: no LICENSE file at the repo
  root (GitHub API license null); disclosed in the register entry;
  reading reference only, no reuse claimed.
- **WebKit** — per-directory licenses (BSD/LGPL family), no root
  LICENSE file (GitHub API license null); disclosed; verify per-file
  before any reuse; reference only.

## Measured fail-closed events (the discipline working)

- **The 2200-char paragraph gate refused the first typesense submission
  AND the first manticoresearch submission** (modelCalls 0 — the
  refusal is pre-call): "a paragraph exceeds 2200 chars; re-chunk the
  source deliberately — silent truncation is refused; fail closed."
  The deliberate re-chunk was applied as the gate demands: typesense
  1 paragraph, manticoresearch 3 paragraphs, split at sentence
  boundaries (then word boundaries), **content fingerprint preserved**
  (whitespace-normalized comparison) — NO truncation. All other five
  bodies passed the gate untouched.
- **A register-re-run duplicate refusal** was exercised by accident and
  became the measured idempotency check: the second runner invocation
  (after a filename bug in the scratch runner) skipped all 10 already
  registered sources — "a source registers exactly once" held.
- **A scratch-runner filename bug** (double- vs single-underscore in
  tr-converted repo names) crashed the FIRST run after the typesense
  paragraph refusal was recorded — scratch-only, never touched any
  committed contract; the second run picked up cleanly.
- No queue-head refusals: each document was read strictly one stream at
  a time in sequence, so the head always offered the current document's
  next chunk. No credential-shaped content refused by the ingest gate;
  no retry loops.

## Defensive observation (disclosed, nothing fetched beyond the README)

The typesense README carries a credential-shaped string in a commented
out CircleCI badge (`circle-token=…`) — likely a stale/leaked badge
token in a public README. It was read locally, never rendered into any
packet surface, and is disclosed here as the kind of thing the reading
cycle should keep flagging. (It does not match SECRET_CONTENT_RE's
patterns, so the ingest gate did not refuse it — a potential hardening
note for a future rung: broadening the credential-shape screen.)

## Reading notes (the operator's honest mapping — reference only, built from, never copied)

- **Typesense** — a fast, typo-tolerant search engine (C++, single
  binary, Algolia/Pinecone alternative): typo tolerance, vector +
  semantic/hybrid search, built-in RAG ("conversational search"), NL
  query understanding, geo search, scoped API keys for multi-tenant
  apps, JOINs, Raft clustering. Benchmarks with concrete numbers
  (2.2M recipes → 900MB RAM, 104 q/s @ 11ms on 4 vCPU). Reference
  shapes for our OWN reading corpus: scoped API keys ↔ tenant-bound
  queues; "no runtime dependencies, single binary" ↔ our local-first
  posture. GPL-3.0: ideas only, never code.
- **Manticore Search** — a search DATABASE (SQL-first, MySQL-wire
  compatible): full-text + vector hybrid in one query, auto-embeddings
  with automatic chunking (fixed-size/recursive/sentence-based chunks
  into `float_vector_array` — the same problem our 12D-274 chunker
  solves, theirs in-database), `CALL CHAT` conversational search over
  vectorized tables, columnar storage for beyond-RAM data, PGM-index
  secondary indexes, cost-based optimization, percolate stream
  filtering, Kafka integration. Their "auto-embeddings with automatic
  chunking" is the closest mirror of our reading pipeline read so far —
  but their chunking serves vector retrieval, ours serves human review.
- **Edge developer docs** — the source-Markdown repo for
  learn.microsoft.com/microsoft-edge: docs-as-code discipline (toc.yml
  registration required for every new page — a provenance habit worth
  referencing), CC-BY-4.0 for docs + MIT for code split cleanly in one
  repo, platform-status data in a separate MicrosoftEdge/Status repo.
- **Edge-Dumper** — a Beacon Object File that scans msedge.exe process
  memory for plaintext saved-credential artifacts (no DPAPI, no SQLite
  file access; same-user context suffices; admin context reads across
  sessions on RDS/VDI). **Why read it defensively:** it demonstrates
  that browser saved credentials live in process memory at runtime —
  which is exactly why XIV AI OS never stores user credentials and
  keeps everything in the local vault with `collectsNothing`. Read as
  threat understanding, never technique adoption; the repo's own
  disclaimer restricts it to authorized testing.
- **opensource.microsoft.com** — Microsoft's OSPO static site (Next.js,
  ported from Jekyll): WCAG 2.1 accessibility as a hard site
  requirement (axe checks in CI), coordinated-contributions discipline
  ("communicate in issues before PRs"), and an honest telemetry section
  ("by default this project does not include telemetry" + exactly when
  analytics code is included). Their explicit telemetry disclosure is a
  good honesty pattern; our equivalent is stronger — `collectsNothing`
  pinned, not merely disclosed.
- **mem-memov/bing** — a tiny Scala Native in-memory address database
  ("send existing addresses to new places in memory"), no thread
  safety by design. Tiny and unlicensed (disclosed) — read for
  completeness of the CEO's batch only; nothing to adopt.
- **WebKit** — the cross-platform browser engine (Safari's engine):
  build discipline across Apple/GTK/WPE ports, Bugzilla lifecycle,
  per-directory licensing (no root LICENSE — verify per file). For the
  agentic-search vision, WebKit is the reference for how a RENDERING
  engine is structured — relevant to "agents bringing you knowledge"
  far-future surfaces, not an adoption target (huge C++ codebase,
  mixed licenses).

## Honest scope (what this is NOT)

- NOT adoption of any of the seven: reading references only — built
  from, never copied; GPL sources (typesense, manticoresearch) remain
  reference-only; no GPL/CC code or prose entered the tree beyond
  these disclosed reading artifacts (local, queue-bound).
- NOT stealth/evasion work: Edge-Dumper was read DEFENSIVELY (threat
  understanding for the local vault posture); no technique from it is
  adopted; nothing here touches third-party systems.
- NOT learning: drafts are text; `learningPromoted false`; weights
  CEO-gated; nothing mutates a model. `activated 0` everywhere.
- NOT a search-engine build: the agentic-search vision stays VISION
  with the recorded honest-scope boundaries (privacy = data-handling;
  "offline VPM" = per-use authorization territory; no detection
  evasion ever).
- The new drafts await the CEO's review decisions — never self-reviewed.

## Verification (measured, local)

- **35/35 cycle packets verified programmatically**: every one
  `kind SUPERVISED_READING_CYCLE`, `policyVersion 12d-283-v1`,
  `humanDecision REQUIRED`, `remoteCalls 0`, `modelCalls 1`,
  `learningPromoted false`, `activated 0`, `modelWeightMutation false`,
  loopback `127.0.0.1:11434`, model `qwen2.5-coder:7b`, every draft
  sha256-bound (64 hex chars). Packets captured verbatim in
  `.xiv-runtime/cycle-<sourceId>-12d-318-c*.json` (scratch, never
  committed); register entries live in the digest-chained
  tamper-evident register (`reading-register.json`).
- **Queue truth read back through the REAL page door after the run:**
  `{"DONE":98,"AWAITING_REVIEW":35}` total 133 — the 98 previously
  reviewed facts untouched, all 35 new 12D-318 drafts AWAITING_REVIEW
  with 0 READY/LEASED/FAILED.
- No code changed this rung — the committed tree is exactly the 12D-317
  tree; the 12D-316 evidence (1444/1444 across 245 files, Python 37,
  shell build exit 0) carries over unchanged.

## Next candidates

1. CEO review decisions on the new batch's drafts (clean slate).
2. Tenant-bound conversation summary surface over the 98+ story memory
   block.
3. Staleness→plan→real-doors operator flow wiring in the shell.
4. The credential-shape screen broadening note (circle-token-shaped
   strings) as a candidate hardening rung.