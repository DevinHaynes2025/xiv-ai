# 12D-377 — CEO batch reads 3: travel-db + awesome-open-transport + ScreenQA + HowToDIV + cultural_familiarity + WaxalNLP + WikiProfile (reading rung)

**Story rung:** 12D-377 (verify-then-read — CEO-batch reads 3)
· **Parents:** 12D-376 · **Policy footprint:** none added

## What this rung is

Seven more CEO-batch sources read through the supervised cycle, each
license verified BEFORE read from the publisher's own page:

- **rustprooflabs/travel-db (MIT)** — Postgres+PostGIS travel/GPS
  tracking schema: `trip` → trip steps (per-step time frame + travel
  mode) → `travel.trip_step` (line geometry) / `travel.trip_point` /
  `travel.trip_point_detail` view; `staging` schema + Bad Elf GNSS
  loader; duplicate-cleanup quality table; sqitch deploy. Reference
  read, no code copy.
- **pomodoren/awesome-open-transport (MIT)** — curated transport
  ecosystem map: open data standards (GTFS/GTFS-RT/NeTEx/MDS/GBFS/
  GMNS), OSM + OSGeo ecosystems (QGIS/GDAL/PostGIS/pgRouting),
  movement analytics (OSRM/Valhalla/OTP/SUMO), infrastructure tools,
  transport-AI section. A LIST LICENSES NOTHING IT LISTS — recorded
  in the register licenseNote; every listed item needs its own
  license verification before any read.
- **google-research-datasets/screen_qa (CC-BY-4.0, page verbatim
  "Dataset is licensed under CC BY 4.0")** — mobile screenshot QA
  benchmark: ~86K human-annotated QA pairs over ~35K Rico
  screenshots; ScreenQA (full answers + UI bounding boxes),
  ScreenQA Short, ComplexQA (11,781 counting/arithmetic/comparison
  pairs). Attribution-required, not share-alike.
- **google/howtodiv (DUAL: Apache-2.0 code + CC-BY-4.0 data, both
  verbatim on the page)** — egocentric instruction videos → two-
  person task-assistance dialogues; 507 conversations, 6,636 QA
  pairs, 24h video, 9 tasks. First code≠data split in the batch —
  both sides recorded. EgoPER/NIV sources governed by their own
  licenses.
- **google-research-datasets/cultural_familiarity_annotations
  (Apache-2.0)** — ACL 2025 "Towards Geo-Culturally Grounded LLM
  Generations" data: 10 countries, Gemini-1.5-Flash text, 0–4 human
  cultural-familiarity ratings by in-country annotators.
- **google/WaxalNLP (CC-BY-SA-4.0 / CC-BY-4.0 PER PROVIDER)** —
  African speech corpus card read ONLY (zero rows/audio): ~19 ASR
  languages / 1,250 h, 17 TTS languages / 180+ h, 3,378,718 rows /
  821 GB. Licenses vary by provider (Makerere CC-BY-SA-4.0, U Ghana
  CC-BY-4.0, Digital Umuganda CC-BY-SA 4.0); card verbatim: "Please
  check the license for the specific languages you are using" —
  per-language check is a hard gate before any per-language use.
- **google/WikiProfile (CC-BY-SA-4.0, card verbatim "Required due to
  Wikipedia content source")** — factual knowledge benchmark: 2,150
  Wikipedia facts × 10 questions = 21,500 instances; completion/
  closed-book-QA/multiple-choice. Share-alike applies to dataset
  derivatives.

## Measured

- 7 sources registered + read through the REAL 12D-276 register +
  REAL 12D-283 supervised cycle: 35 chunks → 35 drafts
  AWAITING_REVIEW, modelCalls 35, remoteCalls 0 (loopback Ollama
  only). No refusals; every source fully chunked (remainingReady 0).
- Snapshot (scratch):
  `.xiv-runtime/reading-sources-12d-377/ceo-batch-3.md` · driver:
  `.xiv-runtime/reading-driver-12d-377.ts` (never committed).

## Next candidates

1. Approval rung for the 12D-366..377 drafts (53 AWAITING_REVIEW,
   CEO-gated — 18 from 366..376 + 35 from this rung).
2. Remaining verified reads: the 6 no-license repos stay unread
   pending upstream license verification; copyleft repos
   (trufi-core GPL-3.0, TREK AGPL-3.0, OTP LGPL-3.0) reference-only;
   UC3M-LP ODbL + PII stays never-to-model.
3. Offline-only Waymax-paper reading rung; main.pdf identity check.
4. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung.