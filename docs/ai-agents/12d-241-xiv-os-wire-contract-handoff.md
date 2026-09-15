# 12D-241 — XIV OS Wire Contract v1 (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-os-wire-contract.ts` + 12/12 focused
tests + strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review; one live design defect caught by the suite and paid down — see
below). GROK_XAI PENDING — never fabricated.

## What it is

The trust layer AT THE WIRE for the Master Plan's prototype blueprint
(Next.js/TS front end, FastAPI-style backend): the fail-closed packet shapes
shared by both sides, so the front end never trusts a packet it did not
verify and the backend never emits one it cannot re-derive.

1. **Digest-bound packets.** `packetId` IS the sha256 over the canonical
   fixed-key-order input (domain-tagged `XIV_OS_STORY_SHELL_WIRE`,
   wireVersion 1, avatarId when present). `verifyStoryShellPacket`
   re-derives from the packet's OWN declared fields — a headline, body,
   avatarId, or decision surface edited in flight refuses BOTH directions.
2. **Verifiable independently on BOTH sides of the wire (structural).** A
   packet arriving over a real transport is a fresh object (JSON round-trip)
   and MUST still verify — guardrails are compared BY VALUE, never by
   reference (regression-tested with a JSON round-trip). This property was
   caught MISSING by the suite: the first draft compared the guardrails
   object by reference, which would have refused honest transports. Fixed
   in the MODULE, never by weakening the test.
3. **The decision surface is pinned.** `humanDecision: 'REQUIRED'` over
   `kind: 'APPROVAL_REQUIRED'` is not an accepted input; a packet claiming
   `AUTO_APPROVED` (or any other) refuses.
4. **An embedded avatar is REQUIRED to be a verified 12D-239 identity.**
   The wire re-runs the avatar's own digest derivation at build AND verify;
   an impersonated or tampered avatar refuses the whole packet. `avatar:
   null` is an exact-key (an avatar-less story shell is legitimate) and a
   DIFFERENT avatar id changes the digest — the packet binds its presenter.
5. **Secrets never enter.** Credential-shaped KEYS refuse before any other
   validation (build-time); credential-shaped headline/body/decidingOver
   TEXT refuses as well.
6. **Wellbeing without surveillance, at the wire.** `collectsNothing: true`
   is a pinned guardrail, and the packet shape carries NO telemetry field —
   shape-audited by test (an added `telemetry`/`viewedAtMs` field refuses
   the exact-shape gate).
7. **Statements are operator-authored.** The wire carries story text
   verbatim; there is no generation surface anywhere (`modelCalls: 0` by
   construction — the language-generation residual from 12D-239 carries
   over verbatim). `remoteCalls: 0` — this file is the wire SHAPE, not a
   transport: no fetch, no socket, ever.

## Disclosed residuals

- The consent/decision evidence behind `APPROVAL_REQUIRED` is carried, not
  verified here — authenticity is out-of-band operator custody (the
  12D-233 registration-is-not-issuance-proof disclosure carries over).
- A Next.js/FastAPI RUNTIME integration (an actual app scaffold, installs,
  a server process) is a FUTURE, separately reviewed story — this contract
  is the packet layer both sides will satisfy, and needs no install.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Defects found and paid down during this story

- **(LIVE DESIGN DEFECT, caught by the suite):** the guardrails check
  compared the guardrails object by REFERENCE, which would have refused any
  packet arriving over a real transport (fresh object after a JSON
  round-trip) even with values intact — silently breaking the
  both-sides-verifiable property the contract exists to provide. Fixed in
  the module: per-key VALUE comparison against the frozen canonical
  guardrails; the round-trip regression test pins it.
- **(self-review, before any test ran):** the first write had a stray paren
  in the digest-derivation return; rewritten clean in the same pass.
- **(test-side, caught by strict tsc):** a tamper cast needed the honest
  `as unknown as` two-step (an intentional type violation), and a
  `ciStatusClaimed` assertion was removed — CI status is disclosed in
  handoffs, not carried on the wire contract (the wire makes no CI claim,
  so there is nothing to assert).

## Exact files

- `services/ai/runtime/offline-team/xiv-os-wire-contract.ts` (new)
- `services/ai/runtime/offline-team/xiv-os-wire-contract.test.ts` (new, 12 tests)
- `services/ai/package.json` (`test:12d-241`, `typecheck:12d-241`)
- `.gitlab-ci.yml` (`typecheck:12d-241`, `test:12d-241` appended)
- `docs/ai-agents/12d-241-xiv-os-wire-contract-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-241      # 12/12 pass, exit 0
npm run typecheck:12d-241 # exit 0 (strict)
npm run test:12d-239      # 13/13, exit 0
npm run test:12d-240      # 13/13, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation, and NO physical-device interaction occurred in
this story. The commit stages ONLY the five files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.