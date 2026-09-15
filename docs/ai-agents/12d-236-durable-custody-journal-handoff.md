# 12D-236 — Durable Operator Custody Journal (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/operator-custody-journal.ts` + 13/13
focused tests + strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI
remains quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was
appended but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review; one live defect found by the suite and fixed — see below).
GROK_XAI PENDING — never fabricated.

## What it is

The "durable atomic replay store — a future, separately reviewed story" that
BOTH the 12D-121 instruction-adoption gate and the 12D-233 custody registry
disclose as their replay-protection residual. The custody registry's state
now survives a process restart:

1. **Apply-first journaling**: every custody op is applied through the 12D-233
   registry's own fail-closed gates BEFORE it is journaled — a refused op
   (replay, cross-purpose, out-of-order) never reaches the journal, so a
   journal replay can never diverge from the live contract.
2. **Independent tamper evidence**: each journal line carries its own
   hash-chained `journalDigest` over (genesis + prevDigest + op + canonical
   input) — the journal chain is verified independently of the registry's
   ledger. A swapped, edited, garbage, or oversized line refuses the replay.
3. **Fail-closed replay**: `replayCustodyJournal` replays ops IN ORDER through
   the registry contract, then requires `verifyLedger().ok` AND an
   op-for-op ledger match with the journal. ANY anomaly refuses the load —
   never auto-repaired (`automaticRecovery: false`).
4. **Atomic local-file store**: `FileCustodyJournalStore` writes a temp file
   and renames it over the journal, so a crash mid-write cannot leave a
   half-journal that silently loads; a missing journal reads as `null`
   (the caller decides what that means — no invented state).
5. **Generation continuity**: reload → extend → reload is regression-tested
   across three generations, including a consumed receipt from generation 1
   refusing replay attempts in generation 2.

It stays LOCAL-plane only: no remote calls, no multi-machine sync (two
processes writing separate journals have separate registries — single-writer
per journal file remains operator discipline, disclosed). The 12D-233
disclosures carry over verbatim: registration is not issuance proof; a
journal fed by an impostor records an impostor's ops; possession of the
journal file is not authorization. `humanDecision: 'REQUIRED'`,
`learningPromoted: false`, `billionUsersProven: false` on every surface.

## Defect found and paid down during this story

- **BLOCKING (self-review, live-reproduced via the failing suite):** the
  append path computed the new line's previous-digest by parsing only the
  LAST line with a two-argument call — the parser signature needs the
  PRIOR digest, so every append after the first mis-derived the chain head
  and the next append (or replay) refused with a digest mismatch. Fixed with
  a full chain walk in `appendCustodyOp` (every prior line is verified on
  each append — O(n) per op, honest for custody-scale volumes), not by
  weakening the parser. Suite now 13/13. (Also: an ESM-hostile `require` in
  the file store was replaced with a static `fs` import; a parser/local
  name collision (`entry`) was renamed to `parseJournalLine`.)

## Exact files

- `services/ai/runtime/offline-team/operator-custody-journal.ts` (new)
- `services/ai/runtime/offline-team/operator-custody-journal.test.ts` (new)
- `services/ai/package.json` (`test:12d-236`, `typecheck:12d-236`)
- `.gitlab-ci.yml` (`typecheck:12d-236`, `test:12d-236` appended)
- `docs/ai-agents/12d-236-durable-custody-journal-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-236      # 13/13 pass (0 fail), exit 0
npm run typecheck:12d-236 # exit 0 (strict)
npm run test:12d-233      # sibling custody registry suite, 13/13, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no production mutation, no merge, no
deployment, no learning promotion, no Ollama/provider invocation occurred in
this story. The local commit stages ONLY the five files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.