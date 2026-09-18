# 12D-346 — directive-#7 verified reads, physics batch 2: DarkART, charon, ldmx-sw

**Story rung:** 12D-346 (operational rung over committed doors — the
12D-341/342/343/345 read pattern; no code changed) · **Parents:**
CEO directive #7 / 12D-276 / 12D-283 / 12D-322 · **Policy
footprint:** none added

## What this rung is

Three directive-#7 physics repos, all licenses verified BEFORE read
(all three read):

- **temken/DarkART** — READ (MIT verified: badge + README
  statement). Dark Atomic Response Tabulator: C++ computation and
  tabulation of atomic response functions for ionization via
  dark-matter-electron scatterings (sub-GeV, four response
  functions, OpenMP-parallel). Standalone tool over the external
  libphysica library (fetched and pinned by CMake); per-run results/
  sub-folder named by the run ID from its config.
- **icecube/charon** — READ (LGPL-3.0 verified BEFORE read by
  fetching the LICENSE file itself; DISCREPANCY DISCLOSED: the
  README's MIT badge contradicts the LICENSE file — LICENSE file +
  sidebar agree and govern). Dark-matter neutrino-flux package for
  IceCube indirect searches: PYTHIA8.2 production fluxes with
  electroweak corrections, propagation tables, DM capture, J-factors,
  secluded sector with long-lived mediator.
- **LDMX-Software/ldmx-sw** — READ (GPL-3.0 verified: sidebar +
  License-GPLv3 badge + LICENSE file at repo root, consistent).
  Light Dark Matter eXperiment simulation and reconstruction
  framework: Geant4-based C++, ~18 named modules (SimCore, Recon,
  Ecal, Hcal, Trigger, DQM…), pinned container runtime
  (ldmx/pro:v4.7.1 via denv), using-vs-developing split.

## Measured (scratch register + queue under `.xiv-runtime/reading-12d-346/`, never committed)

- 3 registered (OPEN_SOURCE_REPO, https, per-source licenseNote),
  **4 chunks read** (DarkART 1; charon 2, with the REAL 12D-287
  continuation gate exercised on chunk-2; ldmx-sw 1) = **4 counted
  loopback model calls** (qwen2.5-coder:7b at 127.0.0.1:11434),
  remoteCalls 0, all 4 drafts AWAITING_REVIEW (draftChars
  660/638/911/634 measured), stopped before review.
- Slate: 4 of 4, 0 redactions, digest `8da4c100f5ec…`.
- Live queue + earlier scratch queues unchanged.

## Reading notes (the discipline, mirrored)

- **DarkART**: per-run results/ sub-folders named by the run ID from
  the config = run-provenance-by-construction (queue-as-truth
  shape); standalone tool over an external pinned library =
  component/door split with build-time provenance.
- **charon**: the license-badge discrepancy is exactly why the
  license-before-read rule fetches the LICENSE FILE ITSELF — badges
  disagree, files govern; a mass-threshold rule (±500 GeV flux
  tables) written into the pipeline is explicit boundary handling;
  external physics tables are downloaded data with named provenance.
- **ldmx-sw**: the container IS the fixed environment — users and
  developers run the same pinned image; ~18 bounded modules = the
  door-split at detector scale; using-vs-developing mirrors our
  review gates (reading and running are different privileges than
  changing).

## What this is NOT

- NOT any code reuse from GPL-3.0 or LGPL-3.0 sources (reference
  reading only, licenses named), NOT any quantum claim
  (CLASSICAL_SIMULATION_ONLY — all classical physics computation),
  NOT any model-weight mutation or learning promotion, NOT any
  review decision (CEO-gated), NOT any scanning.

## Next candidates

1. 12D-340 apply execution (classifier-gated; per-queue commands
   prepared for the CEO's own execution).
2. Directive-#7 reading backlog (verify licenses first: LDCS,
   DDCalc done, earthspecies repos, email/home-automation lists,
   drone batch).
3. XIV AI Media design rung; catalog/capacity re-drill design rung
   (both CEO-gated).