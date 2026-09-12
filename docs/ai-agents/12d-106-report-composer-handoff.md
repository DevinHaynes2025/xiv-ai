# 12D-106 — Governed Report Composer with Grammar + Honest-Claims Gate (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO-directed grammar and reports scope.

## What it is

`composeReport(input)` builds bounded, deterministic reports from evidence-bearing sections. No model, no network — output is a pure function of its inputs, so a report can always be reproduced and audited.

## The grammar gate is also an evidence gate

Deterministic rules: `DOUBLE_SPACE`, `REPEATED_WORD`, `UNBALANCED_BRACKETS`, `NO_TERMINAL_PUNCTUATION`, `LOWERCASE_START`, and `BANNED_CLAIM` — the last flags reports asserting scale or access no receipt supports (e.g. "million users proven", "fully autonomous", "guaranteed profit"). `mode: 'CLEAN'` throws on ANY issue; `DRAFT` reports it. This is the report-layer enforcement of the honest-flags discipline: a report cannot ship "clean" while claiming unproven scale or platform access.

## Verification

6/6 tests (`test:12d-106`): deterministic composition + honest flags; each grammar rule catches its own defect; banned-claim detection; CLEAN-rejects/DRAFT-reports behavior; bounded inputs (title/heading/body/sections/evidence refs); frozen guardrails (`generatedByModel: false`, `modelCalls: 0`). `typecheck:12d-106` PASS. Wired into `.gitlab-ci.yml`.

## Trust limits

The composer never generates content — it only structures and gates text a caller supplies. `humanDecision: REQUIRED` on every packet.