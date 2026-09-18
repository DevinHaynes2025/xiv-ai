# Verified Reading Ledger — XIV AI OS reading campaign 12D-366..382 (approved 2026-09-19) + bounded follow-ons 12D-388/389

**Story rung:** 12D-383 (knowledge-base rung — the approved campaign,
committed as the OS's reference ledger); 12D-390 (ledger touch — the
measured `format=json` drift + the bounded 12D-388/389 rungs)
· **Parents:** 12D-382 · **Policy footprint:** none added

Every row below is sourced from committed handoffs and the drivers'
measured outputs. Review provenance: 76 decisions applied through the
REAL 12D-324 apply door under the CEO's recorded approval "go ahead
and run the apply driver for the new drafts" (2026-09-19; 12D-382);
campaign all-time 277 applied decisions. Every source was
license-verified BEFORE read, through the REAL 12D-276 register +
12D-283 supervised cycle, loopback qwen2.5-coder:7b only
(remoteCalls 0 everywhere), drafts stopped before review until the
CEO-gated approvals landed. Honest flags pinned throughout; 2,000,000
rows/database is the ONLY measured ceiling.

**12D-388/389 status:** the two bounded follow-on rungs read the LIVE
CFPB publisher surface (25-record structured-field sample; size=0
facet census) — their 14 drafts settle AWAITING_REVIEW and are
CEO-gated: NO review decision is applied without the CEO's recorded
approval.

## A. Verified contracts (publisher-own sources)

| Rung | Source | Verified facts (operative) |
|---|---|---|
| 366 | CFPB CCDB API (consumerfinance.gov) | CC0 per OpenAPI spec info block; base URL …/search/api/v1/; size max 100 (default 10); frm max 100000 only if format unspecified; search_after pagination; Release 22/24 removed consent field + narratives — STRUCTURED FIELDS ONLY; PII not published; ZIP truncation |
| 369 | resources.data.gov open-licenses | Government works default U.S. public domain; CC0 recommended; approved licenses CC0/CC BY 4.0/CC BY-SA 4.0/PDDL/ODC-By/ODbL; per-dataset Access & Use governs (SSA CC0+public; CFPB catalog record carries NO license — platform posture does NOT substitute; NOAA CC0 with accessLevel non-public — license ≠ access) |
| 370 | CFPB data-use + release notes | Release 24 (Sept 2026) removed narratives + visualizations; Release 22 (June 2026) removed "Consumer disputed" + "Consumer consent provided" from exports; mirrors are NOT the publisher |
| 371 | CC0 1.0 + ODbL 1.0 legal texts | CC0: irrevocable worldwide waiver, trademark/patent untouched, as-is, NO share-alike. ODbL: substantial-part extraction = Derivative Database; Sec 4.4 share-alike; Sec 4.3 notice pattern; Sec 4.6 derivative-offer duty → ODbL extraction rungs stay bounded or CEO-approved with disclosure |
| 372 | World Bank catalog | ODbL used only when required by original provider/partnership (default CC BY 4.0; most microdata RESTRICTED) — the share-alike constraint made concrete |
| 374 | License census (GitHub/HF/arXiv) | SPDX-verified class map for the whole CEO batch (see C below) |
| 388 | CFPB CCDB structured fields (LIVE sample, 25 records) | 15 structured fields observed; forbidden fields (complaint_what_happened / consumer_disputed / consumer_consent_provided) present in NONE — 12D-370 holds against the LIVE surface; totalHits 17,842,775 unchanged. MEASURED DRIFT: `format=json` now returns HTTP 404 (the 366-verified spec allowed it); the same URL without it serves JSON by default — recorded verbatim, adapted to measured reality |
| 389 | CFPB CCDB facet census (LIVE, size=0) | Counts only, ZERO records fetched: facets product/issue/company_response/submitted_via measured (buckets enumerated top-50 with a DISCLOSED cap after the draft-budget refusal); totalHits unchanged |

## B. Reference architectures read (permissive — reference reads, no code copy)

| Rung | Source | License | Takeaways |
|---|---|---|---|
| 375 | uber/ribs | Apache-2.0 | Router/Interactor/Builder; business logic over view tree |
| 375 | MobilityData catalogs | Apache-2.0 code, CC0 metadata | GTFS Schedule+Realtime feed catalog; per-feed provider terms govern |
| 376 | ovikl | MIT | Open ride-hailing platform: android/ios/nodejs/html tiers, MongoDB+Redis |
| 376 | RSGInc/ActivityViz | Apache-2.0 | Travel/activity viz: per-scenario CSV + GeoJSON, 3D trip maps, sunburst, chord OD |
| 377 | rustprooflabs/travel-db | MIT | Postgres+PostGIS trip→steps→points GPS schema; sqitch; staging loaders; quality table |
| 377 | ScreenQA | CC-BY-4.0 | ~86K QA pairs over ~35K Rico screenshots; ComplexQA; attribution-required |
| 377 | HowToDIV | Apache-2.0 code + CC-BY-4.0 data | Egocentric video → task-assistance dialogues; first code≠data dual license in batch |
| 377 | cultural_familiarity | Apache-2.0 | 10-country 0-4 human cultural-familiarity ratings |
| 377 | WaxalNLP (card only) | CC-BY-SA-4.0/CC-BY-4.0 PER PROVIDER | African speech corpus 821 GB — card-only read; per-language license check = hard gate |
| 377 | WikiProfile | CC-BY-SA-4.0 | 2,150 Wikipedia facts × 10 questions; share-alike on derivatives |
| 378 | Waymax paper (local, offline-only) | arXiv non-exclusive-distrib 1.0 | JAX/XLA stateless functional AV simulation; WOMD scenarios; closed-loop metrics; IDM sim-agents; route conditioning |
| 378 | AnLoCOV paper (local; main.pdf identified) | CC BY 4.0 (page verbatim + Crossref) | 338 anonymised persons, 16M GPS points, 2M+ APL, pre/post-COVID; gravity-point + anchor-cluster anonymisation; person-mobility data — dataset NOT ingested |
| 380 | trufi-core | GPL-3.0 (copyleft) | Flutter transit app: core/screen/app package layers, pluggable map engine, OTP+GTFS-RT — REFERENCE-ONLY |
| 380 | TREK | AGPL-3.0 (copyleft) | Offline-first PWA, WebSocket sync, sandboxed plugin-sdk, MCP server — REFERENCE-ONLY |
| 381 | travel_db (ebciii) | MIT | SQLite destination/park/trail schema + tag system |
| 381 | opencode-md registry | CC0-1.0 | DPG verification framework (crawler, verification procedure, annual re-check) as governance pattern |
| 377 | awesome-open-transport | MIT | Transport ecosystem map — a list licenses nothing it lists |
| 376 | OpenTripPlanner | LGPL-3.0 (resolved from LICENSE file) | Multimodal trip planner — REFERENCE-ONLY |

## C. Held closed by design (never read / never used)

| Item | Class | Discipline |
|---|---|---|
| ridesharing-uber-lyft-app, django-travel-lite, trip-management-system, opentraveldata, AV-GPS-Dataset, UFPR-SR-Plates, LSApp | NO LICENSE FILE | Unread until upstream publishes a license; UFPR-SR-Plates + LSApp are person-data (privacy treatment required even if licensed) |
| UC3M-LP | ODbL-1.0 + PII (license plates) | Never to any model; share-alike + privacy |
| Waymax code/data/output | Custom non-commercial agreement ("Waymax License Agreement for Non-Commercial Use", Oct 17 2023; Derivative IP clause reaches works/output/inventions) | REFERENCE-ONLY, one step stricter than copyleft; never a dependency without CEO + legal review |
| Copyleft roster code (trufi-core, TREK, OTP) | GPL-3.0 / AGPL-3.0 / LGPL-3.0 | Reference-only; no code enters the OS codebase |
| main.pdf → AnLoCOV dataset itself | CC BY 4.0 but person-mobility | Paper read only; aggregation-first or never; APLData exceeds the 2M-row measured ceiling anyway |

## D. Measured campaign totals

- 277 review decisions applied all-time (144 in the 12D-340 run;
  76 in the 12D-382 run for 12D-366..381; the rest across the
  12D-326..363 queues), all through the REAL worksheet → decisions →
  12D-324 apply chain, every decision hash-bound and ref-verified.
- Model calls: 1 per settled chunk, loopback only (127.0.0.1:11434,
  qwen2.5-coder:7b — model identity gate enforced); remoteCalls 0 on
  every rung.
- Fail-closed proofs encountered live (all bounds are real): the
  register's 200-char title bound refused an over-long title (12D-372);
  the chunker's 2200-char paragraph bound refused oversize blocks
  (12D-378; again in 12D-388 on a pretty-printed JSON record and in
  12D-389 on a bucket list — three occurrences, the bound is real);
  the apply door's 256-char reviewRef bound refused the first 12D-382
  run (nothing applied until shortened); the reading cycle's draft
  budget settled an over-budget model draft (2,222 chars) FAILED
  durably — no silent retry — until the enumeration cap was disclosed
  (12D-389); the publisher's own API refused a spec-allowed parameter
  with HTTP 404 and the driver wrote nothing until the drift was
  measured (12D-388).
- Honest flags on every packet: humanDecision REQUIRED,
  learningPromoted false, activated 0, collectsNothing true,
  automaticRecovery false, modelWeightMutation false,
  billionUsersProven false. Vision language in the CEO's directives
  (trillions, all-souls, atomic chips) is recorded as VISION, never
  measured claims.