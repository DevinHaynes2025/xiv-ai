# 2I-LA-33 — Global Business Opportunity Exchange V170

**Status:** **QUEUED — NOT IMPLEMENTED.** Documentation only. **DO NOT IMPLEMENT** until **2I-LA-32A** (Universal AI Silicon + Device Compatibility Fabric V160) completion gate **PASS** (and **LA-32** Global Contract + Deal Network PASS; prior LA-01→LA-31 gates as applicable; LA-27…LA-32A may still be landing on tip).
**Also blocked for code until:** LA-01 → LA-32A PASS.
**Branch:** `xiv-v2` (never `main`). Dual remotes GitHub + GitLab. Never force-push.
**Canonical path:** `docs/architecture/xiv-2i-la-33-global-business-opportunity-exchange-v170.md`
**Founder summary sibling:** [`../queue/2I-LA-33-global-business-opportunity-exchange.md`](../queue/2I-LA-33-global-business-opportunity-exchange.md)
**Canonical master queue:** [`xiv-master-build-queue-2i-ad-to-2i-kz.md`](./xiv-master-build-queue-2i-ad-to-2i-kz.md)
**Compose with:** LA-15 Legal/Contract Intelligence, LA-16/22B Finance/Treasury, LA-17 Privacy Vault + Sales Tech, LA-18 Identity/Trust, LA-20 Creator OS, LA-24 Supply Chain Twin, LA-25 Company Twin + Business Hospital, LA-29 24/7 Org, LA-30 Founder Mission Control, LA-31 Identity + Business Trust (when present), **LA-32** Global Contract + Deal Network (Deal Rooms), **LA-32A** Silicon/Compatibility Fabric (compute honesty for opportunity workloads), Guardian, Agent Firewall, Tenant/Universe Isolation, RLS, Secret plane.
**Feeds:** **2I-LA-34** Business Capital + Funding Intelligence — LA-33 supplies opportunity candidates/estimates; **not** funding/capital runtime.

> Docs-only queue. **QUEUE AFTER LA-32A.** Do **not** interrupt active validated / deployment-critical work or LA-23…LA-32A mid-flight. Do **not** destabilize the 30-day deployment runway. **No Opportunity Exchange / Matching Brain / auto-contact / Deal Room runtime in this commit.** **L4 DISABLED**.
>
> **Feature flags (default OFF):** `OPPORTUNITY_EXCHANGE_ENABLED`, `OPPORTUNITY_GRAPH_ENABLED`, `AI_OPPORTUNITY_FORCE_ENABLED`, `OPPORTUNITY_DISCOVERY_24_7_ENABLED`, `MATCHING_BRAIN_ENABLED`, `FOUNDER_OPPORTUNITY_RADAR_ENABLED`, `C2C_MATCHING_ENABLED`, `PRIVATE_OPPORTUNITY_VAULT_ENABLED`, `OPPORTUNITY_DEAL_HANDOFF_ENABLED`, `OPPORTUNITY_SIMULATION_ENABLED`.
>
> **Tip note (docs landing):** Fetch tip first (LA-27…LA-32A may still land). Rebase onto latest tip **including LA-32A** when present. Master ordering: **LA-32 → LA-32A → LA-33 → LA-34 → LA-35…40**. Never force-push / never `main`.
>
> **Queued architecture ≠ implementation proof.** Never infer PASS. **HARD STOP — no LA-33 runtime.**

---

## Sequencing (hard)

| Story | Title | Role |
|-------|-------|------|
| **2I-LA-32** | Global Contract + Deal Network | Prior — Deal Rooms receive handoffs |
| **2I-LA-32A** | Universal AI Silicon + Device Compatibility Fabric V160 | **Must PASS before LA-33 code** |
| **2I-LA-33** | Global Business Opportunity Exchange V170 | **This document** |
| **2I-LA-34** | Business Capital + Funding Intelligence | **NEXT** after LA-33 |
| **2I-LA-35…40** | Title-queued expansions | After LA-34 |

**Ordering lock:** **… → LA-32 Global Contract + Deal Network → LA-32A Universal AI Silicon + Device Compatibility Fabric V160 → LA-33 Global Business Opportunity Exchange V170 → LA-34 Business Capital + Funding Intelligence → LA-35…40**.

**Title correction:** older master-queue placeholders sometimes labeled LA-33 as “Planetary Connector + Partner Mesh V10”. Canonical title is **Global Business Opportunity Exchange V170**.

**Deployment runway:** Overnight = XIV Deployment Shift; evidence-gated canary. **Opportunity Exchange does not block first canary.** **L4 DISABLED**. Never force push / never `main`.

---

## Critical architecture rules (permanent — must remain explicit)

### Correction A — Match / endorsement

**MATCH ≠ ENDORSEMENT.** Graph edge or Matching Brain score ≠ XIV warranty of counterparty quality, legality, or creditworthiness.

### Correction B — Value honesty

Opportunity **value / evidence = ESTIMATE ≠ REVENUE ≠ collected cash**. Pipeline fantasy ≠ ledger.

### Correction C — Profile vs private brain

**Company directory profile ≠ private Company Brain** (LA-25). Public/discovery fields never auto-include private twin data.

### Correction D — Contact / deal honesty

**C2C match ≠ auto-contact.** **Deal candidate ≠ executed contract.** Handoff creates LA-32 Deal Room **candidates** only — draft ≠ signed.

### Correction E — Discovery ethics

**No private scraping / no unsolicited spam** as discovery strategy. 24/7 discovery uses consented / public / partner-authorized / user-submitted sources only.

### Correction F — Security / unknown

Security **SIGNAL ≠ guilt**. **UNKNOWN** valid. Do not reward confident false precision.

### Correction G — Authority / L4

Founder Opportunity Radar ≠ ambient root. More matches ≠ more authority. Simulation ≠ reality. **L4 DISABLED.**

---

## Founder user story

As the XIV AI Founder, I want XIV to operate an honest **Global Business Opportunity Exchange V170** — so an **Opportunity Kernel** defines types and states; so a **Global Opportunity Graph** links parties, needs, offers, and evidence without endorsement theater; so an **AI Opportunity Force** runs governed 24/7 discovery **without private scraping or spam**; so **Matching Brain** proposes matches where **MATCH ≠ ENDORSEMENT**; so company **profiles** stay separate from private **Company Brain**; so value/evidence remain **ESTIMATE not REVENUE**; so **Founder Opportunity Radar** surfaces candidates for brief/decision queues without auto-authority; so **C2C matching** never auto-contacts; so Deal creation **hands off to LA-32 Deal Rooms** without inventing executed contracts; so security signals, **private opportunity vaults**, and Business Hospital / supply chain / sales / finance / simulation integrations stay bounded under RLS — all flags **OFF**, no fake LIVE marketplace claims, **L4 DISABLED**.

### Core loops (contract)

**Discovery loop**

```
Source (consented / public / partner-authorized / user-submitted)
→ OpportunityCandidate + provenance
→ classification + sensitivity
→ private vault vs graph publish decision (default deny private)
→ NEVER private scrape / NEVER spam outreach
```

**Match loop**

```
Opportunity + party constraints + trust signals (LA-31/18)
→ Matching Brain
→ MATCH proposal (≠ ENDORSEMENT)
→ human/policy consent for contact
→ no auto-contact
```

**Deal handoff loop**

```
Accepted opportunity intent
→ DealCandidate
→ LA-32 Deal Room create (candidate)
→ negotiation / contract OS (LA-15/32)
→ DRAFT ≠ EXECUTED
→ never skip Guardian / authority gates
```

**Estimate loop**

```
EvidencePack → ValueEstimate (labeled ESTIMATE)
→ not RevenueLedger
→ not collected cash
→ UNKNOWN when insufficient evidence
```

---

## Architecture contracts (story §§1–170)

### 1. Founder mission

Document the mission: make XIV an honest **Global Business Opportunity Exchange V170** — discover, type, match, and hand off business opportunities under evidence and consent — without spam, without private scraping, without confusing estimates with revenue, and without auto-executing deals.

### 2. Opportunity Kernel

`OpportunityKernel` owns identity, typing, state machine, provenance, sensitivity, and publish scope for opportunities. Kernel ≠ marketplace LIVE claim. Kernel presence ≠ permission to contact parties.

### 3. Opportunity types

Types (non-exhaustive): `SUPPLY_NEED`, `SUPPLY_OFFER`, `DEMAND_NEED`, `PARTNERSHIP`, `DISTRIBUTION`, `LICENSING`, `CO_SELL`, `TALENT_PROJECT`, `INFRASTRUCTURE_SHARE`, `DATA_COLLAB` (policy-heavy), `RESEARCH_COLLAB`, `CREATOR_BRAND`, `C2C_TRADE`, `OTHER`, `UNKNOWN`. Type ≠ endorsement.

### 4. Opportunity states

```
DRAFT
→ SUBMITTED
→ UNDER_REVIEW
→ PUBLISHED_GRAPH (scoped)
→ MATCH_PROPOSED
→ MATCH_ACCEPTED / MATCH_DECLINED
→ DEAL_CANDIDATE_HANDOFF
→ CLOSED_WON_ESTIMATE / CLOSED_LOST / EXPIRED / QUARANTINED / WITHDRAWN
→ UNKNOWN
```

State labels are process honesty — not revenue recognition.

### 5. Global Opportunity Graph

`GlobalOpportunityGraph` nodes/edges: opportunities, orgs, people (minimal), skills/needs, geographies, product classes, evidence refs. Edge `MATCHED_WITH` carries score + explanation + **non-endorsement** flag. Graph publish defaults least privilege.

### 6. AI Opportunity Force

Governed agent family for discovery, enrichment, contradiction checks, and match prep. Force ≠ spam bot. Force ≠ root. `AI_OPPORTUNITY_FORCE_ENABLED` default OFF. Specialization ≠ authority.

### 7. 24/7 discovery (ethical)

`OPPORTUNITY_DISCOVERY_24_7_ENABLED` default OFF. Allowed sources: user-submitted, company-published, partner APIs `AUTHENTICATED`, licensed data, consented connectors. **Forbidden as strategy:** private scraping of personal vaults, credential stuffing, unsolicited spam sequences, dark-pattern outreach.

### 8. Matching Brain

`MatchingBrain` scores fit across needs/offers/constraints/trust dimensions. Output: match proposals + explanations + unknowns. **MATCH ≠ ENDORSEMENT.** `MATCHING_BRAIN_ENABLED` default OFF.

### 9. Company profiles vs private Company Brain

Directory/profile cards (compose LA-31 when present) expose only publish-scoped fields. **Private Company Brain** (LA-25) stays firewalled. Opportunity enrichment must not exfiltrate private twin diagnostics into the global graph.

### 10. Evidence / value = ESTIMATE

`OpportunityValueEstimate` and evidence packs are labeled **ESTIMATE**. They are **not** `RevenueLedger` entries, not ARR, not collected cash. UI must show ESTIMATE / UNKNOWN — never silent “revenue”.

### 11. Founder Opportunity Radar

`FounderOpportunityRadar` (compose LA-30) surfaces ranked candidates into Founder Brief / Decision Queue. Radar ≠ auto-approve. Radar ≠ money-move. `FOUNDER_OPPORTUNITY_RADAR_ENABLED` default OFF.

### 12. C2C matching without auto-contact

Company-to-company (and creator-to-company) matches require explicit consent before any contact channel opens. **No auto-email/SMS/call/DM.** Match notification stays in-product until both sides opt in. `C2C_MATCHING_ENABLED` default OFF.

### 13. Deal creation → LA-32 Deal Rooms

Accepted intents create **DealCandidate** handoff into **LA-32 Deal Rooms**. LA-33 does not execute contracts, move money, or bind parties. `OPPORTUNITY_DEAL_HANDOFF_ENABLED` default OFF until LA-32 Deal Room contracts exist in code era.

### 14. Security signals

Compose LA-14/23/31: impersonation, fraud SIGNAL, sanctions-screen placeholders, anomaly scores. **SIGNAL ≠ guilt.** High risk → quarantine opportunity / require human review — not public shaming theater.

### 15. Private opportunity vaults

`PRIVATE_OPPORTUNITY_VAULT_ENABLED` default OFF (schema queued). Users/companies may keep opportunities private. Private ≠ Global Graph. Export/share is explicit. Vault ≠ training data by default.

### 16. Business Hospital integration

Opportunity stress (concentration, dependency, fraud SIGNAL) may emit Hospital-relevant **observations** — not auto-diagnosis-as-fact. Compose LA-25 honesty.

### 17. Supply chain integration

Supply/demand opportunities compose LA-24 twin needs/offers with private boundary. Supply match ≠ purchase order ≠ payment authority.

### 18. Sales integration

Sales Tech (LA-17/20) may consume publish-scoped opportunities. Spam and dark patterns forbidden. Lead ≠ revenue.

### 19. Finance integration

Finance may see ESTIMATE labels only. No auto booking. Compose LA-16/22B: AI may recommend — not move money / sign / bind.

### 20. Simulation integration

LA-10 simulations may stress-test opportunity portfolios. **Simulation ≠ reality.** `OPPORTUNITY_SIMULATION_ENABLED` default OFF. BASELINE_NO_ACTION required for decision arenas.

### 21. Trust / identity compose

Authenticated ≠ authorized. Listing org ≠ verified ownership. Compose LA-18/31 claim classifications (`SELF_REPORTED`…`UNKNOWN`).

### 22. Legal compose

Opportunity terms drafts route through LA-15/32. Fine-print ≠ regulatory determination. Draft ≠ executed.

### 23. Compute compose (LA-32A)

Matching/discovery workloads use provider-neutral compute honesty. More GPU ≠ better matches ≠ authority.

### 24. Opportunity identity

Stable IDs, versioning, supersede-don’t-silently-rewrite, provenance. Clone opportunity ≠ clone permissions.

### 25. Sensitivity / residency

Geo/residency tags bind graph replication. Federate/minimize (LA-22). Cross-border publish requires policy.

### 26. Consent ledger

Contact consent, publish consent, enrichment consent recorded with purpose limitation. Missing consent → DENY contact.

### 27. Anti-spam governor

Rate limits, reputation, template bans, cold-outreach deny-by-default. Governor ≠ optional for C2C.

### 28. Anti-scraping governor

Block connectors that only work via private scrape. Partner APIs must be `AUTHENTICATED` + contractual. Potential connector ≠ approved.

### 29. Ranking honesty

Rank explanations required. Popularity ≠ trust. Paid placement if ever introduced must be labeled ads — never silent endorsement.

### 30. Contradiction / curiosity

Compose LA-08: conflicting claims on the same opportunity → CONTRADICTION state / UNKNOWN — do not average into fake certainty.

### 31. Temporal honesty

Compose LA-09: AFTER ≠ BECAUSE. Expired opportunities cannot present as fresh without freshness evidence.

### 32. WIP / rate governors

Bound opportunity generation and match proposal rates. Night shift may draft candidates to IDEA_POOL / BRIEF only — no auto-LIVE spam.

### 33. DB tables (document only)

Evaluate: `opportunities`, `opportunity_states`, `opportunity_graph_edges`, `opportunity_matches`, `opportunity_value_estimates`, `opportunity_consents`, `opportunity_vault_items`, `opportunity_deal_handoffs`, `opportunity_security_signals`, `opportunity_discovery_runs`. RLS mandatory in implementation era.

### 34. RLS / tenant isolation

Company A opportunities ≠ Company B. Founder private vault ≠ Global Graph. Marketplace-shaped tables still tenant-scoped.

### 35. UI surfaces (document only)

Exchange browser, match inbox (consent-gated), Founder Radar, vault, estimate labels, Deal handoff status. No vanity “guaranteed revenue” widgets.

### 36. Tests (implementation era)

MATCH cannot render as ENDORSED; estimate ≠ revenue ledger write; auto-contact blocked; private vault not in global search; scrape connector config rejected; Deal handoff creates candidate not executed contract; RLS proofs; flags default OFF.

### 37. Security tests

Prompt injection cannot force outreach; confused deputy cannot publish private Company Brain fields; PII redaction on discovery logs.

### 38. Feature flags

All header flags default OFF. Flag ON ≠ LIVE verified exchange.

### 39. Release posture

Does **not** block first canary. Prioritize kernel + vault boundary + match honesty + no-auto-contact.

### 40. Evidence placeholders

| Field | Value at docs queue |
|-------|---------------------|
| Architecture status | **QUEUED** |
| Runtime started | **FALSE** |
| Exchange LIVE | **FALSE** |
| Auto-contact enabled | **FALSE** |
| MATCH endorsement claims | **FORBIDDEN** |
| Value as REVENUE booked | **FALSE** |
| Private scraping allowed | **FALSE** |
| L4 | **DISABLED** |
| Unknown estimates | **UNKNOWN** (valid) |

### 41. Checkpoint protocol

Conventional commits; dual-push; never force-push / never `main`.

### 42. Suggested commit (this landing)

`docs(xiv): queue 2I-LA-33 global business opportunity exchange`

### 43. Completion evidence

PASS needs EvidencePacks: RLS, anti-spam, anti-scrape, match honesty UI, handoff tests, consent ledger. Queue commit ≠ PASS.

### 44. What this commit is

Queued V170 architecture + founder summary + master pointer order with LA-32A.

### 45. What this commit is not

Not matching runtime, not outreach, not Deal Room implementation, not capital/funding (LA-34), not revenue booking.

### 46–80. Kernel / graph / force depth

Document schemas for types, states, graph edge semantics, discovery run records, enrichment provenance, quarantine reasons, and Opportunity Force role registry (no ambient root).

### 81–110. Matching / C2C / radar depth

Document scoring dimensions, explainability, bilateral consent state machine, Founder Radar ranking policy, mute/block, and appeal paths without pay-to-endorsement.

### 111–140. Integrations / security / vault depth

Document Hospital/supply/sales/finance/simulation adapters as bounded contracts; vault encryption expectations; security signal taxonomy; handoff payload to LA-32 (DealCandidate fields only).

### 141. Next queue — LA-34…40

| ID | Title |
|----|-------|
| **2I-LA-34** | **Business Capital + Funding Intelligence** |
| **2I-LA-35** | Title-queued expansion (refine in later docs) |
| **2I-LA-36** | Title-queued expansion |
| **2I-LA-37** | Title-queued expansion |
| **2I-LA-38** | Title-queued expansion |
| **2I-LA-39** | Title-queued expansion |
| **2I-LA-40** | Title-queued expansion |

**NEXT after LA-33:** **2I-LA-34** Business Capital + Funding Intelligence.

### 142–169. Reserved extension hooks

Hooks for industry-specific opportunity types, regulated-market connectors, and cross-universe publish — stubs only.

### 170. Permanent rules (LA-33 / CEO)

```
MATCH ≠ ENDORSEMENT
DISCOVERY ≠ SPAM
NO PRIVATE SCRAPING AS STRATEGY
LISTING ≠ VERIFIED COUNTERPARTY
OPPORTUNITY VALUE / EVIDENCE = ESTIMATE ≠ REVENUE ≠ COLLECTED CASH
COMPANY PROFILE ≠ PRIVATE COMPANY BRAIN
PRIVATE VAULT ≠ GLOBAL GRAPH DEFAULT
C2C MATCH ≠ AUTO-CONTACT
DEAL CANDIDATE ≠ EXECUTED CONTRACT
HANDOFF → LA-32 DEAL ROOMS (CANDIDATE ONLY)
DRAFT ≠ EXECUTED
SECURITY SIGNAL ≠ GUILT
UNKNOWN VALID
SIMULATION ≠ REALITY
MORE MATCHES ≠ MORE AUTHORITY
FOUNDER RADAR ≠ AMBIENT ROOT
AUTHENTICATED ≠ AUTHORIZED
STORY = DATA ≠ AUTHORITY
QUEUED ≠ IMPLEMENTED ≠ TESTED ≠ DEPLOYED ≠ VERIFIED
EMPTY CI ≠ PASS
NEVER INFER PASS
CALENDAR ≠ PERMISSION
FOUNDER ASLEEP ≠ AUTHORITY
GUARDIAN ABOVE AGENTS
FLAG DEFAULTS OFF (SEE HEADER)
ORDERING LOCK: LA-32 → LA-32A → LA-33 → LA-34 → LA-35…40
L4 REMAINS DISABLED
STATUS: QUEUED — NOT IMPLEMENTED
HARD STOP — NO LA-33 RUNTIME
```

---

## Permanent rules (LA-33 / CEO) — inheritance reminder

Guardian, Tenant Isolation, Universe Isolation, Agent Firewall, Data Access Gateway, Evidence/Provenance, Audit, Human + Policy Authority, providers `NOT_CONFIGURED` until proven, Founder Brief `devinhaynes2025@gmail.com`.

Compose LA-15/32: draft ≠ executed; negotiator ≠ signatory.

Compose LA-16/22B: estimate ≠ revenue; AI may recommend — not move money.

Compose LA-17/20: sales/creator opportunity graphs without spam.

Compose LA-24/25: supply twin + company twin private boundaries.

Compose LA-30: Radar feeds briefs; Founder control ≠ raw root.

Compose LA-32A: compute honesty for discovery/match workloads; more compute ≠ authority.

---

## Docs-only landing gate (this commit)

| Gate | Expected |
|------|----------|
| LOCAL / GITHUB / GITLAB SHAs | Equal after dual-push |
| TREE | CLEAN |
| Runtime | **NOT started** |
| Ordering | **LA-32 → LA-32A → LA-33 QUEUED → LA-34** |
| Implementation | **DO NOT IMPLEMENT until LA-32A PASS** |
| Evidence fields | Mostly **QUEUED / FALSE / UNKNOWN** |
| Feature flags | Default OFF documented |
| Auto-contact / scrape / spam | **Forbidden as strategy** |
| HARD STOP | **No LA-33 runtime** |

Never infer PASS.

**NEXT after LA-33:** **2I-LA-34 — Business Capital + Funding Intelligence**.
