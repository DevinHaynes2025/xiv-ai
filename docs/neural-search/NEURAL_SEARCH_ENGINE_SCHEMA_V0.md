# Neural Search Engine v0.1 — Schema + Honesty Labels

**Owner:** Neural Search Lead  
**Partners:** Blue Brain · XIV Superbrain · Data City (downstream) · Neural Brain Ops  
**Plane:** LOCAL-first · Pocket Brain / ADC retrieval  
**Motifs:** Quantum + ancient-Egyptian = `RESEARCH_HYPOTHESIS|SIMULATION|METAPHOR_ONLY` ONLY — never quantum-advantage, QPU VERIFIED, or mystical-tech claims  
**Aligned to:** 12D-13 ADC offline read-path · 12D-15 Blue Brain LOCAL surface · Pocket Brain cells index 12D-10→15  
**Status:** SCHEMA v0.1 (Lab deltas folded) — implementation = **WAITING_CODE_SLICE** (idle)

### Changelog v0 → v0.1 (Lab deltas)
1. **`requireSealed` fail-closed** — when true, unsealed / missing tipSha cells are excluded; never soft-include  
2. **Multi-hop stop on `GATE_DENIED`** — append `HopTrace`, halt further hops (no resume/skip)  
3. **`scopeId` bleed deny** — hits outside query `scopeId` are denied; cross-scope neighbor walk forbidden  
4. **`MIXED` / `CLOUD_SANDBOX` no auto-pull** — cloud/mixed never auto-fetches remote corpus; explicit pull approval required or stay LOCAL shard only  

---

## 1. Purpose

LOCAL-first retrieval over Atomic Data Cells (ADC) for Pocket Brain / Blue Brain / Superbrain hops.  
Return evidence-linked hits with honesty labels — never invent tip SHAs, metrics, or seal grades.

---

## 2. Locked contracts (from Blue Brain + Superbrain)

| Rule | Value |
|------|-------|
| Preferred execution | `LOCAL` / `OFFLINE_PREFER_LOCAL` |
| Cloud / MIXED | Allowed as plane label only; **no auto-pull** of remote corpus (v0.1) |
| Production auto | false |
| Policy Gate | **in front** of every retrieval hop; bypass forbidden |
| Multi-hop on deny | **stop** — record `HopTrace`, do not continue (v0.1) |
| mayEnterGlobalBrain | false (v0.1) |
| liveCloudSyncClaimed | false |
| scope bleed | **deny** — `scopeId` isolation (v0.1) |
| ADC scale | `aspirational` vs `measured` — never conflate |
| Motif claims | `RESEARCH_HYPOTHESIS` \| `SIMULATION` \| `METAPHOR_ONLY` only |
| Accelerators | CPU may be VERIFIED; GPU/NPU/QPU = `UNVERIFIED` \| `DETECTED` \| `WAITING_PROVIDER` — DETECTED ≠ VERIFIED |
| Vector ingest | Pocket index may be `WAITING_POCKET_BRAIN_INGEST` / `WAITING_OLLAMA_127.0.0.1:11434` |

---

## 3. Top-level: `NeuralSearchQuery`

```
{
  schemaVersion: "0.1",
  queryId: string,                 // ns-q-YYYYMMDD-HHmmss-<short>
  issuedAt: string,                // ISO-8601
  plane: "LOCAL" | "CLOUD_SANDBOX" | "MIXED",  // default LOCAL
  cloudPullApproved: false,        // v0.1: literal false unless explicit approval; MIXED/CLOUD never auto-pull
  scopeId: string,                 // v0.1: required tenant/scope boundary — bleed deny
  text: string,                    // user/agent natural query
  filters?: {
    cellIds?: string[],            // e.g. ADC-12D-15
    tipIds?: string[],             // e.g. 12D-15
    shelves?: string[],            // pocket-brain-cells | sealed-tips | …
    classification?: ("LOCAL" | "SIMULATION" | "CLOUD_SANDBOX")[],
    lane?: ("HOT" | "WARM" | "COLD" | "ARCHIVE")[],
    requireSealed?: boolean        // v0.1: when true → FAIL-CLOSED (exclude unsealed / null tipSha)
  },
  hopBudget: number,               // default 1; Superbrain multi-hop ≤ N with Gate each hop
  gate: PolicyGateToken,           // required — deny → GATE_DENIED + stop hops
  motifMode: "OFF" | "METAPHOR_ONLY"  // metaphors must attach RESEARCH_HYPOTHESIS|SIMULATION|METAPHOR_ONLY
}
```

### `requireSealed` fail-closed (v0.1)
- `filters.requireSealed === true` → only cells with observed sealed tip + non-null `tipSha` may appear in `hits`
- Unsealed / unknown / null `tipSha` → **excluded** (not soft-ranked below); may surface in `waiting` as `WAITING_SEAL` if the miss is material
- Never invent a tipSha to satisfy the filter

### Plane / pull (v0.1)
- Default plane: `LOCAL`
- `plane: "MIXED" | "CLOUD_SANDBOX"` does **not** trigger remote corpus auto-pull
- Remote pull only when `cloudPullApproved === true` **and** Gate ALLOW; otherwise search LOCAL shard only and emit `WAITING_CLOUD_PULL` if cloud corpus was requested but not approved

### PolicyGateToken
```
{
  allowed: boolean,
  reason: string | null,
  bypassAllowed: false             // literal false always
}
```

---

## 4. Corpus unit: `AtomicDataCell` (searchable projection)

Aligned to daily-report ADC fields + library pocket-brain-cells index:

| Field | Type | Rules |
|-------|------|--------|
| `cellId` | string | e.g. `ADC-12D-13` |
| `tipId` | string \| null | e.g. `12D-13` |
| `tipSha` | string \| null | **null if unobserved — NEVER invent** |
| `scopeId` | string | v0.1: must match query `scopeId` or hit is denied (bleed) |
| `sealed` | boolean \| null | null if unknown; `requireSealed` fail-closed uses this + tipSha |
| `claim` | string | short factual claim |
| `provenance` | string[] | sources; empty → WAITING_SOURCE |
| `confidence` | enum | see Honesty §6 |
| `classification` | enum | `LOCAL` \| `SIMULATION` \| `CLOUD_SANDBOX` |
| `tenant` | string | e.g. `xiv-local` |
| `checksum` | string \| null | or WAITING_CHECKSUM |
| `timestamp` | string \| null | ISO; null if unknown |
| `vector` | object | `{ status, endpoint?, dims? }` — status often WAITING_* |
| `graph` | object | `{ shelf, neighbors[] }` — neighbor walk must not cross `scopeId` |
| `replication` | object | `{ mode: "LOCAL_SHARD_ONLY" \| …, production_auto: false }` |
| `scaleKind` | `"measured"` \| `"aspirational"` | required when counting/scale |
| `honesty` | string[] | free-text + labels from §6 |
| `motifTags` | MotifTag[] | optional; see §7 |

---

## 5. Result: `NeuralSearchResult`

```
{
  schemaVersion: "0.1",
  queryId: string,
  generatedAt: string,
  plane: "LOCAL" | "CLOUD_SANDBOX" | "MIXED",
  cloudPullUsed: false,            // v0.1: true only if approved pull actually ran
  scopeId: string,
  gateOutcome: "ALLOW" | "GATE_DENIED",
  status: "HIT" | "MISS" | "PARTIAL" | "WAITING" | "GATE_DENIED" | "SCOPE_DENIED",
  hits: SearchHit[],
  waiting: WaitingItem[],
  hopTrace: HopTrace[],            // always append deny hop before stop
  honesty: HonestyBlock,
  motifDisclosure: string | null
}
```

### SearchHit
```
{
  rank: number,                    // 1-based; ordinal only
  score: number | null,            // null if unscored / WAITING_SCORER
  cellId: string,
  scopeId: string,                 // v0.1: must equal query.scopeId
  tipId: string | null,
  tipSha: string | null,
  sealed: boolean | null,
  snippet: string,
  evidenceQuality: number | null,
  scaleKind: "measured" | "aspirational" | null,
  labels: HonestyLabel[],          // required ≥1
  sourceShelf: string | null
}
```

### HopTrace (Superbrain) — stop-on-deny (v0.1)
```
{
  hop: number,
  surface: "POCKET_BRAIN" | "BLUE_BRAIN" | "COMPANY_BRAIN" | "GLOBAL_BRAIN",
  gateOutcome: "ALLOW" | "GATE_DENIED",
  cellIdsTouched: string[],
  scopeId: string,
  note: string | null
}
```

**Multi-hop rules (v0.1):**
1. Gate evaluated **before** each hop  
2. On `GATE_DENIED`: append this hop to `hopTrace`, set result `gateOutcome` / `status` to `GATE_DENIED`, **stop** — no further hops, no skip-around  
3. `GLOBAL_BRAIN` surface → always `GATE_DENIED` + stop  
4. Hits collected only from ALLOW hops prior to stop (PARTIAL ok if some earlier hits exist — document in `waiting`)

### scopeId bleed deny (v0.1)
- Every candidate cell/hit/`graph.neighbors` walk must share query `scopeId`
- Mismatch → exclude hit; if the only path was cross-scope, status may be `SCOPE_DENIED` and/or `waiting` code `WAITING_SCOPE`
- Banned: silently merging another tenant/scope into hits

### WaitingItem
```
{
  code: WaitingCode,
  detail: string,
  blocksHit: boolean
}
```

---

## 6. Honesty labels (canonical v0.1)

### Claim / evidence
| Label | Meaning |
|-------|---------|
| `MEASURED` | Count/SHA/seal observed from a real source |
| `ASPIRATIONAL` | Architecture goal — not measured |
| `SEALED` | Tip PASS/sealed cited from sealed index |
| `LIBRARY_CITE` | Library citation ≠ Gate co-sign |
| `UNVERIFIED` | Not checked yet |
| `DETECTED` | Seen in env; **≠ VERIFIED** |
| `VERIFIED` | Receipted (rare; CPU ok; never fake GPU/NPU/QPU) |
| `SIMULATION` | Sim layer / demo — not production |
| `LOCAL` | Runs / cites LOCAL plane only |
| `RESEARCH_HYPOTHESIS` | Hypothesis framing — not product fact |
| `METAPHOR_ONLY` | Narrative motif — no physics/mystical claim |

### Waiting codes (`WAITING_*`)
| Code | Use when |
|------|----------|
| `WAITING_POCKET_BRAIN_INGEST` | Vectors/index not ingested |
| `WAITING_OLLAMA` | Ollama endpoint down / unchecked |
| `WAITING_SOURCE` | Provenance missing |
| `WAITING_CHECKSUM` | No hash published |
| `WAITING_SYNC` | Shard sync not claimed |
| `WAITING_SCORER` | Ranker not wired — ordinal rank only |
| `WAITING_CODE_SLICE` | Schema-only; impl pending (**current idle state**) |
| `WAITING_GATE` | Gate token missing |
| `WAITING_PROVIDER` | Accelerator/cloud provider |
| `WAITING_DATA` | Corpus empty / unknown |
| `WAITING_SEAL` | requireSealed fail-closed excluded candidates |
| `WAITING_SCOPE` | Cross-scope path denied |
| `WAITING_CLOUD_PULL` | MIXED/CLOUD requested but auto-pull blocked / unapproved |

### HonestyBlock (required on every result)
```
{
  inventedShaForbidden: true,
  inventedMetricsForbidden: true,
  gateBypassForbidden: true,
  globalBrainForbidden: true,
  motifQuantumAdvantageForbidden: true,
  motifMysticalTechForbidden: true,
  aspirationalAsMeasuredForbidden: true,
  requireSealedFailClosed: true,     // v0.1
  multiHopStopOnGateDenied: true,    // v0.1
  scopeBleedDenied: true,            // v0.1
  cloudAutoPullForbidden: true,      // v0.1
  notes: string[]
}
```

---

## 7. Motif tags (optional, tightly gated)

```
MotifTag = {
  kind: "QUANTUM_METAPHOR" | "ANCIENT_EGYPTIAN_METAPHOR" | "OTHER_METAPHOR",
  labels: ["RESEARCH_HYPOTHESIS", "SIMULATION", "METAPHOR_ONLY"],  // all three required
  text: string,
  forbiddenExpansions: [
    "quantum advantage",
    "QPU VERIFIED",
    "mystical tech",
    "oracle / destiny theater"
  ]
}
```

If any MotifTag is present → `motifDisclosure` MUST state they are metaphor/hypothesis only.

---

## 8. Retrieval surfaces (v0.1 routing)

| Surface | Role | Default |
|---------|------|---------|
| Pocket Brain stubs | LOCAL ingest / fixture cells | **primary** |
| Blue Brain LOCAL READ | branded read surface + Gate | primary UI/API |
| Superbrain hop orchestrator | multi-hop ≤ hopBudget; **stop on GATE_DENIED** | optional |
| Company / Global Brain | out of scope | GATE_DENIED + stop |
| Cloud remote corpus | only if `cloudPullApproved` | **no auto-pull** |

Lane preference: HOT → WARM → COLD → ARCHIVE (sparse).

Seed corpus (library, measured cites only):
- ADC-12D-10…15 via `library/indexes/pocket-brain-cells-12d-10-15.json`
- Vector status today: `WAITING_POCKET_BRAIN_INGEST`

---

## 9. API sketch (LOCAL)

```ts
searchNeuralV0(query: NeuralSearchQuery): NeuralSearchResult
explainHit(hit: SearchHit): { cell: AtomicDataCell; labels: HonestyLabel[] }
dumpNeuralSearchHonesty(): HonestyBlock
```

Banned (names assertable in tests):
- `claimQuantumAdvantageViaSearch`
- `verifyQpuViaNeuralSearch`
- `bypassPolicyGateViaNeuralSearch`
- `promoteSearchHitToGlobalBrain`
- `labelAspirationalAdcScaleAsMeasured`
- `inventTipShaForHit`
- `continueHopsAfterGateDenied`      // v0.1
- `mergeCrossScopeHits`              // v0.1
- `autoPullCloudCorpusViaSearch`     // v0.1
- `softIncludeUnsealedWhenRequired`  // v0.1

---

## 10. Success criteria

1. Schema doc + honesty glossary land (this file) — **done v0 / v0.1**  
2. Lab deltas folded: requireSealed fail-closed · stop-on-deny · scopeId bleed deny · no cloud auto-pull — **done v0.1**  
3. Contract tests (later): Gate deny stops hops with HopTrace; requireSealed excludes; scope mismatch → SCOPE_DENIED; MIXED without approval → no pull + WAITING_CLOUD_PULL  
4. Blue Brain / Superbrain co-sign tracked in Lab  
5. Implementation = separate tip → **idle `WAITING_CODE_SLICE`**

---

## 11. Open / WAITING (idle)

- **`WAITING_CODE_SLICE`** — runtime module + tests (idle here until kick)  
- `WAITING_POCKET_BRAIN_INGEST` — real vectors behind cells  
- `WAITING_SCORER` — similarity scores (ordinal rank OK now)  
