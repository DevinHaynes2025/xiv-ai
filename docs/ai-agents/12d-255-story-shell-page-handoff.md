# 12D-255 — Story-Shell Front-End Page (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/xiv-story-shell/src/app/page.tsx` + config, wired to the
12D-254 view model). **TEST RUN DISCLOSED**: `npm run build` (Next.js
16 production build, which compiles, runs TypeScript over the whole
import chain including the sibling services/ai contracts, and
prerenders) = **exit 0, 4 static pages, no errors**; services/ai
sibling suites re-run this cycle all green (counts below). CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review). GROK_XAI review PENDING — never fabricated.

## What it is

The first rendered surface of the XIV OS front-end: a LOCAL,
statically-prerendered prototype page that demonstrates and ENFORCES the
fail-closed rendering contract end-to-end:

- The page renders ONLY what `buildStoryShellViewModel` (12D-254)
  returns — Example A (an intact 12D-242 packet, digest verified) and
  Example B (the SAME packet with one headline edit in flight) — proving
  the tampered packet renders a REFUSAL that carries zero packet
  content, side by side with the verified render.
- **NO APPROVE CONTROL anywhere on the page, by construction** — the
  decision surface is displayed (APPROVAL_REQUIRED, humanDecision
  REQUIRED) with the operator note pointing to the custody stack.
- Example fixtures are deterministic (fixed `generatedAtMs: 1_000_000`,
  no clock, no randomness) and clearly labeled EXAMPLE — never presented
  as live data.
- Footer pins the honest flags: `humanDecision: REQUIRED`,
  `remoteCalls: 0`, `modelCalls: 0`, `learningPromoted: false`,
  `billionUsersProven: false`, local-plane prototype, no deployment.
- Zero remote calls; the page imports only local sibling contracts.

## The Next 16 cross-package import finding (paid down)

Next 16 builds with **Turbopack**, which resolves modules only inside
the project root and auto-detects that root from a lockfile — the
scaffold's own `package-lock.json` pinned the root to
`services/xiv-story-shell`, so `../../../ai/runtime/offline-team/...`
failed with module-not-found on the first build. Fix (per the bundled
turbopack.md "Root directory" doc): `turbopack.root` set to `services/`
in `next.config.ts`. `experimental.externalDir` is no longer load-bearing
and was removed. Found by the build itself, fixed, re-verified green.

## Disclosed residuals

- The shell renders claims; it does not witness them (verified bytes ≠
  true content) — the 12D-254 residual carries verbatim.
- This is a PROTOTYPE page: no routing of real packets yet, no server
  ingestion of operator journals, no avatar rendering beyond `avatarId`
  display. Real packet ingestion is a separate reviewed story.
- `next/font/google` (the scaffold's Geist fonts) resolves from Google
  Fonts at BUILD time — no runtime remote calls, but the build itself
  fetches fonts unless offline. Disclosed honestly; a fully-offline
  font story is a candidate follow-up.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/xiv-story-shell/src/app/page.tsx` (rewritten — the shell page)
- `services/xiv-story-shell/src/app/layout.tsx` (metadata only)
- `services/xiv-story-shell/next.config.ts` (turbopack.root)
- `docs/ai-agents/12d-255-story-shell-page-handoff.md` (this file)
- `.gitlab-ci.yml` — `story-shell-build` job (builds the shell on
  changes to the shell or its contract imports)

## Exact commands and local results

```
cd services/xiv-story-shell && npm run build   # RAN: compiled + TS + 4 static pages, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7, 12d-252 8/8,
12d-253 13/13, 12d-254 7/7 — all green, 180 tests, 0 failures.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

The FastAPI backend contract scaffolds (CEO direction), the arena CLI
adoption layer (12D-250/252 pattern), real-packet ingestion into the
shell, and the still-open 12D-243/12D-245 operator questions. The
GitHub Phase 1 lockdown remains blocked on the CEO's `! gh auth login`.