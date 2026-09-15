# 12D-242 — XIV OS Story Shell Renderer (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-story-shell.ts` + 14 focused tests).
**TEST RUN DISCLOSED**: on first run (classifier outage lifted this session)
esbuild refused the test file — an unescaped `/` inside a regex literal
(`</header>` terminated the pattern) — then a missing `renderAvatarCard`
import surfaced; both fixed, after which **`npm run test:12d-242` = 14/14
pass and `npm run typecheck:12d-242` (strict) exit 0**, and siblings
`test:12d-239` 13/13, `test:12d-240` 13/13, `test:12d-241` 12/12 stayed
green. Wiring (`test:12d-242`/`typecheck:12d-242` + `.gitlab-ci.yml` steps)
lands in the 12D-242 commit, held until now behind the 12D-239/240/241
commit chain per plan. CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review;
three run-time test-side defects caught — see "Defects"). GROK_XAI PENDING
— never fabricated.

## What it is

The FRONT-END trust boundary of the Master Plan web blueprint, contract-first
(no installs, no app scaffold, no server): a pure renderer that turns a
**verified** 12D-241 `StoryShellPacket` into the static story-shell document.

1. **Verify BEFORE render (structural).** `verifyStoryShellPacket` (12D-241)
   runs FIRST; its refusal propagates and NOTHING renders — the front end
   never trusts an unverified packet, per the wire guardrail.
2. **SECRETS NEVER RENDER (defense in depth — the story's core finding).**
   The 12D-241 wire verifies INTEGRITY in flight (digest re-derivation); it
   does not — and cannot — prove AUTHORSHIP of the text (authenticity is
   out-of-band operator custody; the 12D-241 disclosure carries over). A
   hand-forged but DIGEST-CONSISTENT packet therefore passes the wire — the
   suite builds exactly such a forgery (re-deriving the digest from the
   packet's own declared fields, as any receiving side can) and proves:
   `verifyStoryShellPacket` accepts it, and `renderStoryShell` REFUSES it via
   the render layer's own credential-content re-gate. Credential-shaped text
   (private-key blocks, `sk-…`, `ghp_…`, AWS `AKIA/ASIA` ids) can never reach
   a screen through this layer — headline, body, or decidingOver.
3. **Escape boundary.** EVERY packet-sourced string (headline, bodyText,
   storyId, decidingOver, avatar representationScope) is HTML-escaped,
   quotes included — no packet text can break out of an attribute. The
   avatar's SVG embeds verbatim SAFELY because 12D-239's card interpolates
   only digest-derived hue integers and the fixed literal "XIV AI" — no
   operator-authored text ever enters the visual.
4. **Never auto-approves.** The decision surface renders as a visible
   "HUMAN DECISION REQUIRED" panel (`kind: APPROVAL_REQUIRED` interpolated
   from the packet, `humanDecision: 'REQUIRED'`) and nothing else: no
   approve control, no `<button>`, no `<input>`, no `<a href>`, no
   `AUTO_APPROVED` anywhere. The approval happens OUT-OF-BAND in operator
   custody (12D-233); the shell renders the surface, never the decision.
5. **No telemetry / no fetch / no script.** Static markup only —
   shape-audited by test: no `<script>`, `<iframe>`, `javascript:`,
   `fetch(`, `navigator.`, storage, analytics, beacons; no on* ATTRIBUTE on
   any raw tag (escaped payload text may contain the inert substring — the
   audit is scoped to live attribute positions). `collectsNothing: true` at
   the screen.
6. **Deterministic.** Same packet → same bytes (asserted), byte-identical
   after a JSON round-trip (both-sides render), distinct packets → distinct
   shells. No randomness, no time-of-render, `modelCalls: 0`,
   `remoteCalls: 0`.
7. **Honest flags render visibly**: `humanDecision: REQUIRED · modelCalls: 0
   · remoteCalls: 0 · collectsNothing: true · learningPromoted: false ·
   automaticRecovery: false · billionUsersProven: false`, plus the verified
   packet digest in the header (hex, re-derived at render).

## Disclosed residuals

- The output is a STRING, not a mounted app: an actual Next.js scaffold
  (installs, a server, real DOM) is a FUTURE, separately reviewed story —
  installs need per-use authorization. This contract is the render layer the
  shell will call; it needs no dependency.
- The approval AFFORDANCE (an interactive control recording the human's
  decision into custody) is a future story; today the shell renders the
  surface honestly as required-and-not-here.
- Wire verification is integrity-in-flight, not authorship — the render
  re-gate closes the credential-content surface; full authorship proof
  remains out-of-band custody (12D-233), unchanged.
- **(found while reviewing 12D-242, disclosed to 12D-241's owner):** the
  12D-241 verify gate shapes the packet's TOP-level keys, but a field
  smuggled INSIDE `decisionSurface` is neither digest-covered (the digest
  covers `decidingOver` only) nor shape-audited. The render layer is closed
  against it — this contract reads ONLY `kind` / `humanDecision` /
  `decidingOver` from the surface and interpolates nothing else, so a
  smuggled field cannot reach the screen — but the wire-layer gap belongs
  to 12D-241 and is its residual to pay down in a future story (e.g. an
  exact-keys audit on `decisionSurface` at verify). Never silently ignored:
  it is disclosed here rather than patched by editing an already-pending,
  separately-reviewed 12D-241 commit.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Defects found and paid down during this story

- **(byte-level, caught by grep against the codebase pre-test):** the test
  file spelled the pinned decision-surface kind `APROVAL_REQUIRED` (7
  letters) while the whole codebase (including `xiv-os-wire-contract.ts:95,
  186, 213`) pins `APPROVAL_REQUIRED` (8) — both occurrences fixed to the
  pinned byte form before any run; the module itself interpolates the
  packet's kind and carries NO kind literal.
- **(self-review, pre-test):** the no-`on*` audit regex `/\son\w+=/i` was a
  FALSE assertion — an ESCAPED payload (e.g. `onerror=` inside
  `&lt;img …&gt;`) is inert by construction but still contains the
  substring, so the check would have failed an honest render. Re-scoped to
  the real property: no on* ATTRIBUTE on any RAW tag
  (`/<\w+[^>]*\son\w+=/i`). Never fixed by weakening the guarantee — the
  raw-tag scoping is the stronger, correct form.
- **(self-review, pre-test):** first-draft avatar `figcaption` narrowing and
  the `verdict` unused-variable shape were cleaned in the same pass as the
  write (strict tsc shape audited by inspection while Bash/npm was outage-
  blocked; the test run below confirms when the classifier recovers).
- **(caught by the first real run, disclosed):** (a) an unescaped `/` inside
  the honest-flags regex literal — `/verified packet [0-9a-f]{64}</header>/`
  — was a hard esbuild TransformError; fixed to `<\/header>`. (b) The test
  file referenced `renderAvatarCard` without importing it; fixed by adding
  the import from `./xiv-avatar`. Both were TEST-side only — the renderer
  module itself needed no change.

## Exact files

- `services/ai/runtime/offline-team/xiv-story-shell.ts` (new)
- `services/ai/runtime/offline-team/xiv-story-shell.test.ts` (new, 14 tests)
- `docs/ai-agents/12d-242-xiv-os-story-shell-renderer-handoff.md` (this file)
- `services/ai/package.json` — `test:12d-242`, `typecheck:12d-242` **TO BE
  ADDED after the pending 12D-239/240/241 commit chain lands** (that chain
  stages `package.json`/`.gitlab-ci.yml` once, with the wiring for exactly
  those three stories; 12D-242's wiring deliberately waits so the staged
  state matches its commit message).
- `.gitlab-ci.yml` — `typecheck:12d-242`, `test:12d-242` appended in the same
  follow-up commit.

## Exact commands and local results

```
npm run test:12d-242      # RAN: 14/14 pass (after the two test-side fixes)
npm run typecheck:12d-242 # RAN: strict, exit 0
```

Sibling regressions run this cycle: `test:12d-241` 12/12, `test:12d-239`
13/13, `test:12d-240` 13/13 — all green after 12D-242's changes.

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation, no physical-device interaction, and NO external
fetch of any pasted resource occurred in this story. The commit stages ONLY
the files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.