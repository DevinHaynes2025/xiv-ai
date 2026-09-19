# 12D-540/541 — World Bank primary enrollment + the apply run (1 decision)

Date: 2026-09-19 (24/7 build). Branch: `claude/12d-99-supervised-local-worker`.

## 12D-540 — World Bank School Enrollment, Primary (% net) (SE.PRM.NENR × the five CEO-named countries)

License gate re-measured fresh (CC BY 4.0 verbatim, 57th terms measure). A fresh batch was probed live from the publisher: SE.PRM.NENR VALID; ST.INT.RCPT.CD (tourism receipts) VALID as a spare; SH.STA.OWSH.ZS probed INVALID (publisher error id 120) and refused before any write. 5 rows → **1 draft AWAITING_REVIEW**, remoteCalls 0.

**Alternative-LLM ask resolved as already-measured (CEO direction 2026-09-19):** the declared local failover `qwen2.5:3b` was verified shipped by earlier rungs — 12D-386 pinned `declaredFallbackModels: ['qwen2.5:3b']` in `xiv-ollama-first-reader.ts` and `xiv-reading-multi-model-caller.ts`; 12D-397 added the `--declaredFailover` operator flag; 12D-400 pinned `selectCycleCaller`. Every reading rung (including this one) runs through that path (`cliDoorDeclaredFailover: true`), loopback only, remoteCalls 0, and the model smoke-tested OK on 127.0.0.1:11434. No new wiring rung was needed — none was fabricated.

## 12D-541 — apply run

1 draft (540:1) applied through the REAL worksheet → decisions → apply chain under the CEO's recorded blanket-trust approval VERBATIM; census DONE ×1. **Campaign all-time: 479 applied review decisions** (478 + 1). Zero AWAITING_REVIEW anywhere.

## Honest flags (pinned everywhere)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- New reading surfaces: ST.INT.RCPT.CD (tourism receipts, probed-valid spare — the natural next code); a further fresh family batch; more NTD datasets; new publishers; ledger current through 541.