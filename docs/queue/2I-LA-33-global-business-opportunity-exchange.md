# 2I-LA-33 — Global Business Opportunity Exchange V170

Status: **QUEUED — NOT IMPLEMENTED** / runtime **not started**
Branch: xiv-v2
HARD STOP: **DO NOT IMPLEMENT** until **2I-LA-32A PASS** (and LA-32 PASS). **QUEUE AFTER LA-32A.** Do not interrupt LA-23…LA-32A mid-flight or validated / release-critical / deployment-critical work. Do not destabilize 30-day deployment runway. L4 disabled.

**Feature flags (default OFF):** `OPPORTUNITY_EXCHANGE_ENABLED`, `OPPORTUNITY_GRAPH_ENABLED`, `AI_OPPORTUNITY_FORCE_ENABLED`, `OPPORTUNITY_DISCOVERY_24_7_ENABLED`, `MATCHING_BRAIN_ENABLED`, `FOUNDER_OPPORTUNITY_RADAR_ENABLED`, `C2C_MATCHING_ENABLED`, `PRIVATE_OPPORTUNITY_VAULT_ENABLED`, `OPPORTUNITY_DEAL_HANDOFF_ENABLED`, `OPPORTUNITY_SIMULATION_ENABLED`.

## Prerequisite (queue ordering)

**2I-LA-32A** (Universal AI Silicon + Device Compatibility Fabric V160) must PASS before LA-33 code (LA-32 Global Contract + Deal Network must also PASS). Ordering: **… → LA-32 Global Contract + Deal Network → LA-32A Universal AI Silicon + Device Compatibility Fabric V160 → LA-33 Global Business Opportunity Exchange V170 → LA-34 Business Capital + Funding Intelligence → LA-35…40**.

**Tip note:** Fetch tip first (LA-27…LA-32A may still land). Rebase onto latest tip **including LA-32A** when present. Park on `cursor/queue-2i-la-33-*-4059` or continue ordered landing on `cursor/queue-2i-la-32a-*-4059` while tip contested. Never force-push / never `main`.

**Full contracts (architecture §§1–170 + permanent rules):** [`docs/architecture/xiv-2i-la-33-global-business-opportunity-exchange-v170.md`](../architecture/xiv-2i-la-33-global-business-opportunity-exchange-v170.md).

## Founder user story

As the XIV AI Founder, I want XIV to run Global Business Opportunity Exchange V170 — so an Opportunity Kernel types/states opportunities on a Global Opportunity Graph; so an AI Opportunity Force discovers 24/7 without private scraping or spam; so Matching Brain pairs parties with MATCH≠ENDORSEMENT; so company profiles stay distinct from private Company Brain; so evidence/value stay ESTIMATE not REVENUE; so Founder Opportunity Radar surfaces candidates without auto-authority; so C2C matching never auto-contacts; so Deal creation hands off to LA-32 Deal Rooms without inventing executed contracts; so security signals, private opportunity vaults, and Hospital/supply/sales/finance/simulation integrations stay bounded — all flags OFF, L4 DISABLED.

## Critical architecture rules (permanent)

1. MATCH ≠ ENDORSEMENT; discovery ≠ outreach spam; listing ≠ verified counterparty.
2. Opportunity value / evidence = ESTIMATE ≠ REVENUE ≠ collected cash.
3. Company directory profile ≠ private Company Brain; private vault ≠ Global Graph default.
4. C2C match ≠ auto-contact; Deal candidate ≠ executed contract (LA-32 Deal Rooms).
5. No private scraping / no unsolicited spam as discovery strategy.
6. Security SIGNAL ≠ guilt; UNKNOWN valid; Founder Radar ≠ ambient root.
7. Simulation ≠ reality; more matches ≠ more authority; L4 DISABLED.

## Release posture (30-day guard)

**Opportunity Exchange does not block first canary.**  
**Prioritize (when implementation era starts):** Opportunity Kernel + types/states + private vault boundary + MATCH≠ENDORSEMENT honesty + no-auto-contact.  
**Feature-gated / non-blocking:** 24/7 discovery depth, C2C scale, simulation integrations, capital handoff prep (all flags default OFF).

## Core surfaces (document only)

- Opportunity Kernel / types / states; Global Opportunity Graph
- AI Opportunity Force; 24/7 discovery (no private scraping/spam)
- Matching Brain (MATCH≠ENDORSEMENT); company profiles vs private Company Brain
- Evidence/value ESTIMATE≠REVENUE; Founder Opportunity Radar
- C2C matching without auto-contact; Deal creation → LA-32 Deal Rooms
- Security signals; private opportunity vaults
- Business Hospital / supply chain / sales / finance / simulation integrations
- DB/RLS; tests; checkpoints; next LA-34…40; permanent rules

## Next queue

- **2I-LA-34** Business Capital + Funding Intelligence
- Then **LA-35…40** per master queue titles

## Docs-only gate

LOCAL = GITHUB = GITLAB; TREE = CLEAN; runtime **NOT** started. Never infer PASS. **HARD STOP — no LA-33 runtime.**
