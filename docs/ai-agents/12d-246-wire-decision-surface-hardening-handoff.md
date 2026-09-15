# 12D-246 — Wire decision-surface hardening (handoff)

Status: COMMITTED on `claude/12d-99-supervised-local-worker`. **TEST RUN
DISCLOSED**: `test:12d-241` (which now carries this story's regression) =
**13/13 pass**, `typecheck:12d-241` (strict) = **exit 0**, and the
downstream `test:12d-242` shell suite = **14/14 pass**. CI IS NOT CLAIMED
PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review).
GROK_XAI review PENDING — never fabricated.

## What it is

The 12D-241 residual disclosed in the 12D-242 handoff, now paid down with
a regression test: `verifyStoryShellPacket` shaped the packet's TOP-level
keys, but a field smuggled INSIDE `decisionSurface` was neither
digest-covered (the digest covers `decidingOver` only) nor shape-audited.

The hardening: verify now exact-key-audits the decision surface
(`['kind', 'humanDecision', 'decidingOver']`) BEFORE the pinned-value and
digest checks. A smuggled field — even a credential-shaped one — refuses
with `decisionSurface shape mismatch — a field was smuggled inside the
decision surface; fail closed`.

## Why the regression test is shaped the way it is

The suite proves the smuggle is DIGEST-CONSISTENT — the forged packet
keeps the ORIGINAL `packetId` — so the digest check alone could never
catch it; the exact-keys audit is load-bearing. It also proves the honest
packet still verifies (the hardening refuses only smuggles, never honest
traffic).

## Disclosed residuals / notes

- `buildStoryShellPacket` needed no change: it constructs the decision
  surface itself from the operator's `decidingOver` input, so no smuggle
  surface exists at build time. The receiving side is where the gap was.
- Behavior change is strict: packets that verify today all verified
  before; packets that were accepted ONLY by the digest loophole now
  refuse. No honest packet shape is affected.
- This story shares the existing `test:12d-241`/`typecheck:12d-241` npm +
  CI wiring (it modifies those files), so no new script entries or
  `.gitlab-ci.yml` steps are added.
- CI remains quota-blocked; GROK_XAI review remains PENDING. Neither is
  ever claimed.

## Exact files

- `services/ai/runtime/offline-team/xiv-os-wire-contract.ts` (hardened)
- `services/ai/runtime/offline-team/xiv-os-wire-contract.test.ts`
  (+1 regression test: `12D-246 a field smuggled INSIDE decisionSurface
  refuses verify`)
- `docs/ai-agents/12d-246-wire-decision-surface-hardening-handoff.md`
  (this file)

## Exact commands and local results

```
npm run test:12d-241      # RAN: 13/13 pass (12 prior + this regression)
npm run typecheck:12d-241 # RAN: strict, exit 0
npm run test:12d-242      # RAN: 14/14 pass (downstream render suite)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch. The commit stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.