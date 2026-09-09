# 62L-ES-HC3 — Cross-Vendor Chip Path Graph — Implementation Evidence Report

**Track:** 62L-ES Hybrid Compute Superbrain (HC) — GitHub **#165** (family #164)  
**Label:** `62L-ES-HC3`  
**Branch:** `cursor/62l-es-hc3-cross-vendor-chip-path-graph-4059`  
**Feat SHA:** `e3e5e67347984e2b4293717a2f7d17e5a6d01457`  
**Tip SHA:** `e3e5e67347984e2b4293717a2f7d17e5a6d01457`  
**Script:** `npm run test:62leshc3` (distinct from productization `test:62les3`)  
**L4_AUTONOMY_ENABLED:** `false`  
**tip-land / PR:** **NO**  
**DB candidates:** `NOT_APPLIED`

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

---

## Verdict

Real modules landed under `services/ai/compute-graph/` with focused tests. Hardware Truth Matrix + path graph + bottleneck evidence routing encode the HC3 honesty ladder. **AMD GPU remains NOT_TESTED / verification NO** in this environment (no fabricated VERIFIED). Soft-wires to HC1/HC2/ER34/Global Operations Brain park are presence probes only (presence ≠ VERIFIED).

---

## SoT access

| Source | Result |
|--------|--------|
| `gh issue view 165` | Unresolved (403/404) in this agent environment |
| Founder brief | Authoritative for this phase |
| GitLab mirror | MCP `needsAuth` — no issue number invented |

---

## Files created

| Path | Role |
|------|------|
| `services/ai/compute-graph/types.ts` | Truth ladder, vendors, locks, soft-wires, AMD probe |
| `services/ai/compute-graph/registry.ts` | Hardware Truth Matrix |
| `services/ai/compute-graph/path-graph.ts` | Workload → runtime → chip → eligibility |
| `services/ai/compute-graph/bottleneck-links.ts` | HC2 bottleneck class routing |
| `services/ai/compute-graph/evidence.ts` | Stale demotion / revalidation |
| `services/ai/compute-graph/index.ts` | Facade + cycle runner |
| `services/ai/compute-graph/phase62leshc3.test.ts` | Required honesty tests |
| `services/ai/package.json` | `test:62leshc3` script |

---

## Truth ladder (no skip)

`DOCUMENTED → DETECTED → SUPPORTED → VERIFIED`

Honesty states also encoded: `NOT_TESTED`, `DEGRADED`, `WAITING_NODE`, `WAITING_DATA`, `UNAVAILABLE`, `STALE`, `REVOKED`, `REVALIDATION_REQUIRED`.

**Tested:** `DOCUMENTED→VERIFIED` denied; one-step advances allowed.

---

## Vendors / matrix

Cross-vendor skeleton: **AMD, NVIDIA, INTEL, ARM, RISC_V, APPLE, QUALCOMM, FUTURE_ACCELERATOR** × CPU/GPU/NPU (same truth rule). AMD GPU skeleton defaults to **NOT_TESTED**.

---

## Soft-wires (existsSync; presence ≠ VERIFIED)

| Target | Present | Hop |
|--------|---------|-----|
| HC1 Hybrid Compute Home Base | YES | PASS |
| HC2 Chip Bottleneck Analyzer | YES | PASS |
| ER34 Capability Manifest | YES | PASS |
| Global Operations Brain | YES (`.wt-dh-final` park) | PASS — findings returnable when park lands in `services/ai` |
| HC1 / HC2 reports | YES | PASS |

Absent would map to **WAITING_DATA** (not FAIL).

---

## Tests run

```text
npm run test:62leshc3
# tests 9 / pass 9 / fail 0
```

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Truth-state skip ladder denied | PASS |
| 2 | Stale evidence demotes/blocks VERIFIED | PASS |
| 3 | Fallback ≠ accelerator VERIFIED | PASS |
| 4 | Tenant isolation — no cross-tenant path reuse | PASS |
| 5 | L4 false; AMD GPU not falsely VERIFIED | PASS |

---

## Hardware / environment honesty

| Claim | Status |
|-------|--------|
| AMD GPU VERIFIED | **NO** / `NOT_TESTED` |
| AMD GPU `/dev/kfd` | NOT_TESTED (absent) |
| NVIDIA/Intel/ARM/Apple/Qualcomm device VERIFIED on this node | **NOT_TESTED** (skeleton DOCUMENTED only) |
| Silicon modify | **NO** (locked) |
| Production authorization | **NO** |

---

## Findings → Global Operations Brain

Soft-wire locates ops-brain types in `.wt-dh-final/...` park. Cycle hop `global_operations_brain_soft_wire` = PASS (park present). Findings from this report are **returnable** when the Global Operations Brain module lands under `services/ai/local-brain/` — not auto-ingested here.

---

## Explicit non-claims / NOT_TESTED remaining

- Full production path-graph scheduler — **NO**
- Live multi-node chip inventory — **NOT_TESTED**
- AMD Software Acceleration Layer (ES4) — **next docs-only**
- Tip-land onto `xiv-v2` / main — **NO**
- PR / ManagePullRequest — **NO**

---

## Next (docs only)

**ES4 — AMD Software Acceleration Layer** — proprietary scheduling/batching/caching/quantization/model-selection/fallback intelligence for better use of **verified** AMD CPU/GPU/NPU hardware (still evidence-gated).
