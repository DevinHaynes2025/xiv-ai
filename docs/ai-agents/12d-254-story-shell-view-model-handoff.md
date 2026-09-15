# 12D-254 — Story-Shell View Model (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-story-shell-view-model.ts` + 7
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-254` = **7/7
pass**, `typecheck:12d-254` (strict) = **exit 0**; sibling regressions
all green — 16 suites, 180 tests, 0 failures (counts below). CI IS NOT
CLAIMED PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE
(self-review; defects listed). GROK_XAI review PENDING — never
fabricated.

## What it is

The fail-closed rendering contract between raw wire bytes and the XIV OS
web front-end (`services/xiv-story-shell`, scaffolded separately). The
UI never touches a raw packet — it renders ONLY the frozen view model
`buildStoryShellViewModel` returns:

- **ALL-OR-NOTHING**: a packet is either fully verified
  (`verifyStoryShellPacket` — digest re-derivation, exact keys, pinned
  guardrails) or the view is a REFUSAL. A tampered packet never renders
  partially.
- **NO APPROVE CONTROL**: the verified display surface is display-only
  (APPROVAL_REQUIRED / humanDecision REQUIRED shown, never an approve
  affordance) — decisions happen in the custody stack (12D-247).
- **REFUSALS ARE HONEST**: a refusal names the verifier's reason and
  carries ZERO packet content (asserted by test: the refused view must
  not contain the original headline or tampered text).
- **PURE MODULE**: no fs, no clock, no randomness, no network;
  `modelCalls: 0`, `remoteCalls: 0`. Never throws — a crash is a bug,
  a refusal is the contract (getter-bomb inputs are in the suite).

## Defects found and paid down during this story

- **(self-review, pre-run, FOURTH occurrence of the class):** the
  guardrails test originally reached the module via `require()` inside
  an ESM test — replaced with a top-level import before any run.
- **(first-run tsc catch, module-side):** the view model read display
  fields off `verifyStoryShellPacket`'s RETURN VALUE — but the wire
  verifier returns `{ok, packetId}` (it throws on tamper, it does not
  hand back the packet). Fixed by verifying and then reading the
  packet itself; caught by strict tsc before the suite could lie.
- **(disclosure):** this handoff was drafted during a classifier outage
  (glm-5.3-flash:cloud timeouts blocking Bash) with an explicit
  placeholder; per standing rules the outage was waited out, never
  bypassed, and the placeholder was replaced only after the tests
  actually ran.

## Disclosed residuals

- A verified view model proves the BYTES are intact, not that the
  content is true — the shell renders claims; it does not witness them.
- The refusal message text is wire-verifier diagnostics, displayed for
  the operator, never parsed for control flow.
- The actual Next.js page that CONSUMES this view model is a separate,
  later step (`services/xiv-story-shell`); the scaffold is not yet
  committed.

## Exact files

- `services/ai/runtime/offline-team/xiv-story-shell-view-model.ts` (new)
- `services/ai/runtime/offline-team/xiv-story-shell-view-model.test.ts`
  (new, 7 tests)
- `docs/ai-agents/12d-254-story-shell-view-model-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-254`, `typecheck:12d-254`
- `.gitlab-ci.yml` — `typecheck:12d-254`, `test:12d-254`

## Exact commands and local results

```
npm run test:12d-254      # RAN: 7/7 pass
npm run typecheck:12d-254 # RAN: strict, exit 0
```

Sibling regressions this cycle (run from `services/ai`): 12d-233 13/13,
12d-236 13/13, 12d-237 12/12, 12d-238 11/11, 12d-239 13/13, 12d-240
13/13, 12d-241 13/13, 12d-242 14/14, 12d-244 14/14, 12d-247 12/12,
12d-248 7/7, 12d-249 9/9, 12d-250 8/8, 12d-251 7/7, 12d-252 8/8,
12d-253 13/13 — all green. 180 sibling tests, 0 failures; 187
including 12D-254.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no installer execution. The commit will stage ONLY the files
above and never touch `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.