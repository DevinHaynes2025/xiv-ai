# 12D-264 — Pathway Ledger (tamper-evident book of the brain) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-pathway-ledger.ts` + 11
adversarial tests). **TEST RUN DISCLOSED**: `test:12d-264` (node TAP
via tsx) = **11/11 pass**; `typecheck:12d-264` (strict tsc) =
**exit 0**. Sibling regressions: 12d-89 growth-engine contracts OK,
pathway-evidence-bridge 5/5 — all green. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; one
confirmed finding paid down below). GROK_XAI review PENDING — never
fabricated.

## What it is

The durable, tamper-evident book where reviewed pathway candidates
accumulate as EVIDENCE AWAITING HUMAN REVIEW — nothing is activated,
no weight mutates, no learning is promoted. It is the honest answer
to the CEO's "trillions of neural pathways" direction: the ledger
holds a CENSUS of exactly what has been earned, entry by entry, with
a hard per-ledger cap. A census reports ONLY measured counts and
remaining capacity — scale beyond what a ledger holds is a design
aspiration, never a claim (2,000,000 rows/database stays the only
measured ceiling).

Structurally enforced properties:

- **LEDGERED, NEVER ACTIVATED**: only eligibility-true candidates that
  already carry the operator's RECORDED human approval are appended —
  evaluated by the REAL 12D-89 growth-engine gate (evaluationScore ≥
  0.92, confidence ≥ 0.75, ≥2 distinct review refs, nonblank rollback
  ref). The ledger records that approval; it never verifies the
  approver, never performs an approval, and has NO activation path at
  all (guardrail `ledgeredNeverActivated: true`; the census's
  `activated` is the literal `0`).
- **TAMPER-EVIDENT**: every entry carries a sha256 digest chained over
  (genesis + prevDigest + canonical candidate JSON). Any edit, insert,
  or delete refuses the replay — a tampered ledger is never repaired.
- **EXACTLY ONCE per (pathwayId, version)**: re-registration refuses
  and writes nothing.
- **BOUNDED**: `maxEntriesPerLedger` (10,000) is a hard cap; the
  capacity guard fires BEFORE any line is parsed, and the N+1th
  append refuses the WHOLE append — the book never truncates
  silently. More capacity means more ledgers, never a lie about one.
- **INJECTED STORE**: the same shape as the 12D-236 custody journal —
  LOCAL plane only; there is no network sink.

## Defects found and paid down during this story

- **(adversarial self-review, CONFIRMED and fixed)** the exact-keys
  gate originally required all 13 candidate keys present in strict
  order, but `JSON.stringify` omits `undefined`-valued optional keys —
  so the ledger refused its OWN stored lines on replay (6/11 tests
  red). Paid down structurally: the gate now requires every key to be
  KNOWN, every required key PRESENT, and present keys in canonical
  `CANDIDATE_KEYS` order — only `parentPathwayId` may be absent.
  Unknown keys, missing required keys, and disorder still all refuse
  (the malformed-candidate suite covers all three). Digest
  recomputation was already consistent (the canonical replacer also
  omits undefined), so the chain was never weakened.
- **(design contradiction, fixed before commit)** the parser originally
  demanded `humanApproved === false` while the real growth-engine gate
  requires `=== true` — no candidate could ever ledger. Fixed to
  require the recorded approval with the honest disclosure: the
  ledger RECORDS an approval, it never verifies who approved.

## The honest boundary

- A ledger fed by an impostor records an impostor's candidates —
  ledgering is not proof (the 12D-233 disclosure carries over).
- The ledger authenticates bookkeeping, not the truth of the
  evidence; eligibility is delegated to the existing 12D-89 gate.
- `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `remoteCalls: 0`, `modelCalls: 0`, `collectsNothing: true`,
  `automaticRecovery: false`, `billionUsersProven: false` on every
  surface.

## Exact files

- `services/ai/runtime/offline-team/xiv-pathway-ledger.ts` (new)
- `services/ai/runtime/offline-team/xiv-pathway-ledger.test.ts`
  (new, 11 tests — happy path + census; exactly-once with
  write-nothing proof; version differentiation; ineligibility via the
  real gate; 17 malformed-candidate refusals; tamper-evident
  edit/insert/delete; foreign genesis; hard-cap refusal before any
  parse; measured-counts-only census; short genesis; policy pins)
- `services/ai/package.json` — `test:12d-264`, `typecheck:12d-264`
- `.gitlab-ci.yml` — `typecheck:12d-264`, `test:12d-264` steps
- `docs/ai-agents/12d-264-pathway-ledger-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-264  # RAN: exit 0
npm run test:12d-264       # RAN: 11/11 pass
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no merge, no
deployment, no learning promotion, no activation of anything, no
external fetch, no install. The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## CEO decisions still open (fail-closed, not acted on)

- 12D-266 dual payout rails (fiat + USDC escrow): the Zero-Trust
  Escrow Gate CONTRACT could be drafted as a pure fail-closed story,
  but no rails, no credentials, no external-service integration, and
  no beta/hackathon outreach without the CEO's explicit answer to the
  closed-beta-vs-public-hackathon question.
- PayPal sandbox config generation (12D-195) and the Apollo.io pilot
  — still frozen at the monetization checkpoint.
- GitHub Phase 1 lockdown — blocked on the CEO's `! gh auth login`.

## Next candidates

The 12D-266 escrow-gate contract (pure, fail-closed, no rails), a
wire-verdict surface for 12D-247 custody decisions in the shell, and
the open 12D-243/12D-245 operator questions.