# XIV 12D-03 — Local Dimension Benchmark Runner

**Ticket:** 12D-03  
**Branch:** `grok/12d-03-benchmark-runner`  
**Base:** `grok/12d-02-datagene-historical-memory`  
**State:** research / feature branch only  
**L4 production:** false  
**Production dimensional fabric:** false

## Honesty gates (unchanged)

| Flag | Value |
|------|-------|
| CURRENT_DIMENSIONAL_MILESTONE | 12 |
| RESEARCH_DIMENSION_CEILING | 100 |
| PRODUCTION_DIMENSIONAL_FABRIC_ENABLED | false |
| PHYSICAL_PORTAL_CAPABILITY | false |
| ATOMIC_SCALE_STORAGE_CLAIM | false |
| BIOLOGICAL_DNA_CLONING_CAPABILITY | false |

## Deliverables

| Module | Role |
|--------|------|
| `benchmarks.ts` | Bounded local CPU runner for ladder `[3,6,12,24,50,100]`; measures `projectPoint` + `findPathway` latency/throughput; marks `RUN` with timings |
| Lean Six Sigma counters | `defects`, `latencyMs`, `throughputOps`, `evidenceCoverage` (+ falseLink/reproducibility) — honest `0` / measured / `WAITING` |
| Backend claim | Always `cpu` for this harness; never GPU/NPU/QPU `VERIFIED` without device receipt |

## Behavior

- `createDimensionLadderBenchmarks()` still returns `NOT_RUN` stubs.
- `runDimensionBenchmarks()` / `runSingleDimensionBenchmark()` execute on CPU only and return `status: 'RUN'`.
- `evidenceCoverage` / `falseLinkRate` / `reproducibility` stay `WAITING` until measured end-to-end.
- No production promotion; research fabric only.

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/dimensional.test.ts
npx tsx runtime/dimensional/12d02.test.ts
npx tsx runtime/dimensional/12d03.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab `xiv-12d` tip divergence.