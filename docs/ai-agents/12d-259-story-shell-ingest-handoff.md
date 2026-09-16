# 12D-259 — Story-Shell Packet Ingest (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-story-shell-ingest.ts` + 10
adversarial tests + the `services/xiv-story-shell` ingest surface).
**TEST RUN DISCLOSED**: `test:12d-259` (node TAP via tsx) = **10/10
pass, first run**; `typecheck:12d-259` (strict tsc) = **exit 0**;
`npm run build` in `services/xiv-story-shell` = **compiled
successfully, 5/5 pages generated** (route `/` static, `/api/ingest`
dynamic). Sibling regressions: all 19 sibling suites green (208 tests,
0 failures — 12d-233 13/13, 12d-236 13/13, 12d-237 12/12, 12d-238
11/11, 12d-239 13/13, 12d-240 13/13, 12d-241 13/13, 12d-242 14/14,
12d-244 14/14, 12d-247 12/12, 12d-248 7/7, 12d-249 9/9, 12d-250 8/8,
12d-251 7/7, 12d-252 8/8, 12d-253 13/13, 12d-254 7/7, 12d-256 9/9,
12d-258 12/12). 218 tests total including 12D-259's 10. CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; findings below). GROK_XAI review PENDING — never
fabricated.

## What it is

The real-packet door into the story shell — the pending item after
12D-255 shipped the page with deterministic examples only. An operator
now drops or pastes a packet JSON document (single packet or a bounded
batch of up to 100) and the shell renders it — or an honest refusal.

## The architecture (and why it is shaped this way)

The 12D-242 wire verifier re-derives sha256 digests through
`node:crypto`, which **cannot bundle into a browser**. That constraint
forces — and the story adopts as its design — a verifier-in-server
architecture:

1. `xiv-story-shell-ingest.ts` (pure, `services/ai`) parses the raw
   text fail-closed and hands EVERY packet to the 12D-254
   `buildStoryShellViewModel` gate. Unparseable text → an
   `UNPARSEABLE` result with honest diagnostics and **zero packet
   content**. Each packet of a batch is judged independently
   (per-packet all-or-nothing: one tampered packet refuses itself,
   never its neighbors). Text ≤ 1,000,000 chars, batch ≤ 100 — over
   the cap refuses the whole submission (never truncates).
2. `src/app/api/ingest/route.ts` (Next.js route handler) runs the
   ingest inside the LOCAL server process and returns ONLY frozen view
   models. No persistence, no remote calls.
3. `src/app/ingest-panel.tsx` (`'use client'`) POSTs raw text and
   renders ONLY the returned view models. The browser never runs the
   verifier and never receives refused packet content — a refusal
   carries zero packet content by construction (12D-254), so nothing
   from a tampered packet is rendered anywhere, client or server.

The strongest honest property of this story: **a refused packet's
content never crosses from the verifier process to the browser.**

## What it does NOT do (the honest boundary)

- **No approve control anywhere**: the ingest surface renders
  decision surfaces for DISPLAY only. Decisions happen in the custody
  stack (12D-247), never through the shell.
- Nothing is persisted: no file writes, no database, no cookie, no
  session. Close the page, the submission is gone.
- remoteCalls: 0, modelCalls: 0, learningPromoted: false,
  automaticRecovery: false, billionUsersProven: false,
  humanDecision: 'REQUIRED'.
- The ingest authenticates the BYTES of a packet, not its truth — a
  verified packet's claims render as claims (12D-254 residual
  verbatim).

## Defects found and paid down during this story

- **(strict tsc, two runs)** `let parsed: unknown` assigned inside a
  nested try loses control-flow narrowing at use sites (TS18046 ×2 /
  TS2322). Fixed by restructuring the parse into a frozen
  discriminated result (`{ok: true, value} | {ok: false, message}`) —
  the narrowing then holds by construction.
- **(adversarial self-review, disclosed residual)** the route handler
  `await request.text()` reads the WHOLE request body before the
  module's 1,000,000-char cap applies — the cap refuses oversized
  text honestly, but does not bound the read itself. Acceptable for a
  LOCAL prototype with a single operator; a future story can bound
  the read at the handler layer.

## Exact files

- `services/ai/runtime/offline-team/xiv-story-shell-ingest.ts` (new)
- `services/ai/runtime/offline-team/xiv-story-shell-ingest.test.ts`
  (new, 10 tests — happy single, tampered-single with zero-leak
  assertions, invalid JSON, non-string inputs, empty/oversized text,
  batch happy, mixed batch independence, batch caps, junk neighbors,
  policy pins)
- `services/ai/package.json` — `test:12d-259`, `typecheck:12d-259`
- `.gitlab-ci.yml` — `typecheck:12d-259`, `test:12d-259` steps
- `services/xiv-story-shell/src/app/packet-panel.tsx` (new — the
  fail-closed panel extracted from page.tsx, shared by both surfaces)
- `services/xiv-story-shell/src/app/api/ingest/route.ts` (new)
- `services/xiv-story-shell/src/app/ingest-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the ingest
  panel; header text updated)
- `docs/ai-agents/12d-259-story-shell-ingest-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-259          # RAN: exit 0
npm run test:12d-259               # RAN: 10/10 pass
npm run build   (services/xiv-story-shell)  # RAN: compiled, 5/5 pages
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no new npm install (the story-shell already scaffolded in
12D-255; no dependency was added). The commit stages ONLY the files
above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The 12D-258 arena verdict surface (render an arena-authorized verdict
record against its transcript), the FastAPI Local LLM Bridge (new
story number — 12D-258 is taken; CEO authorized Ollama at
localhost:11434 with fail-closed 503; `pip install httpx` awaits
explicit per-use authorization; verify Ollama is actually installed
before any claim), and the open 12D-243/12D-245 operator questions.
The GitHub Phase 1 lockdown remains blocked on the CEO's
`! gh auth login`.