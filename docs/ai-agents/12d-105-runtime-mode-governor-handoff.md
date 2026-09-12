# 12D-105 — Runtime Mode Governor: OFFLINE / HYBRID / ONLINE / AUTOPILOT (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO-directed offline/online/autopilot scope.

## Semantics

`ModeGovernor` owns one runtime mode with graduated trust:

- **Escalation needs evidence**: every transition carries an evidence ref; `OFFLINE→ONLINE` must pass through `HYBRID`; `AUTOPILOT` can only be engaged from `ONLINE`.
- **AUTOPILOT requires a PRIOR human receipt**: `operatorAuthorizationRef` + future `authorizationExpiresAtMs`, capped at 7 days (`maxAutopilotWindowMs`). The governor checks receipts; it never grants authority.
- **Fail-safe expiry**: an expired AUTOPILOT authorization degrades the *effective* mode to `ONLINE` automatically with `reason: 'authorizationExpired'` — fail-safe degradation, NOT automatic recovery (`automaticRecovery: false` throughout). `acknowledgeExpiry()` re-arms to ONLINE; re-engaging AUTOPILOT always needs a fresh human receipt.
- **De-escalation is always allowed**, including straight to OFFLINE.
- **TOP_SECRET locks OFFLINE**: a TOP_SECRET classification ceiling — declared on any transition, including a de-escalation — makes every non-OFFLINE transition throw. TOP_SECRET never routes externally.

## Verification

6/6 tests (`test:12d-105`) with a virtual clock: graduated-trust ordering; AUTOPILOT receipt/expiry/cap rules; expiry degradation + acknowledge; TOP_SECRET lock from any direction; unrestricted de-escalation; honest snapshot flags and frozen guardrails. `typecheck:12d-105` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

No scheduler, no daemon, no production mutation: this is the policy state machine other layers must call. `autopilotRequiresPriorHumanAuthorization: true`, `automaticRecovery: false`, `learningPromoted: false` are frozen guarantees, not defaults.