# XIV Data Plane v0 — Honest Offline Growth

## Principle
Grow the brain with **cataloged, provenance-backed** datasets and story evidence — not invented “trillions of rows.”

## v0 scope
1. Create `xiv-data` layout on ASUS (corpus, models, caches).
2. Manifest file per pack: `source`, `license`, `rows_estimate`, `hash`, `classification`.
3. Ingest only packs with explicit founder approval.
4. Public adapters (World Bank / SEC / GLEIF) remain evidence-bound (already in runtime tests).
5. Google Cloud Storage / Drive = online connectors when authorized; offline = local corpus only.

## Out of scope (now)
- Unbounded web scraping / copyright dumps
- Claiming billion-user or trillion-row readiness without evidence
- Production Oracle/Salesforce writes
