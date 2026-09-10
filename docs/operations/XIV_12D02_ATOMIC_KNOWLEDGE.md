# XIV 12D-02 — Atomic Knowledge + Historical Memory Fabric

**Ticket:** 12D-02  
**Branch:** `grok/12d-02-datagene-historical-memory`  
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

"Data gene" is a **content-hash + schema + provenance** analogy. It is **not** biological DNA, cloning, or atomic-scale storage.

## Deliverables

| Module | Role |
|--------|------|
| `datagene.ts` | `createDataGene` with isomorphic FNV-1a content hash (no `node:crypto`) |
| `memory-shards.ts` | Sparse shards: device / enterprise / regional / global; device caps; `holdsGlobalBrain: false` always |
| `historical-bridge.ts` | Map historical/temporal refs → `PathwayEdge` + `evidenceScore`; OBSERVED / HYPOTHESIS / SIMULATION; ancient sources never auto-verify |
| `benchmarks.ts` | Ladder `[3,6,12,24,50,100]` stubs with metrics placeholders and `NOT_RUN` |
| `quantum-simulator.ts` | Local simulator stub; QPU `WAITING_PROVIDER`; `liveQpu: false` always |

## Vision boundaries

- Phones hold **compressed local shards**, not the global brain.
- Ancient / archaeological sources require curator verification and still never auto-verify into facts.
- Quantum results from the local stub are classical simulation placeholders — **no fake LIVE QPU**, no quantum-advantage claim.
- Benchmarks remain `NOT_RUN` until a real harness executes them.

## Tests

```bash
cd services/ai
npx tsx runtime/dimensional/dimensional.test.ts
npx tsx runtime/dimensional/12d02.test.ts
```

## Remotes

Push child branch to **origin (GitHub)** only. Do not force-push GitLab `xiv-12d` tip divergence.