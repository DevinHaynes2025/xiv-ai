# 12D-418 — go-live readiness: the measured record vs. the remaining gates

Date: 2026-09-18 (24/7 build; CEO direction "prepare to go live"). This rung PREPARES — it deploys nothing.

## What the OS can measure about itself today (all REAL, all committed)

- **Reasoner**: Ollama loopback 127.0.0.1:11434; pinned primary `qwen2.5-coder:7b`, declared fallback `qwen2.5:3b` (12D-385/386); CLI operator door `--declaredFailover` (12D-397/400). remoteCalls 0 everywhere; TOP_SECRET/CONFIDENTIAL never leaves the machine.
- **Campaign (backend)**: 6 verified publisher surfaces (World Bank, CFPB, data.gov, FTA/NTD ×3 datasets, GTFS standard); **314 applied review decisions all-time**, 2 drafts AWAITING_REVIEW; every queue census-verifiable by the REAL doors (`xiv-os-status`, NEW 12D-417 `xiv-reading-campaign-census`).
- **Frontend**: premium workspace screens — OS Status, Verified Sources, Brain Health — honest-discipline idiom (the app renders measured facts, never invents counts). mobile tsc 0.
- **Integrity**: offline-team **1,532/1,532** tests; fail-closed proofs measured live at every gate (register title bound ×2, chunker block bound ×4, draft budget, reviewRef 256, apply idempotency, publisher 404/403 honored).
- **Honest flags**: pinned on every packet — `humanDecision REQUIRED`, `learningPromoted false`, `activated 0`, `collectsNothing true`, `automaticRecovery false`, `billionUsersProven false`.

## What "go live" still requires (named gates, NOT blockers to route around)

1. **Deployment target + distribution** — CEO-gated: no deploy/merge/cloud action has ever run from the build loop. Going live needs the CEO to name the target (device install path, server), and that naming is the gate.
2. **A second operator** — the review chain is built for it (reviewer decisions are hash-bound and receipt-verified); "go live" with one reviewer means blanket-trust approvals, which stay DISCLOSED as blanket forever.
3. **Service continuity** — Ollama is a local single point of failure; the failover chain is local-only by standing constraint. Remote reasoning for non-secret work is authorized in principle by the CEO but no remote model is declared into any policy (declaredFallbackModels carries only local models).
4. **Data-surface expansion** — the campaign drills publisher-by-publisher; "trillions" is VISION. Every new surface = license-gate-first rung.
5. **The declined element stands**: no network attacking, ever, without written authorization from a target's owner.

## Honest flags (pinned)

`humanDecision: 'REQUIRED'`, `learningPromoted: false`, `activated: 0`, `collectsNothing: true`, `automaticRecovery: false`, `billionUsersProven: false`. remoteCalls 0. 2,000,000 rows/database is the only measured ceiling.

## Next candidates

- Land the pending set (412 apply + ledger + pill + 417 census CLI + this readiness record).
- 12D-413/415/416 drill runs (drivers written).
- A mobile readiness surface rendering this packet's measured-vs-gates split (12D-419 candidate).