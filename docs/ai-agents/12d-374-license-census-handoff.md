# 12D-374 — CEO-batch license census verified (reading rung)

**Story rung:** 12D-374 (verify-before-read — license census for the
12D-373 CEO batch) · **Parents:** 12D-373 · **Policy footprint:**
none added

## What this rung is

Completes the 12D-373 registration batch with a verified license
census (GitHub API SPDX detection + Hugging Face dataset tags + arXiv
identity, fetched 2026-09-19):

- **MIT**: ovikl, awesome-open-transport, travel-db (rustprooflabs),
  travel_db (ebciii).
- **Apache-2.0**: uber/ribs, mobility-database-catalogs, ActivityViz,
  cultural_familiarity_annotations, howtodiv.
- **CC0-1.0**: MobilityData/awesome-transit (the list itself — it
  licenses nothing it lists).
- **GPL-3.0**: trufi-core (copyleft reference-only discipline).
- **AGPL-3.0**: liketrek/TREK (AGPL reference-only discipline).
- **ODbL-1.0**: UC3M-LP — plate dataset, share-alike + PRIVACY-
  SENSITIVE (plate imagery is personal-data-shaped; never to any
  model).
- **CC-BY-4.0**: screen_qa. **CC-BY-SA-4.0**: HF WaxalNLP,
  WikiProfile.
- **NO LICENSE FILE (disclosed-unverified — verify upstream before
  any read)**: ridesharing-uber-lyft-app, django-travel-lite,
  trip-management-system, opentraveldata, AV-GPS-Dataset,
  UFPR-SR-Plates.
- **NOASSERTION**: OpenTripPlanner (LGPL-3.0 historically,
  unverified here, disclosed).

## The CEO's PDFs identified

- **2310.08710v1.pdf = "Waymax: An Accelerated, Data-Driven Simulator
  for Large-Scale Autonomous Driving Research"** (Gulino et al.,
  Waymo/Google). The paper stays a local-only read (never uploaded,
  never redistributed); the code (waymo-research/waymax) is
  separately licensed — code license ≠ paper license.
- **main.pdf: NOT identified** — offline identity check BEFORE any
  read; never read blind into the OS.

## Measured

- License census read through the REAL 12D-276 register + REAL
  12D-283 supervised cycle: 2 chunks → 2 drafts AWAITING_REVIEW,
  modelCalls 2, remoteCalls 0 (loopback Ollama only).
- Snapshot (scratch): `.xiv-runtime/reading-sources-12d-374/ceo-batch-license-census.md`
  · driver: `.xiv-runtime/reading-driver-12d-374.ts` (never
  committed).

## Next candidates

1. Approval rung for the 12D-366..374 drafts (10 AWAITING_REVIEW,
   CEO-gated — NOT covered by the apply run's recorded approvals).
2. Per-source reading rungs for the verified-licensed repos
   (Apache/MIT/CC-BY first; AGPL/GPL reference-only; ODbL bounded).
3. Offline-only Waymax-paper reading rung (local PDF, never
   uploaded); main.pdf identity check.
4. CEO-gated multi-MODEL rung; bounded CFPB structured-field
   extraction rung.