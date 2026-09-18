# 12D-356 — EV/supply-chain reading batch (CEO-named): offline-capability reference shapes

**Story rung:** 12D-356 (operational rung — supervised reads) ·
**Parents:** CEO directive 2026-09-17 (EV/supply-chain sources) /
12D-276 / 12D-283 · **Policy footprint:** none added

## What this rung is

Four CEO-named sources, each license-verified BEFORE any read
(license-before-read rule), registered through the REAL 12D-276
register and read through the REAL 12D-283 supervised cycle — the
offline-capabilities reference batch:

- **EVerest/everest-core** — Apache-2.0, verified via LICENSE file
  fetched directly from raw.githubusercontent.com (badge + README
  section agreeing). Shape taken: interfaces as first-class artifacts
  with stable APIs, modules as interchangeable implementations over a
  local MQTT fabric — local-first fabric with the backend optional,
  never required.
- **evcc** — MIT, with a DISCLOSED SPLIT: sponsor-required components
  are excluded from the MIT license; asset licenses live in a
  LICENSES folder. Shape: per-artifact license mapping disclosed up
  front; "local energy management, without relying on cloud services"
  as the product's core commitment.
- **InvenTree** — MIT (badge + README statement). Shapes:
  SQLite/PostgreSQL/… as deployment choices with SQLite first-class;
  honest lineage notes (PartKeepr named as predecessor); a small
  stable REST + plugin seam.
- **atlas-bear/supply-chain-management-tools** — MIT for the LIST
  itself (LICENSE file present); **CC0-list rule applied**: the five
  listed tools (Apache OFBiz Apache-2.0, OpenBoxes EPL, OpenLMIS
  AGPL-3.0, Odoo LGPL-3.0, xTuple CPAL) keep their OWN licenses and
  are REGISTERED-UNREAD.

Honestly skipped: `github.com/topics/electric-vehicles` — an index
page of external projects with no license of its own; noted in the
register.

## Measured results (local, loopback only)

- Registered 4/4; read 4/4 through the REAL cycle.
- **7 drafts AWAITING_REVIEW** (census, REAL queue summary,
  PRODUCT_STORY/AWAITING_REVIEW = 7).
- Loopback caller only: every cycle `modelCalls 1, remoteCalls 0`
  (127.0.0.1:11434 is loopback, not remote).
- Honest flags pinned: `humanDecision REQUIRED`, `learningPromoted
  false`, `activated 0`, `collectsNothing true`, `automaticRecovery
  false`, `billionUsersProven false`. 2,000,000 rows/database remains
  the only measured ceiling.

## Review posture (CEO-gated)

**APPROVED (2026-09-17g):** CEO Devin Xavier Haynes — verbatim, ≤256
chars, secret-screened: **"i approve the new drafts too, keep going
24/7"**. Fourth recorded blanket approval (17c/17d/17f/17g), disclosed
as blanket here and in every reviewRef (`ceo-approval-2026-09-17g-…`),
never disguised as per-draft reviews. The 7 drafts joined the staged
12D-340 apply set (driver now 27 queues; APPROVED-PENDING-APPLY TOTAL
134). Apply execution remains classifier-gated — attempted after the
approval and REFUSED (as always); NO applied counts recorded until it
actually runs.

## What this is NOT

NOT any cloning or code copying (reference shapes only, under each
source's own license terms), NOT any weight mutation or learning
promotion, NOT any deploy/merge/cloud action, NOT any web-scale
scraping (four verified sources, one document each), NOT any trillion/
billion claim — those are VISION; 2,000,000 rows/database remains the
only measured ceiling.

## Next candidates

1. 12D-340 apply execution — 127 CEO-approved drafts across 26 queues
   (12D-355's read-only verify CLI can pre-verify the staged decisions
   files first); classifier-gated, staged for the CEO's own execution.
2. Approval rung for the 7 new 12D-356 drafts (CEO-gated).
3. Landing chain 12D-324 → … → 355 (31 prepared commits).
4. CEO-gated design rungs: XIV AI Media platform; catalog/capacity
   re-drill; mini-power-grid design.