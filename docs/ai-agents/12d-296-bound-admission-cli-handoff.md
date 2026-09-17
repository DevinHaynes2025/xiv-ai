# 12D-296 — Bound-admission CLI handoff (the operator's executor surface for the adopted door)

Status: COMMITTED on `claude/12d-99-supervised-local-worker` (worktree `C:\Users\Devin\xiv-build-12d-99`), pushed to the **gitlab** remote.
Date: 2026-09-17.
Follows 12D-295 (bound-admission adoption — 12D-278 is the ONLY reading-admission door). No new CEO decision required this rung: the CLI is the EXECUTOR surface of the already-approved adopted door, in the established 12D-238/12D-292/12D-294 CLI discipline.

## What this rung changed

`xiv-bound-admission.cli.ts` — the operator's command for admitting ONE
document through the adopted chain:

```
node xiv-bound-admission.cli.ts --queue=<path> --register=<path> --genesis=<genesis>
  --source=<id> --tenant=<id> --document=<id> --title=<title> --body=<path>
```

- **THE DIGEST IS RE-DERIVED, NEVER CLAIMED**: there is NO digest flag — the
  digest comes from the REAL `prepareDocumentStories` reading the body bytes
  on disk. An operator cannot state a digest.
- **PROVENANCE REQUIRED, NO BYPASS FLAG** (the 12D-295 adopted door): the
  CLI calls the REAL `admitReadingStories` with the register store, genesis,
  and claimed source id; the door re-derives the binding from the register
  chain bytes. `NO REGISTER, NO BINDING, NO ADMISSION` is structural.
- **THE CLI NEVER REGISTERS**: the register store it builds is READ-ONLY
  (`save` throws — registration is the separate supervised 12D-276 step).
- Door-level refusals travel as `BOUND_ADMISSION_REFUSED` packets with the
  door's own message verbatim (`ADMISSION REFUSED — ...`); exit 2.
- A measured, chain-validated register census (`readSourceRegisterEntries`)
  is taken BEFORE the queue is opened — a tampered middle register line
  refuses there, nothing admitted.
- LOCAL I/O only: queue + register + body from local disk; `modelCalls 0`,
  `remoteCalls 0`, no network primitive (source-level asserted).

## Files

- `services/ai/runtime/offline-team/xiv-bound-admission.cli.ts` (NEW) — policy `'12d-296-v1'`, exact 8-flag parser, `ReadOnlyRegisterStore`, packet types, `mainBoundAdmissionCli`, IS_MAIN guard.
- `services/ai/runtime/offline-team/xiv-bound-admission.cli.test.ts` (NEW, 11 tests) — parser discipline (arity, unknown/duplicate flag in-place, empty value, malformed ids, short genesis, unbounded title); the REAL loop (register file + body file → `BOUND_ADMITTED`, digest equality with `prepareDocumentStories`, claimable rows through the REAL queue); UNREGISTERED source refuses with the door's message and nothing written; TAMPERED register refuses (chain is the proof); malformed/non-array register file; unreadable body; oversize body by the ingest bound (100,000 chars); `ReadOnlyRegisterStore.save` throws; frozen guardrails; source purity.
- `services/ai/package.json` — `test:12d-296` / `typecheck:12d-296`.
- `.gitlab-ci.yml` — `typecheck:12d-296` + `test:12d-296` appended.

## Measured results (from `services/ai`)

- `npm run test:12d-296` → **11/11 pass**; `npm run typecheck:12d-296` → exit 0.
- Full chain regression re-run (109 suite entries): tsx suites via direct `node node_modules/tsx/dist/cli.mjs --test`, the 2 Python suites (12d-257/260) via npm — results in the commit message.

## Defects caught and paid down during the rung

- The unregistered-refusal fixture initially registered the claimed id (fixture bug — the door was right to admit); split into registered-id vs claimed-id so the refusal case genuinely claims an unregistered source.
- Unknown/duplicate-flag fixtures originally changed arity so the arity gate fired first; replaced one flag name in place at constant arity to hit the intended gate.
- The empty-value case is only reachable with exact arity via an empty string value (odd arity is caught by the arity gate first) — fixture adjusted; comment records why.
- Door refusals now travel as packets (catch + `refuse` with the door's message verbatim) instead of escaping as throws — matches the "refusals verbatim, exit 2" discipline.
- `ReadOnlyRegisterStore.save` signature fixed to satisfy the `ReadingSourceStore` interface (TS2554).

## Honest boundaries (unchanged)

- The CLI is local-plane only; it never fetches, never calls a model, never registers, never claims, settles, reviews, or activates.
- Honest flags: `humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `billionUsersProven: false`. 2,000,000 rows/database remains the only measured ceiling. CI never claimed passed (`ci_quota_exceeded` org quota); counts above are locally measured.

## Next candidates

1. **Blocked-item retry (highest priority):** apply the CEO's 2026-09-16 review decision to the SIX settled drafts via `.xiv-runtime/apply-ceo-review-2026-09-16.ts` — STILL classifier-blocked every attempt; retry each turn.
2. Read WSTG v4.2 (wstg.owasp.org, CC-BY-SA-4.0, confirmed this segment) through the 12D-283 cycle — next reading candidate of 98 registered unread.
3. Register-census shell refresh is already committed (12D-293); a bound-admission route+panel for the story shell is NOT appropriate (shell stays database-free — the 12D-273 lesson); instead consider a census-of-admissions view model (pure, view-only) if the CEO wants a shell surface.
4. The 12D-243/12D-245 operator questions (CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO authorization + credentials); GitHub Phase 1 lockdown (blocked on `! gh auth login`).