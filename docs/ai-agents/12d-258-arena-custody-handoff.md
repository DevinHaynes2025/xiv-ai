# 12D-258 — Arena Custody Wiring (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-arena-custody.ts` + 12 adversarial
tests). **TEST RUN DISCLOSED**: `test:12d-258` (node TAP via tsx) =
**12/12 pass, first run**; `typecheck:12d-258` (strict tsc) = **exit 0**;
sibling regressions: all 18 sibling suites green (188 tests, 0
failures — 12d-233 13/13, 12d-236 13/13, 12d-237 12/12, 12d-238
11/11, 12d-239 13/13, 12d-240 13/13, 12d-241 13/13, 12d-242 14/14,
12d-244 14/14, 12d-247 12/12, 12d-248 7/7, 12d-249 9/9, 12d-250 8/8,
12d-251 7/7, 12d-252 8/8, 12d-253 13/13, 12d-254 7/7, 12d-256 9/9).
200 tests total including 12D-258's 12. CI IS NOT CLAIMED PASSED
(`ci_quota_exceeded`). Reviewers: CLAUDE_CODE (self-review; fixes
below). GROK_XAI review PENDING — never fabricated.

## What it is

The bridge the CEO's original 12D-253 Arena spec demanded — "ONLY the
Judge can output the final 12D-241 packet into the custody journal" —
closed at last: `xiv-arena-custody.ts` is the ONE module that takes a
completed 4-Agent debate and lands its verdict in the operator
custody chain (12D-233 registry + 12D-236 hash-chained journal).

`journalArenaVerdict(opts)` with exact keys
`['registry','store','journalGenesis','transcript','packet','registeredBy','nowMs']`
IN ORDER:

1. Verifies the FULL transcript (hash-chain replay — any tamper
   refuses before anything is registered or journaled).
2. Gates consensus — AUTHORIZED only; an exhausted debate, an abort,
   or any HUMAN_DECISION_REQUIRED state refuses.
3. `deriveArenaReceipt` (12D-253) re-verifies the 12D-241 packet and
   requires the judge CONSENSUS step to bind exactly this packetId —
   the receipt cryptographically binds packetId ← transcriptDigest.
4. Registers the receipt through `appendCustodyOp(..., 'register',
   ...)` under the FIXED purpose `xiv-os-arena-consensus` (registry
   FIRST — 12D-236 discipline: a refused op is never journaled), with
   `issuedAtMs = registeredAtMs = nowMs`.
5. Returns a frozen verdict record
   `{policyVersion, transcriptDigest, packetId, arenaReceipt, purpose,
   registeredBy, registeredAtMs, guardrails}`.

`verifyArenaVerdictRecord(record, sources)` re-derives the record from
its transcript+packet on a throwaway registry (no journal side
effects) and byte-compares every field — a tampered, stale, or
foreign-transcript record refuses.

## What it does NOT do (the honest boundary)

- **Register-only, never consumes**: the receipt lands in the custody
  chain as EVIDENCE that a consensus was reached; authentication /
  single-use consumption stays the operator's out-of-band action
  (12D-233). Nothing here approves anything.
- **AUTHORIZED means ready for human review** — never auto-approved.
  `humanDecision: 'REQUIRED'`, `learningPromoted: false`,
  `modelCalls: 0`, `remoteCalls: 0`, `billionUsersProven: false`.
- Registration is not issuance proof and the arena authenticates the
  STRUCTURE of consensus, not the honesty of the agents (verbatim
  carry-overs of the 12D-233/12D-253 residuals, disclosed in the
  module header).
- The custody journal remains single-writer-per-file (operator
  discipline).

## Defects found and paid down during this story

- **(strict tsc, two passes)** `verifyArenaVerdictRecord` read
  `record.policyVersion`/`record.packetId` off a value narrowed only
  to `object` (TS2339 ×3) — fixed with a `Record<string, unknown>`
  read after the exact-keys gate; the packetId seed now falls back to
  a constant string unless the field is a string (bogus packetIds
  then fail the re-derivation mismatch anyway, fail closed).
- **(strict tsc, test side)** the tampered-packet fixture assigned the
  readonly `headline` (TS2540) — fixture now parses to a writable
  shape.
- **(adversarial self-review)** the judge-step forgery in the
  tampered-transcript test keeps the chain internally consistent, so
  the replay refuses on the FINAL `headDigest` check — the test regex
  covers it; the refusal ordering (chain replay → gate → receipt
  binding → registry) is asserted end-to-end by the "nothing
  journaled" checks in every refusal test, proving the 12D-236
  registry-first discipline holds through this bridge.

## Exact files

- `services/ai/runtime/offline-team/xiv-arena-custody.ts` (new)
- `services/ai/runtime/offline-team/xiv-arena-custody.test.ts`
  (new, 12 tests — happy path with a real `FileCustodyJournalStore`
  on tmpdir + `replayCustodyJournal` cross-check + a real
  `authenticate` on the replayed ledger)
- `services/ai/package.json` — `test:12d-258`, `typecheck:12d-258`
- `.gitlab-ci.yml` — `typecheck:12d-258`, `test:12d-258` steps
- `docs/ai-agents/12d-258-arena-custody-handoff.md` (this file)

## Exact commands and local results

```
npm run typecheck:12d-258 # RAN: exit 0
npm run test:12d-258      # RAN: 12/12 pass
```

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no production
mutation, no merge, no deployment, no learning promotion, no external
fetch, no install. The commit stages ONLY the files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.

## Next candidates

The FastAPI route layer (authorized `pip install` still pending),
real-packet ingestion into the story-shell, and the open
12D-243/12D-245 operator questions. The GitHub Phase 1 lockdown
remains blocked on the CEO's `! gh auth login`.