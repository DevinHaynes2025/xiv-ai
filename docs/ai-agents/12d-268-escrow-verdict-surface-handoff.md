# 12D-268 — Escrow Verdict Surface (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-escrow-verdict-view.ts` + 12
adversarial tests + the `services/xiv-story-shell` escrow surface + a
12D-266 validator paydown disclosed below). **TEST RUN DISCLOSED**:
`test:12d-268` (node TAP via tsx) = **12/12 pass**; `typecheck:12d-268`
(strict tsc, also covering the 12D-266 gate + its suite) = **exit 0**;
`test:12d-266` (with the three new forged-state entries) = **12/12
pass**; `npm run build` in `services/xiv-story-shell` = **compiled
successfully** (route `/` static; `/api/ingest`, `/api/ingest/custody`,
`/api/ingest/escrow`, `/api/ingest/verdict` dynamic). Sibling
regressions (single tsx run): 54/54 across 12d-267 custody-decision-view,
12d-247 approval-custody, 12d-262 arena-verdict-view, 12d-242 wire
contract, 12d-254 shell view model. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; findings
below). GROK_XAI review PENDING — never fabricated.

## What it is

The operator's window into the Lock/Audit/Release ledger (12D-266):
drop an escrow gate state — `{escrowState}` — and the shell renders the
phase, the exact money facts in minor units, and the next gate the
state ALREADY requires, or an honest refusal. The surface RENDERS a
ledger state; it decides nothing and offers no affordance — a
human-signed approval event is the only exit, and it happens in the
custody stack, never through the shell.

## How it verifies (and what is DERIVED, never invented)

`buildEscrowVerdictViewModel(raw)` — pure, never throws — runs the REAL
12D-266 forged-state validator (`isEscrowGateState`, which now carries
the honest flags, money-fact/phase consistency, and BOTH impossible-exit
invariants INSIDE the validator) before anything renders. The next-gate
advisory is a pure function of the verified phase — the gate itself
already requires exactly what the advisory narrates; the view invents
nothing. Money facts stay minor units; the decimal display string is
integer arithmetic only (`Math.trunc` + remainder + zero-pad), so no
float rounding can enter at the display edge either. A refusal carries
ZERO escrow content — no escrowId, no payeeRef, no amount, no phase.

## Defects found and paid down during this story

- **(adversarial self-review, CONFIRMED and fixed)** the 12D-266
  validator refused a forged RELEASED state with zero recorded
  approvals (the 12D-266 paydown) but ACCEPTED a forged RELEASED /
  REFUNDED / AUDITED state with **zero passed audits** — an exit
  (and even the AUDITED phase itself) with no passed audit is
  impossible through `stepEscrowGate` (RELEASE requires phase AUDITED;
  AUDITED requires a passed audit), yet the validator let it through.
  Paid down structurally (the 12D-263 lesson, the audit half of the
  gate the 12D-266 paydown covered the approval half of):
  `isEscrowGateState` now requires `auditsPassed >= 1` for AUDITED,
  RELEASED, and REFUNDED. Regression: three new forged states in the
  12D-266 forged-state suite (all refuse), plus a view-level forged
  RELEASED-without-audit test in the 12D-268 suite.
- **(strict tsc, two runs)** the display type declared `railsStatus`
  the module return omitted (TS2322) — added; a multiline `as` cast
  (the 12D-267 lesson, avoided up front).
- **(caught by the suite on first run, disclosed)** the test helper
  built the LOCK event by spreading a partial — the exact-keys gate
  (correctly) held it, proving the order-sensitivity of the 12D-266
  contract works; fixed by building the event in the declared order.

## The honest boundary

- The view authenticates the STATE STRUCTURE, not the history — it
  proves the state is lawful, not that the events that produced it
  were (the gate records injected verdicts and approvals; it never
  verifies who signed — the 12D-266 residual verbatim).
- `railsIntegrated: false`, `realFundsMoved: false`,
  `railsStatus: 'DESIGNED_NOT_INTEGRATED'` — the shell renders a
  ledger state; no rail is touched, no funds move, no credential is
  referenced. The rail-integration story still requires explicit CEO
  authorization and CEO-held credentials (the 12D-266 open decision,
  unchanged).
- `humanDecision: 'REQUIRED'`, `modelCalls: 0`, `remoteCalls: 0`,
  `learningPromoted: false`, `automaticRecovery: false`,
  `billionUsersProven: false`, `collectsNothing: true`. The route
  handler reads the whole body before the module gates apply (the
  12D-259 disclosed residual carries over — same local-prototype
  scope).

## Exact files

- `services/ai/runtime/offline-team/xiv-escrow-verdict-view.ts` (new)
- `services/ai/runtime/offline-team/xiv-escrow-verdict-view.test.ts`
  (new, 12 tests — lawful AUDITED happy path incl. frozenness; the
  full chain to RELEASED/REFUNDED as terminal; EMPTY with no money
  facts, never fabricated; HOLD after a failed audit; exact
  minor-unit display incl. `0.000100` zero-padding; forged
  RELEASED-with-zero-audits PAYDOWN REGRESSION; forged
  RELEASED-without-approval 12D-266 regression via the view; tampered
  money fact; exact-keys gate; malformed submissions HOLD; no
  affordance in a verified view; policy/guardrail pins)
- `services/ai/runtime/offline-team/xiv-zero-trust-escrow-gate.ts` —
  the validator paydown (audit invariant inside
  `isEscrowGateState`; behavior strengthened; step semantics
  unchanged)
- `services/ai/runtime/offline-team/xiv-zero-trust-escrow-gate.test.ts`
  — three forged-state entries added to the forged-state suite
- `services/ai/package.json` — `test:12d-268`, `typecheck:12d-268`
- `.gitlab-ci.yml` — `typecheck:12d-268`, `test:12d-268` steps
- `services/xiv-story-shell/src/app/api/ingest/escrow/route.ts` (new)
- `services/xiv-story-shell/src/app/escrow-panel.tsx` (new)
- `services/xiv-story-shell/src/app/page.tsx` (mounts the escrow panel)
- `docs/ai-agents/12d-268-escrow-verdict-surface-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-268  # RAN: exit 0 (after the disclosed fixes)
npm run test:12d-268       # RAN: 12/12 pass
npm run test:12d-266       # RAN: 12/12 pass (incl. the 3 new forged states)
npm run build (xiv-story-shell)  # RAN: compiled, routes listed above
sibling run via tsx --test # RAN: 54/54 across the five suites named above
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no external fetch, no npm install,
no credentials, no rail call of any kind, no funds moved. The commit
stages ONLY the files above and never touches
`services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

Pathway-evidence expansion feeding the 12D-264 ledger (honest caps —
2,000,000 rows/database stays the only measured ceiling), the open
12D-243/12D-245 operator questions (fail-closed, not acted on), and
the rail-integration story for 12D-266 (BLOCKED on explicit CEO
authorization, CEO-held credentials, and the closed-beta-vs-public-
hackathon decision). GitHub Phase 1 lockdown remains blocked on the
CEO's `! gh auth login`.