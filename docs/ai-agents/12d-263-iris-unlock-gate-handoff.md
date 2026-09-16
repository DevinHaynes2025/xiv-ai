# 12D-263 — Iris Unlock Gate (pure contract, declared-not-proven) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-iris-unlock-gate.ts` + 12
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-263` (node TAP
via tsx) = **12/12 pass**; `typecheck:12d-263` (strict tsc) =
**exit 0**. Sibling regressions: 12d-233 13/13, 12d-236 13/13,
12d-241 13/13, 12d-242 14/14, 12d-247 12/12, 12d-253 13/13,
12d-254 7/7, 12d-258 12/12, 12d-259 10/10, 12d-260 20/20,
12d-262 9/9 — all green (136 sibling tests). CI IS NOT CLAIMED
PASSED (`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review;
one confirmed finding paid down below). GROK_XAI review PENDING —
never fabricated.

## What it is

The 12D-261 requirements, turned into an enforceable pure contract —
in the 12D-240 declared-not-proven pattern, testable with ZERO camera
hardware. The module implements NO iris recognition, captures NO
image, touches NO camera, and proves NO biometric capability
(`biometricCapability: 'DECLARED_NOT_PROVEN'`). It enforces the
requirements' SHAPE so a future authorized capture engine cannot
violate them silently:

- **ACTIVE GESTURE ONLY**: the camera can only turn on via an explicit
  GESTURE event from IDLE with attempt budget left — background
  surveillance is structurally impossible.
- **CAMERA-OFF GUARANTEE** (12D-261 R3): the camera state rides IN the
  frozen state; the validator refuses any state where the camera is on
  outside CAPTURING, and every terminal outcome (UNLOCKED, LOCKED)
  carries `cameraActive: false` (asserted by
  `verifyIrisGateCameraOffInvariant` and by every test).
- **FAIL CLOSED TO LOCKED** (12D-261 R4): the verdict comes ONLY from
  an injected evaluator (the future capture story's job); NO_MATCH,
  SPOOF_SUSPECT, LOW_QUALITY, UNAVAILABLE, and ANY garbage verdict all
  lock the gate. Ambiguity never unlocks.
- **BOUNDED ATTEMPTS**: 3 failing captures exhaust the session; an
  exhausted gate refuses new gestures and resets — brute force has no
  runway.
- **BIOMETRICS UNLOCK, CUSTODY DECIDES** (12D-261 R5): UNLOCKED grants
  no custody authority; there is no custody surface hidden in this
  module.

## The honest boundary

- DECLARED NOT PROVEN: no biometric capability exists anywhere in this
  codebase and none is claimed. The capture window is the HOST's duty
  — the gate honors a TIMEOUT event but cannot measure time itself
  (disclosed residual). Enrollment, revocation, and template custody
  are future stories (12D-261 R1/R7), none started.
- `humanDecision: 'REQUIRED'`, `modelCalls: 0`, `remoteCalls: 0`,
  `collectsNothing: true`, `learningPromoted: false`,
  `automaticRecovery: false`, `billionUsersProven: false`.

## Defects found and paid down during this story

- **(adversarial self-review, CONFIRMED and fixed)** the state
  validator accepted an impossible state — IDLE with `cameraActive:
  true` — because the camera invariant was only checked by the
  separate invariant helper. Paid down structurally: `isGateState` now
  rejects any state whose camera is on outside CAPTURING, with a
  regression test in the forged-state suite.

## Exact files

- `services/ai/runtime/offline-team/xiv-iris-unlock-gate.ts` (new)
- `services/ai/runtime/offline-team/xiv-iris-unlock-gate.test.ts`
  (new, 12 tests — fresh gate; gesture-only camera opening + MATCH
  unlock with camera off; all four non-MATCH verdicts; garbage
  verdicts from a hostile evaluator; attempt-budget exhaustion
  incl. RESET refusal; TIMEOUT; ABORT without consuming an attempt;
  re-lock budget carry; illegal transitions; forged/stale states
  incl. the impossible camera state; unknown event kinds; policy
  pins)
- `services/ai/package.json` — `test:12d-263`, `typecheck:12d-263`
- `.gitlab-ci.yml` — `typecheck:12d-263`, `test:12d-263` steps
- `docs/ai-agents/12d-263-iris-unlock-gate-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-263  # RAN: exit 0
npm run test:12d-263       # RAN: 12/12 pass
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no external fetch, no install, no
camera access of any kind. The commit stages ONLY the files above and
never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## CEO decisions still open (fail-closed, not acted on)

- PayPal sandbox config generation (12D-195) — awaits the CEO's
  explicit pick AND credentials only the CEO can create; the CFO-AI
  architecture stays frozen until then per the checkpoint.
- Apollo.io company-search pilot — outward-facing outreach; blocked
  without explicit CEO approval per the execution rule.
- GitHub Phase 1 lockdown — blocked on the CEO's `! gh auth login`.

## Next candidates

Pathway-evidence expansion for "the brain" (honest caps — 2,000,000
rows/database stays the only measured ceiling), the wire-verdict
surface for 12D-247 custody decisions in the shell, and the open
12D-243/12D-245 operator questions.