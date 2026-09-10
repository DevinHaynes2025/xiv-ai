# XIV 12D-08 — Thin Command Center / Architecture Reader Consumer

**Ticket:** 12D-08  
**Branch:** `grok/12d-08-arch-reader-consumer`  
**Worktree:** `C:\Users\Devin\xiv-ai-12d` only  
**Base:** `grok/12d-07-architecture-reader-ux` @ `502b8a0`  
**State:** research / feature branch — portable read-only consumer for Command Center / mobile  
**L4 / production auto:** false

## Scope

1. Wire read-only consumers of `buildArchitectureReaderView` / `buildCouncilQueueUxView` (12D-07)
2. Portable isomorphic-leaning TS under `services/ai/runtime/dimensional`:
   - `architecture-reader-consumer.ts` — Command Center / mobile-ready bundle (`mobileReady` payload + markdown/JSON/HTML)
   - `roster-duty-cycle-scheduler.ts` — optional duty-cycle plan stub (CAP 64, maxDuty 0.25, energy budget)
3. Artifact HTML/MD/JSON preview under `artifacts/12d08/`
4. **Product-lane follow-up:** wire `apps/mobile` `command-center` / `council` screens in the main `xiv-ai` checkout (not done here — avoid conflicting with product writers)

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
| bioCloningAllowed | false |
| alwaysOnInfiniteClonesAllowed | false |
| wormholesAreSparseSimulationPathwaysOnly | true |
| FOUNDER_TWIN_REPLICA_HARD_CAP | 64 |
| FOUNDER_TWIN_MAX_DUTY_CYCLE | 0.25 |

Twin ethics gates (`assertEthicsSafeCopy`) still reject physical-portal / quantum-advantage / valuation-theater copy. Wormholes = sparse SIMULATION pathways only.

## API sketch

```ts
import {
  buildArchitectureReaderConsumer,
  buildCommandCenterArchConsumer,
  planRosterDutyCycle,
} from './runtime/dimensional';

const bundle = buildArchitectureReaderConsumer({
  architectureSummary, // or architectureView
  councilSummary,      // or councilView
  roster,              // optional FounderTwinRoster
});
// bundle.mobileReady — cards / council top / duty status / banners
// bundle.html | markdown | json — local preview + transport
```

## Deliverables

| Module | Role |
|--------|------|
| `dimensional/architecture-reader-consumer.ts` | Thin read-only consumer of 12D-07 views |
| `dimensional/roster-duty-cycle-scheduler.ts` | Duty-cycle plan stub over twin energy budget |
| `dimensional/12d08.test.ts` | Contract tests |
| `dimensional/generate-12d08-artifacts.ts` | Local-browse artifact emitter |
| `artifacts/12d08/*` | HTML/MD/JSON consumer preview |
| `docs/operations/XIV_12D08_ARCH_READER_CONSUMER.md` | This doc |

## Product-lane wire (FOLLOW_UP)

Do **not** edit product `xiv-ai` checkout from this lane. Later:

1. Import `buildArchitectureReaderConsumer` (or `mobileReady` JSON) into Command Center / council screens
2. Prefer passing pre-built views/summaries so RN does not need `node:fs` export helpers
3. Keep `productionAutoApply: false` on all UI actions

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/12d08.test.ts
npx tsx runtime/dimensional/12d07.test.ts
npx tsx runtime/storyfactory/12d06.test.ts
npx tsx runtime/dimensional/generate-12d08-artifacts.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab.
