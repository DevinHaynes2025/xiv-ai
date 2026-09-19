# Verified Reading Ledger — XIV AI OS reading campaign 12D-366..382 (approved 2026-09-19) + bounded follow-ons 12D-388..443

**Story rung:** 12D-383 (knowledge-base rung — the approved campaign,
committed as the OS's reference ledger); 12D-390 (ledger touch — the
measured `format=json` drift + the bounded 12D-388/389 rungs)
· **Parents:** 12D-382 · **Policy footprint:** none added

Every row below is sourced from committed handoffs and the drivers'
measured outputs. Review provenance: 76 decisions applied through the
REAL 12D-324 apply door under the CEO's recorded approval "go ahead
and run the apply driver for the new drafts" (2026-09-19; 12D-382);
campaign all-time 296 applied decisions (see Section D). Every source was
license-verified BEFORE read, through the REAL 12D-276 register +
12D-283 supervised cycle, loopback qwen2.5-coder:7b only
(remoteCalls 0 everywhere), drafts stopped before review until the
CEO-gated approvals landed. Honest flags pinned throughout; 2,000,000
rows/database is the ONLY measured ceiling.

**12D-388/389 status:** the two bounded follow-on rungs read the LIVE
CFPB publisher surface (25-record structured-field sample; size=0
facet census) — their 14 drafts settle AWAITING_REVIEW and are
CEO-gated: NO review decision is applied without the CEO's recorded
approval. **12D-391/392 status:** the same governance for the World
Bank bounded reads. The 12D-385/386 multi-MODEL failover rungs
(declared local fallback qwen2.5:3b beside the pinned primary
qwen2.5-coder:7b) are brain-infrastructure, not reading sources —
recorded in their own handoffs. **12D-397..405 status:** the declared
failover became OPERATIONAL (CLI flag --declaredFailover, suite-pinned
adapter) and ran its first REAL campaign reads through the CLI door
(12D-401, 403, 404) — the FTA's National Transit Database joined the
verified surfaces (CEO mobility direction). All 12 drafts from
398/401/403/404 were applied under the CEO's recorded blanket-trust
approval (12D-405, verbatim ref); the apply door then REFUSED a second
invocation ("the decisions file is empty — there is nothing the human
decided") — idempotency measured. **12D-407..411 status:** the FTA
surface gained its GTFS weblinks index (407) and the campaign opened
the GTFS Schedule STANDARD itself at its publisher gtfs.org (409,
chars 0..6000; 411, chars 6000..12000 — the transit-brain
prerequisite, CC BY 3.0 content / Apache 2.0 code samples verified
verbatim from gtfs.org/about fresh every rung, a drift guard added at
411 against the 140,905-char strip measure). The 407/408 and 409/410
drafts were applied under the same recorded blanket approval (verbatim
refs; 12D-408, 12D-410). **12D-413..420 status:** the campaign drilled
on three fronts — GTFS slice 3 (413), the NTD Major Safety and Security
Events dataset (415: TWO live driver-bug proofs, the /date/i regex
trap and the 3,553-char wide-row packing refusal, both fixed with the
bounds intact), and World Bank rural population (416: the first terms
URL 404'd and the driver refused BEFORE any read; the driver's own
envelope bug was caught by its own refusal) — all 25 drafts applied
under the recorded blanket approval (12D-420, verbatim ref).
**12D-421..423 status:** the FRA-regulated commuter-rail non-major
events dataset joined the surface (421, date column measured
start_date), GTFS slice 4 read (422, drift guard holds), and all 11
drafts applied under the same recorded approval (423, verbatim ref).
**12D-424..426 status:** GTFS slice 5 read (424, drift guard holds —
30,000 of 140,905 chars across five rungs); World Bank urban
population read (425: the first indicator code was not a code — the
API returned total 0 and the driver's no-rows guard refused before
anything was written; the correct SP.URB.TOTL.IN.ZS measured 5 rows);
all 5 drafts applied under the same recorded approval (426, verbatim
ref). **12D-427..429 status:** GTFS slice 6 read (427 — 36,000 of
140,905 chars across six rungs); World Bank air-passengers read (428:
the first indicator code IS.AIR.PSGR.P1 is INVALID — the API answered
"Invalid value" and the driver's no-rows guard refused before anything
was written; the valid IS.AIR.PSGR measured 5 rows); all 5 drafts
applied under the same recorded approval (429, verbatim ref).
**12D-430..432 status:** GTFS slice 7 read (430 — 42,000 of 140,905
chars across seven rungs); World Bank rail-lines read (431, the
indicator code probed valid FIRST this time — the 425/428 lesson
applied); all 5 drafts applied under the same recorded approval (432,
verbatim ref). **12D-433..435 status:** GTFS slice 8 read (433 —
48,000 of 140,905 chars across eight rungs, drift guard holding);
World Bank logistics-performance read (434, code probed valid first —
three candidate CO₂/shipping codes EN.CO2.TRAN.ZG, EN.CO2.TRAN.MT.ZS,
IS.SHP.GNW.P.TL all probed INVALID live before any read; valid
LP.LPI.OVRL.XQ measured 5 rows); all 5 drafts applied under the same
recorded approval (435, verbatim ref). **12D-436..438 status:** GTFS
slice 9 read (436 — 54,000 of 140,905 chars across nine rungs, drift
guard holding); World Bank container-port read (437, probe-first
applied — three candidate codes probed valid live before any read;
valid IS.SHP.GOOD.TU measured 5 rows); all 5 drafts applied under the
same recorded approval (438, verbatim ref). **12D-439..441 status:**
GTFS slice 10 read (439 — 60,000 of 140,905 chars across ten rungs,
drift guard holding); World Bank rail-passengers read (440, code
probed valid first; IS.RRS.PASG.KM measured 5 rows); all 5 drafts
applied under the same recorded approval (441, verbatim ref).
**12D-442..444 status:** GTFS slice 11 read (442 — 66,000 of 140,905
chars across eleven rungs, drift guard holding); World Bank
LPI-infrastructure read (443, LP.LPI.INFR.XQ measured 5 rows); all 5
drafts applied under the same recorded approval (444, verbatim ref).

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
| 391 | World Bank Open Data (LIVE, bounded) | CC BY 4.0 re-verified VERBATIM from the publisher's Summary Terms of Use page by the driver BEFORE any read ("Unless indicated otherwise… Creative Commons Attribution 4.0 International License…"); binding mediation/arbitration addition noted; attribution duty recorded: reuse must attribute "World Bank Open Data, CC BY 4.0"; bounded sample SP.POP.TOTL USA × 5 years (envelope total 66, lastupdated 2026-07-13) |
| 392 | World Bank Open Data (LIVE, bounded multi-country) | THE LICENSE GATE IS NEVER INHERITED, ALWAYS RE-MEASURED — the 392 driver re-fetched the terms page fresh and refused unless CC BY 4.0 verbatim (license discipline is a property of each read, not of the rung that first did it); bounded sample NY.GDP.MKTP.CD × {USA, ECU, MEX} × 3 years = 9 rows |
| 394 | data.gov per-dataset record (SSA Annual Statistical Supplement series) + SSA index | CC0 1.0 + public verified VERBATIM from the record itself (the record displays the license as its canonical URL — a grep for the literal "CC0" misses it); CKAN APIs 404 across three paths (drift from the 369-era surface, disclosed); SSA landing 403 honored first (license ≠ access), then the driver REFUSED when SSA became accessible mid-run and re-planned EXPLICITLY (index page only, 40 edition links, no crawl/PDFs/downloads) |
| 398 | World Bank Open Data (LIVE, bounded life-expectancy) | License gate NEVER INHERITED, ALWAYS RE-MEASURED (4th fresh verbatim measure); SP.DYN.LE00.IN (life expectancy at birth) × {NGA, ZAF, ETH, KEN, EGY} × mrv=1 = 5 rows; SSA probed FIRST and still 403 (edition index AND the index that served in 394) — publisher boundary honored, rung pivoted honestly |
| 401 | World Bank Open Data (LIVE, bounded internet-use, through the CLI DOOR) | FIRST campaign read through the operator CLI door with --declaredFailover true (12D-397/400 machinery exercised in a campaign); IT.NET.USER.ZS (individuals using the internet, % of population) × the same 5 countries × mrv=1 = 5 rows; license gate re-measured fresh (5th); standing loop measured honestly — one CLI invocation reads ONE chunk, the command re-runs until census READY 0; drafts settled by the pinned primary (declared fallback ordered, never preferred) |
| 403 | FTA National Transit Database — Facility Inventory (LIVE, Socrata) | License verified VERBATIM from the dataset's OWN Socrata metadata BEFORE any read ("Public Domain U.S. Government", termsLink usa.gov/government-works, attribution "Federal Transit Administration") — the 12D-394 per-dataset discipline on a new publisher; DISCLOSED: the linked usa.gov page is a JS shell (no operative sentence server-rendered; stage-2 verbatim impossible; the driver REFUSED on that gate before the disclosure was written; posture verified at 369); data.gov search pages are JS shells (CKAN APIs 404 from 394); bounded 10 rows |
| 404 | FTA NTD — Complete Monthly Ridership (LIVE, bounded) | Second rung on the surface — gates never inherited: the per-dataset metadata license re-measured verbatim BEFORE read; the usa.gov stage-2 JS-shell limitation re-measured + disclosed again; bounded 10 MOST-RECENT agency/month rows ($order=date desc; latest measured month 2026-07-01); UPT/VOMS/VRH/VRM glossary recorded |
| 407 | FTA NTD — GTFS Weblinks (LIVE, Socrata) | Third rung — license "Public Domain U.S. Government" verbatim from the dataset's OWN metadata BEFORE read (re-measured, never inherited); usa.gov JS-shell disclosed 3rd time; NEW SCOPE BOUNDARY: the public-domain declaration covers the INDEX of agency GTFS feed URLs, not the agency feeds it links (MobilityData 12D-375 lesson re-applied — per-feed provider terms govern); bounded 10 rows |
| 409 | GTFS Schedule Reference — gtfs.org (publisher MobilityData) | LICENSE verified VERBATIM from gtfs.org/about BEFORE any read: "Except as otherwise noted, the content of this site is licensed under the Creative Commons Attribution 3.0 License, and code samples are licensed under the Apache 2.0 License" (CC BY 3.0 content / Apache 2.0 code; attribution GTFS/MobilityData); the gtfs-spec repo URL 404'd first — the about page is the operative surface; reference strips to 140,905 chars (measured; JS-shell guard refuses < 2,000); THIS rung read chars 0..6000 (disclosed cap); source class PUBLISHED_STANDARD |
| 411 | GTFS Schedule Reference — second slice (chars 6000..12000, file-definitions opening) | License gate RE-MEASURED FRESH (never inherited — 6th verbatim measure of a campaign surface); NEW DRIFT GUARD: the driver refuses if the strip length stops matching the 12D-409 measure (140,905) without an explicit re-plan — measured identical; bounded slice read through the CLI door with --declaredFailover true |
| 413 | GTFS Schedule Reference — third slice (chars 12000..18000) | Drift guard holds (140,905 identical); license gate re-measured fresh (7th); 2 drafts settled by the pinned primary |
| 415 | FTA NTD — Major Safety and Security Events (LIVE, Socrata) | License "Public Domain U.S. Government" verbatim from the dataset's OWN metadata BEFORE read; TWO live driver-bug proofs caught by the REAL bounds: (1) the /date/i regex matched "consolidated_mode_name" — date columns now require "date" as a whole underscore segment (measured: incident_date); (2) a 3,553-char wide row refused the 1,900 packing bound — wide rows split into labeled field-line parts (longest block 1,813); PII caution disclosed; 10 most-recent rows → 22 drafts |
| 416 | World Bank Open Data (LIVE, bounded rural population) | The FIRST terms URL 404'd — refused BEFORE any read; the proven summary-terms surface adopted, CC BY 4.0 verified verbatim fresh (8th measure); the driver's own envelope-indexing bug caught by its own "no rows" refusal; SP.RUR.TOTL.ZS × {NGA, ZAF, ETH, KEN, EGY} × mrv=1 = 5 rows |
| 421 | FTA NTD — Non-Major Safety and Security Events, FRA Commuter Rail Only (LIVE, Socrata) | Fifth FTA rung; license "Public Domain U.S. Government" verbatim from the dataset's OWN metadata BEFORE read; the 415 whole-segment date rule held (measured start_date — proves the fix); 10 most-recent rows → 7 drafts; non-major events (lower-severity reporting) disclosed as scope |
| 422 | GTFS Schedule Reference — fourth slice (chars 18000..24000) | Drift guard holds (140,905 identical); license gate re-measured fresh (9th); 4 drafts; 24,000 of 140,905 chars read across four rungs |
| 424 | GTFS Schedule Reference — fifth slice (chars 24000..30000) | Drift guard holds (140,905 identical); license gate re-measured fresh; 4 drafts; 30,000 of 140,905 chars across five rungs |
| 425 | World Bank Open Data (LIVE, bounded urban population) | License gate re-measured fresh (CC BY 4.0 verbatim, 9th terms measure); ONE live fail-closed proof: the first indicator code (SP.URB.TOTL.ZS) is not a code — the API returned total 0 and the driver's no-rows guard refused before anything was written; the correct SP.URB.TOTL.IN.ZS measured 5 rows |
| 427 | GTFS Schedule Reference — sixth slice (chars 30000..36000) | Drift guard holds (140,905 identical); license gate re-measured fresh; 4 drafts; 36,000 of 140,905 chars across six rungs |
| 428 | World Bank Open Data (LIVE, bounded air passengers) | License gate re-measured fresh (10th terms measure); ONE live fail-closed proof: the first indicator code (IS.AIR.PSGR.P1) is INVALID — the API answered "Invalid value" and the driver refused before writing; the valid IS.AIR.PSGR (passengers carried) measured 5 rows |
| 430 | GTFS Schedule Reference — seventh slice (chars 36000..42000) | Drift guard holds (140,905 identical); license gate re-measured fresh; 4 drafts; 42,000 of 140,905 chars across seven rungs |
| 431 | World Bank Open Data (LIVE, bounded rail lines) | License gate re-measured fresh (11th terms measure); the indicator code (IS.RRS.TOTL.KM) probed valid FIRST this time — the 425/428 lesson applied; 5 rows |
| 433 | GTFS Schedule Reference — eighth slice (chars 42000..48000) | Drift guard holds (140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim); 4 drafts; 48,000 of 140,905 chars across eight rungs |
| 434 | World Bank Open Data (LIVE, bounded logistics performance) | License gate re-measured fresh (12th terms measure); the probe-first lesson applied BEFORE the driver was derived — three candidate codes (EN.CO2.TRAN.ZG, EN.CO2.TRAN.MT.ZS, IS.SHP.GNW.P.TL) all probed INVALID live before any read; the valid LP.LPI.OVRL.XQ (logistics performance index overall, 1=low to 5=high) measured 5 rows |
| 436 | GTFS Schedule Reference — ninth slice (chars 48000..54000) | Drift guard holds (140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim); 4 drafts; 54,000 of 140,905 chars across nine rungs |
| 437 | World Bank Open Data (LIVE, bounded container port traffic) | License gate re-measured fresh (13th terms measure); probe-first applied — three candidate codes (IS.SHP.GOOD.TU, LP.LPI.INFR.XQ, IS.RRS.PASG.KM) all probed valid live before any read; the distinct ports/shipping surface IS.SHP.GOOD.TU (TEU) measured 5 rows |
| 439 | GTFS Schedule Reference — tenth slice (chars 54000..60000) | Drift guard holds (140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim); 4 drafts; 60,000 of 140,905 chars across ten rungs |
| 440 | World Bank Open Data (LIVE, bounded railway passengers carried) | License gate re-measured fresh (14th terms measure); probe-first applied — IS.RRS.PASG.KM probed valid live before any read; 5 rows (null values disclosed where the publisher reports none) |
| 442 | GTFS Schedule Reference — eleventh slice (chars 60000..66000) | Drift guard holds (140,905 identical); license gate re-measured fresh (CC BY 3.0 + Apache 2.0 verbatim); 4 drafts; 66,000 of 140,905 chars across eleven rungs |
| 443 | World Bank Open Data (LIVE, bounded LPI infrastructure quality) | License gate re-measured fresh (15th terms measure); LP.LPI.INFR.XQ probed valid live in the 437 batch; 5 rows |

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

- 387 review decisions applied all-time (144 in the 12D-340 run;
  76 in the 12D-382 run for 12D-366..381; 19 in the 12D-395 run for
  12D-388/389/391/394; 12 in the 12D-405 run for 12D-398/401/403/404;
  4 in the 12D-408 run for 12D-407; 2 in the 12D-410 run for 12D-409;
  2 in the 12D-412 run for 12D-411; 25 in the 12D-420 run for
  12D-413/415/416; 11 in the 12D-423 run for 12D-421/422; 5 in the
  12D-426 run for 12D-424/425; 5 in the 12D-429 run for 12D-427/428;
  5 in the 12D-432 run for 12D-430/431; 5 in the 12D-435 run for
  12D-433/434; 5 in the 12D-438 run for 12D-436/437; 5 in the
  12D-441 run for 12D-439/440; 5 in the 12D-444 run for 12D-442/443 —
  all under
  the CEO's recorded blanket approval
  "you dont have to keep asking for my approval, i trust my team",
  2026-09-19c, quoted verbatim in every reviewRef; the rest across the
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