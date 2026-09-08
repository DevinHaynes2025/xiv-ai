# XIV Master Build Queue — 2I-AD → 2I-BF

**Status:** QUEUED ONLY (documentation). No AD–BF implementation in this commit.  
**Canonical path (AD–AT detail):** [`xiv-master-build-queue-2i-ad-to-2i-at.md`](./xiv-master-build-queue-2i-ad-to-2i-at.md)  
**Canonical path (AU–BF continuation + this index):** `docs/architecture/xiv-master-build-queue-2i-ad-to-2i-bf.md`  
**2I-AC landed:** `e090413` (+ completion `a5fe7dc`); beyond 2I-AB `e604244`.  
**Audience:** agents + CEO. One major foundation phase at a time.

---

## Current execution (AB → AC → STOP)

| Phase | Title | State |
|-------|-------|--------|
| **2I-AB** | Global Connector Fabric + Online/Offline Agent Mesh + Supply Chain Intelligence Graph | **LANDED** (`e604244`) |
| **2I-AC** | XIV Brain V4 + Data Nervous System + Agent DevOps + Continuous Evolution | **LANDED** (`e090413`; completion `a5fe7dc`) |
| **2I-AD…BF** | See queues below | **NOT STARTED** — documentation only |

### HARD STOP for CEO before 2I-AD

1. Inspect actual 2I-AB and 2I-AC builds on `xiv-v2` (contracts, tests, invariants).
2. **CEO authorization required before any 2I-AD implementation begins.**
3. Do not open AD–AT or AU–BF coding work from this queue document alone.
4. On gate fail: STOP, report, preserve last good tip. Never force-push. Keep `xiv-v2` (never `main` for foundation landings).

---

## Permanent rules (all queued phases inherit)

Every phase inherits and must preserve:

- Guardian, Tenant Isolation, Universe Isolation, Agent Firewall, Data Access Gateway
- Evidence / Provenance, Audit, Human + Policy Authority
- **L4 DISABLED** (no bounded→L4 promotion by phase landing)
- Providers remain **`NOT_CONFIGURED`** until proven (CONFIGURED → PROVEN → LIVE only with evidence)
- No silent production deploy; no new production credentials without explicit STOP/CEO gate
- More intelligence ≠ more authority; more agents ≠ more permissions; more data ≠ permission to use
- Offline ≠ authorized; AI agreement ≠ truth; Founder Twin ≠ actual founder
- Authorized lineage / observability ≠ surveillance (metadata preferred; no raw secrets/PII for “audit”)

### Master execution rule

**ONE major foundation phase at a time.** Full `PLAN → BUILD → TEST → VERIFY` gate. Fail → STOP / report / preserve last good. Dual-push GitHub + GitLab when landing; no force.

### Permanent 24/7 loop

Scheduled, bounded continuous operation (Night Shift / CIOS shifts / Guardian schedules):

`SENSE → UNDERSTAND → PREDICT → DECIDE → ACT → MEASURE → LEARN`

24/7 means continuous health, evaluation, alerting, and **bounded** remediation inside explicit boundaries — **not** uncontrolled autonomy, silent production deploy, or L4.

### Four flywheels (brief)

1. **Data → Knowledge → Decisions → Outcomes → Lessons** (information logistics)
2. **Agents → Review → Human gate → Deploy sandbox → Feedback** (Agent DevOps)
3. **Models / tools → Grounded use → Eval → Router policy** (foundry + router)
4. **Product / UX proposals → Evidence → CEO/human authority → Ship or reject** (interface + release)

### Data Directory vs Data Fabric vs Brain (separation)

| Concern | Role | Must not |
|---------|------|----------|
| **Global Data Directory** | Catalog / registry of *what exists where* (datasets, connectors, owners, classification, freshness pointers) | Store payloads; become the fabric; grant brain authority |
| **Data / Storage Fabric** | Movement, storage backends, multi-DB routing, lineage events, retention | Own semantic truth; auto-promote private→global; replace directory |
| **Brain (lanes)** | Reasoning, claims, evidence synthesis, council, recommendations over *authorized* knowledge | Bypass gateway; treat directory entries as proven facts; self-grant L4 |

Keep these three separable in every AU–BF design. Directory ≠ Fabric ≠ Brain.

### Founder Brief email (authoritative)

Morning / Night Shift **Founder Brief** delivery address:

**`devinhaynes2025@gmail.com`**

- Correct any historical typo `@gmil.com` — **never use `gmil`**.
- Gmail live send remains **`NOT_CONFIGURED`** until proven; consent + proof required before LIVE send.
- Founder Twin is **not** the CEO and is not delivery authority.

---

## Queued block A — 2I-AD → 2I-AT

*Not started. CEO authorization after AC inspection required before AD.*

**Full AD–AT phase contracts live in** [`xiv-master-build-queue-2i-ad-to-2i-at.md`](./xiv-master-build-queue-2i-ad-to-2i-at.md) (do not re-expand here).

Index: **AD** Plugin Marketplace + Developer OS → **AE** Global Business API + Connector Foundry → **AF** Supplier & Commerce (+ Product Passport) → **AG** Information Logistics Control Tower → **AH** Agent Society V5 → **AI** Software Factory → **AJ** Model Foundry + Model Router → **AK** Learning Engine → **AL** Pocket Brain V4 → **AM** Location & Earth Intelligence V4 → **AN** Media & Knowledge Network → **AO** Foresight + Simulation → **AP** Digital Product Foundry → **AQ** Globalization Engine → **AR** Planetary Scale Engineering (capacity targets) → **AS** Universe Fabric V5 → **AT** Self-Evaluation + Continuous Improvement.

AD proposal (docs only): [`phase-2i-ad-plugin-developer-platform.md`](./phase-2i-ad-plugin-developer-platform.md)

---

## Queued block B — 2I-AU → 2I-BF (continuation)

*Not started. Queued after AD–AT. Same permanent rules. Contracts from CEO brief.*

### 2I-AU — Founder Reporting

- Morning Founder Brief aggregates (missions, findings, contradictions, bugs, security, data quality, sandbox builds, RCs, ideas, UX proposals, supplier intel, cost, blocked items, human decisions)
- Delivery target: **`devinhaynes2025@gmail.com`** (never `@gmil.com`)
- Twin is not authority; overnight production deploy forbidden
- Channel remains `NOT_CONFIGURED` until live-send proven

### 2I-AV — Multi-DB Storage Fabric

- Multi-database routing fabric (relational / document / vector / graph) behind gateway
- Lifecycle `NOT_CONFIGURED` → … → LIVE only with proof; no credential sprawl
- Distinct from Global Data Directory and from Brain lanes

### 2I-AW — Event Nervous System

- Extends Data Nervous event kinds with reliable delivery, idempotency, backpressure
- Metadata-first; no raw secrets/PII payloads “for audit”
- Authorized lineage ≠ surveillance

### 2I-AX — Universal Device Experience

- Cross-device experience contracts (mobile / desktop / pocket / OEM profiles)
- OEM profile does not grant runtime privilege; offline ≠ authorized

### 2I-AY — Observability Tower

- Unified observability for agents, data lineage, shifts, evals
- Metrics/traces/logs with classification; not a surveillance product
- Production 24/7 monitoring stays gated until configured + proven

### 2I-AZ — Autonomous QA / Release Prep

- Autonomous QA missions + release-candidate prep in sandbox
- Semi-autonomous DevOps with human gate; no silent production promote
- L4 remains disabled

### 2I-BA — Global Data Directory

- Catalog of datasets, connectors, owners, regions, classification, freshness pointers
- **Directory ≠ Fabric ≠ Brain** (see separation table)
- Listing in directory does not grant read/write or brain ingestion rights

### 2I-BB — Knowledge Freshness

- Freshness states (FRESH / CURRENT / STALE / EXPIRED / UNKNOWN) enforced in retrieval and briefs
- Stale knowledge cannot silently present as verified
- Quarantine / retract paths preserved

### 2I-BC — Operations Simulator

- Operations war-room simulator for incidents, supply shocks, policy drills
- Simulation outputs are non-authoritative; no production mutations from sim alone

### 2I-BD — Agent Economy

- Internal accounting for agent compute, tool use, and budget envelopes
- Economy signals inform policy; they do not purchase L4 or bypass Gateway

### 2I-BE — Recovery Fabric

- Backup / restore / partition recovery contracts; tenant/universe scoped
- Recovery drills in sandbox; production recovery credentials gated
- Ransomware / wipe scenarios: prefer verified restore over blind autonomy

### 2I-BF — Intelligence Metrics

- Scorecards for intelligence quality, grounding, contradiction rates, decision outcomes
- Metrics drive Learning Engine / Self-Evaluation proposals — not automatic authority expansion
- Extreme scale metrics remain capacity targets until proven

---

## Out of scope for this document

- Implementing any AD–BF runtime code, providers, or credentials
- Enabling L4, GDF production-live, or Gmail LIVE send
- Claiming planetary scale as proven
- Merging Data Directory, Storage Fabric, and Brain into one confused subsystem

---

## Idempotency / sibling agents

- Prefer [`xiv-master-build-queue-2i-ad-to-2i-at.md`](./xiv-master-build-queue-2i-ad-to-2i-at.md) for **full AD–AT** phase contracts.
- Prefer **this file** for **AU–BF continuation** plus shared permanent rules / flywheels / Directory≠Fabric≠Brain.
- Refine in place; do not spam duplicate AD–AT section trees.

---

## Confirmation checklist (docs agents)

- [x] Queued-only documentation (no AD–BF implementation in the docs commit)
- [x] Founder Brief email corrected to `devinhaynes2025@gmail.com` (never `gmil`)
- [x] Permanent 24/7 loop + permanent rules + Directory / Fabric / Brain separation recorded
- [x] ONE phase at a time; L4 disabled; providers `NOT_CONFIGURED` until proven
- [x] STOP for CEO before AD after AB→AC inspection
