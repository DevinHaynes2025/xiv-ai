# XIV AI 12D → 100D Dimensional Intelligence Fabric

**State:** research architecture / feature branch only  
**Production enabled:** no  
**Deployment:** none

## Purpose

Translate the XIV “100D” vision into testable software contracts. In this architecture, a dimension is a logical or semantic axis used by vectors, graphs, simulations, timelines, supply-chain states, organizations, geography, risk, finance, provenance, and other modeled variables. It is not a claim that XIV can create or enter physical dimensions.

The first engineering milestone is **12 logical dimensions**. The research API permits bounded experiments up to **100 dimensions** so algorithms can be evaluated before any production capability is considered.

## Core layers

1. **Dimensional state fabric** — bounded 1–100D vectors with explicit projection and validation.
2. **Neural pathway graph** — evidence-weighted graph edges and bounded path search. New connections remain hypotheses until their evidence threshold is met.
3. **Data genes** — content hashes + schema version + provenance. This borrows DNA vocabulary as a data-model analogy; it does not clone biological DNA.
4. **Historical/civilization memory** — provenance-aware ingestion can connect archaeological, historical, economic, scientific, geographic, and business datasets. XIV must distinguish source, interpretation, inference, and simulation.
5. **Hybrid compute router** — CPU, GPU, NPU, quantum simulator, and future verified QPU adapters behind capability checks. A quantum label does not establish quantum advantage.
6. **Pocket/edge brain** — devices hold authorized compressed shards, indexes, embeddings, policies, and small local models. The complete global brain is not assumed to fit on every handheld device.
7. **Federated storage** — local/edge/cloud/archive tiers use content addressing, sharding, deduplication, lineage, and policy-controlled synchronization instead of pretending to create trillions of independent databases.
8. **World/galaxy simulation spaces** — large digital-twin and scenario environments for business collaboration. These are virtual simulations, not physical portals.

## Silicon strategy

Adapters may target AMD, NVIDIA, ARM, Apple, Intel, Samsung, and generic standards. Hardware must pass detection, compatibility, performance, security, and reproducibility tests before receiving `verified=true`. No vendor is considered universally supported merely because its name appears in the architecture.

## 12D reference model

A first business simulation can use twelve axes such as time, geography, organization, product, supplier, customer, inventory, capacity, cost, cash, risk, and confidence/provenance. Different XIV universes can define alternate schemas while retaining the same dimensional contract.

## Lean Six Sigma quality loop

Every pathway should expose measurable quality: defect/error rate, latency, throughput, cost per task, evidence coverage, stale-data rate, false-link rate, reproducibility, and rollback success. Changes follow Define → Measure → Analyze → Improve → Control. Autonomous agents may recommend improvements but cannot silently promote experiments into production.

## Scale doctrine

The design should scale by **partitioning and abstraction**, not giant literal counters. Large logical neuron/pathway counts are represented by sparse graphs, hierarchical indexes, compressed representations, and lazily materialized nodes. Historical datasets are stored once when possible and referenced through immutable content identities.

## Research gates

Before 12D leaves research state:

- deterministic unit tests pass;
- dimension and memory bounds are enforced;
- unverified hardware is rejected;
- provenance survives ingestion and projection;
- offline shards respect authorization and residency policy;
- quantum-simulator results are labeled as simulations;
- no claim of atomic-scale storage, biological DNA cloning, physical portals, or quantum advantage is surfaced as implemented capability;
- production authorization remains a separate human-governed control.

## Next build slices

1. ~~Add benchmark harnesses for 3D/6D/12D/24D/50D/100D sparse workloads.~~ (12D-03 local CPU runner)
2. ~~Connect historical provenance records to the existing temporal and historical runtimes.~~ (12D-02 historical bridge + atomic-memory ingest)
3. Add device capability adapters without marking vendors verified by default (GPU/NPU remain WAITING/DETECTED).
4. ~~Add an offline shard manifest and reconciliation protocol.~~ (12D-04 sync journal stubs — deepen real CRDT/manifest next)
5. Add a quantum-provider interface with a local simulator first and QPU adapters only after provider verification (simulator stub exists; QPU still WAITING_PROVIDER).
6. Add a 12D scenario UI to XIV Command Center that clearly labels observed facts, inferred links, and simulated futures.
7. Deepen Database City: real local SQLite shard fixtures + checksummed offline manifests (still no autonomous production DDL).
8. Wire governed builder (`OLLAMA`/`LOCAL_RULES`) to emit city blueprints into reviewable PR artifacts only.

## Build note — 12D-02 (Atomic Knowledge + Historical Memory)

Implemented on branch `grok/12d-02-datagene-historical-memory`:

- DataGene factory (`datagene.ts`) with isomorphic content hash; biological DNA cloning remains false.
- Sparse memory shards (`memory-shards.ts`); device/phone does not hold global brain.
- Historical/temporal bridge (`historical-bridge.ts`) with OBSERVED / HYPOTHESIS / SIMULATION separation; ancient sources never auto-verify.
- Dimension ladder benchmark stubs (`benchmarks.ts`) return `NOT_RUN` until executed.
- Local quantum simulator stub + QPU `WAITING_PROVIDER` (`quantum-simulator.ts`); no fake LIVE QPU.

See `docs/operations/XIV_12D02_ATOMIC_KNOWLEDGE.md`. L4 / production fabric remain false.

## Build note — 12D-03 (Local Dimension Benchmark Runner)

Implemented on branch `grok/12d-03-benchmark-runner`:

- Bounded CPU-only harness in `benchmarks.ts` executes ladder `[3,6,12,24,50,100]` measuring `projectPoint` + `findPathway`.
- Results marked `RUN` with latency/throughput; stubs remain `NOT_RUN` until harness runs.
- Lean Six Sigma counters: defects (honest 0), latency, throughput; evidenceCoverage / falseLinkRate / reproducibility stay `WAITING` when unmeasured.
- Never claims GPU/NPU/QPU VERIFIED without device receipt. L4 / production fabric remain false.

See `docs/operations/XIV_12D03_BENCHMARK_RUNNER.md`.

## Build note — 12D-03b (Governed Offline + Cloud Builder ingest)

Ingested CEO builder control-plane from GitHub tip `74e8fe5` (GitLab tip `7c34493` content-mirrored, distinct objects). See `docs/operations/XIV_12D03_GOVERNED_BUILDER.md`. All autonomousProduction* flags remain false.

## Build note — 12D-04 (Database City + Neural Highway Fabric)

Implemented on branch `grok/12d-04-database-city`:

- Topology device → local_shard → company_brain → regional_brain → global_brain
- Sparse neural highways; hot/warm/cold/archive memory heat
- Offline sync journal + MANUAL conflict stubs
- Vector LOCAL_STUB / WAITING_PROVIDER; GCP CLOUD_SANDBOX generate-only
- Pocket Brain vs Global Brain types; CPU-first silicon honesty
- L4 / production fabric remain false; no live production DDL

See `docs/operations/XIV_12D04_DATABASE_CITY.md`.
