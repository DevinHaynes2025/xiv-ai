# 62L-EM9 — Compute Resource Market Simulator Report

Status: **IMPLEMENTED on child branch** — unit tests **executed** — simulation **≠** execute — **NOT** a live ASUS/cloud pricing verification pass — **NOT** production authorization — no tip-land / PR / DB apply / autonomous purchase

Date: 2026-09-09

## Source of truth

- Founder queue title: **62L-EM9 — Compute Resource Market Simulator**
- User story: simulation layer that compares local, edge, and authorized cloud compute options so agents can choose the best route **before** spending resources

## Predecessor / base

| Field | Value |
| --- | --- |
| Preferred EM8 (rebased) | `cursor/62l-em8-compute-return-receipt-4059` @ `fd86ee06efb86efc94b21c05076bf88034068c8d` |
| Prior stale base avoided | `84cd6f3…` (pre-EM8-receipt tip) |
| EM7 | tip `0fee604…` exists; device-neutral router **ABSENT** on interim EM8 tip (EM8 still rebasing toward EM6/EM7) |
| EM6 / EM3 newer tips | available (`5301b7c…` / `eb6e963…`) but EM8 interim preferred per order |
| EM3 on this tip | Universal Compute Registry **PRESENT** |
| EM8 on this tip | Compute return receipts **PRESENT** |
| EL9 | Resource Governor **PRESENT** |
| Working branch | `cursor/62l-em9-compute-resource-market-simulator-4059` |
| Tip SHA | `16b95fbe7c12d5f641163ecb771ec9d8e18a1da2` |
| Rebase | **YES** — onto EM8 `fd86ee0` |
| Tip-land / PR | **NO** |

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **Simulation does not execute the workload**
- Recommend ≠ execute; consequential recommend → human/policy gate
- Never fabricate cloud prices or available capacity → `UNKNOWN`
- No autonomous purchasing or provisioning
- Cheapest ≠ automatically best; privacy / correctness / reliability first
- Local/private workloads: strong locality preference when technically suitable
- `NOT_TESTED` may appear as research candidate; **cannot** be recommended as verified production route
- Historical benchmarks require timestamps
- Quantum-inspired hook compares against classical baseline; **no advantage claim**
- Guardian / RLS / tenant / Universe boundaries intact
- DB candidates: **NOT_APPLIED**

## Core flow (encoded)

`Task → eligible verified nodes → simulate candidate routes → score tradeoffs → recommend route → human/policy gate if consequential → execute separately`

## Compare dimensions

CPU/GPU/NPU availability, model compatibility, measured latency, throughput, RAM/VRAM requirements, reliability history, privacy/locality fit, network dependence, energy proxy, estimated cost, queue delay, data-egress impact, fallback quality

## Candidate return fields

`nodeId`, `device`, `verificationState`, `estimatedLatency`, `estimatedCost`, `privacyScore`, `reliabilityScore`, `energyProxy`, `queueEstimate`, `confidence`, `evidenceRefs` (+ lane, classicalScore, measuredCapacity)

## Modules

| Module | Role |
| --- | --- |
| `local-runtime/compute-resource-market-simulator-types.ts` | Contracts |
| `local-runtime/compute-resource-market-simulator.ts` | Estimate-only market sim + classical scoring + gates |
| `local-runtime/em9-honesty.ts` | EM9 locks |
| `local-runtime/em9-soft-wire.ts` | Soft-wire EM3 / EM7 / EM8 / EL9 (+ classical baseline) |
| `local-runtime/__tests__/phase62lem9.test.ts` | Acceptance tests |
| `package.json` → `test:62lem9` | Test entry |

## Soft-wire (post-rebase onto EM8 `fd86ee0`)

| Target | Result |
| --- | --- |
| EM3 `universal-compute-registry.ts` | **PRESENT** |
| EM3 honesty | **PRESENT** |
| EM7 device-neutral router | **ABSENT** (honest; EM8 interim tip not yet rebased onto EM7) |
| EM7 honesty | **ABSENT** |
| EM8 `compute-return-receipt.ts` | **PRESENT** |
| EM8 honesty / soft-wire | **PRESENT** |
| EL9 `resource-governor.ts` | **PRESENT** |
| Classical quant baseline | **PRESENT** |

Presence soft-wire does **not** imply EM7/EM8 VERIFIED or production authorization.

## Rules tested (all PASS)

| Rule | Result |
| --- | --- |
| Simulation ≠ execute; recommend ≠ execute | **PASS** |
| UNKNOWN when pricing/capacity unavailable; no fabricated cloud prices | **PASS** |
| No autonomous purchasing / provisioning | **PASS** |
| Local/private locality preference; cheapest ≠ auto-best | **PASS** |
| Privacy/correctness/reliability before cost | **PASS** |
| NOT_TESTED research vs verified production recommend split | **PASS** |
| Historical benchmarks require timestamps | **PASS** |
| Guardian/RLS/tenant/Universe boundaries | **PASS** |
| Quantum-inspired hook vs classical baseline; no advantage claim | **PASS** |
| Soft-wire EM3+EM8+EL9; EM7 ABSENT-ok; L4=false | **PASS** |
| Consequential recommend → human/policy gate | **PASS** |
| Candidate return fields present | **PASS** |

## Tests (executed post-rebase)

```bash
cd services/ai && npm run test:62lem9
```

| Command | Result |
| --- | --- |
| `npm run test:62lem9` | **PASS** — 13/13 |

## NOT_TESTED inventory

| Item | State |
| --- | --- |
| Founder ASUS live market simulation | **NOT_TESTED** |
| Live AMD GPU/NPU route pricing | **NOT_TESTED** |
| Live NVIDIA workstation capacity quotes | **NOT_TESTED** |
| Authorized edge federation live quotes | **NOT_TESTED** |
| Authorized cloud GPU live quotes | **NOT_TESTED** |
| EM7 router on this interim EM8 tip | **ABSENT** |
| EM8 live Home Base ingest / production | **NOT_TESTED** |
| Production authorization / tip-land / PR | **false** / not created |

## Next (do not implement here)

**EM10 — User Access Economy** — Free → Consumer/Pro → Business → Enterprise access model while keeping useful XIV functionality available to broad audiences.
