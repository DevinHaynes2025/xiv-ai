# 12D-262 — Arena Verdict Surface (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-arena-verdict-view.ts` + 9
adversarial tests + the `services/xiv-story-shell` verdict surface).
**TEST RUN DISCLOSED**: `test:12d-262` (node TAP via tsx) = **9/9 pass**
(after two test-harness fixes disclosed below); `typecheck:12d-262`
(strict tsc) = **exit 0**; `npm run build` in `services/xiv-story-shell`
= **compiled successfully** (route `/` static, `/api/ingest` and
`/api/ingest/verdict` dynamic). Sibling regressions: 12d-253 13/13,
12d-254 7/7, 12d-258 12/12, 12d-259 10/10, 12d-260 20/20 — all green.
CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE.
GROK_XAI review PENDING — never fabricated.

## What it is

The operator's window into the arena↔custody loop the CEO's chain
built across 12D-253 → 12D-258 → 12D-254 → 12D-255: drop a 12D-258
verdict submission —
`{transcript, packet, verdict, registeredBy, nowMs}` — and the shell
renders "consensus reached, receipt in the custody chain, ready for
HUMAN review", or an honest refusal.

## How it verifies (the whole submission is ONE unit)

`buildArenaVerdictViewModel(raw)` — pure, never throws — runs the REAL
contracts in gate order: exact keys in order → registeredBy/nowMs
gates → `verifyArenaTranscript` (12D-253 hash-chain replay) →
`gateConsensus` (AUTHORIZED only; an unauthorized debate refuses even
if other parts are consistent) → `verifyStoryShellPacket` (12D-242
wire) → `verifyArenaVerdictRecord` (12D-258 byte-exact re-derivation
from the submission's own transcript+packet). A refusal carries ZERO
packet, transcript, or receipt content. The verified view is
display-only: no approve control anywhere, decisions stay in the
custody stack (12D-247).

Front-end: `/api/ingest/verdict` route handler (local process; parse
failures return an honest refusal JSON), `verdict-panel.tsx` client
surface (drop/paste, no approve control), mounted above the ingest
panel on the shell page.

## Defects found and paid down during this story

- **(test harness, two fixes, disclosed)** the fixture journal path was
  the tmpdir itself (rename onto a directory → EPERM) — fixed to a
  file inside the tmpdir; a `JSON.stringify(undefined).slice` crash in
  an assert message — guarded. Two tsc-visible test bugs
  (`assert.ok(x, 64)` → `assert.equal`, a stray dead line) fixed
  before the first full run. The MODULE itself needed no defects paid
  down after authoring: 9/9 on the first complete run.

## The honest boundary

- The view authenticates BYTES and consensus STRUCTURE, not agent
  honesty (12D-253 residual verbatim); registration is not issuance
  proof (12D-233 residual verbatim).
- `humanDecision: 'REQUIRED'`, `modelCalls: 0`, `remoteCalls: 0`,
  `learningPromoted: false`, `automaticRecovery: false`,
  `billionUsersProven: false`.

## Exact files

- `services/ai/runtime/offline-team/xiv-arena-verdict-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-arena-verdict-view.test.ts`
  (new, 9 tests — real-verdict happy path through the REAL 12D-258
  journaling path on a throwaway registry + real tmpdir journal;
  tampered transcript / unauthorized debate / non-binding packet /
  tampered record / identity+clock mismatches, each with zero-leak
  assertions; exact-keys gate incl. reordering; registeredBy/nowMs
  gates; policy pins)
- `services/ai/package.json` — `test:12d-262`, `typecheck:12d-262`
- `.gitlab-ci.yml` — `typecheck:12d-262`, `test:12d-262` steps
- `services/xiv-story-shell/src/app/api/ingest/verdict/route.ts` (new)
- `services/xiv-story-shell/src/app/verdict-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the verdict panel)
- `docs/ai-agents/12d-262-arena-verdict-view-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-262  # RAN: exit 0
npm run test:12d-262       # RAN: 9/9 pass
npm run build (xiv-story-shell)  # RAN: compiled, routes listed above
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no external fetch, no npm install.
Never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Reference drops recorded (REFERENCES ONLY — nothing fetched)

The CEO's 2026-09-15 drop (Black women's suffrage / 19th-century
African-American women writers archives, Egyptology + papyri +
OpenAtlas + EVT digital-edition tools, digital-library papers,
fashion datasets incl. fashion-mnist, Finance.NET/yfinance — the
yfinance tarball in Downloads NOT executed or installed, cudnn/cuda
.exe installers NEVER executed) is recorded as reference material
only. No repo, paper, or dataset was fetched, cloned, or ingested;
no secrets were sent anywhere.

## Next candidates

The pathway-evidence expansion for "the brain" (honest caps — the
2,000,000 rows/database stays the only measured ceiling; trillions is
a design aspiration, never a claim), the pure iris unlock-gate
contract (12D-261 requirements now landed), and the open
12D-243/12D-245 operator questions. GitHub Phase 1 lockdown remains
blocked on the CEO's `! gh auth login`.