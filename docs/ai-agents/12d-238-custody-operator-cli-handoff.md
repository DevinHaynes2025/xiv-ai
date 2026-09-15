# 12D-238 — Custody Operator CLI (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/custody-session.cli.ts` + 11/11 focused
tests + strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review; two refusal-message mismatches caught by the suite and paid
down — see below). GROK_XAI PENDING — never fabricated.

## What it is

The human adoption layer for the custody stack (12D-233 registry · 12D-236
durable journal · 12D-237 session). One explicit action per invocation,
operator-invoked, non-daemonic, LOCAL plane only:

```
--action=open      --journal=<path> --seed=<seed> --mode=bootstrap|resume
--action=register  ... --receipt-sha256=<64hex> --purpose=<p> --registered-by=<who>
                       --issued-at-ms=<int> --registered-at-ms=<int>
--action=consume   ... --receipt-sha256=<64hex> --purpose=<p> --now-ms=<int>
--action=show      --journal=<path> --seed=<seed>          (resume-only)
```

Fail-closed by construction:

1. **The CLI NEVER generates receipts.** A guardrail audit test pins that the
   source contains no `randomBytes`, no `generateKeyPair`, no `createHash` —
   the operator computes the sha256 out of band and passes the 64-hex digest.
2. **The mode is EXPLICIT on every mutating action** — `bootstrap|resume`,
   never inferred (12D-237 refuses the ambiguous middle; this CLI never picks
   one for the operator). `show` is resume-only regardless of `--mode`.
3. Strict arg parsing: `--key=value` only; unknown, duplicate, empty-key, or
   malformed arguments refuse; unknown actions refuse with the action list.
4. Receipts and timestamps are shape-checked (64-hex, safe integer) BEFORE
   any journal write — a refused call leaves the journal file absent.
5. Every packet carries the honest flags (`humanDecision: 'REQUIRED'`,
   `remoteCalls: 0`, `modelCalls: 0`, `learningPromoted: false`,
   `automaticRecovery: false`, `billionUsersProven: false`,
   `ciStatusClaimed: 'not claimed'`); a refusal prints an error packet to
   stderr and exits 2 — never a silent success.
6. A register packet discloses verbatim: "registration is not issuance proof
   — authenticity is the operator's out-of-band custody".

`runCustodyCli(argv)` is a pure exported surface (tests hit it directly);
`mainCustodyCli` adds stdout/stderr + exit code and is guarded by an
`import.meta.url` check so an import never executes the CLI.

## Defects found and paid down during this story

- **(guardrail-audit self-match, caught by the audit itself):** the source
  audit asserted the CLI text lacks a generation flag — but the audit matched
  the audit's own mention in a module comment. The comment was reworded (the
  audit assertions stay; the forbidden literals are genuinely absent).
- **(fixture, pins real semantics):** `--=v` (empty key) refuses with the
  generic `--key=value` message rather than a "malformed key" one — the
  refusal exists; the test now pins the actual message.

## Exact files

- `services/ai/runtime/offline-team/custody-session.cli.ts` (new)
- `services/ai/runtime/offline-team/custody-session.cli.test.ts` (new, 11 tests)
- `services/ai/package.json` (`test:12d-238`, `typecheck:12d-238`)
- `.gitlab-ci.yml` (`typecheck:12d-238`, `test:12d-238` appended)
- `docs/ai-agents/12d-238-custody-operator-cli-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-238      # 11/11 pass
npm run typecheck:12d-238 # exit 0 (strict)
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation occurred in this story. The commit stages ONLY the
five files above and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.