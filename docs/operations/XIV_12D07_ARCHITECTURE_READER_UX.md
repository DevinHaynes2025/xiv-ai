# XIV 12D-07 — Architecture Reader + Adaptive Council UX

**Ticket:** 12D-07  
**Branch:** `grok/12d-07-architecture-reader-ux`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Base:** `grok/12d-06-adaptive-story-council` @ `3f336bdb`  
**State:** research / feature branch — read-only UX layer for Command Center / mobile  
**L4 / production auto:** false

## Scope

Hardened **read-only** views over existing contracts:

1. `buildArchitectureReaderSummary` → markdown + JSON + HTML for topology
2. Adaptive Council ranked queue → scores across all debate axes (never auto-apply production)
3. Optional local-browse artifacts under `artifacts/12d07/`

## Guardrails

| Flag | Value |
|------|-------|
| readOnly | true |
| productionAutoApply | false |
| productionAutoMerge | false |
| productionAutoDeploy | false |
| destructiveDbAutoApply | false |
| crossTenantDataCopyAllowed | false |
| L4_PRODUCTION_ENABLED | false |
| cloudAgentsDefaultWaitingIfUnbound | true |
| VALUATION_THEATER_ALLOWED | false |
| UNIVERSES_ARE_SIMULATION_LAYERS_ONLY | true |

Twin ethics gates (`assertEthicsSafeCopy`) still reject physical-portal / quantum-advantage / valuation-theater copy.


## Founder Twin roster (ethics remount)

| Constant | Value |
|----------|-------|
| FOUNDER_TWIN_REPLICA_HARD_CAP | 64 |
| FOUNDER_TWIN_ACTIVE_SHARD_CAP | 128 |
| FOUNDER_TWIN_ENERGY_BUDGET_PER_CYCLE | 1000 |
| FOUNDER_TWIN_MAX_DUTY_CYCLE | 0.25 |
| FOUNDER_TWIN_SPARSE_PATHWAY_CAP | 32 |
| bioCloningAllowed | false |
| alwaysOnInfiniteClonesAllowed | false |
| wormholesAreSparseSimulationPathwaysOnly | true |

"DNA / trillions of Devin" language maps to **digital-twin replicas + compressed shards** (capped, duty-cycled) — never biological cloning or always-on infinite clones. Wormholes = sparse SIMULATION pathways only.

## Debate score axes (council UX)

`customerValue`, `technicalRisk`, `cost`, `security`, `dependencies`, `evidenceQuality`

## Provider honesty

| Seat | UX behavior |
|------|-------------|
| LOCAL_RULES | Always READY |
| OLLAMA | OPTIONAL_OFFLINE when unreachable |
| GROK / CHATGPT / GEMINI | WAITING_PROVIDER when unbound — shown explicitly in ranked rows |

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/architecture-reader.ts` | Hardened markdown/JSON/HTML views + export (incl. `.html`) |
| `storyfactory/adaptive-council-ux.ts` | Read-only ranked council queue UX |
| `dimensional/12d07.test.ts` | Contract tests |
| `artifacts/12d07/*` | Local-browse markdown/JSON/HTML samples |
| `dimensional/founder-twin-roster.ts` | Digital-twin roster hard CAP + energy budget (no bio cloning) |
| `docs/operations/XIV_12D07_ARCHITECTURE_READER_UX.md` | This doc |

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d07.test.ts
npx tsx runtime/storyfactory/12d06.test.ts
npx tsx runtime/dimensional/12d05.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
