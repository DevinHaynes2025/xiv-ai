# 12D-266 — Zero-Trust Escrow Gate (pure contract, rails designed-not-integrated) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-zero-trust-escrow-gate.ts` + 12
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-266` (node TAP
via tsx) = **12/12 pass**; `typecheck:12d-266` (strict tsc) =
**exit 0**. Sibling regressions: 12d-264 11/11 (the ledger this gate
complements). CI IS NOT CLAIMED PASSED (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review; two confirmed findings paid down
below). GROK_XAI review PENDING — never fabricated.

## What it is

The CEO-directed 12D-266 Zero-Trust Escrow Gate for the dual fiat &
crypto payout ledger, as a PURE, fail-closed contract module — the
Lock/Audit/Release shape, testable with zero money, zero rails, zero
credentials. This module moves NO money, holds NO credentials, calls
NO service, and touches NO chain
(`railsStatus: 'DESIGNED_NOT_INTEGRATED'`).

Structurally enforced properties:

- **DUAL TRACK**: every payout carries track `FIAT_USD` (integer minor
  units, 2 decimals) or `USDC` (integer minor units, 6 decimals) —
  integers only, never floats. A `BTC` track or a fractional amount
  refuses the lock.
- **LOCK is the only way in** — one lock per escrow; a re-lock, a
  foreign escrowId, or a nonpositive amount HOLDs.
- **AUDIT gates release**: release is impossible until BOTH injected
  verdicts pass — the local CISO scan verdict must be exactly `CLEAN`
  AND the arena judge verdict exactly `AUTHORIZED` (the 12D-258
  chain). Any other verdict, a near-miss (`'authorized'`), or garbage
  HOLDs the escrow with the audit recorded as failed.
- **APPROVAL_REQUIRED**: RELEASE and REFUND both demand a human
  approval event — valid approver id, nonblank approval ref, nonblank
  APPROVAL_REQUIRED signature. No signature, no release. A lawful
  exit RIDES IN the state (`approvalsRecorded >= 1` is enforced
  inside the state validator itself).
- **AMBIGUITY HOLDS**: unknown events, non-objects, and malformed
  payloads HOLD the escrow — the lock facts survive, nothing is ever
  released, and the module throws on nothing (HOLD is the failure
  mode).

## Defects found and paid down during this story

- **(adversarial self-review, CONFIRMED and fixed, twice)** the
  malformed-audit/approval paths originally THREW from inside the
  step, contradicting the documented "HOLD is the failure mode"
  contract — paid down by catching shape failures to HOLD, so the
  lock facts always survive a hostile payload.
- **(adversarial self-review, CONFIRMED and fixed)** the state
  validator accepted an impossible state — RELEASED with zero
  recorded approvals — because the exit-requires-approval invariant
  lived only in the separate helper. Paid down structurally: the
  invariant is enforced INSIDE `isEscrowGateState` (the 12D-263
  lesson applied), with a regression in the forged-state suite.

## The honest boundary

- `railsIntegrated: false`, `realFundsMoved: false`,
  `noCredentialsHandled: true` — the fiat rail (Stripe-Connect-like
  gateway) and the USDC smart-contract escrow are DESIGNED, NOT
  INTEGRATED. Integrating either is a future story requiring
  explicit CEO authorization, credentials only the CEO can create,
  and an explicit answer to the closed-beta-vs-public-hackathon
  question. No credential, key, token, or wallet is referenced
  anywhere in this story.
- The gate RECORDS injected verdicts and approvals — it never
  verifies who signed (the 12D-233/12D-264 disclosure carries over);
  cryptographic signature verification belongs to the future
  authorized rail-integration story.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false`.

## Exact files

- `services/ai/runtime/offline-team/xiv-zero-trust-escrow-gate.ts` (new)
- `services/ai/runtime/offline-team/xiv-zero-trust-escrow-gate.test.ts`
  (new, 12 tests — lawful happy path incl. terminal frozenness; fiat
  track minor units; release impossible from every pre-audit phase +
  terminal frozenness; missing/blank/absent signature and malformed
  approvals HOLD with zero approvals recorded; partial audits HOLD
  with lock facts preserved; HOLD → clean re-audit → lawful refund;
  unknown/malformed events HOLD; EMPTY ignores anomalies and never
  fabricates money facts; re-lock/foreign/fractional/BTC locks; 17
  forged-state refusals incl. the impossible exit-without-approval
  state; bad escrow ids; policy pins)
- `services/ai/package.json` — `test:12d-266`, `typecheck:12d-266`
- `.gitlab-ci.yml` — `typecheck:12d-266`, `test:12d-266` steps
- `docs/ai-agents/12d-266-zero-trust-escrow-gate-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-266  # RAN: exit 0
npm run test:12d-266       # RAN: 12/12 pass
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no external fetch, no install, no
credentials, no rail call of any kind, no funds moved. The commit
stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## CEO decisions still open (fail-closed, not acted on)

- The rail-integration story for the fiat gateway and the USDC
  escrow — requires explicit CEO authorization, CEO-held credentials,
  and the explicit answer to: closed beta, or public XIV Hackathon?
- PayPal sandbox config generation (12D-195) and the Apollo.io
  pilot — still frozen at the monetization checkpoint.
- GitHub Phase 1 lockdown — blocked on the CEO's `! gh auth login`.

## Next candidates

The 12D-247 custody-decision wire-verdict surface in the story shell,
pathway-evidence expansion feeding the 12D-264 ledger, and the open
12D-243/12D-245 operator questions.