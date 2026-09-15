# 12D-239 — XIV AI Avatar Representative (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-avatar.ts` + 13/13 focused tests +
strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review; the first draft's syntax slop was caught by strict tsc before
any test ran and rewritten clean). GROK_XAI PENDING — never fabricated.

## What it is

The END-USER-FIRST face of XIV AI OS (per the CEO's 2026-09-15 direction:
the OS serves the end user first, then organizations), carrying the Master
Business Plan's pillars verbatim — SECURITY FIRST, MENTAL HEALTH SECOND
(wellbeing without surveillance), COMMUNITY, WEALTH — as frozen structural
flags, never claims:

1. **Never impersonates a human.** `presentedAsHuman` is PINNED to `false`
   and is not an accepted input; `displayName` is pinned `'XIV AI'`; every
   speech packet is stamped `spokenBy: 'XIV_AI_AVATAR'`. A human name on an
   avatar refuses with `impersonation refused`.
2. **Statements are operator-authored.** The avatar does NOT generate language
   in this story — a statement is operator-authored text presented VERBATIM,
   and every appearance requires an explicit operator consent reference
   (well-formed, ≥ 8 chars). Language generation is a FUTURE, separately
   reviewed story (disclosed residual); `modelCalls: 0` by construction —
   there is no generation surface anywhere in the contract.
3. **Wellbeing without surveillance.** The avatar layer collects nothing —
   no analytics, no telemetry, no viewer state; the speech packet's exact
   shape (enforced by a test) contains NO telemetry field.
4. **Secrets never enter.** Credential-shaped KEYS (`secret|password|token|
   credential|passphrase|privateKey|apiKey|api-key|signature`, case-
   insensitive) refuse BEFORE any other validation, and credential-shaped
   STATEMENT content (`-----BEGIN … PRIVATE KEY-----`, `sk-…30+`, GitHub/
   AWS token forms) refuses as well.
5. **Digest-bound identity.** `avatarId` IS the sha256 over the canonical
   fixed-key-order identity (domain-tagged `XIV_AVATAR_REPRESENTATIVE`,
   including the pinned display name); `verifyAvatarIdentity` re-derives it —
   a tampered scope, a forged digest, an added `humanName` field, or an
   attempted human presentation all refuse.
6. **Deterministic visual.** `renderAvatarCard` derives the avatar's SVG
   palette from the identity digest — same identity → same image, a different
   identity is visibly a different avatar; no randomness, no generation, no
   fetch (local plane only, `remoteCalls: 0`).

## Disclosed residuals

- Language generation does NOT happen in this story — the avatar presents
  operator-authored text only. An agent-authored (generated) avatar speech
  layer is a future, separately reviewed story with its own provenance
  contract.
- The consent reference is carried, not verified here: authenticity of the
  operator's consent evidence is out-of-band custody (12D-233's registration-
  is-not-issuance-proof disclosure carries over — a consent ref fed by an
  impostor is recorded as the impostor's).
- "Virtual XIV chips" (CPU/GPU/NPU-universal, quantum) remain an ASPIRATION
  from the CEO's direction — explicitly NOT claimed anywhere in this story;
  `quantumPathProven` is not asserted anywhere and would carry `false` until
  measured in a future, separately reviewed story.

## Defects found and paid down during this story

- **(first-draft syntax slop, caught by strict tsc BEFORE any test ran):** the
  initial write contained stray closing parens across several gates and a
  broken `sha256` binding (a dangling conditional-import expression plus a
  duplicate crypto import). The module was rewritten clean in one pass; no
  test was relaxed, and none had run against the broken draft.

## Exact files

- `services/ai/runtime/offline-team/xiv-avatar.ts` (new)
- `services/ai/runtime/offline-team/xiv-avatar.test.ts` (new, 13 tests)
- `services/ai/package.json` (`test:12d-239`, `typecheck:12d-239`)
- `.gitlab-ci.yml` (`typecheck:12d-239`, `test:12d-239` appended)
- `docs/ai-agents/12d-239-xiv-avatar-representative-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-239      # 13/13 pass, exit 0
npm run typecheck:12d-239 # exit 0 (strict)
npm run test:12d-238      # 11/11, exit 0
npm run test:12d-237      # 12/12, exit 0
npm run test:12d-236      # 13/13, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The commit stages ONLY the
five files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.